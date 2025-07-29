
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

interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  supplierId: string;
  total: number;
}

interface PurchaseReturn {
    id: string;
    receiptNumber?: string;
    date: string;
    supplierId: string;
    total: number;
}

interface SupplierPayment {
    id: string;
    receiptNumber?: string;
    date: string;
    supplierId: string;
    amount: number;
    notes?: string;
}

interface Supplier {
  id: string;
  name: string;
  openingBalance: number;
}

export default function SupplierStatementPage() {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [reportData, setReportData] = useState<any[] | null>(null);

  const { 
    suppliers, 
    purchaseInvoices: purchases, 
    supplierPayments: payments, 
    purchaseReturns, 
    loading 
  } = useData();
  
  const handleGenerateReport = () => {
    if (!selectedSupplierId) {
      alert("يرجى اختيار مورد");
      return;
    }

    const supplier = suppliers.find((s: Supplier) => s.id === selectedSupplierId);
    if (!supplier) return;

    const allTransactions: any[] = [];

    // Add opening balance as first transaction
    allTransactions.push({
      date: new Date(0), // for sorting
      sortDate: new Date(0),
      description: 'رصيد أول المدة',
      debit: 0, 
      credit: supplier.openingBalance > 0 ? supplier.openingBalance : 0,
    });
    
    // Add Purchases (Credit - we owe them)
    purchases
      .filter((p: PurchaseInvoice) => p.supplierId === selectedSupplierId)
      .forEach((purchase: PurchaseInvoice) => {
        allTransactions.push({
            date: new Date(purchase.date),
            sortDate: new Date(purchase.date),
            description: `فاتورة شراء رقم ${purchase.invoiceNumber || purchase.id.slice(-5)}`,
            debit: 0,
            credit: purchase.total
        });
      });

    // Add Purchase Returns (Debit - reduces what we owe)
    purchaseReturns
        .filter((pr: PurchaseReturn) => pr.supplierId === selectedSupplierId)
        .forEach((pr: PurchaseReturn) => {
            allTransactions.push({
                date: new Date(pr.date),
                sortDate: new Date(pr.date),
                description: `مرتجع مشتريات رقم ${pr.receiptNumber || pr.id.slice(-6).toUpperCase()}`,
                debit: pr.total,
                credit: 0,
            });
        });
      
    // Add Payments (Debit - reduces what we owe)
    payments
      .filter((p: SupplierPayment) => p.supplierId === selectedSupplierId)
      .forEach((payment: SupplierPayment) => {
        allTransactions.push({
            date: new Date(payment.date),
            sortDate: new Date(payment.date),
            description: `دفعة مسددة (سند: ${payment.receiptNumber || payment.id.slice(-5)}) ${payment.notes ? `(${payment.notes})` : ''}`,
            debit: payment.amount,
            credit: 0
        });
      });

    // Filter by date and sort
    const filteredAndSortedTransactions = allTransactions
        .filter(t => {
            const txDate = t.sortDate;
            const start = fromDate ? new Date(fromDate) : null;
            const end = toDate ? new Date(toDate) : null;
            if(start) start.setHours(0,0,0,0);
            if(end) end.setHours(23,59,59,999);
            if (txDate.getTime() === new Date(0).getTime()) return true; // always include opening balance
            if (start && txDate < start) return false;
            if (end && txDate > end) return false;
            return true;
        })
        .sort((a,b) => a.sortDate.getTime() - b.sortDate.getTime());
    
    // Calculate running balance
    let runningBalance = 0;
    const finalReport = filteredAndSortedTransactions.map(tx => {
        if (tx.description === 'رصيد أول المدة') {
            runningBalance = tx.credit;
        } else {
            runningBalance = runningBalance + tx.credit - tx.debit;
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
  
  return (
    <>
      <PageHeader title="كشف حساب الموردين" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card className="no-print">
            <CardHeader>
                <CardTitle>تحديد المورد والفترة</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Loader2 className="animate-spin" />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="supplier">المورد</Label>
                            <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر موردًا" />
                                </SelectTrigger>
                                <SelectContent>
                                    {suppliers.map((s: Supplier) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
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
                            <Button className="w-full" onClick={handleGenerateReport} disabled={!selectedSupplierId}>عرض التقرير</Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>

        {reportData && (
            <Card className="printable-area">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
                <div>
                    <CardTitle>كشف الحساب لـ: {suppliers.find((s: Supplier) => s.id === selectedSupplierId)?.name}</CardTitle>
                    <CardDescription>
                        عرض مفصل لمعاملات المورد من {fromDate || 'البداية'} إلى {toDate || 'النهاية'}.
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
                            <TableHead className="text-center">مدين (مدفوعات ومرتجعات)</TableHead>
                            <TableHead className="text-center">دائن (مشتريات)</TableHead>
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
                            <TableCell colSpan={4} className="text-base">الرصيد النهائي (مستحق للمورد)</TableCell>
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
