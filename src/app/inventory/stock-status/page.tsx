
"use client";

import React, { useMemo, useState } from 'react';
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
import { Loader2 } from "lucide-react";
import useFirebase from "@/hooks/use-firebase";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// Data Interfaces
interface Item { id: string; name: string; unit: string; price: number; openingStock: number; reorderPoint?: number; }
interface Warehouse { id: string; name: string; }
interface SaleInvoice { id: string; warehouseId: string; items: { id: string; qty: number; }[]; status?: 'approved' | 'pending'; }
interface PurchaseInvoice { id: string; warehouseId: string; items: { id: string; qty: number; }[]; }
interface StockInRecord { id: string; warehouseId: string; items: { id: string; qty: number; }[]; }
interface StockOutRecord { id: string; sourceId: string; items: { id: string; qty: number; }[]; }
interface StockTransferRecord { id: string; fromSourceId: string; toSourceId: string; items: { id: string; qty: number; }[]; }
interface StockAdjustmentRecord { id: string; warehouseId: string; items: { itemId: string; difference: number; }[]; }
interface SalesReturn { id: string; warehouseId: string; items: { id: string; qty: number; }[]; }
interface PurchaseReturn { id: string; warehouseId: string; items: { id: string; qty: number; }[]; }
interface IssueToRep { id: string; warehouseId: string; items: { id: string; qty: number; }[]; }
interface ReturnFromRep { id: string; warehouseId: string; items: { id: string; qty: number; }[]; }

