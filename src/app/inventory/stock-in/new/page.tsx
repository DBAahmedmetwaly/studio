

"use client";

import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2, PlusCircle, Trash2 } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import { useData } from "@/contexts/data-provider";
import { useToast } from "@/hooks/use-toast";
import { Combobox } from "@/components/ui/combobox";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/contexts/auth-context";
import { Input } from "@/components/ui/input";

interface StockItem {
  itemId: string; // The database ID of the item
  itemName: string;
  qty: number;
  cost: number;
  unit: string;
  uniqueId: string; // A unique ID for the list key
}

interface Item {
    id: string;
    name: string;
    unit: string;
    cost?: number;
}

interface Warehouse {
    id: string;
    name: string;
}

interface PurchaseInvoice {
    id: string;
    invoiceNumber: string;
    supplierName: string;
    warehouseId: string;
    items: { id: string; name: string; qty: number; cost: number; }[];
}

interface StockInRecord {
    id: string;
    purchaseInvoiceId?: string;
    reason?: string;
    warehouseId?: string;
}


export default function NewStockInPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuth();
    const [items, setItems] = useState<StockItem[]>([]);
    const [newItem, setNewItem] = useState({ itemId: "", qty: 1, cost: 0 });
    const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
    const [notes, setNotes] = useState<string>("");
    const [reason, setReason] = useState<string>("");
    const [selectedPurchaseInvoice, setSelectedPurchaseInvoice] = useState<string>("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    
    const { 
        items: availableItems, 
        warehouses, 
        purchaseInvoices, 
        stockInRecords,
        dbAction,
        getNextId,
        loading 
    } = useData();
    
    const itemsForCombobox = useMemo(() => {
        return availableItems.map((item: Item) => ({ value: item.id, label: item.name }));
    }, [availableItems]);

    const purchaseInvoiceOptions = useMemo(() => {
        const receivedInvoiceIds = new Set(stockInRecords.filter((r: StockInRecord) => r.purchaseInvoiceId).map((r: StockInRecord) => r.purchaseInvoiceId));
        return purchaseInvoices
            .filter((inv: PurchaseInvoice) => !receivedInvoiceIds.has(inv.id))
            .map((inv: PurchaseInvoice) => ({
                value: inv.id,
                label: `${inv.invoiceNumber} - ${inv.supplierName}`
            }));
    }, [purchaseInvoices, stockInRecords]);

    const hasOpeningStock = useMemo(() => {
        if (!selectedWarehouse) return false;
        return stockInRecords.some((record: StockInRecord) => record.warehouseId === selectedWarehouse && record.reason === 'opening_stock');
    }, [selectedWarehouse, stockInRecords]);
    
    useEffect(() => {
        if(reason === 'purchase' && selectedPurchaseInvoice) {
            const invoice = purchaseInvoices.find((inv: PurchaseInvoice) => inv.id === selectedPurchaseInvoice);
            if(invoice) {
                setSelectedWarehouse(invoice.warehouseId); // Automatically select warehouse from invoice
                const invoiceItems: StockItem[] = invoice.items.map(item => {
                    const availableItem = availableItems.find((i: Item) => i.id === item.id);
                    return {
                        itemId: item.id,
                        itemName: item.name,
                        qty: item.qty,
                        cost: item.cost || availableItem?.cost || 0,
                        unit: availableItem?.unit || 'قطعة',
                        uniqueId: `${item.id}-${Date.now()}`
                    }
                })
                setItems(invoiceItems);
            }
        } else {
            setItems([]);
             if (reason !== 'purchase') {
                setSelectedWarehouse(""); // Reset warehouse if reason is not purchase
             }
        }
    }, [reason, selectedPurchaseInvoice, purchaseInvoices, availableItems]);
    
    const handleAddItem = () => {
        if (!newItem.itemId || newItem.qty <= 0) {
            toast({ variant: "destructive", title: "خطأ", description: "يرجى اختيار صنف وكمية صالحة."});
            return;
        }
        const selectedItemData = availableItems.find((i: Item) => i.id === newItem.itemId);
        if (!selectedItemData) return;

        setItems([
        ...items,
        { 
            itemId: selectedItemData.id,
            itemName: selectedItemData.name,
            qty: newItem.qty,
            cost: newItem.cost,
            unit: selectedItemData.unit,
            uniqueId: `${selectedItemData.id}-${Date.now()}`
        },
        ]);
        setNewItem({ itemId: "", qty: 1, cost: 0 });
    };

    const handleRemoveItem = (uniqueId: string) => {
        setItems(items.filter((item) => item.uniqueId !== uniqueId));
    };

    const handleConfirm = async () => {
        if (!selectedWarehouse || items.length === 0) {
            toast({
                variant: "destructive",
                title: "بيانات غير مكتملة",
                description: "يرجى اختيار مخزن وإضافة صنف واحد على الأقل.",
            });
            return;
        }
        
        const nextId = await getNextId('stockIn');
        if(!nextId) {
            toast({
                variant: "destructive",
                title: "حدث خطأ",
                description: "فشل في إنشاء رقم الإيصال. يرجى المحاولة مرة أخرى.",
            });
            return;
        }

        const record: any = {
            warehouseId: selectedWarehouse,
            date: new Date(date).toISOString(),
            items: items.map(({itemId, itemName, qty, cost}) => ({itemId, name: itemName, qty, cost})),
            reason,
            notes,
            receiptNumber: `إذ-د-${nextId}`,
            createdById: user?.id,
            createdByName: user?.name,
        };

        if (reason === 'purchase' && selectedPurchaseInvoice) {
            record.purchaseInvoiceId = selectedPurchaseInvoice;
        }

        try {
            await dbAction('stockInRecords', 'add', record);
            toast({
                title: "تم بنجاح",
                description: `تم تأكيد استلام المخزون بنجاح برقم إيصال: ${record.receiptNumber}`,
            });
            router.push('/inventory/movements');
        } catch(error) {
             toast({
                variant: "destructive",
                title: "حدث خطأ",
                description: "فشل في حفظ إيصال الاستلام. يرجى المحاولة مرة أخرى.",
            });
            console.error("Failed to save stock in record: ", error);
        }
    };

    const isManualEntry = reason === 'opening_stock';

  return (
    <>
      <PageHeader title="إذن استلام مخزون جديد" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>إيصال استلام مخزني</CardTitle>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div>رقم الإيصال: (سيتم إنشاؤه عند الحفظ)</div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
                 <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <>
                    <div className="grid md:grid-cols-3 gap-6">
                         <div className="space-y-2">
                            <Label htmlFor="warehouse">إلى مخزن</Label>
                             <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse} disabled={reason === 'purchase'}>
                                <SelectTrigger id="warehouse">
                                    <SelectValue placeholder="اختر المخزن" />
                                </SelectTrigger>
                                <SelectContent>
                                   {warehouses.map((w: Warehouse) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="reason">سبب الاستلام</Label>
                            <Select value={reason} onValueChange={setReason} disabled={!selectedWarehouse}>
                                <SelectTrigger id="reason">
                                    <SelectValue placeholder="اختر سبب الاستلام" />
                                </SelectTrigger>
                                <SelectContent>
                                   <SelectItem value="purchase">مشتريات (من فاتورة)</SelectItem>
                                   <SelectItem value="opening_stock" disabled={hasOpeningStock} title={hasOpeningStock ? "تم إدخال رصيد افتتاحي لهذا المخزن من قبل" : ""}>رصيد افتتاحي</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="date">تاريخ الاستلام</Label>
                            <Input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                    </div>
                     {reason === 'purchase' && (
                        <div className="space-y-2">
                            <Label htmlFor="purchase-invoice">فاتورة الشراء</Label>
                            <Combobox
                                options={purchaseInvoiceOptions}
                                value={selectedPurchaseInvoice}
                                onValueChange={setSelectedPurchaseInvoice}
                                placeholder="اختر فاتورة الشراء..."
                                emptyMessage="لا توجد فواتير غير مستلمة."
                            />
                        </div>
                    )}
                    
                    <div>
                      <Label>الأصناف المستلمة</Label>
                      <div className="w-full overflow-auto border rounded-lg">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40%]">الصنف</TableHead>
                                <TableHead className="text-center">الوحدة</TableHead>
                                <TableHead className="text-center">الكمية</TableHead>
                                <TableHead className="text-center">التكلفة</TableHead>
                                <TableHead className="text-center w-[100px] no-print">الإجراء</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {items.map((item) => (
                                <TableRow key={item.uniqueId}>
                                <TableCell>{item.itemName}</TableCell>
                                <TableCell className="text-center">{item.unit}</TableCell>
                                <TableCell className="text-center">{item.qty}</TableCell>
                                <TableCell className="text-center">{item.cost}</TableCell>
                                <TableCell className="text-center no-print">
                                    {isManualEntry && (
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.uniqueId)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                    )}
                                </TableCell>
                                </TableRow>
                            ))}
                            {isManualEntry && (
                                <TableRow className="no-print bg-muted/30">
                                <TableCell className="p-2">
                                     <Combobox
                                        options={itemsForCombobox}
                                        value={newItem.itemId}
                                        onValueChange={(value) => setNewItem({ ...newItem, itemId: value })}
                                        placeholder="ابحث عن صنف..."
                                        emptyMessage="لم يتم العثور على الصنف."
                                    />
                                </TableCell>
                                <TableCell/>
                                <TableCell className="p-2">
                                    <Input type="number" placeholder="الكمية" value={newItem.qty} onChange={e => setNewItem({...newItem, qty: parseInt(e.target.value) || 1})} className="text-center" />
                                </TableCell>
                                <TableCell className="p-2">
                                    <Input type="number" placeholder="التكلفة" value={newItem.cost} onChange={e => setNewItem({...newItem, cost: parseFloat(e.target.value) || 0})} className="text-center" />
                                </TableCell>
                                <TableCell className="text-center">
                                    <Button onClick={handleAddItem} size="sm" disabled={!selectedWarehouse || !newItem.itemId}>
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
                        <Textarea id="notes" placeholder="أضف أي ملاحظات هنا..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>
                </>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button size="lg" disabled={loading} onClick={handleConfirm}>
                 <Save className="ml-2 h-4 w-4" />
                تأكيد الاستلام
            </Button>
          </CardFooter>
        </Card>
      </main>
    </>
  );
}
