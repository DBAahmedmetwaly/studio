
"use client";

import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Loader2, Printer } from "lucide-react";
import React, { useState, useMemo } from "react";
import useFirebase from "@/hooks/use-firebase";

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
}

interface PurchaseInvoice {
     id: string;
    date: string;
    warehouseId: string;
    items: { id: string; qty: number; price: number }[];
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

    const { data: items, loading: loadingItems } = useFirebase<Item>('items');
    const { data: sales, loading: loadingSales } = useFirebase<SaleInvoice>('salesInvoices');
    const { data: purchases, loading: loadingPurchases } = useFirebase<PurchaseInvoice>('purchaseInvoices');
    const { data: warehouses, loading: loadingWarehouses } = useFirebase<Warehouse>('warehouses');

    const loading = loadingItems || loadingSales || loadingPurchases || loadingWarehouses;

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({...prev, [key]: value}));
    };
    
    const handleGenerateReport = () => {
        const results = items.map(item => {
            let totalRevenue = 0;
            let totalCost = 0;

            const relevantSales = sales.filter(sale => {
                const saleDate = new Date(sale.date);
                const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
                const toDate = filters.toDate ? new Date(filters.toDate) : null;
                if (fromDate && saleDate < fromDate) return false;
                if (toDate && saleDate > toDate) return false;
                if (filters.warehouseId !== 'all' && sale.warehouseId !== filters.warehouseId) return false;
                return sale.items.some(i => i.id === item.id);
            });

            relevantSales.forEach(sale => {
                sale.items.forEach(saleItem => {
                    if (saleItem.id === item.id) {
                        totalRevenue += saleItem.qty * saleItem.price;
                        // Use cost from sale invoice if available, otherwise fallback
                        totalCost += saleItem.qty * (saleItem.cost || item.cost || item.price * 0.8);
                    }
                });
            });

            const profit = totalRevenue - totalCost;
            const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

            return {
                id: item.id,
                name: item.name,
                revenue: totalRevenue,
                cost: totalCost,
                profit: profit,
                margin: margin.toFixed(2) + '%'
            };
        });
        setReportData(results.filter(r => r.revenue > 0 || r.cost > 0));
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
                            <SelectTrigger disabled={loadingWarehouses}>
                                <SelectValue placeholder="كل المخازن" />
                            </SelectTrigger>
                            <SelectContent>
                               <SelectItem value="all">كل المخازن</SelectItem>
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
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>الصنف</TableHead>
                            <TableHead>الإيرادات</TableHead>
                            <TableHead>التكلفة</TableHead>
                            <TableHead>الربح / الخسارة</TableHead>
                            <TableHead>هامش الربح</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reportData.length > 0 ? reportData.map((data) => (
                            <TableRow key={data.id}>
                                <TableCell>
                                    <div className="font-medium">{data.name}</div>
                                    <div className="text-sm text-muted-foreground">{data.id.slice(0, 6).toUpperCase()}</div>
                                </TableCell>
                                <TableCell>ج.م {data.revenue.toLocaleString()}</TableCell>
                                <TableCell>ج.م {data.cost.toLocaleString()}</TableCell>
                                <TableCell className={data.profit >= 0 ? "text-green-500" : "text-destructive"}>
                                    ج.م {data.profit.toLocaleString()}
                                </TableCell>
                                <TableCell className={data.profit >= 0 ? "text-green-500" : "text-destructive"}>
                                    {data.margin}
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                                    لا توجد بيانات لعرضها.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    {reportData.length > 0 && (
                        <TableFooter>
                            <TableRow>
                                <TableCell className="font-bold">الإجمالي</TableCell>
                                <TableCell className="font-bold">ج.م {reportData.reduce((acc, item) => acc + item.revenue, 0).toLocaleString()}</TableCell>
                                <TableCell className="font-bold">ج.م {reportData.reduce((acc, item) => acc + item.cost, 0).toLocaleString()}</TableCell>
                                <TableCell className="font-bold">ج.م {reportData.reduce((acc, item) => acc + item.profit, 0).toLocaleString()}</TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
            </CardContent>
            </Card>
        )}
      </main>
    </>
  );
}
