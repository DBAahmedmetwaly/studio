
"use client";

import React, { useState, useMemo } from "react";
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
import { Loader2, Printer, BarChart2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Combobox } from "@/components/ui/combobox";
import { Badge } from "@/components/ui/badge";

// Data Interfaces
interface Item { id: string; name: string; unit: string; price: number; reorderPoint?: number; code?: string; cost?: number; }
interface Warehouse { id: string; name: string; }
interface SaleInvoice { id: string; warehouseId: string; items: { id: string; qty: number; }[]; status?: 'approved' | 'pending'; date: string;}
interface PurchaseInvoice { id: string; warehouseId: string; items: { id: string; qty: number; }[]; date: string; }
interface StockInRecord { id: string; warehouseId: string; reason: string; items: { id: string; qty: number; }[]; date: string; }
interface StockOutRecord { id: string; sourceId: string; items: { id: string; qty: number; }[]; date: string; }
interface StockTransferRecord { id: string; fromSourceId: string; toSourceId: string; items: { id: string; qty: number; }[]; date: string; }
interface StockAdjustmentRecord { id: string; warehouseId: string; items: { itemId: string; difference: number; }[]; date: string; }
interface SalesReturn { id: string; warehouseId: string; items: { id: string; qty: number; }[]; date: string; }
interface PurchaseReturn { id: string; warehouseId: string; items: { id: string; qty: number; }[]; date: string; }
interface IssueToRep { id: string; warehouseId: string; items: { id: string; qty: number; }[]; date: string; }
interface ReturnFromRep { id: string; warehouseId: string; items: { id: string; qty: number; }[]; date: string; }


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
            <div className="w-full overflow-auto border rounded-lg">
                {children}
            </div>
        </CardContent>
    </Card>
)

