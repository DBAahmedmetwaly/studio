
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
import { Loader2, Coins, Package, ShoppingCart, Undo, Banknote } from "lucide-react";
import useFirebase from "@/hooks/use-firebase";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Data Interfaces
interface User {
    id: string;
    name: string;
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
    items: { id: string; qty: number; price: number; }[];
}
interface ReturnFromRep {
    id: string;
    salesRepId: string;
    date: string;
    items: { id: string; qty: number; price: number; }[];
}
interface SaleInvoice {
    id: string;
    salesRepId: string;
    date: string;
    total: number;
    items: { id: string; qty: number; }[];
    status?: 'pending' | 'approved';
}
interface RepRemittance {
    id: string;
    salesRepId: string;
    date: string;
    amount: number;
}

export default function RepOperationsPage() {
    const [filters, setFilters] = useState({
        salesRepId: "",
        fromDate: "",
        toDate: "",
    });

    const { data: users, loading: l1 } = useFirebase<User>('users');
    const { data: allItems, loading: l2 } = useFirebase<Item>('items');
    const { data: issues, loading: l3 } = useFirebase<IssueToRep>('stockIssuesToReps');
    const { data: returns, loading: l4 } = useFirebase<ReturnFromRep>('stockReturnsFromReps');
    const { data: sales, loading: l5 } = useFirebase<SaleInvoice>('salesInvoices');
    const { data: remittances, loading: l6 } = useFirebase<RepRemittance>('repRemittances');

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
        
        const itemMovements = new Map<string, { name: string; issued: number; issuedValue: number; sold: number; soldValue: number; returned: number; returnedValue: number; }>();
        
        allItems.forEach(item => {
            itemMovements.set(item.id, { name: item.name, issued: 0, issuedValue: 0, sold: 0, soldValue: 0, returned: 0, returnedValue: 0 });
        });

        issues.filter(i => i.salesRepId === filters.salesRepId && filterByDate(i)).forEach(issue => {
            issue.items.forEach(item => {
                const current = itemMovements.get(item.id);
                if (current) {
                    current.issued += item.qty;
                    current.issuedValue += item.qty * item.price;
                }
            });
        });

        sales.filter(s => s.salesRepId === filters.salesRepId && s.status === 'approved' && filterByDate(s)).forEach(sale => {
            sale.items.forEach(item => {
                const current = itemMovements.get(item.id);
                const issueItem = issues.flatMap(i => i.items).find(i => i.id === item.id);
                const price = issueItem?.price || 0;
                if (current) {
                    current.sold += item.qty;
                    current.soldValue += item.qty * price; // Use price from issued doc for consistency
                }
            });
        });

        returns.filter(r => r.salesRepId === filters.salesRepId && filterByDate(r)).forEach(ret => {
            ret.items.forEach(item => {
                const current = itemMovements.get(item.id);
                const issueItem = issues.flatMap(i => i.items).find(i => i.id === item.id);
                const price = issueItem?.price || 0;
                 if (current) {
                    current.returned += item.qty;
                    current.returnedValue += item.qty * price;
                }
            });
        });
        
        const totalRemitted = remittances
            .filter(rem => rem.salesRepId === filters.salesRepId && filterByDate(rem))
            .reduce((sum, rem) => sum + rem.amount, 0);

        const inventory = Array.from(itemMovements.values())
            .filter(d => d.issued > 0 || d.sold > 0 || d.returned > 0)
            .map(d => ({
                ...d,
                balance: d.issued - d.sold - d.returned,
                balanceValue: d.issuedValue - d.soldValue - d.returnedValue,
            }));

        const totalSoldValue = inventory.reduce((sum, item) => sum + item.soldValue, 0);
        
        return { inventory, totalRemitted, totalSoldValue };

    }, [filters, issues, sales, returns, allItems, remittances]);
    

  return (
    <>
      <PageHeader title="تقرير حركة ومستحقات المندوب" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
            <CardHeader>
                <CardTitle>فلاتر البحث</CardTitle>
                <CardDescription>اختر المندوب والفترة الزمنية لعرض التقرير المفصل.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>تقرير حركة الأصناف</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="w-full overflow-auto border rounded-lg">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>الصنف</TableHead>
                        <TableHead className="text-center">كمية/قيمة مصروفة</TableHead>
                        <TableHead className="text-center">كمية/قيمة مباعة</TableHead>
                        <TableHead className="text-center">كمية/قيمة مرتجعة</TableHead>
                        <TableHead className="text-center font-bold">الرصيد لدى المندوب</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reportData.inventory.length > 0 ? reportData.inventory.map((item) => (
                        <TableRow key={item.name}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-center">{item.issued} / {item.issuedValue.toLocaleString()}</TableCell>
                            <TableCell className="text-center text-green-600">{item.sold} / {item.soldValue.toLocaleString()}</TableCell>
                            <TableCell className="text-center text-amber-600">{item.returned} / {item.returnedValue.toLocaleString()}</TableCell>
                            <TableCell className={`text-center font-bold ${item.balance < 0 ? 'text-destructive' : 'text-primary'}`}>
                                {item.balance} / {item.balanceValue.toLocaleString()}
                            </TableCell>
                        </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">لا توجد حركات للأصناف لهذا المندوب في الفترة المحددة.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    </Table>
                </div>
            </CardContent>
            </Card>

             <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>الملخص المالي للمندوب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                            <ShoppingCart className="h-6 w-6 text-green-500"/>
                            <span className="font-semibold">إجمالي قيمة المبيعات المعتمدة</span>
                        </div>
                        <span className="font-bold text-lg">{reportData.totalSoldValue.toLocaleString()} ج.م</span>
                    </div>
                     <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                            <Banknote className="h-6 w-6 text-blue-500"/>
                            <span className="font-semibold">إجمالي النقدية الموردة</span>
                        </div>
                        <span className="font-bold text-lg">{reportData.totalRemitted.toLocaleString()} ج.م</span>
                    </div>
                     <div className="flex items-center justify-between p-4 border rounded-lg bg-muted">
                        <div className="flex items-center gap-3">
                            <Coins className="h-6 w-6 text-destructive"/>
                            <span className="font-bold">الرصيد المستحق على المندوب</span>
                        </div>
                        <span className="font-bold text-xl text-destructive">{(reportData.totalSoldValue - reportData.totalRemitted).toLocaleString()} ج.م</span>
                    </div>
                </CardContent>
             </Card>

            </div>
        )}

      </main>
    </>
  );
}
