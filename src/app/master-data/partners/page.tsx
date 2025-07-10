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

export default function PartnersPage() {
  return (
    <>
      <PageHeader title="إدارة الشركاء">
         <AddEntityDialog
          title="إضافة شريك جديد"
          description="أدخل تفاصيل الشريك الجديد هنا."
          triggerButton={
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              إضافة شريك
            </Button>
          }
        >
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="partner-name" className="text-right">
                اسم الشريك
              </Label>
              <Input id="partner-name" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="partner-capital" className="text-right">
                رأس المال
              </Label>
              <Input id="partner-capital" type="number" className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="partner-share" className="text-right">
                حصة الأرباح (%)
              </Label>
              <Input id="partner-share" type="number" className="col-span-3" />
            </div>
          </div>
        </AddEntityDialog>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>الشركاء</CardTitle>
            <CardDescription>
              إدارة الشركاء مع رأس المال وحصة الأرباح.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>سيتم عرض جدول إدارة الشركاء هنا.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
