
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Expense {
    id?: string;
    date: string;
    amount: number;
    description: string;
    warehouseId?: string;
}

interface Warehouse {
    id: string;
    name: string;
}

const ExpenseForm = ({ expense, onSave, onClose, warehouses }: { expense?: Expense, onSave: (data: Expense) => void, onClose: () => void, warehouses: Warehouse[] }) => {
    const [formData, setFormData] = useState<Omit<Expense, 'id'>>(
        expense || { date: new Date().toISOString().split('T')[0], amount: 0, description: "" }
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, amount: Number(formData.amount) });
        if (!expense) { // Clear form only if adding new
            setFormData({ date: new Date().toISOString().split('T')[0], amount: 0, description: "" });
        }
        onClose();
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="expense-date" className="text-right">التاريخ</Label>
                    <Input id="expense-date" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="col-span-3" required/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="expense-amount" className="text-right">المبلغ</Label>
                    <Input id="expense-amount" type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value as any})} className="col-span-3" placeholder="أدخل مبلغ المصروف" required/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="expense-description" className="text-right">الوصف</Label>
                    <Textarea id="expense-description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="col-span-3" placeholder="أدخل وصفًا للمصروف" required/>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="expense-warehouse" className="text-right">تحميل على</Label>
                    <Select value={formData.warehouseId} onValueChange={v => setFormData({...formData, warehouseId: v})}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="اختياري: اختر مخزنًا" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">بدون (عام)</SelectItem>
                            {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex justify-end">
                <Button type="submit">
                    <PlusCircle className="ml-2 h-4 w-4" />
                    حفظ المصروف
                </Button>
            </div>
        </form>
    );
};

export default function ExpensesPage() {
    const { data: expenses, loading: loadingExpenses, add, update, remove } = useFirebase<Expense>('expenses');
    const { data: warehouses, loading: loadingWarehouses } = useFirebase<Warehouse>('warehouses');
    const { toast } = useToast();
    
    const loading = loadingExpenses || loadingWarehouses;

     const getWarehouseName = (warehouseId?: string) => {
        if (!warehouseId || warehouseId === 'none') return 'عام';
        return warehouses.find(w => w.id === warehouseId)?.name || 'غير معروف';
    };

    const handleSave = async (data: Expense) => {
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
      <PageHeader title="إدارة المصروفات" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>إضافة مصروف جديد</CardTitle>
                <CardDescription>
                سجل المصروفات وقم بتحميلها على المخازن إن أمكن.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ExpenseForm onSave={handleSave} onClose={()=>{}} warehouses={warehouses} />
            </CardContent>
            </Card>
            
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>سجل المصروفات</CardTitle>
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
                                        <TableHead>الوصف</TableHead>
                                        <TableHead>المخزن/الجهة</TableHead>
                                        <TableHead className="text-center w-[150px]">المبلغ</TableHead>
                                        <TableHead className="text-center w-[100px]">الإجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expenses.map(expense => (
                                        <TableRow key={expense.id}>
                                            <TableCell>{new Date(expense.date).toLocaleDateString('ar-EG')}</TableCell>
                                            <TableCell>{expense.description}</TableCell>
                                            <TableCell>{getWarehouseName(expense.warehouseId)}</TableCell>
                                            <TableCell className="text-center">{expense.amount.toLocaleString()}</TableCell>
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
                                                            title="تعديل المصروف"
                                                            description="تحديث تفاصيل المصروف."
                                                            triggerButton={
                                                                <DropdownMenuItem onSelect={e => e.preventDefault()}>
                                                                    <Edit className="ml-2 h-4 w-4" />
                                                                    تعديل
                                                                </DropdownMenuItem>
                                                            }
                                                        >
                                                            <ExpenseForm expense={expense} onSave={handleSave} onClose={() => {}} warehouses={warehouses} />
                                                        </AddEntityDialog>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(expense.id!)}>
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
