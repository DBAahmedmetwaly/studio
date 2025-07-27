
"use client";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/contexts/data-provider";
import { Loader2, Lock, FileSearch } from "lucide-react";
import React, { useState, useMemo } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/auth-context";

interface Item { id: string; name: string; code: string; }
interface Warehouse { id: string; name: string; }
// Define interfaces for all transaction types
interface SaleInvoice { id: string; warehouseId: string; items: { id: string; qty: number; }[]; status?: 'approved' | 'pending'; date: string;}
interface PurchaseInvoice { id: string; warehouseId: string; items: { id: string; qty: number; }[]; date: string; }
interface StockInRecord { id: string; warehouseId: string; items: { id: string; qty: number; }[]; date: string; }
interface StockOutRecord { id: string; sourceId: string; items: { id: string; qty: number; }[]; date: string; }
interface StockTransferRecord { id: string; fromSourceId: string; toSourceId: string; items: { id: string; qty: number; }[]; date: string; }
interface StockAdjustmentRecord { id: string; warehouseId: string; items: { itemId: string; difference: number; }[]; date: string; }
interface SalesReturn { id: string; warehouseId: string; items: { id: string; qty: number; }[]; date: string; }
interface PurchaseReturn { id: string; warehouseId: string; items: { id: string; qty: number; }[]; date: string; }
interface IssueToRep { id: string; warehouseId: string; items: { id: string; qty: number; }[]; date: string; }
interface ReturnFromRep { id: string; warehouseId: string; items: { id: string; qty: number; }[]; date: string; }


