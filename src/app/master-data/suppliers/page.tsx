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

export default function SuppliersPage() {
  return (
    <>
      <PageHeader title="Supplier Management">
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-4 w-4" />
          Add Supplier
        </Button>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Suppliers</CardTitle>
            <CardDescription>
              Manage suppliers with contact info and balances.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Supplier management table will be displayed here.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
