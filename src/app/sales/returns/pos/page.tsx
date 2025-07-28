
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
  CardFooter
} from "@/components/ui/card";
import { useData } from "@/contexts/data-provider";
import { Loader2, Search, Undo2, Save, Trash2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

interface PosSale {
  id: string;
  invoiceNumber: string;
  date: string;
  cashierId: string;
  cashierName: string;
  items: { id: string; name: string; qty: number; price: number; }[];
  total: number;
}
interface PosReturnItem {
  id: string; // original item id
  name: string;
  qty: number;
  price: number;
  total: number;
  maxQty: number; // max qty that can be returned
}

export default function PosReturnPage() {
    const { posSales, dbAction, loading } = useData();
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [foundInvoice, setFoundInvoice] = useState<PosSale | null>(null);
    const [returnedItems, setReturnedItems] = useState<PosReturnItem[]>([]);
    const [returnTotal, setReturnTotal] = useState(0);

    const handleSearch = () => {
        const invoice = posSales.find((s: PosSale) => s.invoiceNumber === invoiceNumber);
        if (invoice) {
            setFoundInvoice(invoice);
            setReturnedItems(invoice.items.map(item => ({...item, maxQty: item.qty, total: 0})));
        } else {
            toast({ variant: 'destructive', title: 'خطأ', description: 'لم يتم العثور على فاتورة بهذا الرقم.' });
            setFoundInvoice(null);
            setReturnedItems([]);
        }
    };
    
    const handleQtyChange = (id: string, newQty: number) => {
        setReturnedItems(prev => prev.map(item => {
            if (item.id === id) {
                const safeQty = Math.max(0, Math.min(newQty, item.maxQty));
                return { ...item, qty: safeQty, total: safeQty * item.price };
            }
            return item;
        }));
    };
    
    React.useEffect(() => {
        const total = returnedItems.reduce((sum, item) => sum + item.total, 0);
        setReturnTotal(total);
    }, [returnedItems]);


    const handleSaveReturn = async () => {
        if (!foundInvoice || returnTotal <= 0) {
            toast({ variant: "destructive", title: "خطأ", description: "لا توجد أصناف أو قيمة للمرتجع." });
            return;
        }

        const itemsToReturn = returnedItems.filter(item => item.qty > 0);
        if (itemsToReturn.length === 0) {
            toast({ variant: "destructive", title: "خطأ", description: "يرجى تحديد كمية صنف واحد على الأقل." });
            return;
        }

        try {
            await dbAction('posReturns', 'add', {
                date: new Date().toISOString(),
                originalInvoiceId: foundInvoice.id,
                originalInvoiceNumber: foundInvoice.invoiceNumber,
                cashierId: user?.id,
                cashierName: user?.name,
                items: itemsToReturn.map(({maxQty, ...rest}) => rest), // Remove maxQty helper
                total: returnTotal,
            });
            
            // This expense represents cash being removed from the cashier's custody and returned to the customer.
            await dbAction('expenses', 'add', {
                date: new Date().toISOString(),
                amount: returnTotal,
                description: `مرتجع من فاتورة نقاط البيع رقم: ${foundInvoice.invoiceNumber}`,
                expenseType: 'مرتجعات ومسموحات المبيعات',
                paidFromAccountId: user?.id, // Use cashier's user ID to link to their custody account. This requires logic elsewhere.
            });
            
            toast({ title: 'تم الحفظ بنجاح', description: `تم تسجيل مرتجع بقيمة ${returnTotal.toLocaleString()}` });
            router.push('/pos');

        } catch (error) {
            console.error("Failed to save POS return:", error);
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حفظ المرتجع.' });
        }
    };


    return (
        <>
            <PageHeader title="مرتجع نقاط البيع" />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>البحث عن الفاتورة الأصلية</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2">
                             <div className="space-y-2 flex-1">
                                <Label htmlFor="invoiceNumber">رقم فاتورة الكاشير</Label>
                                <Input id="invoiceNumber" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="أدخل الرقم المطبوع على الإيصال..." />
                            </div>
                            <Button onClick={handleSearch} disabled={loading || !invoiceNumber}>
                                {loading ? <Loader2 className="animate-spin ml-2" /> : <Search className="ml-2 h-4 w-4" />}
                                بحث
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                
                {foundInvoice && (
                    <Card>
                        <CardHeader>
                            <CardTitle>تفاصيل الفاتورة #{foundInvoice.invoiceNumber}</CardTitle>
                             <CardDescription>
                                تاريخ: {new Date(foundInvoice.date).toLocaleString('ar-EG')} | الكاشير: {foundInvoice.cashierName} | الإجمالي: {foundInvoice.total.toLocaleString()} ج.م
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="space-y-4">
                                <Label>تحديد الأصناف والكميات المرتجعة</Label>
                                 <div className="w-full overflow-auto border rounded-lg">
                                    <Table>
                                        <TableHeader><TableRow><TableHead>الصنف</TableHead><TableHead className="text-center">الكمية المباعة</TableHead><TableHead className="text-center">الكمية المرتجعة</TableHead><TableHead className="text-center">السعر</TableHead><TableHead className="text-center">إجمالي المرتجع</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {returnedItems.map(item => (
                                                <TableRow key={item.id}>
                                                    <TableCell>{item.name}</TableCell>
                                                    <TableCell className="text-center">{item.maxQty}</TableCell>
                                                    <TableCell className="text-center w-32"><Input type="number" value={item.qty} onChange={(e) => handleQtyChange(item.id, Number(e.target.value))} className="text-center" max={item.maxQty} min={0} /></TableCell>
                                                    <TableCell className="text-center">{item.price.toLocaleString()}</TableCell>
                                                    <TableCell className="text-center font-semibold">{item.total.toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                 </div>
                                  <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertTitle>التأثير المحاسبي والمخزني</AlertTitle>
                                    <AlertDescription>
                                        عند الحفظ، سيتم زيادة رصيد الأصناف المرتجعة في المخزن، وسيتم تسجيل مصروف بقيمة المرتجع على حساب "مرتجعات ومسموحات المبيعات" من خزينة الكاشير.
                                    </AlertDescription>
                                </Alert>
                             </div>
                        </CardContent>
                         <CardFooter className="flex justify-between items-center">
                            <p className="text-xl font-bold">إجمالي قيمة المرتجع: <span className="text-destructive">{returnTotal.toLocaleString()} ج.م</span></p>
                            <Button size="lg" onClick={handleSaveReturn} disabled={returnTotal <= 0}>
                                <Save className="ml-2 h-4 w-4" />
                                حفظ المرتجع
                            </Button>
                        </CardFooter>
                    </Card>
                )}
            </main>
        </>
    );
}
