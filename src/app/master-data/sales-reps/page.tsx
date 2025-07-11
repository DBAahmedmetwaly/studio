
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
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SalesRep {
  id?: string;
  name: string;
  phone: string;
  linkedWarehouseId: string;
}

interface Warehouse {
  id: string;
  name: string;
}

const SalesRepForm = ({ rep, onSave, onClose, warehouses }: { rep?: SalesRep, onSave: (data: Omit<SalesRep, 'id'> & { id?: string }) => void, onClose: () => void, warehouses: Warehouse[] }) => {
  const [formData, setFormData] = useState<Omit<SalesRep, 'id'>>(
    rep || { name: "", phone: "", linkedWarehouseId: "" }
  );

  const handleSubmit = () => {
    onSave({
        ...rep,
        ...formData,
    });
    onClose();
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="rep-name" className="text-right">
            اسم المندوب
          </Label>
          <Input id="rep-name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="col-span-3" required />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="rep-phone" className="text-right">
            رقم الهاتف
          </Label>
          <Input id="rep-phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="col-span-3" required />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rep-warehouse" className="text-right">
                المخزن
            </Label>
            <Select value={formData.linkedWarehouseId} onValueChange={v => setFormData({...formData, linkedWarehouseId: v})} required>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="اختر المخزن الرئيسي للمندوب" />
                </SelectTrigger>
                <SelectContent>
                    {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit">حفظ المندوب</Button>
      </div>
    </form>
  );
};


export default function SalesRepsPage() {
    const { data: reps, loading, add, update, remove } = useFirebase<SalesRep>("salesReps");
    const { data: warehouses, loading: loadingWarehouses } = useFirebase<Warehouse>("warehouses");
    const { toast } = useToast();

    const getWarehouseName = (id: string) => warehouses.find(w => w.id === id)?.name || 'غير معروف';

    const handleSave = async (rep: Omit<SalesRep, 'id'> & { id?: string }) => {
        try {
            if (rep.id) {
                await update(rep.id, rep);
                toast({ title: "تم التحديث بنجاح" });
            } else {
                await add(rep);
                toast({ title: "تمت الإضافة بنجاح" });
            }
        } catch (e) {
             toast({ variant: "destructive", title: "خطأ", description: "فشل حفظ بيانات المندوب." });
        }
    };

    const handleDelete = (id: string) => {
        if (confirm("هل أنت متأكد من حذف هذا المندوب؟")) {
            remove(id);
        }
    };
    
  return (
    <>
      <PageHeader title="إدارة مناديب المبيعات">
        <AddEntityDialog
            title="إضافة مندوب جديد"
            description="أدخل بيانات المندوب والمخزن المرتبط به."
            triggerButton={
                <Button size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                إضافة مندوب
                </Button>
            }
        >
            <SalesRepForm onSave={handleSave} onClose={() => {}} warehouses={warehouses} />
        </AddEntityDialog>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>قائمة المناديب</CardTitle>
            <CardDescription>
              عرض وتعديل بيانات مناديب المبيعات.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading || loadingWarehouses ? (
                 <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                 <div className="w-full overflow-auto border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>اسم المندوب</TableHead>
                                <TableHead>رقم الهاتف</TableHead>
                                <TableHead>المخزن المرتبط</TableHead>
                                <TableHead className="text-center w-[100px]">الإجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reps.map((rep) => (
                                <TableRow key={rep.id}>
                                    <TableCell className="font-medium">{rep.name}</TableCell>
                                    <TableCell>{rep.phone}</TableCell>
                                    <TableCell>{getWarehouseName(rep.linkedWarehouseId)}</TableCell>
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
                                                <AddEntityDialog
                                                    title="تعديل بيانات المندوب"
                                                    description="قم بتحديث بيانات المندوب هنا."
                                                    triggerButton={
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                        <Edit className="ml-2 h-4 w-4" />
                                                        تعديل
                                                        </DropdownMenuItem>
                                                    }
                                                >
                                                    <SalesRepForm rep={rep} onSave={handleSave} onClose={()=>{}} warehouses={warehouses} />
                                                </AddEntityDialog>
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(rep.id!)}>
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
