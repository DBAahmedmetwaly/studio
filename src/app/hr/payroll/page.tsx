
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
import { PlusCircle, Loader2, Calculator, Printer, FileText } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddEntityDialog } from '@/components/add-entity-dialog';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-provider';

interface Employee {
  id: string;
  name: string;
  basicSalary: number;
}

interface EmployeeAdvance {
    id: string;
    date: string;
    amount: number;
    employeeId: string;
}

interface EmployeeAdjustment {
    id: string;
    date: string;
    employeeId: string;
    type: 'reward' | 'penalty';
    amount: number;
}

interface CashAccount {
    id: string;
    name: string;
}

interface PayrollResult {
    employeeId: string;
    employeeName: string;
    basicSalary: number;
    totalAdvances: number;
    totalRewards: number;
    totalPenalties: number;
    netSalary: number;
}


const PaymentDialogContent = ({ onConfirm, cashAccounts, onClose }: { onConfirm: (accountId: string) => void, cashAccounts: CashAccount[], onClose: () => void }) => {
    const [selectedAccountId, setSelectedAccountId] = useState('');

    const handleConfirm = () => {
        if (!selectedAccountId) {
            alert('Please select a payment account.');
            return;
        }
        onConfirm(selectedAccountId);
        onClose();
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="payment-account">حساب الدفع</Label>
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                    <SelectTrigger id="payment-account">
                        <SelectValue placeholder="اختر حساب الخزينة/البنك" />
                    </SelectTrigger>
                    <SelectContent>
                        {cashAccounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex justify-end">
                <Button onClick={handleConfirm}>تأكيد الصرف</Button>
            </div>
        </div>
    )
}


export default function PayrollPage() {
    const { employees, employeeAdvances, employeeAdjustments, cashAccounts, dbAction, getNextId, loading } = useData();
    const { user } = useAuth();
    const { toast } = useToast();
    
    const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1));
    const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
    const [payrollData, setPayrollData] = useState<PayrollResult[] | null>(null);
    const [isPosting, setIsPosting] = useState(false);

    const handleCalculatePayroll = () => {
        if (!selectedMonth || !selectedYear) {
            toast({ variant: "destructive", title: "بيانات غير كاملة", description: "يرجى تحديد الشهر والسنة." });
            return;
        }

        const year = parseInt(selectedYear);
        const month = parseInt(selectedMonth);

        const results = employees.map(employee => {
            const filterByMonth = (item: { date: string, employeeId: string }) => {
                const itemDate = new Date(item.date);
                return item.employeeId === employee.id &&
                       itemDate.getFullYear() === year &&
                       itemDate.getMonth() + 1 === month;
            }

            const totalAdvances = employeeAdvances
                .filter(filterByMonth)
                .reduce((sum, item) => sum + item.amount, 0);

            const totalRewards = employeeAdjustments
                .filter(item => item.type === 'reward' && filterByMonth(item))
                .reduce((sum, item) => sum + item.amount, 0);

            const totalPenalties = employeeAdjustments
                .filter(item => item.type === 'penalty' && filterByMonth(item))
                .reduce((sum, item) => sum + item.amount, 0);
            
            const netSalary = employee.basicSalary + totalRewards - totalAdvances - totalPenalties;

            return {
                employeeId: employee.id,
                employeeName: employee.name,
                basicSalary: employee.basicSalary,
                totalAdvances: totalAdvances,
                totalRewards: totalRewards,
                totalPenalties: totalPenalties,
                netSalary: netSalary,
            };
        });
        
        setPayrollData(results);
        toast({ title: "تم احتساب الرواتب بنجاح" });
    };

    const handlePostJournalEntry = async (accountId: string) => {
        if (!payrollData) return;
        setIsPosting(true);

        const monthName = months.find(m => m.value === selectedMonth)?.label;
        const totalNet = payrollData.reduce((sum, p) => sum + p.netSalary, 0);

        try {
            if (totalNet > 0) {
                 await dbAction('treasuryTransactions', 'add', {
                    date: new Date(parseInt(selectedYear), parseInt(selectedMonth) -1, 28).toISOString(),
                    amount: totalNet,
                    accountId: accountId,
                    type: 'withdrawal',
                    description: `صرف رواتب شهر ${monthName} ${selectedYear}`,
                    receiptNumber: `م-${await getNextId('expense')}`, // Use expense counter for consistency
                    createdById: user?.id,
                    createdByName: user?.name,
                    isPayroll: true // Special flag for journal entry
                });
            }
            
            toast({ title: "تم الترحيل بنجاح", description: "تم تسجيل حركة صرف الرواتب من الخزينة." });
            setPayrollData(null); // Reset the view after posting
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "خطأ", description: "فشل ترحيل قيد الرواتب." });
        } finally {
            setIsPosting(false);
        }
    }


    const handlePrint = () => {
        window.print();
    }

    const totalBasicSalaries = useMemo(() => payrollData?.reduce((sum, p) => sum + p.basicSalary, 0) || 0, [payrollData]);
    const totalAdvances = useMemo(() => payrollData?.reduce((sum, p) => sum + p.totalAdvances, 0) || 0, [payrollData]);
    const totalRewards = useMemo(() => payrollData?.reduce((sum, p) => sum + p.totalRewards, 0) || 0, [payrollData]);
    const totalPenalties = useMemo(() => payrollData?.reduce((sum, p) => sum + p.totalPenalties, 0) || 0, [payrollData]);
    const totalNetSalaries = useMemo(() => payrollData?.reduce((sum, p) => sum + p.netSalary, 0) || 0, [payrollData]);
    
    const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i));
    const months = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: new Date(0, i).toLocaleString('ar-EG', { month: 'long' }) }));

    return (
    <>
      <PageHeader title="احتساب الرواتب" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card className="no-print">
            <CardHeader>
                <CardTitle>تحديد فترة الرواتب</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="month">الشهر</Label>
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger id="month">
                                <SelectValue placeholder="اختر الشهر" />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                         <Label htmlFor="year">السنة</Label>
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger id="year">
                                <SelectValue placeholder="اختر السنة" />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-end">
                        <Button className="w-full" onClick={handleCalculatePayroll} disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" /> : <Calculator className="ml-2 h-4 w-4" />}
                            احتساب الرواتب
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>

        {payrollData && (
             <Card className="printable-area">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>كشف رواتب شهر {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</CardTitle>
                        <CardDescription>
                            عرض تفصيلي لرواتب الموظفين والخصومات وصافي المستحق.
                        </CardDescription>
                    </div>
                    <div className="flex gap-2 no-print">
                        <Button variant="outline" onClick={handlePrint}>
                            <Printer className="ml-2 h-4 w-4" />
                            طباعة
                        </Button>
                        <AddEntityDialog
                            title="تأكيد صرف الرواتب"
                            description="اختر الحساب الذي سيتم صرف الرواتب منه لتسجيل حركة السحب من الخزينة."
                            triggerButton={
                                 <Button disabled={isPosting}>
                                    {isPosting ? <Loader2 className="animate-spin ml-2 h-4 w-4"/> : <FileText className="ml-2 h-4 w-4" />}
                                    {isPosting ? 'جارٍ الترحيل...' : 'ترحيل حركة الصرف'}
                                </Button>
                            }
                        >
                            <PaymentDialogContent onConfirm={handlePostJournalEntry} cashAccounts={cashAccounts} onClose={() => {}} />
                        </AddEntityDialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="w-full overflow-auto border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>اسم الموظف</TableHead>
                                <TableHead className="text-center">الراتب الأساسي</TableHead>
                                <TableHead className="text-center">المكافآت</TableHead>
                                <TableHead className="text-center">السلف</TableHead>
                                <TableHead className="text-center">الجزاءات</TableHead>
                                <TableHead className="text-center">صافي الراتب</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payrollData.map(p => (
                                <TableRow key={p.employeeId}>
                                    <TableCell>{p.employeeName}</TableCell>
                                    <TableCell className="text-center">{p.basicSalary.toLocaleString()} ج.م</TableCell>
                                    <TableCell className="text-center text-green-600">{p.totalRewards > 0 ? `${p.totalRewards.toLocaleString()} ج.م` : '-'}</TableCell>
                                    <TableCell className="text-center text-destructive">{p.totalAdvances > 0 ? `${p.totalAdvances.toLocaleString()} ج.م` : '-'}</TableCell>
                                    <TableCell className="text-center text-destructive">{p.totalPenalties > 0 ? `${p.totalPenalties.toLocaleString()} ج.م` : '-'}</TableCell>
                                    <TableCell className="text-center font-bold text-primary">{p.netSalary.toLocaleString()} ج.م</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="font-bold bg-muted/50">
                                <TableCell>الإجمالي</TableCell>
                                <TableCell className="text-center">{totalBasicSalaries.toLocaleString()} ج.م</TableCell>
                                <TableCell className="text-center text-green-600">{totalRewards.toLocaleString()} ج.م</TableCell>
                                <TableCell className="text-center text-destructive">{totalAdvances.toLocaleString()} ج.م</TableCell>
                                <TableCell className="text-center text-destructive">{totalPenalties.toLocaleString()} ج.م</TableCell>
                                <TableCell className="text-center text-primary">{totalNetSalaries.toLocaleString()} ج.م</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                    </div>
                </CardContent>
            </Card>
        )}
      </main>
    </>
    );
}
