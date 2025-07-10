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

export default function CustomersPage() {
  return (
    <>
      <PageHeader title="إدارة العملاء">
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-4 w-4" />
          إضافة عميل
        </Button>
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
