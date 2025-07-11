
"use client";

import React, { useMemo, useState } from 'react';
import PageHeader from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Loader2 } from "lucide-react";
import useFirebase from "@/hooks/use-firebase";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Data Interfaces
interface User {
    id: string;
    name: string;
    warehouse: string;
    isSalesRep?: boolean;
}
interface Item {
    id: string;
    name: string;
}
interface IssueToRep {
    id: string;
    salesRepId: string;
    date: string;
    items: { id: string; qty: number; }[];
}
interface ReturnFromRep {
    id: string;
    salesRepId: string;
    date: string;
    items: { id: string; qty: number; }[];
}
interface SaleInvoice {
    id: string;
    salesRepId: string;
    date: string;
    items: { id: string; qty: number; }[];
    status?: 'pending' | 'approved';
}
interface Warehouse {
    id: string;
    name: string;
}

export default function RepOperationsPage() {
    const [filters, setFilters] = useState({
        salesRepId: "",
        warehouseId: "all",
        fromDate: "",
        toDate: "",
    });

    const { data: users, loading: l1 } = useFirebase<User>('users');
    const { data: allItems, loading: l2 } = useFirebase<Item>('items');
    const { data: issues, loading: l3 } = useFirebase<IssueToRep>('stockIssuesToReps');
    const { data: returns, loading: l4 } = useFirebase<ReturnFromRep>('stockReturnsFromReps');
    const { data: sales, loading: l5 } = useFirebase<SaleInvoice>('salesInvoices');
    const { data: warehouses, loading: l6 } = useFirebase<Warehouse>('warehouses');

    const loading = l1 || l2 || l3 || l4 || l5 || l6;
    const salesReps = users.filter(u => u.isSalesRep);

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({...prev, [key]: value}));
    };

    const reportData = useMemo(() => {
        if (!filters.salesRepId) return null;

        const filterByDate = (item: { date: string }) => {
            if (!filters.fromDate && !filters.toDate) return true;
            const itemDate = new Date(item.date);
            const start = filters.fromDate ? new Date(filters.fromDate) : null;
            const end = filters.toDate ? new Date(filters.toDate) : null;
            if (start && itemDate < start) return false;
            if (end && itemDate > end) return false;
            return true;
        };
        
        const itemMovements = new Map<string, { name: string; issued: number; sold: number; returned: number; }>();
        
        allItems.forEach(item => {
            itemMovements.set(item.id, { name: item.name, issued: 0, sold: 0, returned: 0 });
        });

        issues.filter(i => i.salesRepId === filters.salesRepId && filterByDate(i)).forEach(issue => {
            issue.items.forEach(item => {
                const current = itemMovements.get(item.id);
                if (current) current.issued += item.qty;
            });
        });

        sales.filter(s => s.salesRepId === filters.salesRepId && s.status === 'approved' && filterByDate(s)).forEach(sale => {
            sale.items.forEach(item => {
                const current = itemMovements.get(item.id);
                if (current) current.sold += item.qty;
            });
        });

        returns.filter(r => r.salesRepId === filters.salesRepId && filterByDate(r)).forEach(ret => {
            ret.items.forEach(item => {
                const current = itemMovements.get(item.id);
                if (current) current.returned += item.qty;
            });
        });
        
        return Array.from(itemMovements.values())
            .filter(d => d.issued > 0 || d.sold > 0 || d.returned > 0)
            .map(d => ({
                ...d,
                balance: d.issued - d.sold - d.returned
            }));

    }, [filters, issues, sales, returns, allItems]);
    
    const totals = useMemo(() => {
        if (!reportData) return { issued: 0, sold: 0, returned: 0, balance: 0 };
        return {
            issued: reportData.reduce((acc, item) => acc + item.issued, 0),
            sold: reportData.reduce((acc, item) => acc + item.sold, 0),
            returned: reportData.reduce((acc, item) => acc + item.returned, 0),
            balance: reportData.reduce((acc, item) => acc + item.balance, 0),
        }
    }, [reportData]);


  return (
    <>
      <PageHeader title="تقرير حركة أصناف المندوب" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
            <CardHeader>
                <CardTitle>فلاتر البحث</CardTitle>
                <CardDescription>اختر المندوب والفترة الزمنية لعرض التقرير المفصل.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                     <div className="space-y-2">
                        <Label>المندوب</Label>
                        <Select value={filters.salesRepId} onValueChange={(v) => handleFilterChange("salesRepId", v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر مندوبًا" />
                            </SelectTrigger>
                            <SelectContent>
                                {salesReps.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label>المخزن</Label>
                        <Select value={filters.warehouseId} onValueChange={(v) => handleFilterChange("warehouseId", v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="كل المخازن" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">كل المخازن</SelectItem>
                                {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label>من تاريخ</Label>
                        <Input type="date" value={filters.fromDate} onChange={(e) => handleFilterChange("fromDate", e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label>إلى تاريخ</Label>
                        <Input type="date" value={filters.toDate} onChange={(e) => handleFilterChange("toDate", e.target.value)} />
                    </div>
                </div>
            </CardContent>
        </Card>

        {loading && <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>}
        
        {reportData && !loading && (
            <Card>
            <CardHeader>
                <CardTitle>تقرير حركة الأصناف</CardTitle>
                <CardDescription>
                تقرير مفصل بالكميات المصروفة، المباعة، المرتجعة، والرصيد الدفتري لكل صنف في عهدة المندوب المحدد.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="w-full overflow-auto border rounded-lg">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>الصنف</TableHead>
                        <TableHead className="text-center">كمية مصروفة</TableHead>
                        <TableHead className="text-center">كمية مباعة</TableHead>
                        <TableHead className="text-center">كمية مرتجعة</TableHead>
                        <TableHead className="text-center font-bold">الرصيد لدى المندوب</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reportData.length > 0 ? reportData.map((item) => (
                        <TableRow key={item.name}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-center">{item.issued > 0 ? item.issued : '-'}</TableCell>
                            <TableCell className="text-center text-green-600">{item.sold > 0 ? item.sold : '-'}</TableCell>
                            <TableCell className="text-center text-amber-600">{item.returned > 0 ? item.returned : '-'}</TableCell>
                            <TableCell className={`text-center font-bold ${item.balance < 0 ? 'text-destructive' : 'text-primary'}`}>
                                {item.balance}
                            </TableCell>
                        </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">لا توجد حركات للأصناف لهذا المندوب في الفترة المحددة.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                     {reportData.length > 0 && (
                        <TableFooter>
                            <TableRow className="font-bold bg-muted/50">
                                <TableCell>الإجمالي</TableCell>
                                <TableCell className="text-center">{totals.issued}</TableCell>
                                <TableCell className="text-center">{totals.sold}</TableCell>
                                <TableCell className="text-center">{totals.returned}</TableCell>
                                <TableCell className="text-center">{totals.balance}</TableCell>
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
