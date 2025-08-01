

"use client";

import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Trash2, Loader2 } from "lucide-react";
import React, { useState, useMemo, useCallback } from "react";
import useFirebase from "@/hooks/use-firebase";
import { useToast } from "@/hooks/use-toast";
import { Combobox } from "@/components/ui/combobox";
import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-provider";


interface AdjustmentItem {
  itemId: string;
  itemName: string;
  systemQty: number; 
  actualQty: number;
  difference: number;
  uniqueId: string;
}

interface Item {
    id: string;
    name: string;
}
interface Warehouse { id: string; name: string; }
interface SaleInvoice { id: string; warehouseId: string; items: { id: string; qty: number; }[]; status?: 'approved'|'pending' }
interface PurchaseInvoice { id: string; warehouseId: string; items: { id: string; qty: number; }[]; }
interface StockInRecord { id: string; warehouseId: string; items: { id: string; qty: number; }[]; }
interface StockOutRecord { id: string; sourceId: string; items: { id: string; qty: number; }[]; }
interface StockTransferRecord { id: string; fromSourceId: string; toSourceId: string; items: { id: string; qty: number; }[]; }
interface StockAdjustmentRecord {
    id: string;
    warehouseId: string;
    items: { itemId: string; difference: number; }[];
    createdById?: string;
    createdByName?: string;
}
interface SalesReturn { id: string; warehouseId: string; items: { id: string; qty: number; }[]; }
interface PurchaseReturn { id: string; warehouseId: string; items: { id: string; qty: number; }[]; }
interface IssueToRep { id: string; warehouseId: string; items: { id: string; qty: number; }[]; }
interface ReturnFromRep { id: string; warehouseId: string; items: { id: string; qty: number; }[]; }
interface PosSale { id: string; warehouseId: string; items: { id: string; qty: number; }[]; }
interface InventoryClosing { id: string; warehouseId: string; closingDate: string; balances: { itemId: string, balance: number }[] }


