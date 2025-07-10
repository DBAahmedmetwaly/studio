import {
  Activity,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Package,
  Users,
} from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Dashboard() {
  return (
    <>
      <PageHeader title="لوحة التحكم">
        <div className="flex items-center space-x-2">
          <label htmlFor="branch-select" className="text-sm font-medium">
            الفرع:
          </label>
          <Select defaultValue="br001">
            <SelectTrigger
              id="branch-select"
              className="w-[180px] bg-card"
            >
              <SelectValue placeholder="اختر فرعًا" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="br001">الفرع الرئيسي - القاهرة</SelectItem>
              <SelectItem value="br002">فرع الإسكندرية</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                إجمالي الإيرادات
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">$45,231.89</div>
              <p className="text-xs text-muted-foreground">
                +20.1% عن الشهر الماضي
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                عملاء جدد
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">+235</div>
              <p className="text-xs text-muted-foreground">
                +180.1% عن الشهر الماضي
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المبيعات</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">+12,234</div>
              <p className="text-xs text-muted-foreground">
                +19% عن الشهر الماضي
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                قيمة المخزون
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">$1,250,345</div>
              <p className="text-xs text-muted-foreground">
                +2% عن الشهر الماضي
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle>المعاملات الأخيرة</CardTitle>
                <CardDescription>
                  المعاملات الأخيرة من متجرك.
                </CardDescription>
              </div>
              <Button asChild size="sm" className="mr-auto gap-1">
                <Link href="#">
                  عرض الكل
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العميل</TableHead>
                    <TableHead className="hidden xl:table-column">
                      النوع
                    </TableHead>
                    <TableHead className="hidden xl:table-column">
                      الحالة
                    </TableHead>
                    <TableHead className="hidden xl:table-column">
                      التاريخ
                    </TableHead>
                    <TableHead className="text-left">المبلغ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="hidden h-9 w-9 sm:flex">
                            <AvatarImage
                              src={`https://placehold.co/100x100.png?text=${"AV".charAt(0)}`}
                              alt="Avatar"
                            />
                            <AvatarFallback>OM</AvatarFallback>
                          </Avatar>
                          <div className="font-medium">أوليفيا مارتن</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-column">
                        بيع
                      </TableCell>
                      <TableCell className="hidden xl:table-column">
                        <Badge className="text-xs" variant="outline">
                          موافق عليه
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell lg:hidden xl:table-column">
                        2023-06-23
                      </TableCell>
                      <TableCell className="text-left">$250.00</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="col-span-4 lg:col-span-3">
            <CardHeader>
              <CardTitle>عناصر على وشك النفاذ</CardTitle>
              <CardDescription>
                هذه العناصر مخزونها قليل.
              </CardDescription>
            </CardHeader>
            <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div className="flex items-center" key={i}>
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={`https://placehold.co/100x100.png`} alt="Avatar" data-ai-hint="product" />
                    <AvatarFallback>P{i+1}</AvatarFallback>
                  </Avatar>
                  <div className="mx-4 space-y-1">
                    <p className="text-sm font-medium leading-none">منتج {i+1}</p>
                    <p className="text-sm text-muted-foreground">SKU: PRD-00{i+1}</p>
                  </div>
                  <div className="mr-auto font-medium text-destructive">{10-i} وحدات</div>
                </div>
              ))}
            </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
