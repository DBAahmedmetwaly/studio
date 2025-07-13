

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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface Warehouse {
  id?: string;
  name: string;
  address: string;
  autoStockUpdate?: boolean;
}

const WarehouseForm = ({ warehouse, onSave, onClose }: { warehouse?: Warehouse, onSave: (warehouse: Warehouse) => void, onClose: () => void }) => {
  const [formData, setFormData] = useState<Warehouse>(
    warehouse || { name: "", address: "", autoStockUpdate: false }
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
            اسم المخزن
          </Label>
          <Input id="warehouse-name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="warehouse-address" className="text-right">
            العنوان
          </Label>
          <Textarea id="warehouse-address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
           <Label htmlFor="auto-stock-update" className="text-right">
            تحديث تلقائي
          </Label>
          <div className="col-span-3 flex items-center space-x-2">
            <Switch
              id="auto-stock-update"
              checked={formData.autoStockUpdate}
              onCheckedChange={(checked) => setFormData({...formData, autoStockUpdate: checked})}
            />
            <Label htmlFor="auto-stock-update" className="text-xs text-muted-foreground">تحديث المخزون مباشرة عند إنشاء فواتير البيع/الشراء</Label>
          </div>
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

  const handleSave = (warehouse: Warehouse) => {
    if (warehouse.id) {
      update(warehouse.id, warehouse);
    } else {
      add(warehouse);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المخزن؟")) {
      remove(id);
    }
  };

  const loading = loadingWarehouses;

  return (
    <>
      <PageHeader title="إدارة المخازن">
        <AddEntityDialog
          title="إضافة مخزن جديد"
          description="أدخل تفاصيل المخزن الجديد هنا."
          triggerButton={
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              إضافة مخزن
            </Button>
          }
        >
          <WarehouseForm onSave={handleSave} onClose={() => {}} />
        </AddEntityDialog>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>المخازن</CardTitle>
            <CardDescription>
              إدارة المخازن الخاصة بك من هنا.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {loading ? (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                 <div className="w-full overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>اسم المخزن</TableHead>
                                <TableHead>العنوان</TableHead>
                                <TableHead className="text-center">تحديث تلقائي</TableHead>
                                <TableHead className="text-center w-[100px]">
                                    <span className="sr-only">الإجراءات</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {warehouses.map((warehouse) => (
                                <TableRow key={warehouse.id}>
                                    <TableCell className="font-medium">{warehouse.name}</TableCell>
                                    <TableCell>{warehouse.address}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={warehouse.autoStockUpdate ? 'default' : 'outline'}>
                                            {warehouse.autoStockUpdate ? 'مفعل' : 'غير مفعل'}
                                        </Badge>
                                    </TableCell>
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
                                                title="تعديل المخزن"
                                                description="قم بتحديث تفاصيل المخزن هنا."
                                                triggerButton={
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                    <Edit className="ml-2 h-4 w-4" />
                                                    تعديل
                                                    </DropdownMenuItem>
                                                }
                                            >
                                                <WarehouseForm warehouse={warehouse} onSave={handleSave} onClose={() => {}} />
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
                 </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
