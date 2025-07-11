
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
import { usePermissions } from "@/contexts/permissions-context";


interface User {
  id?: string;
  name: string;
  loginName: string;
  password?: string; // Optional for security reasons when fetching/displaying
  role: string;
  warehouse: string; // Can be an ID or "all"
}

interface Warehouse {
  id: string;
  name: string;
}

const UserForm = ({ user, onSave, onClose, warehouses, roles }: { user?: User, onSave: (data: Omit<User, 'id'> & { id?: string }) => void, onClose: () => void, warehouses: Warehouse[], roles: any }) => {
  const [formData, setFormData] = useState(user || { name: "", loginName: "", password: "", role: "محاسب", warehouse: "" });

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
            الاسم الكامل
          </Label>
          <Input id="user-name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="user-loginName" className="text-right">
            اسم الدخول
          </Label>
          <Input id="user-loginName" value={formData.loginName} onChange={e => setFormData({...formData, loginName: e.target.value})} className="col-span-3" />
        </div>
         <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="user-password" className="text-right">
            كلمة المرور
          </Label>
          <Input id="user-password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="col-span-3" placeholder={user ? "اتركه فارغاً لعدم التغيير" : ""} />
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
              {Object.keys(roles).map(role => (
                <SelectItem key={role} value={role}>{role}</SelectItem>
              ))}
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
              <SelectItem value="all">كل المخازن</SelectItem>
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
              ))}
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
  const { data: warehouses, loading: loadingWarehouses } = useFirebase<Warehouse>('warehouses');
  const { data: roles, loading: loadingRoles } = useFirebase<any>('roles');
  const { toast } = useToast();
  const { can } = usePermissions();
  const moduleName = 'settings_users';

  const handleSave = async (user: Omit<User, 'id'> & { id?: string }) => {
    try {
        if (user.id) {
            if (!can('edit', moduleName)) return toast({variant: 'destructive', title: 'غير مصرح به'});
            await update(user.id, user);
            toast({ title: "تم تحديث المستخدم بنجاح" });
        } else {
             if (!can('add', moduleName)) return toast({variant: 'destructive', title: 'غير مصرح به'});
            await add(user);
            toast({ title: "تمت إضافة المستخدم بنجاح" });
        }
    } catch(error) {
        toast({ variant: "destructive", title: "خطأ", description: "فشل حفظ المستخدم." });
    }
  }

  const handleDelete = async (id: string) => {
    if(!can('delete', moduleName)) return toast({variant: 'destructive', title: 'غير مصرح به'});
    if(confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
        try {
            await remove(id);
            toast({ title: "تم حذف المستخدم" });
        } catch(error) {
            toast({ variant: "destructive", title: "خطأ", description: "فشل حذف المستخدم." });
        }
    }
  }

  const getWarehouseName = (warehouseId: string) => {
    if (warehouseId === 'all') return 'كل المخازن';
    return warehouses.find(w => w.id === warehouseId)?.name || 'غير معروف';
  }

  return (
    <>
      <PageHeader title="إدارة المستخدمين">
        {can('add', moduleName) && (
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
            <UserForm onSave={handleSave} onClose={()=>{}} warehouses={warehouses} roles={roles} />
          </AddEntityDialog>
        )}
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
            {loading || loadingWarehouses || loadingRoles ? (
                 <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>المستخدم</TableHead>
                    <TableHead>اسم الدخول</TableHead>
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
                            </div>
                        </div>
                        </TableCell>
                        <TableCell className="font-mono">{user.loginName}</TableCell>
                        <TableCell className="text-center">
                        <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>{getWarehouseName(user.warehouse)}</TableCell>
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
                            {can('edit', moduleName) && (
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
                              <UserForm user={user} onSave={handleSave} onClose={()=>{}} warehouses={warehouses} roles={roles} />
                              </AddEntityDialog>
                            )}
                            {can('delete', moduleName) && (
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(user.id!)}>
                                  <Trash2 className="ml-2 h-4 w-4" />
                                  حذف
                              </DropdownMenuItem>
                            )}
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
