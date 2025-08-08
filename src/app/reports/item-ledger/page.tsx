
"use client";

import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { useData } from "@/contexts/data-provider";
import { Loader2, Printer } from "lucide-react";
import React, { useState, useMemo } from "react";
import { Combobox } from "@/components/ui/combobox";

interface Item { id: string; name: string; }
interface Warehouse { id: string; name: string; }
interface SaleInvoice { id: string; invoiceNumber?: string; warehouseId: string; items: { id: string; qty: number; }[]; status?: 'approved' | 'pending'; date: string;}
interface PosSale { id: string; invoiceNumber?: string; warehouseId: string; items: { id: string; qty: number; }[]; date: string; }
interface StockInRecord { id: string; receiptNumber?: string; warehouseId: string; items: { itemId: string; qty: number; }[]; date: string; purchaseInvoiceId?: string;}
interface StockOutRecord { id: string; receiptNumber?: string; sourceId: string; items: { id: string; qty: number; }[]; reason?: string; saleInvoiceId?: string; date: string; }
interface StockTransferRecord { id: string; receiptNumber?: string; fromSourceId: string; toSourceId: string; items: { id: string; qty: number; }[]; date: string; }
interface StockAdjustmentRecord { id: string; receiptNumber?: string; warehouseId: string; items: { itemId:string; difference: number; }[]; date: string; }
interface SalesReturn { id: string; receiptNumber?: string; warehouseId: string; items: { id: string; qty: number; }[]; date: string; }
interface PurchaseReturn { id: string; receiptNumber?: string; warehouseId: string; items: { id: string; qty: number; }[]; date: string; }
interface IssueToRep { id: string; receiptNumber?: string; warehouseId: string; items: { id: string; qty: number; }[]; date: string; }
interface ReturnFromRep { id: string; receiptNumber?: string; warehouseId: string; items: { id: string; qty: number; }[]; date:string; }

