
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

interface Partner {
  id?: string;
  name: string;
  capital: number;
  profitShare: number;
  warehouseId: string;
}

interface Warehouse {
  id: string;
  name: string;
}

const PartnerForm = ({ partner, onSave, onClose, warehouses }: { partner?: Partner, onSave: (partner: Partner) => void, onClose: () => void, warehouses: Warehouse[] }) => {
  const [formData, setFormData] = useState<Partner>(
    partner || { name: "", capital: 0, profitShare: 0, warehouseId: "" }
  );

  const handleSubmit = () => {
    onSave({
        ...formData,
        capital: Number(formData.capital),
        profitShare: Number(formData.profitShare),
    });
    onClose();
  };

  return (
    <>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="partner-name" className="text-right">
            اسم الشريك
          </Label>
          <Input id="partner-name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="partner-capital" className="text-right">
            رأس المال
          </Label>
          <Input id="partner-capital" type="number" value={formData.capital} onChange={(e) => setFormData({...formData, capital: e.target.value as any})} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="partner-share" className="text-right">
            حصة الأرباح (%)
            </Label>
            <Input id="partner-share" type="number" value={formData.profitShare} onChange={(e) => setFormData({...formData, profitShare: e.target.value as any})} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="partner-warehouse" className="text-right">
            المخزن
          </Label>
          <Select value={formData.warehouseId} onValueChange={(value) => setFormData({...formData, warehouseId: value})}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="اختر المخزن المرتبط" />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
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


export default function PartnersPage() {
    const { data: partners, loading: loadingPartners, add, update, remove } = useFirebase<Partner>("partners");
    const { data: warehouses, loading: loadingWarehouses } = useFirebase<Warehouse>("warehouses");

    const loading = loadingPartners || loadingWarehouses;

    const handleSave = (partner: Partner) => {
        if (partner.id) {
            update(partner.id, partner);
        } else {
            add(partner);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm("هل أنت متأكد من حذف هذا الشريك؟")) {
            remove(id);
        }
    };
    
    const getWarehouseName = (warehouseId: string) => {
        return warehouses.find(w => w.id === warehouseId)?.name || 'غير محدد';
    }


  return (
    <>
      <PageHeader title="إدارة الشركاء">
         <AddEntityDialog
          title="إضافة شريك جديد"
          description="أدخل تفاصيل الشريك الجديد هنا."
          triggerButton={
            <Button size="sm" className="gap-1" disabled={loading}>
              <PlusCircle className="h-4 w-4" />
              إضافة شريك
            </Button>
          }
        >
          <PartnerForm onSave={handleSave} onClose={() => {}} warehouses={warehouses} />
        </AddEntityDialog>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>الشركاء</CardTitle>
            <CardDescription>
              إدارة الشركاء مع رأس المال وحصة الأرباح وربطهم بالمخازن.
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
                            <TableHead>اسم الشريك</TableHead>
                            <TableHead>رأس المال</TableHead>
                            <TableHead>حصة الأرباح (%)</TableHead>
                            <TableHead>المخزن</TableHead>
                            <TableHead>
                                <span className="sr-only">الإجراءات</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {partners.map((partner) => (
                            <TableRow key={partner.id}>
                                <TableCell className="font-medium">{partner.name}</TableCell>
                                <TableCell>{partner.capital}</TableCell>
                                <TableCell>{partner.profitShare}%</TableCell>
                                <TableCell>{getWarehouseName(partner.warehouseId)}</TableCell>
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
                                            title="تعديل الشريك"
                                            description="قم بتحديث تفاصيل الشريك هنا."
                                            triggerButton={
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                <Edit className="ml-2 h-4 w-4" />
                                                تعديل
                                                </DropdownMenuItem>
                                            }
                                        >
                                           <PartnerForm partner={partner} onSave={handleSave} onClose={() => {}} warehouses={warehouses} />
                                        </AddEntityDialog>
                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(partner.id!)}>
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
