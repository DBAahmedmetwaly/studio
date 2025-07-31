
"use client";

import React, { useState, useMemo, useEffect } from "react";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useData } from "@/contexts/data-provider";
import { Loader2, Printer, BarChart2, TrendingDown, TrendingUp, Coins, Percent, User, Calendar, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";


interface PosSale {
  id: string;
  date: string;
  cashierId: string;
  cashierName: string;
  items: { id: string; name: string; qty: number; price: number; cost: number; total: number; }[];
  total: number;
  discount: number;
  invoiceNumber: string;
  subtotal: number;
}
interface PosSession {
    id: string;
    startTime: string;
    endTime?: string;
    isClosed: boolean;
    openedByName: string;
    closedByName?: string;
    cashierSessions: {
        [cashierId: string]: any;
    }
}
interface User {
  id: string;
  name: string;
  isCashier?: boolean;
}

export default function PosReportsPage() {
    const [filters, setFilters] = useState({ fromDate: '', toDate: '' });
    const { posSales, posSessions, loading } = useData();

     useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        setFilters({ fromDate: today, toDate: today });
    }, []);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }
    
    const filteredSessions = useMemo(() => {
        return posSessions
            .filter((session: PosSession) => {
                if (!session.isClosed) return false;
                const sessionDate = new Date(session.startTime);
                const from = filters.fromDate ? new Date(filters.fromDate) : null;
                const to = filters.toDate ? new Date(filters.toDate) : null;
                if(from) from.setHours(0,0,0,0);
                if(to) to.setHours(23,59,59,999);

                if (from && sessionDate < from) return false;
                if (to && sessionDate > to) return false;
                return true;
            })
            .map((session: PosSession) => {
                const sessionSales = posSales.filter((sale: PosSale) => {
                    if (!session.endTime) return false;
                    const saleDate = new Date(sale.date);
                    // Corrected the logic here: it should be <= endTime, not < endTime
                    // to include sales made up until the moment of closing.
                    return saleDate >= new Date(session.startTime) && saleDate <= new Date(session.endTime);
                });

                const cashiersData = session.cashierSessions ? Object.values(session.cashierSessions).map(cs => {
                    const cashierSales = sessionSales.filter(s => s.cashierId === cs.cashierId);
                    const totalSales = cashierSales.reduce((sum, s) => sum + s.subtotal, 0);
                    const totalDiscount = cashierSales.reduce((sum, s) => sum + s.discount, 0);
                    const netSales = totalSales - totalDiscount;
                    const totalCost = cashierSales.reduce((sum, s) => sum + s.items.reduce((itemSum, item) => itemSum + (item.cost * item.qty), 0), 0);
                    const profit = netSales - totalCost;

                    return {
                        name: cs.cashierName,
                        invoiceCount: cashierSales.length,
                        totalSales,
                        totalDiscount,
                        profit,
                    }
                }) : [];
                
                return {
                    ...session,
                    cashiersData,
                    totalSales: cashiersData.reduce((sum, d) => sum + d.totalSales, 0),
                    totalDiscount: cashiersData.reduce((sum, d) => sum + d.totalDiscount, 0),
                    totalProfit: cashiersData.reduce((sum, d) => sum + d.profit, 0),
                }

            }).sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    }, [posSessions, posSales, filters]);


    if (loading) {
        return <div className="flex flex-1 justify-center items-center"><Loader2 className="h-10 w-10 animate-spin text-muted-foreground" /></div>
    }

    return (
        <>
            <PageHeader title="تقارير نقاط البيع" />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>فلاتر البحث</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>من تاريخ</Label>
                                <Input type="date" value={filters.fromDate} onChange={e => handleFilterChange('fromDate', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>إلى تاريخ</Label>
                                <Input type="date" value={filters.toDate} onChange={e => handleFilterChange('toDate', e.target.value)} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>سجل أيام العمل المغلقة</CardTitle>
                        <CardDescription>عرض تفصيلي لكل يوم عمل مغلق وأداء الكاشيرات خلاله.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {filteredSessions.length > 0 ? (
                             <Accordion type="single" collapsible className="w-full">
                                {filteredSessions.map(session => (
                                    <AccordionItem value={session.id} key={session.id}>
                                        <AccordionTrigger>
                                            <div className="flex justify-between items-center w-full pr-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-5 w-5 text-primary" />
                                                    <span className="font-bold text-lg">يوم: {new Date(session.startTime).toLocaleDateString('ar-EG')}</span>
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    فتح بواسطة: {session.openedByName} | أغلق بواسطة: {session.closedByName}
                                                </div>
                                                <Badge>صافي الربح: {session.totalProfit.toLocaleString()} ج.م</Badge>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="p-4 bg-muted/50 rounded-b-md">
                                             <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>الكاشير</TableHead>
                                                        <TableHead className="text-center">عدد الفواتير</TableHead>
                                                        <TableHead className="text-center">إجمالي المبيعات</TableHead>
                                                        <TableHead className="text-center">إجمالي الخصومات</TableHead>
                                                        <TableHead className="text-center">صافي الربح</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {session.cashiersData.map(cd => (
                                                        <TableRow key={cd.name}>
                                                            <TableCell>{cd.name}</TableCell>
                                                            <TableCell className="text-center">{cd.invoiceCount}</TableCell>
                                                            <TableCell className="text-center">{cd.totalSales.toLocaleString()} ج.م</TableCell>
                                                            <TableCell className="text-center text-destructive">{cd.totalDiscount.toLocaleString()} ج.م</TableCell>
                                                            <TableCell className="text-center font-bold text-green-600">{cd.profit.toLocaleString()} ج.م</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                                <TableFooter>
                                                    <TableRow className="font-bold bg-muted">
                                                        <TableCell>الإجمالي</TableCell>
                                                        <TableCell className="text-center">{session.cashiersData.reduce((sum,d) => sum + d.invoiceCount, 0)}</TableCell>
                                                        <TableCell className="text-center">{session.totalSales.toLocaleString()} ج.م</TableCell>
                                                        <TableCell className="text-center text-destructive">{session.totalDiscount.toLocaleString()} ج.م</TableCell>
                                                        <TableCell className="text-center text-green-600">{session.totalProfit.toLocaleString()} ج.م</TableCell>
                                                    </TableRow>
                                                </TableFooter>
                                             </Table>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                             </Accordion>
                        ) : (
                            <div className="text-center text-muted-foreground py-10">
                                <p>لا توجد أيام عمل مغلقة في الفترة المحددة.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </>
    );
}

