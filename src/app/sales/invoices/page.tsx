
"use client";

import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Trash2, Printer, Save } from "lucide-react";
import React, { useState, useEffect } from "react";

interface InvoiceItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  total: number;
}

export default function SalesInvoicePage() {
    const [items, setItems] = useState<InvoiceItem[]>([
      { id: "item001", name: "منتج 1", qty: 2, price: 150, total: 300 },
      { id: "item002", name: "منتج 2", qty: 1, price: 250, total: 250 },
    ]);
    const [newItem, setNewItem] = useState({ id: "", name: "", qty: 1, price: 0 });
    const [subtotal, setSubtotal] = useState(0);
    const [tax, setTax] = useState(0);
    const [total, setTotal] = useState(0);

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

    const availableItems = [
      { id: "item001", name: "منتج 1" },
      { id: "item002", name: "منتج 2" },
      { id: "item003", name: "منتج 3" },
      { id: "item004", name: "منتج 4" },
    ]

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
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="customer">العميل</Label>
                    <Select>
                        <SelectTrigger id="customer">
                            <SelectValue placeholder="اختر عميلاً" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="cust001">أوليفيا مارتن</SelectItem>
                           <SelectItem value="cust002">جون سنو</SelectItem>
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
                           <SelectItem value="br001">الفرع الرئيسي - القاهرة</SelectItem>
                           <SelectItem value="br002">فرع الإسكندرية</SelectItem>
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
                        <Select value={newItem.id} onValueChange={(value) => setNewItem({ ...newItem, id: value })}>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر صنفًا" />
                            </SelectTrigger>
                            <SelectContent>
                               {availableItems.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                     </TableCell>
                     <TableCell>
                        <Input type="number" placeholder="الكمية" value={newItem.qty} onChange={e => setNewItem({...newItem, qty: parseInt(e.target.value)})} />
                     </TableCell>
                     <TableCell>
                        <Input type="number" placeholder="السعر" value={newItem.price} onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value)})} />
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

          </CardContent>
          <CardFooter className="flex justify-end no-print">
            <Button size="lg">إصدار الفاتورة</Button>
          </CardFooter>
        </Card>
      </main>
    </>
  );
}
