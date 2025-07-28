

"use client";

import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Trash2, Printer, Save, Loader2, Info } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import { useData } from "@/contexts/data-provider";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { Switch } from "@/components/ui/switch";
import { usePermissions } from "@/contexts/permissions-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth-context";


interface InvoiceItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  cost: number;
  total: number;
  unit: string;
}

interface Item {
    id: string;
    name: string;
    unit: string;
    price?: number;
    cost?: number;
    openingStock?: number;
}

interface Customer {
    id: string;
    name: string;
}

interface Warehouse {
    id: string;
    name: string;
}

interface CashAccount {
    id: string;
    name: string;
    salesRepId?: string;
}

interface IssueToRep {
    id: string;
    salesRepId: string;
    items: { id: string; qty: number; price: number; }[];
}
interface ReturnFromRep {
    id: string;
    salesRepId: string;
    items: { id: string; qty: number; price: number; }[];
}

interface SaleInvoice { 
    id: string; 
    warehouseId: string; 
    salesRepId?: string;
    items: { id: string; qty: number; }[];
    status?: 'pending' | 'approved';
}
interface PurchaseInvoice { id: string; warehouseId: string; items: { id: string; qty: number; }[]; }
interface StockInRecord { id: string; warehouseId: string; items: { id: string; name: string; qty: number; }[]; }
interface StockOutRecord { id: string; sourceId: string; items: { id: string; name: string; qty: number; }[]; }
interface StockTransferRecord { id: string; fromSourceId: string; toSourceId: string; items: { id: string; qty: number; }[]; }
interface StockAdjustmentRecord { id: string; warehouseId: string; items: { itemId: string; difference: number; }[]; }
interface SalesReturn { id: string; warehouseId: string; items: { id: string; name: string; qty: number; }[]; }
interface PurchaseReturn { id: string; warehouseId: string; items: { id: string; name: string; qty: number; }[]; }