export default function StockStatusPage() {
    const [filters, setFilters] = useState({
        warehouseId: "all",
        itemName: ""
    });

    const { data: allItems, loading: l1 } = useFirebase<Item>('items');
    const { data: warehouses, loading: l2 } = useFirebase<Warehouse>('warehouses');
    const { data: sales, loading: l3 } = useFirebase<SaleInvoice>('salesInvoices');
    const { data: purchases, loading: l4 } = useFirebase<PurchaseInvoice>('purchaseInvoices');
    const { data: stockIns, loading: l5 } = useFirebase<StockInRecord>('stockInRecords');
    const { data: stockOuts, loading: l6 } = useFirebase<StockOutRecord>('stockOutRecords');
    const { data: transfers, loading: l7 } = useFirebase<StockTransferRecord>('stockTransferRecords');
    const { data: adjustments, loading: l8 } = useFirebase<StockAdjustmentRecord>('stockAdjustmentRecords');
    const { data: salesReturns, loading: l9 } = useFirebase<SalesReturn>('salesReturns');
    const { data: purchaseReturns, loading: l10 } = useFirebase<PurchaseReturn>('purchaseReturns');
    const { data: issuesToReps, loading: l11 } = useFirebase<IssueToRep>('stockIssuesToReps');
    const { data: returnsFromReps, loading: l12 } = useFirebase<ReturnFromRep>('stockReturnsFromReps');

    const loading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9 || l10 || l11 || l12;

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({...prev, [key]: value}));
    };

    const stockData = useMemo(() => {
        let results: any[] = [];
        
        const targetWarehouses = filters.warehouseId === 'all'
            ? warehouses
            : warehouses.filter(w => w.id === filters.warehouseId);

        targetWarehouses.forEach(warehouse => {
            allItems.forEach(item => {
                let stock = item.openingStock || 0;

                // Increases
                purchases.filter(p => p.warehouseId === warehouse.id).forEach(p => p.items.filter(i => i.id === item.id).forEach(i => stock += i.qty));
                stockIns.filter(si => si.warehouseId === warehouse.id).forEach(si => si.items.filter(i => i.id === item.id).forEach(i => stock += i.qty));
                transfers.filter(t => t.toSourceId === warehouse.id).forEach(t => t.items.filter(i => i.id === item.id).forEach(i => stock += i.qty));
                adjustments.filter(adj => adj.warehouseId === warehouse.id).forEach(adj => adj.items.filter(i => i.itemId === item.id && i.difference > 0).forEach(i => stock += i.difference));
                salesReturns.filter(sr => sr.warehouseId === warehouse.id).forEach(sr => sr.items.filter(i => i.id === item.id).forEach(i => stock += i.qty));
                returnsFromReps.filter(rfr => rfr.warehouseId === warehouse.id).forEach(rfr => rfr.items.filter(i => i.id === item.id).forEach(i => stock += i.qty));

                // Decreases
                sales.filter(s => s.warehouseId === warehouse.id && s.status === 'approved').forEach(s => s.items.filter(i => i.id === item.id).forEach(i => stock -= i.qty));
                stockOuts.filter(so => so.sourceId === warehouse.id).forEach(so => so.items.filter(i => i.id === item.id).forEach(i => stock -= i.qty));
                transfers.filter(t => t.fromSourceId === warehouse.id).forEach(t => t.items.filter(i => i.id === item.id).forEach(i => stock -= i.qty));
                adjustments.filter(adj => adj.warehouseId === warehouse.id).forEach(adj => adj.items.filter(i => i.itemId === item.id && i.difference < 0).forEach(i => stock += i.difference));
                purchaseReturns.filter(pr => pr.warehouseId === warehouse.id).forEach(pr => pr.items.filter(i => i.id === item.id).forEach(i => stock -= i.qty));
                issuesToReps.filter(itr => itr.warehouseId === warehouse.id).forEach(itr => itr.items.filter(i => i.id === item.id).forEach(i => stock -= i.qty));
                
                results.push({
                    id: `${warehouse.id}-${item.id}`,
                    warehouseName: warehouse.name,
                    itemName: item.name,
                    unit: item.unit,
                    price: item.price,
                    openingStock: item.openingStock || 0,
                    currentStock: stock,
                    reorderPoint: item.reorderPoint || 0,
                });
            });
        });
        
        return results.filter(item => {
            const matchesName = item.itemName.toLowerCase().includes(filters.itemName.toLowerCase());
            // Optionally, filter out items with zero opening and current stock to declutter
            const hasStockActivity = item.openingStock > 0 || item.currentStock !== 0;
            return matchesName && hasStockActivity;
        });

    }, [filters, allItems, warehouses, sales, purchases, stockIns, stockOuts, transfers, adjustments, salesReturns, purchaseReturns, issuesToReps, returnsFromReps]);
    
    const getUnitLabel = (unit: string) => {
        const units = { piece: "قطعة", weight: "لتر ", meter: "متر", kilo: "كيلو", gram: "جرام" };
        return units[unit as keyof typeof units] || unit;
    }

  return (
    <>
      <PageHeader title="تقرير أرصدة المخزون" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
            <CardHeader>
                <CardTitle>فلاتر البحث</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        <Label>اسم الصنف</Label>
                        <Input type="text" placeholder="ابحث بالاسم..." value={filters.itemName} onChange={(e) => handleFilterChange("itemName", e.target.value)} />
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الأرصدة الحالية</CardTitle>
            <CardDescription>
              عرض تفصيلي للأرصدة الافتتاحية والحالية لكل صنف في المخازن.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
                 <div className="w-full flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="w-full overflow-auto border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>المخزن</TableHead>
                                <TableHead>الصنف</TableHead>
                                <TableHead className="text-center">الوحدة</TableHead>
                                <TableHead className="text-center">السعر</TableHead>
                                <TableHead className="text-center">رصيد أول المدة</TableHead>
                                <TableHead className="text-center">الرصيد الحالي</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stockData.length > 0 ? stockData.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>{item.warehouseName}</TableCell>
                                <TableCell className="font-medium">{item.itemName}</TableCell>
                                <TableCell className="text-center">{getUnitLabel(item.unit)}</TableCell>
                                <TableCell className="text-center">{item.price.toLocaleString()} ج.م</TableCell>
                                <TableCell className="text-center">{item.openingStock.toLocaleString()}</TableCell>
                                <TableCell className="text-center font-bold">
                                    <Badge variant={item.currentStock <= item.reorderPoint ? 'destructive' : 'default'}>
                                        {item.currentStock.toLocaleString()}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        لا توجد بيانات تطابق الفلاتر المحددة.
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
