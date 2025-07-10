"use client";

import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import useFirebase from "@/hooks/use-firebase";
import { Loader2, Printer } from "lucide-react";
import React, { useState } from "react";

interface SaleInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerId: string;
  total: number;
}

interface Customer {
  id: string;
  name: string;
  openingBalance: number;
}

export default function CustomerStatementPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [reportData, setReportData] = useState<any[] | null>(null);

  const { data: customers, loading: loadingCustomers } = useFirebase<Customer>('customers');
  const { data: sales, loading: loadingSales } = useFirebase<SaleInvoice>('salesInvoices');
  
  const loading = loadingCustomers || loadingSales;

  const handleGenerateReport = () => {
    if (!selectedCustomerId) {
      alert("يرجى اختيار عميل");
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return;

    let balance = customer.openingBalance || 0;
    const transactions = [];

    // Add opening balance as first transaction
    transactions.push({
      date: 'رصيد افتتاحي',
      description: 'رصيد أول المدة',
      debit: balance > 0 ? balance : 0,
      credit: balance < 0 ? -balance : 0,
      balance: balance
    });
    
    const customerSales = sales
      .filter(s => s.customerId === selectedCustomerId)
      .filter(s => {
        const saleDate = new Date(s.date);
        const start = fromDate ? new Date(fromDate) : null;
        const end = toDate ? new Date(toDate) : null;
        if (start && saleDate < start) return false;
        if (end && saleDate > end) return false;
        return true;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    customerSales.forEach(sale => {
      balance += sale.total;
      transactions.push({
        date: new Date(sale.date).toLocaleDateString('ar-EG'),
        description: `فاتورة بيع رقم ${sale.invoiceNumber || sale.id}`,
        debit: sale.total,
        credit: 0,
        balance: balance
      });
    });

    setReportData(transactions);
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  return (
    <>
      <PageHeader title="كشف حساب العملاء" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card className="no-print">
            <CardHeader>
                <CardTitle>تحديد العميل والفترة</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Loader2 className="animate-spin" />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="customer">العميل</Label>
                            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر عميلاً" />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
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
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>كشف الحساب لـ: {customers.find(c => c.id === selectedCustomerId)?.name}</CardTitle>
                    <CardDescription>
                        عرض مفصل لمعاملات العميل من {fromDate || 'البداية'} إلى {toDate || 'النهاية'}.
                    </CardDescription>
                </div>
                <Button variant="outline" size="icon" onClick={handlePrint} className="no-print">
                    <Printer className="h-4 w-4" />
                    <span className="sr-only">طباعة</span>
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>التاريخ</TableHead>
                            <TableHead>البيان</TableHead>
                            <TableHead className="text-center">مدين</TableHead>
                            <TableHead className="text-center">دائن</TableHead>
                            <TableHead className="text-center">الرصيد</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reportData.map((tx, index) => (
                            <TableRow key={index}>
                                <TableCell>{tx.date}</TableCell>
                                <TableCell>{tx.description}</TableCell>
                                <TableCell className="text-center">{tx.debit > 0 ? tx.debit.toLocaleString() : '-'}</TableCell>
                                <TableCell className="text-center">{tx.credit > 0 ? tx.credit.toLocaleString() : '-'}</TableCell>
                                <TableCell className="text-center font-medium">{tx.balance.toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={4} className="font-bold">الرصيد النهائي</TableCell>
                            <TableCell className="text-center font-bold">{reportData.at(-1)?.balance.toLocaleString()}</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </CardContent>
            </Card>
        )}
      </main>
    </>
  );
}
