
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

interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  supplierId: string;
  total: number;
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

  const { data: suppliers, loading: loadingSuppliers } = useFirebase<Supplier>('suppliers');
  const { data: purchases, loading: loadingPurchases } = useFirebase<PurchaseInvoice>('purchaseInvoices');
  
  const loading = loadingSuppliers || loadingPurchases;

  const handleGenerateReport = () => {
    if (!selectedSupplierId) {
      alert("يرجى اختيار مورد");
      return;
    }

    const supplier = suppliers.find(s => s.id === selectedSupplierId);
    if (!supplier) return;

    // A positive opening balance for a supplier is a credit (we owe them)
    let balance = supplier.openingBalance || 0;
    const transactions = [];

    // Add opening balance as first transaction
    transactions.push({
      date: 'رصيد افتتاحي',
      description: 'رصيد أول المدة',
      debit: 0, // We don't owe them for opening balance in debit column
      credit: balance, // We owe them this amount
      balance: balance
    });
    
    const supplierPurchases = purchases
      .filter(p => p.supplierId === selectedSupplierId)
      .filter(p => {
        const purchaseDate = new Date(p.date);
        const start = fromDate ? new Date(fromDate) : null;
        const end = toDate ? new Date(toDate) : null;
        if (start && purchaseDate < start) return false;
        if (end && purchaseDate > end) return false;
        return true;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    supplierPurchases.forEach(purchase => {
      balance += purchase.total; // Our debt to supplier increases
      transactions.push({
        date: new Date(purchase.date).toLocaleDateString('ar-EG'),
        description: `فاتورة شراء رقم ${purchase.invoiceNumber || purchase.id}`,
        debit: 0,
        credit: purchase.total,
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
                                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
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
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>كشف الحساب لـ: {suppliers.find(s => s.id === selectedSupplierId)?.name}</CardTitle>
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
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>التاريخ</TableHead>
                            <TableHead>البيان</TableHead>
                            <TableHead className="text-center">مدين (مدفوعات)</TableHead>
                            <TableHead className="text-center">دائن (مشتريات)</TableHead>
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
                            <TableCell colSpan={4} className="font-bold">الرصيد النهائي (مستحق للمورد)</TableCell>
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
