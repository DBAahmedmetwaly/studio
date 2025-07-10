
"use client";

import React, { useState, useMemo } from 'react';
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
} from "@/components/ui/table";
import useFirebase from "@/hooks/use-firebase";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface SaleInvoice {
  id: string; date: string; customerName: string; total: number; warehouseId: string;
  items: { qty: number; cost?: number; price: number }[];
}
interface PurchaseInvoice { id: string; date: string; supplierName: string; total: number; warehouseId: string; }
interface Expense { id: string; date: string; description: string; amount: number; warehouseId?: string; }
interface ExceptionalIncome { id: string; date: string; description: string; amount: number; }
interface Warehouse { id: string; name: string; }

export default function JournalPage() {
    const [filters, setFilters] = useState({
        warehouseId: "all",
        fromDate: "",
        toDate: ""
    });

    const { data: sales, loading: l1 } = useFirebase<SaleInvoice>("salesInvoices");
    const { data: purchases, loading: l2 } = useFirebase<PurchaseInvoice>("purchaseInvoices");
    const { data: expenses, loading: l3 } = useFirebase<Expense>("expenses");
    const { data: exceptionalIncomes, loading: l4 } = useFirebase<ExceptionalIncome>("exceptionalIncomes");
    const { data: warehouses, loading: l5 } = useFirebase<Warehouse>("warehouses");
    
    const loading = l1 || l2 || l3 || l4 || l5;

    const journalEntries = useMemo(() => {
        const entries: any[] = [];
        
        // Sales Invoices
        sales.forEach(sale => {
            const costOfGoodsSold = sale.items.reduce((acc, item) => acc + (item.qty * (item.cost || item.price * 0.8)), 0);
            entries.push({ id: `sale-ar-${sale.id}`, date: sale.date, warehouseId: sale.warehouseId, number: `INV-${sale.id.slice(-4)}`, description: `فاتورة بيع للعميل ${sale.customerName}`, debit: sale.total, credit: 0, account: 'حسابات العملاء' });
            entries.push({ id: `sale-rev-${sale.id}`, date: sale.date, warehouseId: sale.warehouseId, number: `INV-${sale.id.slice(-4)}`, description: `إيرادات من فاتورة بيع`, debit: 0, credit: sale.total, account: 'إيرادات المبيعات' });
            entries.push({ id: `sale-cogs-${sale.id}`, date: sale.date, warehouseId: sale.warehouseId, number: `INV-${sale.id.slice(-4)}`, description: `تكلفة بضاعة مباعة`, debit: costOfGoodsSold, credit: 0, account: 'تكلفة البضاعة المباعة' });
            entries.push({ id: `sale-inv-${sale.id}`, date: sale.date, warehouseId: sale.warehouseId, number: `INV-${sale.id.slice(-4)}`, description: `تخفيض المخزون`, debit: 0, credit: costOfGoodsSold, account: 'المخزون' });
        });

        // Purchase Invoices
        purchases.forEach(p => {
            entries.push({ id: `pur-inv-${p.id}`, date: p.date, warehouseId: p.warehouseId, number: `PUR-${p.id.slice(-4)}`, description: `فاتورة شراء من ${p.supplierName}`, debit: p.total, credit: 0, account: 'المخزون' });
            entries.push({ id: `pur-ap-${p.id}`, date: p.date, warehouseId: p.warehouseId, number: `PUR-${p.id.slice(-4)}`, description: `مستحقات للمورد ${p.supplierName}`, debit: 0, credit: p.total, account: 'حسابات الموردين' });
        });

        // Expenses
        expenses.forEach(e => {
            entries.push({ id: `exp-debit-${e.id}`, date: e.date, warehouseId: e.warehouseId, number: `EXP-${e.id.slice(-4)}`, description: e.description, debit: e.amount, credit: 0, account: 'مصروفات عمومية' });
            entries.push({ id: `exp-credit-${e.id}`, date: e.date, warehouseId: e.warehouseId, number: `EXP-${e.id.slice(-4)}`, description: `دفع مصروفات: ${e.description}`, debit: 0, credit: e.amount, account: 'النقدية/البنك' });
        });
        
        // Exceptional Incomes
        exceptionalIncomes.forEach(i => {
            entries.push({ id: `ex-inc-debit-${i.id}`, date: i.date, warehouseId: 'N/A', number: `INC-${i.id.slice(-4)}`, description: i.description, debit: i.amount, credit: 0, account: 'النقدية/البنك' });
            entries.push({ id: `ex-inc-credit-${i.id}`, date: i.date, warehouseId: 'N/A', number: `INC-${i.id.slice(-4)}`, description: i.description, debit: 0, credit: i.amount, account: 'دخل استثنائي' });
        });

        return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [sales, purchases, expenses, exceptionalIncomes]);

    const filteredEntries = useMemo(() => {
        return journalEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            const from = filters.fromDate ? new Date(filters.fromDate) : null;
            const to = filters.toDate ? new Date(filters.toDate) : null;

            if (from && entryDate < from) return false;
            if (to && entryDate > to) return false;
            if (filters.warehouseId !== 'all' && entry.warehouseId !== filters.warehouseId && entry.warehouseId !== 'N/A') return false;

            return true;
        });
    }, [journalEntries, filters]);
    
     const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({...prev, [key]: value}));
    }

  return (
    <>
      <PageHeader title="قيود اليومية" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
            <CardHeader>
                <CardTitle>فلاتر البحث</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                     <div className="space-y-2">
                        <Label>المخزن</Label>
                        <Select value={filters.warehouseId} onValueChange={(v) => handleFilterChange("warehouseId", v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر المخزن" />
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
        <Card>
          <CardHeader>
            <CardTitle>سجل قيود اليومية</CardTitle>
            <CardDescription>
              عرض لجميع قيود اليومية التي تم إنشاؤها تلقائيًا.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {loading ? (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[120px]">التاريخ</TableHead>
                        <TableHead className="w-[120px]">رقم القيد</TableHead>
                        <TableHead>البيان</TableHead>
                        <TableHead>الحساب</TableHead>
                        <TableHead className="text-center w-[150px]">مدين</TableHead>
                        <TableHead className="text-center w-[150px]">دائن</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredEntries.map((entry) => (
                         <TableRow key={entry.id}>
                            <TableCell>{new Date(entry.date).toLocaleDateString('ar-EG')}</TableCell>
                            <TableCell>{entry.number}</TableCell>
                            <TableCell>{entry.description}</TableCell>
                            <TableCell>{entry.account}</TableCell>
                            <TableCell className="text-center font-mono">{entry.debit > 0 ? entry.debit.toLocaleString() : '-'}</TableCell>
                            <TableCell className="text-center font-mono">{entry.credit > 0 ? entry.credit.toLocaleString() : '-'}</TableCell>
                        </TableRow>
                    ))}
                    {filteredEntries.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                                لا توجد قيود يومية تطابق الفلاتر المحددة.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
             </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