const StockStatusReport = ({ filters, data }: any) => {
    const { allItems, warehouses, sales, purchases, stockIns, stockOuts, transfers, adjustments, salesReturns, purchaseReturns, issuesToReps, returnsFromReps } = data;
    
    const stockData = useMemo(() => {
        let targetWarehouses = filters.warehouseId === 'all'
            ? warehouses
            : warehouses.filter((w:any) => w.id === filters.warehouseId);

        let targetItems = filters.itemId
            ? allItems.filter((item:any) => item.id === filters.itemId)
            : allItems;

        return targetWarehouses.flatMap((warehouse:any) => 
            targetItems.map((item:any) => {
                let stock = 0;
                purchases.filter((p:any) => p.warehouseId === warehouse.id && new Date(p.date) <= new Date(filters.toDate || Date.now())).forEach((p:any) => p.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock += i.qty));
                stockIns.filter((si:any) => si.warehouseId === warehouse.id && new Date(si.date) <= new Date(filters.toDate || Date.now())).forEach((si:any) => si.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock += i.qty));
                transfers.filter((t:any) => t.toSourceId === warehouse.id && new Date(t.date) <= new Date(filters.toDate || Date.now())).forEach((t:any) => t.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock += i.qty));
                adjustments.filter((adj:any) => adj.warehouseId === warehouse.id && new Date(adj.date) <= new Date(filters.toDate || Date.now())).forEach((adj:any) => adj.items.filter((i:any) => i.itemId === item.id && i.difference > 0).forEach((i:any) => stock += i.difference));
                salesReturns.filter((sr:any) => sr.warehouseId === warehouse.id && new Date(sr.date) <= new Date(filters.toDate || Date.now())).forEach((sr:any) => sr.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock += i.qty));
                returnsFromReps.filter((rfr:any) => rfr.warehouseId === warehouse.id && new Date(rfr.date) <= new Date(filters.toDate || Date.now())).forEach((rfr:any) => rfr.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock += i.qty));

                sales.filter((s:any) => s.warehouseId === warehouse.id && s.status === 'approved' && new Date(s.date) <= new Date(filters.toDate || Date.now())).forEach((s:any) => s.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock -= i.qty));
                stockOuts.filter((so:any) => so.sourceId === warehouse.id && new Date(so.date) <= new Date(filters.toDate || Date.now())).forEach((so:any) => so.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock -= i.qty));
                transfers.filter((t:any) => t.fromSourceId === warehouse.id && new Date(t.date) <= new Date(filters.toDate || Date.now())).forEach((t:any) => t.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock -= i.qty));
                adjustments.filter((adj:any) => adj.warehouseId === warehouse.id && new Date(adj.date) <= new Date(filters.toDate || Date.now())).forEach((adj:any) => adj.items.filter((i:any) => i.itemId === item.id && i.difference < 0).forEach((i:any) => stock += i.difference));
                purchaseReturns.filter((pr:any) => pr.warehouseId === warehouse.id && new Date(pr.date) <= new Date(filters.toDate || Date.now())).forEach((pr:any) => pr.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock -= i.qty));
                issuesToReps.filter((itr:any) => itr.warehouseId === warehouse.id && new Date(itr.date) <= new Date(filters.toDate || Date.now())).forEach((itr:any) => itr.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock -= i.qty));

                return { id: `${warehouse.id}-${item.id}`, warehouseName: warehouse.name, itemName: item.name, code: item.code, currentStock: stock, reorderPoint: item.reorderPoint || 0 };
            })
        ).filter((item:any) => item.currentStock !== 0);
    }, [filters, data]);

     return (
        <ReportContainer title="تقرير حالة المخزون" description={`يعرض الأرصدة الحالية للأصناف حتى تاريخ ${filters.toDate || 'اليوم'}`} onPrint={() => window.print()}>
            <Table>
                <TableHeader><TableRow><TableHead>المخزن</TableHead><TableHead>كود الصنف</TableHead><TableHead>اسم الصنف</TableHead><TableHead className="text-center">الرصيد الحالي</TableHead></TableRow></TableHeader>
                <TableBody>
                    {stockData.map((item:any) => (
                        <TableRow key={item.id}>
                            <TableCell>{item.warehouseName}</TableCell>
                            <TableCell>{item.code}</TableCell>
                            <TableCell>{item.itemName}</TableCell>
                            <TableCell className="text-center">
                                <Badge variant={item.currentStock <= item.reorderPoint ? 'destructive' : 'default'}>{item.currentStock}</Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ReportContainer>
     )
}

const ItemLedgerReport = ({ filters, data }: any) => {
    const { allItems, warehouses, sales, purchases, stockIns, stockOuts, transfers, adjustments, salesReturns, purchaseReturns, issuesToReps, returnsFromReps } = data;
    const { fromDate, toDate, warehouseId, itemId } = filters;

    const ledgerData = useMemo(() => {
        if (!itemId) return [];
        let transactions: any[] = [];
        
        let openingBalance = 0;
        const allTargetWarehouses = warehouseId === 'all' ? warehouses.map((w:any) => w.id) : [warehouseId];
        
        // Calculate Opening Balance
        allTargetWarehouses.forEach(whId => {
            // Additions
            purchases.filter((t:any) => t.warehouseId === whId && new Date(t.date) < new Date(fromDate)).forEach((t:any) => t.items.filter((i:any)=>i.id === itemId).forEach((i:any) => openingBalance += i.qty));
            stockIns.filter((t:any) => t.warehouseId === whId && new Date(t.date) < new Date(fromDate)).forEach((t:any) => t.items.filter((i:any)=>i.id === itemId).forEach((i:any) => openingBalance += i.qty));
            transfers.filter((t:any) => t.toSourceId === whId && new Date(t.date) < new Date(fromDate)).forEach((t:any) => t.items.filter((i:any)=>i.id === itemId).forEach((i:any) => openingBalance += i.qty));
            salesReturns.filter((t:any) => t.warehouseId === whId && new Date(t.date) < new Date(fromDate)).forEach((t:any) => t.items.filter((i:any)=>i.id === itemId).forEach((i:any) => openingBalance += i.qty));
            returnsFromReps.filter((t:any) => t.warehouseId === whId && new Date(t.date) < new Date(fromDate)).forEach((t:any) => t.items.filter((i:any)=>i.id === itemId).forEach((i:any) => openingBalance += i.qty));
            adjustments.filter((t:any) => t.warehouseId === whId && new Date(t.date) < new Date(fromDate)).forEach((t:any) => t.items.filter((i:any)=>i.itemId === itemId).forEach((i:any) => openingBalance += i.difference > 0 ? i.difference : 0));
            // Subtractions
            sales.filter((t:any) => t.warehouseId === whId && new Date(t.date) < new Date(fromDate) && t.status==='approved').forEach((t:any) => t.items.filter((i:any)=>i.id === itemId).forEach((i:any) => openingBalance -= i.qty));
            stockOuts.filter((t:any) => t.sourceId === whId && new Date(t.date) < new Date(fromDate)).forEach((t:any) => t.items.filter((i:any)=>i.id === itemId).forEach((i:any) => openingBalance -= i.qty));
            transfers.filter((t:any) => t.fromSourceId === whId && new Date(t.date) < new Date(fromDate)).forEach((t:any) => t.items.filter((i:any)=>i.id === itemId).forEach((i:any) => openingBalance -= i.qty));
            purchaseReturns.filter((t:any) => t.warehouseId === whId && new Date(t.date) < new Date(fromDate)).forEach((t:any) => t.items.filter((i:any)=>i.id === itemId).forEach((i:any) => openingBalance -= i.qty));
            issuesToReps.filter((t:any) => t.warehouseId === whId && new Date(t.date) < new Date(fromDate)).forEach((t:any) => t.items.filter((i:any)=>i.id === itemId).forEach((i:any) => openingBalance -= i.qty));
            adjustments.filter((t:any) => t.warehouseId === whId && new Date(t.date) < new Date(fromDate)).forEach((t:any) => t.items.filter((i:any)=>i.itemId === itemId).forEach((i:any) => openingBalance += i.difference < 0 ? i.difference : 0));
        });

        transactions.push({ date: fromDate, description: "رصيد افتتاحي", incoming: 0, outgoing: 0, balance: openingBalance });

        const withinPeriodTransactions = [
            ...purchases.flatMap((t:any) => t.items.filter((i:any)=>i.id===itemId).map((i:any) => ({...t, type: 'in', qty: i.qty, warehouseId: t.warehouseId, source: "فاتورة شراء"}))),
            ...stockIns.flatMap((t:any) => t.items.filter((i:any)=>i.id===itemId).map((i:any) => ({...t, type: 'in', qty: i.qty, warehouseId: t.warehouseId, source: "إذن استلام"}))),
            ...salesReturns.flatMap((t:any) => t.items.filter((i:any)=>i.id===itemId).map((i:any) => ({...t, type: 'in', qty: i.qty, warehouseId: t.warehouseId, source: "مرتجع بيع"}))),
            ...returnsFromReps.flatMap((t:any) => t.items.filter((i:any)=>i.id===itemId).map((i:any) => ({...t, type: 'in', qty: i.qty, warehouseId: t.warehouseId, source: "مرتجع مندوب"}))),
            ...transfers.flatMap((t:any) => t.items.filter((i:any)=>i.id===itemId).map((i:any) => ({...t, type: 'in', qty: i.qty, warehouseId: t.toSourceId, source: "تحويل مخزني"}))),
            ...adjustments.flatMap((t:any) => t.items.filter((i:any)=>i.itemId===itemId && i.difference > 0).map((i:any) => ({...t, type: 'in', qty: i.difference, warehouseId: t.warehouseId, source: "تسوية مخزون"}))),

            ...sales.flatMap((t:any) => t.items.filter((i:any)=>i.id===itemId && t.status==='approved').map((i:any) => ({...t, type: 'out', qty: i.qty, warehouseId: t.warehouseId, source: "فاتورة بيع"}))),
            ...stockOuts.flatMap((t:any) => t.items.filter((i:any)=>i.id===itemId).map((i:any) => ({...t, type: 'out', qty: i.qty, warehouseId: t.sourceId, source: "إذن صرف"}))),
            ...purchaseReturns.flatMap((t:any) => t.items.filter((i:any)=>i.id===itemId).map((i:any) => ({...t, type: 'out', qty: i.qty, warehouseId: t.warehouseId, source: "مرتجع شراء"}))),
            ...issuesToReps.flatMap((t:any) => t.items.filter((i:any)=>i.id===itemId).map((i:any) => ({...t, type: 'out', qty: i.qty, warehouseId: t.warehouseId, source: "صرف للمندوب"}))),
            ...transfers.flatMap((t:any) => t.items.filter((i:any)=>i.id===itemId).map((i:any) => ({...t, type: 'out', qty: i.qty, warehouseId: t.fromSourceId, source: "تحويل مخزني"}))),
            ...adjustments.flatMap((t:any) => t.items.filter((i:any)=>i.itemId===itemId && i.difference < 0).map((i:any) => ({...t, type: 'out', qty: Math.abs(i.difference), warehouseId: t.warehouseId, source: "تسوية مخزون"}))),
        ]
        .filter((t:any) => {
            const tDate = new Date(t.date);
            const start = fromDate ? new Date(fromDate) : null;
            const end = toDate ? new Date(toDate) : null;
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
            <Table>
                <TableHeader><TableRow><TableHead>التاريخ</TableHead><TableHead>البيان</TableHead><TableHead className="text-center">وارد</TableHead><TableHead className="text-center">منصرف</TableHead><TableHead className="text-center">الرصيد</TableHead></TableRow></TableHeader>
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
        </ReportContainer>
    );
};

const ReorderListReport = ({ filters, data }: any) => {
    const { allItems, warehouses, sales, purchases, stockIns, stockOuts, transfers, adjustments, salesReturns, purchaseReturns, issuesToReps, returnsFromReps } = data;

    const stockData = useMemo(() => {
        return allItems
            .filter((item: any) => item.reorderPoint > 0)
            .map((item: any) => {
                let stock = 0;
                let targetWarehouses = filters.warehouseId === 'all' ? warehouses : warehouses.filter((w: any) => w.id === filters.warehouseId);
                
                targetWarehouses.forEach((wh: any) => {
                    purchases.filter((p:any) => p.warehouseId === wh.id).forEach((p:any) => p.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock += i.qty));
                    sales.filter((s:any) => s.warehouseId === wh.id && s.status === 'approved').forEach((s:any) => s.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock -= i.qty));
                    // Add other movements if needed...
                });

                return { ...item, currentStock: stock };
            })
            .filter((item: any) => item.currentStock <= item.reorderPoint);

    }, [filters, data]);

    return (
        <ReportContainer title="تقرير الأصناف تحت حد الطلب" description="يعرض الأصناف التي وصل رصيدها إلى أو أقل من حد إعادة الطلب" onPrint={() => window.print()}>
            <Table>
                <TableHeader><TableRow><TableHead>كود الصنف</TableHead><TableHead>اسم الصنف</TableHead><TableHead className="text-center">الرصيد الحالي</TableHead><TableHead className="text-center">حد الطلب</TableHead></TableRow></TableHeader>
                <TableBody>
                    {stockData.map((item:any) => (
                        <TableRow key={item.id}>
                            <TableCell>{item.code}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-center text-destructive font-bold">{item.currentStock}</TableCell>
                            <TableCell className="text-center">{item.reorderPoint}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
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
            <PageHeader title="تقارير المخزون" />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                <ReportFilters onGenerate={setActiveFilters} />
                
                {activeFilters && (
                    <Tabs defaultValue="stock_status" className="w-full">
                        <TabsList className="grid w-full grid-cols-7 no-print">
                            <TabsTrigger value="stock_status">حالة المخزون</TabsTrigger>
                            <TabsTrigger value="item_ledger">كارت الصنف</TabsTrigger>
                            <TabsTrigger value="reorder_list">حد الطلب</TabsTrigger>
                            <TabsTrigger value="valuation" disabled>تقييم المخزون</TabsTrigger>
                            <TabsTrigger value="movement_summary" disabled>ملخص الحركة</TabsTrigger>
                            <TabsTrigger value="dead_stock" disabled>الأصناف الراكدة</TabsTrigger>
                            <TabsTrigger value="abc_analysis" disabled>تحليل ABC</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="stock_status"><StockStatusReport filters={activeFilters} data={data} /></TabsContent>
                        <TabsContent value="item_ledger"><ItemLedgerReport filters={activeFilters} data={data} /></TabsContent>
                        <TabsContent value="reorder_list"><ReorderListReport filters={activeFilters} data={data} /></TabsContent>
                        <TabsContent value="valuation"><Card><CardContent className="p-10 text-center">قيد التطوير</CardContent></Card></TabsContent>
                        <TabsContent value="movement_summary"><Card><CardContent className="p-10 text-center">قيد التطوير</CardContent></Card></TabsContent>
                        <TabsContent value="dead_stock"><Card><CardContent className="p-10 text-center">قيد التطوير</CardContent></Card></TabsContent>
                        <TabsContent value="abc_analysis"><Card><CardContent className="p-10 text-center">قيد التطوير</CardContent></Card></TabsContent>
                    </Tabs>
                )}
            </main>
        </>
    );
}
