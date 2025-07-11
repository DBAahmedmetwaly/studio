

"use client";

import React, { useState } from 'react';
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
import useFirebase from '@/hooks/use-firebase';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddEntityDialog } from '@/components/add-entity-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CustomerPayment {
    id?: string;
    date: string;
    amount: number;
    customerId: string;
    paidToAccountId: string;
    notes?: string;
    receiptNumber?: string;
}

interface Customer {
    id: string;
    name: string;
}

interface CashAccount {
    id: string;
    name: string;
}

const PaymentForm = ({ payment, onSave, onClose, customers, cashAccounts }: { payment?: CustomerPayment, onSave: (data: Omit<CustomerPayment, 'id' | 'receiptNumber'>) => void, onClose: () => void, customers: Customer[], cashAccounts: CashAccount[] }) => {
    const [formData, setFormData] = useState(
        payment || { date: new Date().toISOString().split('T')[0], amount: 0, customerId: "", paidToAccountId: "", notes: "" }
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, amount: Number(formData.amount) });
        if (!payment) { 
            setFormData({ date: new Date().toISOString().split('T')[0], amount: 0, customerId: "", paidToAccountId: "", notes: "" });
        }
        onClose();
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="payment-date" className="text-right">التاريخ</Label>
                    <Input id="payment-date" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="col-span-3" required/>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="payment-customer" className="text-right">العميل</Label>
                    <Select value={formData.customerId} onValueChange={v => setFormData({...formData, customerId: v})} required>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="اختر عميلاً" />
                        </SelectTrigger>
                        <SelectContent>
                            {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="paid-to" className="text-right">مستلم في</Label>
                    <Select value={formData.paidToAccountId} onValueChange={v => setFormData({...formData, paidToAccountId: v})} required>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="اختر حساب الاستلام" />
                        </SelectTrigger>
                        <SelectContent>
                           {cashAccounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="payment-amount" className="text-right">المبلغ</Label>
                    <Input id="payment-amount" type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value as any})} className="col-span-3" placeholder="أدخل مبلغ الدفعة" required/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="payment-notes" className="text-right">ملاحظات</Label>
                    <Textarea id="payment-notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="col-span-3" placeholder="أدخل أي ملاحظات (اختياري)" />
                </div>
            </div>
             <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle>القيد المحاسبي المتوقع</AlertTitle>
                <AlertDescription>
                    من ح/ {cashAccounts.find(c => c.id === formData.paidToAccountId)?.name || "النقدية"} (مدين) <br/>
                    إلى ح/ حسابات العملاء (دائن)
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

export default function CustomerPaymentsPage() {
    const { data: payments, loading: loadingPayments, add, update, remove, getNextId } = useFirebase<CustomerPayment>('customerPayments');
    const { data: customers, loading: loadingCustomers } = useFirebase<Customer>('customers');
    const { data: cashAccounts, loading: loadingCashAccounts } = useFirebase<CashAccount>('cashAccounts');
    const { toast } = useToast();
    
    const loading = loadingPayments || loadingCustomers || loadingCashAccounts;

     const getCustomerName = (customerId: string) => {
        return customers.find(c => c.id === customerId)?.name || 'غير معروف';
    };

    const getCashAccountName = (accountId: string) => {
        return cashAccounts.find(acc => acc.id === accountId)?.name || 'غير معروف';
    }

    const handleSave = async (data: Omit<CustomerPayment, 'id' | 'receiptNumber'>) => {
        try {
            const receiptNumber = `س-ع-${await getNextId('customerPayment')}`;
            const newPayment = { ...data, receiptNumber };
            await add(newPayment);
            toast({ title: "تمت الإضافة بنجاح", description: `تم حفظ الدفعة برقم إيصال: ${receiptNumber}` });
        } catch (error) {
            toast({ variant: "destructive", title: "حدث خطأ", description: "فشل الحفظ" });
        }
    };
    
    const handleDelete = async (id: string) => {
        if(confirm('هل أنت متأكد من حذف هذه الدفعة؟')) {
            try {
                await remove(id);
                toast({ title: "تم الحذف بنجاح" });
            } catch (error) {
                toast({ variant: "destructive", title: "حدث خطأ", description: "فشل الحذف" });
            }
        }
    };


  return (
    <>
      <PageHeader title="مقبوضات العملاء" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>إضافة دفعة جديدة</CardTitle>
                <CardDescription>
                سجل الدفعات المستلمة من العملاء لتسوية حساباتهم.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <PaymentForm onSave={handleSave} onClose={()=>{}} customers={customers} cashAccounts={cashAccounts} />
            </CardContent>
            </Card>
            
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>سجل المقبوضات</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                         <div className="w-full overflow-auto border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[150px]">التاريخ</TableHead>
                                        <TableHead>العميل</TableHead>
                                        <TableHead>مستلمة في</TableHead>
                                        <TableHead className="text-center w-[150px]">المبلغ</TableHead>
                                        <TableHead className="text-center w-[100px]">الإجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.map(payment => (
                                        <TableRow key={payment.id}>
                                            <TableCell>{new Date(payment.date).toLocaleDateString('ar-EG')}</TableCell>
                                            <TableCell>{getCustomerName(payment.customerId)}</TableCell>
                                            <TableCell>{getCashAccountName(payment.paidToAccountId)}</TableCell>
                                            <TableCell className="text-center">{payment.amount.toLocaleString()}</TableCell>
                                            <TableCell className="text-center">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">قائمة</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                                                        {/* <AddEntityDialog
                                                            title="تعديل الدفعة"
                                                            description="تحديث تفاصيل الدفعة."
                                                            triggerButton={
                                                                <DropdownMenuItem onSelect={e => e.preventDefault()}>
                                                                    <Edit className="ml-2 h-4 w-4" />
                                                                    تعديل
                                                                </DropdownMenuItem>
                                                            }
                                                        >
                                                            <PaymentForm payment={payment} onSave={handleSave} onClose={() => {}} customers={customers} cashAccounts={cashAccounts} />
                                                        </AddEntityDialog> */}
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(payment.id!)}>
                                                            <Trash2 className="ml-2 h-4 w-4" />
                                                            حذف
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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
