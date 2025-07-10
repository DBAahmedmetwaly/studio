
"use client"

import { BarChart, LineChart, TrendingUp, Users, GitFork } from "lucide-react"
import {
  Bar,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import PageHeader from "@/components/page-header"

const itemProfitData = [
  { name: "منتج 1", profit: 2000, loss: 0 },
  { name: "منتج 2", profit: 1500, loss: 0 },
  { name: "منتج 3", profit: 0, loss: 300 },
  { name: "منتج 4", profit: 1800, loss: 0 },
  { name: "منتج 5", profit: 900, loss: 0 },
]

const supplierActivityData = [
  { name: "مورد تكنولوجيا", value: 456 },
  { name: "مورد أثاث", value: 321 },
  { name: "مورد أدوات مكتبية", value: 234 },
  { name: "مورد مواد خام", value: 189 },
]

const branchActivityData = [
  { name: "فرع القاهرة", sales: 2400 },
  { name: "فرع الإسكندرية", sales: 1398 },
  { name: "فرع الجيزة", sales: 9800 },
]

const receivablesPayablesData = [
    { name: 'ديون العملاء', value: 85000, fill: "var(--color-receivables)" },
    { name: 'مستحقات الموردين', value: 45000, fill: "var(--color-payables)" },
]

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
}

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader title="التقارير الرسومية" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>أرباح وخسائر الأصناف</CardTitle>
                    <CardDescription>
                        تحليل ربحية الأصناف الأكثر مبيعًا
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={itemProfitData} layout="vertical" margin={{ right: 20 }}>
                            <CartesianGrid horizontal={false} />
                            <YAxis
                            dataKey="name"
                            type="category"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            />
                            <XAxis type="number" hide />
                            <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent />}
                            />
                            <Bar dataKey="profit" name="أرباح" fill="var(--color-profit)" radius={5}>
                                <LabelList position="right" offset={8} className="fill-foreground" fontSize={12} />
                            </Bar>
                             <Bar dataKey="loss" name="خسائر" fill="var(--color-loss)" radius={5}>
                                <LabelList position="right" offset={8} className="fill-foreground" fontSize={12} />
                            </Bar>
                        </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>نشاط الموردين</CardTitle>
                    <CardDescription>
                       الموردون الأكثر تعاملاً من حيث قيمة الفواتير
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-[300px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={supplierActivityData} layout="vertical" margin={{ right: 20 }}>
                                <CartesianGrid horizontal={false} />
                                <YAxis
                                dataKey="name"
                                type="category"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                                />
                                <XAxis type="number" hide />
                                <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent />}
                                />
                                <Bar dataKey="value" fill="hsl(var(--primary))" radius={5}>
                                    <LabelList position="right" offset={8} className="fill-foreground" fontSize={12} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>الذمم والديون</CardTitle>
                    <CardDescription>
                        نظرة على الأموال المستحقة للشركة وعليها
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                            accessibilityLayer
                            data={receivablesPayablesData}
                            layout="vertical"
                            margin={{
                                left: -20,
                            }}
                            >
                            <CartesianGrid horizontal={false} />
                            <XAxis dataKey="value" type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                className="capitalize"
                            />
                            <Bar dataKey="value" layout="vertical" radius={5}>
                                {receivablesPayablesData.map((d, i) => (
                                    <Cell key={`cell-${i}`} fill={d.fill} />
                                ))}
                                <LabelList
                                    dataKey="value"
                                    position="right"
                                    offset={8}
                                    className="fill-foreground"
                                    fontSize={12}
                                />
                            </Bar>
                             <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel />}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>نشاط الفروع</CardTitle>
                    <CardDescription>
                        مقارنة أداء الفروع من حيث المبيعات
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={branchActivityData}>
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
                                <Bar dataKey="sales" fill="hsl(var(--primary))" radius={8}>
                                    <LabelList
                                        position="top"
                                        offset={12}
                                        className="fill-foreground"
                                        fontSize={12}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
      </main>
    </>
  )
}
