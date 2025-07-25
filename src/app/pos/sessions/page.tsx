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
import { useData } from "@/contexts/data-provider";
import { Loader2, PlayCircle, PowerOff, Coins, TrendingDown, TrendingUp, HandCoins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AddEntityDialog } from '@/components/add-entity-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const OpenSessionDialog = ({ onConfirm, onClose }: { onConfirm: (openingBalance: number) => void, onClose: () => void }) => {
    const [openingBalance, setOpeningBalance] = useState(0);

    return (
        <div className="space-y-4">
            <p>أنت على وشك فتح يوم عمل جديد. أدخل رصيد بداية اليوم (العهدة) المستلمة في درج النقدية.</p>
            <div className="space-y-2">
                <Label htmlFor="opening-balance">رصيد بداية اليوم</Label>
                <Input id="opening-balance" type="number" value={openingBalance} onChange={e => setOpeningBalance(Number(e.target.value))} placeholder="0.00" />
            </div>
            <div className="flex justify-end">
                <Button onClick={() => onConfirm(openingBalance)}>تأكيد وفتح اليوم</Button>
            </div>
        </div>
    )
}

const CloseSessionDialog = ({ session, onConfirm, onClose }: { session: any, onConfirm: (data: { actualCash: number, toAccountId: string, notes: string }) => void, onClose: () => void }) => {
    const { cashAccounts } = useData();
    const [actualCash, setActualCash] = useState(session.expectedCash);
    const [toAccountId, setToAccountId] = useState('');
    const [notes, setNotes] = useState('');
    const mainCashAccounts = cashAccounts.filter((acc: any) => !acc.salesRepId);

    const difference = actualCash - session.expectedCash;

    const handleConfirm = () => {
        if(!toAccountId) {
            alert("يرجى تحديد حساب لاستلام النقدية.");
            return;
        };
        onConfirm({ actualCash, toAccountId, notes });
        onClose();
    }
    
    return (
        <div className="space-y-4">
            <p className='text-lg'>إقفال يومية عمل تاريخ: <span className="font-bold">{new Date(session.startTime).toLocaleDateString('ar-EG')}</span></p>
            
            <div className="grid grid-cols-2 gap-4 text-center">
                 <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">النقدية المتوقعة</p>
                    <p className="text-2xl font-bold">{session.expectedCash.toFixed(2)}</p>
                 </div>
                 <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">النقدية الفعلية (الجرد)</p>
                    <Input className="text-2xl font-bold h-12 text-center" value={actualCash} onChange={e => setActualCash(Number(e.target.value))} />
                 </div>
            </div>
            
             <div className={`p-4 rounded-lg flex items-center justify-center gap-2 text-2xl font-bold ${difference === 0 ? 'bg-muted' : difference > 0 ? 'bg-green-100 dark:bg-green-900 text-green-600' : 'bg-red-100 dark:bg-red-900 text-destructive'}`}>
                {difference === 0 ? <Coins/> : difference > 0 ? <TrendingUp/> : <TrendingDown/>}
                <span>{difference === 0 ? 'لا يوجد فرق' : (difference > 0 ? `فائض: ${difference.toFixed(2)}` : `عجز: ${Math.abs(difference).toFixed(2)}`)}</span>
             </div>

            <div className="space-y-2">
                <Label htmlFor="to-account">توريد إلى خزينة/بنك</Label>
                <Select value={toAccountId} onValueChange={setToAccountId}>
                    <SelectTrigger id="to-account"><SelectValue placeholder="اختر حساب الاستلام" /></SelectTrigger>
                    <SelectContent>
                        {mainCashAccounts.map((acc:any) => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات الإقفال</Label>
                <Input id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="(اختياري)" />
            </div>
            <div className="flex justify-end">
                <Button onClick={handleConfirm} disabled={!toAccountId}>تأكيد الإقفال والتوريد</Button>
            </div>
        </div>
    );
}


export default function PosSessionsPage() {
    const { posSales, posSessions, dbAction, users, loading, getNextId } = useData();
    const { toast } = useToast();
    const { user } = useAuth();
    
    const openSession = useMemo(() => posSessions.find((s: any) => !s.isClosed), [posSessions]);

    const sessionData = useMemo(() => {
        if (!openSession) return null;

        const sessionSales = posSales.filter((sale: any) => new Date(sale.date) >= new Date(openSession.startTime));
        const totalSalesValue = sessionSales.reduce((sum: number, sale: any) => sum + sale.total, 0);
        const totalDiscount = sessionSales.reduce((sum: number, sale: any) => sum + (sale.discount || 0), 0);
        
        return {
            ...openSession,
            totalSalesValue,
            totalDiscount,
            transactionCount: sessionSales.length,
            expectedCash: openSession.openingBalance + totalSalesValue
        };
    }, [openSession, posSales]);
    
    const handleOpenSession = async (openingBalance: number) => {
        try {
            await dbAction('posSessions', 'add', {
                startTime: new Date().toISOString(),
                isClosed: false,
                openingBalance: openingBalance,
                openedBy: user?.id,
                openedByName: user?.name,
            });
            toast({title: 'تم بنجاح', description: `تم فتح يوم عمل جديد.`});
        } catch(error) {
            console.error("Failed to open session:", error);
            toast({variant: 'destructive', title: 'خطأ', description: 'فشل فتح يوم العمل.'});
        }
    }

    const handleCloseSession = async (data: { actualCash: number, toAccountId: string, notes: string }) => {
        if (!sessionData) return;
        const { actualCash, toAccountId, notes } = data;

        try {
            const difference = actualCash - sessionData.expectedCash;

            // Step 1: Update the session document
            const finalSessionData = {
                ...sessionData,
                endTime: new Date().toISOString(),
                isClosed: true,
                closedBy: user?.id,
                closedByName: user?.name,
                actualCash: actualCash,
                remittedToAccountId: toAccountId,
                notes: notes,
                difference: difference,
                totalSales: sessionData.totalSalesValue, // for historical record
            };
            // Clean up client-side calculated fields before saving
            delete finalSessionData.expectedCash;
            delete finalSessionData.transactionCount;

            await dbAction('posSessions', 'update', { id: sessionData.id, data: finalSessionData });
            
            // Step 2: Create an expense/income record for the difference
            if (difference !== 0) {
                 const receiptNumber = `ت-ي-${await getNextId('dailyClosing')}`;
                 if (difference > 0) { // Surplus is exceptional income
                     await dbAction('exceptionalIncomes', 'add', {
                         date: new Date().toISOString(),
                         amount: difference,
                         description: `فائض يومية الكاشير بتاريخ ${new Date(sessionData.startTime).toLocaleDateString('ar-EG')}`,
                         receiptNumber,
                     });
                 } else { // Deficit is an expense
                     await dbAction('expenses', 'add', {
                         date: new Date().toISOString(),
                         amount: Math.abs(difference),
                         description: `عجز يومية الكاشير بتاريخ ${new Date(sessionData.startTime).toLocaleDateString('ar-EG')}`,
                         expenseType: "عجز خزينة",
                         paidFromAccountId: toAccountId, // Assume deficit is covered from the remitted cash
                         receiptNumber,
                     });
                 }
            }
            
            // Step 3: Create treasury transaction for the remitted amount
            if (actualCash > 0) {
                const treasuryReceipt = `ت-خ-${await getNextId('treasuryTransaction')}`;
                 await dbAction('treasuryTransactions', 'add', {
                    date: new Date().toISOString(),
                    amount: actualCash,
                    accountId: toAccountId,
                    type: 'deposit',
                    description: `توريد من يومية الكاشير بتاريخ ${new Date(sessionData.startTime).toLocaleDateString('ar-EG')}`,
                    receiptNumber: treasuryReceipt,
                });
            }

            toast({title: 'تم بنجاح', description: `تم إقفال يومية العمل بنجاح.`});

        } catch (error) {
            console.error("Failed to close session:", error);
            toast({variant: 'destructive', title: 'خطأ', description: 'فشل إقفال يومية العمل.'});
        }
    };

  return (
    <>
      <PageHeader title="إدارة يومية نقاط البيع" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
       {loading ? (
             <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
       ) : openSession && sessionData ? (
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <PlayCircle className="text-green-500" />
                        يومية العمل مفتوحة
                    </CardTitle>
                    <CardDescription>
                        بدأت في: {new Date(openSession.startTime).toLocaleString('ar-EG')} بواسطة {openSession.openedByName || 'غير معروف'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">رصيد بداية اليوم</CardTitle>
                            <HandCoins className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{sessionData.openingBalance.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
                            <Coins className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{sessionData.totalSalesValue.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">{sessionData.transactionCount} فاتورة</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">إجمالي الخصومات</CardTitle>
                            <TrendingDown className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{sessionData.totalDiscount.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-green-600">النقدية المتوقعة بالدرج</CardTitle>
                            <Coins className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{sessionData.expectedCash.toLocaleString()}</div>
                             <p className="text-xs text-muted-foreground">رصيد البداية + إجمالي المبيعات</p>
                        </CardContent>
                    </Card>
                </CardContent>
                 <CardFooter>
                     <AddEntityDialog
                        title="إقفال يومية العمل"
                        description="تأكيد المبالغ وتوريدها إلى الخزينة الرئيسية."
                        triggerButton={<Button variant="destructive" size="lg"><PowerOff className="ml-2 h-4 w-4"/>إقفال اليومية</Button>}
                     >
                         <CloseSessionDialog session={sessionData} onConfirm={handleCloseSession} onClose={()=>{}} />
                     </AddEntityDialog>
                 </CardFooter>
            </Card>
       ) : (
            <Card className='text-center'>
                <CardHeader>
                     <CardTitle className='flex items-center justify-center gap-2'>
                        <PowerOff className="text-destructive" />
                        يومية العمل مغلقة
                    </CardTitle>
                    <CardDescription>
                       لا توجد يومية عمل مفتوحة حاليًا. يجب فتح يومية جديدة لبدء عمليات نقاط البيع.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <AddEntityDialog
                        title="فتح يوم عمل جديد"
                        description="أدخل رصيد بداية اليوم (العهدة) لبدء العمل."
                        triggerButton={<Button size="lg"><PlayCircle className="ml-2 h-4 w-4"/>فتح يومية عمل جديدة</Button>}
                    >
                         <OpenSessionDialog onConfirm={handleOpenSession} onClose={()=>{}} />
                    </AddEntityDialog>
                </CardContent>
            </Card>
       )}
      </main>
    </>
  );
}
