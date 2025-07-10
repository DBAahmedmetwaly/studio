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
      <PageHeader title="Stock Out" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Stock Out</CardTitle>
            <CardDescription>
              Record outgoing stock, e.g., sales, damaged items.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Stock Out form will be displayed here.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
