import PageHeader from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function JournalPage() {
  return (
    <>
      <PageHeader title="Journal Entries" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Journal Entries</CardTitle>
            <CardDescription>
              Create and manage manual journal entries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Journal Entries table will be displayed here.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
