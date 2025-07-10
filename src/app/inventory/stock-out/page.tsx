import PageHeader from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function StockOutPage() {
  return (
    <>
      <PageHeader title="إخراج مخزون" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>إخراج مخزون</CardTitle>
            <CardDescription>
              تسجيل المخزون الصادر، مثل المبيعات والأصناف التالفة.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>سيتم عرض نموذج إخراج المخزون هنا.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
