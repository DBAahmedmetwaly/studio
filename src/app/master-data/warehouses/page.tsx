
"use client";

import React, { useState } from "react";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal, Edit, Trash2, Loader2 } from "lucide-react";
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

interface Warehouse {
  id?: string;
  name: string;
  branchId: string;
}

interface Branch {
  id?: string;
  name: string;
  code: string;
}

const WarehouseForm = ({ warehouse, onSave, onClose, branches }: { warehouse?: Warehouse, onSave: (warehouse: Warehouse) => void, onClose: () => void, branches: Branch[] }) => {
  const [formData, setFormData] = useState<Warehouse>(
    warehouse || { name: "", branchId: "" }
  );

  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };

  return (
    <>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="warehouse-name" className="text-right">
            اسم المستودع
          </Label>
          <Input id="warehouse-name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="warehouse-branch" className="text-right">
            الفرع المرتبط
          </Label>
          <Select value={formData.branchId} onValueChange={(value) => setFormData({...formData, branchId: value})}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="اختر الفرع" />
            </SelectTrigger>
            <SelectContent>
              {branches.map(branch => <SelectItem key={branch.id!} value={branch.id!}>{branch.name}</SelectItem>)}
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


export default function WarehousesPage() {
  const { data: warehouses, loading: loadingWarehouses, add, update, remove } = useFirebase<Warehouse>("warehouses");
  const { data: branches, loading: loadingBranches } = useFirebase<Branch>("branches");

  const handleSave = (warehouse: Warehouse) => {
    if (warehouse.id) {
      update(warehouse.id, warehouse);
    } else {
      add(warehouse);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المستودع؟")) {
      remove(id);
    }
  };
  
  const getBranchName = (branchId: string) => {
    return branches.find(b => b.id === branchId)?.name || "غير محدد";
  }

  const loading = loadingWarehouses || loadingBranches;

  return (
    <>
      <PageHeader title="إدارة المستودعات">
        <AddEntityDialog
          title="إضافة مستودع جديد"
          description="أدخل تفاصيل المستودع الجديد هنا."
          triggerButton={
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              إضافة مستودع
            </Button>
          }
        >
          <WarehouseForm onSave={handleSave} branches={branches} />
        </AddEntityDialog>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>المستودعات</CardTitle>
            <CardDescription>
              إدارة المستودعات المرتبطة بالفروع.
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
                            <TableHead>اسم المستودع</TableHead>
                            <TableHead>الفرع المرتبط</TableHead>
                            <TableHead>
                                <span className="sr-only">الإجراءات</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {warehouses.map((warehouse) => (
                            <TableRow key={warehouse.id}>
                                <TableCell className="font-medium">{warehouse.name}</TableCell>
                                <TableCell>{getBranchName(warehouse.branchId)}</TableCell>
                                <TableCell>
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
                                            title="تعديل المستودع"
                                            description="قم بتحديث تفاصيل المستودع هنا."
                                            triggerButton={
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                <Edit className="ml-2 h-4 w-4" />
                                                تعديل
                                                </DropdownMenuItem>
                                            }
                                        >
                                            <WarehouseForm warehouse={warehouse} onSave={handleSave} branches={branches} />
                                        </AddEntityDialog>
                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(warehouse.id!)}>
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
