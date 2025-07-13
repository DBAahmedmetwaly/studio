
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
import { PlusCircle, Loader2, ArrowUpCircle, ArrowDownCircle, Wallet, Landmark, User } from "lucide-react";
import useFirebase from '@/hooks/use-firebase';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/auth-context';


interface CashAccount {
    id: string;
    name: string;
    type: 'cash' | 'bank';
    openingBalance: number;
    salesRepId?: string;
}

interface TreasuryTransaction {
    id?: string;
    date: string;
    amount: number;
    description: string;
    accountId: string;
    type: 'deposit' | 'withdrawal';
    receiptNumber?: string;
    createdById?: string;
    createdByName?: string;
}

interface Expense { id: string; amount: number; paidFromAccountId: string; }
interface SupplierPayment { id: string; amount: number; paidFromAccountId: string; }
interface EmployeeAdvance { id: string; amount: number; paidFromAccountId: string; }
interface CustomerPayment { id: string; amount: number; paidToAccountId: string; }


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
    
    // Filter out rep accounts for direct transactions
    const filteredAccounts = cashAccounts.filter(acc => !acc.salesRepId);


    return (
        <form onSubmit={handleSubmit}>
            <Tabs defaultValue="deposit" className="w-full" onValueChange={(v) => setFormData({...formData, type: v as any})}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="deposit"><ArrowDownCircle className="ml-2 h-4 w-4" />إيداع (زيادة رأس مال)</TabsTrigger>
                    <TabsTrigger value="withdrawal"><ArrowUpCircle className="ml-2 h-4 w-4" />سحب (مسحوبات شخصية)</TabsTrigger>
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
                            {filteredAccounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
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
    const { data: transactions, loading: loadingTxs, add, getNextId } = useFirebase<TreasuryTransaction>('treasuryTransactions');
    const { data: cashAccounts, loading: loadingAccounts } = useFirebase<CashAccount>('cashAccounts');
    const { data: expenses, loading: l_exp } = useFirebase<Expense>('expenses');
    const { data: supplierPayments, loading: l_sp } = useFirebase<SupplierPayment>('supplierPayments');
    const { data: employeeAdvances, loading: l_ea } = useFirebase<EmployeeAdvance>('employeeAdvances');
    const { data: customerPayments, loading: l_cp } = useFirebase<CustomerPayment>('customerPayments');
    const { data: salesReps, loading: l_sr } = useFirebase<User>('users');
    const { toast } = useToast();
    const { user } = useAuth();
    
    const loading = loadingTxs || loadingAccounts || l_exp || l_sp || l_ea || l_cp || l_sr;
    
    const getAccountName = (accountId: string) => cashAccounts.find(acc => acc.id === accountId)?.name || 'غير معروف';
    const getAccountTypeIcon = (accountId: string) => {
        const account = cashAccounts.find(acc => acc.id === accountId);
        if (!account) return null;
        if (account.salesRepId) return <User className="h-4 w-4 text-muted-foreground" />;
        if (account.type === 'bank') return <Landmark className="h-4 w-4 text-muted-foreground" />;
        return <Wallet className="h-4 w-4 text-muted-foreground" />;
    };

    const handleSave = async (data: Omit<TreasuryTransaction, 'id' | 'receiptNumber'>) => {
        try {
            const receiptNumber = `ح-خ-${await getNextId('treasuryTransaction')}`;
            
            const newTransaction: TreasuryTransaction = {
                ...data,
                receiptNumber,
                createdById: user?.id,
                createdByName: user?.name,
            };
            await add(newTransaction);
            toast({ title: "تمت إضافة الحركة بنجاح" });
        } catch (error) {
            toast({ variant: "destructive", title: "حدث خطأ", description: "فشل حفظ الحركة" });
        }
    };

    const accountBalances = useMemo(() => {
        return cashAccounts.map(account => {
            const openingBalance = account.openingBalance || 0;

            const totalDeposits = customerPayments
                .filter(p => p.paidToAccountId === account.id)
                .reduce((sum, p) => sum + p.amount, 0);

            const totalWithdrawals = [
                ...expenses.filter(ex => ex.paidFromAccountId === account.id),
                ...supplierPayments.filter(sp => sp.paidFromAccountId === account.id),
                ...employeeAdvances.filter(ea => ea.paidFromAccountId === account.id)
            ].reduce((sum, item) => sum + item.amount, 0);
            
            // Handle direct treasury transactions
            const directDeposits = transactions.filter(tx => tx.accountId === account.id && tx.type === 'deposit').reduce((s,tx)=>s+tx.amount,0);
            const directWithdrawals = transactions.filter(tx => tx.accountId === account.id && tx.type === 'withdrawal').reduce((s,tx)=>s+tx.amount,0);

            const currentBalance = openingBalance + totalDeposits + directDeposits - totalWithdrawals - directWithdrawals;

            return {
                ...account,
                currentBalance
            };
        });
    }, [cashAccounts, transactions, expenses, supplierPayments, employeeAdvances, customerPayments]);
    
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
                <CardDescription>نظرة سريعة على الأرصدة الحالية في الخزائن والبنوك وعهدات المناديب.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {accountBalances.map(acc => (
                             <Card key={acc.id} className={acc.salesRepId ? 'bg-muted/50' : ''}>
                                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                     <CardTitle className="text-sm font-medium">{acc.name}</CardTitle>
                                     {getAccountTypeIcon(acc.id)}
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
                <CardTitle>إضافة حركة جديدة (رأس مال/مسحوبات)</CardTitle>
                <CardDescription>
                سجل عمليات إيداع رأس المال أو سحب الشركاء من الخزائن الرئيسية فقط.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? <div className="flex justify-center items-center"><Loader2 className="animate-spin" /></div> : <TransactionForm onSave={handleSave} cashAccounts={cashAccounts} onClose={()=>{}} />}
            </CardContent>
            </Card>
            
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>سجل حركات رأس المال والمسحوبات</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                         <div className="w-full overflow-auto max-h-96">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>الحساب</TableHead>
                                        <TableHead className="hidden md:table-cell">البيان</TableHead>
                                        <TableHead className="text-center hidden sm:table-cell">النوع</TableHead>
                                        <TableHead className="text-center">المبلغ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedTransactions.map(tx => (
                                        <TableRow key={tx.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2 font-medium">
                                                    {getAccountTypeIcon(tx.accountId)}
                                                    <span>{getAccountName(tx.accountId)}</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground md:hidden">{tx.description}</div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">{tx.description}</TableCell>
                                            <TableCell className="text-center hidden sm:table-cell">
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
