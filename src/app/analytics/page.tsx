
"use client"

import { Bar, CartesianGrid, LabelList, XAxis, YAxis, Pie, PieChart as RechartsPieChart, BarChart as RechartsBarChart, Cell } from "recharts"
import React, { useMemo, useState, useEffect } from 'react';
import { useData } from "@/contexts/data-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import PageHeader from "@/components/page-header"
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Interfaces for Firebase data
interface Item { id: string; name: string; cost?: number; }
interface SaleInvoice { id: string; date: string; warehouseId: string; total: number; salesRepId?: string; status?: string; items: { id: string; qty: number; price: number; cost?: number; }[]; }
interface PurchaseInvoice { id: string; date: string; supplierId: string, warehouseId: string, total: number; }
interface Supplier { id: string; name: string; openingBalance: number; }
interface Warehouse { id: string; name: string; }
interface Customer { id: string; openingBalance: number; }
interface Expense { id: string; date: string; amount: number; expenseType: string; warehouseId?: string; }
interface User { id: string; name: string; isSalesRep?: boolean; }
interface PosSale { id: string; date: string; total: number; items: { id: string; qty: number; price: number; cost?: number; }[]; }


const chartConfig = {
  profit: {
    label: "أرباح",
    color: "hsl(var(--chart-2))",
  },
  loss: {
    label: "خسائر",
    color: "hsl(var(--destructive))",
  },
   receivables: {
    label: "ديون العملاء",
    color: "hsl(var(--chart-1))",
  },
  payables: {
    label: "مستحقات الموردين",
    color: "hsl(var(--chart-3))",
  },
  sales: {
    label: "مبيعات",
    color: "hsl(var(--primary))",
  },
  expenses: {
    label: "مصروفات",
    color: "hsl(var(--chart-5))",
  }
}

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function AnalyticsPage() {
    const { items, salesInvoices, purchaseInvoices, suppliers, warehouses, customers, expenses, users, posSales, loading } = useData();

    const [dateRange, setDateRange] = useState({
      from: '',
      to: ''
    });
    const [selectedWarehouse, setSelectedWarehouse] = useState('all');


    useEffect(() => {
        const today = new Date();
        const fromDate = new Date();
        fromDate.setDate(today.getDate() - 30);
        setDateRange({
            from: fromDate.toISOString().split('T')[0],
            to: today.toISOString().split('T')[0]
        });
    }, []);

    const filteredSales = useMemo(() => {
        return salesInvoices.filter(sale => {
            if (sale.status && sale.status !== 'approved') return false;
            const saleDate = new Date(sale.date);
            const from = dateRange.from ? new Date(dateRange.from) : null;
            const to = dateRange.to ? new Date(dateRange.to) : null;
            if (from && saleDate < from) return false;
            if (to && saleDate > to) return false;
            if (selectedWarehouse !== 'all' && sale.warehouseId !== selectedWarehouse) return false;
            return true;
        });
    }, [salesInvoices, dateRange, selectedWarehouse]);
    
    const filteredPosSales = useMemo(() => {
         return posSales.filter((sale: PosSale) => {
            const saleDate = new Date(sale.date);
            const from = dateRange.from ? new Date(dateRange.from) : null;
            const to = dateRange.to ? new Date(dateRange.to) : null;
            if (from && saleDate < from) return false;
            if (to && saleDate > to) return false;
            // POS sales are not warehouse specific in this analytics view for now
            return true;
        });
    }, [posSales, dateRange]);


    const filteredPurchases = useMemo(() => {
        return purchaseInvoices.filter(purchase => {
            const purchaseDate = new Date(purchase.date);
            const from = dateRange.from ? new Date(dateRange.from) : null;
            const to = dateRange.to ? new Date(dateRange.to) : null;
            if (from && purchaseDate < from) return false;
            if (to && purchaseDate > to) return false;
            if (selectedWarehouse !== 'all' && purchase.warehouseId !== selectedWarehouse) return false;
            return true;
        });
    }, [purchaseInvoices, dateRange, selectedWarehouse]);

    const filteredExpenses = useMemo(() => {
        return expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            const from = dateRange.from ? new Date(dateRange.from) : null;
            const to = dateRange.to ? new Date(dateRange.to) : null;
            if (from && expenseDate < from) return false;
            if (to && expenseDate > to) return false;
            // Include general expenses (no warehouseId) or expenses for the selected warehouse
            if (selectedWarehouse !== 'all' && expense.warehouseId && expense.warehouseId !== 'none' && expense.warehouseId !== selectedWarehouse) return false;
            return true;
        });
    }, [expenses, dateRange, selectedWarehouse]);


    const itemProfitData = useMemo(() => {
        const profitMap = new Map<string, { totalRevenue: number, totalCost: number }>();
        
        const processSaleItems = (saleItems: any[], itemMasterList: any[]) => {
            if (!saleItems || !Array.isArray(saleItems)) return;
            saleItems.forEach(saleItem => {
                if (!saleItem.id) return;
                const itemMaster = itemMasterList.find(i => i.id === saleItem.id);
                if (!itemMaster) return;

                const revenue = (saleItem.qty || 0) * (saleItem.price || 0);
                const cost = (saleItem.qty || 0) * (saleItem.cost || itemMaster.cost || 0);

                const current = profitMap.get(itemMaster.id) || { totalRevenue: 0, totalCost: 0 };
                current.totalRevenue += revenue;
                current.totalCost += cost;
                profitMap.set(itemMaster.id, current);
            });
        };

        filteredSales.forEach(sale => processSaleItems(sale.items, items));
        filteredPosSales.forEach(sale => processSaleItems(sale.items, items));

        return Array.from(profitMap.entries()).map(([itemId, data]) => {
            const itemMaster = items.find(i => i.id === itemId);
            const profit = data.totalRevenue - data.totalCost;
            return {
                name: itemMaster?.name || 'صنف غير معروف',
                profit: profit >= 0 ? profit : 0,
                loss: profit < 0 ? -profit : 0
            };
        }).filter(d => d.profit > 0 || d.loss > 0).sort((a,b) => b.profit - a.profit).slice(0, 5);

    }, [items, filteredSales, filteredPosSales]);

    const supplierActivityData = useMemo(() => {
        const activity: { [key: string]: number } = {};
        filteredPurchases.forEach(purchase => {
            const supplierName = suppliers.find(s => s.id === purchase.supplierId)?.name || "غير محدد";
            activity[supplierName] = (activity[supplierName] || 0) + purchase.total;
        });
        return Object.entries(activity).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 5);
    }, [filteredPurchases, suppliers]);
    
    const warehouseActivityData = useMemo(() => {
         const activity: { [key: string]: number } = {};
         filteredSales.forEach(sale => {
            const warehouseName = warehouses.find(w => w.id === (sale as any).warehouseId)?.name || "غير محدد";
            activity[warehouseName] = (activity[warehouseName] || 0) + (sale as any).total;
        });
        return Object.entries(activity).map(([name, sales]) => ({ name, sales })).sort((a,b) => b.sales - a.sales);
    }, [filteredSales, warehouses]);

    // Note: Receivables/Payables are cumulative balances, so they are not affected by the date filter.
    const receivablesPayablesData = useMemo(() => {
        const totalReceivables = customers.reduce((acc, c) => acc + (c.openingBalance || 0), 0);
        const totalPayables = suppliers.reduce((acc, s) => acc + (s.openingBalance || 0), 0);
        return [
            { name: 'ديون العملاء', value: totalReceivables, fill: "var(--color-receivables)" },
            { name: 'مستحقات الموردين', value: totalPayables, fill: "var(--color-payables)" },
        ]
    }, [customers, suppliers]);

     const expenseByTypeData = useMemo(() => {
        const expenseTotals: { [key: string]: number } = {};
        filteredExpenses.forEach(expense => {
            expenseTotals[expense.expenseType] = (expenseTotals[expense.expenseType] || 0) + expense.amount;
        });
        return Object.entries(expenseTotals).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    }, [filteredExpenses]);
    
    const salesRepPerformanceData = useMemo(() => {
        const repTotals: { [key: string]: number } = {};
        filteredSales.forEach(sale => {
            if (sale.salesRepId) {
                const repName = users.find(u => u.id === sale.salesRepId)?.name || 'مندوب غير معروف';
                repTotals[repName] = (repTotals[repName] || 0) + sale.total;
            }
        });
        return Object.entries(repTotals).map(([name, sales]) => ({ name, sales })).sort((a,b) => b.sales - a.sales);
    }, [filteredSales, users]);


    if (loading) {
        return (
            <div className="flex flex-1 justify-center items-center">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
        )
    }

  return (
    <>
      <PageHeader title="التحليلات الرسومية" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        
        <Card>
            <CardHeader>
                <CardTitle>فترة التحليل</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="from-date">من تاريخ</Label>
                        <Input type="date" value={dateRange.from} onChange={(e) => setDateRange(prev => ({...prev, from: e.target.value}))} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="to-date">إلى تاريخ</Label>
                        <Input type="date" value={dateRange.to} onChange={(e) => setDateRange(prev => ({...prev, to: e.target.value}))} />
                    </div>
                    <div className="space-y-2">
                        <Label>المخزن</Label>
                        <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر المخزن" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">كل المخازن</SelectItem>
                                {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>أرباح وخسائر الأصناف</CardTitle>
                    <CardDescription>
                        تحليل ربحية الأصناف الأكثر مبيعًا
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <RechartsBarChart data={itemProfitData} layout="vertical" margin={{ right: 20 }}>
                            <CartesianGrid horizontal={false} />
                            <YAxis
                            dataKey="name"
                            type="category"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            width={80}
                            />
                            <XAxis type="number" hide />
                            <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent />}
                            />
                            <Bar dataKey="profit" name="أرباح" fill="var(--color-profit)" radius={5} stackId="a">
                                <LabelList position="right" offset={8} className="fill-foreground" fontSize={12} />
                            </Bar>
                             <Bar dataKey="loss" name="خسائر" fill="var(--color-loss)" radius={5} stackId="a">
                                <LabelList position="right" offset={8} className="fill-foreground" fontSize={12} />
                            </Bar>
                        </RechartsBarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>نشاط الموردين</CardTitle>
                    <CardDescription>
                       الموردون الأكثر تعاملاً من حيث قيمة الفواتير
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-[300px] w-full">
                        <RechartsBarChart data={supplierActivityData} layout="vertical" margin={{ right: 20 }}>
                            <CartesianGrid horizontal={false} />
                            <YAxis
                            dataKey="name"
                            type="category"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            width={100}
                            />
                            <XAxis type="number" hide />
                            <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent />}
                            />
                            <Bar dataKey="value" fill="hsl(var(--primary))" radius={5}>
                                <LabelList position="right" offset={8} className="fill-foreground" fontSize={12} />
                            </Bar>
                        </RechartsBarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
            
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>الذمم والديون (إجمالي)</CardTitle>
                    <CardDescription>
                        نظرة على إجمالي الأموال المستحقة للشركة وعليها
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                       <RechartsPieChart>
                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                            <Pie data={receivablesPayablesData} dataKey="value" nameKey="name" >
                                {receivablesPayablesData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                       </RechartsPieChart>
                    </ChartContainer>
                </CardContent>
            </Card>

             <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>نشاط المخازن</CardTitle>
                    <CardDescription>
                        مقارنة أداء المخازن من حيث المبيعات
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <RechartsBarChart data={warehouseActivityData}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                            dataKey="name"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            />
                            <YAxis />
                            <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent />}
                            />
                            <Bar dataKey="sales" fill="var(--color-sales)" radius={8}>
                                <LabelList
                                    position="top"
                                    offset={12}
                                    className="fill-foreground"
                                    fontSize={12}
                                />
                            </Bar>
                        </RechartsBarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
            
             <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>أداء المناديب</CardTitle>
                    <CardDescription>
                        إجمالي المبيعات المعتمدة لكل مندوب في الفترة المحددة
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <RechartsBarChart data={salesRepPerformanceData}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                            dataKey="name"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            />
                            <YAxis />
                            <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent />}
                            />
                            <Bar dataKey="sales" fill="var(--color-sales)" radius={8}>
                                <LabelList
                                    position="top"
                                    offset={12}
                                    className="fill-foreground"
                                    fontSize={12}
                                />
                            </Bar>
                        </RechartsBarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

             <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>توزيع المصروفات</CardTitle>
                    <CardDescription>
                        تحليل المصروفات حسب النوع
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <RechartsBarChart data={expenseByTypeData} layout="vertical" margin={{ right: 20 }}>
                            <CartesianGrid horizontal={false} />
                             <YAxis
                                dataKey="name"
                                type="category"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                                width={80}
                            />
                            <XAxis type="number" hide />
                            <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent />}
                            />
                            <Bar dataKey="value" fill="var(--color-expenses)" radius={5}>
                                <LabelList position="right" offset={8} className="fill-foreground" fontSize={12} />
                            </Bar>
                        </RechartsBarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
      </main>
    </>
  )
}
