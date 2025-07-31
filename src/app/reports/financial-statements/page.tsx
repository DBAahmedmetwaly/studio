
"use client";

import PageHeader from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useData } from "@/contexts/data-provider";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";

// Data Interfaces
interface SaleInvoice {
  id: string;
  total: number;
  discount: number;
  status?: 'approved' | 'pending';
  items: { id: string; qty: number; cost?: number; price: number; }[];
  paidAmount?: number;
  date: string;
  subtotal: number;
  warehouseId: string;
}
interface PurchaseInvoice {
  id: string;
  total: number;
  discount: number;
  paidAmount?: number;
  date: string;
  warehouseId: string;
  items: { id: string; qty: number; cost?: number }[];
}
interface Expense {
  id: string;
  amount: number;
  expenseType: string;
  date: string;
  paidFromAccountId: string;
}
interface ExceptionalIncome {
    id: string;
    amount: number;
    date: string;
    paidToAccountId: string;
}
interface Customer {
  id: string;
  openingBalance: number;
}
interface Supplier {
  id: string;
  openingBalance: number;
}
interface Partner {
  id: string;
  capital: number;
}
interface Item {
    id: string;
    openingStock: number;
    price: number;
    cost?: number;
}
interface CustomerPayment {
    id: string;
    amount: number;
    customerId: string;
    paidToAccountId: string;
    date: string;
}
interface SupplierPayment {
    id: string;
    amount: number;
    supplierId: string;
    paidFromAccountId: string;
    date: string;
}
interface SalesReturn {
    id: string;
    total: number;
    customerId: string;
    date: string;
    warehouseId: string;
    items: { id: string; qty: number; }[];
}
interface PurchaseReturn {
    id: string;
    total: number;
    supplierId: string;
    date: string;
    warehouseId: string;
    items: { id: string; qty: number; }[];
}
interface StockInRecord { id: string; warehouseId: string; items: { id: string; name: string; qty: number; cost?: number; }[]; date: string;}
interface StockOutRecord { id: string; sourceId: string; items: { id: string; name: string; qty: number; }[]; date: string;}
interface StockTransferRecord { id: string; fromSourceId: string; toSourceId: string; items: { id: string; qty: number; }[]; date: string; }
interface StockAdjustmentRecord { id: string; warehouseId: string; items: { itemId: string; difference: number; }[]; date: string;}
interface IssueToRep { id: string; warehouseId: string; items: { id: string; qty: number; }[]; date: string; }
interface ReturnFromRep { id: string; warehouseId: string; items: { id: string; qty: number; }[]; date: string; }
interface WarehouseData { id: string; name: string; autoStockUpdate?: boolean; }
interface InventoryClosing { id: string; warehouseId: string; closingDate: string; balances: { itemId: string, balance: number }[] }
interface CashAccount {
    id: string;
    name: string;
    openingBalance: number;
}
interface TreasuryTransaction {
    id: string;
    type: 'deposit' | 'withdrawal';
    amount: number;
    accountId: string;
    date: string;
    linkedTransaction?: boolean;
}
interface EmployeeAdvance {
    id: string;
    amount: number;
    paidFromAccountId: string;
    date: string;
}
interface ProfitDistribution {
    id: string;
    amount: number;
    paidFromAccountId: string;
    date: string;
}

// --- Financial Statement Components ---

