import PageHeader from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="الإعدادات" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>إعدادات النظام</CardTitle>
            <CardDescription>
              تكوين معلومات الشركة واللغة وإعدادات الضرائب.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>سيتم عرض نموذج الإعدادات هنا.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
