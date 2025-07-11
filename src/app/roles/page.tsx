
"use client";

import React, { useState, useEffect } from 'react';
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, History } from "lucide-react";
import { database } from "@/lib/firebase";
import { ref, set, onValue } from "firebase/database";
import { permissionsConfig, PermissionModule, PermissionAction, getModuleGroupLabel, initialRoles } from "@/contexts/permissions-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


type Role = string;
type ModuleKey = keyof typeof permissionsConfig;


export default function RolesPage() {
  const [roles, setRoles] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const rolesRef = ref(database, 'roles');
    const unsubscribe = onValue(rolesRef, (snapshot) => {
        if (snapshot.exists()) {
            setRoles(snapshot.val());
        } else {
            // If roles don't exist in DB, set them from initialRoles
            set(rolesRef, initialRoles);
            setRoles(initialRoles);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

  const handleRestoreDefaults = (roleToRestore: Role) => {
    const defaultPermissionsForRole = initialRoles[roleToRestore as keyof typeof initialRoles];
    if (!defaultPermissionsForRole) {
      toast({ variant: "destructive", title: "خطأ", description: "لم يتم العثور على الدور الافتراضي." });
      return;
    }
    
    setRoles((prevRoles: any) => ({
      ...prevRoles,
      [roleToRestore]: defaultPermissionsForRole
    }));

    toast({ title: "تم استعادة الافتراضيات", description: `تم استعادة صلاحيات دور "${roleToRestore}". اضغط على حفظ لتطبيق التغييرات.` });
  };


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
                    <div className="flex w-full items-center justify-between">
                      <span className="font-bold text-lg">{role}</span>
                       {role !== "مسؤول" && (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                                <History className="ml-2 h-4 w-4" />
                                استعادة الافتراضي
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>هل أنت متأكد من استعادة الافتراضيات؟</AlertDialogTitle>
                                <AlertDialogDescription>
                                  سيؤدي هذا إلى إعادة تعيين جميع صلاحيات دور "{role}" إلى الإعدادات الافتراضية الموصى بها. سيتم تطبيق التغييرات بعد الضغط على زر "حفظ التغييرات" الرئيسي.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRestoreDefaults(role)}>نعم، قم بالاستعادة</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                       )}
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
