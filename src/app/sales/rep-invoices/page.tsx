

"use client";

import React, { useState, useMemo } from 'react';
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, MoreHorizontal, FileText, CheckCircle, Trash2 } from "lucide-react";
import useFirebase from "@/hooks/use-firebase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { usePermissions } from '@/contexts/permissions-context';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface SaleInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  salesRepId: string;
  total: number;
  items: any[];
  status?: 'pending' | 'approved';
  paidAmount?: number;
  paidToAccountId?: string;
}

interface User {
  id: string;
  name: string;
  isSalesRep?: boolean;
}

export default function RepInvoicesPage() {
  const { data: invoices, loading: loadingInvoices, update, remove } = useFirebase<SaleInvoice>("salesInvoices");
  const { add: addCustomerPayment, getNextId } = useFirebase('customerPayments');
  const { data: users, loading: loadingUsers } = useFirebase<User>("users");
  const [filters, setFilters] = useState({
    salesRepId: "all",
    fromDate: "",
    toDate: "",
  });

  const { can } = usePermissions();
  const { toast } = useToast();
  const loading = loadingInvoices || loadingUsers;
  const salesReps = users.filter(u => u.isSalesRep);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(invoice => invoice.status === 'pending') // Only show pending invoices
      .filter(invoice => {
        const invoiceDate = new Date(invoice.date);
        const from = filters.fromDate ? new Date(filters.fromDate) : null;
        const to = filters.toDate ? new Date(filters.toDate) : null;

        if (from && invoiceDate < from) return false;
        if (to && invoiceDate > to) return false;
        if (filters.salesRepId !== 'all' && invoice.salesRepId !== filters.salesRepId) return false;
        
        return true;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, filters]);

  const handleApprove = async (invoice: SaleInvoice) => {
    if (!can('approve', 'sales_repInvoices')) {
      toast({ variant: 'destructive', title: 'غير مصرح به' });
      return;
    }
    try {
      // Step 1: Approve the invoice
      await update(invoice.id, { status: 'approved' });

      // Step 2: If there's a paid amount, create a customer payment record
      if (invoice.paidAmount && invoice.paidAmount > 0 && invoice.paidToAccountId) {
          await addCustomerPayment({
              date: new Date().toISOString(),
              amount: invoice.paidAmount,
              customerId: invoice.customerId,
              paidToAccountId: invoice.paidToAccountId,
              notes: `دفعة من فاتورة بيع رقم ${invoice.invoiceNumber}`,
              receiptNumber: `س-ع-${await getNextId('customerPayment')}`
          });
      }

      toast({ title: 'تم الاعتماد بنجاح', description: 'تم اعتماد الفاتورة وتحديث الحسابات.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل اعتماد الفاتورة.' });
    }
  };

  const handleDelete = async (invoiceId: string) => {
     if (!can('delete', 'sales_repInvoices')) {
      toast({ variant: 'destructive', title: 'غير مصرح به' });
      return;
    }
    if (confirm('هل أنت متأكد من حذف هذه الفاتورة المعلقة؟')) {
       try {
        await remove(invoiceId);
        toast({ title: 'تم الحذف بنجاح' });
      } catch (error) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف الفاتورة.' });
      }
    }
  }

  const getRepName = (repId: string) => users.find(u => u.id === repId)?.name || 'غير معروف';

  return (
    <>
      <PageHeader title="اعتماد فواتير المناديب" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
            <CardHeader>
                <CardTitle>فلاتر البحث</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                     <div className="space-y-2">
                        <Label>مندوب المبيعات</Label>
                        <Select value={filters.salesRepId} onValueChange={(v) => handleFilterChange("salesRepId", v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر المندوب" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">كل المناديب</SelectItem>
                                {salesReps.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label>من تاريخ</Label>
                        <Input type="date" value={filters.fromDate} onChange={(e) => handleFilterChange("fromDate", e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label>إلى تاريخ</Label>
                        <Input type="date" value={filters.toDate} onChange={(e) => handleFilterChange("toDate", e.target.value)} />
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الفواتير المعلقة</CardTitle>
            <CardDescription>
              عرض واعتماد الفواتير التي قام المناديب بإنشائها ولم يتم اعتمادها بعد.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="w-full overflow-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الفاتورة</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>المندوب</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">الإجمالي</TableHead>
                      <TableHead className="text-center w-[100px]">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.length > 0 ? (
                      filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono">{invoice.invoiceNumber}</TableCell>
                          <TableCell>{invoice.customerName}</TableCell>
                          <TableCell>{getRepName(invoice.salesRepId)}</TableCell>
                          <TableCell>{new Date(invoice.date).toLocaleDateString('ar-EG')}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-amber-500 text-amber-500">معلقة</Badge>
                          </TableCell>
                          <TableCell className="text-center">{invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-center">
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">قائمة</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                                    {can('approve', 'sales_repInvoices') && (
                                        <DropdownMenuItem onClick={() => handleApprove(invoice)}>
                                            <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                                            اعتماد الفاتورة
                                        </DropdownMenuItem>
                                    )}
                                     {can('delete', 'sales_repInvoices') && (
                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(invoice.id)}>
                                            <Trash2 className="ml-2 h-4 w-4" />
                                            حذف
                                        </DropdownMenuItem>
                                     )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                          لا توجد فواتير معلقة حاليًا.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
