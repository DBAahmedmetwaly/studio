

"use client";

import React, { useState, useMemo } from 'react';
import PageHeader from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useData } from '@/contexts/data-provider';

interface SaleInvoice {
  id: string; date: string; customerName: string; total: number; warehouseId: string; discount: number; invoiceNumber?: string;
  items: { id: string; qty: number; cost?: number; price: number }[];
  status?: 'pending' | 'approved';
  paidAmount?: number;
}
interface PurchaseInvoice { id: string; date: string; supplierName: string; total: number; warehouseId: string; discount: number; invoiceNumber?: string; paidAmount?: number; items: { id: string, name: string; qty: number, cost?:number }[];}
interface Expense { id: string; date: string; description: string; amount: number; warehouseId?: string; expenseType: string; paidFromAccountId: string; receiptNumber?: string;}
interface ExceptionalIncome { id: string; date: string; description: string; amount: number; warehouseId?: string; receiptNumber?: string; }
interface Warehouse { id: string; name: string; autoStockUpdate?: boolean; }
interface CashAccount { id: string; name: string; }
interface StockTransferRecord {
    id: string; date: string; fromSourceId: string; toSourceId: string; receiptNumber?: string;
    items: { id: string, name: string; qty: number, cost?:number }[];
}
interface StockOutRecord {
    id: string; date: string; sourceId: string; receiptNumber?: string; reason?: string;
    items: { id: string; name: string; qty: number, cost?:number }[];
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
    linkedTransaction?: boolean;
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
interface ProfitDistribution {
    id: string;
    date: string;
    amount: number;
    partnerId: string;
    paidFromAccountId: string;
    receiptNumber?: string;
}
interface Partner {
    id: string;
    name: string;
}


interface JournalEntry {
  id: string;
  date: string;
  warehouseId?: string;
  number: string;
  description: string;
  debit: number;
  credit: number;
  account: string;
}

interface GroupedJournalEntry {
    number: string;
    date: string;
    description: string;
    debits: { account: string; amount: number }[];
    credits: { account: string; amount: number }[];
    total: number;
}


export default function JournalPage() {
    const [filters, setFilters] = useState({
        warehouseId: "all",
        fromDate: "",
        toDate: ""
    });

    const {
        salesInvoices: sales,
        purchaseInvoices: purchases,
        expenses,
        exceptionalIncomes,
        warehouses,
        stockTransferRecords: transfers,
        items: itemsData,
        cashAccounts,
        treasuryTransactions: treasuryTxs,
        employeeAdvances,
        employees,
        employeeAdjustments,
        salesReturns,
        purchaseReturns,
        customers,
        suppliers,
        supplierPayments,
        customerPayments,
        stockOutRecords: stockOuts,
        profitDistributions,
        partners,
        loading
    } = useData();

    
    const itemsMap = useMemo(() => {
        const map = new Map<string, Item>();
        itemsData.forEach(item => map.set(item.id, item));
        return map;
    }, [itemsData]);

    const journalEntries = useMemo(() => {
        const entries: JournalEntry[] = [];
        const getWarehouse = (id?: string) => warehouses.find(w => w.id === id);
        const getCashAccountName = (id?: string) => cashAccounts.find(c => c.id === id)?.name || 'النقدية/البنك';
        const getEmployeeName = (id?: string) => employees.find(e => e.id === id)?.name || 'موظف غير معروف';
        const getCustomerName = (id?: string) => customers.find(c => c.id === id)?.name || 'عميل غير معروف';
        const getSupplierName = (id?: string) => suppliers.find(s => s.id === id)?.name || 'مورد غير معروف';
        const getPartnerName = (id?: string) => partners.find(p => p.id === id)?.name || 'شريك غير معروف';
        
        // Sales Invoices (Only approved ones)
        sales.filter(s => s.status === 'approved').forEach(sale => {
            const costOfGoodsSold = sale.items.reduce((acc, item) => acc + (item.qty * (item.cost || item.price * 0.8)), 0);
            const totalBeforeDiscount = sale.total + (sale.discount || 0);
            const number = sale.invoiceNumber || `ف-ب-${sale.id.slice(-4)}`;
            const warehouse = getWarehouse(sale.warehouseId);
            const amountDue = sale.total - (sale.paidAmount || 0);

            // Create debits
            if (sale.paidAmount && sale.paidAmount > 0) {
                 entries.push({ id: `sale-cash-${sale.id}`, date: sale.date, warehouseId: sale.warehouseId, number: number, description: `فاتورة بيع للعميل ${sale.customerName}`, debit: sale.paidAmount, credit: 0, account: 'النقدية' });
            }
             if (amountDue > 0) {
                 entries.push({ id: `sale-ar-${sale.id}`, date: sale.date, warehouseId: sale.warehouseId, number: number, description: `فاتورة بيع للعميل ${sale.customerName}`, debit: amountDue, credit: 0, account: 'حسابات العملاء' });
            }
            if (sale.discount > 0) {
                 entries.push({ id: `sale-discount-${sale.id}`, date: sale.date, warehouseId: sale.warehouseId, number: number, description: `خصم مسموح به على فاتورة بيع`, debit: sale.discount, credit: 0, account: 'خصم مسموح به' });
            }
            
            // Create credit
            entries.push({ id: `sale-rev-${sale.id}`, date: sale.date, warehouseId: sale.warehouseId, number: number, description: `إيرادات من فاتورة بيع`, debit: 0, credit: totalBeforeDiscount, account: 'إيرادات المبيعات' });
            
            // COGS entry only if warehouse is set to auto-update
            if (warehouse?.autoStockUpdate) {
                entries.push({ id: `sale-cogs-${sale.id}`, date: sale.date, warehouseId: sale.warehouseId, number: number, description: `تكلفة بضاعة مباعة`, debit: costOfGoodsSold, credit: 0, account: 'تكلفة البضاعة المباعة' });
                entries.push({ id: `sale-inv-${sale.id}`, date: sale.date, warehouseId: sale.warehouseId, number: number, description: `تخفيض المخزون من ${warehouse.name}`, debit: 0, credit: costOfGoodsSold, account: `مخزون - ${warehouse.name}` });
            }
        });

        // Purchase Invoices
        purchases.forEach(p => {
             const totalBeforeDiscount = p.total + (p.discount || 0);
             const number = p.invoiceNumber || `ف-ش-${p.id.slice(-4)}`;
             const warehouse = getWarehouse(p.warehouseId);
             const amountDue = p.total - (p.paidAmount || 0);

             // Debit inventory
             if(warehouse?.autoStockUpdate) {
                entries.push({ id: `pur-inv-${p.id}`, date: p.date, warehouseId: p.warehouseId, number: number, description: `فاتورة شراء من ${p.supplierName}`, debit: totalBeforeDiscount, credit: 0, account: `مخزون - ${warehouse.name}` });
             } else {
                 entries.push({ id: `pur-inv-generic-${p.id}`, date: p.date, warehouseId: p.warehouseId, number: number, description: `مشتريات لصالح مخزن ${warehouse?.name}`, debit: totalBeforeDiscount, credit: 0, account: 'المشتريات' });
             }

            // Create Credits
            if (p.paidAmount && p.paidAmount > 0) {
                 entries.push({ id: `pur-cash-${p.id}`, date: p.date, warehouseId: p.warehouseId, number: number, description: `دفع للمورد ${p.supplierName}`, debit: 0, credit: p.paidAmount, account: 'النقدية' });
            }
            if (amountDue > 0) {
                 entries.push({ id: `pur-ap-${p.id}`, date: p.date, warehouseId: p.warehouseId, number: number, description: `مستحقات للمورد ${p.supplierName}`, debit: 0, credit: amountDue, account: 'حسابات الموردين' });
            }
            if (p.discount > 0) {
                 entries.push({ id: `pur-discount-${p.id}`, date: p.date, warehouseId: p.warehouseId, number: number, description: `خصم مكتسب على فاتورة شراء`, debit: 0, credit: p.discount, account: 'خصم مكتسب' });
            }
        });
        
        // Sales Returns
        salesReturns.forEach(sr => {
            const number = sr.receiptNumber || `م-ب-${sr.id.slice(-4)}`;
            const warehouse = getWarehouse(sr.warehouseId);
            const costOfGoodsReturned = sr.items.reduce((acc, item) => {
                 const itemMaster = itemsMap.get(item.id);
                 const itemCost = itemMaster?.cost || item.price * 0.8; // Fallback
                 return acc + (item.qty * itemCost);
            }, 0);
            entries.push({ id: `sal-ret-debit-${sr.id}`, date: sr.date, warehouseId: sr.warehouseId, number: number, description: `مرتجع مبيعات من ${getCustomerName(sr.customerId)}`, debit: sr.total, credit: 0, account: 'مرتجعات ومسموحات المبيعات' });
            entries.push({ id: `sal-ret-credit-${sr.id}`, date: sr.date, warehouseId: sr.warehouseId, number: number, description: `تخفيض مديونية العميل ${getCustomerName(sr.customerId)}`, debit: 0, credit: sr.total, account: 'حسابات العملاء' });
            
            // Return goods to inventory only if warehouse is set to auto-update
            if (warehouse?.autoStockUpdate) {
                entries.push({ id: `sal-ret-inv-debit-${sr.id}`, date: sr.date, warehouseId: sr.warehouseId, number: number, description: `إعادة بضاعة إلى مخزن ${warehouse.name}`, debit: costOfGoodsReturned, credit: 0, account: `مخزون - ${warehouse.name}` });
                entries.push({ id: `sal-ret-inv-credit-${sr.id}`, date: sr.date, warehouseId: sr.warehouseId, number: number, description: `عكس تكلفة البضاعة المباعة`, debit: 0, credit: costOfGoodsReturned, account: 'تكلفة البضاعة المباعة' });
            }
        });

        // Purchase Returns
        purchaseReturns.forEach(pr => {
             const number = pr.receiptNumber || `م-ش-${pr.id.slice(-4)}`;
             const warehouse = getWarehouse(pr.warehouseId);
             entries.push({ id: `pur-ret-debit-${pr.id}`, date: pr.date, warehouseId: pr.warehouseId, number: number, description: `تخفيض مستحقات المورد ${getSupplierName(pr.supplierId)}`, debit: pr.total, credit: 0, account: 'حسابات الموردين' });
             
             // Credit inventory only if warehouse is set to auto-update
             if (warehouse?.autoStockUpdate) {
                 entries.push({ id: `pur-ret-credit-${pr.id}`, date: pr.date, warehouseId: pr.warehouseId, number: number, description: `مرتجع مشتريات إلى ${getSupplierName(pr.supplierId)}`, debit: 0, credit: pr.total, account: `مخزون - ${warehouse.name}` });
             } else {
                 entries.push({ id: `pur-ret-credit-generic-${pr.id}`, date: pr.date, warehouseId: pr.warehouseId, number: number, description: `مرتجع مشتريات إلى ${getSupplierName(pr.supplierId)}`, debit: 0, credit: pr.total, account: 'مرتجعات ومسموحات المشتريات' });
             }
        });


        // Expenses
        expenses.forEach(e => {
            const number = e.receiptNumber || `م-${e.id.slice(-4)}`;
            const warehouse = getWarehouse(e.warehouseId);
            const expenseAccount = e.warehouseId && e.warehouseId !== 'none'
                ? `${e.expenseType} - ${warehouse?.name}`
                : `${e.expenseType} (عام)`;
            const cashAccountName = getCashAccountName(e.paidFromAccountId)
            entries.push({ id: `exp-debit-${e.id}`, date: e.date, warehouseId: e.warehouseId, number: number, description: e.description, debit: e.amount, credit: 0, account: expenseAccount });
            entries.push({ id: `exp-credit-${e.id}`, date: e.date, warehouseId: e.warehouseId, number: number, description: `دفع من ${cashAccountName}`, debit: 0, credit: e.amount, account: cashAccountName });
        });
        
        // Exceptional Incomes
        exceptionalIncomes.forEach(i => {
            const number = i.receiptNumber || `إ-س-${i.id.slice(-4)}`;
            const warehouse = getWarehouse(i.warehouseId);
            entries.push({ id: `ex-inc-debit-${i.id}`, date: i.date, warehouseId: i.warehouseId, number: number, description: i.description, debit: i.amount, credit: 0, account: 'النقدية/البنك' });
            entries.push({ id: `ex-inc-credit-${i.id}`, date: i.date, warehouseId: i.warehouseId, number: number, description: i.description, debit: 0, credit: i.amount, account: i.warehouseId ? `دخل استثنائي - ${warehouse?.name}` : 'دخل استثنائي' });
        });

        // Stock Transfers
        transfers.forEach(t => {
            const number = t.receiptNumber || `إذ-ت-${t.id.slice(-4)}`;
            const transferCost = t.items.reduce((acc, transferItem) => {
                const itemMaster = itemsMap.get(transferItem.id);
                // Use a fallback cost if not available
                const itemCost = transferItem.cost || itemMaster?.cost || 0;
                return acc + (transferItem.qty * itemCost);
            }, 0);
            const fromWarehouseName = getWarehouse(t.fromSourceId)?.name || 'مخزن غير معروف';
            const toWarehouseName = getWarehouse(t.toSourceId)?.name || 'مخزن غير معروف';

            // Debit the receiving warehouse (asset increase)
            entries.push({ id: `trn-debit-${t.id}`, date: t.date, warehouseId: t.toSourceId, number: number, description: `تحويل من ${fromWarehouseName}`, debit: transferCost, credit: 0, account: `مخزون - ${toWarehouseName}` });
            // Credit the sending warehouse (asset decrease)
            entries.push({ id: `trn-credit-${t.id}`, date: t.date, warehouseId: t.fromSourceId, number: number, description: `تحويل إلى ${toWarehouseName}`, debit: 0, credit: transferCost, account: `مخزون - ${fromWarehouseName}` });
        });
        
         // Stock Outs (Damaged Goods)
        stockOuts.filter(so => so.reason === 'damaged').forEach(so => {
            const number = so.receiptNumber || `إذ-خ-${so.id.slice(-4)}`;
            const warehouse = getWarehouse(so.sourceId);
            const costOfDamagedGoods = so.items.reduce((acc, stockOutItem) => {
                 const itemMaster = itemsMap.get(stockOutItem.id);
                 const itemCost = stockOutItem.cost || itemMaster?.cost || 0;
                 return acc + (stockOutItem.qty * itemCost);
            }, 0);

            if (costOfDamagedGoods > 0 && warehouse) {
                 entries.push({ id: `so-damaged-debit-${so.id}`, date: so.date, warehouseId: so.sourceId, number: number, description: `بضاعة تالفة من مخزن ${warehouse.name}`, debit: costOfDamagedGoods, credit: 0, account: 'مصروف بضاعة تالفة' });
                 entries.push({ id: `so-damaged-credit-${so.id}`, date: so.date, warehouseId: so.sourceId, number: number, description: `تخفيض مخزون تالف`, debit: 0, credit: costOfDamagedGoods, account: `مخزون - ${warehouse.name}` });
            }
        });
        
        // Treasury Transactions
        treasuryTxs.forEach(tx => {
            const number = tx.receiptNumber || `ح-خ-${tx.id.slice(-4)}`;
            const accountName = getCashAccountName(tx.accountId);
            
            // For linked transactions (internal transfers), create a direct debit/credit
            if (tx.linkedTransaction) {
                if (tx.type === 'deposit') { // Deposit into main account
                    entries.push({ id: `trx-linked-dep-debit-${tx.id}`, date: tx.date, warehouseId: undefined, number: number, description: tx.description, debit: tx.amount, credit: 0, account: accountName });
                } else { // Withdrawal from rep account
                    entries.push({ id: `trx-linked-wit-credit-${tx.id}`, date: tx.date, warehouseId: undefined, number: number, description: tx.description, debit: 0, credit: tx.amount, account: accountName });
                }
            } else {
                // For regular deposits/withdrawals
                if (tx.type === 'deposit') {
                    entries.push({ id: `trx-dep-debit-${tx.id}`, date: tx.date, warehouseId: undefined, number: number, description: `إيداع: ${tx.description}`, debit: tx.amount, credit: 0, account: accountName });
                    entries.push({ id: `trx-dep-credit-${tx.id}`, date: tx.date, warehouseId: undefined, number: number, description: `إيداع: ${tx.description}`, debit: 0, credit: tx.amount, account: 'رأس المال' });
                } else { // withdrawal
                     entries.push({ id: `trx-wit-debit-${tx.id}`, date: tx.date, warehouseId: undefined, number: number, description: `سحب: ${tx.description}`, debit: tx.amount, credit: 0, account: 'مسحوبات الشركاء' });
                     entries.push({ id: `trx-wit-credit-${tx.id}`, date: tx.date, warehouseId: undefined, number: number, description: `سحب: ${tx.description}`, debit: 0, credit: tx.amount, account: accountName });
                }
            }
        });

        // Employee Advances
        employeeAdvances.forEach(adv => {
            const number = adv.receiptNumber || `س-م-${adv.id.slice(-4)}`;
            const employeeName = getEmployeeName(adv.employeeId);
            const cashAccountName = getCashAccountName(adv.paidFromAccountId);
            entries.push({ id: `adv-debit-${adv.id}`, date: adv.date, number: number, description: `سلفة للموظف ${employeeName}`, debit: adv.amount, credit: 0, account: 'سلف الموظفين' });
            entries.push({ id: `adv-credit-${adv.id}`, date: adv.date, number: number, description: `دفع من ${cashAccountName}`, debit: 0, credit: adv.amount, account: cashAccountName });
        });
        
        // Employee Adjustments (Rewards/Penalties)
        employeeAdjustments.forEach(adj => {
             const number = adj.receiptNumber || `ت-م-${adj.id.slice(-4)}`;
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
            const number = p.receiptNumber || `س-م-${p.id.slice(-4)}`;
            entries.push({ id: `supp-pay-debit-${p.id}`, date: p.date, number: number, description: `سداد للمورد ${getSupplierName(p.supplierId)}`, debit: p.amount, credit: 0, account: 'حسابات الموردين' });
            entries.push({ id: `supp-pay-credit-${p.id}`, date: p.date, number: number, description: `دفع من ${getCashAccountName(p.paidFromAccountId)}`, debit: 0, credit: p.amount, account: getCashAccountName(p.paidFromAccountId) });
        });

        // Customer Payments
        customerPayments.forEach(p => {
            const number = p.receiptNumber || `س-ع-${p.id.slice(-4)}`;
            entries.push({ id: `cust-pay-debit-${p.id}`, date: p.date, number: number, description: `تحصيل من العميل ${getCustomerName(p.customerId)}`, debit: p.amount, credit: 0, account: getCashAccountName(p.paidToAccountId) });
            entries.push({ id: `cust-pay-credit-${p.id}`, date: p.date, number: number, description: `تخفيض مديونية العميل`, debit: 0, credit: p.amount, account: 'حسابات العملاء' });
        });

        // Profit Distributions
        profitDistributions.forEach(d => {
            const number = d.receiptNumber || `ت-أ-${d.id.slice(-4)}`;
            const partnerName = getPartnerName(d.partnerId);
            const cashAccountName = getCashAccountName(d.paidFromAccountId);
            entries.push({ id: `dist-debit-${d.id}`, date: d.date, number: number, description: `توزيع أرباح للشريك ${partnerName}`, debit: d.amount, credit: 0, account: `توزيعات أرباح - ${partnerName}` });
            entries.push({ id: `dist-credit-${d.id}`, date: d.date, number: number, description: `دفع من ${cashAccountName}`, debit: 0, credit: d.amount, account: cashAccountName });
        });


        return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [sales, purchases, expenses, exceptionalIncomes, transfers, warehouses, itemsMap, cashAccounts, treasuryTxs, employeeAdvances, employees, employeeAdjustments, salesReturns, purchaseReturns, customers, suppliers, supplierPayments, customerPayments, stockOuts, profitDistributions, partners]);

    const filteredEntries = journalEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        const from = filters.fromDate ? new Date(filters.fromDate) : null;
        const to = filters.toDate ? new Date(filters.toDate) : null;

        if (from && entryDate < from) return false;
        if (to && entryDate > to) return false;
        if (filters.warehouseId !== 'all' && entry.warehouseId !== filters.warehouseId && entry.warehouseId !== undefined) return false;

        return true;
    });