export default function SalesInvoicePage() {
    const { toast } = useToast();
    const router = useRouter();
    const { can } = usePermissions();
    const { user } = useAuth();

    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [newItem, setNewItem] = useState({ id: "", name: "", qty: 1, price: 0, cost: 0, unit: "" });
    const [subtotal, setSubtotal] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [tax, setTax] = useState(0);
    const [total, setTotal] = useState(0);
    const [paidAmount, setPaidAmount] = useState(0);
    const [applyTax, setApplyTax] = useState(true);
    const [customerId, setCustomerId] = useState("");
    const [warehouseId, setWarehouseId] = useState("");
    const [paidToAccountId, setPaidToAccountId] = useState("");
    const [notes, setNotes] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    
    const [invoiceDate, setInvoiceDate] = useState<string>('');
    const [dueDate, setDueDate] = useState<string>('');

    const { 
        items: allItems, 
        customers, 
        warehouses, 
        cashAccounts, 
        salesInvoices: sales, 
        purchaseInvoices: purchases, 
        stockInRecords: stockIns, 
        stockOutRecords: stockOuts, 
        stockTransferRecords: transfers, 
        stockAdjustmentRecords: adjustments, 
        salesReturns, 
        purchaseReturns, 
        settings, 
        stockIssuesToReps: issuesToReps, 
        stockReturnsFromReps: returnsFromReps,
        dbAction,
        getNextId,
        loading 
    } = useData();

    
    const isRep = !!user?.isSalesRep;

    useEffect(() => {
        if (isRep && user?.warehouse) {
            setWarehouseId(user.warehouse);
            const repCashAccount = cashAccounts.find((acc: CashAccount) => acc.salesRepId === user.id);
            if(repCashAccount) {
                setPaidToAccountId(repCashAccount.id);
            }
        }
    }, [isRep, user, cashAccounts]);

    const itemsInRepCustody = useMemo(() => {
        if (!isRep || !user?.id || !allItems.length) return [];
        
        const repStock = new Map<string, number>();

        // Calculate issued stock
        issuesToReps
            .filter((issue:any) => issue.salesRepId === user.id)
            .forEach((issue:any) => {
                issue.items.forEach((item:any) => {
                    repStock.set(item.id, (repStock.get(item.id) || 0) + item.qty);
                });
            });

        // Calculate sold stock from invoices
        sales
            .filter((sale:any) => sale.salesRepId === user.id)
            .forEach((sale:any) => {
                sale.items.forEach((item:any) => {
                    repStock.set(item.id, (repStock.get(item.id) || 0) - item.qty);
                });
            });

        // Calculate returned stock from rep
        returnsFromReps
            .filter((ret:any) => ret.salesRepId === user.id)
            .forEach((ret:any) => {
                ret.items.forEach((item:any) => {
                    repStock.set(item.id, (repStock.get(item.id) || 0) - item.qty);
                });
            });
            
        return allItems
            .map((item:any) => ({...item, stock: repStock.get(item.id) || 0}))
            .filter((item:any) => item.stock > 0);
    }, [isRep, user?.id, allItems, issuesToReps, sales, returnsFromReps]);


    const availableItemsForWarehouse = useMemo(() => {
        if (isRep) return itemsInRepCustody;

        if (!warehouseId || warehouseId === "all" || !allItems.length) {
            return [];
        }
        
        const mainSettings = settings.find((s:any) => s.id === 'main');

        return allItems.map((item:any) => {
            let stock = item.openingStock || 0;
            
            purchases.filter((p:any) => p.warehouseId === warehouseId).forEach((p:any) => p.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock += i.qty));
            stockIns.filter((si:any) => si.warehouseId === warehouseId).forEach((si:any) => si.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock += i.qty));
            transfers.filter((t:any) => t.toSourceId === warehouseId).forEach((t:any) => t.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock += i.qty));
            adjustments.filter((adj:any) => adj.warehouseId === warehouseId).forEach((adj:any) => adj.items.filter((i:any) => i.itemId === item.id && i.difference > 0).forEach((i:any) => stock += i.difference));
            salesReturns.filter((sr:any) => sr.warehouseId === warehouseId).forEach((sr:any) => sr.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock += i.qty));

            sales.filter((s:any) => s.warehouseId === warehouseId).forEach((s:any) => s.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock -= i.qty));
            stockOuts.filter((so:any) => so.sourceId === warehouseId).forEach((so:any) => so.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock -= i.qty));
            transfers.filter((t:any) => t.fromSourceId === warehouseId).forEach((t:any) => t.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock -= i.qty));
            adjustments.filter((adj:any) => adj.warehouseId === warehouseId).forEach((adj:any) => adj.items.filter((i:any) => i.itemId === item.id && i.difference < 0).forEach((i:any) => stock += i.difference));
            purchaseReturns.filter((pr:any) => pr.warehouseId === warehouseId).forEach((pr:any) => pr.items.filter((i:any) => i.id === item.id).forEach((i:any) => stock -= i.qty));

            return { ...item, stock };
        }).filter((item:any) => item.stock > 0 || (mainSettings?.financial?.allowNegativeStock));

    }, [isRep, warehouseId, allItems, purchases, sales, stockIns, stockOuts, transfers, adjustments, salesReturns, purchaseReturns, settings, itemsInRepCustody]);


    useEffect(() => {
        const newSubtotal = items.reduce((acc, item) => acc + item.total, 0);
        const newTax = applyTax ? (newSubtotal - discount) * 0.14 : 0;
        const newTotal = newSubtotal - discount + newTax;
        setSubtotal(newSubtotal);
        setTax(newTax);
        setTotal(newTotal);
        setPaidAmount(newTotal);
    }, [items, discount, applyTax]);

    useEffect(() => {
        setInvoiceDate(new Date().toLocaleDateString('ar-EG'));
        setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ar-EG'));
    }, []);

    const handleAddItem = () => {
        if (!newItem.id || newItem.qty <= 0 || newItem.price < 0) return;
        const selectedItem = availableItemsForWarehouse.find((i:any) => i.id === newItem.id);
        if (!selectedItem) return;
        
        const mainSettings = settings.find((s:any) => s.id === 'main');
        if(newItem.qty > selectedItem.stock && (!mainSettings?.financial?.allowNegativeStock || isRep)) {
            toast({
                variant: 'destructive',
                title: 'كمية غير متوفرة',
                description: `الكمية المتاحة من ${selectedItem.name} هي ${selectedItem.stock} فقط.`
            });
            return;
        }

        setItems([
        ...items,
        { 
            ...newItem,
            name: selectedItem.name,
            unit: selectedItem.unit,
            cost: selectedItem.cost || 0,
            total: newItem.qty * newItem.price,
            id: `${selectedItem.id}-${Date.now()}`
        },
        ]);
        setNewItem({ id: "", name: "", qty: 1, price: 0, cost: 0, unit: "" });
    };

    const handleRemoveItem = (id: string) => {
        setItems(items.filter((item) => item.id !== id));
    };

    const handlePrint = () => {
        window.print();
    };

    const handleItemSelect = (itemId: string) => {
        const selectedItem = availableItemsForWarehouse.find((i:any) => i.id === itemId);
        if (selectedItem) {
            setNewItem({
                ...newItem,
                id: itemId,
                price: selectedItem.price || 0,
                cost: selectedItem.cost || 0,
                unit: selectedItem.unit,
            });
        }
    }
        
    const handleSaveInvoice = async () => {
        if (!customerId || !warehouseId || items.length === 0) {
            toast({
                variant: 'destructive',
                title: 'بيانات غير مكتملة',
                description: 'يرجى اختيار العميل والمخزن وإضافة صنف واحد على الأقل.'
            });
            return;
        }
        if (paidAmount > 0 && !paidToAccountId) {
            toast({ variant: "destructive", title: "بيانات غير كاملة", description: "يرجى تحديد حساب الخزينة/البنك لاستلام الدفعة." });
            return;
        }

        setIsSaving(true);
        try {
            const invoiceNumber = `ف-ب-${await getNextId('salesInvoice')}`;
            const customerName = customers.find((c:any) => c.id === customerId)?.name || '';
            
            const invoiceData = {
                invoiceNumber,
                date: new Date().toISOString(),
                customerId,
                customerName,
                warehouseId,
                salesRepId: isRep ? user?.id : undefined,
                status: isRep ? 'pending' : 'approved',
                items: items.map(item => {
                    const originalItemId = item.id.split('-')[0];
                    return {
                        id: originalItemId,
                        name: item.name,
                        qty: item.qty,
                        price: item.price,
                        total: item.total,
                        cost: item.cost,
                    }
                }),
                subtotal,
                discount,
                tax,
                total,
                paidAmount,
                paidToAccountId, // Save the account ID for approval step
                notes,
            };
            
            await dbAction('salesInvoices', 'add', invoiceData);

            if (invoiceData.status === 'approved' && paidAmount > 0) {
                await dbAction('customerPayments', 'add', {
                    date: new Date().toISOString(),
                    amount: paidAmount,
                    customerId: customerId,
                    paidToAccountId: paidToAccountId,
                    notes: `دفعة من فاتورة بيع رقم ${invoiceNumber}`,
                    receiptNumber: `س-ع-${await getNextId('customerPayment')}`
                });
            }


            toast({
                title: 'تم الحفظ بنجاح',
                description: `تم حفظ الفاتورة رقم ${invoiceNumber}`
            });
            router.push('/sales/invoices/list');
        } catch (error) {
            console.error("Failed to save invoice:", error);
            toast({
                variant: 'destructive',
                title: 'خطأ',
                description: 'فشل حفظ الفاتورة. الرجاء المحاولة مرة أخرى.'
            });
        } finally {
            setIsSaving(false);
        }
    };


  return (
    <>
      <PageHeader title="إنشاء فاتورة بيع جديدة">
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
                    <CardTitle>فاتورة بيع</CardTitle>
                    <CardDescription>
                        شركة المحاسب الذكي
                    </CardDescription>
                </div>
                <div className="text-left text-sm md:text-base">
                    <div className="font-bold text-lg">فاتورة #(سيتم إنشاؤه)</div>
                    <div>تاريخ الفاتورة: {invoiceDate || '...'}</div>
                    <div>تاريخ الاستحقاق: {dueDate || '...'}</div>
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
                            <Select value={customerId} onValueChange={setCustomerId}>
                                <SelectTrigger id="customer">
                                    <SelectValue placeholder="اختر عميلاً" />
                                </SelectTrigger>
                                <SelectContent>
                                   {customers.map((c:any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="warehouse">من مخزن</Label>
                            <Select value={warehouseId} onValueChange={setWarehouseId} disabled={isRep}>
                                <SelectTrigger id="warehouse">
                                    <SelectValue placeholder="اختر مخزنًا" />
                                </SelectTrigger>
                                <SelectContent>
                                  {warehouses.map((w:any) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
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
                            {items.map((item) => (
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
                                    <Select value={newItem.id} onValueChange={handleItemSelect} disabled={!isRep && !warehouseId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={(!isRep && !warehouseId) ? "اختر المخزن أولاً" : "اختر صنفًا"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                        {availableItemsForWarehouse.map((item:any) => <SelectItem key={item.id} value={item.id}>{`${item.name} (المتاح: ${item.stock})`}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell className="text-center text-muted-foreground">{newItem.unit}</TableCell>
                                <TableCell className="p-2">
                                    <Input type="number" placeholder="الكمية" value={newItem.qty} onChange={e => setNewItem({...newItem, qty: parseInt(e.target.value) || 1})} className="text-center" />
                                </TableCell>
                                <TableCell className="p-2">
                                    <Input type="number" placeholder="السعر" value={newItem.price} onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})} className="text-center" readOnly={!can('edit', 'sales_invoices')} />
                                </TableCell>
                                <TableCell></TableCell>
                                <TableCell className="p-2 text-center">
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
                    
                    <div className="flex justify-between items-start">
                        <div className="w-full max-w-sm space-y-2 text-sm">
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertTitle>القيد المحاسبي المتوقع</AlertTitle>
                                <AlertDescription>
                                    <ul className="list-disc pr-4 text-xs">
                                        <li>من ح/ حسابات العملاء (مدين بقيمة الفاتورة الإجمالية)</li>
                                        <li>من ح/ خصم مسموح به (مدين بقيمة الخصم إن وجد)</li>
                                        <li>إلى ح/ إيرادات المبيعات (دائن بقيمة المبيعات قبل الخصم)</li>
                                        <hr className="my-1"/>
                                        <li>من ح/ تكلفة البضاعة المباعة (مدين بتكلفة الأصناف)</li>
                                        <li>إلى ح/ المخزون (دائن بتكلفة الأصناف)</li>
                                         {paidAmount > 0 && 
                                            <>
                                                <hr className="my-1" />
                                                <li>من ح/ الخزينة/البنك (مدين بقيمة الدفعة)</li>
                                                <li>إلى ح/ حسابات العملاء (دائن بقيمة الدفعة)</li>
                                            </>
                                        }
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        </div>
                        <div className="w-full max-w-sm space-y-4">
                            <div className="space-y-2">
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
                                <div className="flex justify-between font-bold text-base border-t pt-2">
                                    <span>الإجمالي الكلي</span>
                                    <span>ج.م {total.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="space-y-2 border-t pt-4">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="paidAmount" className="font-semibold">المبلغ المستلم</Label>
                                    <Input id="paidAmount" type="number" value={paidAmount} onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)} className="h-8 max-w-[120px] text-left" placeholder="0.00"/>
                                </div>
                                {paidAmount > 0 && <div className="space-y-2">
                                    <Label htmlFor="paidToAccount">استلام في</Label>
                                    <Select value={paidToAccountId} onValueChange={setPaidToAccountId} disabled={isRep}>
                                        <SelectTrigger id="paidToAccount">
                                            <SelectValue placeholder="اختر حساب الاستلام" />
                                        </SelectTrigger>
                                        <SelectContent>
                                        {cashAccounts.map((acc:any) => <SelectItem key={acc.id} value={acc.id} disabled={isRep ? !acc.salesRepId : !!acc.salesRepId}>{acc.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>}
                                <div className="flex justify-between font-bold text-base text-destructive">
                                    <span>المبلغ المتبقي</span>
                                    <span>ج.م {(total - paidAmount).toFixed(2)}</span>
                                </div>
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
                {isSaving ? 'جارٍ الحفظ...' : 'حفظ وإصدار الفاتورة'}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </>
  );
}
