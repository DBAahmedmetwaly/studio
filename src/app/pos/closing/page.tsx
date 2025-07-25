
"use client";

import React, { useMemo, useState } from 'react';
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
import { useData } from "@/contexts/data-provider";
import { Loader2, Coins, PlayCircle, PowerOff } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AddEntityDialog } from '@/components/add-entity-dialog';
import { Label } from '@/components/ui/label';

const CloseSessionDialog = ({ session, onConfirm, onClose }: { session: any, onConfirm: (toAccountId: string) => void, onClose: () => void }) => {
    const { cashAccounts } = useData();
    const [toAccountId, setToAccountId] = useState('');
    const mainCashAccounts = cashAccounts.filter((acc:any) => !acc.salesRepId);

    const handleConfirm = () => {
        if(!toAccountId) {
            alert("يرجى تحديد حساب لاستلام النقدية.");
            return;
        };
        onConfirm(toAccountId);
        onClose();
    }
    
    return (
        <div className="space-y-4">
            <p>سيتم إقفال وردية الكاشير <span className="font-bold">{session.cashierName}</span>.</p>
            <p>المبلغ المتوقع توريده: <span className="font-bold text-green-600">{session.expectedCash.toFixed(2)} ج.م</span></p>
            <div className="space-y-2">
                <Label htmlFor="to-account">توريد إلى خزينة/بنك</Label>
                <Select value={toAccountId} onValueChange={setToAccountId}>
                    <SelectTrigger id="to-account"><SelectValue placeholder="اختر حساب الاستلام" /></SelectTrigger>
                    <SelectContent>
                        {mainCashAccounts.map((acc:any) => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex justify-end">
                <Button onClick={handleConfirm} disabled={!toAccountId}>تأكيد الإقفال والتوريد</Button>
            </div>
        </div>
    );
}

export default function PosSessionsPage() {
    const { posSales, posSessions, dbAction, users, loading, cashAccounts, getNextId } = useData();
    const { toast } = useToast();

    const allCashiers = useMemo(() => users.filter((u: any) => u.isCashier), [users]);
    const openSessionCashierIds = useMemo(() => new Set(posSessions.filter((s: any) => !s.isClosed).map((s: any) => s.cashierId)), [posSessions]);

    const openSessions = useMemo(() => {
        return allCashiers
            .filter((cashier: any) => openSessionCashierIds.has(cashier.id))
            .map((cashier: any) => {
                const session = posSessions.find((s: any) => s.cashierId === cashier.id && !s.isClosed);
                const sessionSales = posSales.filter((sale: any) => sale.cashierId === cashier.id && new Date(sale.date) >= new Date(session.startTime));
                const expectedCash = sessionSales.reduce((sum: number, sale: any) => sum + sale.total, 0);
                return { ...session, cashierName: cashier.name, expectedCash };
            });
    }, [allCashiers, openSessionCashierIds, posSessions, posSales]);

    const availableCashiers = useMemo(() => {
        return allCashiers.filter((cashier: any) => !openSessionCashierIds.has(cashier.id));
    }, [allCashiers, openSessionCashierIds]);
    
    
    const handleOpenSession = async (cashierId: string) => {
        try {
            await dbAction('posSessions', 'add', {
                cashierId: cashierId,
                startTime: new Date().toISOString(),
                isClosed: false,
            });
            toast({title: 'تم بنجاح', description: `تم فتح وردية جديدة.`});
        } catch(error) {
            console.error("Failed to open session:", error);
            toast({variant: 'destructive', title: 'خطأ', description: 'فشل فتح الوردية.'});
        }
    }

    const handleCloseSession = async (session: any, toAccountId: string) => {
        try {
            const cashierName = users.find((u: any) => u.id === session.cashierId)?.name || 'كاشير';
            const repCashAccount = cashAccounts.find((acc: any) => acc.userId === session.cashierId);

            if (!repCashAccount) {
                 toast({variant: 'destructive', title: 'خطأ', description: `لم يتم العثور على حساب العهدة المالية للكاشير ${cashierName}.`});
                 return;
            }

            // Step 1: Create a treasury transaction for the withdrawal from the rep's cash account.
            const withdrawalId = await getNextId('treasuryTransaction');
            await dbAction('treasuryTransactions', 'add', {
                date: new Date().toISOString(),
                amount: session.expectedCash,
                accountId: repCashAccount.id,
                type: 'withdrawal',
                description: `إقفال وردية وتوريد إلى ${cashAccounts.find((c:any) => c.id === toAccountId)?.name}`,
                receiptNumber: `ح-خ-${withdrawalId}`,
                linkedTransaction: true,
            });

            // Step 2: Create a treasury transaction for the deposit into the main account.
            const depositId = await getNextId('treasuryTransaction');
             await dbAction('treasuryTransactions', 'add', {
                date: new Date().toISOString(),
                amount: session.expectedCash,
                accountId: toAccountId,
                type: 'deposit',
                description: `استلام من وردية الكاشير ${cashierName}`,
                receiptNumber: `ح-خ-${depositId}`,
                linkedTransaction: true,
            });

            // Step 3: Mark the session as closed
            const sessionData = {
                ...session,
                endTime: new Date().toISOString(),
                isClosed: true,
                remittedToAccountId: toAccountId
            };
            delete sessionData.cashierName; // remove client-side property before saving
            
            await dbAction('posSessions', 'update', { id: session.id, data: sessionData });
            
            toast({title: 'تم بنجاح', description: `تم إقفال وردية ${session.cashierName}`});

        } catch (error) {
            console.error("Failed to close session:", error);
            toast({variant: 'destructive', title: 'خطأ', description: 'فشل إقفال الوردية.'});
        }
    };

  return (
    <>
      <PageHeader title="إدارة ورديات الكاشير" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
            <CardHeader>
                <CardTitle>الورديات المفتوحة حاليًا</CardTitle>
                <CardDescription>
                عرض الورديات التي لم يتم إقفالها وتوريد النقدية الخاصة بها.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                    <Table>
                        <TableHeader><TableRow><TableHead>الكاشير</TableHead><TableHead>تاريخ البدء</TableHead><TableHead className="text-center">النقدية المتوقعة</TableHead><TableHead className="text-center">الإجراء</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {openSessions.length > 0 ? openSessions.map(session => (
                                <TableRow key={session.cashierId}>
                                    <TableCell className="font-medium">{session.cashierName}</TableCell>
                                    <TableCell>{new Date(session.startTime).toLocaleString('ar-EG')}</TableCell>
                                    <TableCell className="text-center font-bold text-green-600">{session.expectedCash.toFixed(2)} ج.م</TableCell>
                                    <TableCell className="text-center">
                                        <AddEntityDialog
                                            title="تأكيد إقفال الوردية"
                                            description="سيتم إقفال الوردية وتوريد المبلغ إلى الخزينة الرئيسية."
                                            triggerButton={
                                                <Button variant="destructive"><PowerOff className="ml-2 h-4 w-4"/>إقفال</Button>
                                            }
                                        >
                                            <CloseSessionDialog session={session} onConfirm={(toAccountId) => handleCloseSession(session, toAccountId)} onClose={()=>{}} />
                                        </AddEntityDialog>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">لا توجد ورديات مفتوحة حاليًا.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
            </Card>

            <Card>
            <CardHeader>
                <CardTitle>فتح وردية جديدة</CardTitle>
                <CardDescription>
                    اختر كاشيرًا لبدء وردية جديدة له.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 {loading ? (
                    <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                    <Table>
                        <TableHeader><TableRow><TableHead>الكاشير المتاح</TableHead><TableHead className="text-center">الإجراء</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {availableCashiers.length > 0 ? availableCashiers.map(cashier => (
                                <TableRow key={cashier.id}>
                                    <TableCell className="font-medium">{cashier.name}</TableCell>
                                    <TableCell className="text-center">
                                        <Button variant="outline" onClick={() => handleOpenSession(cashier.id)}>
                                            <PlayCircle className="ml-2 h-4 w-4"/>
                                            فتح وردية
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={2} className="text-center py-10 text-muted-foreground">جميع الكاشيرات لديهم ورديات مفتوحة.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
            </Card>
        </div>
      </main>
    </>
  );
}