    const groupedEntries = useMemo((): GroupedJournalEntry[] => {
        const groups: { [key: string]: GroupedJournalEntry } = {};

        filteredEntries.forEach(entry => {
            if (!groups[entry.number]) {
                groups[entry.number] = {
                    number: entry.number,
                    date: entry.date,
                    description: entry.description,
                    debits: [],
                    credits: [],
                    total: 0
                };
            }
            if (entry.debit > 0) {
                groups[entry.number].debits.push({ account: entry.account, amount: entry.debit });
                groups[entry.number].total += entry.debit;
            }
            if (entry.credit > 0) {
                groups[entry.number].credits.push({ account: entry.account, amount: entry.credit });
            }
        });
        
        return Object.values(groups).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [filteredEntries]);
    
     const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({...prev, [key]: value}));
    }

    const getReceiptTooltip = (receiptNumber?: string): string => {
        if (!receiptNumber) return "رقم مرجعي";
        const prefixes: Record<string, string> = {
            'ف-ب-': "فاتورة بيع",
            'ف-ش-': "فاتورة شراء",
            'م-ب-': "مرتجع بيع",
            'م-ش-': "مرتجع شراء",
            'إذ-د-': "إذن دخول مخزني",
            'إذ-خ-': "إذن صرف مخزني",
            'إذ-ت-': "إذن تحويل مخزني",
            'ت-م-': "تسوية مخزون / تسوية موظف",
            'ت-أ-': "توزيع أرباح",
            'م-': "مصروف",
            'إ-س-': "إيراد استثنائي",
            'س-ع-': "سند قبض عميل",
            'س-م-': "سند صرف مورد / سلفة موظف",
            'ح-خ-': "حركة خزينة",
        };

        for (const prefix in prefixes) {
            if (receiptNumber.startsWith(prefix)) {
                return prefixes[prefix];
            }
        }
        return "رقم مرجعي";
    }

  return (
    <TooltipProvider>
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
        <Tabs defaultValue="detailed-view">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="detailed-view">عرض تفصيلي</TabsTrigger>
                <TabsTrigger value="journal-view">عرض القيد المزدوج</TabsTrigger>
            </TabsList>
            <TabsContent value="detailed-view">
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
                        <div className="w-full overflow-auto">
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
                                            <TableCell className="font-mono">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span>{entry.number}</span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{getReceiptTooltip(entry.number)}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TableCell>
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
            </TabsContent>
            <TabsContent value="journal-view">
                 <Card>
                <CardHeader className="text-center">
                    <CardTitle>عرض القيد المزدوج</CardTitle>
                    <CardDescription>
                    عرض تقليدي لقيود اليومية (من ح/ ... إلى ح/ ...).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                         <div className="space-y-4 max-w-4xl mx-auto">
                            {groupedEntries.map(entry => (
                                <Card key={entry.number} className="w-full">
                                    <CardHeader className='pb-4'>
                                        <div className="flex justify-between items-baseline">
                                            <CardTitle className="text-base">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className='font-mono'>قيد رقم: #{entry.number}</span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{getReceiptTooltip(entry.number)}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </CardTitle>
                                            <span className='text-sm text-muted-foreground'>
                                                التاريخ: {new Date(entry.date).toLocaleDateString('ar-EG')}
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="w-full overflow-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>الحساب</TableHead>
                                                        <TableHead className="w-[150px] text-center">مدين</TableHead>
                                                        <TableHead className="w-[150px] text-center">دائن</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {entry.debits.map((d, i) => (
                                                        <TableRow key={`d-${i}`}>
                                                            <TableCell className="font-medium pr-6">{d.account}</TableCell>
                                                            <TableCell className="text-center font-mono">{d.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                                                            <TableCell className="text-center">-</TableCell>
                                                        </TableRow>
                                                    ))}
                                                        {entry.credits.map((c, i) => (
                                                        <TableRow key={`c-${i}`}>
                                                            <TableCell className="text-muted-foreground pr-10">{c.account}</TableCell>
                                                            <TableCell className="text-center">-</TableCell>
                                                            <TableCell className="text-center font-mono text-muted-foreground">{c.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                    <CardFooter className='pt-4'>
                                        <p className="text-xs text-muted-foreground">البيان: {entry.description}</p>
                                    </CardFooter>
                                </Card>
                            ))}
                             {groupedEntries.length === 0 && (
                                <div className="text-center text-muted-foreground py-10">
                                    لا توجد قيود يومية تطابق الفلاتر المحددة.
                                </div>
                            )}
                         </div>
                    )}
                </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </main>
    </>
    </TooltipProvider>
  );
}
