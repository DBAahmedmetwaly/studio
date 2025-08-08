

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
import { PlusCircle, Loader2, MoreHorizontal, FileText, Undo2, Printer, FileSearch } from "lucide-react";
import useFirebase from "@/hooks/use-firebase";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useData } from '@/contexts/data-provider';
import { Combobox } from '@/components/ui/combobox';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { InvoiceTemplate } from '@/components/invoice-template';


interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  total: number;
  items: any[];
}
interface Supplier { id: string; name: string; }
interface Warehouse { id: string; name: string; }
interface InventoryClosing { id: string; warehouseId: string; closingDate: string; }


export default function PurchaseInvoicesListPage() {
  const { purchaseInvoices: invoices, suppliers, warehouses, inventoryClosings, settings, loading } = useData();
  const router = useRouter();

  const [filters, setFilters] = useState({
    supplierId: "all",
    warehouseId: "all",
    fromDate: "",
    toDate: "",
  });

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const supplierOptions = useMemo(() => ([{value: 'all', label: 'كل الموردين'}, ...suppliers.map((s:any) => ({ value: s.id, label: s.name }))]), [suppliers]);
  const warehouseOptions = useMemo(() => ([{value: 'all', label: 'كل المخازن'}, ...warehouses.map((w:any) => ({ value: w.id, label: w.name }))]), [warehouses]);

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
    return invoices.map(invoice => {
        const lastClosingDate = lastClosingDates.get(invoice.warehouseId);
        const isLocked = lastClosingDate && new Date(invoice.date) <= lastClosingDate;
        return { ...invoice, isLocked };
    })
    .filter((invoice:any) => {
      const invoiceDate = new Date(invoice.date);
      const from = filters.fromDate ? new Date(filters.fromDate) : null;
      const to = filters.toDate ? new Date(filters.toDate) : null;

      if (from && invoiceDate < from) return false;
      if (to && invoiceDate > to) return false;
      if (filters.supplierId !== 'all' && invoice.supplierId !== filters.supplierId) return false;
      if (filters.warehouseId !== 'all' && invoice.warehouseId !== filters.warehouseId) return false;
      
      return true;
    }).sort((a:any, b:any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, filters, lastClosingDates]);

  const companySettings = useMemo(() => settings?.main?.general || {}, [settings]);

  const handlePrint = () => {
    setTimeout(() => window.print(), 100);
  };


  return (
    <>
      <PageHeader title="سجل فواتير الشراء">
        <Button size="sm" className="gap-1" onClick={() => router.push('/purchases/invoices')}>
          <PlusCircle className="h-4 w-4" />
          إضافة فاتورة شراء
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
                        <Label>المورد</Label>
                        <Combobox
                          options={supplierOptions}
                          value={filters.supplierId}
                          onValueChange={(v) => handleFilterChange("supplierId", v)}
                          placeholder="اختر المورد..."
                          emptyMessage="لم يتم العثور على مورد."
                        />
                    </div>
                     <div className="space-y-2">
                        <Label>المخزن</Label>
                        <Combobox
                          options={warehouseOptions}
                          value={filters.warehouseId}
                          onValueChange={(v) => handleFilterChange("warehouseId", v)}
                          placeholder="اختر المخزن..."
                          emptyMessage="لم يتم العثور على مخزن."
                        />
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
            <CardTitle>قائمة فواتير الشراء</CardTitle>
            <CardDescription>
              عرض وتعديل جميع فواتير الشراء المسجلة.
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
                      <TableHead>المورد</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>ملاحظات</TableHead>
                      <TableHead className="text-center">الإجمالي</TableHead>
                      <TableHead className="text-center w-[100px]">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices && filteredInvoices.length > 0 ? (
                      filteredInvoices.map((invoice:any) => {
                        const supplier = suppliers.find((s:any) => s.id === invoice.supplierId);
                        return (
                        <Dialog key={invoice.id}>
                            <TableRow className={invoice.isLocked ? 'bg-muted/30' : ''}>
                                <TableCell className="font-mono">{invoice.invoiceNumber}</TableCell>
                                <TableCell>{invoice.supplierName}</TableCell>
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
                                             <DialogTrigger asChild>
                                                <DropdownMenuItem disabled={invoice.isLocked}>
                                                    عرض / طباعة
                                                </DropdownMenuItem>
                                             </DialogTrigger>
                                            <DropdownMenuItem onClick={() => router.push(`/reports/supplier-statement?supplierId=${invoice.supplierId}&toDate=${invoice.date}`)} disabled={invoice.isLocked}>
                                                <FileSearch className="ml-2 h-4 w-4" />
                                                كشف حساب المورد
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => router.push(`/purchases/returns/new?invoiceId=${invoice.id}`)} disabled={invoice.isLocked}>
                                                <Undo2 className="ml-2 h-4 w-4" />
                                                مرتجع
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                            <DialogContent className="max-w-4xl p-0">
                                <div className="printable-area bg-white text-black">
                                    <InvoiceTemplate invoice={invoice} company={companySettings} customer={supplier} isPurchase={true} />
                                </div>
                                <div className="p-4 border-t flex justify-end no-print">
                                    <Button onClick={handlePrint}><Printer className="ml-2 h-4 w-4" />طباعة</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                      )})
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
