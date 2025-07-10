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
      <PageHeader title="Stock In" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Stock In</CardTitle>
            <CardDescription>
              Record incoming stock, e.g., purchases, opening stock.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Stock In form will be displayed here.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
