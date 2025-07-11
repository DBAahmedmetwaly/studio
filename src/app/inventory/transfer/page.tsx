
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

interface StockItem {
  id: string; // The database ID of the item
  name: string;
  qty: number;
  unit: string;
  uniqueId: string; // A unique ID for the list key
}

interface Item {
    id: string;
    name: string;
    unit: string;
}

interface Warehouse {
    id: string;
    name: string;
}

export default function StockTransferPage() {
    const { toast } = useToast();
    const [items, setItems] = useState<StockItem[]>([]);
    const [newItem, setNewItem] = useState({ id: "", name: "", qty: 1, unit: "" });
    const [fromSource, setFromSource] = useState<string>("");
    const [toSource, setToSource] = useState<string>("");

    const { data: availableItems, loading: loadingItems } = useFirebase<Item>('items');
    const { data: warehouses, loading: loadingWarehouses } = useFirebase<Warehouse>('warehouses');
    const { add: addStockTransferRecord, getNextId } = useFirebase("stockTransferRecords");


    const handleAddItem = () => {
        if (!newItem.id || newItem.qty <= 0) {
            toast({ variant: "destructive", title: "خطأ", description: "يرجى اختيار صنف وكمية صالحة."});
            return;
        }
        const selectedItem = availableItems.find(i => i.id === newItem.id);
        if (!selectedItem) return;

        setItems([
        ...items,
        { 
            id: selectedItem.id,
            name: selectedItem.name,
            qty: newItem.qty,
            unit: selectedItem.unit,
            uniqueId: `${selectedItem.id}-${Date.now()}` // Create a unique ID for the key
        },
        ]);
        setNewItem({ id: "", name: "", qty: 1, unit: "" });
    };

    const handleItemSelect = (itemId: string) => {
        const selectedItem = availableItems.find(i => i.id === itemId);
        if (selectedItem) {
            setNewItem({
                ...newItem,
                id: itemId,
                unit: selectedItem.unit,
            });
        }
    }


    const handleRemoveItem = (uniqueId: string) => {
        setItems(items.filter((item) => item.uniqueId !== uniqueId));
    };

    const handlePrint = () => {
        window.print();
    };

    const resetForm = () => {
        setItems([]);
        setNewItem({ id: "", name: "", qty: 1, unit: "" });
        setFromSource("");
        setToSource("");
    }

    const handleConfirm = async () => {
        if (!fromSource || !toSource || items.length === 0) {
            toast({ variant: "destructive", title: "بيانات غير مكتملة", description: "يرجى اختيار جهة التحويل وإضافة صنف واحد على الأقل."});
            return;
        }

        if(fromSource === toSource) {
            toast({ variant: "destructive", title: "خطأ", description: "لا يمكن التحويل من وإلى نفس المخزن."});
            return;
        }
        
        const nextId = await getNextId('stockTransfer');
        if(!nextId) {
            toast({
                variant: "destructive",
                title: "حدث خطأ",
                description: "فشل في إنشاء رقم الإيصال. يرجى المحاولة مرة أخرى.",
            });
            return;
        }

        const record = {
            fromSourceId: fromSource,
            toSourceId: toSource,
            date: new Date().toISOString(),
            items: items.map(({id, name, qty}) => ({id, name, qty})), // Remove uniqueId before saving
            receiptNumber: `إذ-ت-${nextId}`
        }

        try {
            await addStockTransferRecord(record);
            toast({ title: "تم بنجاح", description: `تم تأكيد تحويل المخزون بنجاح برقم إيصال: ${record.receiptNumber}`});
            resetForm();
        } catch(error) {
            toast({ variant: "destructive", title: "حدث خطأ", description: "فشل في حفظ إيصال التحويل. يرجى المحاولة مرة أخرى."});
            console.error("Failed to save stock transfer record:", error);
        }
    };

    const loading = loadingItems || loadingWarehouses;
    const getUnitLabel = (unit: string) => {
        const units = { piece: "قطعة", weight: "وزن", meter: "متر", kilo: "كيلو", gram: "جرام" };
        return units[unit as keyof typeof units] || unit;
    }


  return (
    <>
      <PageHeader title="تحويل مخزون">
        <div className="flex gap-2 no-print">
            <Button onClick={handlePrint}>
                <Printer className="ml-2 h-4 w-4" />
                طباعة
            </Button>
        </div>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 printable-area">
        <Card>
          <CardHeader>
            <CardTitle>إيصال تحويل مخزني</CardTitle>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div>رقم الإيصال: (سيتم إنشاؤه عند الحفظ)</div>
                <div>تاريخ التحويل: {new Date().toLocaleDateString('ar-EG')}</div>
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
                        <Label htmlFor="from-warehouse">من مخزن</Label>
                        <Select value={fromSource} onValueChange={setFromSource}>
                            <SelectTrigger id="from-warehouse">
                                <SelectValue placeholder="اختر المحول منه" />
                            </SelectTrigger>
                            <SelectContent>
                               {warehouses.map(w => <SelectItem key={`from-wh-${w.id}`} value={w.id}>{w.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="to-warehouse">إلى مخزن</Label>
                        <Select value={toSource} onValueChange={setToSource}>
                            <SelectTrigger id="to-warehouse">
                                <SelectValue placeholder="اختر المحول إليه" />
                            </SelectTrigger>
                            <SelectContent>
                               {warehouses.map(w => <SelectItem key={`to-wh-${w.id}`} value={w.id}>{w.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                <div>
                <Label>الأصناف المحولة</Label>
                 <div className="w-full overflow-auto border rounded-lg">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50%]">الصنف</TableHead>
                            <TableHead className="text-center">الوحدة</TableHead>
                            <TableHead className="text-center">الكمية</TableHead>
                            <TableHead className="text-center w-[100px] no-print">الإجراء</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.uniqueId}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-center">{getUnitLabel(item.unit)}</TableCell>
                            <TableCell className="text-center">{item.qty}</TableCell>
                            <TableCell className="text-center no-print">
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.uniqueId)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </TableCell>
                            </TableRow>
                        ))}
                        <TableRow className="no-print bg-muted/30">
                            <TableCell className="p-2">
                                <Select value={newItem.id} onValueChange={handleItemSelect}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر صنفًا" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {availableItems.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </TableCell>
                             <TableCell></TableCell>
                            <TableCell className="p-2">
                                <Input type="number" placeholder="الكمية" value={newItem.qty} onChange={e => setNewItem({...newItem, qty: parseInt(e.target.value) || 1})}/>
                            </TableCell>
                            <TableCell className="text-center p-2">
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
            </>
            )}
          </CardContent>
          <CardFooter className="flex justify-end no-print">
            <Button size="lg" disabled={loading} onClick={handleConfirm}>تأكيد التحويل</Button>
          </CardFooter>
        </Card>
      </main>
    </>
  );
}