export default function StockAdjustmentPage() {
    const { toast } = useToast();
    const [items, setItems] = useState<AdjustmentItem[]>([]);
    const [newItem, setNewItem] = useState({ itemId: "", actualQty: 0, systemQty: 0 });
    const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
    const [notes, setNotes] = useState<string>("");
    const { user } = useAuth();
    
    const { 
        items: availableItems, 
        warehouses, 
        salesInvoices, 
        stockInRecords, 
        stockOutRecords, 
        stockTransferRecords,
        stockAdjustmentRecords,
        salesReturns,
        purchaseReturns,
        stockIssuesToReps,
        stockReturnsFromReps,
        posSales,
        inventoryClosings,
        dbAction, 
        getNextId, 
        loading 
    } = useData();
    

    const availableItemsForCombobox = useMemo(() => {
        return availableItems.map(item => ({ value: item.id, label: item.name }));
    }, [availableItems]);
    
    const warehouseOptions = useMemo(() => warehouses.map(w => ({ value: w.id, label: w.name })), [warehouses]);


    const calculateSystemStock = useCallback((itemId: string, warehouseId: string): number => {
        if (!itemId || !warehouseId) return 0;
        
        const closingsForWarehouse = inventoryClosings.filter((c: InventoryClosing) => c.warehouseId === warehouseId);
        const lastClosing = closingsForWarehouse.length > 0 ? closingsForWarehouse.reduce((latest: any, current: any) => new Date(latest.closingDate) > new Date(current.closingDate) ? latest : current) : null;
        
        let stock = lastClosing?.balances.find((b: any) => b.itemId === itemId)?.balance || 0;
        const lastClosingDate = lastClosing ? new Date(lastClosing.closingDate) : new Date(0);
        
        const filterTransactions = (t: any) => new Date(t.date) > lastClosingDate;
        
        // Increases
        stockInRecords.filter((si: any) => si.warehouseId === warehouseId && filterTransactions(si)).forEach((si: any) => si.items.filter((i: any) => i.id === itemId).forEach((i: any) => stock += i.qty));
        stockTransferRecords.filter((t: any) => t.toSourceId === warehouseId && filterTransactions(t)).forEach((t: any) => t.items.filter((i: any) => i.id === itemId).forEach((i: any) => stock += i.qty));
        stockAdjustmentRecords.filter((adj: any) => adj.warehouseId === warehouseId && filterTransactions(adj)).forEach((adj: any) => adj.items.filter((i: any) => i.itemId === itemId && i.difference > 0).forEach((i: any) => stock += i.difference));
        salesReturns.filter((sr: any) => sr.warehouseId === warehouseId && filterTransactions(sr)).forEach((sr: any) => sr.items.filter((i: any) => i.id === itemId).forEach((i: any) => stock += i.qty));
        stockReturnsFromReps.filter((rfr: any) => rfr.warehouseId === warehouseId && filterTransactions(rfr)).forEach((rfr: any) => rfr.items.filter((i: any) => i.id === itemId).forEach((i: any) => stock += i.qty));

        // Decreases
        salesInvoices.filter((s: any) => s.warehouseId === warehouseId && s.status === 'approved' && filterTransactions(s)).forEach((s: any) => s.items.filter((i: any) => i.id === itemId).forEach((i: any) => stock -= i.qty));
        posSales.filter((s: any) => s.warehouseId === warehouseId && filterTransactions(s)).forEach((s: any) => s.items.filter((i: any) => i.id === itemId).forEach((i: any) => stock -= i.qty));
        stockOutRecords.filter((so: any) => so.sourceId === warehouseId && filterTransactions(so)).forEach((so: any) => so.items.filter((i: any) => i.id === itemId).forEach((i: any) => stock -= i.qty));
        stockTransferRecords.filter((t: any) => t.fromSourceId === warehouseId && filterTransactions(t)).forEach((t: any) => t.items.filter((i: any) => i.id === itemId).forEach((i: any) => stock -= i.qty));
        stockAdjustmentRecords.filter((adj: any) => adj.warehouseId === warehouseId && filterTransactions(adj)).forEach((adj: any) => adj.items.filter((i: any) => i.itemId === itemId && i.difference < 0).forEach((i: any) => stock += i.difference));
        purchaseReturns.filter((pr: any) => pr.warehouseId === warehouseId && filterTransactions(pr)).forEach((pr: any) => pr.items.filter((i: any) => i.id === itemId).forEach((i: any) => stock -= i.qty));
        stockIssuesToReps.filter((itr: any) => itr.warehouseId === warehouseId && filterTransactions(itr)).forEach((itr: any) => itr.items.filter((i: any) => i.id === itemId).forEach((i: any) => stock -= i.qty));
        
        return stock;

    }, [
        inventoryClosings, stockInRecords, stockTransferRecords, stockAdjustmentRecords,
        salesReturns, stockReturnsFromReps, salesInvoices, posSales, stockOutRecords,
        purchaseReturns, stockIssuesToReps
    ]);


    const handleAddItem = () => {
        if (!newItem.itemId || !selectedWarehouse) {
            toast({
                variant: "destructive",
                title: "خطأ",
                description: "يرجى اختيار مخزن وصنف وكمية صالحة.",
            });
            return;
        }
        const selectedItemData = availableItems.find(i => i.id === newItem.itemId);
        if (!selectedItemData) return;
        
        const systemQty = calculateSystemStock(newItem.itemId, selectedWarehouse);
        const difference = newItem.actualQty - systemQty;

        setItems([
        ...items,
        { 
            itemId: selectedItemData.id,
            itemName: selectedItemData.name,
            systemQty: systemQty,
            actualQty: newItem.actualQty,
            difference: difference,
            uniqueId: `${selectedItemData.id}-${Date.now()}`
        },
        ]);
        setNewItem({ itemId: "", actualQty: 0, systemQty: 0 });
    };

    const handleRemoveItem = (uniqueId: string) => {
        setItems(items.filter((item) => item.uniqueId !== uniqueId));
    };

    const resetForm = () => {
        setItems([]);
        setNewItem({ itemId: "", actualQty: 0, systemQty: 0 });
        setSelectedWarehouse("");
        setNotes("");
    }

    const handleConfirm = async () => {
        if (!selectedWarehouse || items.length === 0) {
            toast({
                variant: "destructive",
                title: "بيانات غير مكتملة",
                description: "يرجى اختيار مخزن وإضافة صنف واحد على الأقل للتسوية.",
            });
            return;
        }
        
        const nextId = await getNextId('stockAdjustment');
        if(!nextId) {
            toast({ variant: "destructive", title: "حدث خطأ", description: "فشل في إنشاء رقم الإيصال." });
            return;
        }

        const record = {
            warehouseId: selectedWarehouse,
            date: new Date().toISOString(),
            items: items.map(({ uniqueId, itemName, ...rest}) => rest), // Remove client-side fields
            notes,
            receiptNumber: `ت-م-${nextId}`,
            createdById: user?.id,
            createdByName: user?.name,
        };

        try {
            await dbAction('stockAdjustmentRecords', 'add', record);
            toast({ title: "تم بنجاح", description: `تم حفظ تسوية المخزون برقم إيصال: ${record.receiptNumber}` });
            resetForm();
        } catch(error) {
             toast({ variant: "destructive", title: "حدث خطأ", description: "فشل في حفظ إيصال التسوية." });
             console.error("Failed to save stock adjustment: ", error);
        }
    };


  return (
    <>
      <PageHeader title="تسوية المخزون" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 printable-area">
        <Card>
          <CardHeader>
            <CardTitle>إيصال تسوية مخزنية</CardTitle>
            <CardDescription>
                استخدم هذه الشاشة لتصحيح كميات المخزون بناءً على الجرد الفعلي.
            </CardDescription>
             <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground pt-2">
                <div>رقم الإيصال: (سيتم إنشاؤه عند الحفظ)</div>
                <div>تاريخ التسوية: {new Date().toLocaleDateString('ar-EG')}</div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
                 <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="warehouse">المخزن</Label>
                            <Combobox
                                options={warehouseOptions}
                                value={selectedWarehouse}
                                onValueChange={setSelectedWarehouse}
                                placeholder="اختر المخزن..."
                                emptyMessage="لم يتم العثور على مخزن."
                            />
                        </div>
                    </div>
                    
                    <div>
                      <Label>الأصناف</Label>
                      <div className="w-full overflow-auto border rounded-lg">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40%]">الصنف</TableHead>
                                <TableHead className="text-center">الكمية بالنظام</TableHead>
                                <TableHead className="text-center">الكمية الفعلية</TableHead>
                                <TableHead className="text-center">الفرق</TableHead>
                                <TableHead className="text-center w-[100px] no-print">الإجراء</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {items.map((item) => (
                                <TableRow key={item.uniqueId}>
                                <TableCell>{item.itemName}</TableCell>
                                <TableCell className="text-center">{item.systemQty}</TableCell>
                                <TableCell className="text-center">{item.actualQty}</TableCell>
                                <TableCell className={`text-center font-bold ${item.difference > 0 ? 'text-green-500' : item.difference < 0 ? 'text-destructive' : ''}`}>
                                    {item.difference > 0 ? `+${item.difference}` : item.difference}
                                </TableCell>
                                <TableCell className="text-center no-print">
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.uniqueId)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                                </TableRow>
                            ))}
                             <TableRow className="no-print bg-muted/30">
                                <TableCell className="p-2">
                                    <Combobox
                                        options={availableItemsForCombobox}
                                        value={newItem.itemId}
                                        onValueChange={(value) => setNewItem({ ...newItem, itemId: value })}
                                        placeholder="ابحث عن صنف..."
                                        emptyMessage="لم يتم العثور على الصنف."
                                    />
                                </TableCell>
                                <TableCell></TableCell>
                                <TableCell className="p-2">
                                    <Input type="number" placeholder="الكمية الفعلية" value={newItem.actualQty} onChange={e => setNewItem({...newItem, actualQty: parseInt(e.target.value) || 0})} />
                                </TableCell>
                                <TableCell></TableCell>
                                <TableCell className="text-center">
                                    <Button onClick={handleAddItem} size="sm" disabled={!selectedWarehouse || !newItem.itemId}>
                                        <PlusCircle className="ml-2 h-4 w-4" />
                                        إضافة
                                    </Button>
                                </TableCell>
                            </TableRow>
                            </TableBody>
                        </Table>
                      </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">ملاحظات</Label>
                        <Textarea id="notes" placeholder="أضف سبب التسوية أو أي ملاحظات هنا..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>
                </>
            )}
          </CardContent>
          <CardFooter className="flex justify-end no-print">
            <Button size="lg" disabled={loading} onClick={handleConfirm}>تأكيد التسوية</Button>
          </CardFooter>
        </Card>
      </main>
    </>
  );
}
