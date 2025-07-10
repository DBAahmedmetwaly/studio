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

export default function WarehousesPage() {
  return (
    <>
      <PageHeader title="Warehouse Management">
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-4 w-4" />
          Add Warehouse
        </Button>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Warehouses</CardTitle>
            <CardDescription>
              Manage warehouses linked to branches.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Warehouse management table will be displayed here.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