const useIncomeStatementData = () => {
  const { salesInvoices, expenses, exceptionalIncomes, items, salesReturns } = useData();

  return useMemo(() => {
    const approvedSales = salesInvoices.filter((s: SaleInvoice) => s.status === 'approved');
    
    const grossRevenue = approvedSales.reduce((acc, sale) => acc + (sale.subtotal || (sale.total + (sale.discount || 0))), 0);
    const totalSalesDiscount = approvedSales.reduce((acc, sale) => acc + (sale.discount || 0), 0);
    const totalSalesReturns = salesReturns.reduce((acc, ret) => acc + ret.total, 0);
    
    const costOfGoodsSold = approvedSales.reduce((acc, sale) => {
        return acc + (sale.items?.reduce((itemAcc, saleItem) => {
            const itemMaster = items.find((i:Item) => i.id === saleItem.id);
            const itemCost = typeof saleItem.cost === 'number' ? saleItem.cost : (typeof itemMaster?.cost === 'number' ? itemMaster.cost : 0);
            return itemAcc + (saleItem.qty * itemCost);
        }, 0) || 0);
    }, 0);

    const totalExceptionalIncome = exceptionalIncomes.reduce((acc, income) => acc + income.amount, 0);

    const expensesByType: { [key: string]: number } = {};
    expenses.forEach(expense => {
        expensesByType[expense.expenseType] = (expensesByType[expense.expenseType] || 0) + expense.amount;
    });
    const totalExpenses = Object.values(expensesByType).reduce((acc, amount) => acc + amount, 0);

    const netRevenue = grossRevenue - totalSalesReturns - totalSalesDiscount;
    const grossProfit = netRevenue - costOfGoodsSold;
    const netOperatingIncome = grossProfit - totalExpenses;
    const netIncome = netOperatingIncome + totalExceptionalIncome;
    
    return { grossRevenue, totalSalesReturns, totalSalesDiscount, costOfGoodsSold, totalExceptionalIncome, expensesByType, totalExpenses, netRevenue, grossProfit, netOperatingIncome, netIncome };
  }, [salesInvoices, expenses, exceptionalIncomes, items, salesReturns]);
};

