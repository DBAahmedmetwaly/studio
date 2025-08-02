

"use client";

import React, { useState, useMemo, useEffect } from "react";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useData } from "@/contexts/data-provider";
import { Loader2, Printer, BarChart2, TrendingDown, TrendingUp, Coins, Percent } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Combobox } from "@/components/ui/combobox";
import { Badge } from "@/components/ui/badge";

// Data Interfaces
interface Item { id: string; name: string; unit: string; price: number; reorderPoint?: number; code?: string; cost?: number; }
interface Warehouse { id: string; name: string; autoStockUpdate?: boolean; }
interface SaleInvoice { id: string; invoiceNumber: string; warehouseId: string; items: { id: string; qty: number; }[]; status?: 'approved' | 'pending'; date: string;}
interface PurchaseInvoice { id: string; invoiceNumber: string; warehouseId: string; items: { id: string; qty: number; }[]; date: string; }
interface StockInRecord { id: string; receiptNumber: string; warehouseId: string; reason: string; items: { id: string; qty: number; }[]; date: string; }
interface StockOutRecord { id: string; receiptNumber: string; sourceId: string; items: { id: string; qty: number; }[]; date: string; }
interface StockTransferRecord { id: string; receiptNumber: string; fromSourceId: string; toSourceId: string; items: { id: string; qty: number; }[]; date: string; }
interface StockAdjustmentRecord { id: string; receiptNumber: string; warehouseId: string; items: { itemId: string; difference: number; }[]; date: string; }
interface SalesReturn { id: string; receiptNumber: string; warehouseId: string; items: { id: string; qty: number; }[]; date: string; }
interface PurchaseReturn { id: string; receiptNumber: string; warehouseId: string; items: { id: string; qty: number; }[]; date: string; }
interface IssueToRep { id: string; receiptNumber: string; warehouseId: string; items: { id: string; qty: number; }[]; date: string; }
interface ReturnFromRep { id: string; receiptNumber: string; warehouseId: string; items: { id: string; qty: number; }[]; date: string; }
interface InventoryClosing { id: string; warehouseId: string; closingDate: string; balances: { itemId: string, balance: number }[] }
interface PosSale { id: string; invoiceNumber: string; warehouseId: string; items: { id: string; qty: number; }[]; date: string;}


