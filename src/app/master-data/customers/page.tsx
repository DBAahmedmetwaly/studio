
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

interface Customer {
  id?: string;
  name: string;
  openingBalance: number;
  creditLimit: number;
  phone?: string;
  address?: string;
}

const CustomerForm = ({ customer, onSave, onClose }: { customer?: Customer, onSave: (customer: Customer) => void, onClose: () => void }) => {
  const [formData, setFormData] = useState<Customer>(
    customer || { name: "", openingBalance: 0, creditLimit: 0, phone: "", address: "" }
  );

  const handleSubmit = () => {
    onSave({
      ...formData,
      openingBalance: Number(formData.openingBalance),
      creditLimit: Number(formData.creditLimit),
    });
    onClose();
  };

  return (
    <>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="customer-name" className="text-right">
            اسم العميل
          </Label>
          <Input id="customer-name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="opening-balance" className="text-right">
            رصيد أول المدة
          </Label>
          <Input id="opening-balance" type="number" value={formData.openingBalance} onChange={(e) => setFormData({...formData, openingBalance: e.target.value as any})} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="credit-limit" className="text-right">
            حد الائتمان
          </Label>
          <Input id="credit-limit" type="number" value={formData.creditLimit} onChange={(e) => setFormData({...formData, creditLimit: e.target.value as any})} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="customer-phone" className="text-right">
            رقم الهاتف
          </Label>
          <Input id="customer-phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="customer-address" className="text-right">
            العنوان
          </Label>
          <Input id="customer-address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="col-span-3" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSubmit}>حفظ</Button>
      </div>
    </>
  );
};


export default function CustomersPage() {
  const { data: customers, loading, add, update, remove } = useFirebase<Customer>("customers");

  const handleSave = (customer: Customer) => {
    if (customer.id) {
      update(customer.id, customer);
    } else {
      add(customer);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا العميل؟")) {
      remove(id);
    }
  };

  return (
    <>
      <PageHeader title="إدارة العملاء">
        <AddEntityDialog
          title="إضافة عميل جديد"
          description="أدخل تفاصيل العميل الجديد هنا."
          triggerButton={
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              إضافة عميل
            </Button>
          }
        >
          <CustomerForm onSave={handleSave} onClose={() => {}}/>
        </AddEntityDialog>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>العملاء</CardTitle>
            <CardDescription>
              إدارة العملاء مع حدود الائتمان والأرصدة الافتتاحية.
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
                            <TableHead>اسم العميل</TableHead>
                            <TableHead>رصيد أول المدة</TableHead>
                            <TableHead>حد الائتمان</TableHead>
                            <TableHead>
                                <span className="sr-only">الإجراءات</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers.map((customer) => (
                            <TableRow key={customer.id}>
                                <TableCell className="font-medium">{customer.name}</TableCell>
                                <TableCell>{customer.openingBalance}</TableCell>
                                <TableCell>{customer.creditLimit}</TableCell>
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
                                            title="تعديل العميل"
                                            description="قم بتحديث تفاصيل العميل هنا."
                                            triggerButton={
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                <Edit className="ml-2 h-4 w-4" />
                                                تعديل
                                                </DropdownMenuItem>
                                            }
                                        >
                                           <CustomerForm customer={customer} onSave={handleSave} onClose={() => {}}/>
                                        </AddEntityDialog>
                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(customer.id!)}>
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
