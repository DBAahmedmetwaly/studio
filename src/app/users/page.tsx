"use client";

import React, { useState } from "react";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreHorizontal, PlusCircle, Edit, Trash2, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { AddEntityDialog } from "@/components/add-entity-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useFirebase from "@/hooks/use-firebase";
import { useToast } from "@/hooks/use-toast";

interface User {
  id?: string;
  name: string;
  email: string;
  role: string;
  warehouse: string;
}

const UserForm = ({ user, onSave, onClose }: { user?: User, onSave: (data: Omit<User, 'id'> & { id?: string }) => void, onClose: () => void }) => {
  const [formData, setFormData] = useState(user || { name: "", email: "", role: "محاسب", warehouse: "" });

  const handleSubmit = () => {
    onSave({
        ...user,
        ...formData,
    });
    onClose();
  };
  
  return (
    <>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="user-name" className="text-right">
            الاسم
          </Label>
          <Input id="user-name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="user-email" className="text-right">
            البريد الإلكتروني
          </Label>
          <Input id="user-email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="user-role" className="text-right">
            الدور
          </Label>
          <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="اختر دورًا" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="مسؤول">مسؤول</SelectItem>
              <SelectItem value="محاسب">محاسب</SelectItem>
              <SelectItem value="أمين مخزن">أمين مخزن</SelectItem>
              <SelectItem value="أمين صندوق">أمين صندوق</SelectItem>
            </SelectContent>
          </Select>
        </div>
          <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="user-warehouse" className="text-right">
            المخزن
          </Label>
            <Select value={formData.warehouse} onValueChange={(value) => setFormData({...formData, warehouse: value})}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="اختر مخزنًا" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="المخزن الرئيسي - القاهرة">المخزن الرئيسي - القاهرة</SelectItem>
              <SelectItem value="مخزن الإسكندرية">مخزن الإسكندرية</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
       <div className="flex justify-end">
        <Button onClick={handleSubmit}>حفظ</Button>
      </div>
    </>
  );
};

export default function UsersPage() {
  const { data: users, loading, add, update, remove } = useFirebase<User>('users');
  const { toast } = useToast();

  const handleSave = async (user: Omit<User, 'id'> & { id?: string }) => {
    try {
        if (user.id) {
            await update(user.id, user);
            toast({ title: "تم تحديث المستخدم بنجاح" });
        } else {
            await add(user);
            toast({ title: "تمت إضافة المستخدم بنجاح" });
        }
    } catch(error) {
        toast({ variant: "destructive", title: "خطأ", description: "فشل حفظ المستخدم." });
    }
  }

  const handleDelete = async (id: string) => {
    if(confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
        try {
            await remove(id);
            toast({ title: "تم حذف المستخدم" });
        } catch(error) {
            toast({ variant: "destructive", title: "خطأ", description: "فشل حذف المستخدم." });
        }
    }
  }

  return (
    <>
      <PageHeader title="إدارة المستخدمين">
        <AddEntityDialog
          title="إضافة مستخدم جديد"
          description="أدخل تفاصيل المستخدم الجديد وصلاحياته."
          triggerButton={
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              إضافة مستخدم
            </Button>
          }
        >
          <UserForm onSave={handleSave} onClose={()=>{}} />
        </AddEntityDialog>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>المستخدمون</CardTitle>
            <CardDescription>
              إدارة المستخدمين وأدوارهم في النظام.
            </CardDescription>
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
                    <TableHead>المستخدم</TableHead>
                    <TableHead className="text-center">الدور</TableHead>
                    <TableHead>المخزن</TableHead>
                    <TableHead className="text-center w-[100px]">الإجراءات</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar className="hidden h-9 w-9 sm:flex">
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="font-medium">
                            <div>{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                        </div>
                        </TableCell>
                        <TableCell className="text-center">
                        <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>{user.warehouse}</TableCell>
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
                                title="تعديل المستخدم"
                                description="قم بتحديث تفاصيل المستخدم هنا."
                                triggerButton={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Edit className="ml-2 h-4 w-4" />
                                    تعديل
                                </DropdownMenuItem>
                                }
                            >
                            <UserForm user={user} onSave={handleSave} onClose={()=>{}}/>
                            </AddEntityDialog>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(user.id!)}>
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
