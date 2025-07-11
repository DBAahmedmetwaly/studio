
"use client";

import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Trash2, Loader2, Save } from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import useFirebase from "@/hooks/use-firebase";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { Combobox } from "@/components/ui/combobox";

interface IssueItem {
  id: string; 
  name: string;
  qty: number;
  price: number;
  cost: number;
  total: number;
  unit: string;
  uniqueId: string;
}

interface Item {
    id: string;
    name: string;
    unit: string;
    price?: number;
    cost?: number;
}

interface User {
    id: string;
    name: string;
    warehouse: string;
    isSalesRep?: boolean;
}

interface Warehouse {
    id: string;
    name: string;
}

export default function IssueToRepPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [items, setItems] = useState<IssueItem[]>([]);
    const [newItem, setNewItem] = useState({ id: "", qty: 1, price: 0, cost: 0, unit: "" });
    const [selectedRepId, setSelectedRepId] = useState<string>("");
    const [notes, setNotes] = useState<string>("");
    const [totalValue, setTotalValue] = useState(0);
    const [totalQty, setTotalQty] = useState(0);
    
    const { data: availableItems, loading: loadingItems } = useFirebase<Item>('items');
    const { data: users, loading: loadingUsers } = useFirebase<User>("users");
    const { data: warehouses, loading: loadingWarehouses } = useFirebase<Warehouse>("warehouses");
    const { add: addIssue, getNextId } = useFirebase("stockIssuesToReps");

    const reps = users.filter(u => u.isSalesRep);
    const loading = loadingItems || loadingUsers || loadingWarehouses;

    const itemsForCombobox = useMemo(() => {
        return availableItems.map(item => ({ value: item.id, label: item.name }));
    }, [availableItems]);

    useEffect(() => {
        const newTotalValue = items.reduce((acc, item) => acc + item.total, 0);
        const newTotalQty = items.reduce((acc, item) => acc + item.qty, 0);
        setTotalValue(newTotalValue);
        setTotalQty(newTotalQty);
    }, [items]);

    const handleAddItem = () => {
        if (!newItem.id || newItem.qty <= 0) {
            toast({ variant: "destructive", title: "خطأ", description: "يرجى اختيار صنف وكمية صالحة."});
            return;
        }
        const selectedItem = availableItems.find(i => i.id === newItem.id);
        if (!selectedItem) return;

        setItems(prev => [...prev, { 
            id: selectedItem.id,
            name: selectedItem.name,
            qty: newItem.qty,
            price: selectedItem.price || 0,
            cost: selectedItem.cost || 0,
            total: newItem.qty * (selectedItem.price || 0),
            unit: selectedItem.unit,
            uniqueId: `${selectedItem.id}-${Date.now()}`
        }]);
        setNewItem({ id: "", qty: 1, price: 0, cost: 0, unit: "" });
    };

    const handleItemSelect = (itemId: string) => {
        const selectedItem = availableItems.find(i => i.id === itemId);
        if (selectedItem) {
            setNewItem({
                id: itemId,
                qty: 1,
                price: selectedItem.price || 0,
                cost: selectedItem.cost || 0,
                unit: selectedItem.unit,
            });
        }
    }

    const handleRemoveItem = (uniqueId: string) => {
        setItems(items.filter((item) => item.uniqueId !== uniqueId));
    };

    const handleConfirm = async () => {
        if (!selectedRepId || items.length === 0) {
            toast({ variant: "destructive", title: "بيانات غير مكتملة", description: "يرجى اختيار المندوب وإضافة صنف واحد على الأقل." });
            return;
        }
        
        const rep = reps.find(r => r.id === selectedRepId);
        if (!rep) return;
        
        const warehouse = warehouses.find(w => w.id === rep.warehouse);
        if (!warehouse) {
             toast({ variant: "destructive", title: "خطأ", description: "المخزن المرتبط بالمندوب غير موجود." });
            return;
        }

        const nextId = await getNextId('issueToRep');
        const record = {
            salesRepId: selectedRepId,
            warehouseId: rep.warehouse,
            date: new Date().toISOString(),
            items: items.map(({id, name, qty, price, cost, total}) => ({id, name, qty, price, cost, total})),
            notes,
            receiptNumber: `ص-م-${nextId}`
        };

        try {
            await addIssue(record);
            toast({ title: "تم بنجاح", description: `تم حفظ إذن الصرف للمندوب برقم: ${record.receiptNumber}` });
            router.push('/sales/issue-to-rep/list');
        } catch(error) {
             toast({ variant: "destructive", title: "حدث خطأ", description: "فشل في حفظ إذن الصرف." });
        }
    };

  return (
    <>
      <PageHeader title="صرف بضاعة لمندوب">
         <Button variant="outline" onClick={() => router.push('/sales/issue-to-rep/list')}>
            العودة إلى السجل
        </Button>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>إذن صرف بضاعة</CardTitle>
            <CardDescription>
                استخدم هذه الشاشة لتسجيل البضاعة المصروفة من المخزن الرئيسي إلى عهدة المندوب.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
                 <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
                <>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="rep">مندوب المبيعات</Label>
                            <Select value={selectedRepId} onValueChange={setSelectedRepId}>
                                <SelectTrigger id="rep"><SelectValue placeholder="اختر المندوب" /></SelectTrigger>
                                <SelectContent>
                                   {reps.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label>من مخزن</Label>
                            <Input value={warehouses.find(w => w.id === reps.find(r => r.id === selectedRepId)?.warehouse)?.name || 'اختر مندوبًا أولاً'} readOnly disabled />
                         </div>
                    </div>
                    
                    <div>
                      <Label>الأصناف المصروفة</Label>
                      <div className="w-full overflow-auto border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40%]">الصنف</TableHead>
                                    <TableHead className="text-center">الوحدة</TableHead>
                                    <TableHead className="text-center">الكمية</TableHead>
                                    <TableHead className="text-center">السعر</TableHead>
                                    <TableHead className="text-center">الإجمالي</TableHead>
                                    <TableHead className="text-center w-[100px]">الإجراء</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {items.map((item) => (
                                <TableRow key={item.uniqueId}>
                                <TableCell>{item.name}</TableCell>
                                <TableCell className="text-center">{item.unit}</TableCell>
                                <TableCell className="text-center">{item.qty}</TableCell>
                                <TableCell className="text-center">{item.price.toLocaleString()}</TableCell>
                                <TableCell className="text-center font-semibold">{item.total.toLocaleString()}</TableCell>
                                <TableCell className="text-center">
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.uniqueId)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                                </TableRow>
                            ))}
                            <TableRow className="bg-muted/30">
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
                                    <Input type="number" placeholder="الكمية" value={newItem.qty} onChange={e => setNewItem({...newItem, qty: parseInt(e.target.value) || 1})} />
                                </TableCell>
                                <TableCell className="p-2">
                                     <Input type="number" placeholder="السعر" value={newItem.price} onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})} />
                                </TableCell>
                                <TableCell/>
                                <TableCell className="text-center">
                                    <Button onClick={handleAddItem} size="sm">
                                        <PlusCircle className="ml-2 h-4 w-4" />
                                        إضافة
                                    </Button>
                                </TableCell>
                            </TableRow>
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={2} className="font-bold">الإجمالي</TableCell>
                                    <TableCell className="text-center font-bold">{totalQty}</TableCell>
                                    <TableCell/>
                                    <TableCell className="text-center font-bold">{totalValue.toLocaleString()}</TableCell>
                                    <TableCell/>
                                </TableRow>
                            </TableFooter>
                        </Table>
                      </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">ملاحظات</Label>
                        <Textarea id="notes" placeholder="أضف أي ملاحظات هنا..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>
                </>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button size="lg" disabled={loading} onClick={handleConfirm}>
                <Save className="ml-2 h-4 w-4" />
                تأكيد الصرف
            </Button>
          </CardFooter>
        </Card>
      </main>
    </>
  );
}
