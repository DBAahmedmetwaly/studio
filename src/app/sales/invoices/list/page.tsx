

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
import { PlusCircle, Loader2, MoreHorizontal, FileText, Undo2 } from "lucide-react";
import useFirebase from "@/hooks/use-firebase";
import { useRouter } from 'next/navigation';
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

interface SaleInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  warehouseId: string;
  total: number;
  items: any[];
}
interface Customer { id: string; name: string; }
interface Warehouse { id: string; name: string; }

export default function SalesInvoicesListPage() {
  const { data: invoices, loading: loadingInvoices } = useFirebase<SaleInvoice>("salesInvoices");
  const { data: customers, loading: loadingCustomers } = useFirebase<Customer>("customers");
  const { data: warehouses, loading: loadingWarehouses } = useFirebase<Warehouse>("warehouses");
  const router = useRouter();
  
  const [filters, setFilters] = useState({
    customerId: "all",
    warehouseId: "all",
    fromDate: "",
    toDate: "",
  });

  const loading = loadingInvoices || loadingCustomers || loadingWarehouses;

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.date);
      const from = filters.fromDate ? new Date(filters.fromDate) : null;
      const to = filters.toDate ? new Date(filters.toDate) : null;

      if (from && invoiceDate < from) return false;
      if (to && invoiceDate > to) return false;
      if (filters.customerId !== 'all' && invoice.customerId !== filters.customerId) return false;
      if (filters.warehouseId !== 'all' && invoice.warehouseId !== filters.warehouseId) return false;
      
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, filters]);

  return (
    <>
      <PageHeader title="فواتير المبيعات">
        <Button size="sm" className="gap-1" onClick={() => router.push('/sales/invoices')}>
          <PlusCircle className="h-4 w-4" />
          إضافة فاتورة جديدة
        </Button>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
            <CardHeader>
                <CardTitle>فلاتر البحث</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                     <div className="space-y-2">
                        <Label>العميل</Label>
                        <Select value={filters.customerId} onValueChange={(v) => handleFilterChange("customerId", v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر العميل" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">كل العملاء</SelectItem>
                                {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label>المخزن</Label>
                        <Select value={filters.warehouseId} onValueChange={(v) => handleFilterChange("warehouseId", v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر المخزن" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">كل المخازن</SelectItem>
                                {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
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
            <CardTitle>قائمة فواتير المبيعات</CardTitle>
            <CardDescription>
              عرض وتعديل جميع فواتير المبيعات الصادرة.
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
                      <TableHead>التاريخ</TableHead>
                      <TableHead>ملاحظات</TableHead>
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
                          <TableCell>{new Date(invoice.date).toLocaleDateString('ar-EG')}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <FileText className="h-4 w-4" />
                              <span>{`تحتوي على ${invoice.items.length} أصناف`}</span>
                            </span>
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
                                    <DropdownMenuItem>
                                        عرض التفاصيل
                                    </DropdownMenuItem>
                                     <DropdownMenuItem>
                                        طباعة
                                    </DropdownMenuItem>
                                     <DropdownMenuItem onClick={() => router.push(`/sales/returns/new?invoiceId=${invoice.id}`)}>
                                        <Undo2 className="ml-2 h-4 w-4" />
                                        مرتجع
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          لا توجد فواتير مسجلة تطابق الفلاتر المحددة.
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
