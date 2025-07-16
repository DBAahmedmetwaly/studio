
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
import { Loader2, Coins } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AddEntityDialog } from '@/components/add-entity-dialog';
import { Label } from '@/components/ui/label';

const CloseSessionDialog = ({ session, onConfirm, onClose }: { session: any, onConfirm: (toAccountId: string) => void, onClose: () => void }) => {
    const { cashAccounts } = useData();
    const [toAccountId, setToAccountId] = useState('');
    const mainCashAccounts = cashAccounts.filter(acc => !acc.userId);

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
                        {mainCashAccounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex justify-end">
                <Button onClick={handleConfirm} disabled={!toAccountId}>تأكيد الإقفال والتوريد</Button>
            </div>
        </div>
    );
}

export default function PosClosingPage() {
    const { posSales, posSessions, dbAction, users, loading, cashAccounts } = useData();
    const { toast } = useToast();

    const openSessions = useMemo(() => {
        const cashierSales = new Map<string, number>();

        const cashiers = users.filter((u:any) => u.isCashier);

        // Calculate total sales for all cashiers from sales not in a closed session
        const closedSessionCashierIds = new Set(posSessions.filter((s:any) => s.isClosed).map((s:any) => s.cashierId));
        
        posSales.forEach((sale: any) => {
            const session = posSessions.find((s:any) => s.cashierId === sale.cashierId && !s.isClosed);
            if (!closedSessionCashierIds.has(sale.cashierId)) {
                cashierSales.set(sale.cashierId, (cashierSales.get(sale.cashierId) || 0) + sale.total);
            }
        });
        
        const openCashiers = cashiers.filter(cashier => {
            const hasOpenSales = posSales.some((sale:any) => sale.cashierId === cashier.id && !closedSessionCashierIds.has(sale.cashierId));
            return hasOpenSales;
        });


        return openCashiers.map(cashier => {
            const expectedCash = cashierSales.get(cashier.id) || 0;
            return { cashierId: cashier.id, cashierName: cashier.name, expectedCash };
        });
    }, [posSales, posSessions, users]);
    
    const handleCloseSession = async (session: any, toAccountId: string) => {
        try {
            const cashierName = users.find((u: any) => u.id === session.cashierId)?.name || 'كاشير';
            const repCashAccount = cashAccounts.find((acc: any) => acc.userId === session.cashierId);

            if (!repCashAccount) {
                 toast({variant: 'destructive', title: 'خطأ', description: `لم يتم العثور على حساب العهدة المالية للكاشير ${cashierName}.`});
                 return;
            }

            // Step 1: Create a treasury transaction for the withdrawal from the rep's cash account.
            const withdrawalId = await dbAction('getNextId', { counterName: 'treasuryTransaction' });
            await dbAction('treasuryTransactions', 'add', {
                date: new Date().toISOString(),
                amount: session.expectedCash,
                accountId: repCashAccount.id,
                type: 'withdrawal',
                description: `إقفال وردية وتوريد إلى ${cashAccounts.find(c => c.id === toAccountId)?.name}`,
                receiptNumber: `ح-خ-${withdrawalId}`,
                linkedTransaction: true, // Mark as part of an internal transfer
            });

            // Step 2: Create a treasury transaction for the deposit into the main account.
            const depositId = await dbAction('getNextId', { counterName: 'treasuryTransaction' });
             await dbAction('treasuryTransactions', 'add', {
                date: new Date().toISOString(),
                amount: session.expectedCash,
                accountId: toAccountId,
                type: 'deposit',
                description: `استلام من وردية الكاشير ${cashierName}`,
                receiptNumber: `ح-خ-${depositId}`,
                linkedTransaction: true, // Mark as part of an internal transfer
            });


            // Step 3: Mark the session as closed
            const existingSession = posSessions.find((s:any) => s.cashierId === session.cashierId && !s.isClosed);
            
            const sessionData = {
                cashierId: session.cashierId,
                startTime: existingSession?.startTime || new Date().toISOString(),
                endTime: new Date().toISOString(),
                expectedCash: session.expectedCash,
                isClosed: true,
                remittedToAccountId: toAccountId
            };

            if(existingSession) {
                await dbAction('posSessions', 'update', { id: existingSession.id, data: sessionData });
            } else {
                 await dbAction('posSessions', 'add', sessionData);
            }
            
            toast({title: 'تم بنجاح', description: `تم إقفال وردية ${session.cashierName}`});

        } catch (error) {
            console.error("Failed to close session:", error);
            toast({variant: 'destructive', title: 'خطأ', description: 'فشل إقفال الوردية.'});
        }
    };

  return (
    <>
      <PageHeader title="إقفال ورديات الكاشير" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>الورديات المفتوحة</CardTitle>
            <CardDescription>
              عرض الورديات التي لم يتم إقفالها وتوريد النقدية الخاصة بها.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
                 <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
                <Table>
                    <TableHeader><TableRow><TableHead>الكاشير</TableHead><TableHead className="text-center">النقدية المتوقعة</TableHead><TableHead className="text-center">الإجراء</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {openSessions.length > 0 ? openSessions.map(session => (
                            <TableRow key={session.cashierId}>
                                <TableCell className="font-medium">{session.cashierName}</TableCell>
                                <TableCell className="text-center font-bold text-green-600">{session.expectedCash.toFixed(2)} ج.م</TableCell>
                                <TableCell className="text-center">
                                    <AddEntityDialog
                                        title="تأكيد إقفال الوردية"
                                        description="سيتم إقفال الوردية وتوريد المبلغ إلى الخزينة الرئيسية."
                                        triggerButton={
                                             <Button><Coins className="ml-2"/>إقفال وتوريد</Button>
                                        }
                                    >
                                        <CloseSessionDialog session={session} onConfirm={(toAccountId) => handleCloseSession(session, toAccountId)} onClose={()=>{}} />
                                    </AddEntityDialog>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow><TableCell colSpan={3} className="text-center py-10 text-muted-foreground">لا توجد ورديات مفتوحة حاليًا.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
