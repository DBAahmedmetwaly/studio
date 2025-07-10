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

export default function CustomersPage() {
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
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customer-name" className="text-right">
                اسم العميل
              </Label>
              <Input id="customer-name" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="opening-balance" className="text-right">
                رصيد أول المدة
              </Label>
              <Input id="opening-balance" type="number" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="credit-limit" className="text-right">
                حد الائتمان
              </Label>
              <Input id="credit-limit" type="number" className="col-span-3" />
            </div>
          </div>
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
            <p>سيتم عرض جدول إدارة العملاء هنا.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
