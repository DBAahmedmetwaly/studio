
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
  CardFooter
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

const CloseSessionDialog = ({ session, onConfirm }: { session: any, onConfirm: (toAccountId: string) => void }) => {
    const { cashAccounts } = useData();
    const [toAccountId, setToAccountId] = useState('');
    const mainCashAccounts = cashAccounts.filter(acc => !acc.salesRepId);

    const handleConfirm = () => {
        if(!toAccountId) return;
        onConfirm(toAccountId);
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
    const { posSales, posSessions, dbAction, users, loading } = useData();
    const { toast } = useToast();

    const openSessions = useMemo(() => {
        const activeCashierIds = new Set(posSales.filter((sale: any) => {
            const session = posSessions.find((s:any) => s.cashierId === sale.cashierId);
            return !session || !session.isClosed;
        }).map((sale: any) => sale.cashierId));

        return Array.from(activeCashierIds).map(cashierId => {
            const cashierName = users.find((u:any) => u.id === cashierId)?.name || 'غير معروف';
            const expectedCash = posSales
                .filter((sale: any) => sale.cashierId === cashierId)
                .reduce((sum: number, sale: any) => sum + sale.total, 0);
            
            return { cashierId, cashierName, expectedCash };
        });
    }, [posSales, posSessions, users]);
    
    const handleCloseSession = async (session: any, toAccountId: string) => {
        try {
            // Find existing session or create a new one to close
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
            
            // We can add a treasury transaction here in a real scenario
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
                                        <CloseSessionDialog session={session} onConfirm={(toAccountId) => handleCloseSession(session, toAccountId)} />
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
