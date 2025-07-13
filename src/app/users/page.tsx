

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
import { createUserWithEmailAndPassword, signInWithCredential, EmailAuthProvider } from "firebase/auth";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";


interface User {
  id?: string;
  uid?: string;
  name: string;
  loginName: string;
  password?: string;
  role: string;
  warehouse: string;
  phone?: string;
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
    phone: user?.phone || "",
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
      <div className="space-y-4 py-2 pb-4">
        {/* Account Information */}
        <div className="space-y-2">
            <h4 className="font-medium text-sm">معلومات الحساب</h4>
            <Separator />
        </div>
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="user-name">الاسم الكامل</Label>
                <Input id="user-name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="user-loginName">اسم الدخول</Label>
                    <Input id="user-loginName" type="text" value={formData.loginName} onChange={e => setFormData({...formData, loginName: e.target.value})} disabled={!!user?.id} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="user-password">كلمة المرور</Label>
                    <Input id="user-password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder={user ? "اتركه فارغاً لعدم التغيير" : ""} />
                </div>
            </div>
        </div>
        
        {/* Permissions and Access */}
         <div className="space-y-2 pt-4">
            <h4 className="font-medium text-sm">الصلاحيات والوصول</h4>
            <Separator />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="user-role">الوظيفة</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                    <SelectTrigger><SelectValue placeholder="اختر وظيفة" /></SelectTrigger>
                    <SelectContent>
                        {roles.map(role => (<SelectItem key={role} value={role}>{role}</SelectItem>))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="user-warehouse">المخزن المرتبط</Label>
                <Select value={formData.warehouse} onValueChange={(value) => setFormData({...formData, warehouse: value})}>
                    <SelectTrigger><SelectValue placeholder="اختر مخزنًا" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">كل المخازن</SelectItem>
                        {warehouses.map((w) => (<SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>))}
                    </SelectContent>
                </Select>
            </div>
        </div>
        
        {/* Additional Classifications */}
        <div className="space-y-2 pt-4">
            <h4 className="font-medium text-sm">تصنيفات إضافية</h4>
            <Separator />
        </div>
        <div className="flex items-center space-x-4">
             <div className="flex items-center space-x-2">
                <Checkbox id="is-sales-rep" checked={formData.isSalesRep} onCheckedChange={(checked) => setFormData({...formData, isSalesRep: !!checked})} />
                <Label htmlFor="is-sales-rep" className="cursor-pointer">مندوب مبيعات</Label>
            </div>
             <div className="flex items-center space-x-2">
                <Checkbox id="is-employee" checked={formData.isEmployee} onCheckedChange={(checked) => setFormData({...formData, isEmployee: !!checked})} />
                <Label htmlFor="is-employee" className="cursor-pointer">موظف بالشركة</Label>
            </div>
        </div>
        
        {/* Employee Information */}
        {formData.isEmployee && (
            <div className="space-y-4 pt-4">
                 <div className="space-y-2">
                    <h4 className="font-medium text-sm">بيانات الموظف</h4>
                    <Separator />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="job-title">المسمى الوظيفي</Label>
                        <Input id="job-title" value={formData.jobTitle} onChange={e => setFormData({...formData, jobTitle: e.target.value})} required={formData.isEmployee} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="employee-phone">رقم الهاتف</Label>
                        <Input id="employee-phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="basic-salary">الراتب الأساسي</Label>
                        <Input id="basic-salary" type="number" value={formData.basicSalary} onChange={e => setFormData({...formData, basicSalary: Number(e.target.value)})} required={formData.isEmployee} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="hire-date">تاريخ التعيين</Label>
                        <Input id="hire-date" type="date" value={formData.hireDate} onChange={e => setFormData({...formData, hireDate: e.target.value})} required={formData.isEmployee} />
                    </div>
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
  const { add: addEmployee, update: updateEmployee, remove: removeEmployee } = useFirebase<any>('employees');
  const { data: cashAccountsData, add: addCashAccount, remove: removeCashAccount } = useFirebase<any>('cashAccounts');
  const { data: warehouses, loading: loadingWarehouses } = useFirebase<Warehouse>('warehouses');
  const { data: rolesData, loading: loadingRoles } = useFirebase<any>('roles');
  const { toast } = useToast();
  const { can } = usePermissions();
  const moduleName = 'settings_users';
  
  const roleNames = rolesData ? Object.keys(rolesData) : [];
  const combinedLoading = loadingUsers || loadingWarehouses || loadingRoles;


  const handleSave = async (user: Omit<User, 'id'> & { id?: string }) => {
    try {
        const userId = user.id;
        if (userId) { // This is an update
            if (!can('edit', moduleName)) return toast({variant: 'destructive', title: 'غير مصرح به'});
            const { id, ...dataToUpdate } = user;
            await update(id, dataToUpdate);
            
            // Sync employee data
            if (user.isEmployee) {
                await updateEmployee(id, { name: user.name, jobTitle: user.jobTitle, basicSalary: user.basicSalary, hireDate: user.hireDate, phone: user.phone });
            } else {
                await removeEmployee(id);
            }
            
            // Sync sales rep cash account
            const existingCashAccount = cashAccountsData.find((acc: any) => acc.salesRepId === id);
            if (user.isSalesRep && !existingCashAccount) {
                 await addCashAccount({ name: `خزينة المندوب: ${user.name}`, type: 'cash', openingBalance: 0, salesRepId: id });
            } else if (!user.isSalesRep && existingCashAccount) {
                await removeCashAccount(existingCashAccount.id);
            }

            toast({ title: "تم تحديث المستخدم بنجاح" });
        } else { // This is a new user
            if (!can('add', moduleName)) return toast({variant: 'destructive', title: 'غير مصرح به'});
            if (!user.password || !user.loginName) return toast({ variant: "destructive", title: "خطأ", description: "اسم الدخول وكلمة المرور مطلوبان للمستخدم الجديد." });
            
            const email = `${user.loginName}@admin.com`;
            const currentUser = auth.currentUser;
            if (!currentUser || !currentUser.email) return toast({ variant: "destructive", title: "خطأ", description: "لا يوجد مستخدم حالي مسجل. يرجى إعادة تسجيل الدخول." });

            const userCredential = await createUserWithEmailAndPassword(auth, email, user.password);
            const newAuthUser = userCredential.user;

            const adminPassword = prompt("لأسباب أمنية، يرجى إعادة إدخال كلمة مرور المدير للمتابعة:");
            if (!adminPassword) {
                toast({ variant: "destructive", title: "تم الإلغاء", description: "تم إلغاء عملية إنشاء المستخدم." });
                await newAuthUser.delete();
                return;
            }
            const credential = EmailAuthProvider.credential(currentUser.email, adminPassword);
            await signInWithCredential(auth, credential);

             const userDataForDb = { 
                name: user.name, loginName: user.loginName, role: user.role, warehouse: user.warehouse, isSalesRep: user.isSalesRep, isEmployee: user.isEmployee, uid: newAuthUser.uid, phone: user.phone,
             };
            
            const newUserKey = await add(userDataForDb);
            if (!newUserKey) throw new Error("Failed to get new user key from database.");
            
            if (user.isEmployee) {
                const employeeRecord = { name: user.name, jobTitle: user.jobTitle, basicSalary: user.basicSalary, hireDate: user.hireDate, phone: user.phone };
                await updateEmployee(newUserKey, employeeRecord);
            }
            
            if (user.isSalesRep) {
                await addCashAccount({ name: `خزينة المندوب: ${user.name}`, type: 'cash', openingBalance: 0, salesRepId: newUserKey });
            }

            toast({ title: "تمت إضافة المستخدم بنجاح" });
        }
    } catch(error: any) {
        if (error.code === 'auth/email-already-in-use') toast({ variant: "destructive", title: "خطأ", description: "اسم الدخول هذا مستخدم بالفعل." });
        else if (error.code === 'auth/weak-password') toast({ variant: "destructive", title: "خطأ", description: "كلمة المرور ضعيفة جداً. يجب أن تكون 6 أحرف على الأقل." });
        else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') toast({ variant: "destructive", title: "خطأ", description: "كلمة مرور المدير غير صحيحة. فشلت عملية إنشاء المستخدم." });
        else toast({ variant: "destructive", title: "خطأ", description: "فشل حفظ المستخدم." });
        console.error("User save failed:", error);
    }
  }

  const handleDelete = async (userToDelete: User) => {
    if (!can('delete', moduleName)) return toast({ variant: 'destructive', title: 'غير مصرح به' });
    if (!userToDelete.id) return toast({ variant: 'destructive', title: 'خطأ', description: 'معرف المستخدم غير موجود.' });

    if (confirm(`هل أنت متأكد من حذف المستخدم "${userToDelete.name}"؟`)) {
      try {
        await remove(userToDelete.id);
        if (userToDelete.isEmployee) await removeEmployee(userToDelete.id);
        
        const repCashAccount = cashAccountsData.find((acc: any) => acc.salesRepId === userToDelete.id);
        if(repCashAccount) await removeCashAccount(repCashAccount.id);

        toast({ title: "تم حذف المستخدم بنجاح من قاعدة البيانات", description: "ملاحظة: حساب المصادقة لا يتم حذفه من هنا." });
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
                <div className="w-full overflow-auto">
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
                                <Avatar className="h-9 w-9">
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="font-medium">
                                    <div>{user.name}</div>
                                    <div className="text-xs text-muted-foreground">{user.phone}</div>
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
                </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
    
