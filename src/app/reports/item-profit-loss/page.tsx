
"use client";

import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Loader2, Printer } from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import { useData } from "@/contexts/data-provider";

interface Item {
    id: string;
    name: string;
    price: number;
    cost?: number; // Assume cost is part of item master data
}

interface SaleInvoice {
    id: string;
    date: string;
    warehouseId: string;
    items: { id: string; qty: number; price: number; cost?: number; }[];
    status?: 'pending' | 'approved';
}

interface PosSale {
  id: string;
  date: string;
  warehouseId?: string; // POS might not always have a warehouse
  items: { id: string; qty: number; price: number; cost?: number; }[];
}

interface SalesReturn {
    id: string;
    date: string;
    warehouseId: string;
    items: { id: string; qty: number; price: number; cost?: number; }[];
}

interface PosReturn {
    id: string;
    date: string;
    items: { id: string; qty: number; price: number; cost?: number; }[];
}


interface Warehouse {
    id: string;
    name: string;
}

export default function ItemProfitLossPage() {
    const [filters, setFilters] = useState({
        warehouseId: "all",
        fromDate: "",
        toDate: ""
    });
    const [reportData, setReportData] = useState<any[] | null>(null);

    const { items, salesInvoices, posSales, salesReturns, posReturns, warehouses, loading } = useData();
    
    useEffect(() => {
        const toDate = new Date();
        const fromDate = new Date();
        fromDate.setDate(toDate.getDate() - 30);
        setFilters(prev => ({
            ...prev,
            fromDate: fromDate.toISOString().split('T')[0],
            toDate: toDate.toISOString().split('T')[0]
        }));
    }, []);

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({...prev, [key]: value}));
    };
    
    const handleGenerateReport = () => {
        
        const filterByDate = (item: { date: string }) => {
            const itemDate = new Date(item.date);
            const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
            const toDate = filters.toDate ? new Date(filters.toDate) : null;

            if(fromDate) fromDate.setHours(0,0,0,0);
            if(toDate) toDate.setHours(23,59,59,999);

            if (fromDate && itemDate < fromDate) return false;
            if (toDate && itemDate > toDate) return false;
            return true;
        }

        const filteredSales = salesInvoices.filter(sale => {
            if (sale.status !== 'approved') return false;
            if (!filterByDate(sale)) return false;
            if (filters.warehouseId !== 'all' && sale.warehouseId !== filters.warehouseId) return false;
            return true;
        });

        const filteredPosSales = posSales.filter(sale => {
            if (!filterByDate(sale)) return false;
            // POS sales might not be warehouse-specific in this report view
            return true;
        });

        const filteredSalesReturns = salesReturns.filter(ret => {
             if (!filterByDate(ret)) return false;
            if (filters.warehouseId !== 'all' && ret.warehouseId !== filters.warehouseId) return false;
            return true;
        });
        
        const filteredPosReturns = posReturns.filter(ret => filterByDate(ret));
        
        const resultsMap = new Map();
        
        const getItemMasterCost = (itemId: string) => items.find((i:Item) => i.id === itemId)?.cost || 0;

        // Initialize map with all items
        items.forEach((item: Item) => {
             resultsMap.set(item.id, {
                id: item.id,
                name: item.name,
                totalSoldQty: 0,
                totalSoldValue: 0,
                totalSoldCount: 0,
                totalReturnedQty: 0,
                totalReturnedValue: 0,
                totalCost: 0,
            });
        });

        // Process Sales
        const processSales = (sales: any[]) => {
            sales.forEach(sale => {
                 if (!sale.items || !Array.isArray(sale.items)) return;
                 sale.items.forEach((saleItem: any) => {
                    if (!saleItem.id) return;
                    if (resultsMap.has(saleItem.id)) {
                        const existing = resultsMap.get(saleItem.id);
                        existing.totalSoldQty += saleItem.qty;
                        existing.totalSoldValue += saleItem.qty * saleItem.price;
                        existing.totalSoldCount += 1;
                        existing.totalCost += saleItem.qty * (saleItem.cost || getItemMasterCost(saleItem.id));
                    }
                });
            });
        };
        processSales(filteredSales);
        processSales(filteredPosSales);
        
        // Process Returns
         const processReturns = (returns: any[]) => {
            returns.forEach(ret => {
                 if (!ret.items || !Array.isArray(ret.items)) return;
                 ret.items.forEach((retItem: any) => {
                    if (!retItem.id) return;
                    if (resultsMap.has(retItem.id)) {
                        const existing = resultsMap.get(retItem.id);
                        existing.totalReturnedQty += retItem.qty;
                        existing.totalReturnedValue += retItem.qty * retItem.price;
                        // Adjust cost based on returned items
                        existing.totalCost -= retItem.qty * (retItem.cost || getItemMasterCost(retItem.id));
                    }
                });
            });
        };
        processReturns(filteredSalesReturns);
        processReturns(filteredPosReturns);


        const results = Array.from(resultsMap.values())
            .filter(data => data.totalSoldQty > 0 || data.totalReturnedQty > 0) // Only show items that were sold or returned
            .map(data => {
                const netRevenue = data.totalSoldValue - data.totalReturnedValue;
                const profit = netRevenue - data.totalCost;
                const margin = netRevenue > 0 ? (profit / netRevenue) * 100 : 0;
                return {
                    ...data,
                    netRevenue,
                    profit,
                    margin: margin.toFixed(2) + '%'
                };
            });

        setReportData(results);
    };

    const handlePrint = () => {
        window.print();
    };
    
    const grandTotals = useMemo(() => {
        if (!reportData) return null;
        return {
            soldValue: reportData.reduce((acc, item) => acc + item.totalSoldValue, 0),
            returnedValue: reportData.reduce((acc, item) => acc + item.totalReturnedValue, 0),
            cost: reportData.reduce((acc, item) => acc + item.totalCost, 0),
            profit: reportData.reduce((acc, item) => acc + item.profit, 0),
        }
    }, [reportData]);

    return (
    <>
      <PageHeader title="تقرير أرباح وخسائر الأصناف" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card className="no-print">
            <CardHeader>
                <CardTitle>تحديد الفلاتر</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="warehouse">المخزن</Label>
                        <Select value={filters.warehouseId} onValueChange={v => handleFilterChange('warehouseId', v)}>
                            <SelectTrigger disabled={loading}>
                                <SelectValue placeholder="كل المخازن" />
                            </SelectTrigger>
                            <SelectContent>
                               <SelectItem value="all">كل المخازن (للفواتير العادية)</SelectItem>
                               {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="from-date">من تاريخ</Label>
                        <Input id="from-date" type="date" value={filters.fromDate} onChange={e => handleFilterChange('fromDate', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="to-date">إلى تاريخ</Label>
                        <Input id="to-date" type="date" value={filters.toDate} onChange={e => handleFilterChange('toDate', e.target.value)} />
                    </div>
                     <div className="flex items-end">
                        <Button className="w-full" onClick={handleGenerateReport} disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" /> : "عرض التقرير"}
                        </Button>
                    </div>
                 </div>
            </CardContent>
        </Card>

        {reportData && (
            <Card className="printable-area">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>نتائج التقرير</CardTitle>
                    <CardDescription>
                    تحليل أرباح وخسائر كل صنف خلال الفترة المحددة.
                    </CardDescription>
                </div>
                <Button variant="outline" size="icon" onClick={handlePrint} className="no-print">
                    <Printer className="h-4 w-4" />
                    <span className="sr-only">طباعة</span>
                </Button>
            </CardHeader>
            <CardContent>
                <div className="w-full overflow-auto border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>الصنف</TableHead>
                            <TableHead className="text-center">إجمالي المبيعات</TableHead>
                            <TableHead className="text-center">إجمالي المرتجعات</TableHead>
                            <TableHead className="text-center">إجمالي التكلفة</TableHead>
                            <TableHead className="text-center">الربح / الخسارة</TableHead>
                            <TableHead className="text-center">هامش الربح</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reportData.length > 0 ? reportData.map((data) => (
                            <TableRow key={data.id}>
                                <TableCell>
                                    <div className="font-medium">{data.name}</div>
                                    <div className="text-sm text-muted-foreground">{data.id.slice(0, 6).toUpperCase()}</div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div>{data.totalSoldValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                    <div className="text-xs text-muted-foreground">({data.totalSoldQty} وحدة)</div>
                                </TableCell>
                                 <TableCell className="text-center text-destructive">
                                    <div>{data.totalReturnedValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                    <div className="text-xs text-muted-foreground">({data.totalReturnedQty} وحدة)</div>
                                </TableCell>
                                <TableCell className="text-center">ج.م {data.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                <TableCell className={`text-center font-bold ${data.profit >= 0 ? "text-green-500" : "text-destructive"}`}>
                                    ج.م {data.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className={`text-center font-bold ${data.profit >= 0 ? "text-green-500" : "text-destructive"}`}>
                                    {data.margin}
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                                    لا توجد بيانات مبيعات لعرضها في الفترة المحددة.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    {reportData.length > 0 && grandTotals && (
                        <TableFooter>
                            <TableRow className="bg-muted/50 font-bold">
                                <TableCell>الإجمالي</TableCell>
                                <TableCell className="text-center">ج.م {grandTotals.soldValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-center">ج.م {grandTotals.returnedValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-center">ج.م {grandTotals.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-center">ج.م {grandTotals.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
                </div>
            </CardContent>
            </Card>
        )}
      </main>
    </>
  );
}
