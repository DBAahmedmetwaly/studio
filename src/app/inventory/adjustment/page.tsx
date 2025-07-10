
"use client";

import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Trash2, Printer, Save, Loader2 } from "lucide-react";
import React, { useState } from "react";
import useFirebase from "@/hooks/use-firebase";
import { useToast } from "@/hooks/use-toast";

interface AdjustmentItem {
  itemId: string;
  itemName: string;
  systemQty: number; // For display, can be calculated
  actualQty: number;
  difference: number;
  uniqueId: string;
}

interface Item {
    id: string;
    name: string;
    openingStock?: number;
}

interface Warehouse {
    id: string;
    name: string;
}

export default function StockAdjustmentPage() {
    const { toast } = useToast();
    const [items, setItems] = useState<AdjustmentItem[]>([]);
    const [newItem, setNewItem] = useState({ itemId: "", actualQty: 0, systemQty: 0 });
    const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
    const [notes, setNotes] = useState<string>("");
    
    const { data: availableItems, loading: loadingItems } = useFirebase<Item>('items');
    const { data: warehouses, loading: loadingWarehouses } = useFirebase<Warehouse>('warehouses');
    const { add: addAdjustmentRecord, getNextId } = useFirebase("stockAdjustmentRecords");

    const handleAddItem = () => {
        if (!newItem.itemId || newItem.actualQty < 0) {
            toast({
                variant: "destructive",
                title: "خطأ",
                description: "يرجى اختيار صنف وكمية صالحة.",
            });
            return;
        }
        const selectedItemData = availableItems.find(i => i.id === newItem.itemId);
        if (!selectedItemData) return;
        
        // Note: systemQty should be calculated based on all movements. 
        // For simplicity here, we'll use openingStock. A real implementation needs a full stock ledger.
        const systemQty = selectedItemData.openingStock || 0; 
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
                description: "يرجى اختيار مستودع وإضافة صنف واحد على الأقل للتسوية.",
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
            receiptNumber: `ADJ-${nextId}`
        };

        try {
            await addAdjustmentRecord(record);
            toast({ title: "تم بنجاح", description: `تم حفظ تسوية المخزون برقم إيصال: ${record.receiptNumber}` });
            resetForm();
        } catch(error) {
             toast({ variant: "destructive", title: "حدث خطأ", description: "فشل في حفظ إيصال التسوية." });
             console.error("Failed to save stock adjustment: ", error);
        }
    };

    const loading = loadingItems || loadingWarehouses;

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
                            <Label htmlFor="warehouse">المستودع</Label>
                            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                                <SelectTrigger id="warehouse">
                                    <SelectValue placeholder="اختر المستودع" />
                                </SelectTrigger>
                                <SelectContent>
                                   {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
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
                                <TableCell>
                                    <Select value={newItem.itemId} onValueChange={(value) => setNewItem({ ...newItem, itemId: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر صنفًا" />
                                        </SelectTrigger>
                                        <SelectContent>
                                        {availableItems.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell></TableCell>
                                <TableCell>
                                    <Input type="number" placeholder="الكمية الفعلية" value={newItem.actualQty} onChange={e => setNewItem({...newItem, actualQty: parseInt(e.target.value) || 0})} />
                                </TableCell>
                                <TableCell></TableCell>
                                <TableCell className="text-center">
                                    <Button onClick={handleAddItem} size="sm">
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
