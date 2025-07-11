
"use client";

import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import React, { useState } from "react";
import useFirebase from "@/hooks/use-firebase";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    name: string;
    isSalesRep?: boolean;
}

interface CashAccount {
    id: string;
    name: string;
}

export default function RemitFromRepPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [selectedRep, setSelectedRep] = useState<string>("");
    const [amount, setAmount] = useState<number>(0);
    const [toAccountId, setToAccountId] = useState<string>("");
    const [notes, setNotes] = useState("");
    
    const { data: users, loading: loadingUsers } = useFirebase<User>('users');
    const { data: cashAccounts, loading: loadingAccounts } = useFirebase<CashAccount>('cashAccounts');
    const { add: addRemittance } = useFirebase("repRemittances");

    const reps = users.filter(u => u.isSalesRep);
    const loading = loadingUsers || loadingAccounts;

    const handleConfirm = async () => {
        if (!selectedRep || amount <= 0 || !toAccountId) {
            toast({ variant: "destructive", title: "بيانات غير مكتملة", description: "يرجى اختيار المندوب والحساب وإدخال مبلغ صحيح." });
            return;
        }

        const record = {
            salesRepId: selectedRep,
            toAccountId: toAccountId,
            date: new Date().toISOString(),
            amount: Number(amount),
            notes,
        };

        try {
            await addRemittance(record);
            toast({ title: "تم بنجاح", description: `تم تسجيل توريد النقدية بنجاح.` });
            router.push('/');
        } catch(error) {
             toast({ variant: "destructive", title: "حدث خطأ", description: "فشل في حفظ حركة التوريد." });
        }
    };

  return (
    <>
      <PageHeader title="توريد نقدية من مندوب" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>إيصال توريد نقدية</CardTitle>
            <CardDescription>
                استخدم هذه الشاشة لتسجيل المبالغ النقدية التي يقوم المندوب بتوريدها إلى خزينة الشركة.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
                 <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="rep">من المندوب</Label>
                        <Select value={selectedRep} onValueChange={setSelectedRep}>
                            <SelectTrigger id="rep"><SelectValue placeholder="اختر المندوب" /></SelectTrigger>
                            <SelectContent>
                                {reps.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="toAccount">إلى حساب</Label>
                        <Select value={toAccountId} onValueChange={setToAccountId}>
                            <SelectTrigger id="toAccount"><SelectValue placeholder="اختر حساب الخزينة/البنك" /></SelectTrigger>
                            <SelectContent>
                               {cashAccounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="amount">المبلغ المورد</Label>
                        <Input id="amount" type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} placeholder="أدخل المبلغ" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">ملاحظات</Label>
                        <Input id="notes" placeholder="ملاحظات (اختياري)" value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>
                </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button size="lg" disabled={loading} onClick={handleConfirm}>
                <Save className="ml-2 h-4 w-4" />
                حفظ الحركة
            </Button>
          </CardFooter>
        </Card>
      </main>
    </>
  );
}
