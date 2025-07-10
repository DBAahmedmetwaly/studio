
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

interface Supplier {
  id?: string;
  name: string;
  contact: string;
  openingBalance: number;
}

const SupplierForm = ({ supplier, onSave, onClose }: { supplier?: Supplier, onSave: (supplier: Supplier) => void, onClose: () => void }) => {
  const [formData, setFormData] = useState<Supplier>(
    supplier || { name: "", contact: "", openingBalance: 0 }
  );

  const handleSubmit = () => {
    onSave({
        ...formData,
        openingBalance: Number(formData.openingBalance),
    });
    onClose();
  };

  return (
    <>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="supplier-name" className="text-right">
            اسم المورد
          </Label>
          <Input id="supplier-name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="supplier-contact" className="text-right">
            جهة الاتصال
          </Label>
          <Input id="supplier-contact" value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="opening-balance" className="text-right">
            رصيد أول المدة
          </Label>
          <Input id="opening-balance" type="number" value={formData.openingBalance} onChange={(e) => setFormData({...formData, openingBalance: e.target.value as any})} className="col-span-3" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSubmit}>حفظ</Button>
      </div>
    </>
  );
};


export default function SuppliersPage() {
  const { data: suppliers, loading, add, update, remove } = useFirebase<Supplier>("suppliers");

  const handleSave = (supplier: Supplier) => {
    if (supplier.id) {
      update(supplier.id, supplier);
    } else {
      add(supplier);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المورد؟")) {
      remove(id);
    }
  };

  return (
    <>
      <PageHeader title="إدارة الموردين">
        <AddEntityDialog
          title="إضافة مورد جديد"
          description="أدخل تفاصيل المورد الجديد هنا."
          triggerButton={
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              إضافة مورد
            </Button>
          }
        >
          <SupplierForm onSave={handleSave} />
        </AddEntityDialog>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>الموردون</CardTitle>
            <CardDescription>
              إدارة الموردين مع معلومات الاتصال والأرصدة.
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
                            <TableHead>اسم المورد</TableHead>
                            <TableHead>جهة الاتصال</TableHead>
                            <TableHead>رصيد أول المدة</TableHead>
                            <TableHead>
                                <span className="sr-only">الإجراءات</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {suppliers.map((supplier) => (
                            <TableRow key={supplier.id}>
                                <TableCell className="font-medium">{supplier.name}</TableCell>
                                <TableCell>{supplier.contact}</TableCell>
                                <TableCell>{supplier.openingBalance}</TableCell>
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
                                            title="تعديل المورد"
                                            description="قم بتحديث تفاصيل المورد هنا."
                                            triggerButton={
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                <Edit className="ml-2 h-4 w-4" />
                                                تعديل
                                                </DropdownMenuItem>
                                            }
                                        >
                                           <SupplierForm supplier={supplier} onSave={handleSave} />
                                        </AddEntityDialog>
                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(supplier.id!)}>
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
