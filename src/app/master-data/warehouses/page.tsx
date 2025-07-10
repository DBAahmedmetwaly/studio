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

export default function WarehousesPage() {
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
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="warehouse-name" className="text-right">
                اسم المستودع
              </Label>
              <Input id="warehouse-name" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="warehouse-branch" className="text-right">
                الفرع المرتبط
              </Label>
              <Input id="warehouse-branch" className="col-span-3" />
            </div>
          </div>
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
            <p>سيتم عرض جدول إدارة المستودعات هنا.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
