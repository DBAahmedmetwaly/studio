
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
  TableFooter,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/contexts/data-provider';

// Data Interfaces
interface Item { id: string; name: string; unit: string; price: number; cost?: number; reorderPoint?: number; }
interface Warehouse { id: string; name: string; }
interface SaleInvoice { id: string; warehouseId: string; items: { id: string; qty: number; }[]; status?: 'approved' | 'pending'; date: string; }
interface PurchaseInvoice { id: string; warehouseId: string; items: { id: string; qty: number; }[]; date: string; }
interface StockInRecord { id: string; warehouseId: string; reason: string; items: { id: string; qty: number; }[]; date: string; }
interface StockOutRecord { id: string; sourceId: string; items: { id: string; qty: number; }[]; date: string; }
interface StockTransferRecord { id: string; fromSourceId: string; toSourceId: string; items: { id: string; qty: number; }[]; date: string; }
interface StockAdjustmentRecord { id: string; warehouseId: string; items: { itemId: string; difference: number; }[]; date: string; }
interface SalesReturn { id: string; warehouseId: string; items: { id: string; qty: number; }[]; date: string; }
interface PurchaseReturn { id: string; warehouseId: string; items: { id: string; qty: number; }[]; date: string; }
interface IssueToRep { id: string; warehouseId: string; items: { id: string; qty: number; }[]; date: string; }
interface ReturnFromRep { id: string; warehouseId: string; items: { id: string; qty: number; }[]; date: string; }
interface InventoryClosing { id: string; warehouseId: string; closingDate: string; balances: { itemId: string, balance: number }[] }

