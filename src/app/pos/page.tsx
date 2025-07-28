
"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, ShoppingCart, XCircle, Printer, Grip, Dot, Search, Ban, PanelLeft } from "lucide-react";
import { useData } from '@/contexts/data-provider';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { usePosInvoiceCounter } from '@/hooks/use-pos-invoice-counter';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface PosItem {
  id: string; // The database ID of the item
  code: string;
  name: string;
  qty: number;
  price: number;
  total: number;
  uniqueId: string; // A unique ID for the list key
}

interface ItemGroup {
  id: string;
  name: string;
  color: string;
  image?: string;
  itemIds: string[];
}

export default function PosPage() {
    const { items: allItems, dbAction, itemGroups, posSessions } = useData();
    const { user } = useAuth();
    const { toast } = useToast();
    const { generateInvoiceNumber, currentInvoiceNumber, loading: loadingCounter } = usePosInvoiceCounter();

    const barcodeInputRef = useRef<HTMLInputElement>(null);
    
    const [cart, setCart] = useState<PosItem[]>([]);
    const [subtotal, setSubtotal] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [total, setTotal] = useState(0);
    const [paidAmount, setPaidAmount] = useState(0);
    const [change, setChange] = useState(0);
    const [activeGroupId, setActiveGroupId] = useState<string | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState("");
    
    const openWorkDay = useMemo(() => posSessions.find((s: any) => !s.isClosed), [posSessions]);
    const hasOpenCashierSession = useMemo(() => {
        if (!openWorkDay || !user) return false;
        const cashierSession = openWorkDay.cashierSessions?.[user.id];
        return cashierSession && !cashierSession.isClosed;
    }, [openWorkDay, user]);


    const resetSale = useCallback(async () => {
        if (cart.length > 0) {
            await dbAction('posAuditLogs', 'add', {
                date: new Date().toISOString(),
                cashierId: user?.id,
                cashierName: user?.name,
                action: 'INVOICE_CANCELLED',
                details: {
                    invoiceNumber: currentInvoiceNumber,
                    items: cart,
                    total: total,
                }
            });
        }
        setCart([]);
        setDiscount(0);
        setPaidAmount(0);
        setActiveGroupId('all');
        setSearchTerm("");
        await generateInvoiceNumber(); // Generate new invoice number for the next sale
        barcodeInputRef.current?.focus();
    }, [cart, currentInvoiceNumber, dbAction, generateInvoiceNumber, total, user]);

    useEffect(() => {
        barcodeInputRef.current?.focus();
    }, []);

    useEffect(() => {
        const newSubtotal = cart.reduce((acc, item) => acc + item.total, 0);
        const newTotal = newSubtotal - discount;
        setSubtotal(newSubtotal);
        setTotal(newTotal);
    }, [cart, discount]);
    
    useEffect(() => {
        if (paidAmount >= total) {
            setChange(paidAmount - total);
        } else {
            setChange(0);
        }
    }, [paidAmount, total]);

    const addItemToCart = useCallback((itemToAdd: any) => {
        if (!itemToAdd) return;
        const existingItemIndex = cart.findIndex(item => item.id === itemToAdd.id);

        if (existingItemIndex > -1) {
            const newCart = [...cart];
            newCart[existingItemIndex].qty += 1;
            newCart[existingItemIndex].total = newCart[existingItemIndex].qty * newCart[existingItemIndex].price;
            setCart(newCart);
        } else {
            setCart(prevCart => [...prevCart, {
                id: itemToAdd.id,
                code: itemToAdd.code,
                name: itemToAdd.name,
                qty: 1,
                price: itemToAdd.price || 0,
                total: itemToAdd.price || 0,
                uniqueId: `${itemToAdd.id}-${Date.now()}`
            }]);
        }
    }, [cart]);


    const handleBarcodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const code = barcodeInputRef.current?.value;
        if (!code) return;

        const itemToAdd = allItems.find((item: any) => item.code === code);
        if (!itemToAdd) {
            toast({ variant: 'destructive', title: 'خطأ', description: `الصنف بالكود ${code} غير موجود.` });
            if(barcodeInputRef.current) barcodeInputRef.current.value = "";
            return;
        }
        addItemToCart(itemToAdd);
        if(barcodeInputRef.current) barcodeInputRef.current.value = "";
    };

    const handleGridItemClick = (item: any) => {
        addItemToCart(item);
    };
    
    const updateQty = (uniqueId: string, newQty: number) => {
        if (newQty <= 0) {
            setCart(cart.filter(item => item.uniqueId !== uniqueId));
            return;
        }
        setCart(cart.map(item => 
            item.uniqueId === uniqueId ? { ...item, qty: newQty, total: newQty * item.price } : item
        ));
    };

    const handleFinishSale = async () => {
        if (cart.length === 0) return;
        
        const saleData = {
            invoiceNumber: currentInvoiceNumber,
            date: new Date().toISOString(),
            items: cart.map(({ uniqueId, ...rest }) => ({...rest, id: rest.id.split('-')[0]})), // remove uniqueId
            subtotal,
            discount,
            total,
            paidAmount,
            change,
            cashierId: user?.id,
            cashierName: user?.name,
        };

        try {
            await dbAction('posSales', 'add', saleData);
            
            // This is a simplified sale invoice for accounting purposes.
            await dbAction('salesInvoices', 'add', {
                invoiceNumber: currentInvoiceNumber,
                date: new Date().toISOString(),
                customerId: 'cash-customer', // Generic cash customer
                customerName: 'عميل نقاط بيع',
                warehouseId: user?.warehouse, // Assumes cashier is tied to a warehouse
                status: 'approved', // POS sales are always approved
                items: cart.map(item => ({ id: item.id.split('-')[0], qty: item.qty, price: item.price, cost: 0 })),
                total,
                paidAmount: total, // POS sales are fully paid
            });

            toast({ title: 'تمت العملية بنجاح', description: `تم حفظ الفاتورة ${currentInvoiceNumber}`});
            resetSale();
        } catch (error) {
            console.error("Failed to save POS sale:", error);
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حفظ الفاتورة.'});
        }
    };
    
    const itemsToShow = useMemo(() => {
        let filteredItems = allItems;
        if (activeGroupId !== 'all') {
             const group = itemGroups.find((g: ItemGroup) => g.id === activeGroupId);
             if (group) {
                 const itemIdsInGroup = new Set(group.itemIds);
                 filteredItems = allItems.filter((item: any) => itemIdsInGroup.has(item.id));
             }
        }
        
        if (searchTerm) {
            return filteredItems.filter((item: any) => 
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                (item.code && item.code.includes(searchTerm))
            );
        }

        return filteredItems;
    }, [activeGroupId, itemGroups, allItems, searchTerm]);
    
    // Permission check
    if (!user?.isCashier) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-muted">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive"><Ban /> وصول مرفوض</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Alert variant="destructive">
                            <AlertTitle>غير مصرح به</AlertTitle>
                            <AlertDescription>
                                أنت لا تملك الصلاحيات اللازمة للوصول إلى شاشة نقاط البيع. يرجى التواصل مع مسؤول النظام.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    // Session check
    if (!openWorkDay || !hasOpenCashierSession) {
         return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-muted">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-600"><Ban /> الوردية مغلقة</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Alert>
                            <AlertTitle>{!openWorkDay ? "يوم العمل مغلق" : "لم يتم تسليم العهدة"}</AlertTitle>
                            <AlertDescription>
                                {!openWorkDay ? "لا يمكنك بدء عمليات البيع لأنه لا توجد يومية عمل مفتوحة. يرجى الطلب من مسؤول النظام فتح يوم عمل جديد." : "لم يتم تسليم عهدة بداية اليوم لك. يرجى الطلب من المسؤول تسليم العهدة لبدء ورديتك."}
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </div>
        );
    }


    return (
        <div className="h-screen bg-background flex flex-col lg:flex-row p-2 sm:p-4 gap-4">
             {/* Left/Top Section - Cart & Payment */}
            <div className="flex-none lg:w-1/3 flex flex-col gap-4">
                <Card className="flex-1 flex flex-col overflow-hidden">
                    <CardHeader className="shrink-0">
                        <CardTitle className="flex items-center gap-2"><ShoppingCart/> سلة المبيعات</CardTitle>
                    </CardHeader>
                    <ScrollArea className="flex-1 border-t border-b">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[45%]">الصنف</TableHead>
                                    <TableHead className="text-center">الكمية</TableHead>
                                    <TableHead className="text-center">الإجمالي</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cart.map(item => (
                                    <TableRow key={item.uniqueId}>
                                        <TableCell className='py-2'>
                                            <div>{item.name}</div>
                                            <div className='text-xs text-muted-foreground'>{item.price.toFixed(2)} ج.م</div>
                                        </TableCell>
                                        <TableCell className='py-2'><Input type="number" value={item.qty} onChange={e => updateQty(item.uniqueId, Number(e.target.value))} className="w-16 text-center mx-auto" /></TableCell>
                                        <TableCell className="text-center font-bold py-2">{item.total.toFixed(2)}</TableCell>
                                        <TableCell className='py-2'>
                                            <Button variant="ghost" size="icon" onClick={() => updateQty(item.uniqueId, 0)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {cart.length === 0 && (
                                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground h-24">السلة فارغة</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                     <div className="p-3 text-sm text-muted-foreground shrink-0 border-t">
                        فاتورة: <span className="font-mono">{currentInvoiceNumber}</span> | الكاشير: <span className="font-semibold">{user?.name}</span>
                    </div>
                </Card>
                 {/* Payment */}
                <Card className="shrink-0 flex flex-col justify-between overflow-hidden">
                    <CardContent className="p-3 sm:p-4 space-y-3 text-lg">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">الإجمالي الفرعي</span>
                            <span className="font-semibold">{subtotal.toFixed(2)} ج.م</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <Label htmlFor="discount" className="text-muted-foreground">الخصم</Label>
                            <Input id="discount" type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="max-w-[120px] text-left h-10 text-lg" />
                        </div>
                        <div className="border-t pt-3 mt-3 flex justify-between items-center text-2xl sm:text-3xl font-bold text-primary">
                            <span>المبلغ المطلوب</span>
                            <span>{total.toFixed(2)} ج.م</span>
                        </div>
                        <div className="pt-3 grid grid-cols-2 gap-2 sm:gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="paidAmount" className="text-lg sm:text-xl">المدفوع</Label>
                                <Input id="paidAmount" type="number" value={paidAmount} onChange={e => setPaidAmount(Number(e.target.value))} className="h-14 sm:h-16 text-2xl sm:text-3xl font-mono text-center" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-lg sm:text-xl text-green-600">المتبقي</Label>
                                <div className="h-14 sm:h-16 text-2xl sm:text-3xl font-mono text-center flex items-center justify-center bg-muted rounded-md text-green-600">
                                    {change.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="grid grid-cols-2 gap-2 p-2">
                            <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="lg"><XCircle className="ml-2"/> إلغاء</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle><AlertDialogDescription>سيتم إلغاء الفاتورة الحالية ومسح جميع الأصناف.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>تراجع</AlertDialogCancel><AlertDialogAction onClick={resetSale}>نعم، قم بالإلغاء</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <Button size="lg" onClick={handleFinishSale} disabled={cart.length === 0 || paidAmount < total}>
                            <Printer className="ml-2"/>
                            إنهاء وطباعة
                        </Button>
                    </CardFooter>
                </Card>
            </div>
             {/* Right/Bottom Section - Catalog */}
            <div className="flex-1 flex flex-col overflow-hidden">
                 <div className="shrink-0 mb-3 flex items-center gap-2">
                     <Button variant="ghost" size="icon" className="md:hidden" onClick={() => {}}>
                        <SidebarTrigger />
                     </Button>
                    <form onSubmit={handleBarcodeSubmit} className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input ref={barcodeInputRef} placeholder="امسح الباركود أو ابحث بالاسم..." className="h-12 text-lg pl-10" onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                    </form>
                </div>
                 <Card className="flex-1 flex flex-col overflow-hidden">
                     <CardHeader className="p-2 border-b shrink-0">
                        <ScrollArea className="w-full whitespace-nowrap">
                            <div className="flex gap-2 p-2">
                                <Button size="lg" variant={activeGroupId === 'all' ? 'secondary' : 'ghost'} onClick={() => setActiveGroupId('all')} className="h-16 px-6 shrink-0">
                                    <Grip className="ml-2 h-5 w-5" /> كل الأصناف
                                </Button>
                                {itemGroups.map((group: ItemGroup) => (
                                    <Button key={group.id} size="lg" variant={activeGroupId === group.id ? 'secondary' : 'ghost'} onClick={() => setActiveGroupId(group.id!)} className="h-16 px-6 shrink-0">
                                        <div className={`ml-2 h-5 w-5 rounded-full ${group.color}`} />
                                        {group.name}
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                     </CardHeader>
                     <ScrollArea className="flex-1">
                        <div className="p-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                            {itemsToShow.map((item: any) => (
                                <button key={item.id} onClick={() => handleGridItemClick(item)} className="aspect-square flex flex-col items-center justify-center gap-2 rounded-lg bg-card text-card-foreground shadow-sm hover:bg-accent focus:ring-2 ring-primary transition-all p-1">
                                    <Image src={item.image || `https://placehold.co/100x100.png`} data-ai-hint="product item" alt={item.name} width={100} height={100} className="h-full max-h-[60%] w-auto object-contain rounded-md" />
                                    <p className="text-xs font-semibold text-center leading-tight px-1 flex-grow flex items-center">{item.name}</p>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </Card>
            </div>
        </div>
    );
}
