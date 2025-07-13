

"use client";

import React, { useState } from "react";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal, Edit, Trash2, Loader2, Landmark, Wallet, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddEntityDialog } from "@/components/add-entity-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import useFirebase from "@/hooks/use-firebase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface CashAccount {
  id?: string;
  name: string;
  type: 'cash' | 'bank';
  openingBalance: number;
  salesRepId?: string; // To link to a sales rep
}
interface SalesRep {
    id: string;
    name: string;
}

const CashAccountForm = ({ account, onSave, onClose }: { account?: CashAccount, onSave: (data: Omit<CashAccount, 'id'> & { id?: string }) => void, onClose: () => void }) => {
  const [formData, setFormData] = useState<Omit<CashAccount, 'id'>>(
    account || { name: "", type: "cash", openingBalance: 0 }
  );

  const handleSubmit = () => {
    onSave({
        ...account,
        ...formData,
        openingBalance: Number(formData.openingBalance),
    });
    onClose();
  };

  return (
    <>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="account-name" className="text-right">
            اسم الحساب
          </Label>
          <Input id="account-name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="col-span-3" required />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="account-type" className="text-right">
            النوع
          </Label>
          <Select value={formData.type} onValueChange={(value: CashAccount['type']) => setFormData({...formData, type: value})}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="اختر نوع الحساب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">خزينة</SelectItem>
              <SelectItem value="bank">حساب بنكي</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="opening-balance" className="text-right">
            رصيد افتتاحي
          </Label>
          <Input id="opening-balance" type="number" value={formData.openingBalance} onChange={(e) => setFormData({...formData, openingBalance: e.target.value as any})} className="col-span-3" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSubmit}>حفظ الحساب</Button>
      </div>
    </>
  );
};


export default function CashAccountsPage() {
    const { data: accounts, loading: loadingAccounts, add, update, remove } = useFirebase<CashAccount>("cashAccounts");
    const { data: salesReps, loading: loadingReps } = useFirebase<SalesRep>("users"); // Fetch users to get rep names
    const { toast } = useToast();
    
    const loading = loadingAccounts || loadingReps;

    const handleSave = async (account: Omit<CashAccount, 'id'> & { id?: string }) => {
        try {
            if (account.salesRepId) {
                toast({ variant: "destructive", title: "غير مسموح", description: "لا يمكن تعديل خزينة المندوب من هنا." });
                return;
            }
            if (account.id) {
                await update(account.id, account);
                toast({ title: "تم التحديث بنجاح" });
            } else {
                await add(account);
                toast({ title: "تمت الإضافة بنجاح" });
            }
        } catch (e) {
             toast({ variant: "destructive", title: "خطأ", description: "فشل حفظ الحساب." });
        }
    };

    const handleDelete = (account: CashAccount) => {
        if (account.salesRepId) {
             toast({ variant: "destructive", title: "غير مسموح", description: "لا يمكن حذف خزينة مندوب. يرجى إلغاء تعيين المستخدم كمندوب أولاً." });
             return;
        }
        if (confirm("هل أنت متأكد من حذف هذا الحساب؟")) {
            remove(account.id!);
        }
    };
    
    const getTypeAndOwner = (account: CashAccount) => {
        const typeIcon = account.type === 'bank' ? <Landmark className="h-5 w-5 text-muted-foreground" /> : <Wallet className="h-5 w-5 text-muted-foreground" />;
        const repName = account.salesRepId ? salesReps.find(r => r.id === account.salesRepId)?.name : null;
        
        return (
            <div className="flex flex-col items-center gap-1">
                {typeIcon}
                {repName && <Badge variant="secondary" className="flex items-center gap-1"><User className="h-3 w-3"/>مندوب</Badge>}
            </div>
        )
    }

  return (
    <>
      <PageHeader title="إدارة الخزائن والبنوك">
        <AddEntityDialog
          title="إضافة حساب جديد"
          description="أدخل تفاصيل الخزينة أو الحساب البنكي. لإضافة خزينة مندوب، يرجى تحديد المستخدم كمندوب في شاشة المستخدمين."
          triggerButton={
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              إضافة حساب
            </Button>
          }
        >
          <CashAccountForm onSave={handleSave} onClose={() => {}} />
        </AddEntityDialog>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>الخزائن والحسابات البنكية</CardTitle>
            <CardDescription>
              إدارة جميع حساباتك النقدية من خزائن وبنوك وأرصدتها، بما في ذلك خزائن المناديب.
            </CardDescription>
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
                                <TableHead className="w-[80px] text-center">النوع</TableHead>
                                <TableHead>اسم الحساب</TableHead>
                                <TableHead className="text-center">الرصيد الافتتاحي</TableHead>
                                <TableHead className="text-center w-[100px]">الإجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {accounts.map((account) => (
                                <TableRow key={account.id} className={account.salesRepId ? 'bg-muted/30' : ''}>
                                    <TableCell className="text-center">{getTypeAndOwner(account)}</TableCell>
                                    <TableCell className="font-medium">{account.name}</TableCell>
                                    <TableCell className="text-center">{account.openingBalance.toLocaleString()}</TableCell>
                                    <TableCell className="text-center">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">تبديل القائمة</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                                            <AddEntityDialog
                                                title="تعديل الحساب"
                                                description="قم بتحديث تفاصيل الحساب هنا."
                                                triggerButton={
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={!!account.salesRepId}>
                                                    <Edit className="ml-2 h-4 w-4" />
                                                    تعديل
                                                    </DropdownMenuItem>
                                                }
                                            >
                                            <CashAccountForm account={account} onSave={handleSave} onClose={()=>{}} />
                                            </AddEntityDialog>
                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(account)} disabled={!!account.salesRepId}>
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
      </main>
    </>
  );
}