export default function ItemLedgerPage() {
    const [filters, setFilters] = useState({
        itemId: "",
        warehouseId: "",
        fromDate: "",
        toDate: ""
    });
    const [reportData, setReportData] = useState<any[] | null>(null);
    const [openingBalance, setOpeningBalance] = useState(0);

    const { items, warehouses, salesInvoices, posSales, stockInRecords, stockOutRecords, stockTransferRecords, stockAdjustmentRecords, salesReturns, purchaseReturns, stockIssuesToReps, stockReturnsFromReps, loading } = useData();

    const itemOptions = React.useMemo(() => items.map((i: Item) => ({ value: i.id, label: i.name })), [items]);
    const warehouseOptions = React.useMemo(() => warehouses.map((w: Warehouse) => ({ value: w.id, label: w.name })), [warehouses]);

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({...prev, [key]: value}));
    };
    
    const handleGenerateReport = () => {
        if (!filters.itemId || !filters.warehouseId) {
            alert("يرجى اختيار صنف ومخزن.");
            return;
        }

        const { itemId, warehouseId, fromDate, toDate } = filters;
        const fromDateObj = fromDate ? new Date(fromDate) : null;
        if(fromDateObj) fromDateObj.setHours(0,0,0,0);
        
        // 1. Calculate Opening Balance
        let ob = 0;
        const filterBefore = (t: any) => fromDateObj ? new Date(t.date) < fromDateObj : false;

        stockInRecords.filter(t => t.warehouseId === warehouseId && filterBefore(t)).forEach(t => t.items.filter(i => i.itemId === itemId).forEach(i => ob += i.qty));
        stockTransferRecords.filter(t => t.toSourceId === warehouseId && filterBefore(t)).forEach(t => t.items.filter(i => i.id === itemId).forEach(i => ob += i.qty));
        salesReturns.filter(t => t.warehouseId === warehouseId && filterBefore(t)).forEach(t => t.items.filter(i => i.id === itemId).forEach(i => ob += i.qty));
        stockReturnsFromReps.filter(t => t.warehouseId === warehouseId && filterBefore(t)).forEach(t => t.items.filter(i => i.id === itemId).forEach(i => ob += i.qty));
        stockAdjustmentRecords.filter(t => t.warehouseId === warehouseId && filterBefore(t)).forEach(t => t.items.filter(i => i.itemId === itemId && i.difference > 0).forEach(i => ob += i.difference));
        
        stockOutRecords.filter(t => t.sourceId === warehouseId && filterBefore(t)).forEach(t => t.items.filter(i => i.id === itemId).forEach(i => ob -= i.qty));
        stockTransferRecords.filter(t => t.fromSourceId === warehouseId && filterBefore(t)).forEach(t => t.items.filter(i => i.id === itemId).forEach(i => ob -= i.qty));
        salesInvoices.filter(t => t.warehouseId === warehouseId && t.status === 'approved' && filterBefore(t)).forEach(t => t.items.filter(i => i.id === itemId).forEach(i => ob -= i.qty));
        posSales.filter(t => t.warehouseId === warehouseId && filterBefore(t)).forEach(t => t.items.filter(i => i.id === itemId).forEach(i => ob -= i.qty));
        purchaseReturns.filter(t => t.warehouseId === warehouseId && filterBefore(t)).forEach(t => t.items.filter(i => i.id === itemId).forEach(i => ob -= i.qty));
        stockIssuesToReps.filter(t => t.warehouseId === warehouseId && filterBefore(t)).forEach(t => t.items.filter(i => i.id === itemId).forEach(i => ob -= i.qty));
        stockAdjustmentRecords.filter(t => t.warehouseId === warehouseId && filterBefore(t)).forEach(t => t.items.filter(i => i.itemId === itemId && i.difference < 0).forEach(i => ob += i.difference)); // Difference is negative

        setOpeningBalance(ob);

        // 2. Collect Transactions for the period
        const allTransactions: any[] = [];
        const filterPeriod = (t: any) => {
            const itemDate = new Date(t.date);
            const toDateObj = toDate ? new Date(toDate) : null;
            if(toDateObj) toDateObj.setHours(23,59,59,999);
            if(fromDateObj && itemDate < fromDateObj) return false;
            if(toDateObj && itemDate > toDateObj) return false;
            return true;
        }

        stockInRecords.filter(t => t.warehouseId === warehouseId && filterPeriod(t)).forEach(t => t.items.filter(i => i.itemId === itemId).forEach(i => allTransactions.push({ date: t.date, type: 'استلام مخزني', ref: t.receiptNumber, incoming: i.qty, outgoing: 0 })));
        salesReturns.filter(t => t.warehouseId === warehouseId && filterPeriod(t)).forEach(t => t.items.filter(i => i.id === itemId).forEach(i => allTransactions.push({ date: t.date, type: 'مرتجع بيع', ref: t.receiptNumber, incoming: i.qty, outgoing: 0 })));
        stockReturnsFromReps.filter(t => t.warehouseId === warehouseId && filterPeriod(t)).forEach(t => t.items.filter(i => i.id === itemId).forEach(i => allTransactions.push({ date: t.date, type: 'مرتجع من مندوب', ref: t.receiptNumber, incoming: i.qty, outgoing: 0 })));
        stockAdjustmentRecords.filter(t => t.warehouseId === warehouseId && filterPeriod(t)).forEach(t => t.items.filter(i => i.itemId === itemId && i.difference > 0).forEach(i => allTransactions.push({ date: t.date, type: 'تسوية (زيادة)', ref: t.receiptNumber, incoming: i.difference, outgoing: 0 })));
        stockTransferRecords.filter(t => t.toSourceId === warehouseId && filterPeriod(t)).forEach(t => t.items.filter(i => i.id === itemId).forEach(i => allTransactions.push({ date: t.date, type: `تحويل من ${warehouses.find(w=>w.id===t.fromSourceId)?.name}`, ref: t.receiptNumber, incoming: i.qty, outgoing: 0 })));

        stockOutRecords.filter(t => t.sourceId === warehouseId && filterPeriod(t)).forEach(t => t.items.filter(i => i.id === itemId).forEach(i => allTransactions.push({ date: t.date, type: `صرف مخزني (${t.reason})`, ref: t.receiptNumber, incoming: 0, outgoing: i.qty })));
        salesInvoices.filter(t => t.warehouseId === warehouseId && t.status === 'approved' && filterPeriod(t)).forEach(t => t.items.filter(i => i.id === itemId).forEach(i => allTransactions.push({ date: t.date, type: 'فاتورة بيع', ref: t.invoiceNumber, incoming: 0, outgoing: i.qty })));
        posSales.filter(t => t.warehouseId === warehouseId && filterPeriod(t)).forEach(t => t.items.filter(i => i.id === itemId).forEach(i => allTransactions.push({ date: t.date, type: 'بيع نقاط بيع', ref: t.invoiceNumber, incoming: 0, outgoing: i.qty })));
        purchaseReturns.filter(t => t.warehouseId === warehouseId && filterPeriod(t)).forEach(t => t.items.filter(i => i.id === itemId).forEach(i => allTransactions.push({ date: t.date, type: 'مرتجع شراء', ref: t.receiptNumber, incoming: 0, outgoing: i.qty })));
        stockIssuesToReps.filter(t => t.warehouseId === warehouseId && filterPeriod(t)).forEach(t => t.items.filter(i => i.id === itemId).forEach(i => allTransactions.push({ date: t.date, type: 'صرف لمندوب', ref: t.receiptNumber, incoming: 0, outgoing: i.qty })));
        stockAdjustmentRecords.filter(t => t.warehouseId === warehouseId && filterPeriod(t)).forEach(t => t.items.filter(i => i.itemId === itemId && i.difference < 0).forEach(i => allTransactions.push({ date: t.date, type: 'تسوية (عجز)', ref: t.receiptNumber, incoming: 0, outgoing: Math.abs(i.difference) })));
        stockTransferRecords.filter(t => t.fromSourceId === warehouseId && filterPeriod(t)).forEach(t => t.items.filter(i => i.id === itemId).forEach(i => allTransactions.push({ date: t.date, type: `تحويل إلى ${warehouses.find(w=>w.id===t.toSourceId)?.name}`, ref: t.receiptNumber, incoming: 0, outgoing: i.qty })));

        allTransactions.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let runningBalance = ob;
        const finalReport = allTransactions.map(tx => {
            runningBalance = runningBalance + tx.incoming - tx.outgoing;
            return { ...tx, balance: runningBalance };
        });

        setReportData(finalReport);
    };
    
    const handlePrint = () => window.print();

    return (
        <>
            <PageHeader title="كارت حركة الصنف" />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                <Card className="no-print">
                    <CardHeader><CardTitle>فلاتر البحث</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2"><Label>الصنف</Label><Combobox options={itemOptions} value={filters.itemId} onValueChange={(v) => handleFilterChange("itemId", v)} placeholder="اختر صنفًا..." emptyMessage="لم يتم العثور على الصنف." /></div>
                            <div className="space-y-2"><Label>المخزن</Label><Combobox options={warehouseOptions} value={filters.warehouseId} onValueChange={(v) => handleFilterChange("warehouseId", v)} placeholder="اختر مخزنًا..." emptyMessage="لم يتم العثور على مخزن." /></div>
                            <div className="space-y-2"><Label>من تاريخ</Label><Input type="date" value={filters.fromDate} onChange={(e) => handleFilterChange("fromDate", e.target.value)} /></div>
                            <div className="space-y-2"><Label>إلى تاريخ</Label><Input type="date" value={filters.toDate} onChange={(e) => handleFilterChange("toDate", e.target.value)} /></div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleGenerateReport} disabled={loading || !filters.itemId || !filters.warehouseId}>
                            {loading ? <Loader2 className="animate-spin ml-2" /> : null}
                            عرض التقرير
                        </Button>
                    </CardFooter>
                </Card>

                {reportData && (
                    <Card className="printable-area">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>كارت حركة: {items.find(i => i.id === filters.itemId)?.name}</CardTitle>
                                <CardDescription>المخزن: {warehouses.find(w => w.id === filters.warehouseId)?.name} | الفترة: من {filters.fromDate || 'البداية'} إلى {filters.toDate || 'النهاية'}</CardDescription>
                            </div>
                            <Button variant="outline" size="icon" onClick={handlePrint} className="no-print"><Printer className="h-4 w-4" /></Button>
                        </CardHeader>
                        <CardContent>
                            <div className="w-full overflow-auto border rounded-lg">
                                <Table>
                                    <TableHeader><TableRow><TableHead>التاريخ</TableHead><TableHead>البيان</TableHead><TableHead>المرجع</TableHead><TableHead className="text-center">وارد</TableHead><TableHead className="text-center">صادر</TableHead><TableHead className="text-center">الرصيد</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        <TableRow className="bg-muted/50 font-medium"><TableCell colSpan={5}>رصيد أول الفترة</TableCell><TableCell className="text-center">{openingBalance.toLocaleString()}</TableCell></TableRow>
                                        {reportData.map((tx, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{new Date(tx.date).toLocaleDateString('ar-EG')}</TableCell>
                                                <TableCell>{tx.type}</TableCell>
                                                <TableCell>{tx.ref}</TableCell>
                                                <TableCell className="text-center text-green-600">{tx.incoming > 0 ? tx.incoming.toLocaleString() : '-'}</TableCell>
                                                <TableCell className="text-center text-destructive">{tx.outgoing > 0 ? tx.outgoing.toLocaleString() : '-'}</TableCell>
                                                <TableCell className="text-center font-semibold">{tx.balance.toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow className="bg-muted font-bold text-base"><TableCell colSpan={5}>الرصيد النهائي</TableCell><TableCell className="text-center">{reportData.at(-1)?.balance.toLocaleString() ?? openingBalance.toLocaleString()}</TableCell></TableRow>
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
