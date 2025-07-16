
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
                // Increases
                purchases.filter((p:any) => p.warehouseId === warehouse.id && new Date(p.date) <= new Date(filters.toDate || Date.now())).forEach((p:any) => p.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock += i.qty));
                stockIns.filter((si:any) => si.warehouseId === warehouse.id && new Date(si.date) <= new Date(filters.toDate || Date.now())).forEach((si:any) => si.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock += i.qty));
                transfers.filter((t:any) => t.toSourceId === warehouse.id && new Date(t.date) <= new Date(filters.toDate || Date.now())).forEach((t:any) => t.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock += i.qty));
                adjustments.filter((adj:any) => adj.warehouseId === warehouse.id && new Date(adj.date) <= new Date(filters.toDate || Date.now())).forEach((adj:any) => adj.items.filter((i:any) => i.itemId === item.id && i.difference > 0).forEach((i:any) => stock += i.difference));
                salesReturns.filter((sr:any) => sr.warehouseId === warehouse.id && new Date(sr.date) <= new Date(filters.toDate || Date.now())).forEach((sr:any) => sr.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock += i.qty));
                returnsFromReps.filter((rfr:any) => rfr.warehouseId === warehouse.id && new Date(rfr.date) <= new Date(filters.toDate || Date.now())).forEach((rfr:any) => rfr.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock += i.qty));

                // Decreases
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
// Add more report components here...

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
                            <TabsTrigger value="valuation">تقييم المخزون</TabsTrigger>
                            <TabsTrigger value="movement_summary">ملخص الحركة</TabsTrigger>
                            <TabsTrigger value="dead_stock">الأصناف الراكدة</TabsTrigger>
                            <TabsTrigger value="reorder_list">حد الطلب</TabsTrigger>
                            <TabsTrigger value="abc_analysis">تحليل ABC</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="stock_status"><StockStatusReport filters={activeFilters} data={data} /></TabsContent>
                        <TabsContent value="item_ledger"><Card><CardContent className="p-10 text-center">قيد التطوير</CardContent></Card></TabsContent>
                        <TabsContent value="valuation"><Card><CardContent className="p-10 text-center">قيد التطوير</CardContent></Card></TabsContent>
                        <TabsContent value="movement_summary"><Card><CardContent className="p-10 text-center">قيد التطوير</CardContent></Card></TabsContent>
                        <TabsContent value="dead_stock"><Card><CardContent className="p-10 text-center">قيد التطوير</CardContent></Card></TabsContent>
                        <TabsContent value="reorder_list"><Card><CardContent className="p-10 text-center">قيد التطوير</CardContent></Card></TabsContent>
                        <TabsContent value="abc_analysis"><Card><CardContent className="p-10 text-center">قيد التطوير</CardContent></Card></TabsContent>
                    </Tabs>
                )}
            </main>
        </>
    );
}
