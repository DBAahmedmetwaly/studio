

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
import { PlusCircle, Loader2, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import useFirebase from '@/hooks/use-firebase';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddEntityDialog } from '@/components/add-entity-dialog';
import { usePermissions } from '@/contexts/permissions-context';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/auth-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


interface EmployeeAdvance {
    id?: string;
    date: string;
    amount: number;
    employeeId: string;
    paidFromAccountId: string;
    notes?: string;
    receiptNumber?: string;
    createdById?: string;
    createdByName?: string;
}

interface Employee {
    id: string;
    name: string;
}

interface CashAccount {
    id: string;
    name: string;
}

const AdvanceForm = ({ advance, onSave, onClose, employees, cashAccounts }: { advance?: EmployeeAdvance, onSave: (data: Omit<EmployeeAdvance, 'id' | 'receiptNumber'>) => void, onClose: () => void, employees: Employee[], cashAccounts: CashAccount[] }) => {
    const [formData, setFormData] = useState(
        advance || { date: new Date().toISOString().split('T')[0], amount: 0, employeeId: "", paidFromAccountId: "", notes: "" }
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, amount: Number(formData.amount) });
        if (!advance) { 
            setFormData({ date: new Date().toISOString().split('T')[0], amount: 0, employeeId: "", paidFromAccountId: "", notes: "" });
        }
        onClose();
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="advance-date" className="text-right">التاريخ</Label>
                    <Input id="advance-date" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="col-span-3" required/>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="advance-employee" className="text-right">الموظف</Label>
                    <Select value={formData.employeeId} onValueChange={v => setFormData({...formData, employeeId: v})} required>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="اختر موظفًا" />
                        </SelectTrigger>
                        <SelectContent>
                            {employees.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="advance-amount" className="text-right">المبلغ</Label>
                    <Input id="advance-amount" type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value as any})} className="col-span-3" placeholder="أدخل مبلغ السلفة" required/>
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
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="advance-notes" className="text-right">ملاحظات</Label>
                    <Textarea id="advance-notes" value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="col-span-3" placeholder="أدخل أي ملاحظات (اختياري)" />
                </div>
            </div>
            <div className="flex justify-end">
                <Button type="submit">
                    <PlusCircle className="ml-2 h-4 w-4" />
                    حفظ السلفة
                </Button>
            </div>
        </form>
    );
};

export default function EmployeeAdvancesPage() {
    const { data: advances, loading: loadingAdvances, add, update, remove, getNextId } = useFirebase<EmployeeAdvance>('employeeAdvances');
    const { data: employees, loading: loadingEmployees } = useFirebase<Employee>('employees');
    const { data: cashAccounts, loading: loadingCashAccounts } = useFirebase<CashAccount>('cashAccounts');
    const { toast } = useToast();
    const { can } = usePermissions();
    const { user } = useAuth();
    
    const loading = loadingAdvances || loadingEmployees || loadingCashAccounts;

     const getEmployeeName = (employeeId: string) => {
        return employees.find(s => s.id === employeeId)?.name || 'غير معروف';
    };

    const getCashAccountName = (accountId: string) => {
        return cashAccounts.find(acc => acc.id === accountId)?.name || 'غير معروف';
    }


    const handleSave = async (data: Omit<EmployeeAdvance, 'id' | 'receiptNumber'>) => {
        try {
            if (!can('add', 'hr')) return toast({ variant: "destructive", title: "غير مصرح به" });
            const receiptNumber = `س-م-${await getNextId('employeeAdvance')}`;
            const newAdvance: EmployeeAdvance = {
                ...data,
                receiptNumber,
                createdById: user?.id,
                createdByName: user?.name,
            };
            await add(newAdvance);
            toast({ title: "تمت الإضافة بنجاح", description: `تم حفظ السلفة برقم إيصال: ${receiptNumber}` });
        } catch (error) {
            toast({ variant: "destructive", title: "حدث خطأ", description: "فشل الحفظ" });
        }
    };
    
    const handleDelete = async (id: string) => {
        if(!can('delete', 'hr')) return toast({ variant: "destructive", title: "غير مصرح به" });
        try {
            await remove(id);
            toast({ title: "تم الحذف بنجاح" });
        } catch (error) {
            toast({ variant: "destructive", title: "حدث خطأ", description: "فشل الحذف" });
        }
    };


  return (
    <>
      <PageHeader title="سلف الموظفين">
        {can('add', 'hr') && (
            <AddEntityDialog
                title="إضافة سلفة جديدة"
                description="سجل دفعة مقدمة لأحد الموظفين."
                triggerButton={
                    <Button size="sm" className="gap-1">
                        <PlusCircle className="h-4 w-4" />
                        إضافة سلفة
                    </Button>
                }
            >
                <AdvanceForm onSave={handleSave} onClose={()=>{}} employees={employees} cashAccounts={cashAccounts} />
            </AddEntityDialog>
        )}
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
            <Card>
                <CardHeader>
                    <CardTitle>سجل السلف</CardTitle>
                    <CardDescription>عرض وتعديل جميع السلف المسجلة للموظفين.</CardDescription>
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
                                        <TableHead>التاريخ</TableHead>
                                        <TableHead>الموظف</TableHead>
                                        <TableHead>مدفوعة من</TableHead>
                                        <TableHead className="text-center w-[150px]">المبلغ</TableHead>
                                        <TableHead className="text-center w-[100px]">الإجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {advances.map((advance: EmployeeAdvance) => (
                                        <TableRow key={advance.id}>
                                            <TableCell>
                                                <div>{new Date(advance.date).toLocaleDateString('ar-EG')}</div>
                                                <div className="text-xs text-muted-foreground">بواسطة: {advance.createdByName || 'غير معروف'}</div>
                                            </TableCell>
                                            <TableCell>{getEmployeeName(advance.employeeId)}</TableCell>
                                            <TableCell>{getCashAccountName(advance.paidFromAccountId)}</TableCell>
                                            <TableCell className="text-center">{advance.amount.toLocaleString()}</TableCell>
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
                                                            {can('delete', 'hr') && (
                                                                <AlertDialogTrigger asChild>
                                                                    <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                                                        <Trash2 className="ml-2 h-4 w-4" />
                                                                        حذف
                                                                    </DropdownMenuItem>
                                                                </AlertDialogTrigger>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                هذا الإجراء سيحذف السلفة بشكل دائم. لا يمكن التراجع عن هذا الإجراء.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(advance.id!)}>متابعة</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {advances.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                                لا توجد سلف مسجلة.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
      </main>
    </>
  );
}
