
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
import React, { useState, useEffect } from "react";
import useFirebase from "@/hooks/use-firebase";

interface InvoiceItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  total: number;
}

interface Item {
    id: string;
    name: string;
    price?: number;
}

interface Customer {
    id: string;
    name: string;
}

interface Branch {
    id: string;
    name: string;
}

export default function SalesInvoicePage() {
    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [newItem, setNewItem] = useState({ id: "", name: "", qty: 1, price: 0 });
    const [subtotal, setSubtotal] = useState(0);
    const [tax, setTax] = useState(0);
    const [total, setTotal] = useState(0);

    const { data: availableItems, loading: loadingItems } = useFirebase<Item>('items');
    const { data: customers, loading: loadingCustomers } = useFirebase<Customer>('customers');
    const { data: branches, loading: loadingBranches } = useFirebase<Branch>('branches');

    useEffect(() => {
        const newSubtotal = items.reduce((acc, item) => acc + item.total, 0);
        const newTax = newSubtotal * 0.14;
        setSubtotal(newSubtotal);
        setTax(newTax);
        setTotal(newSubtotal + newTax);
    }, [items]);

    const handleAddItem = () => {
        if (!newItem.id || newItem.qty <= 0 || newItem.price <= 0) return;
        const selectedItem = availableItems.find(i => i.id === newItem.id);
        if (!selectedItem) return;

        setItems([
        ...items,
        { 
            ...newItem,
            name: selectedItem.name,
            total: newItem.qty * newItem.price 
        },
        ]);
        setNewItem({ id: "", name: "", qty: 1, price: 0 });
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
                price: selectedItem.price || 0,
            });
        }
    }
    
    const loading = loadingItems || loadingCustomers || loadingBranches;

  return (
    <>
      <PageHeader title="فاتورة بيع">
        <div className="flex gap-2 no-print">
            <Button variant="outline">
                <Save className="ml-2 h-4 w-4" />
                حفظ كمسودة
            </Button>
            <Button onClick={handlePrint}>
                <Printer className="ml-2 h-4 w-4" />
                طباعة
            </Button>
        </div>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 printable-area">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle>فاتورة بيع</CardTitle>
                    <CardDescription>
                        شركة المحاسب الذكي
                    </CardDescription>
                </div>
                <div className="text-left">
                    <div className="font-bold text-lg">فاتورة #INV-00123</div>
                    <div>تاريخ الفاتورة: {new Date().toLocaleDateString('ar-EG')}</div>
                    <div>تاريخ الاستحقاق: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ar-EG')}</div>
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
                            <Label htmlFor="customer">العميل</Label>
                            <Select>
                                <SelectTrigger id="customer">
                                    <SelectValue placeholder="اختر عميلاً" />
                                </SelectTrigger>
                                <SelectContent>
                                   {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="branch">من فرع</Label>
                            <Select>
                                <SelectTrigger id="branch">
                                    <SelectValue placeholder="اختر فرعًا" />
                                </SelectTrigger>
                                <SelectContent>
                                  {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div>
                    <Label>بنود الفاتورة</Label>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40%]">الصنف</TableHead>
                            <TableHead>الكمية</TableHead>
                            <TableHead>سعر الوحدة</TableHead>
                            <TableHead className="text-left">الإجمالي</TableHead>
                            <TableHead className="text-left no-print">الإجراء</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.id}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.qty}</TableCell>
                            <TableCell>ج.م {item.price.toFixed(2)}</TableCell>
                            <TableCell className="text-left">ج.م {item.total.toFixed(2)}</TableCell>
                            <TableCell className="text-left no-print">
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </TableCell>
                            </TableRow>
                        ))}
                        <TableRow className="no-print">
                            <TableCell>
                                <Select value={newItem.id} onValueChange={handleItemSelect}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر صنفًا" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {availableItems.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>
                                <Input type="number" placeholder="الكمية" value={newItem.qty} onChange={e => setNewItem({...newItem, qty: parseInt(e.target.value) || 1})} />
                            </TableCell>
                            <TableCell>
                                <Input type="number" placeholder="السعر" value={newItem.price} onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})} />
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell>
                                <Button onClick={handleAddItem}>
                                    <PlusCircle className="ml-2 h-4 w-4" />
                                    إضافة
                                </Button>
                            </TableCell>
                        </TableRow>
                        </TableBody>
                    </Table>
                    </div>
                    
                    <div className="flex justify-end">
                        <div className="w-full max-w-sm space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>الإجمالي الفرعي</span>
                                <span>ج.م {subtotal.toFixed(2)}</span>
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
                        <Textarea id="notes" placeholder="أضف أي ملاحظات هنا..." />
                    </div>
                </>
            )}
          </CardContent>
          <CardFooter className="flex justify-end no-print">
            <Button size="lg" disabled={loading}>إصدار الفاتورة</Button>
          </CardFooter>
        </Card>
      </main>
    </>
  );
}
