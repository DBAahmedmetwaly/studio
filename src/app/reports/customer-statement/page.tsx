
"use client";

import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { useData } from "@/contexts/data-provider";
import { Loader2, Printer } from "lucide-react";
import React, { useState } from "react";

interface SaleInvoice {
  id: string;
  invoiceNumber?: string;
  date: string;
  customerId: string;
  total: number;
  paidAmount?: number;
  status?: 'pending' | 'approved';
}
interface SalesReturn {
    id: string;
    receiptNumber?: string;
    date: string;
    customerId: string;
    total: number;
}

interface Customer {
  id:string;
  name: string;
  openingBalance: number;
}

interface CustomerPayment {
    id: string;
    receiptNumber?: string;
    date: string;
    customerId: string;
    amount: number;
    notes?: string;
}

export default function CustomerStatementPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [reportData, setReportData] = useState<any[] | null>(null);

  const { customers, salesInvoices, customerPayments, salesReturns, loading } = useData();
  
  const handleGenerateReport = () => {
    if (!selectedCustomerId) {
      alert("يرجى اختيار عميل");
      return;
    }

    const customer = customers.find((c: Customer) => c.id === selectedCustomerId);
    if (!customer) return;

    const allTransactions: any[] = [];

    // Add opening balance as first transaction
    allTransactions.push({
      date: new Date(0), // for sorting
      sortDate: new Date(0),
      description: 'رصيد أول المدة',
      debit: customer.openingBalance > 0 ? customer.openingBalance : 0,
      credit: 0,
    });
    
    // Add Sales Invoices (Debit)
    salesInvoices
      .filter((s: SaleInvoice) => s.customerId === selectedCustomerId && s.status === 'approved')
      .forEach((sale: SaleInvoice) => {
        // Add the invoice total as a debit
        allTransactions.push({
            date: new Date(sale.date),
            sortDate: new Date(sale.date),
            description: `فاتورة بيع رقم ${sale.invoiceNumber || sale.id.slice(-6).toUpperCase()}`,
            debit: sale.total,
            credit: 0,
        });
        
        // Add the initial payment on the invoice as a credit
        if (sale.paidAmount && sale.paidAmount > 0) {
           allTransactions.push({
                date: new Date(sale.date),
                sortDate: new Date(sale.date), // Use same date for sorting
                description: `دفعة مقدمة على فاتورة ${sale.invoiceNumber || sale.id.slice(-6).toUpperCase()}`,
                debit: 0,
                credit: sale.paidAmount,
            });
        }
    });
    
    // Add Sales Returns (Credit)
    salesReturns
        .filter((sr: SalesReturn) => sr.customerId === selectedCustomerId)
        .forEach((sr: SalesReturn) => {
            allTransactions.push({
                date: new Date(sr.date),
                sortDate: new Date(sr.date),
                description: `مرتجع مبيعات رقم ${sr.receiptNumber || sr.id.slice(-6).toUpperCase()}`,
                debit: 0,
                credit: sr.total,
            });
        });

    // Add separate Customer Payments (Credit)
    customerPayments
      .filter((p: CustomerPayment) => p.customerId === selectedCustomerId)
      .forEach((payment: CustomerPayment) => {
          allTransactions.push({
              date: new Date(payment.date),
              sortDate: new Date(payment.date),
              description: `سند قبض رقم ${payment.receiptNumber || payment.id.slice(-6).toUpperCase()} ${payment.notes ? `(${payment.notes})` : ''}`,
              debit: 0,
              credit: payment.amount,
          });
      });

    const filteredAndSortedTransactions = allTransactions
        .filter(t => {
            const txDate = t.sortDate;
            const start = fromDate ? new Date(fromDate) : null;
            const end = toDate ? new Date(toDate) : null;
            if (txDate.getTime() === new Date(0).getTime()) return true; // always include opening balance
            if (start) start.setHours(0,0,0,0);
            if (end) end.setHours(23,59,59,999);
            if (start && txDate < start) return false;
            if (end && txDate > end) return false;
            return true;
        })
        .sort((a,b) => a.sortDate.getTime() - b.sortDate.getTime());

    let runningBalance = 0;
    const finalReport = filteredAndSortedTransactions.map(tx => {
        if (tx.description === 'رصيد أول المدة') {
            runningBalance = tx.debit;
        } else {
            runningBalance = runningBalance + tx.debit - tx.credit;
        }
        return {
            ...tx,
            date: tx.sortDate.getTime() === new Date(0).getTime() ? 'رصيد افتتاحي' : tx.date.toLocaleDateString('ar-EG'),
            balance: runningBalance
        }
    })

    setReportData(finalReport);
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const getSelectedCustomer = () => customers.find((c: Customer) => c.id === selectedCustomerId);

  return (
    <>
      <PageHeader title="كشف حساب العملاء" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card className="no-print">
            <CardHeader>
                <CardTitle>تحديد العميل والفترة</CardTitle>
                <CardDescription>اختر العميل والفترة الزمنية لعرض كشف الحساب.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="mr-2">جارٍ تحميل البيانات...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="customer">العميل</Label>
                            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر عميلاً" />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.map((c: Customer) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="from-date">من تاريخ</Label>
                            <Input id="from-date" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="to-date">إلى تاريخ</Label>
                            <Input id="to-date" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
                        </div>
                        <div className="flex items-end">
                            <Button className="w-full" onClick={handleGenerateReport} disabled={!selectedCustomerId}>عرض التقرير</Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>

        {reportData && (
            <Card className="printable-area">
            <CardHeader className="flex flex-row items-center justify-between border-b mb-4 pb-4">
                <div>
                    <CardTitle>كشف حساب العميل: {getSelectedCustomer()?.name}</CardTitle>
                    <CardDescription>
                        عرض مفصل لمعاملات العميل من {fromDate ? new Date(fromDate).toLocaleDateString('ar-EG') : 'البداية'} إلى {toDate ? new Date(toDate).toLocaleDateString('ar-EG') : 'النهاية'}.
                    </CardDescription>
                </div>
                <Button variant="outline" size="icon" onClick={handlePrint} className="no-print">
                    <Printer className="h-4 w-4" />
                    <span className="sr-only">طباعة</span>
                </Button>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-auto border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>التاريخ</TableHead>
                            <TableHead>البيان</TableHead>
                            <TableHead className="text-center">مدين (فواتير)</TableHead>
                            <TableHead className="text-center">دائن (دفعات ومرتجعات)</TableHead>
                            <TableHead className="text-center">الرصيد</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reportData.map((tx, index) => (
                            <TableRow key={index}>
                                <TableCell>{tx.date}</TableCell>
                                <TableCell>{tx.description}</TableCell>
                                <TableCell className="text-center">{tx.debit > 0 ? tx.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</TableCell>
                                <TableCell className="text-center">{tx.credit > 0 ? tx.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</TableCell>
                                <TableCell className="text-center font-medium">{tx.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow className="bg-muted/50 font-bold">
                            <TableCell colSpan={4} className="text-base">الرصيد النهائي</TableCell>
                            <TableCell className="text-center text-base">{reportData.at(-1)?.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
              </div>
            </CardContent>
            </Card>
        )}
      </main>
    </>
  );
}
