
"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Package,
  Users,
  Loader2,
  Warehouse,
  Coins,
} from "lucide-react";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useFirebase from "@/hooks/use-firebase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


// Interfaces for Firebase data
interface SaleInvoice {
  id: string;
  total: number;
  paidAmount: number;
  customerName: string;
  date: string;
  warehouseId: string;
  items: { id: string; qty: number; }[];
  status?: 'pending' | 'approved';
}
interface CustomerPayment {
    id: string;
    amount: number;
    paidToAccountId: string; // We can use this to filter by warehouse if cash accounts are linked
}
interface ExceptionalIncome {
    id: string;
    amount: number;
    warehouseId?: string;
}
interface PurchaseInvoice {
  id: string;
  warehouseId: string;
  items: { id: string; qty: number; }[];
  total: number;
}
interface Customer { id: string; }
interface Item {
  id: string;
  name: string;
  openingStock: number;
  cost?: number;
  price?: number;
  reorderPoint?: number;
}
interface WarehouseData { id: string; name: string; }
interface StockInRecord { id: string; warehouseId: string; items: { id: string; name: string; qty: number; }[]; }
interface StockOutRecord { id: string; sourceId: string; items: { id: string; name: string; qty: number; }[]; }
interface StockTransferRecord { id: string; fromSourceId: string; toSourceId: string; items: { id: string; qty: number; }[]; }
interface StockAdjustmentRecord { id: string; warehouseId: string; items: { itemId: string; difference: number; }[]; }
interface SalesReturn { id: string; warehouseId: string; items: { id: string; name: string; qty: number; }[]; }
interface PurchaseReturn { id: string; warehouseId: string; items: { id: string; name: string; qty: number; }[]; }
interface CashAccount { id: string; name: string; warehouseId?: string }

