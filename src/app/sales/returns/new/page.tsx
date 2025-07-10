
"use client";

import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Save, Loader2 } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import useFirebase from "@/hooks/use-firebase";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from 'next/navigation';
import { Combobox } from "@/components/ui/combobox";

interface ReturnItem {
  id: string; // original item id
  name: string;
  qty: number;
  price: number;
  total: number;
  unit: string;
  uniqueId: string; // for list key
}

interface Item { id: string; name: string; unit: string; price?: number; }
interface Customer { id: string; name: string; }
interface Warehouse { id: string; name: string; }
interface SaleInvoice { id: string; invoiceNumber: string; date: string; customerId: string; warehouseId: string; customerName: string; items: { id: string; name: string; qty: number; price: number; }[] }

export default function NewSalesReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(searchParams.get('invoiceId'));
  const [items, setItems] = useState<ReturnItem[]>([]);
  
  const [total, setTotal] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [notes, setNotes] = useState("");
  const [returnDate, setReturnDate] = useState('');

  const [filters, setFilters] = useState({
    customerId: '',
    warehouseId: '',
    date: ''
  });
  
  const { data: availableItems, loading: loadingItems } = useFirebase<Item>('items');
  const { data: customers, loading: loadingCustomers } = useFirebase<Customer>('customers');
  const { data: warehouses, loading: loadingWarehouses } = useFirebase<Warehouse>('warehouses');
  const { add: addSaleReturn } = useFirebase('salesReturns');
  const { data: invoices, loading: loadingInvoices } = useFirebase<SaleInvoice>('salesInvoices');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setReturnDate(today);
  }, []);
  
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
        const invDate = new Date(inv.date).toISOString().split('T')[0];
        const filterDate = filters.date ? new Date(filters.date).toISOString().split('T')[0] : '';
        
        return (filters.customerId ? inv.customerId === filters.customerId : true) &&
               (filters.warehouseId ? inv.warehouseId === filters.warehouseId : true) &&
               (filters.date ? invDate === filterDate : true);
    });
  }, [invoices, filters]);

  const invoiceOptions = useMemo(() => {
      return filteredInvoices.map(inv => ({
          value: inv.id,
          label: `${inv.invoiceNumber} - ${inv.customerName} - (${new Date(inv.date).toLocaleDateString('ar-EG')})`
      }));
  }, [filteredInvoices]);


  useEffect(() => {
    if (selectedInvoiceId && invoices.length > 0 && availableItems.length > 0) {
      const invoice = invoices.find(inv => inv.id === selectedInvoiceId);
      if (invoice) {
        setCustomerId(invoice.customerId);
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
    } else {
        setItems([]);
        setCustomerId("");
        setWarehouseId("");
    }
  }, [selectedInvoiceId, invoices, availableItems]);

  useEffect(() => {
    const newTotal = items.reduce((acc, item) => acc + item.total, 0);
    setTotal(newTotal);
  }, [items]);
  
  const handleRemoveItem = (uniqueId: string) => {
    setItems(items.filter((item) => item.uniqueId !== uniqueId));
  };
  
  const handleSaveReturn = async () => {
    if (!customerId || !warehouseId || items.length === 0) {
        toast({ variant: 'destructive', title: 'بيانات غير مكتملة', description: 'يرجى اختيار العميل والمخزن وإضافة صنف واحد على الأقل.' });
        return;
    }
    setIsSaving(true);
    try {
        const returnData = {
            date: new Date(returnDate).toISOString(),
            customerId,
            warehouseId,
            items: items.map(item => ({
                id: item.id.split('-')[0],
                name: item.name,
                qty: item.qty,
                price: item.price,
                total: item.total,
            })),
            total,
            notes,
        };
        await addSaleReturn(returnData);
        toast({ title: 'تم الحفظ بنجاح', description: `تم حفظ مرتجع المبيعات.` });
        router.push('/sales/returns');
    } catch (error) {
        console.error("Failed to save sales return:", error);
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حفظ مرتجع المبيعات.' });
    } finally {
        setIsSaving(false);
    }
  }

  const loading = loadingItems || loadingCustomers || loadingWarehouses || loadingInvoices;
  
  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({...prev, [key]: value}));
  };

  const ReturnForm = () => (
    <>
        <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
                <Label htmlFor="customer">العميل</Label>
                <Select value={customerId} onValueChange={setCustomerId} disabled>
                    <SelectTrigger id="customer"><SelectValue placeholder="اختر عميلاً" /></SelectTrigger>
                    <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="warehouse">إلى مخزن</Label>
                <Select value={warehouseId} onValueChange={setWarehouseId} disabled>
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
                </TableBody>
            </Table>
        </div>
        </div>
        
        <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-2 text-sm">
                <div className="flex justify-between font-bold text-base">
                    <span>إجمالي قيمة المرتجع</span>
                    <span>ج.م {total.toFixed(2)}</span>
                </div>
            </div>
        </div>

        <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea id="notes" placeholder="أضف سبب الإرجاع أو أي ملاحظات..." value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
    </>
  );

  return (
    <>
      <PageHeader title="مرتجع مبيعات جديد" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>إذن مرتجع مبيعات</CardTitle>
            <CardDescription>
              تسجيل الأصناف المرتجعة من العميل وتأثيرها على المخزون وحسابه.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
                 <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : !selectedInvoiceId ? (
                 <div className="space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>البحث عن فاتورة البيع الأصلية</CardTitle>
                            <CardDescription>استخدم الفلاتر للبحث عن الفاتورة التي تريد عمل مرتجع لها.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>العميل</Label>
                                    <Select value={filters.customerId} onValueChange={(v) => handleFilterChange('customerId', v)}>
                                        <SelectTrigger><SelectValue placeholder="كل العملاء" /></SelectTrigger>
                                        <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>المخزن</Label>
                                    <Select value={filters.warehouseId} onValueChange={(v) => handleFilterChange('warehouseId', v)}>
                                        <SelectTrigger><SelectValue placeholder="كل المخازن" /></SelectTrigger>
                                        <SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>التاريخ</Label>
                                    <Input type="date" value={filters.date} onChange={(e) => handleFilterChange('date', e.target.value)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="space-y-2">
                        <Label htmlFor="invoice-select">اختر فاتورة البيع</Label>
                        <Combobox
                            options={invoiceOptions}
                            value={selectedInvoiceId || ''}
                            onValueChange={setSelectedInvoiceId}
                            placeholder="اختر فاتورة..."
                            emptyMessage="لا توجد فواتير تطابق البحث."
                        />
                    </div>
                </div>
            ) : (
                <ReturnForm />
            )}
          </CardContent>
          {selectedInvoiceId && (
            <CardFooter className="flex justify-between items-center">
                 <Button variant="outline" onClick={() => setSelectedInvoiceId(null)}>
                    اختيار فاتورة أخرى
                </Button>
                <Button size="lg" disabled={loading || isSaving} onClick={handleSaveReturn}>
                    {isSaving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
                    {isSaving ? 'جارٍ الحفظ...' : 'حفظ المرتجع'}
                </Button>
            </CardFooter>
          )}
        </Card>
      </main>
    </>
  );
}
