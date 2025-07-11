

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
  id: string; date: string; customerName: string; total: number; warehouseId: string; discount: number; invoiceNumber?: string;
  items: { qty: number; cost?: number; price: number }[];
}
interface PurchaseInvoice { id: string; date: string; supplierName: string; total: number; warehouseId: string; discount: number; invoiceNumber?: string; }
interface Expense { id: string; date: string; description: string; amount: number; warehouseId?: string; expenseType: string; paidFromAccountId: string; receiptNumber?: string;}
interface ExceptionalIncome { id: string; date: string; description: string; amount: number; warehouseId?: string; receiptNumber?: string; }
interface Warehouse { id: string; name: string; }
interface CashAccount { id: string; name: string; }
interface StockTransferRecord {
    id: string; date: string; fromSourceId: string; toSourceId: string; receiptNumber?: string;
    items: { id: string, name: string; qty: number, cost?:number }[];
}
interface Item {
    id: string;
    cost?: number;
    price: number;
}
interface TreasuryTransaction {
    id: string;
    date: string;
    type: 'deposit' | 'withdrawal';
    amount: number;
    accountId: string;
    description: string;
    receiptNumber?: string;
}
interface EmployeeAdvance {
    id: string;
    date: string;
    employeeId: string;
    amount: number;
    paidFromAccountId: string;
    receiptNumber?: string;
}
interface EmployeeAdjustment {
    id: string;
    date: string;
    employeeId: string;
    type: 'reward' | 'penalty';
    amount: number;
    description: string;
    receiptNumber?: string;
}
interface Employee {
    id: string;
    name: string;
}
interface SalesReturn {
    id: string;
    date: string;
    customerId: string;
    warehouseId: string;
    total: number;
    receiptNumber?: string;
    items: { id: string; name: string; qty: number; price: number; }[];
}
interface PurchaseReturn {
    id: string;
    date: string;
    supplierId: string;
    warehouseId: string;
    total: number;
    receiptNumber?: string;
    items: { id: string; name: string; qty: number; price: number; }[];
}
interface Customer {
    id: string;
    name: string;
}
interface Supplier {
    id: string;
    name: string;
}
interface SupplierPayment {
    id: string;
    date: string;
    amount: number;
    supplierId: string;
    paidFromAccountId: string;
    receiptNumber?: string;
}
interface CustomerPayment {
    id: string;
    date: string;
    amount: number;
    customerId: string;
    paidToAccountId: string;
    receiptNumber?: string;
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
    const { data: treasuryTxs, loading: l9 } = useFirebase<TreasuryTransaction>("treasuryTransactions");
    const { data: employeeAdvances, loading: l10 } = useFirebase<EmployeeAdvance>("employeeAdvances");
    const { data: employees, loading: l11 } = useFirebase<Employee>("employees");
    const { data: employeeAdjustments, loading: l12 } = useFirebase<EmployeeAdjustment>("employeeAdjustments");
    const { data: salesReturns, loading: l13 } = useFirebase<SalesReturn>("salesReturns");
    const { data: purchaseReturns, loading: l14 } = useFirebase<PurchaseReturn>("purchaseReturns");
    const { data: customers, loading: l15 } = useFirebase<Customer>("customers");
    const { data: suppliers, loading: l16 } = useFirebase<Supplier>("suppliers");
    const { data: supplierPayments, loading: l17 } = useFirebase<SupplierPayment>("supplierPayments");
    const { data: customerPayments, loading: l18 } = useFirebase<CustomerPayment>("customerPayments");


    const loading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9 || l10 || l11 || l12 || l13 || l14 || l15 || l16 || l17 || l18;
    
    const itemsMap = useMemo(() => {
        const map = new Map<string, Item>();
        itemsData.forEach(item => map.set(item.id, item));
        return map;
    }, [itemsData]);

