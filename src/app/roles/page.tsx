
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
import { useState, useEffect } from "react";
import useFirebase from "@/hooks/use-firebase";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { database } from "@/lib/firebase";
import { ref, set } from "firebase/database";


const permissionsMap = {
  dashboard: { label: "لوحة التحكم", actions: { view: "عرض" } },
  masterData: { label: "البيانات الرئيسية", actions: { view: "عرض", add: "إضافة", edit: "تعديل", delete: "حذف" } },
  inventory: { label: "المخزون", actions: { view: "عرض", add: "إضافة", edit: "تعديل", delete: "حذف" } },
  sales: { label: "المبيعات", actions: { view: "عرض", add: "إضافة", edit: "تعديل", delete: "حذف", print: "طباعة" } },
  purchases: { label: "المشتريات", actions: { view: "عرض", add: "إضافة", edit: "تعديل", delete: "حذف", print: "طباعة" } },
  accounting: { label: "المحاسبة", actions: { view: "عرض", add: "إضافة", edit: "تعديل", delete: "حذف" } },
  hr: { label: "الموارد البشرية", actions: { view: "عرض", add: "إضافة", edit: "تعديل", delete: "حذف" } },
  reports: { label: "التقارير", actions: { view: "عرض", generate: "إنشاء" } },
  analytics: { label: "التحليلات", actions: { view: "عرض" } },
  users: { label: "المستخدمون", actions: { view: "عرض", add: "إضافة", edit: "تعديل", delete: "حذف" } },
  roles: { label: "الأدوار والصلاحيات", actions: { view: "عرض", edit: "تعديل" } },
  settings: { label: "الإعدادات", actions: { view: "عرض", edit: "تعديل" } },
};

type Role = string;
type Module = keyof typeof permissionsMap;
type Action = "view" | "add" | "edit" | "delete" | "print" | "generate";

export default function RolesPage() {
  const { data: rolesData, loading } = useFirebase<any>('roles');
  const [roles, setRoles] = useState<any>(null);
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Convert array from useFirebase to object for easier manipulation
    if (rolesData.length > 0) {
        const rolesObject = rolesData.reduce((acc, role) => {
            acc[role.id] = role;
            delete acc[role.id].id;
            return acc;
        }, {});
        setRoles(rolesObject);
    }
  }, [rolesData]);

  const handlePermissionChange = (
    role: Role,
    module: Module,
    action: Action,
    checked: boolean
  ) => {
    setRoles((prevRoles: any) => ({
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

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
        const rolesRef = ref(database, 'roles');
        await set(rolesRef, roles);
        toast({ title: "تم الحفظ بنجاح", description: "تم تحديث صلاحيات الأدوار." });
    } catch (error) {
        toast({ variant: "destructive", title: "خطأ", description: "فشل حفظ الصلاحيات." });
        console.error("Failed to save roles:", error);
    } finally {
        setIsSaving(false);
    }
  }

  const allPossibleActions: Action[] = ["view", "add", "edit", "delete", "print", "generate"];


  if (loading || !roles) {
      return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )
  }

  return (
    <>
      <PageHeader title="الأدوار والصلاحيات">
        <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
            {isSaving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
        </Button>
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
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>الوحدة</TableHead>
                            {allPossibleActions.map(action => (
                               <TableHead key={action} className="text-center">{(permissionsMap.masterData.actions as any)[action] || action}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.keys(permissionsMap).map((moduleKey) => {
                            const module = moduleKey as Module;
                            const moduleInfo = permissionsMap[module];
                            const moduleActions = moduleInfo.actions as Record<string, string>;
                            const rolePermissions = roles[role][module];

                            return (
                              <TableRow key={module}>
                                <TableCell className="font-medium">{moduleInfo.label}</TableCell>
                                {allPossibleActions.map((actionKey) => {
                                  const action = actionKey as Action;
                                  return(
                                    <TableCell key={action} className="text-center">
                                      {action in moduleActions ? (
                                        <Checkbox
                                          checked={rolePermissions?.[action] || false}
                                          onCheckedChange={(checked) => handlePermissionChange(role, module, action, !!checked)}
                                          disabled={role === "مسؤول"}
                                        />
                                      ) : (
                                        <span className="text-muted-foreground">-</span>
                                      )}
                                    </TableCell>
                                  )
                                })}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
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
