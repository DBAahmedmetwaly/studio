

"use client";

import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useData } from "@/contexts/data-provider";
import { Loader2, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState, useMemo } from "react";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import Link from "next/link";
import { getLinkForReceipt } from "@/lib/utils";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ItemDetails {
    name: string;
    qty: number;
    cost?: number;
    price?: number;
}

interface StockInRecord {
  id: string;
  receiptNumber: string;
  date: string;
  warehouseId: string;
  items: { itemId: string; name: string; qty: number; cost?: number, price?: number }[];
  createdByName?: string;
}

interface StockOutRecord {
  id: string;
  receiptNumber: string;
  date: string;
  sourceId: string;
  items: { id: string; name: string; qty: number; cost?: number, price?: number }[];
  createdByName?: string;
}

interface StockTransferRecord {
  id: string;
  receiptNumber: string;
  date: string;
  fromSourceId: string;
  toSourceId: string;
  items: { id: string; name: string; qty: number; cost?: number, price?: number }[];
  createdByName?: string;
}

interface Warehouse {
    id: string;
    name: string;
}

const ItemsDetailsDialog = ({ items }: { items: ItemDetails[] }) => (
    <DialogContent>
        <DialogHeader>
            <DialogTitle>تفاصيل الأصناف</DialogTitle>
        </DialogHeader>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>الصنف</TableHead>
                    <TableHead className="text-center">الكمية</TableHead>
                    <TableHead className="text-center">التكلفة</TableHead>
                    <TableHead className="text-center">سعر البيع</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items && items.map((item, idx) => (
                    <TableRow key={idx}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-center">{item.qty}</TableCell>
                        <TableCell className="text-center">{item.cost?.toLocaleString() || '-'}</TableCell>
                        <TableCell className="text-center">{item.price?.toLocaleString() || '-'}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </DialogContent>
)


export default function InventoryMovementsPage() {
  const [filters, setFilters] = useState({
    warehouseId: "all",
    type: "all",
    fromDate: "",
    toDate: ""
  });
  
  const [selectedItems, setSelectedItems] = useState<ItemDetails[]>([]);

  const { stockInRecords, stockOutRecords, stockTransferRecords, warehouses, loading } = useData();

  const getSourceName = (id: string) => {
    const warehouse = warehouses.find((w: Warehouse) => w.id === id);
    return warehouse ? warehouse.name : id;
  };

  const filteredMovements = useMemo(() => {
    const allMovements = [
      ...stockInRecords.map((r: StockInRecord) => ({ ...r, type: 'in', typeLabel: 'استلام' })),
      ...stockOutRecords.map((r: StockOutRecord) => ({ ...r, type: 'out', typeLabel: 'صرف' })),
      ...stockTransferRecords.map((r: StockTransferRecord) => ({ ...r, type: 'transfer', typeLabel: 'تحويل' })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return allMovements.filter(move => {
      const moveDate = new Date(move.date);
      const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
      const toDate = filters.toDate ? new Date(filters.toDate) : null;

      if (fromDate) fromDate.setHours(0,0,0,0);
      if (toDate) toDate.setHours(23,59,59,999);

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
  }, [stockInRecords, stockOutRecords, stockTransferRecords, filters, warehouses]);


  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({...prev, [key]: value}));
  }

  if (loading && warehouses.length === 0) {
    return (
      <div className="flex flex-1 justify-center items-center">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  const getReceiptTooltip = (receiptNumber?: string): string => {
    if (!receiptNumber) return "رقم مرجعي";
    if (receiptNumber.startsWith('إذ-د-')) return "إذن دخول مخزني";
    if (receiptNumber.startsWith('إذ-خ-')) return "إذن صرف مخزني";
    if (receiptNumber.startsWith('إذ-ت-')) return "إذن تحويل مخزني";
    return "رقم مرجعي";
  }


  return (
    <TooltipProvider>
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
                                {warehouses.map((w: Warehouse) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
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
                                <SelectItem value="in">استلام</SelectItem>
                                <SelectItem value="out">صرف</SelectItem>
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
              عرض لجميع عمليات الاستلام والصرف والتحويل التي تمت في المخازن.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
                 <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="w-full overflow-auto border rounded-lg">
                    <Dialog>
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>التفاصيل</TableHead>
                            <TableHead className="text-center">النوع</TableHead>
                            <TableHead className="text-center">التفاصيل الإضافية</TableHead>
                            <TableHead className="text-center">عدد الأصناف</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredMovements.length > 0 ? filteredMovements.map((move: any) => (
                            <TableRow key={`${move.type}-${move.id}`}>
                                <TableCell>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link href={getLinkForReceipt(move.receiptNumber, move.id)} className="hover:underline hover:text-primary font-mono">
                                                <span>{move.receiptNumber}</span>
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{getReceiptTooltip(move.receiptNumber)}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                     <div className="text-xs text-muted-foreground">{new Date(move.date).toLocaleString('ar-EG')}</div>
                                     <div className="text-xs text-muted-foreground">بواسطة: {move.createdByName || 'غير معروف'}</div>
                                </TableCell>
                                <TableCell className="text-center">
                                <Badge variant={
                                    move.type === 'in' ? 'default' :
                                    move.type === 'out' ? 'destructive' :
                                    'secondary'
                                }>
                                    <span>{move.typeLabel}</span>
                                </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                {move.type === 'in' && `إلى: ${getSourceName(move.warehouseId)}`}
                                {move.type === 'out' && `من: ${getSourceName(move.sourceId)}`}
                                {move.type === 'transfer' && `من: ${getSourceName(move.fromSourceId)} إلى: ${getSourceName(move.toSourceId)}`}
                                </TableCell>
                                <TableCell className="text-center">
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedItems(move.items)}>
                                            <FileText className="ml-2 h-4 w-4"/>
                                            {move.items.length}
                                        </Button>
                                    </DialogTrigger>
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
                    <ItemsDetailsDialog items={selectedItems} />
                    </Dialog>
                </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
    </TooltipProvider>
  );
}


