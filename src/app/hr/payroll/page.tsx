
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
import useFirebase from '@/hooks/use-firebase';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface PayrollResult {
    employeeId: string;
    employeeName: string;
    basicSalary: number;
    totalAdvances: number;
    netSalary: number;
}

export default function PayrollPage() {
    const { data: employees, loading: loadingEmployees } = useFirebase<Employee>('employees');
    const { data: advances, loading: loadingAdvances } = useFirebase<EmployeeAdvance>('employeeAdvances');
    const { toast } = useToast();
    
    const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1));
    const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
    const [payrollData, setPayrollData] = useState<PayrollResult[] | null>(null);

    const loading = loadingEmployees || loadingAdvances;

    const handleCalculatePayroll = () => {
        if (!selectedMonth || !selectedYear) {
            toast({ variant: "destructive", title: "بيانات غير كاملة", description: "يرجى تحديد الشهر والسنة." });
            return;
        }

        const year = parseInt(selectedYear);
        const month = parseInt(selectedMonth);

        const results = employees.map(employee => {
            const employeeAdvances = advances.filter(advance => {
                const advanceDate = new Date(advance.date);
                return advance.employeeId === employee.id &&
                       advanceDate.getFullYear() === year &&
                       advanceDate.getMonth() + 1 === month;
            });

            const totalAdvances = employeeAdvances.reduce((sum, advance) => sum + advance.amount, 0);
            const netSalary = employee.basicSalary - totalAdvances;

            return {
                employeeId: employee.id,
                employeeName: employee.name,
                basicSalary: employee.basicSalary,
                totalAdvances: totalAdvances,
                netSalary: netSalary,
            };
        });
        
        setPayrollData(results);
        toast({ title: "تم احتساب الرواتب بنجاح" });
    };

    const handlePrint = () => {
        window.print();
    }

    const totalBasicSalaries = useMemo(() => payrollData?.reduce((sum, p) => sum + p.basicSalary, 0) || 0, [payrollData]);
    const totalDeductions = useMemo(() => payrollData?.reduce((sum, p) => sum + p.totalAdvances, 0) || 0, [payrollData]);
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
                         <Button disabled>
                            <FileText className="ml-2 h-4 w-4" />
                            ترحيل القيد المحاسبي
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="w-full overflow-auto border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>اسم الموظف</TableHead>
                                <TableHead className="text-center">الراتب الأساسي</TableHead>
                                <TableHead className="text-center">إجمالي السلف والخصومات</TableHead>
                                <TableHead className="text-center">صافي الراتب المستحق</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payrollData.map(p => (
                                <TableRow key={p.employeeId}>
                                    <TableCell>{p.employeeName}</TableCell>
                                    <TableCell className="text-center">{p.basicSalary.toLocaleString()} ج.م</TableCell>
                                    <TableCell className="text-center text-destructive">{p.totalAdvances > 0 ? `${p.totalAdvances.toLocaleString()} ج.م` : '-'}</TableCell>
                                    <TableCell className="text-center font-bold text-green-600">{p.netSalary.toLocaleString()} ج.م</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="font-bold bg-muted/50">
                                <TableCell>الإجمالي</TableCell>
                                <TableCell className="text-center">{totalBasicSalaries.toLocaleString()} ج.م</TableCell>
                                <TableCell className="text-center text-destructive">{totalDeductions.toLocaleString()} ج.م</TableCell>
                                <TableCell className="text-center text-green-600">{totalNetSalaries.toLocaleString()} ج.م</TableCell>
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
