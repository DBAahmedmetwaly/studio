
"use client";

import React from 'react';
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
import { permissionsConfig, PermissionModule, PermissionAction, getModuleGroupLabel } from "@/contexts/permissions-context";


type Role = string;
type ModuleKey = keyof typeof permissionsConfig;


export default function RolesPage() {
  const { data: rolesData, loading } = useFirebase<any>('roles');
  const [roles, setRoles] = useState<any>(null);
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
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
    module: ModuleKey,
    action: PermissionAction,
    checked: boolean
  ) => {
    setRoles((prevRoles: any) => ({
      ...prevRoles,
      [role]: {
        ...prevRoles[role],
        [module]: {
          ...prevRoles[role]?.[module],
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

  const allPossibleActions: PermissionAction[] = ["view", "add", "edit", "delete", "print", "generate"];
  const allActionLabels: Record<PermissionAction, string> = {
    view: "عرض",
    add: "إضافة",
    edit: "تعديل",
    delete: "حذف",
    print: "طباعة",
    generate: "إنشاء",
  };

  const groupedModules = Object.entries(permissionsConfig).reduce((acc, [key, value]) => {
      const groupKey = value.group;
      if (!acc[groupKey]) {
          acc[groupKey] = [];
      }
      acc[groupKey].push({ key: key as ModuleKey, ...value });
      return acc;
  }, {} as Record<string, (PermissionModule & { key: ModuleKey })[]>);


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
              قم بتحديد الصلاحيات لكل دور في النظام على مستوى كل شاشة.
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
                            <TableHead>الشاشة/الوحدة</TableHead>
                            {allPossibleActions.map(action => (
                               <TableHead key={action} className="text-center">{allActionLabels[action]}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                           {Object.entries(groupedModules).map(([groupKey, modules]) => (
                               <React.Fragment key={groupKey}>
                                    <TableRow className="bg-muted/50">
                                        <TableCell colSpan={allPossibleActions.length + 1} className="font-bold">
                                            {getModuleGroupLabel(groupKey)}
                                        </TableCell>
                                    </TableRow>
                                    {modules.map((module) => {
                                        const moduleActions = module.actions;
                                        const rolePermissions = roles[role]?.[module.key];

                                        return (
                                          <TableRow key={module.key}>
                                            <TableCell className="font-medium pr-6">{module.label}</TableCell>
                                            {allPossibleActions.map((actionKey) => {
                                              return(
                                                <TableCell key={actionKey} className="text-center">
                                                  {moduleActions.includes(actionKey) ? (
                                                    <Checkbox
                                                      checked={rolePermissions?.[actionKey] || false}
                                                      onCheckedChange={(checked) => handlePermissionChange(role, module.key, actionKey, !!checked)}
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
                               </React.Fragment>
                           ))}
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
