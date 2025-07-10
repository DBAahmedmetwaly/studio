
"use client";

import React, { useState } from 'react';
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { AddEntityDialog } from '@/components/add-entity-dialog';

interface ExceptionalIncome {
    id?: string;
    date: string;
    amount: number;
    description: string;
}

const IncomeForm = ({ income, onSave, onClose }: { income?: ExceptionalIncome, onSave: (data: ExceptionalIncome) => void, onClose: () => void }) => {
    const [formData, setFormData] = useState<ExceptionalIncome>(
        income || { date: new Date().toISOString().split('T')[0], amount: 0, description: "" }
    );

    const handleSubmit = () => {
        onSave({ ...formData, amount: Number(formData.amount) });
        onClose();
    }

    return (
        <>
            <div className="grid gap-4 py-4">
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="income-date" className="text-right">التاريخ</Label>
                    <Input id="income-date" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="income-amount" className="text-right">المبلغ</Label>
                    <Input id="income-amount" type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value as any})} className="col-span-3" placeholder="أدخل مبلغ الدخل" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="income-description" className="text-right">الوصف</Label>
                    <Textarea id="income-description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="col-span-3" placeholder="أدخل وصفًا للدخل" />
                </div>
            </div>
            <div className="flex justify-end">
                <Button onClick={handleSubmit}>حفظ</Button>
            </div>
        </>
    );
};


export default function ExceptionalIncomePage() {
    const { data: incomes, loading, add, update, remove } = useFirebase<ExceptionalIncome>('exceptionalIncomes');
    const { toast } = useToast();

    const handleSave = async (data: ExceptionalIncome) => {
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
        if(confirm('هل أنت متأكد من حذف هذا السجل؟')) {
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
      <PageHeader title="الدخل الاستثنائي">
        <AddEntityDialog
            title="إضافة دخل استثنائي"
            description="سجل أي دخل لا يتعلق بعمليات البيع المباشرة."
            triggerButton={
                <Button size="sm" className="gap-1">
                    <PlusCircle className="h-4 w-4" />
                    إضافة دخل
                </Button>
            }
        >
            <IncomeForm onSave={handleSave} onClose={()=>{}} />
        </AddEntityDialog>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
            <CardHeader>
                <CardTitle>سجل الدخل الاستثنائي</CardTitle>
                <CardDescription>عرض وتعديل جميع سجلات الدخل الاستثنائي.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>التاريخ</TableHead>
                                <TableHead>الوصف</TableHead>
                                <TableHead>المبلغ</TableHead>
                                <TableHead><span className="sr-only">الإجراءات</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {incomes.map(income => (
                                <TableRow key={income.id}>
                                    <TableCell>{new Date(income.date).toLocaleDateString('ar-EG')}</TableCell>
                                    <TableCell>{income.description}</TableCell>
                                    <TableCell>{income.amount.toLocaleString()}</TableCell>
                                    <TableCell>
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
                                                    title="تعديل الدخل"
                                                    description="تحديث تفاصيل سجل الدخل."
                                                    triggerButton={
                                                        <DropdownMenuItem onSelect={e => e.preventDefault()}>
                                                            <Edit className="ml-2 h-4 w-4" />
                                                            تعديل
                                                        </DropdownMenuItem>
                                                    }
                                                >
                                                    <IncomeForm income={income} onSave={handleSave} onClose={() => {}} />
                                                </AddEntityDialog>
                                                 <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(income.id!)}>
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
                )}
            </CardContent>
        </Card>
      </main>
    </>
  );
}
