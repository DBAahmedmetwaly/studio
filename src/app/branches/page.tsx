"use client";

import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
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
import { MoreHorizontal, PlusCircle, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { AddEntityDialog } from "@/components/add-entity-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const branches = [
  {
    code: "BR001",
    name: "الفرع الرئيسي - القاهرة",
    status: "نشط",
    allowNegativeStock: "system",
  },
  {
    code: "BR002",
    name: "فرع الإسكندرية",
    status: "نشط",
    allowNegativeStock: "allow",
  },
  {
    code: "BR003",
    name: "فرع الجيزة",
    status: "غير نشط",
    allowNegativeStock: "prevent",
  },
];

const BranchForm = ({ branch }: { branch?: (typeof branches)[0] }) => (
  <div className="grid gap-4 py-4">
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="branch-code" className="text-right">
        رمز الفرع
      </Label>
      <Input id="branch-code" defaultValue={branch?.code} className="col-span-3" />
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="branch-name" className="text-right">
        اسم الفرع
      </Label>
      <Input id="branch-name" defaultValue={branch?.name} className="col-span-3" />
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="allow-negative-stock" className="text-right">
        البيع بالسالب
      </Label>
      <Select defaultValue={branch?.allowNegativeStock ?? "system"}>
        <SelectTrigger className="col-span-3">
          <SelectValue placeholder="اختر سياسة البيع بالسالب" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="system">استخدام إعدادات النظام</SelectItem>
          <SelectItem value="allow">السماح دائماً</SelectItem>
          <SelectItem value="prevent">المنع دائماً</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);

const getNegativeStockLabel = (value: string) => {
    switch (value) {
        case "allow": return "مسموح";
        case "prevent": return "ممنوع";
        default: return "حسب النظام";
    }
}

export default function BranchesPage() {
  return (
    <>
      <PageHeader title="الفروع">
        <AddEntityDialog
          title="إضافة فرع جديد"
          description="أدخل تفاصيل الفرع الجديد هنا."
          triggerButton={
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              إضافة فرع
            </Button>
          }
        >
          <BranchForm />
        </AddEntityDialog>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>قائمة الفروع</CardTitle>
            <CardDescription>
              إدارة فروع شركتك من هنا.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رمز الفرع</TableHead>
                  <TableHead>اسم الفرع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>البيع بالسالب</TableHead>
                  <TableHead>
                    <span className="sr-only">الإجراءات</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((branch) => (
                  <TableRow key={branch.code}>
                    <TableCell className="font-medium">{branch.code}</TableCell>
                    <TableCell>{branch.name}</TableCell>
                    <TableCell>
                      <Badge variant={branch.status === "نشط" ? "default" : "secondary"}>
                        {branch.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={branch.allowNegativeStock === "allow" ? "default" : (branch.allowNegativeStock === "prevent" ? "destructive" : "secondary")}>
                        {getNegativeStockLabel(branch.allowNegativeStock)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">تبديل القائمة</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                          <AddEntityDialog
                             title="تعديل الفرع"
                             description="قم بتحديث تفاصيل الفرع هنا."
                             triggerButton={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Edit className="ml-2 h-4 w-4" />
                                  تعديل
                                </DropdownMenuItem>
                              }
                          >
                           <BranchForm branch={branch} />
                          </AddEntityDialog>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="ml-2 h-4 w-4" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
