
"use client";

import React from 'react';
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
import { PlusCircle, Loader2, MoreHorizontal, FileText } from "lucide-react";
import useFirebase from "@/hooks/use-firebase";
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StockInRecord {
  id: string;
  receiptNumber: string;
  date: string;
  warehouseId: string;
  reason: string;
  purchaseInvoiceId?: string;
  items: { name: string; qty: number }[];
}

interface Warehouse {
    id: string;
    name: string;
}

export default function StockInListPage() {
  const { data: stockInRecords, loading: loadingStockIn } = useFirebase<StockInRecord>("stockInRecords");
  const { data: warehouses, loading: loadingWarehouses } = useFirebase<Warehouse>("warehouses");
  const router = useRouter();

  const loading = loadingStockIn || loadingWarehouses;

  const getWarehouseName = (warehouseId: string) => {
    return warehouses.find(w => w.id === warehouseId)?.name || 'غير معروف';
  };
  
  const getReasonLabel = (reason: string) => {
      const reasons: { [key: string]: string } = {
          purchase: 'مشتريات',
          opening_stock: 'رصيد افتتاحي',
          transfer_in: 'محول من جهة أخرى',
          other: 'أخرى'
      };
      return reasons[reason] || reason;
  }

  return (
    <>
      <PageHeader title="سجل استلامات المخزون">
        <Button size="sm" className="gap-1" onClick={() => router.push('/inventory/stock-in/new')}>
          <PlusCircle className="h-4 w-4" />
          إضافة إذن استلام
        </Button>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>قائمة إيصالات الاستلام</CardTitle>
            <CardDescription>
              عرض جميع عمليات استلام المخزون التي تمت.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الإيصال</TableHead>
                      <TableHead className="hidden sm:table-cell">التاريخ</TableHead>
                      <TableHead>المخزن</TableHead>
                      <TableHead className="hidden md:table-cell">السبب</TableHead>
                      <TableHead className="text-center w-[100px]">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockInRecords.length > 0 ? (
                      stockInRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-mono">{record.receiptNumber}</TableCell>
                          <TableCell className="hidden sm:table-cell">{new Date(record.date).toLocaleDateString('ar-EG')}</TableCell>
                          <TableCell>{getWarehouseName(record.warehouseId)}</TableCell>
                          <TableCell className="hidden md:table-cell">{getReasonLabel(record.reason)}</TableCell>
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
                                    <DropdownMenuItem onClick={() => router.push(`/inventory/stock-in/${record.id}`)}>
                                        عرض / طباعة
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          لا توجد إيصالات استلام مسجلة.
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
