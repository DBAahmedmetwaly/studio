
"use client";

import React, { useState } from 'react';
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { database } from "@/lib/firebase";
import { ref, get, set } from "firebase/database";
import { Download, Upload, Loader2, AlertTriangle } from "lucide-react";
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
} from "@/components/ui/alert-dialog"


export default function BackupPage() {
    const { toast } = useToast();
    const [isLoadingBackup, setIsLoadingBackup] = useState(false);
    const [isLoadingRestore, setIsLoadingRestore] = useState(false);
    const [restoreFile, setRestoreFile] = useState<File | null>(null);

    const handleBackup = async () => {
        setIsLoadingBackup(true);
        try {
            const dbRef = ref(database);
            const snapshot = await get(dbRef);
            if (snapshot.exists()) {
                const data = snapshot.val();
                const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
                    JSON.stringify(data, null, 2)
                )}`;
                const link = document.createElement("a");
                link.href = jsonString;
                const date = new Date().toISOString().split('T')[0];
                link.download = `smart-accountant-backup-${date}.json`;
                link.click();
                toast({ title: "تم بنجاح", description: "تم تنزيل ملف النسخة الاحتياطية." });
            } else {
                toast({ variant: "destructive", title: "خطأ", description: "لا توجد بيانات لإنشاء نسخة احتياطية." });
            }
        } catch (error) {
            console.error("Backup failed:", error);
            toast({ variant: "destructive", title: "خطأ", description: "فشل إنشاء النسخة الاحتياطية." });
        } finally {
            setIsLoadingBackup(false);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setRestoreFile(event.target.files[0]);
        }
    };

    const handleRestore = async () => {
        if (!restoreFile) {
            toast({ variant: "destructive", title: "خطأ", description: "يرجى تحديد ملف لاستعادته." });
            return;
        }

        setIsLoadingRestore(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') {
                    throw new Error("فشل قراءة الملف");
                }
                const data = JSON.parse(text);
                const dbRef = ref(database);
                await set(dbRef, data);
                toast({ title: "تم بنجاح", description: "تم استعادة البيانات بنجاح." });
                setRestoreFile(null);
                 // Optionally, you can reset the input field
                const fileInput = document.getElementById('restore-file') as HTMLInputElement;
                if (fileInput) fileInput.value = '';

            } catch (error) {
                console.error("Restore failed:", error);
                toast({ variant: "destructive", title: "خطأ في الاستعادة", description: "الملف غير صالح أو حدث خطأ أثناء الكتابة إلى قاعدة البيانات." });
            } finally {
                setIsLoadingRestore(false);
            }
        };
        reader.readAsText(restoreFile);
    };

  return (
    <>
      <PageHeader title="النسخ الاحتياطي والاستعادة" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>إنشاء نسخة احتياطية</CardTitle>
                    <CardDescription>
                        تنزيل نسخة كاملة من جميع بياناتك في ملف JSON. احتفظ بهذا الملف في مكان آمن.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleBackup} disabled={isLoadingBackup}>
                        {isLoadingBackup ? (
                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="ml-2 h-4 w-4" />
                        )}
                        {isLoadingBackup ? 'جارٍ الإنشاء...' : 'إنشاء وتنزيل نسخة احتياطية'}
                    </Button>
                </CardContent>
            </Card>

            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <AlertTriangle />
                        استعادة نسخة احتياطية
                    </CardTitle>
                    <CardDescription>
                       سيؤدي هذا الإجراء إلى مسح جميع البيانات الحالية واستبدالها بالبيانات من الملف الذي تم تحميله. لا يمكن التراجع عن هذا الإجراء.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="restore-file">ملف النسخة الاحتياطية (.json)</Label>
                        <Input id="restore-file" type="file" accept=".json" onChange={handleFileChange} />
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button variant="destructive" disabled={!restoreFile || isLoadingRestore}>
                                {isLoadingRestore ? (
                                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Upload className="ml-2 h-4 w-4" />
                                )}
                                {isLoadingRestore ? 'جارٍ الاستعادة...' : 'استعادة البيانات'}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                            <AlertDialogDescription>
                                هذا الإجراء سيقوم بحذف جميع البيانات الحالية بشكل دائم واستبدالها بالبيانات من الملف المحدد. لا يمكن التراجع عن هذا الإجراء.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={handleRestore}>نعم، أفهم المخاطر، قم بالاستعادة</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </div>
      </main>
    </>
  );
}

