import PageHeader from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function StockTransferPage() {
  return (
    <>
      <PageHeader title="تحويل مخزون" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>تحويل مخزون</CardTitle>
            <CardDescription>
              تحويل المخزون بين المستودعات.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>سيتم عرض نموذج تحويل المخزون هنا.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
