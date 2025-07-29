
"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ArrowUpRight,
  CreditCard,
  Package,
  Users,
  Loader2,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useData } from "@/contexts/data-provider";

// Interfaces for Firebase data
interface SaleInvoice {
  id: string;
  total: number;
  paidAmount?: number;
  customerName: string;
  date: string;
  warehouseId: string;
  items: { id: string; qty: number; }[];
  status?: 'pending' | 'approved';
}
interface CustomerPayment {
    id: string;
    amount: number;
    paidToAccountId: string;
    date: string;
}
interface ExceptionalIncome {
    id: string;
    amount: number;
    warehouseId?: string;
    date: string;
}
interface PurchaseInvoice { id: string; warehouseId: string; items: { id: string; qty: number; cost?: number; }[]; total: number; date: string; }
interface Customer { id: string; }
interface Item {
  id: string;
  name: string;
  cost?: number;
  price?: number;
  reorderPoint?: number;
}
interface WarehouseData { id: string; name: string; autoStockUpdate?: boolean; }
interface StockInRecord { id: string; warehouseId: string; items: { id: string; name: string; qty: number; cost?: number; }[]; date: string; }
interface StockOutRecord { id: string; sourceId: string; items: { id: string; name: string; qty: number; }[]; date: string; }
interface StockTransferRecord { id: string; fromSourceId: string; toSourceId: string; items: { id: string; qty: number; }[]; date: string; }
interface StockAdjustmentRecord { id: string; warehouseId: string; items: { itemId: string; difference: number; }[]; date: string; }
interface SalesReturn { id: string; warehouseId: string; items: { id: string; name: string; qty: number; }[]; date: string; }
interface PurchaseReturn { id: string; warehouseId: string; items: { id: string; name: string; qty: number; }[]; date: string; }
interface CashAccount { id: string; name: string; warehouseId?: string }
interface IssueToRep { id: string; warehouseId: string; items: { id: string; qty: number; }[]; date: string; }
interface ReturnFromRep { id: string; warehouseId: string; items: { id: string; qty: number; }[]; date: string; }
interface InventoryClosing { id: string; warehouseId: string; closingDate: string; balances: { itemId: string, balance: number }[] }

