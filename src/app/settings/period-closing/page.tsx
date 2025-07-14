
"use client";

import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import useFirebase from "@/hooks/use-firebase";
import { Loader2, Lock } from "lucide-react";
import React, { useState } from "react";
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

export default function PeriodClosingPage() {
    const { toast } = useToast();
    const [closingDate, setClosingDate] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handlePerformClosing = async () => {
        if (!closingDate) {
            toast({
                variant: "destructive",
                title: "تاريخ غير محدد",
                description: "يرجى تحديد تاريخ الإقفال.",
            });
            return;
        }
        setIsLoading(true);
        toast({
            title: "جاري تنفيذ الإقفال...",
            description: "هذه الميزة قيد التطوير.",
        });
        // In the future, this will trigger a complex function to:
        // 1. Calculate all balances up to the closingDate.
        // 2. Save a snapshot of these balances to `periodClosings` in Firebase.
        // 3. Prevent any transactions from being recorded before this date.
        setTimeout(() => setIsLoading(false), 2000); 
    };

    return (
        <>
            <PageHeader title="إقفال الفترات المحاسبية" />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle>تنفيذ إقفال فترة جديدة</CardTitle>
                        <CardDescription className="text-destructive font-semibold">
                            تحذير: هذه عملية حساسة جداً ولا يمكن التراجع عنها. سيتم تجميد جميع الحركات قبل التاريخ المحدد وحفظ الأرصدة كنقطة بداية للفترة الجديدة.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="closing-date">تاريخ نهاية الفترة للإقفال</Label>
                            <Input
                                id="closing-date"
                                type="date"
                                value={closingDate}
                                onChange={(e) => setClosingDate(e.target.value)}
                            />
                             <p className="text-xs text-muted-foreground">
                                عادة ما يكون نهاية شهر، مثل 2024-07-31.
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" disabled={!closingDate || isLoading}>
                                    {isLoading ? (
                                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Lock className="ml-2 h-4 w-4" />
                                    )}
                                    {isLoading ? 'جارٍ العمل...' : 'بدء عملية الإقفال'}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                                <AlertDialogDescription>
                                    سيتم إقفال جميع الحركات حتى تاريخ <span className="font-bold">{new Date(closingDate).toLocaleDateString('ar-EG')}</span>.
                                    لن تتمكن من إضافة أو تعديل أي حركة قبل هذا التاريخ. هذا الإجراء نهائي ولا يمكن التراجع عنه.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={handlePerformClosing} className="bg-destructive hover:bg-destructive/90">
                                    نعم، قم بالإقفال
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardFooter>
                </Card>
            </main>
        </>
    );
}
