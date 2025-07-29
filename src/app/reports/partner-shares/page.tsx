
"use client";

import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { useData } from "@/contexts/data-provider";
import { Loader2, Printer } from "lucide-react";
import React, { useState } from "react";

// Data interfaces
interface SaleInvoice { id: string; date: string; total: number; }
interface PurchaseInvoice { id: string; date: string; total: number; }
interface Expense { id: string; date: string; amount: number; }
interface ExceptionalIncome { id: string; date: string; amount: number; }
interface Partner { id: string; name: string; capital: number; profitShare: number; }

interface ReportResult {
    id: string;
    name: string;
    capital: number;
    profitSharePercentage: number;
    profitShareValue: number;
}

export default function PartnerSharesPage() {
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [reportData, setReportData] = useState<ReportResult[] | null>(null);
    const [netIncome, setNetIncome] = useState<number | null>(null);

    const { 
        partners,
        salesInvoices,
        purchaseInvoices,
        expenses,
        exceptionalIncomes,
        loading
    } = useData();

    const handleGenerateReport = () => {
        const start = fromDate ? new Date(fromDate) : null;
        const end = toDate ? new Date(toDate) : null;

        const filterByDate = (item: { date: string }) => {
            const itemDate = new Date(item.date);
            if(start) start.setHours(0,0,0,0);
            if(end) end.setHours(23,59,59,999);
            if (start && itemDate < start) return false;
            if (end && itemDate > end) return false;
            return true;
        };

        const totalRevenue = salesInvoices.filter(filterByDate).reduce((acc: number, sale: any) => acc + sale.total, 0);
        const totalExceptionalIncome = exceptionalIncomes.filter(filterByDate).reduce((acc, income) => acc + income.amount, 0);
        const totalCogs = purchaseInvoices.filter(filterByDate).reduce((acc, purchase) => acc + purchase.total, 0);
        const totalExpenses = expenses.filter(filterByDate).reduce((acc, expense) => acc + expense.amount, 0);

        const calculatedNetIncome = (totalRevenue + totalExceptionalIncome) - (totalCogs + totalExpenses);
        setNetIncome(calculatedNetIncome);

        const results = partners.map((partner: Partner) => {
            const profitShareValue = calculatedNetIncome * (partner.profitShare / 100);
            return {
                id: partner.id,
                name: partner.name,
                capital: partner.capital,
                profitSharePercentage: partner.profitShare,
                profitShareValue: profitShareValue,
            };
        });

        setReportData(results);
    };

    const handlePrint = () => {
        window.print();
    };

    const totalCalculatedShares = reportData ? reportData.reduce((acc, item) => acc + item.profitShareValue, 0) : 0;

    return (
        <>
            <PageHeader title="تقرير حصص الشركاء" />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                <Card className="no-print">
                    <CardHeader>
                        <CardTitle>تحديد الفترة</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="from-date">من تاريخ</Label>
                                <Input id="from-date" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="to-date">إلى تاريخ</Label>
                                <Input id="to-date" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
                            </div>
                            <div className="flex items-end">
                                <Button className="w-full" onClick={handleGenerateReport} disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin" /> : "عرض التقرير"}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {reportData && netIncome !== null && (
                    <Card className="printable-area">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>نتائج تقرير حصص الشركاء</CardTitle>
                                <CardDescription>
                                    الفترة من {fromDate || 'البداية'} إلى {toDate || 'النهاية'}.
                                    صافي الربح للفترة: <span className="font-bold">{netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })} ج.م</span>
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
                                        <TableHead>اسم الشريك</TableHead>
                                        <TableHead className="text-center">رأس المال</TableHead>
                                        <TableHead className="text-center">نسبة الحصة</TableHead>
                                        <TableHead className="text-center">قيمة حصة الربح</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reportData.length > 0 ? reportData.map((partner) => (
                                        <TableRow key={partner.id}>
                                            <TableCell className="font-medium">{partner.name}</TableCell>
                                            <TableCell className="text-center">{partner.capital.toLocaleString()}</TableCell>
                                            <TableCell className="text-center">{partner.profitSharePercentage}%</TableCell>
                                            <TableCell className={`text-center font-semibold ${partner.profitShareValue >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                                                {partner.profitShareValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                                                لا يوجد شركاء لعرضهم.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                                <TableFooter>
                                     <TableRow>
                                        <TableCell colSpan={3} className="font-bold">إجمالي الأرباح الموزعة</TableCell>
                                        <TableCell className={`text-center font-bold ${totalCalculatedShares >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                                            {totalCalculatedShares.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </main>
        </>
    );
}
