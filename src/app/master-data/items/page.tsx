"use client";

import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
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

export default function ItemsPage() {
  return (
    <>
      <PageHeader title="إدارة الأصناف">
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
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="item-name" className="text-right">
                اسم الصنف
              </Label>
              <Input id="item-name" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="item-unit" className="text-right">
                الوحدة
              </Label>
              <Input id="item-unit" className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="item-price" className="text-right">
                السعر
              </Label>
              <Input id="item-price" type="number" className="col-span-3" />
            </div>
          </div>
        </AddEntityDialog>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>الأصناف</CardTitle>
            <CardDescription>
              تحديد الأصناف مع الفئات والوحدات والأسعار.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>سيتم عرض جدول إدارة الأصناف هنا.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
