

"use client";

import React, { useState, useMemo } from "react";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


interface Supplier {
  id?: string;
  name: string;
  contact: string;
  openingBalance: number;
}

// Interfaces for balance calculation
interface PurchaseInvoice { id: string; supplierId: string; total: number; paidAmount?: number; }
interface SupplierPayment { id: string; supplierId: string; amount: number; }
interface PurchaseReturn { id: string; supplierId: string; total: number; }

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
  const { data: suppliers, loading: loadingSuppliers, add, update, remove } = useFirebase<Supplier>("suppliers");
  const { data: purchases, loading: loadingPurchases } = useFirebase<PurchaseInvoice>('purchaseInvoices');
  const { data: payments, loading: loadingPayments } = useFirebase<SupplierPayment>('supplierPayments');
  const { data: returns, loading: loadingReturns } = useFirebase<PurchaseReturn>('purchaseReturns');

  const loading = loadingSuppliers || loadingPurchases || loadingPayments || loadingReturns;
  
  const suppliersWithBalance = useMemo(() => {
    return suppliers.map((supplier: Supplier) => {
        const supplierPurchases = purchases.filter((p: PurchaseInvoice) => p.supplierId === supplier.id);
        const supplierPayments = payments.filter((p: SupplierPayment) => p.supplierId === supplier.id);
        const supplierReturns = returns.filter((r: PurchaseReturn) => r.supplierId === supplier.id);

        const totalPurchases = supplierPurchases.reduce((acc: number, p: PurchaseInvoice) => acc + p.total, 0);
        const totalPaidOnInvoice = supplierPurchases.reduce((acc: number, p: PurchaseInvoice) => acc + (p.paidAmount || 0), 0);
        const totalSeparatePayments = supplierPayments.reduce((acc: number, p: SupplierPayment) => acc + p.amount, 0);
        const totalReturns = supplierReturns.reduce((acc: number, r: PurchaseReturn) => acc + r.total, 0);

        const currentBalance = (supplier.openingBalance || 0) + totalPurchases - totalPaidOnInvoice - totalSeparatePayments - totalReturns;
        return { ...supplier, currentBalance };
    });
  }, [suppliers, purchases, payments, returns]);

  const handleSave = (supplier: Supplier) => {
    if (supplier.id) {
      update(supplier.id, supplier);
    } else {
      add(supplier);
    }
  };

  const handleDelete = (id: string) => {
    remove(id);
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
          <SupplierForm onSave={handleSave} onClose={()=>{}} />
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
                <div className="w-full overflow-auto border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>اسم المورد</TableHead>
                                <TableHead className="text-center">جهة الاتصال</TableHead>
                                <TableHead className="text-center">رصيد أول المدة</TableHead>
                                <TableHead className="text-center">الرصيد الحالي</TableHead>
                                <TableHead className="text-center w-[100px]">الإجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {suppliersWithBalance.map((supplier) => (
                                <TableRow key={supplier.id}>
                                    <TableCell className="font-medium">{supplier.name}</TableCell>
                                    <TableCell className="text-center">{supplier.contact}</TableCell>
                                    <TableCell className="text-center">{supplier.openingBalance.toLocaleString()}</TableCell>
                                    <TableCell className="text-center font-bold text-primary">{supplier.currentBalance.toLocaleString()}</TableCell>
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
                                                    <SupplierForm supplier={supplier} onSave={handleSave} onClose={()=>{}}/>
                                                    </AddEntityDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                                            <Trash2 className="ml-2 h-4 w-4" />
                                                            حذف
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        هذا الإجراء سيحذف المورد بشكل دائم. لا يمكن التراجع عن هذا الإجراء.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(supplier.id!)}>متابعة</AlertDialogAction>
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
