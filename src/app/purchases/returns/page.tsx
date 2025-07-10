
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
import { useRouter, useSearchParams } from 'next/navigation';

interface ReturnItem {
  id: string; // original item id
  name: string;
  qty: number;
  price: number;
  total: number;
  unit: string;
  uniqueId: string; // for list key
}

interface Item { id: string; name: string; unit: string; }
interface Supplier { id: string; name: string; }
interface Warehouse { id: string; name: string; }
interface PurchaseInvoice { id: string; supplierId: string; warehouseId: string; items: { id: string; name: string; qty: number; price: number; }[] }

export default function PurchaseReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [newItem, setNewItem] = useState({ id: "", name: "", qty: 1, price: 0, unit: "" });
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [notes, setNotes] = useState("");
  const [returnDate, setReturnDate] = useState('');
  
  const { data: availableItems, loading: loadingItems } = useFirebase<Item>('items');
  const { data: suppliers, loading: loadingSuppliers } = useFirebase<Supplier>('suppliers');
  const { data: warehouses, loading: loadingWarehouses } = useFirebase<Warehouse>('warehouses');
  const { add: addPurchaseReturn } = useFirebase('purchaseReturns');
  const { data: invoices } = useFirebase<PurchaseInvoice>('purchaseInvoices');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setReturnDate(today);

    const invoiceId = searchParams.get('invoiceId');
    if (invoiceId && invoices.length > 0) {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (invoice) {
        setSupplierId(invoice.supplierId);
        setWarehouseId(invoice.warehouseId);
        const invoiceItems = invoice.items.map(item => ({
          id: item.id,
          name: item.name,
          qty: item.qty,
          price: item.price,
          total: item.qty * item.price,
          unit: availableItems.find(i => i.id === item.id)?.unit || 'قطعة',
          uniqueId: `${item.id}-${Date.now()}`
        }));
        setItems(invoiceItems);
      }
    }
  }, [searchParams, invoices, availableItems]);
  
  useEffect(() => {
    const newSubtotal = items.reduce((acc, item) => acc + item.total, 0);
    setSubtotal(newSubtotal);
    setTotal(newSubtotal);
  }, [items]);

  const handleAddItem = () => {
    if (!newItem.id || newItem.qty <= 0 || newItem.price <= 0) return;
    const selectedItem = availableItems.find(i => i.id === newItem.id);
    if (!selectedItem) return;

    setItems([
      ...items,
      { 
        id: selectedItem.id,
        name: selectedItem.name,
        qty: newItem.qty,
        price: newItem.price,
        total: newItem.qty * newItem.price,
        unit: selectedItem.unit,
        uniqueId: `${selectedItem.id}-${Date.now()}`
      },
    ]);
    setNewItem({ id: "", name: "", qty: 1, price: 0, unit: "" });
  };
  
  const handleRemoveItem = (uniqueId: string) => {
    setItems(items.filter((item) => item.uniqueId !== uniqueId));
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

  const handleSaveReturn = async () => {
    if (!supplierId || !warehouseId || items.length === 0) {
        toast({ variant: 'destructive', title: 'بيانات غير مكتملة', description: 'يرجى اختيار المورد والمخزن وإضافة صنف واحد على الأقل.' });
        return;
    }
    setIsSaving(true);
    try {
        const returnData = {
            date: new Date(returnDate).toISOString(),
            supplierId,
            warehouseId,
            items: items.map(item => ({
                id: item.id,
                name: item.name,
                qty: item.qty,
                price: item.price,
                total: item.total,
            })),
            total,
            notes,
        };
        await addPurchaseReturn(returnData);
        toast({ title: 'تم الحفظ بنجاح', description: `تم حفظ مرتجع الشراء.` });
        router.push('/purchases/invoices/list');
    } catch (error) {
        console.error("Failed to save purchase return:", error);
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حفظ مرتجع الشراء.' });
    } finally {
        setIsSaving(false);
    }
  }

  const loading = loadingItems || loadingSuppliers || loadingWarehouses;

  return (
    <>
      <PageHeader title="مرتجع شراء" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>إذن مرتجع شراء</CardTitle>
            <CardDescription>
              تسجيل الأصناف المرتجعة للمورد وتأثيرها على المخزون والحسابات.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
                 <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
            <>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="supplier">المورد</Label>
                        <Select value={supplierId} onValueChange={setSupplierId}>
                            <SelectTrigger id="supplier"><SelectValue placeholder="اختر موردًا" /></SelectTrigger>
                            <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="warehouse">من مخزن</Label>
                        <Select value={warehouseId} onValueChange={setWarehouseId}>
                            <SelectTrigger id="warehouse"><SelectValue placeholder="اختر مخزنًا" /></SelectTrigger>
                            <SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="return-date">تاريخ المرتجع</Label>
                        <Input id="return-date" type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} />
                    </div>
                </div>

                <div>
                <Label>الأصناف المرتجعة</Label>
                <div className="w-full overflow-auto border rounded-lg">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40%]">الصنف</TableHead>
                            <TableHead className="text-center">الوحدة</TableHead>
                            <TableHead className="text-center">الكمية</TableHead>
                            <TableHead className="text-center">سعر الوحدة</TableHead>
                            <TableHead className="text-center">الإجمالي</TableHead>
                            <TableHead className="text-center w-[100px]">الإجراء</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.uniqueId}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-center">{item.unit}</TableCell>
                            <TableCell><Input type="number" value={item.qty} onChange={e => setItems(items.map(i => i.uniqueId === item.uniqueId ? {...i, qty: Number(e.target.value), total: Number(e.target.value) * i.price} : i))} className="text-center" /></TableCell>
                            <TableCell className="text-center">ج.م {item.price.toFixed(2)}</TableCell>
                            <TableCell className="text-center">ج.م {item.total.toFixed(2)}</TableCell>
                            <TableCell className="text-center">
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.uniqueId)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </TableCell>
                            </TableRow>
                        ))}
                        <TableRow className="bg-muted/20">
                            <TableCell className="p-2">
                                <Select value={newItem.id} onValueChange={handleItemSelect}>
                                    <SelectTrigger><SelectValue placeholder="اختر صنفًا" /></SelectTrigger>
                                    <SelectContent>{availableItems.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground p-2">{newItem.unit}</TableCell>
                            <TableCell className="p-2"><Input type="number" placeholder="الكمية" value={newItem.qty} onChange={e => setNewItem({...newItem, qty: parseInt(e.target.value) || 1})} className="text-center" /></TableCell>
                            <TableCell className="p-2"><Input type="number" placeholder="السعر" value={newItem.price} onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})} className="text-center" /></TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-center p-2">
                                <Button onClick={handleAddItem}><PlusCircle className="ml-2 h-4 w-4" />إضافة</Button>
                            </TableCell>
                        </TableRow>
                        </TableBody>
                    </Table>
                </div>
                </div>
                
                <div className="flex justify-end">
                    <div className="w-full max-w-sm space-y-2 text-sm">
                        <div className="flex justify-between font-bold text-base">
                            <span>الإجمالي الكلي</span>
                            <span>ج.م {total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="notes">ملاحظات</Label>
                    <Textarea id="notes" placeholder="أضف سبب الإرجاع أو أي ملاحظات..." value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
            </>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button size="lg" disabled={loading || isSaving} onClick={handleSaveReturn}>
                 {isSaving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
                {isSaving ? 'جارٍ الحفظ...' : 'حفظ المرتجع'}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </>
  );
}
