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
      <PageHeader title="Users & Permissions" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Manage users and their roles (Admin, Storekeeper, Accountant, Cashier).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>User management table will be displayed here.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
