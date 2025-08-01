
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
import useFirebase from "@/hooks/use-firebase";
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

    const { items, salesInvoices: sales, posSales, warehouses, loading } = useData();
    
    useEffect(() => {
        // Set default date range for the last 30 days
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
        
        const filterByDate = (sale: { date: string }) => {
            const saleDate = new Date(sale.date);
            const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
            const toDate = filters.toDate ? new Date(filters.toDate) : null;

            if(fromDate) fromDate.setHours(0,0,0,0);
            if(toDate) toDate.setHours(23,59,59,999);

            if (fromDate && saleDate < fromDate) return false;
            if (toDate && saleDate > toDate) return false;
            return true;
        }

        const filteredSales = sales.filter(sale => {
            if (sale.status !== 'approved') return false;
            if (!filterByDate(sale)) return false;
            if (filters.warehouseId !== 'all' && sale.warehouseId !== filters.warehouseId) return false;
            return true;
        });

        const filteredPosSales = posSales.filter(filterByDate);
        
        const resultsMap = new Map();

        const processSaleItems = (saleItems: any[]) => {
             if (!saleItems || !Array.isArray(saleItems)) return;
             saleItems.forEach(saleItem => {
                if (!saleItem.id) return;
                const itemMaster = items.find(i => i.id === saleItem.id);
                if (!itemMaster) return;

                const revenue = saleItem.qty * saleItem.price;
                const cost = saleItem.qty * (saleItem.cost || itemMaster.cost || 0);

                if (resultsMap.has(saleItem.id)) {
                    const existing = resultsMap.get(saleItem.id);
                    existing.totalQty += saleItem.qty;
                    existing.totalRevenue += revenue;
                    existing.totalCost += cost;
                } else {
                    resultsMap.set(saleItem.id, {
                        id: saleItem.id,
                        name: itemMaster.name,
                        totalQty: saleItem.qty,
                        totalRevenue: revenue,
                        totalCost: cost,
                    });
                }
            });
        }
        
        filteredSales.forEach(sale => processSaleItems(sale.items));
        filteredPosSales.forEach(sale => processSaleItems(sale.items));

        const results = Array.from(resultsMap.values()).map(data => {
            const profit = data.totalRevenue - data.totalCost;
            const margin = data.totalRevenue > 0 ? (profit / data.totalRevenue) * 100 : 0;
            return {
                ...data,
                profit: profit,
                margin: margin.toFixed(2) + '%'
            };
        });

        setReportData(results);
    };

    const handlePrint = () => {
        window.print();
    };

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
                            <TableHead className="text-center">الكمية المباعة</TableHead>
                            <TableHead className="text-center">الإيرادات</TableHead>
                            <TableHead className="text-center">التكلفة</TableHead>
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
                                <TableCell className="text-center">{data.totalQty.toLocaleString()}</TableCell>
                                <TableCell className="text-center">ج.م {data.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-center">ج.م {data.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                <TableCell className={`text-center font-bold ${data.profit >= 0 ? "text-green-500" : "text-destructive"}`}>
                                    ج.م {data.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                    {reportData.length > 0 && (
                        <TableFooter>
                            <TableRow className="bg-muted/50">
                                <TableCell className="font-bold">الإجمالي</TableCell>
                                <TableCell className="text-center font-bold">{reportData.reduce((acc, item) => acc + item.totalQty, 0).toLocaleString()}</TableCell>
                                <TableCell className="text-center font-bold">ج.م {reportData.reduce((acc, item) => acc + item.totalRevenue, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-center font-bold">ج.م {reportData.reduce((acc, item) => acc + item.totalCost, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-center font-bold">ج.م {reportData.reduce((acc, item) => acc + item.profit, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
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
