
"use client";

import React, { useMemo, useState } from "react";
import PageHeader from "@/components/page-header";
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
import { useData } from "@/contexts/data-provider";
import { Loader2, Truck } from "lucide-react";
import Link from 'next/link';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";


interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  supplierId: string;
  supplierName: string;
  items: { id: string; name: string; qty: number; }[];
}

interface StockInRecord {
  id: string;
  purchaseInvoiceId?: string;
}

interface Supplier {
    id: string;
    name: string;
}

interface Item {
    id: string;
    name: string;
    code?: string;
}

export default function GoodsInTransitPage() {
  const { purchaseInvoices, stockInRecords, suppliers, items: allItems, loading } = useData();
  const [filters, setFilters] = useState({ supplierId: "all", itemId: "", fromDate: "", toDate: "" });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const itemOptions = useMemo(() => {
    return allItems.map((item: Item) => ({
      value: item.id,
      label: `${item.name} (${item.code || item.id.slice(-4)})`
    }));
  }, [allItems]);

  const goodsInTransit = useMemo(() => {
    const receivedInvoiceIds = new Set(
      stockInRecords
        .filter((r: StockInRecord) => r.purchaseInvoiceId)
        .map((r: StockInRecord) => r.purchaseInvoiceId)
    );

    const transitItems: any[] = [];
    
    purchaseInvoices
      .filter((inv: PurchaseInvoice) => {
        if (receivedInvoiceIds.has(inv.id)) return false;
        if (filters.supplierId !== 'all' && inv.supplierId !== filters.supplierId) return false;
        
        const invoiceDate = new Date(inv.date);
        const from = filters.fromDate ? new Date(filters.fromDate) : null;
        const to = filters.toDate ? new Date(filters.toDate) : null;
        if (from && invoiceDate < from) return false;
        if (to && invoiceDate > to) return false;

        return true;
      })
      .forEach((inv: PurchaseInvoice) => {
        inv.items.forEach(item => {
          if (filters.itemId && item.id !== filters.itemId) {
            return;
          }
          transitItems.push({
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            supplierName: inv.supplierName,
            invoiceDate: inv.date,
            itemName: item.name,
            expectedQty: item.qty,
          });
        });
      });
      
    return transitItems.sort((a,b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());
  }, [purchaseInvoices, stockInRecords, filters]);

  return (
    <>
      <PageHeader title="تقرير بضاعة بالطريق" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
            <CardHeader>
                <CardTitle>فلاتر البحث</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                     <div className="space-y-2">
                        <Label>المورد</Label>
                        <Select value={filters.supplierId} onValueChange={(v) => handleFilterChange("supplierId", v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر المورد" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">كل الموردين</SelectItem>
                                {suppliers.map((s:Supplier) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label>الصنف</Label>
                         <Combobox
                            options={itemOptions}
                            value={filters.itemId}
                            onValueChange={(value) => handleFilterChange('itemId', value)}
                            placeholder="اختر صنفًا..."
                            emptyMessage="لم يتم العثور على الصنف."
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
            <CardTitle className="flex items-center gap-2">
                <Truck className="h-6 w-6" />
                البضاعة المشتراة ولم يتم استلامها
            </CardTitle>
            <CardDescription>
              هذا التقرير يعرض جميع الأصناف من فواتير الشراء التي لم يتم عمل إذن استلام مخزني لها بعد.
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
                      <TableHead>فاتورة الشراء</TableHead>
                      <TableHead>المورد</TableHead>
                      <TableHead>الصنف</TableHead>
                      <TableHead className="text-center">الكمية المنتظرة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {goodsInTransit.length > 0 ? (
                      goodsInTransit.map((item, index) => (
                        <TableRow key={`${item.invoiceId}-${index}`}>
                          <TableCell>
                            <Link href={`/purchases/invoices/list`} className="text-primary hover:underline font-mono">
                                {item.invoiceNumber}
                            </Link>
                             <div className="text-xs text-muted-foreground">
                                {new Date(item.invoiceDate).toLocaleDateString('ar-EG')}
                            </div>
                          </TableCell>
                          <TableCell>{item.supplierName}</TableCell>
                          <TableCell className="font-medium">{item.itemName}</TableCell>
                          <TableCell className="text-center font-bold">{item.expectedQty}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center h-24">
                          لا توجد حاليًا أي بضاعة بالطريق تطابق الفلاتر المحددة.
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
