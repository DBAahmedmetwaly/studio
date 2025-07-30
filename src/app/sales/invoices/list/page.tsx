
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
import { PlusCircle, Loader2, MoreHorizontal, FileText, Undo2, Printer } from "lucide-react";
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
import { useData } from '@/contexts/data-provider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { InvoiceTemplate } from '@/components/invoice-template';

interface SaleInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  warehouseId: string;
  total: number;
  paidAmount?: number;
  items: any[];
}
interface Customer { id: string; name: string; }
interface Warehouse { id: string; name: string; }
interface InventoryClosing { id: string; warehouseId: string; closingDate: string; }

export default function SalesInvoicesListPage() {
  const { salesInvoices: invoices, customers, warehouses, inventoryClosings, settings, loading } = useData();
  const router = useRouter();
  
  const [filters, setFilters] = useState({
    customerId: "all",
    warehouseId: "all",
    fromDate: "",
    toDate: "",
  });

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const lastClosingDates = useMemo(() => {
    const dates = new Map<string, Date>();
    warehouses.forEach((wh: Warehouse) => {
        const closings = inventoryClosings.filter((c: InventoryClosing) => c.warehouseId === wh.id);
        if (closings.length > 0) {
            const lastDate = new Date(Math.max(...closings.map(c => new Date(c.closingDate).getTime())));
            dates.set(wh.id, lastDate);
        }
    });
    return dates;
  }, [warehouses, inventoryClosings]);

  const filteredInvoices = useMemo(() => {
    return invoices
      .map((invoice: SaleInvoice) => {
        const lastClosingDate = lastClosingDates.get(invoice.warehouseId);
        const isLocked = lastClosingDate && new Date(invoice.date) <= lastClosingDate;
        return { ...invoice, isLocked };
      })
      .filter((invoice: any) => {
        const invoiceDate = new Date(invoice.date);
        const from = filters.fromDate ? new Date(filters.fromDate) : null;
        const to = filters.toDate ? new Date(filters.toDate) : null;

        if (from && invoiceDate < from) return false;
        if (to && invoiceDate > to) return false;
        if (filters.customerId !== 'all' && invoice.customerId !== filters.customerId) return false;
        if (filters.warehouseId !== 'all' && invoice.warehouseId !== filters.warehouseId) return false;
        
        return true;
      }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, filters, lastClosingDates]);

  const companySettings = useMemo(() => settings.find((s:any) => s.id === 'main')?.general, [settings]);

  const handlePrint = () => {
    setTimeout(() => window.print(), 100);
  };

  return (
    <>
      <PageHeader title="سجل فواتير البيع">
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
                                {customers.map((c:any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
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
                                {warehouses.map((w:any) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
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
                      <TableHead className="text-center">الإجمالي</TableHead>
                      <TableHead className="text-center">المدفوع</TableHead>
                      <TableHead className="text-center">المتبقي</TableHead>
                      <TableHead className="text-center w-[100px]">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.length > 0 ? (
                      filteredInvoices.map((invoice:any) => {
                        const paid = invoice.paidAmount || 0;
                        const remaining = invoice.total - paid;
                        const customer = customers.find((c:any) => c.id === invoice.customerId);
                        return (
                           <Dialog key={invoice.id}>
                            <TableRow className={invoice.isLocked ? 'bg-muted/30' : ''}>
                            <TableCell className="font-mono">{invoice.invoiceNumber}</TableCell>
                            <TableCell>{invoice.customerName}</TableCell>
                            <TableCell>{new Date(invoice.date).toLocaleDateString('ar-EG')}</TableCell>
                            <TableCell className="text-center font-semibold">{invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                            <TableCell className="text-center text-green-600">{paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                            <TableCell className={`text-center font-bold ${remaining > 0 ? 'text-destructive' : ''}`}>{remaining.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
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
                                        <DialogTrigger asChild>
                                            <DropdownMenuItem>عرض / طباعة</DropdownMenuItem>
                                        </DialogTrigger>
                                        <DropdownMenuItem onClick={() => router.push(`/sales/returns/new?invoiceId=${invoice.id}`)} disabled={invoice.isLocked}>
                                            <Undo2 className="ml-2 h-4 w-4" />
                                            مرتجع
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                            </TableRow>
                             <DialogContent className="max-w-4xl p-0">
                                <div className="p-4 bg-muted/40">
                                    <InvoiceTemplate invoice={invoice} company={companySettings} customer={customer} />
                                </div>
                                <div className="p-4 border-t flex justify-end">
                                    <Button onClick={handlePrint}><Printer className="ml-2 h-4 w-4" />طباعة</Button>
                                </div>
                            </DialogContent>
                           </Dialog>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                          لا توجد فواتير تطابق الفلاتر المحددة.
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
