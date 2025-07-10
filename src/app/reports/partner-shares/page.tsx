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
      <PageHeader title="تقارير حصص الشركاء" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>حصص الشركاء</CardTitle>
            <CardDescription>
              تقارير عن رأس مال الشركاء وتوزيع الأرباح.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>سيتم عرض تقارير حصص الشركاء هنا.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