export default function Dashboard() {
  const { data: sales, loading: l1 } = useFirebase<SaleInvoice>("salesInvoices");
  const { data: purchases, loading: l2 } = useFirebase<PurchaseInvoice>("purchaseInvoices");
  const { data: customers, loading: l3 } = useFirebase<Customer>("customers");
  const { data: allItems, loading: l4 } = useFirebase<Item>("items");
  const { data: warehouses, loading: l5 } = useFirebase<WarehouseData>("warehouses");
  const { data: stockIns, loading: l6 } = useFirebase<StockInRecord>('stockInRecords');
  const { data: stockOuts, loading: l7 } = useFirebase<StockOutRecord>('stockOutRecords');
  const { data: transfers, loading: l8 } = useFirebase<StockTransferRecord>('stockTransferRecords');
  const { data: adjustments, loading: l9 } = useFirebase<StockAdjustmentRecord>('stockAdjustmentRecords');
  const { data: salesReturns, loading: l10 } = useFirebase<SalesReturn>('salesReturns');
  const { data: purchaseReturns, loading: l11 } = useFirebase<PurchaseReturn>('purchaseReturns');
  const { data: customerPayments, loading: l12 } = useFirebase<CustomerPayment>('customerPayments');
  const { data: exceptionalIncomes, loading: l13 } = useFirebase<ExceptionalIncome>('exceptionalIncomes');
  const { data: cashAccounts, loading: l14 } = useFirebase<CashAccount>('cashAccounts');
  
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const loading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9 || l10 || l11 || l12 || l13 || l14;
  
  React.useEffect(() => {
    if (warehouses.length > 0 && selectedWarehouseId === 'all') {
      setSelectedWarehouseId(warehouses[0].id);
    }
  }, [warehouses, selectedWarehouseId]);

  const dashboardData = useMemo(() => {
    
     const filterByDate = (collection: any[]) => {
      if (!dateRange.from && !dateRange.to) return collection;
      return collection.filter(item => {
        const itemDate = new Date(item.date);
        const from = dateRange.from ? new Date(dateRange.from) : null;
        const to = dateRange.to ? new Date(dateRange.to) : null;
        if (from && itemDate < from) return false;
        if (to && itemDate > to) return false;
        return true;
      });
    };

    const filterByWarehouse = (collection: any[], idField: string) => {
        if (selectedWarehouseId === 'all') return collection;
        return collection.filter(item => item[idField] === selectedWarehouseId);
    };
    
    // Get cash accounts linked to the selected warehouse
    const warehouseCashAccountIds = cashAccounts
        .filter(acc => acc.warehouseId === selectedWarehouseId)
        .map(acc => acc.id);

    const approvedSales = sales.filter(s => s.status === 'approved');
    const filteredSales = filterByWarehouse(filterByDate(approvedSales), 'warehouseId');

    const receiptsFromInvoicePayments = filteredSales.reduce((acc, sale) => acc + (sale.paidAmount || 0), 0);
    const receiptsFromCustomerPayments = filterByDate(customerPayments)
        .filter(p => selectedWarehouseId === 'all' || warehouseCashAccountIds.includes(p.paidToAccountId))
        .reduce((acc, payment) => acc + payment.amount, 0);
    const receiptsFromExceptionalIncomes = filterByWarehouse(filterByDate(exceptionalIncomes), 'warehouseId').reduce((acc, income) => acc + income.amount, 0);
    
    const totalReceipts = receiptsFromInvoicePayments + receiptsFromCustomerPayments + receiptsFromExceptionalIncomes;
    
    const totalSalesCount = filteredSales.length;
    const totalCustomers = customers.length; // This is not warehouse-specific

    const warehouseItems = allItems.map(item => {
        let stock = item.openingStock || 0;
        
        // Increases
        purchases.filter(p => p.warehouseId === selectedWarehouseId).forEach(p => p.items.filter(i => i.id === item.id).forEach(i => stock += i.qty));
        stockIns.filter(si => si.warehouseId === selectedWarehouseId).forEach(si => si.items.filter(i => i.id === item.id).forEach(i => stock += i.qty));
        transfers.filter(t => t.toSourceId === selectedWarehouseId).forEach(t => t.items.filter(i => i.id === item.id).forEach(i => stock += i.qty));
        adjustments.filter(adj => adj.warehouseId === selectedWarehouseId).forEach(adj => adj.items.filter(i => i.itemId === item.id && i.difference > 0).forEach(i => stock += i.difference));
        salesReturns.filter(sr => sr.warehouseId === selectedWarehouseId).forEach(sr => sr.items.filter(i => i.id === item.id).forEach(i => stock += i.qty));

        // Decreases
        sales.filter(s => s.warehouseId === selectedWarehouseId && s.status === 'approved').forEach(s => s.items.filter(i => i.id === item.id).forEach(i => stock -= i.qty));
        stockOuts.filter(so => so.sourceId === selectedWarehouseId).forEach(so => so.items.filter(i => i.id === item.id).forEach(i => stock -= i.qty));
        transfers.filter(t => t.fromSourceId === selectedWarehouseId).forEach(t => t.items.filter(i => i.id === item.id).forEach(i => stock -= i.qty));
        adjustments.filter(adj => adj.warehouseId === selectedWarehouseId).forEach(adj => adj.items.filter(i => i.itemId === item.id && i.difference < 0).forEach(i => stock += i.difference));
        purchaseReturns.filter(pr => pr.warehouseId === selectedWarehouseId).forEach(pr => pr.items.filter(i => i.id === item.id).forEach(i => stock -= i.qty));

        return { ...item, currentStock: stock };
    });

    const inventoryValue = warehouseItems.reduce((acc, item) => acc + (item.currentStock * (item.cost || item.price || 0)), 0);
    const lowStockItems = warehouseItems.filter(item => item.currentStock <= (item.reorderPoint || 0)).slice(0, 5);
    const recentTransactions = filteredSales.slice(-5).reverse();

    return { totalReceipts, totalSalesCount, totalCustomers, inventoryValue, lowStockItems, recentTransactions };
  }, [selectedWarehouseId, dateRange, sales, purchases, customers, allItems, warehouses, stockIns, stockOuts, transfers, adjustments, salesReturns, purchaseReturns, customerPayments, exceptionalIncomes, cashAccounts]);


  if (loading && !warehouses.length) {
    return (
        <div className="flex flex-1 justify-center items-center">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
    )
  }

  return (
    <>
      <PageHeader title="لوحة التحكم">
        <div className="flex flex-col sm:flex-row items-center gap-2">
            <Label htmlFor="warehouse-select" className="text-sm font-medium">المخزن:</Label>
           <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
            <SelectTrigger id="warehouse-select" className="w-[180px] bg-card" disabled={loading || warehouses.length === 0}>
              <SelectValue placeholder="اختر مخزنًا" />
            </SelectTrigger>
            <SelectContent>
                {warehouses.map(warehouse => ( <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem> ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
            <CardHeader>
                <CardTitle>فلاتر العرض</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                     <div className="space-y-2">
                        <Label>من تاريخ</Label>
                        <Input type="date" value={dateRange.from} onChange={(e) => setDateRange(prev => ({...prev, from: e.target.value}))} />
                    </div>
                     <div className="space-y-2">
                        <Label>إلى تاريخ</Label>
                        <Input type="date" value={dateRange.to} onChange={(e) => setDateRange(prev => ({...prev, to: e.target.value}))} />
                    </div>
                </div>
            </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                إجمالي المقبوضات
              </CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">ج.م {dashboardData.totalReceipts.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                إجمالي النقدية المحصلة في الفترة
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                إجمالي العملاء
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">+{dashboardData.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">
                إجمالي عملاء الشركة
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">+{dashboardData.totalSalesCount}</div>
              <p className="text-xs text-muted-foreground">
                عدد فواتير المخزن في الفترة
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                قيمة المخزون
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">ج.م {dashboardData.inventoryValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                القيمة التقديرية للمخزن المحدد
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle>المعاملات الأخيرة</CardTitle>
                <CardDescription>
                  آخر فواتير البيع الصادرة من المخزن المحدد.
                </CardDescription>
              </div>
              <Button asChild size="sm" className="mr-auto gap-1">
                <Link href="/sales/invoices/list">
                  عرض الكل
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>العميل</TableHead>
                      <TableHead>
                        الحالة
                      </TableHead>
                      <TableHead>
                        التاريخ
                      </TableHead>
                      <TableHead className="text-left">المبلغ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData.recentTransactions.length > 0 ? dashboardData.recentTransactions.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          <div className="font-medium">{sale.customerName || 'عميل غير محدد'}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className="text-xs" variant="outline">
                            موافق عليه
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(sale.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-left">ج.م {sale.total.toLocaleString()}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">لا توجد معاملات حديثة.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-4 lg:col-span-3">
            <CardHeader>
              <CardTitle>عناصر على وشك النفاذ</CardTitle>
              <CardDescription>
                المخزون الحالي أقل من أو يساوي حد الطلب.
              </CardDescription>
            </CardHeader>
            <CardContent>
            <div className="space-y-4">
              {dashboardData.lowStockItems.length > 0 ? dashboardData.lowStockItems.map((item, i) => (
                <div className="flex items-center" key={item.id}>
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={`https://placehold.co/100x100.png`} alt="Avatar" data-ai-hint="product" />
                    <AvatarFallback>P{i+1}</AvatarFallback>
                  </Avatar>
                  <div className="mx-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{item.name}</p>
                    <p className="text-sm text-muted-foreground">SKU: {item.id.slice(0,6).toUpperCase()}</p>
                  </div>
                  <div className="mr-auto font-medium text-destructive">{item.currentStock} وحدات</div>
                </div>
              )) : (
                <div className="text-center text-muted-foreground py-4">لا توجد أصناف على وشك النفاذ.</div>
              )}
            </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
