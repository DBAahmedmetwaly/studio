
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
}
interface PurchaseInvoice {
  id: string;
  total: number;
  discount: number;
  paidAmount?: number;
  date: string;
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
}
interface PurchaseReturn {
    id: string;
    total: number;
    supplierId: string;
    date: string;
}


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
    const { customers, suppliers, partners, items, salesInvoices, purchaseInvoices, customerPayments, supplierPayments, salesReturns, purchaseReturns, loading } = useData();

    const { accountsReceivable, accountsPayable } = useMemo(() => {
        let ar = customers.reduce((acc: number, cust: any) => acc + (cust.openingBalance || 0), 0);
        let ap = suppliers.reduce((acc: number, sup: any) => acc + (sup.openingBalance || 0), 0);
        
        salesInvoices.filter((s:any) => s.status === 'approved').forEach((s:any) => ar += s.total);
        customerPayments.forEach((p:any) => ar -= p.amount);
        salesReturns.forEach((sr:any) => ar -= sr.total);
        
        purchaseInvoices.forEach((p:any) => ap += p.total);
        supplierPayments.forEach((p:any) => ap -= p.amount);
        purchaseReturns.forEach((pr:any) => ap -= pr.total);

        return { accountsReceivable: ar, accountsPayable: ap };
    }, [customers, suppliers, salesInvoices, purchaseInvoices, customerPayments, supplierPayments, salesReturns, purchaseReturns]);

    const totalCapital = partners.reduce((acc:number, p:any) => acc + (p.capital || 0), 0);
    // This is a simplified inventory valuation. A more accurate one would track purchases and sales of each item.
    const inventoryValue = items.reduce((acc:number, item:any) => acc + ((item.openingStock || 0) * (item.price || 0)), 0);

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
                            <TableCell>قيمة المخزون (كرصيد افتتاحي)</TableCell>
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
