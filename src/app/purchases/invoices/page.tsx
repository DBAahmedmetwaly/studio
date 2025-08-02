
"use client";

import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Trash2, Printer, Save, Info, Loader2 } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import { useData } from "@/contexts/data-provider";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth-context";
import { Combobox } from "@/components/ui/combobox";


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

interface CashAccount {
    id: string;
    name: string;
    openingBalance: number;
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
  const [paidAmount, setPaidAmount] = useState(0);
  const [applyTax, setApplyTax] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [paidFromAccountId, setPaidFromAccountId] = useState("");
  const [notes, setNotes] = useState("");
  
  const [invoiceDate, setInvoiceDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  
  const { 
    items: availableItems, 
    suppliers, 
    warehouses, 
    cashAccounts, 
    dbAction, 
    getNextId, 
    loading,
    // For balance calculation
    customerPayments,
    salesInvoices,
    exceptionalIncomes,
    treasuryTransactions,
    expenses,
    supplierPayments,
    employeeAdvances,
    profitDistributions,
  } = useData();

  const itemsForCombobox = React.useMemo(() => {
    return availableItems.map((item: Item) => ({ value: item.id, label: item.name }));
  }, [availableItems]);
  
  const suppliersForCombobox = React.useMemo(() => {
    return suppliers.map((s: Supplier) => ({ value: s.id, label: s.name }));
  }, [suppliers]);
  
   const accountBalances = useMemo(() => {
        const balances = new Map<string, number>();
        cashAccounts.forEach((account:any) => {
            let balance = account.openingBalance || 0;
            // Add other transactions to calculate current balance
             customerPayments.filter((p: any) => p.paidToAccountId === account.id).forEach((p:any) => balance += p.amount);
             salesInvoices.filter((s: any) => s.status === 'approved' && s.paidToAccountId === account.id).forEach((s:any) => balance += (s.paidAmount || 0));
             exceptionalIncomes.filter((i: any) => i.paidToAccountId === account.id).forEach((i:any) => balance += i.amount);
             treasuryTransactions.filter((tx:any) => tx.accountId === account.id && tx.type === 'deposit').forEach((tx:any) => balance += tx.amount);

             expenses.filter((ex: any) => ex.paidFromAccountId === account.id).forEach((ex:any) => balance -= ex.amount);
             supplierPayments.filter((sp: any) => sp.paidFromAccountId === account.id).forEach((sp:any) => balance -= sp.amount);
             employeeAdvances.filter((ea: any) => ea.paidFromAccountId === account.id).forEach((ea:any) => balance -= ea.amount);
             profitDistributions.filter((pd: any) => pd.paidFromAccountId === account.id).forEach((pd:any) => balance -= pd.amount);
             treasuryTransactions.filter((tx:any) => tx.accountId === account.id && tx.type === 'withdrawal').forEach((tx:any) => balance -= tx.amount);

            balances.set(account.id, balance);
        });
        return balances;
    }, [cashAccounts, customerPayments, salesInvoices, exceptionalIncomes, treasuryTransactions, expenses, supplierPayments, employeeAdvances, profitDistributions]);
    
    const cashAccountOptions = React.useMemo(() => {
        return cashAccounts.map((acc: CashAccount) => ({
            value: acc.id,
            label: `${acc.name} (الرصيد: ${(accountBalances.get(acc.id) || 0).toLocaleString()})`
        }))
    }, [cashAccounts, accountBalances]);
    
    const isBalanceSufficient = useMemo(() => {
        if (paidAmount <= 0) return true;
        if (!paidFromAccountId) return false;
        const balance = accountBalances.get(paidFromAccountId) || 0;
        return balance >= paidAmount;
    }, [paidAmount, paidFromAccountId, accountBalances]);


  useEffect(() => {
    const newSubtotal = items.reduce((acc, item) => acc + item.total, 0);
    const newTax = applyTax ? (newSubtotal - discount) * 0.14 : 0;
    const newTotal = newSubtotal - discount + newTax;
    setSubtotal(newSubtotal);
    setTax(newTax);
    setTotal(newTotal);
    setPaidAmount(newTotal); // Default paid amount to total
  }, [items, discount, applyTax]);

  useEffect(() => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 30);
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setDueDate(futureDate.toISOString().split('T')[0]);
  }, []);

  const handleAddItem = () => {
    if (!newItem.id || newItem.qty <= 0 || newItem.price <= 0) return;
    const selectedItem = availableItems.find((i: Item) => i.id === newItem.id);
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
    const selectedItem = availableItems.find((i: Item) => i.id === itemId);
    if (selectedItem) {
        setNewItem({
            ...newItem,
            id: itemId,
            price: selectedItem.cost || selectedItem.price || 0,
            unit: selectedItem.unit,
        });
    }
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
       if (paidAmount > 0 && !paidFromAccountId) {
            toast({ variant: "destructive", title: "بيانات غير مكتملة", description: "يرجى تحديد الحساب الذي تم الدفع منه." });
            return;
        }
        if (!isBalanceSufficient) {
             toast({ variant: "destructive", title: "رصيد غير كافٍ", description: "رصيد الخزينة المحدد لا يكفي لتغطية المبلغ المدفوع." });
            return;
        }

        setIsSaving(true);
        try {
            const invoiceNumber = `ف-ش-${await getNextId('purchaseInvoice')}`;
            const supplierName = suppliers.find((s: Supplier) => s.id === supplierId)?.name || '';

            const invoiceData = {
                invoiceNumber,
                date: new Date(invoiceDate).toISOString(),
                dueDate: new Date(dueDate).toISOString(),
                supplierId,
                supplierName,
                warehouseId,
                items: items.map(item => {
                    const originalItemId = item.id.split('-')[0];
                    return {
                        id: originalItemId,
                        name: item.name,
                        qty: item.qty,
                        cost: item.price, // In purchase invoice, price is the cost
                        price: item.price,
                        total: item.total,
                    }
                }),
                subtotal,
                discount,
                tax,
                total,
                paidAmount,
                paidFromAccountId,
                notes,
                createdById: user?.id,
                createdByName: user?.name,
            };

            await dbAction('purchaseInvoices', 'add', invoiceData);
            
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
                    <div>تاريخ الفاتورة: {new Date(invoiceDate).toLocaleDateString('ar-EG')}</div>
                    <div>تاريخ الاستحقاق: {new Date(dueDate).toLocaleDateString('ar-EG')}</div>
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
                        <Combobox
                          options={suppliersForCombobox}
                          value={supplierId}
                          onValueChange={setSupplierId}
                          placeholder="اختر موردًا..."
                          emptyMessage="لم يتم العثور على المورد."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="warehouse">المخزن المستلم</Label>
                        <Select value={warehouseId} onValueChange={setWarehouseId}>
                            <SelectTrigger id="warehouse">
                                <SelectValue placeholder="اختر مخزنًا" />
                            </SelectTrigger>
                            <SelectContent>
                               {warehouses.map((w: Warehouse) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
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
                            <TableHead className="text-center">سعر الشراء (التكلفة)</TableHead>
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
                                 <Combobox
                                    options={itemsForCombobox}
                                    value={newItem.id}
                                    onValueChange={handleItemSelect}
                                    placeholder="اختر صنفًا..."
                                    emptyMessage="لا توجد أصناف."
                                />
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
                                <Button onClick={handleAddItem} size="sm">
                                    <PlusCircle className="ml-2 h-4 w-4" />
                                    إضافة
                                </Button>
                            </TableCell>
                        </TableRow>
                        </TableBody>
                    </Table>
                </div>
                </div>
                
                <div className="flex flex-col-reverse md:flex-row justify-between items-start gap-8">
                    <div className="w-full md:max-w-sm space-y-2 text-sm mt-4 md:mt-0">
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>القيد المحاسبي المتوقع</AlertTitle>
                            <AlertDescription>
                                <ul className="list-disc pr-4 text-xs">
                                    <li>من ح/ المشتريات (مدين بقيمة البضاعة قبل الخصم)</li>
                                    <li>إلى ح/ حسابات الموردين (دائن بقيمة الفاتورة الإجمالية)</li>
                                    <li>إلى ح/ خصم مكتسب (دائن بقيمة الخصم إن وجد)</li>
                                    {paidAmount > 0 && 
                                    <>
                                        <hr className="my-1" />
                                        <li>من ح/ حسابات الموردين (مدين بقيمة الدفعة)</li>
                                        <li>إلى ح/ الخزينة/البنك (دائن بقيمة الدفعة)</li>
                                    </>
                                    }
                                </ul>
                            </AlertDescription>
                        </Alert>
                    </div>
                    <div className="w-full md:max-w-sm space-y-4">
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
                                <Label htmlFor="paidAmount" className="font-semibold">المبلغ المدفوع</Label>
                                <Input id="paidAmount" type="number" value={paidAmount} onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)} className="h-8 max-w-[120px] text-left" placeholder="0.00"/>
                            </div>
                             {paidAmount > 0 && <div className="space-y-2">
                                <Label htmlFor="paidFromAccount">الدفع من</Label>
                                <Combobox
                                    options={cashAccountOptions}
                                    value={paidFromAccountId}
                                    onValueChange={setPaidFromAccountId}
                                    placeholder="اختر حساب الدفع..."
                                    emptyMessage="لم يتم العثور على حساب."
                                />
                                {!isBalanceSufficient && paidFromAccountId && <p className="text-xs text-destructive">رصيد هذا الحساب غير كافٍ.</p>}
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
            <Button size="lg" disabled={loading || isSaving || !isBalanceSufficient} onClick={handleSaveInvoice}>
                 {isSaving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
                {isSaving ? 'جارٍ الحفظ...' : 'تسجيل الفاتورة'}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </>
  );
}
