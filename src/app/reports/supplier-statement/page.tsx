import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer } from "lucide-react";

export default function SupplierStatementPage() {
  return (
    <>
      <PageHeader title="كشف حساب الموردين" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
            <CardHeader>
                <CardTitle>تحديد المورد والفترة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="supplier">المورد</Label>
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر موردًا" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sup001">مورد تكنولوجيا</SelectItem>
                                <SelectItem value="sup002">مورد أثاث</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="from-date">من تاريخ</Label>
                        <Input id="from-date" type="date" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="to-date">إلى تاريخ</Label>
                        <Input id="to-date" type="date" />
                    </div>
                     <div className="flex items-end">
                        <Button className="w-full">عرض التقرير</Button>
                    </div>
                 </div>
            </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>كشف الحساب</CardTitle>
                <CardDescription>
                عرض مفصل لمعاملات المورد.
                </CardDescription>
            </div>
            <Button variant="outline" size="icon">
                <Printer className="h-4 w-4" />
                <span className="sr-only">طباعة</span>
            </Button>
          </CardHeader>
          <CardContent>
            <p>سيتم عرض كشف حساب المورد المحدد هنا.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
