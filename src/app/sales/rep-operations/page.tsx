
"use client";

import React, { useMemo } from 'react';
import PageHeader from "@/components/page-header";
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
import { Loader2 } from "lucide-react";
import useFirebase from "@/hooks/use-firebase";

// Data Interfaces
interface User {
    id: string;
    name: string;
    isSalesRep?: boolean;
}
interface IssueToRep {
    id: string;
    salesRepId: string;
    items: { id: string; qty: number; price: number }[];
}
interface ReturnFromRep {
    id: string;
    salesRepId: string;
    items: { id: string; qty: number; price?: number }[];
}
interface SaleInvoice {
    id: string;
    salesRepId: string;
    total: number;
    status?: 'pending' | 'approved';
}
interface RepRemittance {
    id: string;
    salesRepId: string;
    amount: number;
}

export default function RepOperationsPage() {
    const { data: users, loading: l1 } = useFirebase<User>('users');
    const { data: issues, loading: l2 } = useFirebase<IssueToRep>('stockIssuesToReps');
    const { data: returns, loading: l3 } = useFirebase<ReturnFromRep>('stockReturnsFromReps');
    const { data: sales, loading: l4 } = useFirebase<SaleInvoice>('salesInvoices');
    const { data: remittances, loading: l5 } = useFirebase<RepRemittance>('repRemittances');

    const loading = l1 || l2 || l3 || l4 || l5;

    const salesReps = users.filter(u => u.isSalesRep);

    const repData = useMemo(() => {
        return salesReps.map(rep => {
            const repIssues = issues.filter(i => i.salesRepId === rep.id);
            const repReturns = returns.filter(r => r.salesRepId === rep.id);
            const repSales = sales.filter(s => s.salesRepId === rep.id && s.status === 'approved');
            const repRemittances = remittances.filter(rem => rem.salesRepId === rep.id);

            const totalIssuedValue = repIssues.reduce((acc, issue) => 
                acc + issue.items.reduce((itemAcc, item) => itemAcc + (item.qty * item.price), 0), 0);

            const totalReturnValue = repReturns.reduce((acc, ret) => 
                acc + ret.items.reduce((itemAcc, item) => itemAcc + (item.qty * (item.price || 0)), 0), 0);

            const totalSalesValue = repSales.reduce((acc, sale) => acc + sale.total, 0);
            
            const totalRemittedValue = repRemittances.reduce((acc, rem) => acc + rem.amount, 0);
            
            // Balance = Total Sales - Total Remittances
            const currentBalance = totalSalesValue - totalRemittedValue;

            return {
                id: rep.id,
                name: rep.name,
                totalIssuedValue,
                totalReturnValue,
                totalSalesValue,
                totalRemittedValue,
                currentBalance
            };
        });
    }, [salesReps, issues, returns, sales, remittances]);

  return (
    <>
      <PageHeader title="مراقبة أداء المناديب" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>أرصدة و أداء المناديب</CardTitle>
            <CardDescription>
              نظرة عامة على أداء كل مندوب، بما في ذلك قيمة البضاعة المصروفة، المبيعات، التحصيلات، والرصيد الحالي.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="w-full overflow-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم المندوب</TableHead>
                      <TableHead className="text-center">قيمة البضاعة المصروفة</TableHead>
                      <TableHead className="text-center">قيمة المرتجعات</TableHead>
                      <TableHead className="text-center">إجمالي المبيعات</TableHead>
                      <TableHead className="text-center">إجمالي التوريدات</TableHead>
                      <TableHead className="text-center">الرصيد المستحق</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repData.map((rep) => (
                      <TableRow key={rep.id}>
                        <TableCell className="font-medium">{rep.name}</TableCell>
                        <TableCell className="text-center">{rep.totalIssuedValue.toLocaleString()}</TableCell>
                        <TableCell className="text-center">{rep.totalReturnValue.toLocaleString()}</TableCell>
                        <TableCell className="text-center text-green-600 font-semibold">{rep.totalSalesValue.toLocaleString()}</TableCell>
                        <TableCell className="text-center text-blue-600">{rep.totalRemittedValue.toLocaleString()}</TableCell>
                        <TableCell className={`text-center font-bold ${rep.currentBalance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                            {rep.currentBalance.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
