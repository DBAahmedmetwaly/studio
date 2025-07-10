import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle } from "lucide-react";

export default function ExpensesPage() {
  return (
    <>
      <PageHeader title="إدارة المصروفات" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>إضافة مصروف جديد</CardTitle>
            <CardDescription>
              سجل المصروفات وقم بتحميلها على الفروع أو المستودعات.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label htmlFor="expense-date">تاريخ المصروف</Label>
                <Input id="expense-date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-amount">المبلغ</Label>
                <Input id="expense-amount" type="number" placeholder="أدخل مبلغ المصروف" />
              </div>
            </div>
             <div className="space-y-2">
              <Label htmlFor="expense-description">الوصف</Label>
              <Textarea id="expense-description" placeholder="أدخل وصفًا للمصروف" />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="expense-type">تحميل على</Label>
                    <Select>
                        <SelectTrigger>
                        <SelectValue placeholder="اختر نوع التحميل" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="branch">فرع</SelectItem>
                        <SelectItem value="warehouse">مستودع</SelectItem>
                        <SelectItem value="general">عام</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="expense-entity">اختر الكيان</Label>
                    <Select>
                        <SelectTrigger>
                        <SelectValue placeholder="اختر الفرع أو المستودع" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="br001">الفرع الرئيسي - القاهرة</SelectItem>
                            <SelectItem value="br002">فرع الإسكندرية</SelectItem>
                             <SelectItem value="wh001">مستودع القاهرة</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
          </CardContent>
           <CardFooter>
            <Button>
                <PlusCircle className="ml-2 h-4 w-4" />
                إضافة مصروف
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>سجل المصروفات</CardTitle>
            </CardHeader>
            <CardContent>
                <p>سيتم عرض جدول بالمصروفات المسجلة هنا.</p>
            </CardContent>
        </Card>

      </main>
    </>
  );
}
