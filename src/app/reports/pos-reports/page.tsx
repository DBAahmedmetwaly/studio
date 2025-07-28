
"use client";

import React, { useState, useMemo, useEffect } from "react";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useData } from "@/contexts/data-provider";
import { Loader2, Printer, BarChart2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface PosSale {
  id: string;
  date: string;
  cashierId: string;
  cashierName: string;
  items: { id: string; name: string; qty: number; price: number; }[];
  total: number;
  discount: number;
  invoiceNumber: string;
}
interface PosAuditLog {
    id: string;
    date: string;
    cashierId: string;
    cashierName: string;
    action: string;
    details: any;
}
interface ItemGroup {
  id: string;
  name: string;
  itemIds: string[];
}
interface User {
  id: string;
  name: string;
  isCashier?: boolean;
  warehouse: string;
}
interface Warehouse {
  id: string;
  name: string;
}

const ReportFilters = ({ onGenerate }: { onGenerate: (filters: any) => void }) => {
    const { users, warehouses, loading } = useData();
    const [filters, setFilters] = useState({ fromDate: '', toDate: '', cashierId: 'all', warehouseId: 'all' });
    const cashiers = users.filter((u: User) => u.isCashier);

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        setFilters(prev => ({...prev, fromDate: today, toDate: today}));
    }, []);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>فلاتر التقارير</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="space-y-2">
                        <Label>من تاريخ</Label>
                        <Input type="date" value={filters.fromDate} onChange={e => handleFilterChange('fromDate', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>إلى تاريخ</Label>
                        <Input type="date" value={filters.toDate} onChange={e => handleFilterChange('toDate', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>الكاشير</Label>
                        <Select value={filters.cashierId} onValueChange={v => handleFilterChange('cashierId', v)}>
                            <SelectTrigger><SelectValue placeholder="الكل" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">كل الكاشيرات</SelectItem>
                                {cashiers.map((c:User) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>المخزن</Label>
                        <Select value={filters.warehouseId} onValueChange={v => handleFilterChange('warehouseId', v)}>
                            <SelectTrigger><SelectValue placeholder="الكل" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">كل المخازن</SelectItem>
                                {warehouses.map((w:Warehouse) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-end">
                        <Button className="w-full" onClick={() => onGenerate(filters)} disabled={loading}>
                            <BarChart2 className="ml-2 h-4 w-4" />
                            عرض التقارير
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const SalesSummary = ({ sales }: { sales: PosSale[] }) => {
    const summary = useMemo(() => {
        const totalSalesValue = sales.reduce((sum, s) => sum + s.total, 0);
        const totalDiscount = sales.reduce((sum, s) => sum + (s.discount || 0), 0);
        const transactionCount = sales.length;
        const avgTransactionValue = transactionCount > 0 ? totalSalesValue / transactionCount : 0;
        return { totalSalesValue, totalDiscount, transactionCount, avgTransactionValue };
    }, [sales]);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
                <CardHeader><CardTitle>إجمالي المبيعات</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{summary.totalSalesValue.toLocaleString()} ج.م</p></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>عدد الفواتير</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{summary.transactionCount}</p></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>متوسط الفاتورة</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{summary.avgTransactionValue.toFixed(2)} ج.م</p></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>إجمالي الخصومات</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold text-destructive">{summary.totalDiscount.toLocaleString()} ج.م</p></CardContent>
            </Card>
        </div>
    );
}

const SalesByItem = ({ sales }: { sales: PosSale[] }) => {
    const data = useMemo(() => {
        const itemMap = new Map<string, { name: string, qty: number, total: number }>();
        sales.forEach(sale => {
            sale.items.forEach(item => {
                const existing = itemMap.get(item.id);
                if (existing) {
                    existing.qty += item.qty;
                    existing.total += item.qty * item.price;
                } else {
                    itemMap.set(item.id, { name: item.name, qty: item.qty, total: item.qty * item.price });
                }
            });
        });
        return Array.from(itemMap.values()).sort((a, b) => b.qty - a.qty);
    }, [sales]);

    return (
        <Table>
            <TableHeader><TableRow><TableHead>الصنف</TableHead><TableHead className="text-center">الكمية المباعة</TableHead><TableHead className="text-center">قيمة المبيعات</TableHead></TableRow></TableHeader>
            <TableBody>
                {data.map(item => (
                    <TableRow key={item.name}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-center">{item.qty}</TableCell>
                        <TableCell className="text-center">{item.total.toLocaleString()} ج.م</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

const SalesByGroup = ({ sales, itemGroups }: { sales: PosSale[], itemGroups: ItemGroup[] }) => {
    const data = useMemo(() => {
        const groupMap = new Map<string, { name: string, total: number }>();
        itemGroups.forEach(g => groupMap.set(g.id, { name: g.name, total: 0 }));

        sales.forEach(sale => {
            sale.items.forEach(item => {
                const group = itemGroups.find(g => g.itemIds.includes(item.id));
                if (group) {
                    const existing = groupMap.get(group.id);
                    if (existing) {
                        existing.total += item.qty * item.price;
                    }
                }
            });
        });
        return Array.from(groupMap.values()).filter(g => g.total > 0).sort((a,b) => b.total - a.total);
    }, [sales, itemGroups]);

     return (
        <Table>
            <TableHeader><TableRow><TableHead>المجموعة</TableHead><TableHead className="text-center">قيمة المبيعات</TableHead></TableRow></TableHeader>
            <TableBody>
                {data.map(group => (
                    <TableRow key={group.name}>
                        <TableCell>{group.name}</TableCell>
                        <TableCell className="text-center">{group.total.toLocaleString()} ج.م</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

const CashierPerformance = ({ sales }: { sales: PosSale[] }) => {
     const data = useMemo(() => {
        const cashierMap = new Map<string, { name: string, sales: number, count: number }>();
        sales.forEach(sale => {
            const existing = cashierMap.get(sale.cashierId);
            if (existing) {
                existing.sales += sale.total;
                existing.count += 1;
            } else {
                cashierMap.set(sale.cashierId, { name: sale.cashierName, sales: sale.total, count: 1 });
            }
        });
        return Array.from(cashierMap.values()).sort((a,b) => b.sales - a.sales);
    }, [sales]);

     return (
        <Table>
            <TableHeader><TableRow><TableHead>الكاشير</TableHead><TableHead className="text-center">إجمالي المبيعات</TableHead><TableHead className="text-center">عدد الفواتير</TableHead></TableRow></TableHeader>
            <TableBody>
                {data.map(cashier => (
                    <TableRow key={cashier.name}>
                        <TableCell>{cashier.name}</TableCell>
                        <TableCell className="text-center">{cashier.sales.toLocaleString()} ج.م</TableCell>
                        <TableCell className="text-center">{cashier.count}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

const PaymentSummary = ({ sales }: { sales: PosSale[] }) => {
    const totalCollected = sales.reduce((sum, s) => sum + s.total, 0);
    return (
        <Card>
            <CardHeader><CardTitle>إجمالي المبالغ المحصلة</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-green-600">{totalCollected.toLocaleString()} ج.م</p></CardContent>
        </Card>
    )
};

const DiscountReport = ({ sales }: { sales: PosSale[] }) => {
    const salesWithDiscount = sales.filter(s => s.discount > 0);
    return (
        <Table>
            <TableHeader><TableRow><TableHead>الفاتورة</TableHead><TableHead>الكاشير</TableHead><TableHead className="text-center">قيمة الخصم</TableHead></TableRow></TableHeader>
            <TableBody>
                {salesWithDiscount.map(s => (
                    <TableRow key={s.id}>
                        <TableCell>{s.invoiceNumber}</TableCell>
                        <TableCell>{s.cashierName}</TableCell>
                        <TableCell className="text-center">{s.discount.toLocaleString()} ج.م</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
};

const AuditLogReport = ({ logs }: { logs: PosAuditLog[] }) => {
    return (
         <Table>
            <TableHeader><TableRow><TableHead>الوقت</TableHead><TableHead>الكاشير</TableHead><TableHead>الحدث</TableHead><TableHead>التفاصيل</TableHead></TableRow></TableHeader>
            <TableBody>
                {logs.map(log => (
                    <TableRow key={log.id}>
                        <TableCell>{new Date(log.date).toLocaleString('ar-EG')}</TableCell>
                        <TableCell>{log.cashierName}</TableCell>
                        <TableCell><Badge variant="destructive">{log.action === 'INVOICE_CANCELLED' ? 'إلغاء فاتورة' : log.action}</Badge></TableCell>
                        <TableCell className="text-xs">{log.details.invoiceNumber}</TableCell>
                    </TableRow>
                ))}
                 {logs.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-4">لا توجد سجلات.</TableCell></TableRow>}
            </TableBody>
        </Table>
    )
};


export default function PosReportsPage() {
    const [filteredData, setFilteredData] = useState<{ sales: PosSale[], logs: PosAuditLog[] } | null>(null);
    const { posSales, posAuditLogs, users, itemGroups, loading } = useData();
    
    const handleGenerate = (filters: any) => {
        const { fromDate, toDate, cashierId, warehouseId } = filters;
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);

        const cashierWarehouseMap = new Map<string, string>();
        users.forEach((u:User) => cashierWarehouseMap.set(u.id, u.warehouse));

        const sales = posSales.filter((s: PosSale) => {
            const saleDate = new Date(s.date);
            const saleWarehouseId = cashierWarehouseMap.get(s.cashierId);
            return saleDate >= start && saleDate <= end &&
                   (cashierId === 'all' || s.cashierId === cashierId) &&
                   (warehouseId === 'all' || saleWarehouseId === warehouseId);
        });

        const logs = posAuditLogs.filter((l: PosAuditLog) => {
            const logDate = new Date(l.date);
            const logWarehouseId = cashierWarehouseMap.get(l.cashierId);
            return logDate >= start && logDate <= end &&
                   (cashierId === 'all' || l.cashierId === cashierId) &&
                   (warehouseId === 'all' || logWarehouseId === warehouseId);
        });

        setFilteredData({ sales, logs });
    };

    return (
        <>
            <PageHeader title="تقارير نقاط البيع" />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                <ReportFilters onGenerate={handleGenerate} />
                
                {loading && <div className="flex justify-center py-10"><Loader2 className="animate-spin h-8 w-8" /></div>}
                
                {filteredData && !loading && (
                    <Card>
                        <CardHeader>
                            <CardTitle>نتائج التقارير</CardTitle>
                            <CardDescription>عرض تفصيلي لجميع أنشطة نقاط البيع للفترة المحددة.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="summary">
                                <TabsList className="grid w-full grid-cols-7">
                                    <TabsTrigger value="summary">الملخص</TabsTrigger>
                                    <TabsTrigger value="by_item">حسب الصنف</TabsTrigger>
                                    <TabsTrigger value="by_group">حسب المجموعة</TabsTrigger>
                                    <TabsTrigger value="by_cashier">حسب الكاشير</TabsTrigger>
                                    <TabsTrigger value="payments">المدفوعات</TabsTrigger>
                                    <TabsTrigger value="discounts">الخصومات</TabsTrigger>
                                    <TabsTrigger value="audit">سجل التدقيق</TabsTrigger>
                                </TabsList>
                                <TabsContent value="summary" className="pt-4"><SalesSummary sales={filteredData.sales} /></TabsContent>
                                <TabsContent value="by_item" className="pt-4"><SalesByItem sales={filteredData.sales} /></TabsContent>
                                <TabsContent value="by_group" className="pt-4"><SalesByGroup sales={filteredData.sales} itemGroups={itemGroups} /></TabsContent>
                                <TabsContent value="by_cashier" className="pt-4"><CashierPerformance sales={filteredData.sales} /></TabsContent>
                                <TabsContent value="payments" className="pt-4"><PaymentSummary sales={filteredData.sales} /></TabsContent>
                                <TabsContent value="discounts" className="pt-4"><DiscountReport sales={filteredData.sales} /></TabsContent>
                                <TabsContent value="audit" className="pt-4"><AuditLogReport logs={filteredData.logs} /></TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                )}
            </main>
        </>
    );
}
