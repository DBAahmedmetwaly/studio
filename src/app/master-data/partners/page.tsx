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

export default function PartnersPage() {
  return (
    <>
      <PageHeader title="Partner Management">
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-4 w-4" />
          Add Partner
        </Button>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Partners</CardTitle>
            <CardDescription>
              Manage partners with capital and profit share.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Partner management table will be displayed here.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
