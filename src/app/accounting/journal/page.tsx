
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
  id: string; date: string; customerName: string; total: number; warehouseId: string; discount: number;
  items: { qty: number; cost?: number; price: number }[];
}
interface PurchaseInvoice { id: string; date: string; supplierName: string; total: number; warehouseId: string; discount: number; }
interface Expense { id: string; date: string; description: string; amount: number; warehouseId?: string; expenseType: string; paidFromAccountId: string;}
interface ExceptionalIncome { id: string; date: string; description: string; amount: number; warehouseId?: string; }
interface Warehouse { id: string; name: string; }
interface CashAccount { id: string; name: string; }
interface StockTransferRecord {
    id: string; date: string; fromSourceId: string; toSourceId: string;
    items: { id: string, name: string; qty: number, cost?:number }[];
}
interface Item {
    id: string;
    cost?: number;
    price: number;
}


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
    const { data: transfers, loading: l6 } = useFirebase<StockTransferRecord>("stockTransferRecords");
    const { data: itemsData, loading: l7 } = useFirebase<Item>("items");
    const { data: cashAccounts, loading: l8 } = useFirebase<CashAccount>("cashAccounts");


    const loading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8;
    
    const itemsMap = useMemo(() => {
        const map = new Map<string, Item>();
        itemsData.forEach(item => map.set(item.id, item));
        return map;
    }, [itemsData]);

    const journalEntries = useMemo(() => {
        const entries: any[] = [];
        const getWarehouseName = (id?: string) => warehouses.find(w => w.id === id)?.name || 'عام';
        const getCashAccountName = (id?: string) => cashAccounts.find(c => c.id === id)?.name || 'النقدية/البنك';
        
        // Sales Invoices
        sales.forEach(sale => {
            const costOfGoodsSold = sale.items.reduce((acc, item) => acc + (item.qty * (item.cost || item.price * 0.8)), 0);
            const totalBeforeDiscount = sale.total + (sale.discount || 0);
            // Accounts Receivable (Debit) for the final amount owed
            entries.push({ id: `sale-ar-${sale.id}`, date: sale.date, warehouseId: sale.warehouseId, number: `INV-${sale.id.slice(-4)}`, description: `فاتورة بيع للعميل ${sale.customerName}`, debit: sale.total, credit: 0, account: 'حسابات العملاء' });
            // Sales Discount (Debit) if a discount was given
            if (sale.discount > 0) {
                 entries.push({ id: `sale-discount-${sale.id}`, date: sale.date, warehouseId: sale.warehouseId, number: `INV-${sale.id.slice(-4)}`, description: `خصم مسموح به على فاتورة بيع`, debit: sale.discount, credit: 0, account: 'خصم مسموح به' });
            }
            // Sales Revenue (Credit) for the full amount before discount
            entries.push({ id: `sale-rev-${sale.id}`, date: sale.date, warehouseId: sale.warehouseId, number: `INV-${sale.id.slice(-4)}`, description: `إيرادات من فاتورة بيع`, debit: 0, credit: totalBeforeDiscount, account: 'إيرادات المبيعات' });
            // COGS entry
            entries.push({ id: `sale-cogs-${sale.id}`, date: sale.date, warehouseId: sale.warehouseId, number: `INV-${sale.id.slice(-4)}`, description: `تكلفة بضاعة مباعة`, debit: costOfGoodsSold, credit: 0, account: 'تكلفة البضاعة المباعة' });
            entries.push({ id: `sale-inv-${sale.id}`, date: sale.date, warehouseId: sale.warehouseId, number: `INV-${sale.id.slice(-4)}`, description: `تخفيض المخزون من ${getWarehouseName(sale.warehouseId)}`, debit: 0, credit: costOfGoodsSold, account: `مخزون - ${getWarehouseName(sale.warehouseId)}` });
        });

        // Purchase Invoices
        purchases.forEach(p => {
             const totalBeforeDiscount = p.total + (p.discount || 0);
            // Inventory (Debit) for the full value of goods
            entries.push({ id: `pur-inv-${p.id}`, date: p.date, warehouseId: p.warehouseId, number: `PUR-${p.id.slice(-4)}`, description: `فاتورة شراء من ${p.supplierName}`, debit: totalBeforeDiscount, credit: 0, account: `مخزون - ${getWarehouseName(p.warehouseId)}` });
            // Accounts Payable (Credit) for the final amount owed
            entries.push({ id: `pur-ap-${p.id}`, date: p.date, warehouseId: p.warehouseId, number: `PUR-${p.id.slice(-4)}`, description: `مستحقات للمورد ${p.supplierName}`, debit: 0, credit: p.total, account: 'حسابات الموردين' });
             // Purchase Discount (Credit) if a discount was received
            if (p.discount > 0) {
                 entries.push({ id: `pur-discount-${p.id}`, date: p.date, warehouseId: p.warehouseId, number: `PUR-${p.id.slice(-4)}`, description: `خصم مكتسب على فاتورة شراء`, debit: 0, credit: p.discount, account: 'خصم مكتسب' });
            }
        });

        // Expenses
        expenses.forEach(e => {
            const expenseAccount = e.warehouseId && e.warehouseId !== 'none'
                ? `${e.expenseType} - ${getWarehouseName(e.warehouseId)}`
                : `${e.expenseType} (عام)`;
            entries.push({ id: `exp-debit-${e.id}`, date: e.date, warehouseId: e.warehouseId, number: `EXP-${e.id.slice(-4)}`, description: e.description, debit: e.amount, credit: 0, account: expenseAccount });
            entries.push({ id: `exp-credit-${e.id}`, date: e.date, warehouseId: e.warehouseId, number: `EXP-${e.id.slice(-4)}`, description: `دفع من ${getCashAccountName(e.paidFromAccountId)}`, debit: 0, credit: e.amount, account: getCashAccountName(e.paidFromAccountId) });
        });
        
        // Exceptional Incomes
        exceptionalIncomes.forEach(i => {
            entries.push({ id: `ex-inc-debit-${i.id}`, date: i.date, warehouseId: i.warehouseId, number: `INC-${i.id.slice(-4)}`, description: i.description, debit: i.amount, credit: 0, account: 'النقدية/البنك' });
            entries.push({ id: `ex-inc-credit-${i.id}`, date: i.date, warehouseId: i.warehouseId, number: `INC-${i.id.slice(-4)}`, description: i.description, debit: 0, credit: i.amount, account: i.warehouseId ? `دخل استثنائي - ${getWarehouseName(i.warehouseId)}` : 'دخل استثنائي' });
        });

        // Stock Transfers
        transfers.forEach(t => {
            const transferCost = t.items.reduce((acc, transferItem) => {
                const itemMaster = itemsMap.get(transferItem.id);
                // Use a fallback cost if not available
                const itemCost = transferItem.cost || itemMaster?.cost || itemMaster?.price || 0;
                return acc + (transferItem.qty * itemCost);
            }, 0);
            const fromWarehouseName = getWarehouseName(t.fromSourceId);
            const toWarehouseName = getWarehouseName(t.toSourceId);

            // Debit the receiving warehouse (asset increase)
            entries.push({ id: `trn-debit-${t.id}`, date: t.date, warehouseId: t.toSourceId, number: `TRN-${t.id.slice(-4)}`, description: `تحويل من ${fromWarehouseName}`, debit: transferCost, credit: 0, account: `مخزون - ${toWarehouseName}` });
            // Credit the sending warehouse (asset decrease)
            entries.push({ id: `trn-credit-${t.id}`, date: t.date, warehouseId: t.fromSourceId, number: `TRN-${t.id.slice(-4)}`, description: `تحويل إلى ${toWarehouseName}`, debit: 0, credit: transferCost, account: `مخزون - ${fromWarehouseName}` });
        });

        return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [sales, purchases, expenses, exceptionalIncomes, transfers, warehouses, itemsMap, cashAccounts]);

    const filteredEntries = useMemo(() => {
        return journalEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            const from = filters.fromDate ? new Date(filters.fromDate) : null;
            const to = filters.toDate ? new Date(filters.toDate) : null;

            if (from && entryDate < from) return false;
            if (to && entryDate > to) return false;
            if (filters.warehouseId !== 'all' && entry.warehouseId !== filters.warehouseId && entry.warehouseId !== undefined) return false;

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
                <div className="w-full overflow-auto border rounded-lg">
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
                                    <TableCell className="text-center font-mono">{entry.debit > 0 ? entry.debit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</TableCell>
                                    <TableCell className="text-center font-mono">{entry.credit > 0 ? entry.credit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</TableCell>
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
                </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
