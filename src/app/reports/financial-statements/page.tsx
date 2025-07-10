import PageHeader from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function FinancialStatementsPage() {
  return (
    <>
      <PageHeader title="Financial Statements" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Tabs defaultValue="income-statement">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="income-statement">Income Statement</TabsTrigger>
            <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
            <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
          </TabsList>
          <TabsContent value="income-statement">
            <Card>
              <CardHeader>
                <CardTitle>Income Statement</CardTitle>
                <CardDescription>
                  Summary of revenues, expenses, and profits.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Income Statement report will be displayed here.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="balance-sheet">
            <Card>
              <CardHeader>
                <CardTitle>Balance Sheet</CardTitle>
                <CardDescription>
                  Snapshot of the company's financial health.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Balance Sheet report will be displayed here.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="trial-balance">
            <Card>
              <CardHeader>
                <CardTitle>Trial Balance</CardTitle>
                <CardDescription>
                  Worksheet of all ledger balances.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Trial Balance report will be displayed here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
