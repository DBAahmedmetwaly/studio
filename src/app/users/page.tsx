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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const users = [
  {
    name: "أحمد محمود",
    email: "ahmad@example.com",
    role: "مسؤول",
    branch: "الفرع الرئيسي - القاهرة",
  },
  {
    name: "فاطمة علي",
    email: "fatima@example.com",
    role: "محاسب",
    branch: "فرع الإسكندرية",
  },
  {
    name: "محمد حسن",
    email: "mohamed@example.com",
    role: "أمين مخزن",
    branch: "الفرع الرئيسي - القاهرة",
  },
];

const UserForm = ({ user }: { user?: typeof users[0] }) => (
  <div className="grid gap-4 py-4">
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="user-name" className="text-right">
        الاسم
      </Label>
      <Input id="user-name" defaultValue={user?.name} className="col-span-3" />
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="user-email" className="text-right">
        البريد الإلكتروني
      </Label>
      <Input id="user-email" type="email" defaultValue={user?.email} className="col-span-3" />
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="user-role" className="text-right">
        الدور
      </Label>
      <Select defaultValue={user?.role}>
        <SelectTrigger className="col-span-3">
          <SelectValue placeholder="اختر دورًا" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="مسؤول">مسؤول</SelectItem>
          <SelectItem value="محاسب">محاسب</SelectItem>
          <SelectItem value="أمين مخزن">أمين مخزن</SelectItem>
          <SelectItem value="أمين صندوق">أمين صندوق</SelectItem>
        </SelectContent>
      </Select>
    </div>
      <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="user-branch" className="text-right">
        الفرع
      </Label>
        <Select defaultValue={user?.branch}>
        <SelectTrigger className="col-span-3">
          <SelectValue placeholder="اختر فرعًا" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="الفرع الرئيسي - القاهرة">الفرع الرئيسي - القاهرة</SelectItem>
          <SelectItem value="فرع الإسكندرية">فرع الإسكندرية</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);

export default function UsersPage() {
  return (
    <>
      <PageHeader title="إدارة المستخدمين">
        <AddEntityDialog
          title="إضافة مستخدم جديد"
          description="أدخل تفاصيل المستخدم الجديد وصلاحياته."
          triggerButton={
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              إضافة مستخدم
            </Button>
          }
        >
          <UserForm />
        </AddEntityDialog>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>المستخدمون</CardTitle>
            <CardDescription>
              إدارة المستخدمين وأدوارهم في النظام.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>الفرع</TableHead>
                  <TableHead>
                    <span className="sr-only">الإجراءات</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.email}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="hidden h-9 w-9 sm:flex">
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">
                          <div>{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.role}</Badge>
                    </TableCell>
                    <TableCell>{user.branch}</TableCell>
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
                            title="تعديل المستخدم"
                            description="قم بتحديث تفاصيل المستخدم هنا."
                            triggerButton={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Edit className="ml-2 h-4 w-4" />
                                تعديل
                              </DropdownMenuItem>
                            }
                          >
                           <UserForm user={user} />
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
