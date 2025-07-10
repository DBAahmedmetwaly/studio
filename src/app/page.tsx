
"use client";

import React from "react";
import {
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Package,
  Users,
  Loader2,
  Warehouse
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

// Interfaces for Firebase data
interface SaleInvoice {
  id: string;
  total: number;
  customerName: string;
  date: string;
}
interface Customer {
  id: string;
}
interface Item {
  id: string;
  name: string;
  openingStock: number;
  price: number;
}
interface WarehouseData {
  id: string;
  name: string;
}

export default function Dashboard() {
  const { data: sales, loading: loadingSales } = useFirebase<SaleInvoice>("salesInvoices");
  const { data: customers, loading: loadingCustomers } = useFirebase<Customer>("customers");
  const { data: items, loading: loadingItems } = useFirebase<Item>("items");
  const { data: warehouses, loading: loadingWarehouses } = useFirebase<WarehouseData>("warehouses");

  const loading = loadingSales || loadingCustomers || loadingItems || loadingWarehouses;

  const totalRevenue = sales.reduce((acc, sale) => acc + sale.total, 0);
  const totalSalesCount = sales.length;
  const totalCustomers = customers.length;
  const inventoryValue = items.reduce((acc, item) => acc + (item.openingStock || 0) * (item.price || 0), 0);

  const lowStockItems = items.filter(item => (item.openingStock || 0) <= 10).slice(0, 5);
  const recentTransactions = sales.slice(-5).reverse();

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
        <div className="flex items-center space-x-2">
          <label htmlFor="warehouse-select" className="text-sm font-medium">
            المخزن:
          </label>
           <Select defaultValue={warehouses[0]?.id}>
            <SelectTrigger
              id="warehouse-select"
              className="w-auto md:w-[180px] bg-card"
              disabled={loadingWarehouses || warehouses.length === 0}
            >
              <SelectValue placeholder="اختر مخزنًا" />
            </SelectTrigger>
            <SelectContent>
                {warehouses.map(warehouse => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                إجمالي الإيرادات
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">ج.م {totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +20.1% عن الشهر الماضي
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
              <div className="text-2xl font-bold font-headline">+{totalCustomers}</div>
              <p className="text-xs text-muted-foreground">
                +180.1% عن الشهر الماضي
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">+{totalSalesCount}</div>
              <p className="text-xs text-muted-foreground">
                +19% عن الشهر الماضي
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
              <div className="text-2xl font-bold font-headline">ج.م {inventoryValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +2% عن الشهر الماضي
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
                  آخر فواتير البيع الصادرة.
                </CardDescription>
              </div>
              <Button asChild size="sm" className="mr-auto gap-1">
                <Link href="/sales/invoices">
                  عرض الكل
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العميل</TableHead>
                    <TableHead className="hidden xl:table-column">
                      الحالة
                    </TableHead>
                    <TableHead className="hidden xl:table-column">
                      التاريخ
                    </TableHead>
                    <TableHead className="text-left">المبلغ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.length > 0 ? recentTransactions.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <div className="font-medium">{sale.customerName || 'عميل غير محدد'}</div>
                      </TableCell>
                      <TableCell className="hidden xl:table-column">
                        <Badge className="text-xs" variant="outline">
                          موافق عليه
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell lg:hidden xl:table-column">
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
            </CardContent>
          </Card>
          <Card className="col-span-4 lg:col-span-3">
            <CardHeader>
              <CardTitle>عناصر على وشك النفاذ</CardTitle>
              <CardDescription>
                هذه العناصر مخزونها قليل (الرصيد الافتتاحي أقل من 10).
              </CardDescription>
            </CardHeader>
            <CardContent>
            <div className="space-y-4">
              {lowStockItems.length > 0 ? lowStockItems.map((item, i) => (
                <div className="flex items-center" key={item.id}>
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={`https://placehold.co/100x100.png`} alt="Avatar" data-ai-hint="product" />
                    <AvatarFallback>P{i+1}</AvatarFallback>
                  </Avatar>
                  <div className="mx-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{item.name}</p>
                    <p className="text-sm text-muted-foreground">SKU: {item.id.slice(0,6).toUpperCase()}</p>
                  </div>
                  <div className="mr-auto font-medium text-destructive">{item.openingStock} وحدات</div>
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
