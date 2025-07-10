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

export default function PartnersPage() {
  return (
    <>
      <PageHeader title="إدارة الشركاء">
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-4 w-4" />
          إضافة شريك
        </Button>
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