export default function Dashboard() {
  const { 
    salesInvoices, customers, items, warehouses,
    cashAccounts, customerPayments, exceptionalIncomes,
    purchaseInvoices, stockInRecords, stockOutRecords, 
    stockTransferRecords, stockAdjustmentRecords, 
    salesReturns, purchaseReturns, stockIssuesToReps,
    stockReturnsFromReps,
    inventoryClosings,
    loading 
  } = useData();
  
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

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
        if (from) from.setHours(0,0,0,0);
        if (to) to.setHours(23,59,59,999);
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
        .filter((acc:any) => acc.warehouseId === selectedWarehouseId)
        .map((acc:any) => acc.id);

    const approvedSales = salesInvoices.filter((s:any) => s.status === 'approved');
    const filteredSales = filterByWarehouse(filterByDate(approvedSales), 'warehouseId');

    const receiptsFromInvoicePayments = filteredSales.reduce((acc:number, sale:any) => acc + (sale.paidAmount || 0), 0);
    const receiptsFromCustomerPayments = filterByDate(customerPayments)
        .filter((p:any) => selectedWarehouseId === 'all' || warehouseCashAccountIds.includes(p.paidToAccountId))
        .reduce((acc:number, payment:any) => acc + payment.amount, 0);
    const receiptsFromExceptionalIncomes = filterByWarehouse(filterByDate(exceptionalIncomes), 'warehouseId').reduce((acc:number, income:any) => acc + income.amount, 0);
    
    const totalReceipts = receiptsFromInvoicePayments + receiptsFromCustomerPayments + receiptsFromExceptionalIncomes;
    
    const totalSalesCount = filteredSales.length;
    const totalCustomers = customers.length; // This is not warehouse-specific

    const warehouseItems = items.map((item: any) => {
        const closingsForWarehouse = inventoryClosings.filter((c: InventoryClosing) => c.warehouseId === selectedWarehouseId);
        const lastClosing = closingsForWarehouse.length > 0
            ? closingsForWarehouse.reduce((latest: any, current: any) => new Date(latest.closingDate) > new Date(current.closingDate) ? latest : current)
            : null;
        const lastClosingDate = lastClosing ? new Date(lastClosing.closingDate) : new Date(0);
        
        let stock = lastClosing?.balances.find((b: any) => b.itemId === item.id)?.balance || 0;
        
        const filterTransactions = (t: any) => new Date(t.date) > lastClosingDate;

        const warehouse = warehouses.find((w: WarehouseData) => w.id === selectedWarehouseId);
        const autoStockUpdate = warehouse?.autoStockUpdate;

        // Increases
        if (autoStockUpdate) {
            purchaseInvoices.filter(p => p.warehouseId === selectedWarehouseId && filterTransactions(p)).forEach(p => p.items.filter(i => i.id === item.id).forEach(i => stock += i.qty));
        }
        stockInRecords.filter(si => si.warehouseId === selectedWarehouseId && filterTransactions(si)).forEach(si => si.items.filter(i => i.id === item.id).forEach(i => stock += i.qty));
        stockTransferRecords.filter(t => t.toSourceId === selectedWarehouseId && filterTransactions(t)).forEach(t => t.items.filter(i => i.id === item.id).forEach(i => stock += i.qty));
        stockAdjustmentRecords.filter(adj => adj.warehouseId === selectedWarehouseId && filterTransactions(adj)).forEach(adj => adj.items.filter(i => i.itemId === item.id && i.difference > 0).forEach(i => stock += i.difference));
        salesReturns.filter(sr => sr.warehouseId === selectedWarehouseId && filterTransactions(sr)).forEach(sr => sr.items.filter(i => i.id === item.id).forEach(i => stock += i.qty));
        stockReturnsFromReps.filter(rfr => rfr.warehouseId === selectedWarehouseId && filterTransactions(rfr)).forEach(rfr => rfr.items.filter(i => i.id === item.id).forEach(i => stock += i.qty));

        // Decreases
        salesInvoices.filter(s => s.warehouseId === selectedWarehouseId && s.status === 'approved' && filterTransactions(s)).forEach(s => s.items.filter(i => i.id === item.id).forEach(i => stock -= i.qty));
        stockOutRecords.filter(so => so.sourceId === selectedWarehouseId && filterTransactions(so)).forEach(so => so.items.filter(i => i.id === item.id).forEach(i => stock -= i.qty));
        stockTransferRecords.filter(t => t.fromSourceId === selectedWarehouseId && filterTransactions(t)).forEach(t => t.items.filter(i => i.id === item.id).forEach(i => stock -= i.qty));
        stockAdjustmentRecords.filter(adj => adj.warehouseId === selectedWarehouseId && filterTransactions(adj)).forEach(adj => adj.items.filter(i => i.itemId === item.id && i.difference < 0).forEach(i => stock += i.difference));
        purchaseReturns.filter(pr => pr.warehouseId === selectedWarehouseId && filterTransactions(pr)).forEach(pr => pr.items.filter(i => i.id === item.id).forEach(i => stock -= i.qty));
        stockIssuesToReps.filter(itr => itr.warehouseId === selectedWarehouseId && filterTransactions(itr)).forEach(itr => itr.items.filter(i => i.id === item.id).forEach(i => stock -= i.qty));
        
        return { ...item, currentStock: stock };
    });

    const inventoryValue = warehouseItems.reduce((acc: number, item: any) => {
        if (item.currentStock <= 0) return acc;
        const lastPurchase = purchaseInvoices
            .filter((p: PurchaseInvoice) => p.warehouseId === selectedWarehouseId && p.items.some(pi => pi.id === item.id && pi.cost))
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        let lastCost = item.cost || 0;
        if(lastPurchase) {
            const purchasedItem = lastPurchase.items.find(pi => pi.id === item.id);
            if(purchasedItem && typeof purchasedItem.cost === 'number') {
                lastCost = purchasedItem.cost;
            }
        }
        return acc + (item.currentStock * lastCost);
    }, 0);


    const lowStockItems = warehouseItems.filter((item:any) => item.reorderPoint > 0 && item.currentStock <= item.reorderPoint).slice(0, 5);
    const recentTransactions = filteredSales.slice(-5).reverse();

    return { totalReceipts, totalSalesCount, totalCustomers, inventoryValue, lowStockItems, recentTransactions };
  }, [selectedWarehouseId, dateRange, salesInvoices, customers, items, warehouses, cashAccounts, customerPayments, exceptionalIncomes, purchaseInvoices, stockInRecords, stockOutRecords, stockTransferRecords, stockAdjustmentRecords, salesReturns, purchaseReturns, stockIssuesToReps, stockReturnsFromReps, inventoryClosings]);


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
                {warehouses.map((warehouse: any) => ( <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem> ))}
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
                قيمة المخزون (بالتكلفة)
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">ج.م {dashboardData.inventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
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
                    {dashboardData.recentTransactions.length > 0 ? dashboardData.recentTransactions.map((sale:any) => (
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
