
"use client";

import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Trash2, Printer, Save, Loader2 } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import useFirebase from "@/hooks/use-firebase";
import { useToast } from "@/hooks/use-toast";
import { Combobox } from "@/components/ui/combobox";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/contexts/auth-context";

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

interface PurchaseReturn {
    id: string;
    receiptNumber?: string;
    supplierId: string;
    warehouseId: string;
    items: { id: string; name: string; qty: number; }[];
}

interface Supplier {
    id: string;
    name: string;
}

export default function NewStockOutPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [items, setItems] = useState<StockItem[]>([]);
    const [newItem, setNewItem] = useState({ id: "", name: "", qty: 1, unit: "" });
    const [source, setSource] = useState<string>("");
    const [notes, setNotes] = useState<string>("");
    const [reason, setReason] = useState<string>("");
    const [selectedPurchaseReturn, setSelectedPurchaseReturn] = useState<string>("");
    const { user } = useAuth();

    const { data: availableItems, loading: loadingItems } = useFirebase<Item>('items');
    const { data: warehouses, loading: loadingWarehouses } = useFirebase<Warehouse>('warehouses');
    const { data: purchaseReturns, loading: loadingReturns } = useFirebase<PurchaseReturn>('purchaseReturns');
    const { data: suppliers, loading: loadingSuppliers } = useFirebase<Supplier>('suppliers');
    const { add: addStockOutRecord, getNextId } = useFirebase("stockOutRecords");

    const getSupplierName = (supplierId: string) => suppliers.find(s => s.id === supplierId)?.name || 'غير معروف';

    const purchaseReturnOptions = useMemo(() => 
        purchaseReturns.map(pr => ({
            value: pr.id,
            label: `${pr.receiptNumber || pr.id} - ${getSupplierName(pr.supplierId)}`
        })), [purchaseReturns, suppliers]);

    useEffect(() => {
        if(reason === 'return' && selectedPurchaseReturn) {
            const preturn = purchaseReturns.find(pr => pr.id === selectedPurchaseReturn);
            if(preturn) {
                setSource(preturn.warehouseId); // Automatically select warehouse from return document
                const returnItems: StockItem[] = preturn.items.map(item => {
                    const availableItem = availableItems.find(i => i.id === item.id);
                    return {
                        id: item.id,
                        name: item.name,
                        qty: item.qty,
                        unit: availableItem?.unit || 'قطعة',
                        uniqueId: `${item.id}-${Date.now()}`
                    }
                })
                setItems(returnItems);
            }
        } else {
            setItems([]);
             if (reason !== 'return') {
                setSource(""); // Reset warehouse if reason is not purchase return
            }
        }
    }, [reason, selectedPurchaseReturn, purchaseReturns, availableItems]);


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

    const handleConfirm = async () => {
        if (!source || items.length === 0) {
            toast({ variant: "destructive", title: "بيانات غير مكتملة", description: "يرجى اختيار المصدر وإضافة صنف واحد على الأقل."});
            return;
        }
        
        const nextId = await getNextId('stockOut');
         if(!nextId) {
            toast({
                variant: "destructive",
                title: "حدث خطأ",
                description: "فشل في إنشاء رقم الإيصال. يرجى المحاولة مرة أخرى.",
            });
            return;
        }

        const record = {
            sourceId: source,
            date: new Date().toISOString(),
            items: items.map(({id, name, qty}) => ({id, name, qty})), // Remove uniqueId before saving
            reason,
            notes,
            receiptNumber: `إذ-خ-${nextId}`,
            createdById: user?.id,
            createdByName: user?.name,
        }

        try {
            await addStockOutRecord(record);
            toast({ title: "تم بنجاح", description: `تم تأكيد صرف المخزون بنجاح برقم إيصال: ${record.receiptNumber}`});
            router.push('/inventory/stock-out');
        } catch(error) {
            toast({ variant: "destructive", title: "حدث خطأ", description: "فشل في حفظ إيصال الصرف. يرجى المحاولة مرة أخرى."});
            console.error("Failed to save stock out record:", error);
        }
    };

    const loading = loadingItems || loadingWarehouses || loadingReturns || loadingSuppliers;
    const getUnitLabel = (unit: string) => {
        const units = { piece: "قطعة", weight: "وزن", meter: "متر", kilo: "كيلو", gram: "جرام" };
        return units[unit as keyof typeof units] || unit;
    }


  return (
    <>
      <PageHeader title="إذن صرف مخزون جديد">
        <div className="flex gap-2 no-print">
            <Button onClick={handlePrint} variant="outline">
                <Printer className="ml-2 h-4 w-4" />
                طباعة
            </Button>
        </div>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 printable-area">
        <Card>
          <CardHeader>
            <CardTitle>إيصال صرف مخزني</CardTitle>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div>رقم الإيصال: (سيتم إنشاؤه عند الحفظ)</div>
                <div>تاريخ الصرف: {new Date().toLocaleDateString('ar-EG')}</div>
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
                            <Label htmlFor="warehouse">من مخزن</Label>
                            <Select value={source} onValueChange={setSource} disabled={reason === 'return'}>
                                <SelectTrigger id="warehouse">
                                    <SelectValue placeholder="اختر المصدر" />
                                </SelectTrigger>
                                <SelectContent>
                                   {warehouses.map(w => <SelectItem key={`wh-${w.id}`} value={w.id}>{w.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reason">سبب الصرف</Label>
                            <Select value={reason} onValueChange={setReason}>
                                <SelectTrigger id="reason">
                                    <SelectValue placeholder="اختر سبب الصرف" />
                                </SelectTrigger>
                                <SelectContent>
                                   <SelectItem value="damaged">تالف</SelectItem>
                                   <SelectItem value="samples">عينات</SelectItem>
                                   <SelectItem value="return">مرتجع لمورد</SelectItem>
                                   <SelectItem value="other">أخرى</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     {reason === 'return' && (
                        <div className="space-y-2">
                            <Label htmlFor="purchase-return">إذن مرتجع الشراء</Label>
                            <Combobox
                                options={purchaseReturnOptions}
                                value={selectedPurchaseReturn}
                                onValueChange={setSelectedPurchaseReturn}
                                placeholder="اختر إذن مرتجع الشراء..."
                                emptyMessage="لا توجد أذونات مرتجع."
                            />
                        </div>
                    )}
                    
                    <div>
                      <Label>الأصناف المصروفة</Label>
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
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.uniqueId)} disabled={reason === 'return'}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                                </TableRow>
                            ))}
                             {reason !== 'return' && (
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
                                        <Input type="number" placeholder="الكمية" value={newItem.qty} onChange={e => setNewItem({...newItem, qty: parseInt(e.target.value) || 1})} />
                                    </TableCell>
                                    <TableCell className="text-center p-2">
                                        <Button onClick={handleAddItem} size="sm">
                                            <PlusCircle className="ml-2 h-4 w-4" />
                                            إضافة
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )}
                            </TableBody>
                        </Table>
                      </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="notes">ملاحظات</Label>
                        <Textarea id="notes" placeholder="أضف أي ملاحظات هنا..." value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>
                </>
            )}
          </CardContent>
          <CardFooter className="flex justify-end no-print">
            <Button size="lg" disabled={loading} onClick={handleConfirm}>تأكيد الصرف</Button>
          </CardFooter>
        </Card>
      </main>
    </>
  );
}
