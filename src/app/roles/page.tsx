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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState } from "react";

const initialRoles = {
  مسؤول: {
    dashboard: { view: true },
    branches: { view: true, add: true, edit: true, delete: true },
    masterData: { view: true, add: true, edit: true, delete: true },
    inventory: { view: true, add: true, edit: true, delete: true },
    accounting: { view: true, add: true, edit: true, delete: true },
    reports: { view: true, generate: true },
    users: { view: true, add: true, edit: true, delete: true },
    roles: { view: true, edit: true },
    settings: { view: true, edit: true },
  },
  محاسب: {
    dashboard: { view: true },
    branches: { view: false, add: false, edit: false, delete: false },
    masterData: { view: true, add: true, edit: true, delete: false },
    inventory: { view: true, add: false, edit: false, delete: false },
    accounting: { view: true, add: true, edit: true, delete: true },
    reports: { view: true, generate: true },
    users: { view: false, add: false, edit: false, delete: false },
    roles: { view: false, edit: false },
    settings: { view: false, edit: false },
  },
  "أمين مخزن": {
    dashboard: { view: true },
    branches: { view: false, add: false, edit: false, delete: false },
    masterData: { view: true, add: false, edit: false, delete: false },
    inventory: { view: true, add: true, edit: true, delete: true },
    accounting: { view: false, add: false, edit: false, delete: false },
    reports: { view: true, generate: false },
    users: { view: false, add: false, edit: false, delete: false },
    roles: { view: false, edit: false },
    settings: { view: false, edit: false },
  },
  "أمين صندوق": {
    dashboard: { view: true },
    branches: { view: false, add: false, edit: false, delete: false },
    masterData: { view: true, add: false, edit: false, delete: false },
    inventory: { view: false, add: false, edit: false, delete: false },
    accounting: { view: true, add: true, edit: false, delete: false },
    reports: { view: true, generate: false },
    users: { view: false, add: false, edit: false, delete: false },
    roles: { view: false, edit: false },
    settings: { view: false, edit: false },
  },
};

const permissionsMap = {
  dashboard: { label: "لوحة التحكم", actions: { view: "عرض" } },
  branches: { label: "الفروع", actions: { view: "عرض", add: "إضافة", edit: "تعديل", delete: "حذف" } },
  masterData: { label: "البيانات الرئيسية", actions: { view: "عرض", add: "إضافة", edit: "تعديل", delete: "حذف" } },
  inventory: { label: "المخزون", actions: { view: "عرض", add: "إضافة", edit: "تعديل", delete: "حذف" } },
  accounting: { label: "المحاسبة", actions: { view: "عرض", add: "إضافة", edit: "تعديل", delete: "حذف" } },
  reports: { label: "التقارير", actions: { view: "عرض", generate: "إنشاء" } },
  users: { label: "المستخدمون", actions: { view: "عرض", add: "إضافة", edit: "تعديل", delete: "حذف" } },
  roles: { label: "الأدوار والصلاحيات", actions: { view: "عرض", edit: "تعديل" } },
  settings: { label: "الإعدادات", actions: { view: "عرض", edit: "تعديل" } },
};

type Role = keyof typeof initialRoles;
type Module = keyof (typeof initialRoles)[Role];
type Action = keyof (typeof initialRoles)[Role][Module];

export default function RolesPage() {
  const [roles, setRoles] = useState(initialRoles);

  const handlePermissionChange = (
    role: Role,
    module: Module,
    action: Action,
    checked: boolean
  ) => {
    setRoles((prevRoles) => ({
      ...prevRoles,
      [role]: {
        ...prevRoles[role],
        [module]: {
          ...prevRoles[role][module],
          [action]: checked,
        },
      },
    }));
  };

  return (
    <>
      <PageHeader title="الأدوار والصلاحيات">
        <Button>حفظ التغييرات</Button>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>إدارة صلاحيات الأدوار</CardTitle>
            <CardDescription>
              قم بتحديد الصلاحيات لكل دور في النظام.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {Object.keys(roles).map((role) => (
                <AccordionItem value={role} key={role}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-lg">{role}</span>
                      <Badge variant="secondary">{role === "مسؤول" ? "صلاحيات كاملة" : "صلاحيات مخصصة"}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>الوحدة</TableHead>
                          <TableHead className="text-center">عرض</TableHead>
                          <TableHead className="text-center">إضافة</TableHead>
                          <TableHead className="text-center">تعديل</TableHead>
                          <TableHead className="text-center">حذف</TableHead>
                          <TableHead className="text-center">إنشاء</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.keys(permissionsMap).map((moduleKey) => {
                          const module = moduleKey as Module;
                          const moduleInfo = permissionsMap[module];
                          const moduleActions = moduleInfo.actions;
                          const rolePermissions = roles[role as Role][module];

                          return (
                            <TableRow key={module}>
                              <TableCell className="font-medium">{moduleInfo.label}</TableCell>
                              {["view", "add", "edit", "delete", "generate"].map((actionKey) => {
                                const action = actionKey as Action;
                                return(
                                  <TableCell key={action} className="text-center">
                                    {action in moduleActions ? (
                                      <Checkbox
                                        checked={rolePermissions[action]}
                                        onCheckedChange={(checked) => handlePermissionChange(role as Role, module, action, !!checked)}
                                        disabled={role === "مسؤول"}
                                      />
                                    ) : null}
                                  </TableCell>
                                )
                              })}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
