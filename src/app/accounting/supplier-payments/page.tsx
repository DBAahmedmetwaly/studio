

"use client";

import React, { useState, useMemo } from 'react';
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Loader2, MoreHorizontal, Edit, Trash2, Info } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/auth-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useData } from '@/contexts/data-provider';


interface SupplierPayment {
    id?: string;
    date: string;
    amount: number;
    supplierId: string;
    paidFromAccountId: string;
    notes?: string;
    receiptNumber?: string;
    createdById?: string;
    createdByName?: string;
    invoiceId?: string;
}

interface Supplier {
    id: string;
    name: string;
}

interface CashAccount {
    id: string;
    name: string;
}

interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  total: number;
  paidAmount?: number;
}


const PaymentForm = ({ onSave, suppliers, cashAccounts, purchaseInvoices }: { onSave: (data: Omit<SupplierPayment, 'id' | 'receiptNumber'>) => void, suppliers: Supplier[], cashAccounts: CashAccount[], purchaseInvoices: PurchaseInvoice[] }) => {
    const [formData, setFormData] = useState<Omit<SupplierPayment, 'id' | 'receiptNumber'>>({ 
        date: new Date().toISOString().split('T')[0], 
        amount: 0, 
        supplierId: "", 
        paidFromAccountId: "", 
        notes: "",
        invoiceId: "" 
    });

    const supplierInvoicesWithBalance = useMemo(() => {
        if (!formData.supplierId) return [];
        return purchaseInvoices.filter(inv => {
            if (inv.supplierId !== formData.supplierId) return false;
            const remaining = inv.total - (inv.paidAmount || 0);
            return remaining > 0;
        });
    }, [formData.supplierId, purchaseInvoices]);

    const selectedInvoiceDetails = useMemo(() => {
        if (!formData.invoiceId) return null;
        return supplierInvoicesWithBalance.find(inv => inv.id === formData.invoiceId);
    }, [formData.invoiceId, supplierInvoicesWithBalance]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        let notesToSave = formData.notes;
        if(selectedInvoiceDetails) {
            notesToSave = `دفعة لفاتورة شراء رقم ${selectedInvoiceDetails.invoiceNumber}`;
        }
        
        onSave({ ...formData, amount: Number(formData.amount), notes: notesToSave });
        
        setFormData({ date: new Date().toISOString().split('T')[0], amount: 0, supplierId: "", paidFromAccountId: "", notes: "", invoiceId: "" });
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="payment-date">التاريخ</Label>
                    <Input id="payment-date" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="payment-supplier">المورد</Label>
                    <Select value={formData.supplierId} onValueChange={v => setFormData({...formData, supplierId: v, invoiceId: ""})} required>
                        <SelectTrigger id="payment-supplier">
                            <SelectValue placeholder="اختر موردًا" />
                        </SelectTrigger>
                        <SelectContent>
                            {suppliers.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="payment-invoice">ربط بفاتورة</Label>
                    <Select value={formData.invoiceId} onValueChange={v => setFormData({...formData, invoiceId: v})} disabled={!formData.supplierId || supplierInvoicesWithBalance.length === 0}>
                        <SelectTrigger id="payment-invoice">
                            <SelectValue placeholder={!formData.supplierId ? "اختر موردًا أولاً" : "اختياري: اختر فاتورة"} />
                        </SelectTrigger>
                        <SelectContent>
                            {supplierInvoicesWithBalance.map(inv => (
                                <SelectItem key={inv.id} value={inv.id}>
                                    {inv.invoiceNumber} (المتبقي: {(inv.total - (inv.paidAmount || 0)).toLocaleString()})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {selectedInvoiceDetails && (
                     <div className="-mt-2">
                        <p className="text-xs text-muted-foreground text-center">
                            إجمالي الفاتورة: {selectedInvoiceDetails.total.toLocaleString()} | 
                            المدفوع: {(selectedInvoiceDetails.paidAmount || 0).toLocaleString()} | 
                            المتبقي: {(selectedInvoiceDetails.total - (selectedInvoiceDetails.paidAmount || 0)).toLocaleString()}
                        </p>
                    </div>
                )}
                <div className="space-y-2">
                    <Label htmlFor="paid-from">مدفوع من</Label>
                    <Select value={formData.paidFromAccountId} onValueChange={v => setFormData({...formData, paidFromAccountId: v})} required>
                        <SelectTrigger id="paid-from">
                            <SelectValue placeholder="اختر حساب الدفع" />
                        </SelectTrigger>
                        <SelectContent>
                           {cashAccounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="payment-amount">المبلغ</Label>
                    <Input id="payment-amount" type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value as any})} placeholder="أدخل مبلغ الدفعة" required/>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="payment-notes">ملاحظات</Label>
                    <Textarea id="payment-notes" value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="أدخل أي ملاحظات (اختياري)" disabled={!!formData.invoiceId} />
                </div>
            </div>
             <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle>القيد المحاسبي المتوقع</AlertTitle>
                <AlertDescription>
                    من ح/ حسابات الموردين (مدين) <br/>
                    إلى ح/ {cashAccounts.find(c => c.id === formData.paidFromAccountId)?.name || "النقدية"} (دائن)
                </AlertDescription>
            </Alert>
            <div className="flex justify-end mt-4">
                <Button type="submit">
                    <PlusCircle className="ml-2 h-4 w-4" />
                    حفظ الدفعة
                </Button>
            </div>
        </form>
    );
};

export default function SupplierPaymentsPage() {
    const { supplierPayments: payments, suppliers, cashAccounts, purchaseInvoices, dbAction, getNextId, loading } = useData();
    const { toast } = useToast();
    const { user } = useAuth();
    
     const getSupplierName = (supplierId: string) => {
        return suppliers.find(s => s.id === supplierId)?.name || 'غير معروف';
    };

    const getCashAccountName = (accountId: string) => {
        return cashAccounts.find((acc: any) => acc.id === accountId)?.name || 'غير معروف';
    }

    const handleSave = async (data: Omit<SupplierPayment, 'id' | 'receiptNumber'>) => {
        try {
            const receiptNumber = `س-م-${await getNextId('supplierPayment')}`;
            const newPayment: SupplierPayment = {
                ...data,
                receiptNumber,
                createdById: user?.id,
                createdByName: user?.name,
            };
            await dbAction('supplierPayments', 'add', newPayment);
            
            // If payment is linked to an invoice, update the invoice's paidAmount
            if (data.invoiceId) {
                const invoice = purchaseInvoices.find((inv: PurchaseInvoice) => inv.id === data.invoiceId);
                if (invoice) {
                    const newPaidAmount = (invoice.paidAmount || 0) + data.amount;
                    await dbAction('purchaseInvoices', 'update', { id: data.invoiceId, data: { paidAmount: newPaidAmount } });
                }
            }

            toast({ title: "تمت الإضافة بنجاح", description: `تم حفظ الدفعة برقم إيصال: ${receiptNumber}` });
        } catch (error) {
            toast({ variant: "destructive", title: "حدث خطأ", description: "فشل الحفظ" });
        }
    };
    
    const handleDelete = async (payment: SupplierPayment) => {
        try {
             // If payment is linked to an invoice, revert the paidAmount on the invoice
            if (payment.invoiceId) {
                const invoice = purchaseInvoices.find((inv: PurchaseInvoice) => inv.id === payment.invoiceId);
                if (invoice) {
                    const newPaidAmount = (invoice.paidAmount || 0) - payment.amount;
                    await dbAction('purchaseInvoices', 'update', { id: payment.invoiceId, data: { paidAmount: Math.max(0, newPaidAmount) } });
                }
            }
            await dbAction('supplierPayments', 'remove', { id: payment.id! });
            toast({ title: "تم الحذف بنجاح" });
        } catch (error) {
            toast({ variant: "destructive", title: "حدث خطأ", description: "فشل الحذف" });
        }
    };


  return (
    <>
      <PageHeader title="مدفوعات الموردين" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-5">
            <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>إضافة دفعة جديدة</CardTitle>
                <CardDescription>
                سجل الدفعات التي تمت للموردين لتسوية حساباتهم.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <PaymentForm onSave={handleSave} suppliers={suppliers} cashAccounts={cashAccounts} purchaseInvoices={purchaseInvoices} />
            </CardContent>
            </Card>
            
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>سجل المدفوعات</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="w-full overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>المورد</TableHead>
                                        <TableHead>البيان / المرجع</TableHead>
                                        <TableHead>مدفوعة من</TableHead>
                                        <TableHead className="text-center">المبلغ</TableHead>
                                        <TableHead className="text-center w-[100px]">الإجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.map((payment: SupplierPayment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell>
                                                <div className="font-medium">{getSupplierName(payment.supplierId)}</div>
                                                <div className="text-sm text-muted-foreground">{new Date(payment.date).toLocaleDateString('ar-EG')}</div>
                                                <div className="text-xs text-muted-foreground">بواسطة: {payment.createdByName || 'غير معروف'}</div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{payment.notes || 'دفعة عامة'}</TableCell>
                                            <TableCell>{getCashAccountName(payment.paidFromAccountId)}</TableCell>
                                            <TableCell className="text-center">{payment.amount.toLocaleString()}</TableCell>
                                            <TableCell className="text-center">
                                                <AlertDialog>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                                <span className="sr-only">قائمة</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                                                    <Trash2 className="ml-2 h-4 w-4" />
                                                                    حذف
                                                                </DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                هذا الإجراء سيحذف الدفعة بشكل دائم. إذا كانت الدفعة مرتبطة بفاتورة، فسيتم عكس قيمتها من المبلغ المدفوع في الفاتورة. لا يمكن التراجع عن هذا الإجراء.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(payment)}>متابعة</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </main>
    </>
  );
}
