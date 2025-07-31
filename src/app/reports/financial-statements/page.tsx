
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

// Interfaces for Firebase data
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
}
interface ExceptionalIncome {
    id: string;
    amount: number;
    date: string;
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
    date: string;
}
interface SupplierPayment {
    id: string;
    amount: number;
    supplierId: string;
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


// --- Financial Statement Components ---

function IncomeStatement() {
  const { salesInvoices, expenses, exceptionalIncomes, items, salesReturns, loading } = useData();

  const {
      grossRevenue,
      totalSalesReturns,
      totalSalesDiscount,
      costOfGoodsSold,
      totalExceptionalIncome,
      expensesByType,
      totalExpenses
  } = useMemo(() => {
      const approvedSales = salesInvoices.filter((s: SaleInvoice) => s.status === 'approved');
      
      const grossRevenue = approvedSales.reduce((acc, sale) => acc + (sale.subtotal || (sale.total + (sale.discount || 0))), 0);
      const totalSalesDiscount = approvedSales.reduce((acc, sale) => acc + (sale.discount || 0), 0);
      const totalSalesReturns = salesReturns.reduce((acc, ret) => acc + ret.total, 0);
      
      const costOfGoodsSold = approvedSales.reduce((acc, sale) => {
          return acc + (sale.items?.reduce((itemAcc, saleItem) => {
              const itemMaster = items.find((i:Item) => i.id === saleItem.id);
              // Ensure cost is a number, default to 0 if not present
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
      
      return { grossRevenue, totalSalesReturns, totalSalesDiscount, costOfGoodsSold, totalExceptionalIncome, expensesByType, totalExpenses };
  }, [salesInvoices, expenses, exceptionalIncomes, items, salesReturns]);

  
  const netRevenue = grossRevenue - totalSalesReturns - totalSalesDiscount;
  const grossProfit = netRevenue - costOfGoodsSold;
  const netOperatingIncome = grossProfit - totalExpenses;
  const netIncome = netOperatingIncome + totalExceptionalIncome;

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
        loading 
    } = useData();

    const { accountsReceivable, accountsPayable } = useMemo(() => {
        let ar = customers.reduce((acc: number, cust: any) => acc + (cust.openingBalance || 0), 0);
        let ap = suppliers.reduce((acc: number, sup: any) => acc + (sup.openingBalance || 0), 0);
        
        salesInvoices.filter((s:any) => s.status === 'approved').forEach((s:any) => {
            ar += s.total;
            ar -= (s.paidAmount || 0);
        });

        customerPayments.forEach((p:any) => ar -= p.amount);
        salesReturns.forEach((sr:any) => ar -= sr.total);
        
        purchaseInvoices.forEach((p:any) => {
            ap += p.total;
            ap -= (p.paidAmount || 0);
        });
        supplierPayments.forEach((p:any) => ap -= p.amount);
        purchaseReturns.forEach((pr:any) => ap -= pr.total);

        return { accountsReceivable: ar, accountsPayable: ap };
    }, [customers, suppliers, salesInvoices, purchaseInvoices, customerPayments, supplierPayments, salesReturns, purchaseReturns]);

    const totalCapital = partners.reduce((acc:number, p:any) => acc + (p.capital || 0), 0);
    
    const inventoryValue = useMemo(() => {
        let totalValue = 0;
        warehouses.forEach((warehouse: WarehouseData) => {
            allItems.forEach((item: Item) => {
                const closingsForWarehouse = inventoryClosings.filter((c: InventoryClosing) => c.warehouseId === warehouse.id);
                const lastClosing = closingsForWarehouse.length > 0 ? closingsForWarehouse.reduce((latest: any, current: any) => new Date(latest.closingDate) > new Date(current.closingDate) ? latest : current) : null;
                const lastClosingDate = lastClosing ? new Date(lastClosing.closingDate) : new Date(0);
                
                let stock = lastClosing?.balances.find((b: any) => b.itemId === item.id)?.balance || 0;
                
                const filterTransactions = (t: any) => new Date(t.date) > lastClosingDate;
                
                // --- Stock Calculation ---
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
                // --- End Stock Calculation ---

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
                    totalValue += stock * latestCost;
                }
            });
        });
        return totalValue;
    }, [allItems, warehouses, salesInvoices, purchaseInvoices, stockInRecords, stockOutRecords, stockTransferRecords, stockAdjustmentRecords, salesReturns, purchaseReturns, stockIssuesToReps, stockReturnsFromReps, inventoryClosings]);

    const totalAssets = accountsReceivable + inventoryValue; // Assuming cash is managed separately
    const totalLiabilities = accountsPayable;
    const totalEquity = totalCapital;
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
    const { customers, suppliers, partners, items, loading } = useData();
    
    const accountsReceivable = customers.reduce((acc: number, cust: any) => acc + (cust.openingBalance || 0), 0); // Debit
    const inventoryValue = items.reduce((acc: number, item: any) => acc + ((item.openingStock || 0) * (item.price || 0)), 0); // Debit
    const accountsPayable = suppliers.reduce((acc: number, sup: any) => acc + (sup.openingBalance || 0), 0); // Credit
    const totalCapital = partners.reduce((acc: number, p: any) => acc + (p.capital || 0), 0); // Credit

    const totalDebits = accountsReceivable + inventoryValue;
    const totalCredits = accountsPayable + totalCapital;

    if (loading) {
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
                <TableRow>
                    <TableCell>حسابات العملاء</TableCell>
                    <TableCell className="text-center">ج.م {accountsReceivable.toLocaleString()}</TableCell>
                    <TableCell className="text-center">-</TableCell>
                </TableRow>
                 <TableRow>
                    <TableCell>المخزون</TableCell>
                    <TableCell className="text-center">ج.م {inventoryValue.toLocaleString()}</TableCell>
                    <TableCell className="text-center">-</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>حسابات الموردين</TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-center">ج.م {accountsPayable.toLocaleString()}</TableCell>
                </TableRow>
                 <TableRow>
                    <TableCell>رأس المال</TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-center">ج.م {totalCapital.toLocaleString()}</TableCell>
                </TableRow>
            </TableBody>
            <TableFooter>
                 <TableRow className="bg-muted/50">
                    <TableHead>الإجمالي</TableHead>
                    <TableHead className="text-center font-bold">ج.م {totalDebits.toLocaleString()}</TableHead>
                    <TableHead className="text-center font-bold">ج.م {totalCredits.toLocaleString()}</TableHead>
                </TableRow>
                 <TableRow>
                    <TableCell colSpan={3} className={`text-center font-bold ${totalDebits === totalCredits ? 'text-green-600' : 'text-destructive'}`}>
                       {totalDebits === totalCredits ? 'ميزان المراجعة متوازن' : 'ميزان المراجعة غير متوازن'}
                    </TableCell>
                </TableRow>
            </TableFooter>
        </Table>
    )
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
