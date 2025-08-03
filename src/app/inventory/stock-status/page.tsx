
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import PageHeader from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Loader2, Printer } from "lucide-react";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/contexts/data-provider';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';

// Data Interfaces
interface Item { id: string; name: string; unit: string; price: number; cost?: number; reorderPoint?: number; }
interface Warehouse { id: string; name: string; autoStockUpdate?: boolean; }
interface SaleInvoice { id: string; warehouseId: string; items: { id: string; qty: number; }[]; status?: 'approved' | 'pending'; date: string; salesRepId?: string;}
interface PosSale { id: string; warehouseId: string; items: { id: string; qty: number; }[]; date: string; }
interface PurchaseInvoice { id: string; warehouseId: string; items: { id: string; qty: number; cost?: number }[]; date: string; }
interface StockInRecord { id: string; warehouseId: string; items: { itemId: string; qty: number; cost?: number }[]; date: string; }
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
        itemId: ""
    });
    const [reportData, setReportData] = useState<any[] | null>(null);

    const { 
        items: allItems, warehouses, salesInvoices,
        stockInRecords, stockOutRecords, stockTransferRecords, 
        stockAdjustmentRecords, salesReturns, purchaseReturns, 
        stockIssuesToReps, stockReturnsFromReps,
        posSales,
        inventoryClosings, loading,
        purchaseInvoices 
    } = useData();

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({...prev, [key]: value}));
    };
    
    const itemOptions = useMemo(() => {
        return allItems.map((item: Item) => ({ value: item.id, label: item.name }));
    }, [allItems]);

    const handleGenerateReport = () => {
        let results: any[] = [];
        
        const targetWarehouses = filters.warehouseId === 'all'
            ? warehouses
            : warehouses.filter((w:any) => w.id === filters.warehouseId);

        const targetItems = filters.itemId
            ? allItems.filter((i:any) => i.id === filters.itemId)
            : allItems;


        targetWarehouses.forEach((warehouse: Warehouse) => {
            const closingsForWarehouse = inventoryClosings.filter((c: InventoryClosing) => c.warehouseId === warehouse.id)
                .sort((a,b) => new Date(b.closingDate).getTime() - new Date(a.closingDate).getTime());
            
            targetItems.forEach((item: Item) => {
                const lastClosing = closingsForWarehouse[0] ?? null;
                const lastClosingDate = lastClosing ? new Date(lastClosing.closingDate) : new Date(0);
                
                let stock = lastClosing?.balances?.find((b:any) => b.itemId === item.id)?.balance || 0;
                
                const filterTransactions = (t: any) => new Date(t.date) > lastClosingDate;

                // Increases
                stockInRecords.filter((si:any) => si.warehouseId === warehouse.id && filterTransactions(si)).forEach((si:any) => si.items.filter((i:any) => i.itemId === item.id).forEach((i:any) => stock += i.qty));
                stockTransferRecords.filter((t:any) => t.toSourceId === warehouse.id && filterTransactions(t)).forEach((t:any) => t.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock += i.qty));
                stockAdjustmentRecords.filter((adj:any) => adj.warehouseId === warehouse.id && filterTransactions(adj)).forEach((adj:any) => adj.items.filter((i:any) => i.itemId === item.id && i.difference > 0).forEach((i:any) => stock += i.difference));
                salesReturns.filter((sr:any) => sr.warehouseId === warehouse.id && filterTransactions(sr)).forEach((sr:any) => sr.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock += i.qty));
                stockReturnsFromReps.filter((rfr:any) => rfr.warehouseId === warehouse.id && filterTransactions(rfr)).forEach((rfr:any) => rfr.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock += i.qty));
                
                // Decreases
                salesInvoices.filter((s:any) => s.warehouseId === warehouse.id && (!s.salesRepId || s.status === 'approved') && filterTransactions(s)).forEach((s:any) => s.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock -= i.qty));
                posSales.filter((s:any) => s.warehouseId === warehouse.id && filterTransactions(s)).forEach((s:any) => s.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock -= i.qty));
                stockOutRecords.filter((so:any) => so.sourceId === warehouse.id && filterTransactions(so)).forEach((so:any) => so.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock -= i.qty));
                stockTransferRecords.filter((t:any) => t.fromSourceId === warehouse.id && filterTransactions(t)).forEach((t:any) => t.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock -= i.qty));
                stockAdjustmentRecords.filter((adj:any) => adj.warehouseId === warehouse.id && filterTransactions(adj)).forEach((adj:any) => adj.items.filter((i:any) => i.itemId === item.id && i.difference < 0).forEach((i:any) => stock += i.difference));
                purchaseReturns.filter((pr:any) => pr.warehouseId === warehouse.id && filterTransactions(pr)).forEach((pr:any) => pr.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock -= i.qty));
                stockIssuesToReps.filter((itr:any) => itr.warehouseId === warehouse.id && filterTransactions(itr)).forEach((itr:any) => itr.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock -= i.qty));
                
                // Find latest cost
                const allCostTransactions = [
                    ...purchaseInvoices.filter((p: PurchaseInvoice) => p.warehouseId === warehouse.id).flatMap((p: PurchaseInvoice) => p.items.filter(pi => pi.id === item.id && typeof pi.cost === 'number').map(pi => ({ date: p.date, cost: pi.cost! }))),
                    ...stockInRecords.filter((si: StockInRecord) => si.warehouseId === warehouse.id).flatMap((si: StockInRecord) => si.items.filter(si_item => si_item.itemId === item.id && typeof si_item.cost === 'number').map(si_item => ({ date: si.date, cost: si_item.cost! })))
                ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                
                const latestCost = allCostTransactions.length > 0 ? allCostTransactions[0].cost : (item.cost || 0);

                if (stock !== 0) { // Only add if there is stock
                  results.push({
                      id: `${warehouse.id}-${item.id}`,
                      warehouseName: warehouse.name,
                      itemName: item.name,
                      unit: item.unit,
                      price: item.price,
                      cost: latestCost,
                      currentStock: stock,
                      reorderPoint: item.reorderPoint || 0,
                  });
                }
            });
        });

        setReportData(results);
    };
    
    const getUnitLabel = (unit: string) => {
        const units = { piece: "قطعة", weight: "لتر ", meter: "متر", kilo: "كيلو", gram: "جرام" };
        return units[unit as keyof typeof units] || unit;
    }
    
    const totalValue = useMemo(() => {
        if (!reportData) return 0;
        return reportData.reduce((sum, item) => sum + (item.currentStock * item.cost), 0);
    }, [reportData]);

    const handlePrint = () => {
      window.print();
    }

  return (
    <>
      <PageHeader title="تقرير أرصدة المخزون" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card className="no-print">
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
                        <Label>الصنف</Label>
                        <Combobox
                          options={itemOptions}
                          value={filters.itemId}
                          onValueChange={(v) => handleFilterChange("itemId", v)}
                          placeholder="كل الأصناف..."
                          emptyMessage="لم يتم العثور على الصنف."
                        />
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleGenerateReport} disabled={loading}>
                    {loading ? <Loader2 className="animate-spin ml-2" /> : null}
                    عرض التقرير
                </Button>
            </CardFooter>
        </Card>

        {reportData && (
        <Card className="printable-area">
          <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>الأرصدة الحالية</CardTitle>
                <CardDescription>
                  عرض تفصيلي للأرصدة الحالية لكل صنف في المخازن بناءً على الفلاتر.
                </CardDescription>
              </div>
              <Button variant="outline" size="icon" onClick={handlePrint} className="no-print">
                <Printer className="h-4 w-4" />
              </Button>
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
                            {reportData.length > 0 ? reportData.map((item) => (
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
                        {reportData.length > 0 && (
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
        )}
      </main>
    </>
  );
}