export default function PeriodClosingPage() {
    const { toast } = useToast();
    const [closingDate, setClosingDate] = useState("");
    const [warehouseId, setWarehouseId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [reviewData, setReviewData] = useState<any[] | null>(null);
    const { user } = useAuth();
    
    const { items, warehouses, salesInvoices, purchaseInvoices, stockInRecords, stockOutRecords, stockTransferRecords, stockAdjustmentRecords, salesReturns, purchaseReturns, stockIssuesToReps, stockReturnsFromReps, inventoryClosings, dbAction, loading: dataLoading } = useData();

    const lastClosingDate = useMemo(() => {
        if (!warehouseId) return null;
        const closingsForWarehouse = inventoryClosings.filter(c => c.warehouseId === warehouseId);
        if (closingsForWarehouse.length === 0) return null;
        return new Date(Math.max(...closingsForWarehouse.map(c => new Date(c.closingDate).getTime())));
    }, [warehouseId, inventoryClosings]);

    const handleCalculateBalances = () => {
        if (!closingDate || !warehouseId) {
            toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى اختيار المخزن وتاريخ الإقفال." });
            return;
        }

        const closingDateObj = new Date(closingDate);
        if(lastClosingDate && closingDateObj <= lastClosingDate) {
            toast({ variant: "destructive", title: "تاريخ غير صالح", description: `لا يمكن الإقفال في تاريخ يسبق أو يساوي تاريخ آخر إقفال (${lastClosingDate.toLocaleDateString('ar-EG')}).` });
            return;
        }

        setIsLoading(true);

        const balances = items.map(item => {
            let stock = 0;
            // Find opening balance from last closing if available
            const lastClosing = inventoryClosings.find(c => c.warehouseId === warehouseId && new Date(c.closingDate).getTime() === lastClosingDate?.getTime());
            const openingBalanceRecord = lastClosing?.balances.find((b: any) => b.itemId === item.id);
            stock = openingBalanceRecord ? openingBalanceRecord.balance : 0;
            
            const startDate = lastClosingDate || new Date(0);

            // Filter transactions between last closing date and new closing date
            const filterTransactions = (t: any) => new Date(t.date) > startDate && new Date(t.date) <= closingDateObj;
            
            // Increases
            purchaseInvoices.filter(p => p.warehouseId === warehouseId && filterTransactions(p)).forEach(p => p.items.filter(i => i.id === item.id).forEach(i => stock += i.qty));
            stockInRecords.filter(si => si.warehouseId === warehouseId && filterTransactions(si)).forEach(si => si.items.filter(i => i.id === item.id).forEach(i => stock += i.qty));
            stockTransferRecords.filter(t => t.toSourceId === warehouseId && filterTransactions(t)).forEach(t => t.items.filter(i => i.id === item.id).forEach(i => stock += i.qty));
            stockAdjustmentRecords.filter(adj => adj.warehouseId === warehouseId && filterTransactions(adj)).forEach(adj => adj.items.filter(i => i.itemId === item.id && i.difference > 0).forEach(i => stock += i.difference));
            salesReturns.filter(sr => sr.warehouseId === warehouseId && filterTransactions(sr)).forEach(sr => sr.items.filter(i => i.id === item.id).forEach(i => stock += i.qty));
            stockReturnsFromReps.filter(rfr => rfr.warehouseId === warehouseId && filterTransactions(rfr)).forEach(rfr => rfr.items.filter(i => i.id === item.id).forEach(i => stock += i.qty));

            // Decreases
            salesInvoices.filter(s => s.warehouseId === warehouseId && s.status === 'approved' && filterTransactions(s)).forEach(s => s.items.filter(i => i.id === item.id).forEach(i => stock -= i.qty));
            stockOutRecords.filter(so => so.sourceId === warehouseId && filterTransactions(so)).forEach(so => so.items.filter(i => i.id === item.id).forEach(i => stock -= i.qty));
            stockTransferRecords.filter(t => t.fromSourceId === warehouseId && filterTransactions(t)).forEach(t => t.items.filter(i => i.id === item.id).forEach(i => stock -= i.qty));
            stockAdjustmentRecords.filter(adj => adj.warehouseId === warehouseId && filterTransactions(adj)).forEach(adj => adj.items.filter(i => i.itemId === item.id && i.difference < 0).forEach(i => stock += i.difference));
            purchaseReturns.filter(pr => pr.warehouseId === warehouseId && filterTransactions(pr)).forEach(pr => pr.items.filter(i => i.id === item.id).forEach(i => stock -= i.qty));
            stockIssuesToReps.filter(itr => itr.warehouseId === warehouseId && filterTransactions(itr)).forEach(itr => itr.items.filter(i => i.id === item.id).forEach(i => stock -= i.qty));

            return { itemId: item.id, name: item.name, code: item.code, balance: stock };
        }).filter(item => item.balance !== 0 || (openingBalanceRecord && openingBalanceRecord.balance !== 0));
        
        setReviewData(balances);
        setIsLoading(false);
    };

    const handlePerformClosing = async () => {
        if (!closingDate || !warehouseId || !reviewData) {
            toast({ variant: 'destructive', title: "خطأ", description: "البيانات غير جاهزة للإقفال." });
            return;
        }
        setIsLoading(true);
        try {
            await dbAction('inventoryClosings', 'add', {
                warehouseId: warehouseId,
                closingDate: new Date(closingDate).toISOString(),
                closedById: user?.id,
                closedByName: user?.name,
                balances: reviewData,
            });
            toast({ title: "تم الإقفال بنجاح!", description: `تم تجميد الأرصدة للمخزن المحدد حتى تاريخ ${closingDate}.` });
            setReviewData(null);
            setClosingDate("");
            setWarehouseId("");
        } catch (error) {
            toast({ variant: 'destructive', title: "خطأ", description: "فشلت عملية الإقفال." });
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <>
            <PageHeader title="إقفال الفترات المخزنية" />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>تحديد فترة الإقفال</CardTitle>
                        <CardDescription>
                            اختر المخزن والتاريخ لإقفال الفترة المحاسبية للمخزون.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-3 gap-4">
                       <div className="space-y-2">
                            <Label htmlFor="warehouse">المخزن</Label>
                            <Select value={warehouseId} onValueChange={setWarehouseId} disabled={dataLoading}>
                                <SelectTrigger><SelectValue placeholder="اختر مخزنًا" /></SelectTrigger>
                                <SelectContent>
                                    {warehouses.map((w: Warehouse) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {lastClosingDate && (
                                <p className="text-xs text-muted-foreground">آخر تاريخ إقفال لهذا المخزن: {lastClosingDate.toLocaleDateString('ar-EG')}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="closing-date">تاريخ الإقفال</Label>
                            <Input
                                id="closing-date"
                                type="date"
                                value={closingDate}
                                onChange={(e) => setClosingDate(e.target.value)}
                                disabled={dataLoading}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Button onClick={handleCalculateBalances} disabled={isLoading || dataLoading || !warehouseId || !closingDate}>
                            {isLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <FileSearch className="ml-2 h-4 w-4" />}
                            حساب الأرصدة ومراجعتها
                        </Button>
                    </CardFooter>
                </Card>

                {reviewData && (
                     <Card>
                        <CardHeader>
                            <CardTitle>مراجعة الأرصدة قبل الإقفال النهائي</CardTitle>
                            <CardDescription>
                                هذه هي الأرصدة النهائية التي سيتم تجميدها للمخزن المحدد في تاريخ {closingDate}. راجعها جيدًا قبل المتابعة.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="w-full overflow-auto border rounded-lg max-h-96">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>كود الصنف</TableHead>
                                            <TableHead>اسم الصنف</TableHead>
                                            <TableHead className="text-center">الرصيد النهائي</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reviewData.map(item => (
                                            <TableRow key={item.itemId}>
                                                <TableCell>{item.code}</TableCell>
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell className="text-center font-bold">{item.balance}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                             </div>
                        </CardContent>
                         <CardFooter className="flex justify-between">
                            <p className="text-sm text-muted-foreground">إجمالي الأصناف المتأثرة: {reviewData.length}</p>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Lock className="ml-2 h-4 w-4" />}
                                        تنفيذ الإقفال النهائي
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            سيتم إقفال جميع الحركات للمخزن المحدد حتى تاريخ <span className="font-bold">{new Date(closingDate).toLocaleDateString('ar-EG')}</span>.
                                            هذا الإجراء نهائي ولا يمكن التراجع عنه.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                        <AlertDialogAction onClick={handlePerformClosing} className="bg-destructive hover:bg-destructive/90">نعم، قم بالإقفال</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                         </CardFooter>
                     </Card>
                )}

            </main>
        </>
    );
}

