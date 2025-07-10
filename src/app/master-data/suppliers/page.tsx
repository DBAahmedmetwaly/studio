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

export default function SuppliersPage() {
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
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="supplier-name" className="text-right">
                اسم المورد
              </Label>
              <Input id="supplier-name" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="supplier-contact" className="text-right">
                جهة الاتصال
              </Label>
              <Input id="supplier-contact" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="opening-balance" className="text-right">
                رصيد أول المدة
              </Label>
              <Input id="opening-balance" type="number" className="col-span-3" />
            </div>
          </div>
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
            <p>سيتم عرض جدول إدارة الموردين هنا.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
