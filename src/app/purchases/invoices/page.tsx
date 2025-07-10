
"use client";

import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Trash2, Printer, Save, Wand2, Loader2 } from "lucide-react";
import React, { useState, useEffect, useTransition } from "react";
import { extractInvoiceItems } from "@/ai/flows/extract-invoice-items";
import useFirebase from "@/hooks/use-firebase";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { Switch } from "@/components/ui/switch";

interface InvoiceItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  total: number;
  unit: string;
}

interface Item {
    id: string;
    name: string;
    unit: string;
    price?: number;
    cost?: number;
}

interface Supplier {
    id: string;
    name: string;
}

interface Warehouse {
    id: string;
    name: string;
}

export default function PurchaseInvoicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [newItem, setNewItem] = useState({ id: "", name: "", qty: 1, price: 0, unit: "" });
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [applyTax, setApplyTax] = useState(true);
  const [invoiceText, setInvoiceText] = useState("");
  const [isAiPending, startAiTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);

  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [notes, setNotes] = useState("");
  
  const [invoiceDate, setInvoiceDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  
  const { data: availableItems, loading: loadingItems } = useFirebase<Item>('items');
  const { data: suppliers, loading: loadingSuppliers } = useFirebase<Supplier>('suppliers');
  const { data: warehouses, loading: loadingWarehouses } = useFirebase<Warehouse>('warehouses');
  const { add: addPurchaseInvoice, getNextId } = useFirebase('purchaseInvoices');

  useEffect(() => {
    const newSubtotal = items.reduce((acc, item) => acc + item.total, 0);
    const newTax = applyTax ? (newSubtotal - discount) * 0.14 : 0;
    setSubtotal(newSubtotal);
    setTax(newTax);
    setTotal(newSubtotal - discount + newTax);
  }, [items, discount, applyTax]);

  useEffect(() => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 30);
    setInvoiceDate(today.toLocaleDateString('ar-EG'));
    setDueDate(futureDate.toLocaleDateString('ar-EG'));
  }, []);

  const handleAddItem = () => {
    if (!newItem.id || newItem.qty <= 0 || newItem.price <= 0) return;
    const selectedItem = availableItems.find(i => i.id === newItem.id);
    if (!selectedItem) return;

    setItems([
      ...items,
      { 
        ...newItem,
        id: `${selectedItem.id}-${Date.now()}`,
        name: selectedItem.name,
        total: newItem.qty * newItem.price,
        unit: selectedItem.unit,
      },
    ]);
    setNewItem({ id: "", name: "", qty: 1, price: 0, unit: "" });
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleItemSelect = (itemId: string) => {
    const selectedItem = availableItems.find(i => i.id === itemId);
    if (selectedItem) {
        setNewItem({
            ...newItem,
            id: itemId,
            price: selectedItem.cost || selectedItem.price || 0,
            unit: selectedItem.unit,
        });
    }
  }

  const handleAiExtract = () => {
    if(!invoiceText) return;
    startAiTransition(async () => {
        try {
            const result = await extractInvoiceItems({text: invoiceText});
            if (result && result.items) {
                 const newAiItems: InvoiceItem[] = result.items.map((item, index) => {
                     const matchedItem = availableItems.find(i => i.name.includes(item.itemName))
                     return {
                        id: matchedItem ? `${matchedItem.id}-${Date.now()}` : `ai-item-${Date.now()}-${index}`,
                        name: item.itemName,
                        qty: item.quantity,
                        price: item.price,
                        total: item.quantity * item.price,
                        unit: matchedItem?.unit || 'قطعة'
                    }
                });
                setItems(prevItems => [...prevItems, ...newAiItems]);
                setInvoiceText("");
            }
        } catch (error) {
            console.error("Failed to extract invoice items:", error);
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تحليل الفاتورة بالذكاء الاصطناعي.'});
        }
    });
  }

  const handleSaveInvoice = async () => {
      if (!supplierId || !warehouseId || items.length === 0) {
            toast({
                variant: 'destructive',
                title: 'بيانات غير مكتملة',
                description: 'يرجى اختيار المورد والمخزن وإضافة صنف واحد على الأقل.'
            });
            return;
        }
        setIsSaving(true);
        try {
            const invoiceNumber = `PUR-${await getNextId('purchaseInvoice')}`;
            const supplierName = suppliers.find(s => s.id === supplierId)?.name || '';

            const invoiceData = {
                invoiceNumber,
                date: new Date().toISOString(),
                supplierId,
                supplierName,
                warehouseId,
                items: items.map(item => {
                    const originalItemId = item.id.split('-')[0];
                    return {
                        id: originalItemId,
                        name: item.name,
                        qty: item.qty,
                        price: item.price,
                        total: item.total,
                    }
                }),
                subtotal,
                discount,
                tax,
                total,
                notes,
            };

            await addPurchaseInvoice(invoiceData);
            toast({
                title: 'تم الحفظ بنجاح',
                description: `تم حفظ فاتورة الشراء رقم ${invoiceNumber}`
            });
            router.push('/purchases/invoices/list');
        } catch (error) {
            console.error("Failed to save purchase invoice:", error);
            toast({
                variant: 'destructive',
                title: 'خطأ',
                description: 'فشل حفظ الفاتورة. الرجاء المحاولة مرة أخرى.'
            });
        } finally {
            setIsSaving(false);
        }
  }

  const loading = loadingItems || loadingSuppliers || loadingWarehouses;
  const getUnitForItem = (itemId: string) => {
    if (!itemId) return '';
    const originalId = itemId.split('-')[0];
    return availableItems.find(i => i.id === originalId)?.unit || 'قطعة';
  }

  return (
    <>
      <PageHeader title="فاتورة شراء جديدة">
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
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <CardTitle>فاتورة شراء</CardTitle>
                    <CardDescription>
                        شركة المحاسب الذكي
                    </CardDescription>
                </div>
                <div className="text-left text-sm md:text-base">
                    <div className="font-bold text-lg">فاتورة #(سيتم إنشاؤه)</div>
                    <div>تاريخ الفاتورة: {invoiceDate}</div>
                    <div>تاريخ الاستحقاق: {dueDate}</div>
                </div>
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
                        <Label htmlFor="supplier">المورد</Label>
                        <Select value={supplierId} onValueChange={setSupplierId}>
                            <SelectTrigger id="supplier">
                                <SelectValue placeholder="اختر موردًا" />
                            </SelectTrigger>
                            <SelectContent>
                               {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="warehouse">المخزن المستلم</Label>
                        <Select value={warehouseId} onValueChange={setWarehouseId}>
                            <SelectTrigger id="warehouse">
                                <SelectValue placeholder="اختر مخزنًا" />
                            </SelectTrigger>
                            <SelectContent>
                               {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                
                <div>
                <Label>بنود الفاتورة</Label>
                <div className="w-full overflow-auto border rounded-lg">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40%]">الصنف</TableHead>
                            <TableHead className="text-center">الوحدة</TableHead>
                            <TableHead className="text-center">الكمية</TableHead>
                            <TableHead className="text-center">سعر الوحدة</TableHead>
                            <TableHead className="text-center">الإجمالي</TableHead>
                            <TableHead className="text-center w-[100px] no-print">الإجراء</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {items.map((item, index) => (
                            <TableRow key={item.id}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-center">{item.unit}</TableCell>
                            <TableCell className="text-center">{item.qty}</TableCell>
                            <TableCell className="text-center">ج.م {item.price.toFixed(2)}</TableCell>
                            <TableCell className="text-center">ج.م {item.total.toFixed(2)}</TableCell>
                            <TableCell className="text-center no-print">
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </TableCell>
                            </TableRow>
                        ))}
                        <TableRow className="no-print bg-muted/20">
                            <TableCell className="p-2">
                                <Select value={newItem.id} onValueChange={handleItemSelect}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر صنفًا" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {availableItems.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground p-2">{newItem.unit}</TableCell>
                            <TableCell className="p-2">
                                <Input type="number" placeholder="الكمية" value={newItem.qty} onChange={e => setNewItem({...newItem, qty: parseInt(e.target.value) || 1})} className="text-center" />
                            </TableCell>
                            <TableCell className="p-2">
                                <Input type="number" placeholder="السعر" value={newItem.price} onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})} className="text-center" />
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-center p-2">
                                <Button onClick={handleAddItem}>
                                    <PlusCircle className="ml-2 h-4 w-4" />
                                    إضافة
                                </Button>
                            </TableCell>
                        </TableRow>
                        </TableBody>
                    </Table>
                </div>
                </div>
                
                <div className="flex justify-end">
                    <div className="w-full max-w-sm space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>الإجمالي الفرعي</span>
                            <span>ج.م {subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>الخصم</span>
                            <Input type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} className="h-8 max-w-[120px] text-left" placeholder="0.00"/>
                        </div>
                         <div className="flex justify-between items-center">
                            <span>تطبيق ضريبة القيمة المضافة (14%)</span>
                            <Switch checked={applyTax} onCheckedChange={setApplyTax} />
                        </div>
                        <div className="flex justify-between">
                            <span>ضريبة القيمة المضافة (14%)</span>
                            <span>ج.م {tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-base">
                            <span>الإجمالي الكلي</span>
                            <span>ج.م {total.toFixed(2)}</span>
                        </div>
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
            <Button size="lg" disabled={loading || isSaving} onClick={handleSaveInvoice}>
                 {isSaving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
                {isSaving ? 'جارٍ الحفظ...' : 'تسجيل الفاتورة'}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </>
  );
}
