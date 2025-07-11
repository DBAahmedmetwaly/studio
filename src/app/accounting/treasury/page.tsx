
"use client";

import React, { useState, useMemo } from 'react';
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
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Loader2, ArrowUpCircle, ArrowDownCircle, Wallet, Landmark } from "lucide-react";
import useFirebase from '@/hooks/use-firebase';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


interface CashAccount {
    id: string;
    name: string;
    type: 'cash' | 'bank';
    openingBalance: number;
}

interface TreasuryTransaction {
    id?: string;
    date: string;
    amount: number;
    description: string;
    accountId: string;
    type: 'deposit' | 'withdrawal';
    receiptNumber?: string;
}

interface Expense {
    id: string;
    amount: number;
    paidFromAccountId: string;
}

const TransactionForm = ({ onSave, cashAccounts, onClose }: { onSave: (data: Omit<TreasuryTransaction, 'id' | 'receiptNumber'>) => void, cashAccounts: CashAccount[], onClose: () => void }) => {
    const [formData, setFormData] = useState<Omit<TreasuryTransaction, 'id' | 'receiptNumber'>>({
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        description: "",
        accountId: "",
        type: "deposit",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, amount: Number(formData.amount) });
        // Reset form after submission
        setFormData({
            date: new Date().toISOString().split('T')[0],
            amount: 0,
            description: "",
            accountId: "",
            type: "deposit",
        });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit}>
            <Tabs defaultValue="deposit" className="w-full" onValueChange={(v) => setFormData({...formData, type: v as any})}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="deposit"><ArrowDownCircle className="ml-2 h-4 w-4" />إيداع</TabsTrigger>
                    <TabsTrigger value="withdrawal"><ArrowUpCircle className="ml-2 h-4 w-4" />سحب</TabsTrigger>
                </TabsList>
                 <div className="grid gap-4 py-4 mt-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="tx-date" className="text-right">التاريخ</Label>
                        <Input id="tx-date" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="col-span-3" required/>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="tx-account" className="text-right">الحساب</Label>
                        <Select value={formData.accountId} onValueChange={v => setFormData({...formData, accountId: v})} required>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="اختر الحساب" />
                            </SelectTrigger>
                            <SelectContent>
                            {cashAccounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="tx-amount" className="text-right">المبلغ</Label>
                        <Input id="tx-amount" type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="col-span-3" placeholder="أدخل المبلغ" required/>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="tx-description" className="text-right">الوصف</Label>
                        <Textarea id="tx-description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="col-span-3" placeholder="أدخل وصفًا للعملية" required/>
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button type="submit">
                        <PlusCircle className="ml-2 h-4 w-4" />
                        حفظ الحركة
                    </Button>
                </div>
            </Tabs>
        </form>
    );
};


