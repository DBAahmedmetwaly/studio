"use client";

import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer } from "lucide-react";
import React from "react";

const profitData = [
    {
        item: "منتج 1",
        sku: "PRD-001",
        revenue: 5000,
        cost: 3000,
        profit: 2000,
        margin: "40%",
    },
    {
        item: "منتج 2",
        sku: "PRD-002",
        revenue: 8000,
        cost: 6500,
        profit: 1500,
        margin: "18.75%",
    },
     {
        item: "منتج 3",
        sku: "PRD-003",
        revenue: 1200,
        cost: 1500,
        profit: -300,
        margin: "-25%",
    },
];

export default function ItemProfitLossPage() {
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
                        <Label htmlFor="branch">الفرع</Label>
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="كل الفروع" />
                            </SelectTrigger>
                            <SelectContent>
                               <SelectItem value="all">كل الفروع</SelectItem>
                               <SelectItem value="br001">الفرع الرئيسي - القاهرة</SelectItem>
                               <SelectItem value="br002">فرع الإسكندرية</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="from-date">من تاريخ</Label>
                        <Input id="from-date" type="date" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="to-date">إلى تاريخ</Label>
                        <Input id="to-date" type="date" />
                    </div>
                     <div className="flex items-end">
                        <Button className="w-full">عرض التقرير</Button>
                    </div>
                 </div>
            </CardContent>
        </Card>

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
                    {profitData.map((data) => (
                        <TableRow key={data.sku}>
                            <TableCell>
                                <div className="font-medium">{data.item}</div>
                                <div className="text-sm text-muted-foreground">{data.sku}</div>
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
                    ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
