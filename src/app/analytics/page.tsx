
"use client"

import { Bar, CartesianGrid, LabelList, XAxis, YAxis, Pie, PieChart as RechartsPieChart, BarChart as RechartsBarChart, Cell } from "recharts"
import React, { useMemo } from 'react';
import useFirebase from "@/hooks/use-firebase";
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

// Interfaces for Firebase data
interface Item { id: string; name: string; cost?: number; }
interface SaleInvoice { id: string; items: { id: string; qty: number; price: number }[]; }
interface PurchaseInvoice { id: string; supplierId: string, total: number; }
interface Supplier { id: string; name: string; }
interface Warehouse { id: string; name: string; }
interface Customer { id: string; openingBalance: number; }
interface Expense { id: string; amount: number; expenseType: string; }

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
    const { data: items, loading: loadingItems } = useFirebase<Item>('items');
    const { data: sales, loading: loadingSales } = useFirebase<SaleInvoice>('salesInvoices');
    const { data: purchases, loading: loadingPurchases } = useFirebase<PurchaseInvoice>('purchaseInvoices');
    const { data: suppliers, loading: loadingSuppliers } = useFirebase<Supplier>('suppliers');
    const { data: warehouses, loading: loadingWarehouses } = useFirebase<Warehouse>('warehouses');
    const { data: customers, loading: loadingCustomers } = useFirebase<Customer>('customers');
    const { data: expenses, loading: loadingExpenses } = useFirebase<Expense>('expenses');

    const loading = loadingItems || loadingSales || loadingPurchases || loadingSuppliers || loadingWarehouses || loadingCustomers || loadingExpenses;

    const itemProfitData = useMemo(() => {
        return items.map(item => {
            let totalRevenue = 0;
            let totalCost = 0;
            sales.forEach(sale => {
                sale.items.forEach(saleItem => {
                    if (saleItem.id === item.id) {
                        totalRevenue += saleItem.qty * saleItem.price;
                        totalCost += saleItem.qty * (item.cost || saleItem.price * 0.8); // Fallback cost
                    }
                });
            });
            const profit = totalRevenue - totalCost;
            return {
                name: item.name,
                profit: profit >= 0 ? profit : 0,
                loss: profit < 0 ? -profit : 0
            };
        }).filter(d => d.profit > 0 || d.loss > 0).slice(0, 5);
    }, [items, sales]);

    const supplierActivityData = useMemo(() => {
        const activity: { [key: string]: number } = {};
        purchases.forEach(purchase => {
            const supplierName = suppliers.find(s => s.id === purchase.supplierId)?.name || "غير محدد";
            activity[supplierName] = (activity[supplierName] || 0) + purchase.total;
        });
        return Object.entries(activity).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 5);
    }, [purchases, suppliers]);
    
    const warehouseActivityData = useMemo(() => {
         const activity: { [key: string]: number } = {};
         sales.forEach(sale => {
            const warehouseName = warehouses.find(w => w.id === (sale as any).warehouseId)?.name || "غير محدد";
            activity[warehouseName] = (activity[warehouseName] || 0) + (sale as any).total;
        });
        return Object.entries(activity).map(([name, sales]) => ({ name, sales })).sort((a,b) => b.sales - a.sales);
    }, [sales, warehouses]);

    const receivablesPayablesData = useMemo(() => {
        const totalReceivables = customers.reduce((acc, c) => acc + (c.openingBalance || 0), 0);
        const totalPayables = suppliers.reduce((acc, s) => acc + ((s as any).openingBalance || 0), 0);
        return [
            { name: 'ديون العملاء', value: totalReceivables, fill: "var(--color-receivables)" },
            { name: 'مستحقات الموردين', value: totalPayables, fill: "var(--color-payables)" },
        ]
    }, [customers, suppliers]);

     const expenseByTypeData = useMemo(() => {
        const expenseTotals: { [key: string]: number } = {};
        expenses.forEach(expense => {
            expenseTotals[expense.expenseType] = (expenseTotals[expense.expenseType] || 0) + expense.amount;
        });
        return Object.entries(expenseTotals).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    }, [expenses]);


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
                    <CardTitle>الذمم والديون</CardTitle>
                    <CardDescription>
                        نظرة على الأموال المستحقة للشركة وعليها
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