    const journalEntries = useMemo(() => {
        const entries: any[] = [];
        const getWarehouseName = (id?: string) => warehouses.find(w => w.id === id)?.name || 'عام';
        const getCashAccountName = (id?: string) => cashAccounts.find(c => c.id === id)?.name || 'النقدية/البنك';
        const getEmployeeName = (id?: string) => employees.find(e => e.id === id)?.name || 'موظف غير معروف';
        const getCustomerName = (id?: string) => customers.find(c => c.id === id)?.name || 'عميل غير معروف';
        const getSupplierName = (id?: string) => suppliers.find(s => s.id === id)?.name || 'مورد غير معروف';
        
        // Sales Invoices
        sales.forEach(sale => {
            const costOfGoodsSold = sale.items.reduce((acc, item) => acc + (item.qty * (item.cost || item.price * 0.8)), 0);
            const totalBeforeDiscount = sale.total + (sale.discount || 0);
            const number = sale.invoiceNumber || `INV-${sale.id.slice(-4)}`;
            // Accounts Receivable (Debit) for the final amount owed
            entries.push({ id: `sale-ar-${sale.id}`, date: sale.date, warehouseId: sale.warehouseId, number: number, description: `فاتورة بيع للعميل ${sale.customerName}`, debit: sale.total, credit: 0, account: 'حسابات العملاء' });
            // Sales Discount (Debit) if a discount was given
            if (sale.discount > 0) {
                 entries.push({ id: `sale-discount-${sale.id}`, date: sale.date, warehouseId: sale.warehouseId, number: number, description: `خصم مسموح به على فاتورة بيع`, debit: sale.discount, credit: 0, account: 'خصم مسموح به' });
            }
            // Sales Revenue (Credit) for the full amount before discount
            entries.push({ id: `sale-rev-${sale.id}`, date: sale.date, warehouseId: sale.warehouseId, number: number, description: `إيرادات من فاتورة بيع`, debit: 0, credit: totalBeforeDiscount, account: 'إيرادات المبيعات' });
            // COGS entry
            entries.push({ id: `sale-cogs-${sale.id}`, date: sale.date, warehouseId: sale.warehouseId, number: number, description: `تكلفة بضاعة مباعة`, debit: costOfGoodsSold, credit: 0, account: 'تكلفة البضاعة المباعة' });
            entries.push({ id: `sale-inv-${sale.id}`, date: sale.date, warehouseId: sale.warehouseId, number: number, description: `تخفيض المخزون من ${getWarehouseName(sale.warehouseId)}`, debit: 0, credit: costOfGoodsSold, account: `مخزون - ${getWarehouseName(sale.warehouseId)}` });
        });

        // Purchase Invoices
        purchases.forEach(p => {
             const totalBeforeDiscount = p.total + (p.discount || 0);
             const number = p.invoiceNumber || `PUR-${p.id.slice(-4)}`;
            // Inventory (Debit) for the full value of goods
            entries.push({ id: `pur-inv-${p.id}`, date: p.date, warehouseId: p.warehouseId, number: number, description: `فاتورة شراء من ${p.supplierName}`, debit: totalBeforeDiscount, credit: 0, account: `مخزون - ${getWarehouseName(p.warehouseId)}` });
            // Accounts Payable (Credit) for the final amount owed
            entries.push({ id: `pur-ap-${p.id}`, date: p.date, warehouseId: p.warehouseId, number: number, description: `مستحقات للمورد ${p.supplierName}`, debit: 0, credit: p.total, account: 'حسابات الموردين' });
             // Purchase Discount (Credit) if a discount was received
            if (p.discount > 0) {
                 entries.push({ id: `pur-discount-${p.id}`, date: p.date, warehouseId: p.warehouseId, number: number, description: `خصم مكتسب على فاتورة شراء`, debit: 0, credit: p.discount, account: 'خصم مكتسب' });
            }
        });
        
        // Sales Returns
        salesReturns.forEach(sr => {
            const number = sr.receiptNumber || `S-RET-${sr.id.slice(-4)}`;
            const costOfGoodsReturned = sr.items.reduce((acc, item) => {
                 const itemMaster = itemsMap.get(item.id);
                 const itemCost = itemMaster?.cost || item.price * 0.8; // Fallback
                 return acc + (item.qty * itemCost);
            }, 0);
            entries.push({ id: `sal-ret-debit-${sr.id}`, date: sr.date, warehouseId: sr.warehouseId, number: number, description: `مرتجع مبيعات من ${getCustomerName(sr.customerId)}`, debit: sr.total, credit: 0, account: 'مرتجعات ومسموحات المبيعات' });
            entries.push({ id: `sal-ret-credit-${sr.id}`, date: sr.date, warehouseId: sr.warehouseId, number: number, description: `تخفيض مديونية العميل ${getCustomerName(sr.customerId)}`, debit: 0, credit: sr.total, account: 'حسابات العملاء' });
            // Return goods to inventory
            entries.push({ id: `sal-ret-inv-debit-${sr.id}`, date: sr.date, warehouseId: sr.warehouseId, number: number, description: `إعادة بضاعة إلى مخزن ${getWarehouseName(sr.warehouseId)}`, debit: costOfGoodsReturned, credit: 0, account: `مخزون - ${getWarehouseName(sr.warehouseId)}` });
            entries.push({ id: `sal-ret-inv-credit-${sr.id}`, date: sr.date, warehouseId: sr.warehouseId, number: number, description: `عكس تكلفة البضاعة المباعة`, debit: 0, credit: costOfGoodsReturned, account: 'تكلفة البضاعة المباعة' });
        });

        // Purchase Returns
        purchaseReturns.forEach(pr => {
             const number = pr.receiptNumber || `P-RET-${pr.id.slice(-4)}`;
             entries.push({ id: `pur-ret-debit-${pr.id}`, date: pr.date, warehouseId: pr.warehouseId, number: number, description: `تخفيض مستحقات المورد ${getSupplierName(pr.supplierId)}`, debit: pr.total, credit: 0, account: 'حسابات الموردين' });
             entries.push({ id: `pur-ret-credit-${pr.id}`, date: pr.date, warehouseId: pr.warehouseId, number: number, description: `مرتجع مشتريات إلى ${getSupplierName(pr.supplierId)}`, debit: 0, credit: pr.total, account: `مخزون - ${getWarehouseName(pr.warehouseId)}` });
        });


        // Expenses
        expenses.forEach(e => {
            const number = e.receiptNumber || `EXP-${e.id.slice(-4)}`;
            const expenseAccount = e.warehouseId && e.warehouseId !== 'none'
                ? `${e.expenseType} - ${getWarehouseName(e.warehouseId)}`
                : `${e.expenseType} (عام)`;
            const cashAccountName = getCashAccountName(e.paidFromAccountId)
            entries.push({ id: `exp-debit-${e.id}`, date: e.date, warehouseId: e.warehouseId, number: number, description: e.description, debit: e.amount, credit: 0, account: expenseAccount });
            entries.push({ id: `exp-credit-${e.id}`, date: e.date, warehouseId: e.warehouseId, number: number, description: `دفع من ${cashAccountName}`, debit: 0, credit: e.amount, account: cashAccountName });
        });
        
        // Exceptional Incomes
        exceptionalIncomes.forEach(i => {
            const number = i.receiptNumber || `INC-${i.id.slice(-4)}`;
            entries.push({ id: `ex-inc-debit-${i.id}`, date: i.date, warehouseId: i.warehouseId, number: number, description: i.description, debit: i.amount, credit: 0, account: 'النقدية/البنك' });
            entries.push({ id: `ex-inc-credit-${i.id}`, date: i.date, warehouseId: i.warehouseId, number: number, description: i.description, debit: 0, credit: i.amount, account: i.warehouseId ? `دخل استثنائي - ${getWarehouseName(i.warehouseId)}` : 'دخل استثنائي' });
        });

        // Stock Transfers
        transfers.forEach(t => {
            const number = t.receiptNumber || `TRN-${t.id.slice(-4)}`;
            const transferCost = t.items.reduce((acc, transferItem) => {
                const itemMaster = itemsMap.get(transferItem.id);
                // Use a fallback cost if not available
                const itemCost = transferItem.cost || itemMaster?.cost || itemMaster?.price || 0;
                return acc + (transferItem.qty * itemCost);
            }, 0);
            const fromWarehouseName = getWarehouseName(t.fromSourceId);
            const toWarehouseName = getWarehouseName(t.toSourceId);

            // Debit the receiving warehouse (asset increase)
            entries.push({ id: `trn-debit-${t.id}`, date: t.date, warehouseId: t.toSourceId, number: number, description: `تحويل من ${fromWarehouseName}`, debit: transferCost, credit: 0, account: `مخزون - ${toWarehouseName}` });
            // Credit the sending warehouse (asset decrease)
            entries.push({ id: `trn-credit-${t.id}`, date: t.date, warehouseId: t.fromSourceId, number: number, description: `تحويل إلى ${toWarehouseName}`, debit: 0, credit: transferCost, account: `مخزون - ${fromWarehouseName}` });
        });
        
        // Treasury Transactions
        treasuryTxs.forEach(tx => {
            const number = tx.receiptNumber || `TRX-${tx.id.slice(-4)}`;
            const accountName = getCashAccountName(tx.accountId);
            if(tx.type === 'deposit') {
                entries.push({ id: `trx-dep-debit-${tx.id}`, date: tx.date, warehouseId: undefined, number: number, description: `إيداع: ${tx.description}`, debit: tx.amount, credit: 0, account: accountName });
                entries.push({ id: `trx-dep-credit-${tx.id}`, date: tx.date, warehouseId: undefined, number: number, description: `إيداع: ${tx.description}`, debit: 0, credit: tx.amount, account: 'حساب وسيط للإيداع' });
            } else { // withdrawal
                 entries.push({ id: `trx-wit-debit-${tx.id}`, date: tx.date, warehouseId: undefined, number: number, description: `سحب: ${tx.description}`, debit: tx.amount, credit: 0, account: 'حساب وسيط للسحب' });
                 entries.push({ id: `trx-wit-credit-${tx.id}`, date: tx.date, warehouseId: undefined, number: number, description: `سحب: ${tx.description}`, debit: 0, credit: tx.amount, account: accountName });
            }
        });

        // Employee Advances
        employeeAdvances.forEach(adv => {
            const number = adv.receiptNumber || `ADV-${adv.id.slice(-4)}`;
            const employeeName = getEmployeeName(adv.employeeId);
            const cashAccountName = getCashAccountName(adv.paidFromAccountId);
            entries.push({ id: `adv-debit-${adv.id}`, date: adv.date, number: number, description: `سلفة للموظف ${employeeName}`, debit: adv.amount, credit: 0, account: 'سلف الموظفين' });
            entries.push({ id: `adv-credit-${adv.id}`, date: adv.date, number: number, description: `دفع من ${cashAccountName}`, debit: 0, credit: adv.amount, account: cashAccountName });
        });
        
        // Employee Adjustments (Rewards/Penalties)
        employeeAdjustments.forEach(adj => {
             const number = adj.receiptNumber || `ADJ-${adj.id.slice(-4)}`;
             const employeeName = getEmployeeName(adj.employeeId);
             if (adj.type === 'reward') {
                 entries.push({ id: `adj-rew-debit-${adj.id}`, date: adj.date, number: number, description: `مكافأة لـ ${employeeName}: ${adj.description}`, debit: adj.amount, credit: 0, account: 'مصروف مكافآت' });
                 entries.push({ id: `adj-rew-credit-${adj.id}`, date: adj.date, number: number, description: `استحقاق مكافأة لـ ${employeeName}`, debit: 0, credit: adj.amount, account: 'رواتب مستحقة' });
             } else { // penalty
                 entries.push({ id: `adj-pen-debit-${adj.id}`, date: adj.date, number: number, description: `خصم من ${employeeName}: ${adj.description}`, debit: adj.amount, credit: 0, account: 'رواتب مستحقة' });
                 entries.push({ id: `adj-pen-credit-${adj.id}`, date: adj.date, number: number, description: `إيراد جزاءات من ${employeeName}`, debit: 0, credit: adj.amount, account: 'إيرادات أخرى - جزاءات' });
             }
        });

        // Supplier Payments
        supplierPayments.forEach(p => {
            const number = p.receiptNumber || `PAY-${p.id.slice(-4)}`;
            entries.push({ id: `supp-pay-debit-${p.id}`, date: p.date, number: number, description: `سداد للمورد ${getSupplierName(p.supplierId)}`, debit: p.amount, credit: 0, account: 'حسابات الموردين' });
            entries.push({ id: `supp-pay-credit-${p.id}`, date: p.date, number: number, description: `دفع من ${getCashAccountName(p.paidFromAccountId)}`, debit: 0, credit: p.amount, account: getCashAccountName(p.paidFromAccountId) });
        });

        // Customer Payments
        customerPayments.forEach(p => {
            const number = p.receiptNumber || `REC-${p.id.slice(-4)}`;
            entries.push({ id: `cust-pay-debit-${p.id}`, date: p.date, number: number, description: `تحصيل من العميل ${getCustomerName(p.customerId)}`, debit: p.amount, credit: 0, account: getCashAccountName(p.paidToAccountId) });
            entries.push({ id: `cust-pay-credit-${p.id}`, date: p.date, number: number, description: `تخفيض مديونية العميل`, debit: 0, credit: p.amount, account: 'حسابات العملاء' });
        });


        return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [sales, purchases, expenses, exceptionalIncomes, transfers, warehouses, itemsMap, cashAccounts, treasuryTxs, employeeAdvances, employees, employeeAdjustments, salesReturns, purchaseReturns, customers, suppliers, supplierPayments, customerPayments]);

    const filteredEntries = journalEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        const from = filters.fromDate ? new Date(filters.fromDate) : null;
        const to = filters.toDate ? new Date(filters.toDate) : null;

        if (from && entryDate < from) return false;
        if (to && entryDate > to) return false;
        if (filters.warehouseId !== 'all' && entry.warehouseId !== filters.warehouseId && entry.warehouseId !== undefined) return false;

        return true;
    });
    
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
                                    <TableCell className="font-mono">{entry.number}</TableCell>
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

    
