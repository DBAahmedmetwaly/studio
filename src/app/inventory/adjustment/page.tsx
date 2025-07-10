import PageHeader from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function StockAdjustmentPage() {
  return (
    <>
      <PageHeader title="تسوية المخزون" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>تسوية المخزون</CardTitle>
            <CardDescription>
              تسوية مستويات المخزون للفروقات.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>سيتم عرض نموذج تسوية المخزون هنا.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
