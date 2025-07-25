

"use client";

import React, { useState } from "react";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal, Edit, Trash2, Loader2, QrCode } from "lucide-react";
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
import { useData } from "@/contexts/data-provider";
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
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/contexts/permissions-context";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { BarcodePrintDialog } from "@/components/barcode-print-dialog";


interface Item {
  id?: string;
  code?: string;
  name: string;
  unit: 'piece' | 'weight' | 'meter' | 'kilo' | 'gram';
  price: number;
  cost?: number;
  image?: string;
  reorderPoint?: number;
}

const ItemForm = ({ item, onSave, onClose }: { item?: Item, onSave: (item: Omit<Item, 'id' | 'code'> & { id?: string, code?: string }) => void, onClose: () => void }) => {
  const [formData, setFormData] = useState<Omit<Item, 'id' | 'code'>>(
    item ? { name: item.name, unit: item.unit, price: item.price, cost: item.cost, image: item.image, reorderPoint: item.reorderPoint }
    : { name: "", unit: "piece", price: 0, cost: 0, image: "", reorderPoint: 5 }
  );

  const handleSubmit = () => {
    onSave({
        ...item, // Pass existing id and code for updates
        ...formData,
        price: Number(formData.price),
        cost: Number(formData.cost),
        reorderPoint: Number(formData.reorderPoint)
    });
    onClose();
  };

  return (
    <>
        <div className="grid gap-4 py-4">
        {item?.code && (
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="item-code" className="text-right">
                كود الصنف
                </Label>
                <Input id="item-code" value={item.code} readOnly disabled className="col-span-3" />
            </div>
        )}
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="item-name" className="text-right">
            اسم الصنف
            </Label>
            <Input id="item-name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="col-span-3" required />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="item-image" className="text-right">
            رابط الصورة
            </Label>
            <Input id="item-image" placeholder="https://example.com/image.png" value={formData.image} onChange={(e) => setFormData({...formData, image: e.target.value})} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="item-unit" className="text-right">
            الوحدة
            </Label>
            <Select value={formData.unit} onValueChange={(value: Item["unit"]) => setFormData({...formData, unit: value})}>
            <SelectTrigger className="col-span-3">
                <SelectValue placeholder="اختر وحدة" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="piece">قطعة</SelectItem>
                <SelectItem value="weight">لتر </SelectItem>
                <SelectItem value="meter">متر</SelectItem>
                <SelectItem value="kilo">كيلو</SelectItem>
                <SelectItem value="gram">جرام</SelectItem>
            </SelectContent>
            </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="item-cost" className="text-right">
            التكلفة
            </Label>
            <Input id="item-cost" type="number" value={formData.cost} onChange={(e) => setFormData({...formData, cost: e.target.value as any})} className="col-span-3" />
        </div>
            <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="item-price" className="text-right">
            السعر
            </Label>
            <Input id="item-price" type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value as any})} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reorder-point" className="text-right">
            حد الطلب
            </Label>
            <Input id="reorder-point" type="number" value={formData.reorderPoint} onChange={(e) => setFormData({...formData, reorderPoint: e.target.value as any})} className="col-span-3" />
        </div>
        </div>
         <div className="flex justify-end">
            <Button onClick={handleSubmit}>حفظ</Button>
        </div>
    </>
  );
};