function IncomeStatement() {
  const { loading } = useData();
  const {
      grossRevenue,
      totalSalesReturns,
      totalSalesDiscount,
      costOfGoodsSold,
      totalExceptionalIncome,
      expensesByType,
      netRevenue,
      grossProfit,
      netOperatingIncome,
      netIncome
  } = useIncomeStatementData();
  

  if (loading) {
    return <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Table>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">إجمالي الإيرادات (المبيعات)</TableCell>
          <TableCell className="text-left">ج.م {grossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="pl-8 text-muted-foreground">(-) مرتجعات ومسموحات المبيعات</TableCell>
          <TableCell className="text-left text-destructive">- ج.م {totalSalesReturns.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="pl-8 text-muted-foreground">(-) خصم مسموح به</TableCell>
          <TableCell className="text-left text-destructive">- ج.م {totalSalesDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
        </TableRow>
         <TableRow className="font-semibold border-t">
          <TableCell>صافي الإيرادات</TableCell>
          <TableCell className="text-left">ج.م {netRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">تكلفة البضاعة المباعة (COGS)</TableCell>
          <TableCell className="text-left text-destructive">- ج.م {costOfGoodsSold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
        </TableRow>
        <TableRow>
          <TableHead>مجمل الربح</TableHead>
          <TableHead className="text-left">ج.م {grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableHead>
        </TableRow>
        <TableRow>
            <TableCell colSpan={2} className="font-medium pt-4">المصروفات التشغيلية:</TableCell>
        </TableRow>
        {Object.entries(expensesByType).map(([type, amount]) => (
             <TableRow key={type}>
                <TableCell className="pl-8 text-muted-foreground">{type}</TableCell>
                <TableCell className="text-left text-destructive">- ج.م {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
            </TableRow>
        ))}
         <TableRow>
          <TableHead>صافي الدخل التشغيلي</TableHead>
          <TableHead className="text-left">ج.م {netOperatingIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableHead>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">الدخل الاستثنائي</TableCell>
          <TableCell className="text-left">ج.م {totalExceptionalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow className="bg-muted/50">
          <TableHead className="font-bold text-lg">صافي الدخل النهائي</TableHead>
          <TableHead className={`font-bold text-lg text-left ${netIncome >= 0 ? 'text-green-600' : 'text-destructive'}`}>
            ج.م {netIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </TableHead>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

function BalanceSheet() {
    const { 
        customers, suppliers, partners, items: allItems, salesInvoices, purchaseInvoices, 
        customerPayments, supplierPayments, salesReturns, purchaseReturns, 
        warehouses, stockInRecords, stockOutRecords, stockTransferRecords, stockAdjustmentRecords, 
        stockIssuesToReps, stockReturnsFromReps, inventoryClosings,
        cashAccounts, treasuryTransactions, expenses, exceptionalIncomes, employeeAdvances, profitDistributions,
        loading 
    } = useData();

    const { netIncome } = useIncomeStatementData();

    const { accountsReceivable, accountsPayable, cashAndEquivalents, inventoryValue } = useMemo(() => {
        let ar = customers.reduce((acc: number, cust: any) => acc + (cust.openingBalance || 0), 0);
        salesInvoices.filter((s:any) => s.status === 'approved').forEach((s:any) => {
            ar += s.total;
            ar -= s.paidAmount || 0;
        });
        customerPayments.forEach((p:any) => ar -= p.amount);
        salesReturns.forEach((sr:any) => ar -= sr.total);

        let ap = suppliers.reduce((acc: number, sup: any) => acc + (sup.openingBalance || 0), 0);
        purchaseInvoices.forEach((p:any) => {
            ap += p.total;
            ap -= p.paidAmount || 0;
        });
        supplierPayments.forEach((p:any) => ap -= p.amount);
        purchaseReturns.forEach((pr:any) => ap -= pr.total);
        
        // Cash calculation
        let cash = cashAccounts.reduce((acc: number, ca: any) => acc + (ca.openingBalance || 0), 0);
        customerPayments.forEach((p:any) => cash += p.amount);
        salesInvoices.filter((s:any) => s.status === 'approved').forEach((s:any) => cash += s.paidAmount || 0);
        exceptionalIncomes.forEach((i:any) => cash += i.amount);
        // Capital injections are not cash movements themselves but increases in equity, handled separately.
        // We only consider deposits that are NOT linked to internal transfers.
        treasuryTransactions.filter((tx:any) => tx.type === 'deposit' && !tx.linkedTransaction).forEach((tx:any) => cash += tx.amount);

        expenses.forEach((e:any) => cash -= e.amount);
        supplierPayments.forEach((p:any) => cash -= p.amount);
        purchaseInvoices.forEach((p:any) => cash -= p.paidAmount || 0);
        employeeAdvances.forEach((ea:any) => cash -= ea.amount);
        profitDistributions.forEach((pd:any) => cash -= pd.amount);
         // We only consider withdrawals that are NOT linked to internal transfers.
        treasuryTransactions.filter((tx:any) => tx.type === 'withdrawal' && !tx.linkedTransaction).forEach((tx:any) => cash -= tx.amount);

        // --- Inventory Value Calculation ---
        let totalInventoryValue = 0;
        warehouses.forEach((warehouse: WarehouseData) => {
            allItems.forEach((item: Item) => {
                const closingsForWarehouse = inventoryClosings.filter((c: InventoryClosing) => c.warehouseId === warehouse.id);
                const lastClosing = closingsForWarehouse.length > 0 ? closingsForWarehouse.reduce((latest: any, current: any) => new Date(latest.closingDate) > new Date(current.closingDate) ? latest : current) : null;
                const lastClosingDate = lastClosing ? new Date(lastClosing.closingDate) : new Date(0);
                
                let stock = lastClosing?.balances.find((b: any) => b.itemId === item.id)?.balance || 0;
                
                const filterTransactions = (t: any) => new Date(t.date) > lastClosingDate;
                
                const autoStockUpdate = warehouse?.autoStockUpdate;
                // Increases
                if (autoStockUpdate) {
                    purchaseInvoices.filter(p => p.warehouseId === warehouse.id && filterTransactions(p)).forEach(p => p.items.filter(i => i.id === item.id).forEach(i => stock += i.qty));
                }
                stockInRecords.filter(si => si.warehouseId === warehouse.id && filterTransactions(si)).forEach(si => si.items.filter(i => i.id === item.id).forEach(i => stock += i.qty));
                stockTransferRecords.filter(t => t.toSourceId === warehouse.id && filterTransactions(t)).forEach(t => t.items.filter(i => i.id === item.id).forEach(i => stock += i.qty));
                stockAdjustmentRecords.filter(adj => adj.warehouseId === warehouse.id && filterTransactions(adj)).forEach(adj => adj.items.filter(i => i.itemId === item.id && i.difference > 0).forEach(i => stock += i.difference));
                salesReturns.filter(sr => sr.warehouseId === warehouse.id && filterTransactions(sr)).forEach(sr => sr.items.filter(i => i.id === item.id).forEach(i => stock += i.qty));
                stockReturnsFromReps.filter(rfr => rfr.warehouseId === warehouse.id && filterTransactions(rfr)).forEach(rfr => rfr.items.filter(i => i.id === item.id).forEach(i => stock += i.qty));
                // Decreases
                salesInvoices.filter(s => s.warehouseId === warehouse.id && s.status === 'approved' && filterTransactions(s)).forEach(s => s.items.filter(i => i.id === item.id).forEach(i => stock -= i.qty));
                stockOutRecords.filter(so => so.sourceId === warehouse.id && filterTransactions(so)).forEach(so => so.items.filter(i => i.id === item.id).forEach(i => stock -= i.qty));
                stockTransferRecords.filter(t => t.fromSourceId === warehouse.id && filterTransactions(t)).forEach(t => t.items.filter(i => i.id === item.id).forEach(i => stock -= i.qty));
                stockAdjustmentRecords.filter(adj => adj.warehouseId === warehouse.id && filterTransactions(adj)).forEach(adj => adj.items.filter(i => i.itemId === item.id && i.difference < 0).forEach(i => stock += i.difference));
                purchaseReturns.filter(pr => pr.warehouseId === warehouse.id && filterTransactions(pr)).forEach(pr => pr.items.filter(i => i.id === item.id).forEach(i => stock -= i.qty));
                stockIssuesToReps.filter(itr => itr.warehouseId === warehouse.id && filterTransactions(itr)).forEach(itr => itr.items.filter(i => i.id === item.id).forEach(i => stock -= i.qty));

                if (stock > 0) {
                     const lastPurchase = purchaseInvoices.filter((p: PurchaseInvoice) => p.warehouseId === warehouse.id && p.items.some(pi => pi.id === item.id && typeof pi.cost === 'number')).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                     const lastStockIn = stockInRecords.filter((si: StockInRecord) => si.warehouseId === warehouse.id && si.items.some(si_item => si_item.id === item.id && typeof si_item.cost === 'number')).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                     let latestCost = item.cost || 0;
                     let lastPurchaseDate = lastPurchase ? new Date(lastPurchase.date) : new Date(0);
                     let lastStockInDate = lastStockIn ? new Date(lastStockIn.date) : new Date(0);

                     if (lastPurchaseDate > lastStockInDate) {
                         const purchasedItem = lastPurchase.items.find(pi => pi.id === item.id);
                         if (purchasedItem && typeof purchasedItem.cost === 'number') { latestCost = purchasedItem.cost; }
                     } else if (lastStockInDate > lastPurchaseDate) {
                         const stockInItem = lastStockIn.items.find(si_item => si_item.id === item.id);
                         if (stockInItem && typeof stockInItem.cost === 'number') { latestCost = stockInItem.cost; }
                     }
                    totalInventoryValue += stock * latestCost;
                }
            });
        });

        return { accountsReceivable: ar, accountsPayable: ap, cashAndEquivalents: cash, inventoryValue: totalInventoryValue };
    }, [customers, suppliers, salesInvoices, purchaseInvoices, customerPayments, supplierPayments, salesReturns, purchaseReturns, cashAccounts, treasuryTransactions, expenses, exceptionalIncomes, employeeAdvances, profitDistributions, allItems, warehouses, inventoryClosings, stockInRecords, stockOutRecords, stockTransferRecords, stockAdjustmentRecords, stockIssuesToReps, stockReturnsFromReps]);

    const totalCapital = partners.reduce((acc:number, p:any) => acc + (p.capital || 0), 0);
    const totalDistributions = profitDistributions.reduce((acc, d) => acc + d.amount, 0);
    
    const totalAssets = cashAndEquivalents + accountsReceivable + inventoryValue;
    const totalLiabilities = accountsPayable;
    const totalEquity = totalCapital + netIncome - totalDistributions;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    if (loading) {
        return <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="grid md:grid-cols-2 gap-8">
            {/* Assets */}
            <div>
                <h3 className="text-lg font-semibold mb-2 border-b pb-2">الأصول</h3>
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell>النقدية وما في حكمها</TableCell>
                            <TableCell className="text-left">ج.م {cashAndEquivalents.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>حسابات العملاء (الذمم المدينة)</TableCell>
                            <TableCell className="text-left">ج.م {accountsReceivable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                         <TableRow>
                            <TableCell>قيمة المخزون الحالية (بالتكلفة)</TableCell>
                            <TableCell className="text-left">ج.م {inventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                    </TableBody>
                    <TableFooter>
                        <TableRow className="bg-muted/50">
                            <TableHead>إجمالي الأصول</TableHead>
                            <TableHead className="text-left">ج.م {totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableHead>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>

            {/* Liabilities & Equity */}
            <div>
                <h3 className="text-lg font-semibold mb-2 border-b pb-2">الخصوم وحقوق الملكية</h3>
                 <Table>
                    <TableHeader><TableRow><TableHead>الخصوم</TableHead><TableHead></TableHead></TableRow></TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell>حسابات الموردين (الذمم الدائنة)</TableCell>
                            <TableCell className="text-left">ج.م {accountsPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                    </TableBody>
                    <TableFooter>
                         <TableRow className="bg-muted/50">
                            <TableHead>إجمالي الخصوم</TableHead>
                            <TableHead className="text-left">ج.م {totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableHead>
                        </TableRow>
                    </TableFooter>
                </Table>
                 <Table className="mt-4">
                    <TableHeader><TableRow><TableHead>حقوق الملكية</TableHead><TableHead></TableHead></TableRow></TableHeader>
                    <TableBody>
                         <TableRow>
                            <TableCell>رأس المال</TableCell>
                            <TableCell className="text-left">ج.م {totalCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                         <TableRow>
                            <TableCell>الأرباح المحتجزة (صافي الدخل)</TableCell>
                            <TableCell className="text-left">ج.م {netIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="pl-8 text-muted-foreground">(-) توزيعات الأرباح</TableCell>
                            <TableCell className="text-left text-destructive">- ج.م {totalDistributions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                    </TableBody>
                     <TableFooter>
                        <TableRow className="bg-muted/50">
                            <TableHead>إجمالي حقوق الملكية</TableHead>
                            <TableHead className="text-left">ج.م {totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableHead>
                        </TableRow>
                    </TableFooter>
                </Table>
                 <Table className="mt-4">
                    <TableFooter>
                        <TableRow className="bg-muted/50">
                            <TableHead>إجمالي الخصوم وحقوق الملكية</TableHead>
                            <TableHead className="text-left">ج.م {totalLiabilitiesAndEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableHead>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
        </div>
    )
}

function TrialBalance() {
    const allData = useData();
    const { journalEntries } = useJournalData(allData);

    const accountBalances = useMemo(() => {
        const balances: { [key: string]: { debit: number, credit: number } } = {};

        journalEntries.forEach(entry => {
            if (!balances[entry.account]) {
                balances[entry.account] = { debit: 0, credit: 0 };
            }
            balances[entry.account].debit += entry.debit;
            balances[entry.account].credit += entry.credit;
        });

        return Object.entries(balances).map(([account, { debit, credit }]) => {
            const balance = debit - credit;
            return {
                account,
                debit: balance > 0 ? balance : 0,
                credit: balance < 0 ? -balance : 0,
            };
        }).filter(item => item.debit !== 0 || item.credit !== 0);
    }, [journalEntries]);
    
    const totalDebits = accountBalances.reduce((sum, acc) => sum + acc.debit, 0);
    const totalCredits = accountBalances.reduce((sum, acc) => sum + acc.credit, 0);


    if (allData.loading) {
        return <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>الحساب</TableHead>
                    <TableHead className="text-center">مدين</TableHead>
                    <TableHead className="text-center">دائن</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {accountBalances.map(acc => (
                    <TableRow key={acc.account}>
                        <TableCell>{acc.account}</TableCell>
                        <TableCell className="text-center">{acc.debit > 0 ? acc.debit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</TableCell>
                        <TableCell className="text-center">{acc.credit > 0 ? acc.credit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
            <TableFooter>
                 <TableRow className="bg-muted/50">
                    <TableHead>الإجمالي</TableHead>
                    <TableHead className="text-center font-bold">ج.م {totalDebits.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableHead>
                    <TableHead className="text-center font-bold">ج.م {totalCredits.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableHead>
                </TableRow>
                 <TableRow>
                    <TableCell colSpan={3} className={`text-center font-bold ${Math.abs(totalDebits - totalCredits) < 0.01 ? 'text-green-600' : 'text-destructive'}`}>
                       {Math.abs(totalDebits - totalCredits) < 0.01 ? 'ميزان المراجعة متوازن' : 'ميزان المراجعة غير متوازن'}
                    </TableCell>
                </TableRow>
            </TableFooter>
        </Table>
    )
}

const useJournalData = (allData: any) => {
    const {
        salesInvoices, purchaseInvoices, expenses, exceptionalIncomes, warehouses,
        stockTransferRecords: transfers, items: itemsData, cashAccounts, treasuryTransactions: treasuryTxs,
        employeeAdvances, employees, employeeAdjustments, salesReturns, purchaseReturns,
        customers, suppliers, supplierPayments, customerPayments, stockOutRecords: stockOuts,
        profitDistributions, partners, stockInRecords,
    } = allData;
    
     const itemsMap = useMemo(() => {
        const map = new Map<string, Item>();
        itemsData.forEach((item:Item) => map.set(item.id, item));
        return map;
    }, [itemsData]);
    
    const journalEntries = useMemo(() => {
        const entries: any[] = [];
        const getWarehouseName = (id?: string) => warehouses.find((w:any) => w.id === id)?.name || 'غير معروف';
        const getCashAccountName = (id?: string) => cashAccounts.find((c:any) => c.id === id)?.name || 'النقدية/البنك';
        const getEmployeeName = (id?: string) => employees.find((e:any) => e.id === id)?.name || 'موظف غير معروف';
        const getCustomerName = (id?: string) => customers.find((c:any) => c.id === id)?.name || 'عميل غير معروف';
        const getSupplierName = (id?: string) => suppliers.find((s:any) => s.id === id)?.name || 'مورد غير معروف';
        const getPartnerName = (id?: string) => partners.find((p:any) => p.id === id)?.name || 'شريك غير معروف';
        
        // --- OPENING BALANCES ---
        customers.forEach((c:any) => { if(c.openingBalance > 0) entries.push({ account: 'حسابات العملاء', debit: c.openingBalance, credit: 0 }) });
        suppliers.forEach((s:any) => { if(s.openingBalance > 0) entries.push({ account: 'حسابات الموردين', credit: s.openingBalance, debit: 0 }) });
        cashAccounts.forEach((ca:any) => { if(ca.openingBalance > 0) entries.push({ account: ca.name, debit: ca.openingBalance, credit: 0 }) });
        partners.forEach((p:any) => { if(p.capital > 0) entries.push({ account: 'رأس المال', credit: p.capital, debit: 0 }) });

        // --- TRANSACTIONS ---
        
        // Sales Invoices
        salesInvoices.filter((s: SaleInvoice) => s.status === 'approved').forEach((sale:SaleInvoice) => {
            const totalBeforeDiscount = sale.subtotal || (sale.total + (sale.discount || 0));
            if(sale.discount > 0) entries.push({ account: 'خصم مسموح به', debit: sale.discount, credit: 0 });
            entries.push({ account: 'إيرادات المبيعات', credit: totalBeforeDiscount, debit: 0 });
            entries.push({ account: 'حسابات العملاء', debit: sale.total, credit: 0 });
            
            const cogs = sale.items.reduce((acc, i) => acc + (i.qty * (i.cost || 0)), 0);
            if(cogs > 0) {
                entries.push({ account: 'تكلفة البضاعة المباعة', debit: cogs, credit: 0 });
                entries.push({ account: `مخزون - ${getWarehouseName(sale.warehouseId)}`, credit: cogs, debit: 0 });
            }
             if (sale.paidAmount && sale.paidAmount > 0) {
                entries.push({ account: getCashAccountName(sale.paidToAccountId), debit: sale.paidAmount, credit: 0 });
                entries.push({ account: 'حسابات العملاء', credit: sale.paidAmount, debit: 0 });
            }
        });

        // Customer Payments (Separate)
        customerPayments.forEach((p:any) => {
            entries.push({ account: getCashAccountName(p.paidToAccountId), debit: p.amount, credit: 0 });
            entries.push({ account: 'حسابات العملاء', credit: p.amount, debit: 0 });
        });

        // Sales Returns
        salesReturns.forEach((sr:any) => {
            entries.push({ account: 'مرتجعات ومسموحات المبيعات', debit: sr.total, credit: 0 });
            entries.push({ account: 'حسابات العملاء', credit: sr.total, debit: 0 });
             const costOfGoodsReturned = sr.items.reduce((acc: number, item: any) => acc + (item.qty * (itemsMap.get(item.id)?.cost || 0)), 0);
             if (costOfGoodsReturned > 0) {
                 entries.push({ account: `مخزون - ${getWarehouseName(sr.warehouseId)}`, debit: costOfGoodsReturned, credit: 0 });
                 entries.push({ account: 'تكلفة البضاعة المباعة', credit: costOfGoodsReturned, debit: 0 });
             }
        });
        
        // Purchase Invoices
        purchaseInvoices.forEach((p:any) => {
            const totalBeforeDiscount = p.subtotal || (p.total + (p.discount || 0));
            entries.push({ account: 'المشتريات', debit: totalBeforeDiscount, credit: 0 });
            if(p.discount > 0) entries.push({ account: 'خصم مكتسب', credit: p.discount, debit: 0 });
            entries.push({ account: 'حسابات الموردين', credit: p.total, debit: 0 });

            if (p.paidAmount && p.paidAmount > 0) {
                entries.push({ account: 'حسابات الموردين', debit: p.paidAmount, credit: 0 });
                entries.push({ account: getCashAccountName(p.paidFromAccountId), credit: p.paidAmount, debit: 0 });
            }
        });
        
        // Stock In (for inventory accounting)
        stockInRecords.forEach((si:any) => {
             const stockInValue = si.items.reduce((acc:number, item:any) => acc + (item.qty * (item.cost || 0)), 0);
             if (stockInValue > 0) {
                 entries.push({ account: `مخزون - ${getWarehouseName(si.warehouseId)}`, debit: stockInValue, credit: 0 });
                 entries.push({ account: 'المشتريات', credit: stockInValue, debit: 0 });
             }
        });

        // Supplier Payments (Separate)
        supplierPayments.forEach((p:any) => {
            entries.push({ account: 'حسابات الموردين', debit: p.amount, credit: 0 });
            entries.push({ account: getCashAccountName(p.paidFromAccountId), credit: p.amount, debit: 0 });
        });
        
         // Expenses
        expenses.forEach((e:any) => {
             entries.push({ account: e.expenseType, debit: e.amount, credit: 0 });
             entries.push({ account: getCashAccountName(e.paidFromAccountId), credit: e.amount, debit: 0 });
        });
        
        // Incomes
        exceptionalIncomes.forEach((i:any) => {
            entries.push({ account: 'دخل استثنائي', credit: i.amount, debit: 0 });
            entries.push({ account: getCashAccountName(i.paidToAccountId), debit: i.amount, credit: 0 });
        });
        
        // Treasury Transactions
        treasuryTransactions.forEach((tx:TreasuryTransaction) => {
            if (tx.type === 'deposit' && !tx.linkedTransaction) {
                entries.push({ account: getCashAccountName(tx.accountId), debit: tx.amount, credit: 0 });
                entries.push({ account: 'رأس المال', credit: tx.amount, debit: 0 });
            } else if (tx.type === 'withdrawal' && !tx.linkedTransaction) {
                entries.push({ account: 'مسحوبات الشركاء', debit: tx.amount, credit: 0 });
                entries.push({ account: getCashAccountName(tx.accountId), credit: tx.amount, debit: 0 });
            }
        });

        // Profit Distribution
        profitDistributions.forEach((d:any) => {
             entries.push({ account: 'توزيعات أرباح', debit: d.amount, credit: 0 });
             entries.push({ account: getCashAccountName(d.paidFromAccountId), credit: d.amount, debit: 0 });
        });

        return entries;
    }, [allData]);

    return { journalEntries };
}


// --- Main Page Component ---

export default function FinancialStatementsPage() {
  return (
    <>
      <PageHeader title="القوائم المالية" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Tabs defaultValue="income-statement">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="income-statement">قائمة الدخل</TabsTrigger>
            <TabsTrigger value="balance-sheet">الميزانية العمومية</TabsTrigger>
            <TabsTrigger value="trial-balance">ميزان المراجعة</TabsTrigger>
          </TabsList>
          <TabsContent value="income-statement">
            <Card>
              <CardHeader>
                <CardTitle>قائمة الدخل</CardTitle>
                <CardDescription>
                  ملخص الإيرادات والمصروفات والأرباح لفترة معينة.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IncomeStatement />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="balance-sheet">
            <Card>
              <CardHeader>
                <CardTitle>الميزانية العمومية</CardTitle>
                <CardDescription>
                  لقطة عن الوضع المالي للشركة في تاريخ محدد.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BalanceSheet />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="trial-balance">
            <Card>
              <CardHeader>
                <CardTitle>ميزان المراجعة</CardTitle>
                <CardDescription>
                  ورقة عمل لجميع أرصدة دفتر الأستاذ للتحقق من التوازن الحسابي.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TrialBalance />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
