

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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/auth-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


const EXPENSE_TYPES = [
    "إيجار", "رواتب", "كهرباء ومياه", "مواصلات", "تسويق وإعلان", "صيانة", "مستلزمات مكتبية", "مصروفات حكومية", "أخرى"
];


interface Expense {
    id?: string;
    date: string;
    amount: number;
    description: string;
    warehouseId?: string;
    expenseType: string;
    paidFromAccountId: string;
    receiptNumber?: string;
    createdById?: string;
    createdByName?: string;
}

interface Warehouse {
    id: string;
    name: string;
}

interface CashAccount {
    id: string;
    name: string;
}

const ExpenseForm = ({ expense, onSave, onClose, warehouses, cashAccounts }: { expense?: Expense, onSave: (data: Omit<Expense, 'id'|'receiptNumber'>) => void, onClose: () => void, warehouses: Warehouse[], cashAccounts: CashAccount[] }) => {
    const [formData, setFormData] = useState<Omit<Expense, 'id'|'receiptNumber'>>(
        expense || { date: new Date().toISOString().split('T')[0], amount: 0, description: "", expenseType: "", paidFromAccountId: "" }
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, amount: Number(formData.amount) });
        if (!expense) { // Clear form only if adding new
            setFormData({ date: new Date().toISOString().split('T')[0], amount: 0, description: "", expenseType: "", paidFromAccountId: "" });
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
                    <Label htmlFor="expense-type" className="text-right">نوع المصروف</Label>
                    <Select value={formData.expenseType} onValueChange={v => setFormData({...formData, expenseType: v})} required>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="اختر نوع المصروف" />
                        </SelectTrigger>
                        <SelectContent>
                            {EXPENSE_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                        </SelectContent>
                    </Select>
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
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="paid-from" className="text-right">مدفوع من</Label>
                    <Select value={formData.paidFromAccountId} onValueChange={v => setFormData({...formData, paidFromAccountId: v})} required>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="اختر حساب الدفع" />
                        </SelectTrigger>
                        <SelectContent>
                           {cashAccounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle>القيد المحاسبي المتوقع</AlertTitle>
                <AlertDescription>
                    من ح/ {formData.expenseType || "المصروفات"} (مدين) <br/>
                    إلى ح/ {cashAccounts.find(c => c.id === formData.paidFromAccountId)?.name || "النقدية"} (دائن)
                </AlertDescription>
            </Alert>
            <div className="flex justify-end mt-4">
                <Button type="submit">
                    <PlusCircle className="ml-2 h-4 w-4" />
                    حفظ المصروف
                </Button>
            </div>
        </form>
    );
};

export default function ExpensesPage() {
    const { data: expenses, loading: loadingExpenses, add, update, remove, getNextId } = useFirebase<Expense>('expenses');
    const { data: warehouses, loading: loadingWarehouses } = useFirebase<Warehouse>('warehouses');
    const { data: cashAccounts, loading: loadingCashAccounts } = useFirebase<CashAccount>('cashAccounts');
    const { toast } = useToast();
    const { user } = useAuth();
    
    const loading = loadingExpenses || loadingWarehouses || loadingCashAccounts;

     const getWarehouseName = (warehouseId?: string) => {
        if (!warehouseId || warehouseId === 'none') return 'عام';
        return warehouses.find(w => w.id === warehouseId)?.name || 'غير معروف';
    };
    
    const getCashAccountName = (accountId: string) => {
        return cashAccounts.find(acc => acc.id === accountId)?.name || 'غير معروف';
    }


    const handleSave = async (data: Omit<Expense, 'id' | 'receiptNumber'>) => {
        try {
            const receiptNumber = `م-${await getNextId('expense')}`;
            const newExpense: Expense = {
                ...data,
                receiptNumber,
                createdById: user?.id,
                createdByName: user?.name,
            };
            await add(newExpense);
            toast({ title: "تمت الإضافة بنجاح", description: `تم تسجيل المصروف برقم إيصال: ${receiptNumber}` });
        } catch (error) {
            toast({ variant: "destructive", title: "حدث خطأ", description: "فشل الحفظ" });
        }
    };
    
    const handleDelete = async (id: string) => {
        try {
            await remove(id);
            toast({ title: "تم الحذف بنجاح" });
        } catch (error) {
            toast({ variant: "destructive", title: "حدث خطأ", description: "فشل الحذف" });
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
                سجل المصروفات وصنفها وقم بتحميلها على المخازن إن أمكن.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ExpenseForm onSave={handleSave} onClose={()=>{}} warehouses={warehouses} cashAccounts={cashAccounts} />
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
                        <div className="w-full overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>النوع</TableHead>
                                        <TableHead className="hidden sm:table-cell">الوصف</TableHead>
                                        <TableHead className="hidden md:table-cell">مدفوع من</TableHead>
                                        <TableHead className="text-center">المبلغ</TableHead>
                                        <TableHead className="text-center w-[100px]">الإجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expenses.map((expense: Expense) => (
                                        <TableRow key={expense.id}>
                                            <TableCell>
                                                <div className="font-medium">{expense.expenseType}</div>
                                                <div className="text-sm text-muted-foreground">{new Date(expense.date).toLocaleDateString('ar-EG')}</div>
                                                <div className="text-xs text-muted-foreground">بواسطة: {expense.createdByName || 'غير معروف'}</div>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">{expense.description}</TableCell>
                                            <TableCell className="hidden md:table-cell">{getCashAccountName(expense.paidFromAccountId)}</TableCell>
                                            <TableCell className="text-center">{expense.amount.toLocaleString()}</TableCell>
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
                                                                هذا الإجراء سيحذف السجل بشكل دائم. لا يمكن التراجع عن هذا الإجراء.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(expense.id!)}>متابعة</AlertDialogAction>
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
