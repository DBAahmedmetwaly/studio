
"use client";

import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2 } from "lucide-react";
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

interface PurchaseInvoice {
    id: string;
    invoiceNumber: string;
    supplierName: string;
    warehouseId: string;
    items: { id: string; name: string; qty: number; }[];
}

interface StockInRecord {
    id: string;
    purchaseInvoiceId?: string;
    reason?: string;
}


export default function NewStockInPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuth();
    const [items, setItems] = useState<StockItem[]>([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
    const [notes, setNotes] = useState<string>("");
    const [reason, setReason] = useState<string>("");
    const [selectedPurchaseInvoice, setSelectedPurchaseInvoice] = useState<string>("");
    
    const { data: availableItems, loading: loadingItems } = useFirebase<Item>('items');
    const { data: warehouses, loading: loadingWarehouses } = useFirebase<Warehouse>('warehouses');
    const { data: purchaseInvoices, loading: loadingInvoices } = useFirebase<PurchaseInvoice>('purchaseInvoices');
    const { data: stockInRecords, loading: loadingStockInRecords } = useFirebase<StockInRecord>('stockInRecords');
    const { add: addStockInRecord, getNextId } = useFirebase("stockInRecords");

    const purchaseInvoiceOptions = useMemo(() => {
        const receivedInvoiceIds = new Set(stockInRecords.filter(r => r.purchaseInvoiceId).map(r => r.purchaseInvoiceId));
        return purchaseInvoices
            .filter(inv => !receivedInvoiceIds.has(inv.id))
            .map(inv => ({
                value: inv.id,
                label: `${inv.invoiceNumber} - ${inv.supplierName}`
            }));
    }, [purchaseInvoices, stockInRecords]);
    
    useEffect(() => {
        if(reason === 'purchase' && selectedPurchaseInvoice) {
            const invoice = purchaseInvoices.find(inv => inv.id === selectedPurchaseInvoice);
            if(invoice) {
                setSelectedWarehouse(invoice.warehouseId); // Automatically select warehouse from invoice
                const invoiceItems: StockItem[] = invoice.items.map(item => {
                    const availableItem = availableItems.find(i => i.id === item.id);
                    return {
                        id: item.id,
                        name: item.name,
                        qty: item.qty,
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
            date: new Date().toISOString(),
            items: items.map(({id, name, qty}) => ({id, name, qty})),
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
            await addStockInRecord(record);
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

    const loading = loadingItems || loadingWarehouses || loadingInvoices || loadingStockInRecords;
    const getUnitLabel = (unit: string) => {
        const units = { piece: "قطعة", weight: "وزن", meter: "متر", kilo: "كيلو", gram: "جرام" };
        return units[unit as keyof typeof units] || unit;
    }


  return (
    <>
      <PageHeader title="إذن استلام مخزون جديد" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>إيصال استلام مخزني</CardTitle>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div>رقم الإيصال: (سيتم إنشاؤه عند الحفظ)</div>
                <div>تاريخ الاستلام: {new Date().toLocaleDateString('ar-EG')}</div>
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
                            <Label htmlFor="reason">سبب الاستلام</Label>
                            <Select value={reason} onValueChange={setReason}>
                                <SelectTrigger id="reason">
                                    <SelectValue placeholder="اختر سبب الاستلام" />
                                </SelectTrigger>
                                <SelectContent>
                                   <SelectItem value="purchase">مشتريات (من فاتورة)</SelectItem>
                                   <SelectItem value="opening_stock">رصيد افتتاحي</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="warehouse">إلى مخزن</Label>
                            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse} disabled={reason === 'purchase'}>
                                <SelectTrigger id="warehouse">
                                    <SelectValue placeholder="اختر المخزن" />
                                </SelectTrigger>
                                <SelectContent>
                                   {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
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
                                <TableHead className="w-[50%]">الصنف</TableHead>
                                <TableHead className="text-center">الوحدة</TableHead>
                                <TableHead className="text-center">الكمية</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {items.map((item) => (
                                <TableRow key={item.uniqueId}>
                                <TableCell>{item.name}</TableCell>
                                <TableCell className="text-center">{getUnitLabel(item.unit)}</TableCell>
                                <TableCell className="text-center">{item.qty}</TableCell>
                                </TableRow>
                            ))}
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
