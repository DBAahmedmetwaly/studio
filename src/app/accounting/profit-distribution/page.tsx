
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
import { PlusCircle, Loader2, MoreHorizontal, Trash2, Info, User } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/auth-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useData } from '@/contexts/data-provider';


interface ProfitDistribution {
    id?: string;
    date: string;
    amount: number;
    partnerId: string;
    paidFromAccountId: string;
    notes?: string;
    receiptNumber?: string;
    createdById?: string;
    createdByName?: string;
}

interface Partner {
    id: string;
    name: string;
}

interface CashAccount {
    id: string;
    name: string;
}

const DistributionForm = ({ onSave, partners, cashAccounts }: { onSave: (data: Omit<ProfitDistribution, 'id' | 'receiptNumber'>) => void, partners: Partner[], cashAccounts: CashAccount[] }) => {
    const [formData, setFormData] = useState({ 
        date: new Date().toISOString().split('T')[0], 
        amount: 0, 
        partnerId: "", 
        paidFromAccountId: "", 
        notes: "" 
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, amount: Number(formData.amount) });
        setFormData({ date: new Date().toISOString().split('T')[0], amount: 0, partnerId: "", paidFromAccountId: "", notes: "" });
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                 <div className="space-y-2">
                    <Label htmlFor="dist-date">التاريخ</Label>
                    <Input id="dist-date" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required/>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="dist-partner">الشريك</Label>
                    <Select value={formData.partnerId} onValueChange={v => setFormData({...formData, partnerId: v})} required>
                        <SelectTrigger>
                            <SelectValue placeholder="اختر شريكًا" />
                        </SelectTrigger>
                        <SelectContent>
                            {partners.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="paid-from">مدفوع من</Label>
                    <Select value={formData.paidFromAccountId} onValueChange={v => setFormData({...formData, paidFromAccountId: v})} required>
                        <SelectTrigger>
                            <SelectValue placeholder="اختر حساب الدفع" />
                        </SelectTrigger>
                        <SelectContent>
                           {cashAccounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="dist-amount">المبلغ</Label>
                    <Input id="dist-amount" type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value as any})} placeholder="أدخل مبلغ التوزيع" required/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="dist-notes">ملاحظات</Label>
                    <Textarea id="dist-notes" value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="أدخل أي ملاحظات (اختياري)" />
                </div>
            </div>
             <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle>القيد المحاسبي المتوقع</AlertTitle>
                <AlertDescription>
                    من ح/ توزيعات أرباح - {partners.find(p => p.id === formData.partnerId)?.name || "الشريك"} (مدين) <br/>
                    إلى ح/ {cashAccounts.find(c => c.id === formData.paidFromAccountId)?.name || "النقدية"} (دائن)
                </AlertDescription>
            </Alert>
            <div className="flex justify-end mt-4">
                <Button type="submit">
                    <PlusCircle className="ml-2 h-4 w-4" />
                    حفظ التوزيع
                </Button>
            </div>
        </form>
    );
};

export default function ProfitDistributionPage() {
    const { 
        profitDistributions: distributions,
        partners,
        cashAccounts,
        dbAction,
        getNextId,
        loading
    } = useData();

    const { toast } = useToast();
    const { user } = useAuth();
    
    const getPartnerName = (partnerId: string) => partners.find(p => p.id === partnerId)?.name || 'غير معروف';
    const getCashAccountName = (accountId: string) => cashAccounts.find((acc: any) => acc.id === accountId)?.name || 'غير معروف';

    const handleSave = async (data: Omit<ProfitDistribution, 'id' | 'receiptNumber'>) => {
        try {
            const receiptNumber = `ت-أ-${await getNextId('profitDistribution')}`;
            const newDistribution: ProfitDistribution = {
                ...data,
                receiptNumber,
                createdById: user?.id,
                createdByName: user?.name,
            };
            await dbAction('profitDistributions', 'add', newDistribution);
            toast({ title: "تمت الإضافة بنجاح", description: `تم حفظ التوزيع برقم إيصال: ${receiptNumber}` });
        } catch (error) {
            toast({ variant: "destructive", title: "حدث خطأ", description: "فشل الحفظ" });
        }
    };
    
    const handleDelete = async (id: string) => {
        try {
            await dbAction('profitDistributions', 'remove', { id });
            toast({ title: "تم الحذف بنجاح" });
        } catch (error) {
            toast({ variant: "destructive", title: "حدث خطأ", description: "فشل الحذف" });
        }
    };


  return (
    <>
      <PageHeader title="توزيعات أرباح الشركاء" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>تسجيل عملية توزيع جديدة</CardTitle>
                <CardDescription>
                سجل المبالغ المسحوبة من قبل الشركاء كتوزيعات من الأرباح.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <DistributionForm onSave={handleSave} partners={partners} cashAccounts={cashAccounts} />
            </CardContent>
            </Card>
            
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>سجل التوزيعات</CardTitle>
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
                                        <TableHead>الشريك</TableHead>
                                        <TableHead>مدفوعة من</TableHead>
                                        <TableHead className="text-center">المبلغ</TableHead>
                                        <TableHead className="text-center w-[100px]">الإجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {distributions.map((dist : ProfitDistribution) => (
                                        <TableRow key={dist.id}>
                                            <TableCell>
                                                <div className="font-medium flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    {getPartnerName(dist.partnerId)}
                                                </div>
                                                <div className="text-sm text-muted-foreground">{new Date(dist.date).toLocaleDateString('ar-EG')}</div>
                                                <div className="text-xs text-muted-foreground">بواسطة: {dist.createdByName || 'غير معروف'}</div>
                                            </TableCell>
                                            <TableCell>{getCashAccountName(dist.paidFromAccountId)}</TableCell>
                                            <TableCell className="text-center">{dist.amount.toLocaleString()}</TableCell>
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
                                                                هذا الإجراء سيحذف سجل التوزيع بشكل دائم. لا يمكن التراجع عن هذا الإجراء.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(dist.id!)}>متابعة</AlertDialogAction>
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
