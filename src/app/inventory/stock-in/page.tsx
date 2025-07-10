import PageHeader from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function StockInPage() {
  return (
    <>
      <PageHeader title="إدخال مخزون" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>إدخال مخزون</CardTitle>
            <CardDescription>
              تسجيل المخزون الوارد، مثل المشتريات والمخزون الافتتاحي.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>سيتم عرض نموذج إدخال المخزون هنا.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
