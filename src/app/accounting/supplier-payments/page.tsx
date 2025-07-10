
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
import { PlusCircle, Loader2, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import useFirebase from '@/hooks/use-firebase';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddEntityDialog } from '@/components/add-entity-dialog';

interface SupplierPayment {
    id?: string;
    date: string;
    amount: number;
    supplierId: string;
    notes?: string;
}

interface Supplier {
    id: string;
    name: string;
}

const PaymentForm = ({ payment, onSave, onClose, suppliers }: { payment?: SupplierPayment, onSave: (data: Omit<SupplierPayment, 'id'>) => void, onClose: () => void, suppliers: Supplier[] }) => {
    const [formData, setFormData] = useState(
        payment || { date: new Date().toISOString().split('T')[0], amount: 0, supplierId: "", notes: "" }
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, amount: Number(formData.amount) });
        if (!payment) { 
            setFormData({ date: new Date().toISOString().split('T')[0], amount: 0, supplierId: "", notes: "" });
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
                    <Label htmlFor="payment-supplier" className="text-right">المورد</Label>
                    <Select value={formData.supplierId} onValueChange={v => setFormData({...formData, supplierId: v})} required>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="اختر موردًا" />
                        </SelectTrigger>
                        <SelectContent>
                            {suppliers.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
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
            <div className="flex justify-end">
                <Button type="submit">
                    <PlusCircle className="ml-2 h-4 w-4" />
                    حفظ الدفعة
                </Button>
            </div>
        </form>
    );
};

export default function SupplierPaymentsPage() {
    const { data: payments, loading: loadingPayments, add, update, remove } = useFirebase<SupplierPayment>('supplierPayments');
    const { data: suppliers, loading: loadingSuppliers } = useFirebase<Supplier>('suppliers');
    const { toast } = useToast();
    
    const loading = loadingPayments || loadingSuppliers;

     const getSupplierName = (supplierId: string) => {
        return suppliers.find(s => s.id === supplierId)?.name || 'غير معروف';
    };

    const handleSave = async (data: any) => {
        try {
            if (data.id) {
                await update(data.id, data);
                toast({ title: "تم التحديث بنجاح" });
            } else {
                await add(data);
                toast({ title: "تمت الإضافة بنجاح" });
            }
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
      <PageHeader title="مدفوعات الموردين" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>إضافة دفعة جديدة</CardTitle>
                <CardDescription>
                سجل الدفعات التي تمت للموردين لتسوية حساباتهم.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <PaymentForm onSave={handleSave} onClose={()=>{}} suppliers={suppliers} />
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
                         <div className="w-full overflow-auto border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[150px]">التاريخ</TableHead>
                                        <TableHead>المورد</TableHead>
                                        <TableHead>الملاحظات</TableHead>
                                        <TableHead className="text-center w-[150px]">المبلغ</TableHead>
                                        <TableHead className="text-center w-[100px]">الإجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.map(payment => (
                                        <TableRow key={payment.id}>
                                            <TableCell>{new Date(payment.date).toLocaleDateString('ar-EG')}</TableCell>
                                            <TableCell>{getSupplierName(payment.supplierId)}</TableCell>
                                            <TableCell>{payment.notes || '-'}</TableCell>
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
                                                        <AddEntityDialog
                                                            title="تعديل الدفعة"
                                                            description="تحديث تفاصيل الدفعة."
                                                            triggerButton={
                                                                <DropdownMenuItem onSelect={e => e.preventDefault()}>
                                                                    <Edit className="ml-2 h-4 w-4" />
                                                                    تعديل
                                                                </DropdownMenuItem>
                                                            }
                                                        >
                                                            <PaymentForm payment={payment} onSave={handleSave} onClose={() => {}} suppliers={suppliers} />
                                                        </AddEntityDialog>
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