export default function StockStatusPage() {
    const [filters, setFilters] = useState({
        warehouseId: "all",
        itemName: ""
    });

    const { 
        items: allItems, warehouses, salesInvoices, purchaseInvoices, 
        stockInRecords, stockOutRecords, stockTransferRecords, 
        stockAdjustmentRecords, salesReturns, purchaseReturns, 
        stockIssuesToReps, stockReturnsFromReps,
        inventoryClosings, loading 
    } = useData();

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({...prev, [key]: value}));
    };

    const stockData = useMemo(() => {
        let results: any[] = [];
        
        const targetWarehouses = filters.warehouseId === 'all'
            ? warehouses
            : warehouses.filter((w:any) => w.id === filters.warehouseId);

        targetWarehouses.forEach((warehouse: Warehouse) => {
            // Find the last closing date for the current warehouse
            const closingsForWarehouse = inventoryClosings.filter((c: InventoryClosing) => c.warehouseId === warehouse.id);
            const lastClosing = closingsForWarehouse.length > 0
                ? closingsForWarehouse.reduce((latest, current) => new Date(latest.closingDate) > new Date(current.closingDate) ? latest : current)
                : null;
            const lastClosingDate = lastClosing ? new Date(lastClosing.closingDate) : new Date(0);

            allItems.forEach((item: Item) => {
                // Get opening balance from the last closing record
                let stock = lastClosing?.balances.find(b => b.itemId === item.id)?.balance || 0;

                const filterTransactions = (t: any) => new Date(t.date) > lastClosingDate;

                // Increases since last closing
                purchaseInvoices.filter(p => p.warehouseId === warehouse.id && filterTransactions(p)).forEach(p => p.items.filter(i => i.id === item.id).forEach(i => stock += i.qty));
                stockInRecords.filter(si => si.warehouseId === warehouse.id && filterTransactions(si)).forEach(si => si.items.filter(i => i.id === item.id).forEach(i => stock += i.qty));
                stockTransferRecords.filter(t => t.toSourceId === warehouse.id && filterTransactions(t)).forEach(t => t.items.filter(i => i.id === item.id).forEach(i => stock += i.qty));
                stockAdjustmentRecords.filter(adj => adj.warehouseId === warehouse.id && filterTransactions(adj)).forEach(adj => adj.items.filter(i => i.itemId === item.id && i.difference > 0).forEach(i => stock += i.difference));
                salesReturns.filter(sr => sr.warehouseId === warehouse.id && filterTransactions(sr)).forEach(sr => sr.items.filter(i => i.id === item.id).forEach(i => stock += i.qty));
                stockReturnsFromReps.filter(rfr => rfr.warehouseId === warehouse.id && filterTransactions(rfr)).forEach(rfr => rfr.items.filter(i => i.id === item.id).forEach(i => stock += i.qty));

                // Decreases since last closing
                salesInvoices.filter(s => s.warehouseId === warehouse.id && s.status === 'approved' && filterTransactions(s)).forEach(s => s.items.filter(i => i.id === item.id).forEach(i => stock -= i.qty));
                stockOutRecords.filter(so => so.sourceId === warehouse.id && filterTransactions(so)).forEach(so => so.items.filter(i => i.id === item.id).forEach(i => stock -= i.qty));
                stockTransferRecords.filter(t => t.fromSourceId === warehouse.id && filterTransactions(t)).forEach(t => t.items.filter(i => i.id === item.id).forEach(i => stock -= i.qty));
                stockAdjustmentRecords.filter(adj => adj.warehouseId === warehouse.id && filterTransactions(adj)).forEach(adj => adj.items.filter(i => i.itemId === item.id && i.difference < 0).forEach(i => stock += i.difference));
                purchaseReturns.filter(pr => pr.warehouseId === warehouse.id && filterTransactions(pr)).forEach(pr => pr.items.filter(i => i.id === item.id).forEach(i => stock -= i.qty));
                stockIssuesToReps.filter(itr => itr.warehouseId === warehouse.id && filterTransactions(itr)).forEach(itr => itr.items.filter(i => i.id === item.id).forEach(i => stock -= i.qty));
                
                results.push({
                    id: `${warehouse.id}-${item.id}`,
                    warehouseName: warehouse.name,
                    itemName: item.name,
                    unit: item.unit,
                    price: item.price,
                    cost: item.cost || 0,
                    currentStock: stock,
                    reorderPoint: item.reorderPoint || 0,
                });
            });
        });
        
        return results.filter(item => {
            const matchesName = item.itemName.toLowerCase().includes(filters.itemName.toLowerCase());
            return matchesName && item.currentStock !== 0;
        });

    }, [filters, allItems, warehouses, salesInvoices, purchaseInvoices, stockInRecords, stockOutRecords, stockTransferRecords, stockAdjustmentRecords, salesReturns, purchaseReturns, stockIssuesToReps, stockReturnsFromReps, inventoryClosings]);
    
    const getUnitLabel = (unit: string) => {
        const units = { piece: "قطعة", weight: "لتر ", meter: "متر", kilo: "كيلو", gram: "جرام" };
        return units[unit as keyof typeof units] || unit;
    }
    
    const totalValue = useMemo(() => {
        return stockData.reduce((sum, item) => sum + (item.currentStock * item.cost), 0);
    }, [stockData]);

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
                                {warehouses.map((w:any) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
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
              عرض تفصيلي للأرصدة الحالية لكل صنف في المخازن بناءً على آخر فترة مقفلة.
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
                                <TableHead className="w-[150px]">المخزن</TableHead>
                                <TableHead>الصنف</TableHead>
                                <TableHead className="text-center">الوحدة</TableHead>
                                <TableHead className="text-center">سعر التكلفة</TableHead>
                                <TableHead className="text-center">الرصيد الحالي</TableHead>
                                <TableHead className="text-center w-[150px]">إجمالي القيمة</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stockData.length > 0 ? stockData.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>{item.warehouseName}</TableCell>
                                <TableCell className="font-medium">{item.itemName}</TableCell>
                                <TableCell className="text-center">{getUnitLabel(item.unit)}</TableCell>
                                <TableCell className="text-center">{item.cost.toLocaleString()} ج.م</TableCell>
                                <TableCell className="text-center font-bold">
                                    <Badge variant={item.currentStock <= item.reorderPoint ? 'destructive' : 'default'}>
                                        {item.currentStock.toLocaleString()}
                                    </Badge>
                                </TableCell>
                                 <TableCell className="text-center font-semibold">
                                    {(item.currentStock * item.cost).toLocaleString()} ج.م
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
                        {stockData.length > 0 && (
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={5} className="font-bold text-base">إجمالي قيمة المخزون</TableCell>
                                    <TableCell className="text-center font-bold text-base">
                                        {totalValue.toLocaleString()} ج.م
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        )}
                    </Table>
                </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
