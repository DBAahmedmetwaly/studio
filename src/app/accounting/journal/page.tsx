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
      <PageHeader title="قيود اليومية" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>قيود اليومية</CardTitle>
            <CardDescription>
              إنشاء وإدارة قيود اليومية اليدوية.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>سيتم عرض جدول قيود اليومية هنا.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
