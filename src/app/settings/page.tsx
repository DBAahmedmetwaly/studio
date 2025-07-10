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
      <PageHeader title="Settings" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>
              Configure company information, language, and tax settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Settings form will be displayed here.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
