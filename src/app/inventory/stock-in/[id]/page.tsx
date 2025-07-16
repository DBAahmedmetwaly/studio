
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useFirebase from '@/hooks/use-firebase';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Printer } from 'lucide-react';

interface StockInRecord {
  id: string;
  receiptNumber: string;
  date: string;
  warehouseId: string;
  reason: string;
  notes?: string;
  items: { id: string; name: string; qty: number; }[];
}

interface Warehouse {
  id: string;
  name: string;
}

export default function StockInDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [record, setRecord] = useState<StockInRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const { data: stockInRecords } = useFirebase<StockInRecord>('stockInRecords');
  const { data: warehouses } = useFirebase<Warehouse>('warehouses');
  
  useEffect(() => {
    if (stockInRecords.length > 0 && id) {
      const foundRecord = stockInRecords.find(r => r.id === id);
      setRecord(foundRecord || null);
      setLoading(false);
    }
  }, [stockInRecords, id]);
  
  const getWarehouseName = (warehouseId: string) => warehouses.find(w => w.id === warehouseId)?.name || 'غير معروف';

  const handlePrint = () => {
    window.print();
  };
  
  if (loading) {
    return <div className="flex flex-1 justify-center items-center"><Loader2 className="h-10 w-10 animate-spin" /></div>;
  }
  
  if (!record) {
    return <div className="flex flex-1 justify-center items-center"><p>لم يتم العثور على الإيصال.</p></div>;
  }

  return (
    <>
      <PageHeader title={`إيصال استلام: ${record.receiptNumber}`}>
        <div className="flex gap-2 no-print">
            <Button onClick={handlePrint} variant="outline">
                <Printer className="ml-2 h-4 w-4" />
                طباعة
            </Button>
             <Button onClick={() => router.back()}>الرجوع</Button>
        </div>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 printable-area">
        <Card>
          <CardHeader>
            <CardTitle>تفاصيل إيصال استلام مخزني</CardTitle>
             <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div>رقم الإيصال: {record.receiptNumber}</div>
                <div>تاريخ الاستلام: {new Date(record.date).toLocaleDateString('ar-EG')}</div>
                <div>المستلم في: {getWarehouseName(record.warehouseId)}</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-auto">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>الصنف</TableHead>
                          <TableHead className="text-center">الكمية المستلمة</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {record.items.map(item => (
                          <TableRow key={item.id}>
                              <TableCell>{item.name}</TableCell>
                              <TableCell className="text-center">{item.qty}</TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
            </div>
            {record.notes && (
                <div className="mt-4 border-t pt-4">
                    <h4 className="font-semibold">ملاحظات:</h4>
                    <p className="text-muted-foreground">{record.notes}</p>
                </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
