
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
import { Loader2, PlayCircle, PowerOff, Coins, TrendingDown, TrendingUp, HandCoins, UserCheck, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AddEntityDialog } from '@/components/add-entity-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PosSession {
    id: string;
    startTime: string;
    endTime?: string;
    isClosed: boolean;
    openedBy: string;
    openedByName: string;
    closedBy?: string;
    closedByName?: string;
    cashierSessions: {
        [cashierId: string]: CashierSession;
    }
}
interface CashierSession {
    cashierId: string;
    cashierName: string;
    startTime: string;
    openingBalance: number;
    isClosed: boolean;
    endTime?: string;
    expectedCash?: number;
    actualCash?: number;
    difference?: number;
    remittedToAccountId?: string;
    custodyFromAccountId?: string;
}

const AssignCustodyDialog = ({ users, onConfirm, onClose, cashAccounts, accountBalances }: { users: any[], onConfirm: (data: { cashierId: string, openingBalance: number, fromAccountId: string }) => void, onClose: () => void, cashAccounts: any[], accountBalances: Map<string, number> }) => {
    const [cashierId, setCashierId] = useState('');
    const [openingBalance, setOpeningBalance] = useState(0);
    const [fromAccountId, setFromAccountId] = useState('');

    const handleSubmit = () => {
        if (!cashierId || !fromAccountId || openingBalance <= 0) {
            alert("يرجى إدخال جميع البيانات بشكل صحيح.");
            return;
        }

        const accountBalance = accountBalances.get(fromAccountId) || 0;
        if (accountBalance < openingBalance) {
            alert(`رصيد الخزينة المحدد (${accountBalance.toLocaleString()}) غير كافٍ لصرف عهدة بقيمة ${openingBalance.toLocaleString()}.`);
            return;
        }
        
        onConfirm({ cashierId, openingBalance, fromAccountId });
        onClose();
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="cashier">الكاشير</Label>
                <Select value={cashierId} onValueChange={setCashierId}>
                    <SelectTrigger><SelectValue placeholder="اختر الكاشير" /></SelectTrigger>
                    <SelectContent>
                        {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="opening-balance">عهدة بداية الوردية</Label>
                <Input id="opening-balance" type="number" value={openingBalance} onChange={e => setOpeningBalance(Number(e.target.value))} placeholder="0.00" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="from-account">صرف من خزينة</Label>
                <Select value={fromAccountId} onValueChange={setFromAccountId}>
                     <SelectTrigger id="from-account"><SelectValue placeholder="اختر الخزينة" /></SelectTrigger>
                    <SelectContent>
                        {cashAccounts.map((acc:any) => <SelectItem key={acc.id} value={acc.id}>{`${acc.name} (الرصيد: ${(accountBalances.get(acc.id) || 0).toLocaleString()})`}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={!cashierId || !fromAccountId || openingBalance <= 0}>تسليم العهدة وبدء الوردية</Button>
            </div>
        </div>
    )
}

const CloseCashierSessionDialog = ({ cashierSession, onConfirm, onClose }: { cashierSession: any, onConfirm: (data: { actualCash: number, toAccountId: string, notes: string }) => void, onClose: () => void }) => {
    const { cashAccounts } = useData();
    const [actualCash, setActualCash] = useState(cashierSession.expectedCash);
    const [toAccountId, setToAccountId] = useState('');
    const [notes, setNotes] = useState('');
    const mainCashAccounts = cashAccounts.filter((acc: any) => !acc.salesRepId && !acc.userId);

    const difference = actualCash - cashierSession.expectedCash;

    const handleConfirm = () => {
        if (!toAccountId) {
            alert("يرجى تحديد حساب لاستلام النقدية.");
            return;
        };
        onConfirm({ actualCash, toAccountId, notes });
        onClose();
    }
    
    return (
        <div className="space-y-4">
            <p className='text-lg'>إقفال وردية الكاشير: <span className="font-bold">{cashierSession.cashierName}</span></p>
            <div className="grid grid-cols-2 gap-4 text-center">
                 <div className="p-4 bg-muted rounded-lg"><p className="text-sm text-muted-foreground">النقدية المتوقعة</p><p className="text-2xl font-bold">{cashierSession.expectedCash.toFixed(2)}</p></div>
                 <div className="p-4 bg-muted rounded-lg"><p className="text-sm text-muted-foreground">النقدية الفعلية (الجرد)</p><Input className="text-2xl font-bold h-12 text-center" value={actualCash} onChange={e => setActualCash(Number(e.target.value))} /></div>
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
            <div className="flex justify-end">
                <Button onClick={handleConfirm} disabled={!toAccountId}>تأكيد الإقفال والتوريد</Button>
            </div>
        </div>
    );
}

export default function PosSessionsPage() {
    const { posSales, posSessions, dbAction, users, loading, getNextId, cashAccounts, expenses, customerPayments, exceptionalIncomes, treasuryTransactions, supplierPayments, employeeAdvances } = useData();
    const { toast } = useToast();
    const { user } = useAuth();
    
    const openWorkDay = useMemo(() => posSessions.find((s: any) => !s.isClosed), [posSessions]);
    const cashiers = users.filter((u:any) => u.isCashier);
    const mainCashAccounts = useMemo(() => cashAccounts.filter((acc:any) => !acc.salesRepId && !acc.userId), [cashAccounts]);

    const accountBalances = useMemo(() => {
        const balances = new Map<string, number>();
        mainCashAccounts.forEach((account:any) => {
            let balance = account.openingBalance || 0;
            // Add other transactions to calculate current balance
             customerPayments.filter((p: any) => p.paidToAccountId === account.id).forEach((p:any) => balance += p.amount);
             exceptionalIncomes.filter((i: any) => i.paidToAccountId === account.id).forEach((i:any) => balance += i.amount);
             treasuryTransactions.filter((tx:any) => tx.accountId === account.id && tx.type === 'deposit').forEach((tx:any) => balance += tx.amount);

             expenses.filter((ex: any) => ex.paidFromAccountId === account.id).forEach((ex:any) => balance -= ex.amount);
             supplierPayments.filter((sp: any) => sp.paidFromAccountId === account.id).forEach((sp:any) => balance -= sp.amount);
             treasuryTransactions.filter((tx:any) => tx.accountId === account.id && tx.type === 'withdrawal').forEach((tx:any) => balance -= tx.amount);
             employeeAdvances.filter((ea: any) => ea.paidFromAccountId === account.id).forEach((ea:any) => balance -= ea.amount);

            balances.set(account.id, balance);
        });
        return balances;
    }, [mainCashAccounts, customerPayments, exceptionalIncomes, treasuryTransactions, expenses, supplierPayments, employeeAdvances]);

    const cashierSessionsData = useMemo(() => {
        if (!openWorkDay) return [];
        const activeCashierSessions = openWorkDay.cashierSessions ? Object.values(openWorkDay.cashierSessions).filter((cs: any) => !cs.isClosed) : [];

        return activeCashierSessions.map((cs: any) => {
            const sessionSales = posSales.filter((sale: any) => sale.cashierId === cs.cashierId && new Date(sale.date) >= new Date(cs.startTime));
            const totalSalesValue = sessionSales.reduce((sum: number, sale: any) => sum + sale.total, 0);
            return {
                ...cs,
                totalSalesValue,
                transactionCount: sessionSales.length,
                expectedCash: cs.openingBalance + totalSalesValue
            };
        });
    }, [openWorkDay, posSales]);

    const handleOpenWorkDay = async () => {
        try {
            await dbAction('posSessions', 'add', {
                startTime: new Date().toISOString(),
                isClosed: false,
                openedBy: user?.id,
                openedByName: user?.name,
                cashierSessions: {}
            });
            toast({title: 'تم بنجاح', description: `تم فتح يوم عمل جديد.`});
        } catch(error) {
            toast({variant: 'destructive', title: 'خطأ', description: 'فشل فتح يوم العمل.'});
        }
    }

    const handleAssignCustody = async (data: { cashierId: string, openingBalance: number, fromAccountId: string }) => {
        if (!openWorkDay) return;
        const { cashierId, openingBalance, fromAccountId } = data;
        const cashier = users.find((u:any) => u.id === cashierId);
        if (!cashier) return;

        const newCashierSession: CashierSession = {
            cashierId: cashierId,
            cashierName: cashier.name,
            startTime: new Date().toISOString(),
            openingBalance: openingBalance,
            isClosed: false,
            custodyFromAccountId: fromAccountId
        };
        
        // Record the expense for giving custody
        await dbAction('expenses', 'add', {
            date: new Date().toISOString(),
            amount: openingBalance,
            expenseType: 'عهدة موظف',
            description: `صرف عهدة بداية الوردية للكاشير ${cashier.name}`,
            paidFromAccountId: fromAccountId
        });

        const updatedSessions = { ...openWorkDay.cashierSessions, [cashierId]: newCashierSession };
        await dbAction('posSessions', 'update', { id: openWorkDay.id, data: { cashierSessions: updatedSessions } });
        toast({ title: "تم تسليم العهدة", description: `تم فتح وردية للكاشير ${cashier.name}` });
    }
    
     const handleCloseCashierSession = async (cashierId: string, closeData: { actualCash: number, toAccountId: string, notes: string }) => {
        if (!openWorkDay) return;
        const sessionToClose = cashierSessionsData.find(cs => cs.cashierId === cashierId);
        if (!sessionToClose) return;

        const { actualCash, toAccountId } = closeData;
        const difference = actualCash - sessionToClose.expectedCash;

        const closedSessionData = {
            ...openWorkDay.cashierSessions[cashierId],
            isClosed: true,
            endTime: new Date().toISOString(),
            expectedCash: sessionToClose.expectedCash,
            actualCash: actualCash,
            difference: difference,
            remittedToAccountId: toAccountId,
        };
        
        const updatedSessions = { ...openWorkDay.cashierSessions, [cashierId]: closedSessionData };
        
        await dbAction('posSessions', 'update', { id: openWorkDay.id, data: { cashierSessions: updatedSessions } });

        // Accounting entries
        if (difference !== 0) {
            const receiptNumber = `ت-ي-${await getNextId('dailyClosing')}`;
            if (difference > 0) {
                await dbAction('exceptionalIncomes', 'add', { date: new Date().toISOString(), amount: difference, description: `فائض وردية الكاشير ${sessionToClose.cashierName}` });
            } else {
                await dbAction('expenses', 'add', { date: new Date().toISOString(), amount: Math.abs(difference), description: `عجز وردية الكاشير ${sessionToClose.cashierName}`, expenseType: "عجز خزينة" });
            }
        }
        if (actualCash > 0) {
            await dbAction('treasuryTransactions', 'add', { date: new Date().toISOString(), amount: actualCash, accountId: toAccountId, type: 'deposit', description: `توريد من وردية الكاشير ${sessionToClose.cashierName}` });
        }
        toast({ title: "تم إقفال الوردية", description: `تم إقفال وردية الكاشير ${sessionToClose.cashierName} بنجاح.` });
    };

    const handleCloseWorkDay = async () => {
        if (!openWorkDay) return;
        await dbAction('posSessions', 'update', { id: openWorkDay.id, data: { isClosed: true, endTime: new Date().toISOString(), closedBy: user?.id, closedByName: user?.name } });
        toast({ title: 'تم إقفال يوم العمل', description: 'تم إقفال اليوم بنجاح. يمكنك الآن فتح يوم جديد.' });
    }

    const availableCashiers = useMemo(() => {
        if (!openWorkDay || !cashiers) return [];
        const activeCashierIds = new Set(Object.keys(openWorkDay.cashierSessions || {}));
        return cashiers.filter((c:any) => !activeCashierIds.has(c.id));
    }, [openWorkDay, cashiers]);

    const allSessionsClosed = useMemo(() => {
        if(!openWorkDay || !openWorkDay.cashierSessions) return true;
        return Object.values(openWorkDay.cashierSessions).every((cs: any) => cs.isClosed);
    }, [openWorkDay]);


    return (
        <>
            <PageHeader title="إدارة يومية نقاط البيع" />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                {loading ? <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
                : openWorkDay ? (
                    <div className="space-y-6">
                        <Card>
                             <CardHeader>
                                <CardTitle className='flex items-center gap-2'><PlayCircle className="text-green-500" />يوم العمل مفتوح</CardTitle>
                                <CardDescription>بدأ في: {new Date(openWorkDay.startTime).toLocaleString('ar-EG')} بواسطة {openWorkDay.openedByName || 'غير معروف'}</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>الورديات المفتوحة حاليًا</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {cashierSessionsData.map(cs => (
                                    <Card key={cs.cashierId} className="p-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="font-bold flex items-center gap-2"><UserCheck />{cs.cashierName}</h3>
                                                <p className="text-xs text-muted-foreground">بدأت في: {new Date(cs.startTime).toLocaleTimeString('ar-EG')}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm text-muted-foreground">مبيعات</p>
                                                <p className="font-bold">{cs.totalSalesValue.toLocaleString()} ج.م</p>
                                            </div>
                                             <div className="text-center">
                                                <p className="text-sm text-muted-foreground">متوقع</p>
                                                <p className="font-bold">{cs.expectedCash.toLocaleString()} ج.م</p>
                                            </div>
                                            <AddEntityDialog
                                                title="إقفال وردية الكاشير"
                                                description="تأكيد المبالغ وتوريدها إلى الخزينة الرئيسية."
                                                triggerButton={<Button variant="destructive"><PowerOff className="ml-2 h-4 w-4"/>إقفال وردية</Button>}
                                            >
                                                <CloseCashierSessionDialog cashierSession={cs} onConfirm={(data) => handleCloseCashierSession(cs.cashierId, data)} onClose={()=>{}} />
                                            </AddEntityDialog>
                                        </div>
                                    </Card>
                                ))}
                                {cashierSessionsData.length === 0 && <p className="text-center text-muted-foreground py-4">لا توجد ورديات مفتوحة حاليًا.</p>}
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>إدارة اليومية</CardTitle></CardHeader>
                            <CardContent className="flex gap-4">
                               {availableCashiers.length > 0 && (
                                     <AddEntityDialog
                                        title="تسليم عهدة وبدء وردية"
                                        description="اختر الكاشير وأدخل رصيد بداية الوردية."
                                        triggerButton={<Button><UserPlus className="ml-2 h-4 w-4" />تسليم عهدة جديدة</Button>}
                                    >
                                        <AssignCustodyDialog users={availableCashiers} onConfirm={handleAssignCustody} onClose={()=>{}} cashAccounts={mainCashAccounts} accountBalances={accountBalances} />
                                    </AddEntityDialog>
                               )}
                                <Button variant="secondary" onClick={handleCloseWorkDay} disabled={!allSessionsClosed}>
                                    <PowerOff className="ml-2 h-4 w-4" />
                                    إقفال يوم العمل بالكامل
                                </Button>
                            </CardContent>
                             {!allSessionsClosed && <CardFooter><p className="text-xs text-muted-foreground">يجب إقفال جميع ورديات الكاشيرات أولاً قبل إقفال يوم العمل بالكامل.</p></CardFooter>}
                        </Card>
                    </div>
                ) : (
                    <Card className='text-center'>
                        <CardHeader>
                            <CardTitle className='flex items-center justify-center gap-2'><PowerOff className="text-destructive" />يوم العمل مغلق</CardTitle>
                            <CardDescription>لا توجد يومية عمل مفتوحة حاليًا. يجب فتح يومية جديدة لبدء عمليات نقاط البيع.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button size="lg" onClick={handleOpenWorkDay}><PlayCircle className="ml-2 h-4 w-4"/>فتح يوم عمل جديد</Button>
                        </CardContent>
                    </Card>
                )}
            </main>
        </>
    );
}

