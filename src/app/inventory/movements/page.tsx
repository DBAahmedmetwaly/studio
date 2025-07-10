
"use client";

import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import useFirebase from "@/hooks/use-firebase";
import { Loader2, ArrowUp, ArrowDown, ArrowLeftRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StockInRecord {
  id: string;
  receiptNumber: string;
  date: string;
  warehouseId: string;
  items: { name: string; qty: number }[];
}

interface StockOutRecord {
  id: string;
  receiptNumber: string;
  date: string;
  sourceId: string;
  items: { name: string; qty: number }[];
}

interface StockTransferRecord {
  id: string;
  receiptNumber: string;
  date: string;
  fromSourceId: string;
  toSourceId: string;
  items: { name: string; qty: number }[];
}

interface Warehouse {
    id: string;
    name: string;
}

export default function InventoryMovementsPage() {
  const { data: stockIns, loading: loadingIn } = useFirebase<StockInRecord>("stockInRecords");
  const { data: stockOuts, loading: loadingOut } = useFirebase<StockOutRecord>("stockOutRecords");
  const { data: stockTransfers, loading: loadingTransfers } = useFirebase<StockTransferRecord>("stockTransferRecords");

  const { data: warehouses, loading: loadingWarehouses } = useFirebase<Warehouse>("warehouses");

  const loading = loadingIn || loadingOut || loadingTransfers || loadingWarehouses;

  const getSourceName = (id: string) => {
    const warehouse = warehouses.find(w => w.id === id);
    if (warehouse) return warehouse.name;
    return id;
  };

  const allMovements = [
    ...stockIns.map(r => ({ ...r, type: 'in', typeLabel: 'إدخال' })),
    ...stockOuts.map(r => ({ ...r, type: 'out', typeLabel: 'إخراج' })),
    ...stockTransfers.map(r => ({ ...r, type: 'transfer', typeLabel: 'تحويل' })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


  if (loading) {
    return (
      <div className="flex flex-1 justify-center items-center">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <PageHeader title="حركة المخزون" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>سجل حركات المخزون</CardTitle>
            <CardDescription>
              عرض لجميع عمليات الإدخال والإخراج والتحويل التي تمت في المخازن.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نوع الحركة</TableHead>
                  <TableHead>رقم الإيصال</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>التفاصيل</TableHead>
                  <TableHead>الأصناف</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allMovements.length > 0 ? allMovements.map((move) => (
                  <TableRow key={`${move.type}-${move.id}`}>
                    <TableCell>
                      <Badge variant={
                          move.type === 'in' ? 'default' :
                          move.type === 'out' ? 'destructive' :
                          'secondary'
                      }>
                        {move.type === 'in' && <ArrowDown className="h-3 w-3 -ml-1" />}
                        {move.type === 'out' && <ArrowUp className="h-3 w-3 -ml-1" />}
                        {move.type === 'transfer' && <ArrowLeftRight className="h-3 w-3 -ml-1" />}
                        <span className="mr-1">{move.typeLabel}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{move.receiptNumber}</TableCell>
                    <TableCell>{new Date(move.date).toLocaleDateString('ar-EG')}</TableCell>
                    <TableCell>
                      {move.type === 'in' && `إلى: ${getSourceName(move.warehouseId)}`}
                      {move.type === 'out' && `من: ${getSourceName(move.sourceId)}`}
                      {move.type === 'transfer' && `من: ${getSourceName(move.fromSourceId)} إلى: ${getSourceName(move.toSourceId)}`}
                    </TableCell>
                     <TableCell>
                      {move.items.map((item: any, index: number) => (
                        <div key={index} className="text-xs">
                          {item.name} (الكمية: {item.qty})
                        </div>
                      ))}
                    </TableCell>
                  </TableRow>
                )) : (
                   <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                            لا توجد حركات مخزون مسجلة.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
