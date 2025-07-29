
"use client";

import React, { useMemo } from "react";
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

export default function GoodsInTransitPage() {
  const { purchaseInvoices, stockInRecords, loading } = useData();

  const goodsInTransit = useMemo(() => {
    const receivedInvoiceIds = new Set(
      stockInRecords
        .filter((r: StockInRecord) => r.purchaseInvoiceId)
        .map((r: StockInRecord) => r.purchaseInvoiceId)
    );

    const transitItems: any[] = [];
    
    purchaseInvoices
      .filter((inv: PurchaseInvoice) => !receivedInvoiceIds.has(inv.id))
      .forEach((inv: PurchaseInvoice) => {
        inv.items.forEach(item => {
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
  }, [purchaseInvoices, stockInRecords]);

  return (
    <>
      <PageHeader title="تقرير بضاعة بالطريق" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
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
                          لا توجد حاليًا أي بضاعة بالطريق.
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

