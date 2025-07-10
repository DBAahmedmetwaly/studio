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
      <PageHeader title="Stock Adjustment" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Stock Adjustment</CardTitle>
            <CardDescription>
              Adjust stock levels for discrepancies.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Stock Adjustment form will be displayed here.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
