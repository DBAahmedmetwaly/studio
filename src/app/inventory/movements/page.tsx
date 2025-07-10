
"use client";

import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import useFirebase from "@/hooks/use-firebase";
import { Loader2, ArrowUp, ArrowDown, ArrowLeftRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import React, { useState, useMemo } from "react";

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
  const [filters, setFilters] = useState({
    warehouseId: "all",
    type: "all",
    fromDate: "",
    toDate: ""
  });

  const { data: stockIns, loading: loadingIn } = useFirebase<StockInRecord>("stockInRecords");
  const { data: stockOuts, loading: loadingOut } = useFirebase<StockOutRecord>("stockOutRecords");
  const { data: stockTransfers, loading: loadingTransfers } = useFirebase<StockTransferRecord>("stockTransferRecords");
  const { data: warehouses, loading: loadingWarehouses } = useFirebase<Warehouse>("warehouses");

  const loading = loadingIn || loadingOut || loadingTransfers || loadingWarehouses;

  const getSourceName = (id: string) => {
    const warehouse = warehouses.find(w => w.id === id);
    return warehouse ? warehouse.name : id;
  };

  const filteredMovements = useMemo(() => {
    const allMovements = [
      ...stockIns.map(r => ({ ...r, type: 'in', typeLabel: 'إدخال' })),
      ...stockOuts.map(r => ({ ...r, type: 'out', typeLabel: 'إخراج' })),
      ...stockTransfers.map(r => ({ ...r, type: 'transfer', typeLabel: 'تحويل' })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return allMovements.filter(move => {
      const moveDate = new Date(move.date);
      const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
      const toDate = filters.toDate ? new Date(filters.toDate) : null;

      if (fromDate && moveDate < fromDate) return false;
      if (toDate && moveDate > toDate) return false;
      if (filters.type !== 'all' && move.type !== filters.type) return false;
      
      if (filters.warehouseId !== 'all') {
        if (move.type === 'in' && move.warehouseId !== filters.warehouseId) return false;
        if (move.type === 'out' && move.sourceId !== filters.warehouseId) return false;
        if (move.type === 'transfer' && move.fromSourceId !== filters.warehouseId && move.toSourceId !== filters.warehouseId) return false;
      }
      
      return true;
    });
  }, [stockIns, stockOuts, stockTransfers, filters]);


  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({...prev, [key]: value}));
  }

  if (loading && !warehouses.length) {
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
                <CardTitle>فلاتر البحث</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                        <Label>نوع الحركة</Label>
                        <Select value={filters.type} onValueChange={(v) => handleFilterChange("type", v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر النوع" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">الكل</SelectItem>
                                <SelectItem value="in">إدخال</SelectItem>
                                <SelectItem value="out">إخراج</SelectItem>
                                <SelectItem value="transfer">تحويل</SelectItem>
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
            <CardTitle>سجل حركات المخزون</CardTitle>
            <CardDescription>
              عرض لجميع عمليات الإدخال والإخراج والتحويل التي تمت في المخازن.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
                 <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="text-center w-[150px]">نوع الحركة</TableHead>
                    <TableHead className="w-[150px]">رقم الإيصال</TableHead>
                    <TableHead className="w-[150px]">التاريخ</TableHead>
                    <TableHead>التفاصيل</TableHead>
                    <TableHead>الأصناف</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredMovements.length > 0 ? filteredMovements.map((move) => (
                    <TableRow key={`${move.type}-${move.id}`}>
                        <TableCell className="text-center">
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
                                لا توجد حركات مخزون مسجلة تطابق الفلاتر.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
