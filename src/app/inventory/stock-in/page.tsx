
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
import React, { useState } from "react";
import useFirebase from "@/hooks/use-firebase";

interface StockItem {
  id: string;
  name: string;
  qty: number;
}

interface Item {
    id: string;
    name: string;
}

interface Warehouse {
    id: string;
    name: string;
}

export default function StockInPage() {
    const [items, setItems] = useState<StockItem[]>([]);
    const [newItem, setNewItem] = useState({ id: "", name: "", qty: 1 });
    
    const { data: availableItems, loading: loadingItems } = useFirebase<Item>('items');
    const { data: warehouses, loading: loadingWarehouses } = useFirebase<Warehouse>('warehouses');

    const handleAddItem = () => {
        if (!newItem.id || newItem.qty <= 0) return;
        const selectedItem = availableItems.find(i => i.id === newItem.id);
        if (!selectedItem) return;

        setItems([
        ...items,
        { 
            ...newItem,
            name: selectedItem.name,
        },
        ]);
        setNewItem({ id: "", name: "", qty: 1 });
    };

    const handleRemoveItem = (id: string) => {
        setItems(items.filter((item) => item.id !== id));
    };

    const handlePrint = () => {
        window.print();
    };

    const loading = loadingItems || loadingWarehouses;

  return (
    <>
      <PageHeader title="إدخال مخزون">
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
            <CardTitle>إيصال إدخال مخزني</CardTitle>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div>رقم الإيصال: IN-00456</div>
                <div>تاريخ الإدخال: {new Date().toLocaleDateString('ar-EG')}</div>
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
                            <Label htmlFor="warehouse">إلى مستودع</Label>
                            <Select>
                                <SelectTrigger id="warehouse">
                                    <SelectValue placeholder="اختر المستودع" />
                                </SelectTrigger>
                                <SelectContent>
                                   {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reason">سبب الإدخال</Label>
                            <Select>
                                <SelectTrigger id="reason">
                                    <SelectValue placeholder="اختر سبب الإدخال" />
                                </SelectTrigger>
                                <SelectContent>
                                   <SelectItem value="purchase">مشتريات</SelectItem>
                                   <SelectItem value="opening_stock">رصيد افتتاحي</SelectItem>
                                   <SelectItem value="transfer_in">محول من جهة أخرى</SelectItem>
                                   <SelectItem value="other">أخرى</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div>
                      <Label>الأصناف المدخلة</Label>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[60%]">الصنف</TableHead>
                            <TableHead>الكمية</TableHead>
                            <TableHead className="text-left no-print">الإجراء</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.name}</TableCell>
                              <TableCell>{item.qty}</TableCell>
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
                                       {availableItems.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                             </TableCell>
                             <TableCell>
                                <Input type="number" placeholder="الكمية" value={newItem.qty} onChange={e => setNewItem({...newItem, qty: parseInt(e.target.value) || 1})} />
                             </TableCell>
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
                    <div className="space-y-2">
                        <Label htmlFor="notes">ملاحظات</Label>
                        <Textarea id="notes" placeholder="أضف أي ملاحظات هنا..." />
                    </div>
                </>
            )}
          </CardContent>
          <CardFooter className="flex justify-end no-print">
            <Button size="lg" disabled={loading}>تأكيد الإدخال</Button>
          </CardFooter>
        </Card>
      </main>
    </>
  );
}
