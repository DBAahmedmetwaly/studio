
"use client";

import React, { useState } from "react";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal, Edit, Trash2, Loader2, UserRound } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/contexts/permissions-context";

interface Employee {
  id?: string;
  name: string;
  jobTitle: string;
  basicSalary: number;
  hireDate: string;
}

const EmployeeForm = ({ employee, onSave, onClose }: { employee?: Employee, onSave: (data: Omit<Employee, 'id'> & { id?: string }) => void, onClose: () => void }) => {
  const [formData, setFormData] = useState<Omit<Employee, 'id'>>(
    employee || { name: "", jobTitle: "", basicSalary: 0, hireDate: new Date().toISOString().split('T')[0] }
  );

  const handleSubmit = () => {
    onSave({
        ...employee,
        ...formData,
        basicSalary: Number(formData.basicSalary),
    });
    onClose();
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="employee-name" className="text-right">
            اسم الموظف
          </Label>
          <Input id="employee-name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="col-span-3" required />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="job-title" className="text-right">
            المسمى الوظيفي
          </Label>
          <Input id="job-title" value={formData.jobTitle} onChange={(e) => setFormData({...formData, jobTitle: e.target.value})} className="col-span-3" required />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="basic-salary" className="text-right">
            الراتب الأساسي
          </Label>
          <Input id="basic-salary" type="number" value={formData.basicSalary} onChange={(e) => setFormData({...formData, basicSalary: e.target.value as any})} className="col-span-3" required />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="hire-date" className="text-right">
            تاريخ التعيين
          </Label>
          <Input id="hire-date" type="date" value={formData.hireDate} onChange={(e) => setFormData({...formData, hireDate: e.target.value})} className="col-span-3" required />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit">حفظ الموظف</Button>
      </div>
    </form>
  );
};


export default function EmployeesPage() {
    const { data: employees, loading, add, update, remove } = useFirebase<Employee>("employees");
    const { toast } = useToast();
    const { can } = usePermissions();

    const handleSave = async (employee: Omit<Employee, 'id'> & { id?: string }) => {
        try {
            if (employee.id) {
                if (!can('edit', 'hr')) return toast({ variant: "destructive", title: "غير مصرح به" });
                await update(employee.id, employee);
                toast({ title: "تم التحديث بنجاح" });
            } else {
                if (!can('add', 'hr')) return toast({ variant: "destructive", title: "غير مصرح به" });
                await add(employee);
                toast({ title: "تمت الإضافة بنجاح" });
            }
        } catch (e) {
             toast({ variant: "destructive", title: "خطأ", description: "فشل حفظ الموظف." });
        }
    };

    const handleDelete = (id: string) => {
        if (!can('delete', 'hr')) return toast({ variant: "destructive", title: "غير مصرح به" });
        if (confirm("هل أنت متأكد من حذف هذا الموظف؟")) {
            remove(id);
        }
    };
    
  return (
    <>
      <PageHeader title="إدارة الموظفين">
        {can('add', 'hr') && (
            <AddEntityDialog
            title="إضافة موظف جديد"
            description="أدخل بيانات الموظف الأساسية."
            triggerButton={
                <Button size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                إضافة موظف
                </Button>
            }
            >
            <EmployeeForm onSave={handleSave} onClose={() => {}} />
            </AddEntityDialog>
        )}
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>قائمة الموظفين</CardTitle>
            <CardDescription>
              عرض وتعديل بيانات الموظفين والرواتب الأساسية.
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
                                <TableHead>اسم الموظف</TableHead>
                                <TableHead>المسمى الوظيفي</TableHead>
                                <TableHead className="text-center">الراتب الأساسي</TableHead>
                                <TableHead className="text-center">تاريخ التعيين</TableHead>
                                <TableHead className="text-center w-[100px]">الإجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employees.map((employee) => (
                                <TableRow key={employee.id}>
                                    <TableCell className="font-medium">{employee.name}</TableCell>
                                    <TableCell>{employee.jobTitle}</TableCell>
                                    <TableCell className="text-center">{employee.basicSalary.toLocaleString()} ج.م</TableCell>
                                    <TableCell className="text-center">{new Date(employee.hireDate).toLocaleDateString('ar-EG')}</TableCell>
                                    <TableCell className="text-center">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">قائمة الإجراءات</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                                            {can('edit', 'hr') && (
                                                <AddEntityDialog
                                                    title="تعديل بيانات الموظف"
                                                    description="قم بتحديث بيانات الموظف هنا."
                                                    triggerButton={
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                        <Edit className="ml-2 h-4 w-4" />
                                                        تعديل
                                                        </DropdownMenuItem>
                                                    }
                                                >
                                                    <EmployeeForm employee={employee} onSave={handleSave} onClose={()=>{}} />
                                                </AddEntityDialog>
                                            )}
                                            {can('delete', 'hr') && (
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(employee.id!)}>
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
