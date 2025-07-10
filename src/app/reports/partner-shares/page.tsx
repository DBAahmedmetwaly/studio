import PageHeader from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PartnerSharesPage() {
  return (
    <>
      <PageHeader title="Partner Share Reports" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Partner Shares</CardTitle>
            <CardDescription>
              Reports on partner capital and profit distribution.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Partner share reports will be displayed here.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