export default function TreasuryPage() {
    const { data: transactions, loading: loadingTxs, add, getNextId, setData } = useFirebase<TreasuryTransaction>('treasuryTransactions');
    const { data: cashAccounts, loading: loadingAccounts } = useFirebase<CashAccount>('cashAccounts');
    const { data: expenses, loading: loadingExpenses } = useFirebase<Expense>('expenses');
    const { toast } = useToast();
    
    const loading = loadingTxs || loadingAccounts || loadingExpenses;
    
    const getAccountName = (accountId: string) => cashAccounts.find(acc => acc.id === accountId)?.name || 'غير معروف';
    const getAccountTypeIcon = (accountId: string) => {
        const type = cashAccounts.find(acc => acc.id === accountId)?.type;
        if (type === 'bank') return <Landmark className="h-4 w-4 text-muted-foreground" />;
        return <Wallet className="h-4 w-4 text-muted-foreground" />;
    };

    const handleSave = async (data: Omit<TreasuryTransaction, 'id' | 'receiptNumber'>) => {
        try {
            const receiptNumber = data.type === 'deposit' 
                ? `إيداع-${await getNextId('deposit')}` 
                : `سحب-${await getNextId('withdrawal')}`;
            
            const newTransaction = { ...data, receiptNumber };
            await add(newTransaction);

            // Optimistically update local state
            const optimisticId = `temp-${Date.now()}`;
            setData(prev => [...prev, { ...newTransaction, id: optimisticId }]);

            toast({ title: "تمت إضافة الحركة بنجاح" });
        } catch (error) {
            toast({ variant: "destructive", title: "حدث خطأ", description: "فشل حفظ الحركة" });
        }
    };

    const accountBalances = useMemo(() => {
        return cashAccounts.map(account => {
            const openingBalance = account.openingBalance || 0;

            const totalDeposits = transactions
                .filter(tx => tx.accountId === account.id && tx.type === 'deposit')
                .reduce((sum, tx) => sum + tx.amount, 0);

            const totalWithdrawals = transactions
                .filter(tx => tx.accountId === account.id && tx.type === 'withdrawal')
                .reduce((sum, tx) => sum + tx.amount, 0);

            const totalExpenses = expenses
                .filter(ex => ex.paidFromAccountId === account.id)
                .reduce((sum, ex) => sum + ex.amount, 0);
            
            // TODO: Add other outflows like supplier payments, employee advances etc.
            
            const currentBalance = openingBalance + totalDeposits - totalWithdrawals - totalExpenses;

            return {
                ...account,
                currentBalance
            };
        });
    }, [cashAccounts, transactions, expenses]);
    
    const sortedTransactions = useMemo(() => {
        return [...transactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions]);


    return (
    <>
      <PageHeader title="إدارة حركة الخزينة" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        
         <Card>
            <CardHeader>
                <CardTitle>أرصدة الحسابات</CardTitle>
                <CardDescription>نظرة سريعة على الأرصدة الحالية في الخزائن والبنوك.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {accountBalances.map(acc => (
                             <Card key={acc.id}>
                                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                     <CardTitle className="text-sm font-medium">{acc.name}</CardTitle>
                                     {acc.type === 'bank' ? <Landmark className="h-4 w-4 text-muted-foreground" /> : <Wallet className="h-4 w-4 text-muted-foreground" />}
                                 </CardHeader>
                                 <CardContent>
                                     <div className="text-2xl font-bold">{acc.currentBalance.toLocaleString()} ج.م</div>
                                     <p className="text-xs text-muted-foreground">
                                         رصيد افتتاحي: {acc.openingBalance.toLocaleString()} ج.م
                                     </p>
                                 </CardContent>
                             </Card>
                        ))}
                    </div>
                )}
            </CardContent>
         </Card>

        <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>إضافة حركة جديدة</CardTitle>
                <CardDescription>
                سجل عمليات الإيداع والسحب من الخزائن والحسابات البنكية.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? <div className="flex justify-center items-center"><Loader2 className="animate-spin" /></div> : <TransactionForm onSave={handleSave} cashAccounts={cashAccounts} onClose={()=>{}} />}
            </CardContent>
            </Card>
            
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>سجل الحركات</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                         <div className="w-full overflow-auto border rounded-lg max-h-96">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[120px]">التاريخ</TableHead>
                                        <TableHead>الحساب</TableHead>
                                        <TableHead>البيان</TableHead>
                                        <TableHead className="text-center">النوع</TableHead>
                                        <TableHead className="text-center w-[120px]">المبلغ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedTransactions.map(tx => (
                                        <TableRow key={tx.id}>
                                            <TableCell>{new Date(tx.date).toLocaleDateString('ar-EG')}</TableCell>
                                            <TableCell className="flex items-center gap-2">
                                                {getAccountTypeIcon(tx.accountId)}
                                                <span>{getAccountName(tx.accountId)}</span>
                                            </TableCell>
                                            <TableCell>{tx.description}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={tx.type === 'deposit' ? 'default' : 'destructive'}>
                                                    {tx.type === 'deposit' ? 'إيداع' : 'سحب'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={`text-center font-semibold ${tx.type === 'deposit' ? 'text-green-600' : 'text-destructive'}`}>
                                                {tx.amount.toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {sortedTransactions.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                                لا توجد حركات مسجلة.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </main>
    </>
    );
}

    
