

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
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/auth-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useData } from '@/contexts/data-provider';
import { Combobox } from '@/components/ui/combobox';


interface CustomerPayment {
    id?: string;
    date: string;
    amount: number;
    customerId: string;
    paidToAccountId: string;
    notes?: string;
    receiptNumber?: string;
    createdById?: string;
    createdByName?: string;
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
    
    const customerOptions = React.useMemo(() => customers.map(c => ({ value: c.id, label: c.name })), [customers]);
    const cashAccountOptions = React.useMemo(() => cashAccounts.map(c => ({ value: c.id, label: c.name })), [cashAccounts]);


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
                <div className="space-y-2">
                    <Label htmlFor="payment-date">التاريخ</Label>
                    <Input id="payment-date" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="payment-customer">العميل</Label>
                    <Combobox
                        options={customerOptions}
                        value={formData.customerId}
                        onValueChange={v => setFormData({...formData, customerId: v})}
                        placeholder="اختر عميلاً..."
                        emptyMessage="لم يتم العثور على عميل."
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="paid-to">مستلم في</Label>
                    <Combobox
                        options={cashAccountOptions}
                        value={formData.paidToAccountId}
                        onValueChange={v => setFormData({...formData, paidToAccountId: v})}
                        placeholder="اختر حساب الاستلام..."
                        emptyMessage="لم يتم العثور على حساب."
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="payment-amount">المبلغ</Label>
                    <Input id="payment-amount" type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value as any})} placeholder="أدخل مبلغ الدفعة" required/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="payment-notes">ملاحظات</Label>
                    <Textarea id="payment-notes" value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="أدخل أي ملاحظات (اختياري)" />
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
    const { customerPayments: payments, customers, cashAccounts, dbAction, getNextId, loading } = useData();
    const { toast } = useToast();
    const { user } = useAuth();
    
     const getCustomerName = (customerId: string) => {
        return customers.find(c => c.id === customerId)?.name || 'غير معروف';
    };

    const getCashAccountName = (accountId: string) => {
        return cashAccounts.find((acc: any) => acc.id === accountId)?.name || 'غير معروف';
    }

    const handleSave = async (data: Omit<CustomerPayment, 'id' | 'receiptNumber'>) => {
        try {
            const receiptNumber = `س-ع-${await getNextId('customerPayment')}`;
            const newPayment: CustomerPayment = {
                ...data,
                receiptNumber,
                createdById: user?.id,
                createdByName: user?.name,
            };
            await dbAction('customerPayments', 'add', newPayment);
            toast({ title: "تمت الإضافة بنجاح", description: `تم حفظ الدفعة برقم إيصال: ${receiptNumber}` });
        } catch (error) {
            toast({ variant: "destructive", title: "حدث خطأ", description: "فشل الحفظ" });
        }
    };
    
    const handleDelete = async (id: string) => {
        try {
            await dbAction('customerPayments', 'remove', { id });
            toast({ title: "تم الحذف بنجاح" });
        } catch (error) {
            toast({ variant: "destructive", title: "حدث خطأ", description: "فشل الحذف" });
        }
    };


  return (
    <>
      <PageHeader title="مقبوضات العملاء" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-5">
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
                        <div className="w-full overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>العميل</TableHead>
                                        <TableHead>مستلمة في</TableHead>
                                        <TableHead className="text-center">المبلغ</TableHead>
                                        <TableHead className="text-center w-[100px]">الإجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.map((payment : CustomerPayment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell>
                                                <div className="font-medium">{getCustomerName(payment.customerId)}</div>
                                                <div className="text-sm text-muted-foreground">{new Date(payment.date).toLocaleDateString('ar-EG')}</div>
                                                <div className="text-xs text-muted-foreground">بواسطة: {payment.createdByName || 'غير معروف'}</div>
                                            </TableCell>
                                            <TableCell>{getCashAccountName(payment.paidToAccountId)}</TableCell>
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
                                                                هذا الإجراء سيحذف الدفعة بشكل دائم. لا يمكن التراجع عن هذا الإجراء.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(payment.id!)}>متابعة</AlertDialogAction>
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
