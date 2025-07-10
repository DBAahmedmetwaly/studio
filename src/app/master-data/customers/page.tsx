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
      <PageHeader title="Customer Management">
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-4 w-4" />
          Add Customer
        </Button>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Customers</CardTitle>
            <CardDescription>
              Manage customers with credit limits and opening balances.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Customer management table will be displayed here.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
