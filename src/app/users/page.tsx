import PageHeader from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function UsersPage() {
  return (
    <>
      <PageHeader title="المستخدمون والصلاحيات" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>المستخدمون</CardTitle>
            <CardDescription>
              إدارة المستخدمين وأدوارهم (مسؤول، أمين مخزن، محاسب، أمين صندوق).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>سيتم عرض جدول إدارة المستخدمين هنا.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