const ReportFilters = ({ onGenerate, hideItemFilter = false }: { onGenerate: (filters: any) => void, hideItemFilter?: boolean }) => {
    const { items, warehouses, loading } = useData();
    const [filters, setFilters] = useState({ fromDate: '', toDate: '', warehouseId: 'all', itemId: '' });
    
    const itemOptions = useMemo(() => items.map((item: Item) => ({ value: item.id, label: `${item.name} (${item.code})` })), [items]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }

    return (
        <Card className="no-print">
            <CardHeader>
                <CardTitle>فلاتر التقارير</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label>من تاريخ</Label>
                        <Input type="date" value={filters.fromDate} onChange={e => handleFilterChange('fromDate', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>إلى تاريخ</Label>
                        <Input type="date" value={filters.toDate} onChange={e => handleFilterChange('toDate', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>المخزن</Label>
                        <Select value={filters.warehouseId} onValueChange={v => handleFilterChange('warehouseId', v)}>
                            <SelectTrigger><SelectValue placeholder="الكل" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">كل المخازن</SelectItem>
                                {warehouses.map((w: Warehouse) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    {!hideItemFilter && (
                         <div className="space-y-2">
                            <Label>الصنف</Label>
                             <Combobox
                                options={itemOptions}
                                value={filters.itemId}
                                onValueChange={(value) => handleFilterChange('itemId', value)}
                                placeholder="اختر صنفًا (اختياري)..."
                                emptyMessage="لم يتم العثور على الصنف."
                            />
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter>
                 <Button className="w-full sm:w-auto" onClick={() => onGenerate(filters)} disabled={loading}>
                    <BarChart2 className="ml-2 h-4 w-4" />
                    عرض التقرير
                </Button>
            </CardFooter>
        </Card>
    );
};


const ReportContainer = ({ title, description, children, onPrint }: { title: string, description: string, children: React.ReactNode, onPrint: () => void }) => (
    <Card className="printable-area">
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={onPrint} className="no-print">
                <Printer className="h-4 w-4" />
                <span className="sr-only">طباعة</span>
            </Button>
        </CardHeader>
        <CardContent>
            {children}
        </CardContent>
    </Card>
)

const StockStatusReport = ({ filters, data }: any) => {
    const { items: allItems, warehouses, salesInvoices, purchaseInvoices, stockInRecords, stockOutRecords, stockTransferRecords, stockAdjustmentRecords, salesReturns, purchaseReturns, stockIssuesToReps, stockReturnsFromReps, inventoryClosings, posSales } = data;
    
    const stockData = useMemo(() => {
        let results: any[] = [];
        const targetWarehouses = filters.warehouseId === 'all'
            ? warehouses
            : warehouses.filter((w:any) => w.id === filters.warehouseId);

        targetWarehouses.forEach((warehouse: Warehouse) => {
            const closingsForWarehouse = inventoryClosings.filter((c: InventoryClosing) => c.warehouseId === warehouse.id);
            const lastClosing = closingsForWarehouse.length > 0 ? closingsForWarehouse.reduce((latest:any, current:any) => new Date(latest.closingDate) > new Date(current.closingDate) ? latest : current) : null;
            const lastClosingDate = lastClosing ? new Date(lastClosing.closingDate) : new Date(0);
            
            allItems.forEach((item: Item) => {
                let stock = lastClosing?.balances.find((b:any) => b.itemId === item.id)?.balance || 0;
                const filterTransactions = (t: any) => new Date(t.date) > lastClosingDate;
                
                // Increases
                stockInRecords.filter((si:any) => si.warehouseId === warehouse.id && filterTransactions(si)).forEach((si:any) => si.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock += i.qty));
                stockTransferRecords.filter((t:any) => t.toSourceId === warehouse.id && filterTransactions(t)).forEach((t:any) => t.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock += i.qty));
                stockAdjustmentRecords.filter((adj:any) => adj.warehouseId === warehouse.id && filterTransactions(adj)).forEach((adj:any) => adj.items.filter((i:any) => i.itemId === item.id && i.difference > 0).forEach((i:any) => stock += i.difference));
                salesReturns.filter((sr:any) => sr.warehouseId === warehouse.id && filterTransactions(sr)).forEach((sr:any) => sr.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock += i.qty));
                stockReturnsFromReps.filter((rfr:any) => rfr.warehouseId === warehouse.id && filterTransactions(rfr)).forEach((rfr:any) => rfr.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock += i.qty));

                // Decreases
                salesInvoices.filter((s:any) => s.warehouseId === warehouse.id && s.status === 'approved' && filterTransactions(s)).forEach((s:any) => s.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock -= i.qty));
                posSales.filter((s:any) => s.warehouseId === warehouse.id && filterTransactions(s)).forEach((s:any) => s.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock -= i.qty));
                stockOutRecords.filter((so:any) => so.sourceId === warehouse.id && filterTransactions(so)).forEach((so:any) => so.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock -= i.qty));
                stockTransferRecords.filter((t:any) => t.fromSourceId === warehouse.id && filterTransactions(t)).forEach((t:any) => t.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock -= i.qty));
                stockAdjustmentRecords.filter((adj:any) => adj.warehouseId === warehouse.id && filterTransactions(adj)).forEach((adj:any) => adj.items.filter((i:any) => i.itemId === item.id && i.difference < 0).forEach((i:any) => stock += i.difference));
                purchaseReturns.filter((pr:any) => pr.warehouseId === warehouse.id && filterTransactions(pr)).forEach((pr:any) => pr.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock -= i.qty));
                stockIssuesToReps.filter((itr:any) => itr.warehouseId === warehouse.id && filterTransactions(itr)).forEach((itr:any) => itr.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock -= i.qty));
                
                results.push({ id: `${warehouse.id}-${item.id}`, warehouseName: warehouse.name, itemName: item.name, code: item.code, currentStock: stock, reorderPoint: item.reorderPoint || 0 });
            });
        });
        
        return results.filter(item => item.currentStock !== 0);

    }, [filters, data]);

     return (
        <ReportContainer title="تقرير حالة المخزون" description={`يعرض الأرصدة الحالية للأصناف بناءً على آخر إقفال`} onPrint={() => window.print()}>
            <div className="w-full overflow-auto border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-center">المخزن</TableHead>
                            <TableHead className="text-center">كود الصنف</TableHead>
                            <TableHead className="text-center">اسم الصنف</TableHead>
                            <TableHead className="text-center">الرصيد الحالي</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stockData.map((item:any) => (
                            <TableRow key={item.id}>
                                <TableCell className="text-center">{item.warehouseName}</TableCell>
                                <TableCell className="text-center">{item.code}</TableCell>
                                <TableCell className="text-center">{item.itemName}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant={item.currentStock <= item.reorderPoint ? 'destructive' : 'default'}>{item.currentStock}</Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                         {stockData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">لا توجد بيانات لعرضها.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </ReportContainer>
     )
}

const ItemLedgerReport = ({ filters, data }: any) => {
    const { items: allItems, warehouses, salesInvoices, purchaseInvoices, stockInRecords, stockOutRecords, stockTransferRecords, stockAdjustmentRecords, salesReturns, purchaseReturns, stockIssuesToReps, stockReturnsFromReps, inventoryClosings, posSales } = data;
    const { fromDate, toDate, warehouseId, itemId } = filters;

    const ledgerData = useMemo(() => {
        if (!itemId) return [];
        
        const targetWarehouses = warehouseId === 'all' ? warehouses : warehouses.filter((w:any) => w.id === warehouseId);
        
        let openingBalance = 0;
        targetWarehouses.forEach((warehouse: Warehouse) => {
            const closingsForWh = inventoryClosings.filter((c: InventoryClosing) => c.warehouseId === warehouse.id && new Date(c.closingDate) < new Date(fromDate || 0));
            const lastRelevantClosing = closingsForWh.length > 0 ? closingsForWh.reduce((l:any,c:any) => new Date(l.closingDate) > new Date(c.closingDate) ? l : c) : null;
            
            let stock = lastRelevantClosing?.balances.find((b:any) => b.itemId === itemId)?.balance || 0;
            const txStartDate = lastRelevantClosing ? new Date(lastRelevantClosing.closingDate) : new Date(0);
            
            const filterTxs = (t: any) => {
                const txDate = new Date(t.date);
                return txDate > txStartDate && txDate < new Date(fromDate || 0);
            }
            
            // Apply transactions between last closing and fromDate to get opening balance
             stockInRecords.filter((t:any) => t.warehouseId === warehouse.id && filterTxs(t)).forEach((t:any) => t.items.filter((i:any)=>i.id === itemId).forEach((i:any) => stock += i.qty));
             stockTransferRecords.filter((t:any) => t.toSourceId === warehouse.id && filterTxs(t)).forEach((t:any) => t.items.filter((i:any)=>i.id === itemId).forEach((i:any) => stock += i.qty));
             salesReturns.filter((t:any) => t.warehouseId === warehouse.id && filterTxs(t)).forEach((t:any) => t.items.filter((i:any)=>i.id === itemId).forEach((i:any) => stock += i.qty));
             stockReturnsFromReps.filter((t:any) => t.warehouseId === warehouse.id && filterTxs(t)).forEach((t:any) => t.items.filter((i:any)=>i.id === itemId).forEach((i:any) => stock += i.qty));
             stockAdjustmentRecords.filter((t:any) => t.warehouseId === warehouse.id && filterTxs(t)).forEach((t:any) => t.items.filter((i:any)=>i.itemId === itemId).forEach((i:any) => stock += i.difference > 0 ? i.difference : 0));
             salesInvoices.filter((t:any) => t.warehouseId === warehouse.id && filterTxs(t) && t.status==='approved').forEach((t:any) => t.items.filter((i:any)=>i.id === itemId).forEach((i:any) => stock -= i.qty));
             posSales.filter((t:any) => t.warehouseId === warehouse.id && filterTxs(t)).forEach((t:any) => t.items.filter((i:any)=>i.id === itemId).forEach((i:any) => stock -= i.qty));
             stockOutRecords.filter((t:any) => t.sourceId === warehouse.id && filterTxs(t)).forEach((t:any) => t.items.filter((i:any)=>i.id === itemId).forEach((i:any) => stock -= i.qty));
             stockTransferRecords.filter((t:any) => t.fromSourceId === warehouse.id && filterTxs(t)).forEach((t:any) => t.items.filter((i:any)=>i.id === itemId).forEach((i:any) => stock -= i.qty));
             purchaseReturns.filter((t:any) => t.warehouseId === warehouse.id && filterTxs(t)).forEach((t:any) => t.items.filter((i:any)=>i.id === itemId).forEach((i:any) => stock -= i.qty));
             stockIssuesToReps.filter((t:any) => t.warehouseId === warehouse.id && filterTxs(t)).forEach((t:any) => t.items.filter((i:any)=>i.id === itemId).forEach((i:any) => stock -= i.qty));
             stockAdjustmentRecords.filter((t:any) => t.warehouseId === warehouse.id && filterTxs(t)).forEach((t:any) => t.items.filter((i:any)=>i.itemId === itemId).forEach((i:any) => stock += i.difference < 0 ? i.difference : 0));
            
            openingBalance += stock;
        });

        
        let transactions: any[] = [{ date: fromDate || 'بداية', description: "رصيد أول المدة", incoming: 0, outgoing: 0, balance: openingBalance }];
        
        const withinPeriodTransactions = [
            ...stockInRecords.flatMap((t:any) => t.items.filter((i:any)=>i.id===itemId).map((i:any) => ({...t, type: 'in', qty: i.qty, warehouseId: t.warehouseId, source: `إذن استلام #${t.receiptNumber}`}))),
            ...salesReturns.flatMap((t:any) => t.items.filter((i:any)=>i.id===itemId).map((i:any) => ({...t, type: 'in', qty: i.qty, warehouseId: t.warehouseId, source: `مرتجع بيع #${t.receiptNumber}`}))),
            ...stockReturnsFromReps.flatMap((t:any) => t.items.filter((i:any)=>i.id===itemId).map((i:any) => ({...t, type: 'in', qty: i.qty, warehouseId: t.warehouseId, source: `مرتجع مندوب #${t.receiptNumber}`}))),
            ...stockTransferRecords.flatMap((t:any) => t.items.filter((i:any)=>i.id===itemId).map((i:any) => ({...t, type: 'in', qty: i.qty, warehouseId: t.toSourceId, source: `تحويل مخزني #${t.receiptNumber}`}))),
            ...stockAdjustmentRecords.flatMap((t:any) => t.items.filter((i:any)=>i.itemId===itemId && i.difference > 0).map((i:any) => ({...t, type: 'in', qty: i.difference, warehouseId: t.warehouseId, source: `تسوية مخزون #${t.receiptNumber}`}))),
            ...salesInvoices.flatMap((t:any) => t.items.filter((i:any)=>i.id===itemId && t.status==='approved').map((i:any) => ({...t, type: 'out', qty: i.qty, warehouseId: t.warehouseId, source: `فاتورة بيع #${t.invoiceNumber}`}))),
            ...posSales.flatMap((t:any) => t.items.filter((i:any)=>i.id===itemId).map((i:any) => ({...t, type: 'out', qty: i.qty, warehouseId: t.warehouseId, source: `فاتورة كاشير #${t.invoiceNumber}`}))),
            ...stockOutRecords.flatMap((t:any) => t.items.filter((i:any)=>i.id===itemId).map((i:any) => ({...t, type: 'out', qty: i.qty, warehouseId: t.sourceId, source: `إذن صرف #${t.receiptNumber}`}))),
            ...purchaseReturns.flatMap((t:any) => t.items.filter((i:any)=>i.id===itemId).map((i:any) => ({...t, type: 'out', qty: i.qty, warehouseId: t.warehouseId, source: `مرتجع شراء #${t.receiptNumber}`}))),
            ...stockIssuesToReps.flatMap((t:any) => t.items.filter((i:any)=>i.id===itemId).map((i:any) => ({...t, type: 'out', qty: i.qty, warehouseId: t.warehouseId, source: `صرف للمندوب #${t.receiptNumber}`}))),
            ...stockTransferRecords.flatMap((t:any) => t.items.filter((i:any)=>i.id===itemId).map((i:any) => ({...t, type: 'out', qty: i.qty, warehouseId: t.fromSourceId, source: `تحويل مخزني #${t.receiptNumber}`}))),
            ...stockAdjustmentRecords.flatMap((t:any) => t.items.filter((i:any)=>i.itemId===itemId && i.difference < 0).map((i:any) => ({...t, type: 'out', qty: Math.abs(i.difference), warehouseId: t.warehouseId, source: `تسوية مخزون #${t.receiptNumber}`}))),
        ]
        .filter((t:any) => {
            const tDate = new Date(t.date);
            const start = fromDate ? new Date(fromDate) : null;
            const end = toDate ? new Date(toDate) : null;
            if(start) start.setHours(0,0,0,0);
            if(end) end.setHours(23,59,59,999);
            if(start && tDate < start) return false;
            if(end && tDate > end) return false;
            if(warehouseId !== 'all' && t.warehouseId !== warehouseId) return false;
            return true;
        })
        .sort((a:any, b:any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let currentBalance = openingBalance;
        withinPeriodTransactions.forEach((t:any) => {
            const incoming = t.type === 'in' ? t.qty : 0;
            const outgoing = t.type === 'out' ? t.qty : 0;
            currentBalance += incoming - outgoing;
            transactions.push({ date: new Date(t.date).toLocaleDateString('ar-EG'), description: t.source, incoming, outgoing, balance: currentBalance });
        });

        return transactions;

    }, [filters, data]);

    if (!itemId) return <Card><CardContent className="p-10 text-center text-muted-foreground">الرجاء اختيار صنف لعرض كارت الحركة الخاص به.</CardContent></Card>;

    return (
        <ReportContainer title={`كارت الصنف: ${allItems.find((i:any)=>i.id === itemId)?.name}`} description={`حركة الصنف من ${filters.fromDate || 'البداية'} إلى ${filters.toDate || 'النهاية'}`} onPrint={() => window.print()}>
            <div className="w-full overflow-auto border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>التاريخ</TableHead>
                            <TableHead>البيان</TableHead>
                            <TableHead className="text-center">وارد</TableHead>
                            <TableHead className="text-center">منصرف</TableHead>
                            <TableHead className="text-center">الرصيد</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {ledgerData.map((tx, idx) => (
                            <TableRow key={idx}>
                                <TableCell>{tx.date}</TableCell>
                                <TableCell>{tx.description}</TableCell>
                                <TableCell className="text-center text-green-600">{tx.incoming > 0 ? tx.incoming : ''}</TableCell>
                                <TableCell className="text-center text-destructive">{tx.outgoing > 0 ? tx.outgoing : ''}</TableCell>
                                <TableCell className="text-center font-bold">{tx.balance}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </ReportContainer>
    );
};

const UnderDevelopmentReport = ({ title }: { title: string }) => {
    return (
        <ReportContainer title={title} description="هذا التقرير قيد التطوير حاليًا." onPrint={() => {}}>
            <div className="text-center text-muted-foreground py-10">قيد التطوير</div>
        </ReportContainer>
    );
};


// --- Main Page Component ---
export default function InventoryReportsPage() {
    const data = useData();
    const [activeFilters, setActiveFilters] = useState<any>(null);

    if (data.loading) {
        return <div className="flex flex-1 justify-center items-center"><Loader2 className="h-10 w-10 animate-spin text-muted-foreground" /></div>
    }

    return (
        <>
            <PageHeader title="تقارير المخزون الشاملة" />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                <ReportFilters onGenerate={setActiveFilters} />
                
                {activeFilters && (
                    <Tabs defaultValue="stock_status" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 flex-wrap h-auto md:h-10">
                            <TabsTrigger value="stock_status">حالة المخزون</TabsTrigger>
                            <TabsTrigger value="item_ledger">كارت الصنف</TabsTrigger>
                            <TabsTrigger value="reorder_list">حد الطلب</TabsTrigger>
                            <TabsTrigger value="valuation">تقييم المخزون</TabsTrigger>
                            <TabsTrigger value="movement_summary">ملخص الحركة</TabsTrigger>
                            <TabsTrigger value="dead_stock">الأصناف الراكدة</TabsTrigger>
                            <TabsTrigger value="abc_analysis">تحليل ABC</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="stock_status"><StockStatusReport filters={activeFilters} data={data} /></TabsContent>
                        <TabsContent value="item_ledger"><ItemLedgerReport filters={activeFilters} data={data} /></TabsContent>
                        <TabsContent value="reorder_list"><UnderDevelopmentReport title="تقرير الأصناف تحت حد الطلب" /></TabsContent>
                        <TabsContent value="valuation"><UnderDevelopmentReport title="تقرير تقييم المخزون" /></TabsContent>
                        <TabsContent value="movement_summary"><UnderDevelopmentReport title="تقرير ملخص الحركة" /></TabsContent>
                        <TabsContent value="dead_stock"><UnderDevelopmentReport title="تقرير الأصناف الراكدة" /></TabsContent>
                        <TabsContent value="abc_analysis"><UnderDevelopmentReport title="تقرير تحليل ABC" /></TabsContent>
                    </Tabs>
                )}
            </main>
        </>
    );
}
