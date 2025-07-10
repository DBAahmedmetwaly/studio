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

export default function ItemsPage() {
  return (
    <>
      <PageHeader title="Items Management">
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-4 w-4" />
          Add Item
        </Button>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
            <CardDescription>
              Define items with categories, units, and prices.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Item management table will be displayed here.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
