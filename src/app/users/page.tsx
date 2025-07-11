
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
import { MoreHorizontal, PlusCircle, Edit, Trash2, Loader2, CheckCircle } from "lucide-react";
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
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Checkbox } from "@/components/ui/checkbox";


interface User {
  id?: string;
  uid?: string;
  name: string;
  loginName: string;
  password?: string;
  role: string;
  warehouse: string;
  isSalesRep?: boolean;
  isEmployee?: boolean;
  jobTitle?: string;
  basicSalary?: number;
  hireDate?: string;
}

interface Warehouse {
  id: string;
  name: string;
}

const UserForm = ({ user, onSave, onClose, warehouses, roles }: { user?: User, onSave: (data: Omit<User, 'id'> & { id?: string }) => void, onClose: () => void, warehouses: Warehouse[], roles: string[] }) => {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    loginName: user?.loginName || "",
    password: "", 
    role: user?.role || "",
    warehouse: user?.warehouse || "",
    isSalesRep: user?.isSalesRep || false,
    isEmployee: user?.isEmployee || false,
    jobTitle: user?.jobTitle || "",
    basicSalary: user?.basicSalary || 0,
    hireDate: user?.hireDate || new Date().toISOString().split('T')[0],
  });


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
          <Input id="user-loginName" type="text" value={formData.loginName} onChange={e => setFormData({...formData, loginName: e.target.value})} className="col-span-3" disabled={!!user?.id} />
        </div>
         <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="user-password" className="text-right">
            كلمة المرور
          </Label>
          <Input id="user-password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="col-span-3" placeholder={user ? "اتركه فارغاً لعدم التغيير" : ""} />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="user-role" className="text-right">
            الوظيفة
          </Label>
          <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="اختر وظيفة" />
            </SelectTrigger>
            <SelectContent>
              {roles.map(role => (
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
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="is-sales-rep" className="text-right">
                مندوب مبيعات
            </Label>
            <Checkbox id="is-sales-rep" checked={formData.isSalesRep} onCheckedChange={(checked) => setFormData({...formData, isSalesRep: !!checked})} />
        </div>
         <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="is-employee" className="text-right">
                موظف بالشركة
            </Label>
            <Checkbox id="is-employee" checked={formData.isEmployee} onCheckedChange={(checked) => setFormData({...formData, isEmployee: !!checked})} />
        </div>
        
        {formData.isEmployee && (
            <div className="col-span-4 space-y-4 pt-4 border-t">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="job-title" className="text-right">المسمى الوظيفي</Label>
                    <Input id="job-title" value={formData.jobTitle} onChange={e => setFormData({...formData, jobTitle: e.target.value})} className="col-span-3" required={formData.isEmployee} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="basic-salary" className="text-right">الراتب الأساسي</Label>
                    <Input id="basic-salary" type="number" value={formData.basicSalary} onChange={e => setFormData({...formData, basicSalary: Number(e.target.value)})} className="col-span-3" required={formData.isEmployee} />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="hire-date" className="text-right">تاريخ التعيين</Label>
                    <Input id="hire-date" type="date" value={formData.hireDate} onChange={e => setFormData({...formData, hireDate: e.target.value})} className="col-span-3" required={formData.isEmployee} />
                </div>
            </div>
        )}

      </div>
       <div className="flex justify-end">
        <Button onClick={handleSubmit}>حفظ</Button>
      </div>
    </>
  );
};

export default function UsersPage() {
  const { data: usersData, loading: loadingUsers, add, update, remove } = useFirebase<User>('users');
  const { add: addEmployee, update: updateEmployee } = useFirebase<any>('employees');
  const { data: warehouses, loading: loadingWarehouses } = useFirebase<Warehouse>('warehouses');
  const { data: rolesData, loading: loadingRoles } = useFirebase<any>('roles');
  const { toast } = useToast();
  const { can } = usePermissions();
  const moduleName = 'settings_users';
  
  const roleNames = rolesData ? Object.keys(rolesData) : [];
  const combinedLoading = loadingUsers || loadingWarehouses || loadingRoles;


  const handleSave = async (user: Omit<User, 'id'> & { id?: string }) => {
    try {
        if (user.id) {
            // This is an update
            if (!can('edit', moduleName)) return toast({variant: 'destructive', title: 'غير مصرح به'});
            const { id, ...dataToUpdate } = user;
            await update(id, dataToUpdate);
             if (user.isEmployee) {
                await updateEmployee(id, {
                    name: user.name,
                    jobTitle: user.jobTitle,
                    basicSalary: user.basicSalary,
                    hireDate: user.hireDate
                });
            }
            toast({ title: "تم تحديث المستخدم بنجاح" });
        } else {
            // This is a new user
            if (!can('add', moduleName)) return toast({variant: 'destructive', title: 'غير مصرح به'});
            if (!user.password || !user.loginName) {
                 toast({ variant: "destructive", title: "خطأ", description: "اسم الدخول وكلمة المرور مطلوبان للمستخدم الجديد." });
                 return;
            }
            
            const email = `${user.loginName}@admin.com`;
            
            const userDataForDb = { 
                name: user.name,
                loginName: user.loginName,
                role: user.role,
                warehouse: user.warehouse,
                isSalesRep: user.isSalesRep,
             };
            
            const newUserKey = await add(userDataForDb);

            if (!newUserKey) {
                throw new Error("Failed to get new user key from database.");
            }
            
             // Create employee record if applicable
            if (user.isEmployee) {
                await addEmployee({
                    id: newUserKey, // Use the same key for employee record
                    name: user.name,
                    jobTitle: user.jobTitle,
                    basicSalary: user.basicSalary,
                    hireDate: user.hireDate
                });
            }

            // Step 2: Create the user in Firebase Auth.
            const userCredential = await createUserWithEmailAndPassword(auth, email, user.password);
            const authUser = userCredential.user;
            
            // Step 3: Update the newly created database record with the auth UID.
            await update(newUserKey, { uid: authUser.uid });

            toast({ title: "تمت إضافة المستخدم بنجاح" });
        }
    } catch(error: any) {
        if (error.code === 'auth/email-already-in-use') {
            toast({ variant: "destructive", title: "خطأ", description: "اسم الدخول هذا مستخدم بالفعل." });
        } else if (error.code === 'auth/weak-password') {
            toast({ variant: "destructive", title: "خطأ", description: "كلمة المرور ضعيفة جداً. يجب أن تكون 6 أحرف على الأقل." });
        } else {
            toast({ variant: "destructive", title: "خطأ", description: "فشل حفظ المستخدم." });
        }
        console.error("User save failed:", error);
    }
  }

  const handleDelete = async (userToDelete: User) => {
    if (!can('delete', moduleName)) {
      toast({ variant: 'destructive', title: 'غير مصرح به' });
      return;
    }
    
    if (!userToDelete.id) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'معرف المستخدم غير موجود.' });
      return;
    }

    if (confirm(`هل أنت متأكد من حذف المستخدم "${userToDelete.name}"؟`)) {
      try {
        await remove(userToDelete.id);
        toast({ title: "تم حذف المستخدم بنجاح" });
      } catch (error) {
        console.error("Failed to delete user:", error);
        toast({ variant: "destructive", title: "خطأ", description: "فشل حذف المستخدم." });
      }
    }
  };


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
              <Button size="sm" className="gap-1" disabled={combinedLoading}>
                 {combinedLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                إضافة مستخدم
              </Button>
            }
          >
            <UserForm onSave={handleSave} onClose={()=>{}} warehouses={warehouses} roles={roleNames} />
          </AddEntityDialog>
        )}
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>المستخدمون</CardTitle>
            <CardDescription>
              إدارة المستخدمين ووظائفهم في النظام.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {combinedLoading ? (
                 <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>المستخدم</TableHead>
                    <TableHead>اسم الدخول</TableHead>
                    <TableHead className="text-center">مندوب</TableHead>
                    <TableHead className="text-center">الوظيفة</TableHead>
                    <TableHead>المخزن</TableHead>
                    <TableHead className="text-center w-[100px]">الإجراءات</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {usersData.map((user) => (
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
                            {user.isSalesRep && <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />}
                        </TableCell>
                        <TableCell className="text-center">
                        <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>{getWarehouseName(user.warehouse)}</TableCell>
                        <TableCell className="text-center">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" disabled={combinedLoading}>
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
                              <UserForm user={user} onSave={handleSave} onClose={()=>{}} warehouses={warehouses} roles={roleNames} />
                              </AddEntityDialog>
                            )}
                            {can('delete', moduleName) && (
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(user)}>
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