export default function ItemsPage() {
    const { items, loading, dbAction, getNextId, barcodeDesigns } = useData();
    const { toast } = useToast();
    const { can } = usePermissions();
    const moduleName = 'inventory_items';

    const handleSave = async (item: Omit<Item, 'id' | 'code'> & { id?: string, code?: string }) => {
        try {
            if (item.id) {
                if (!can('edit', moduleName)) return toast({ variant: "destructive", title: "غير مصرح به" });
                await dbAction('items', 'update', { id: item.id, data: item });
                toast({ title: "تم التحديث بنجاح" });
            } else {
                if (!can('add', moduleName)) return toast({ variant: "destructive", title: "غير مصرح به" });
                const nextId = await getNextId('item', 100000);
                 if (!nextId) {
                    toast({ variant: "destructive", title: "خطأ", description: "فشل في إنشاء كود الصنف." });
                    return;
                }
                const newItem = { ...item, code: String(nextId) };
                await dbAction('items', 'add', newItem);
                toast({ title: "تمت الإضافة بنجاح", description: `تم إنشاء الصنف بكود: ${newItem.code}` });
            }
        } catch (e) {
             toast({ variant: "destructive", title: "خطأ", description: "فشل حفظ الصنف." });
        }
    };

    const handleDelete = async (id: string) => {
        if (!can('delete', moduleName)) {
            toast({ variant: "destructive", title: "غير مصرح به" });
            return;
        }
        try {
            await dbAction('items', 'remove', { id });
            toast({ title: "تم الحذف بنجاح" });
        } catch (error) {
            toast({ variant: "destructive", title: "خطأ", description: "فشل حذف الصنف." });
        }
    };
    
    const getUnitLabel = (unit: string) => {
        const units = { piece: "قطعة", weight: "لتر ", meter: "متر", kilo: "كيلو", gram: "جرام" };
        return units[unit as keyof typeof units] || unit;
    }

  return (
    <>
      <PageHeader title="إدارة الأصناف">
        {can('add', moduleName) && (
            <AddEntityDialog
            title="إضافة صنف جديد"
            description="أدخل تفاصيل الصنف الجديد هنا."
            triggerButton={
                <Button size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                إضافة صنف
                </Button>
            }
            >
            <ItemForm onSave={handleSave} onClose={() => {}} />
            </AddEntityDialog>
        )}
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>الأصناف</CardTitle>
            <CardDescription>
              تحديد الأصناف مع الفئات والوحدات والأسعار. لإدخال رصيد أول المدة، استخدم شاشة استلام المخزون.
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
                                <TableHead className="w-[120px]">كود الصنف</TableHead>
                                <TableHead>اسم الصنف</TableHead>
                                <TableHead className="text-center">الوحدة</TableHead>
                                <TableHead className="text-center">التكلفة</TableHead>
                                <TableHead className="text-center">السعر</TableHead>
                                <TableHead className="text-center w-[100px]">الإجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item: Item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-mono">{item.code}</TableCell>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell className="text-center">{getUnitLabel(item.unit)}</TableCell>
                                    <TableCell className="text-center">{item.cost?.toLocaleString() || '-'}</TableCell>
                                    <TableCell className="text-center">{item.price.toLocaleString()}</TableCell>
                                    <TableCell className="text-center">
                                       <AlertDialog>
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
                                                        title="تعديل الصنف"
                                                        description="قم بتحديث تفاصيل الصنف هنا."
                                                        triggerButton={
                                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                            <Edit className="ml-2 h-4 w-4" />
                                                            تعديل
                                                            </DropdownMenuItem>
                                                        }
                                                    >
                                                    <ItemForm item={item} onSave={handleSave} onClose={()=>{}} />
                                                    </AddEntityDialog>
                                                )}
                                                
                                                <BarcodePrintDialog
                                                    item={item}
                                                    barcodeDesigns={barcodeDesigns}
                                                    trigger={
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                            <QrCode className="ml-2 h-4 w-4" />
                                                            طباعة باركود
                                                        </DropdownMenuItem>
                                                    }
                                                />
                                                    
                                                {can('delete', moduleName) && (
                                                    <>
                                                     <DropdownMenuSeparator />
                                                     <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                                            <Trash2 className="ml-2 h-4 w-4" />
                                                            حذف
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    </>
                                                )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                             <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        سيؤدي هذا الإجراء إلى حذف الصنف بشكل دائم. لا يمكن التراجع عن هذا الإجراء.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(item.id!)}>متابعة</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
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
