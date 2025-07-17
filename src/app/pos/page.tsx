
"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, ShoppingCart, XCircle, Printer, Grip, Dot, Search } from "lucide-react";
import { useData } from '@/contexts/data-provider';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';

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
    const { items: allItems, dbAction, getNextId, salesInvoices, itemGroups, posAuditLogs } = useData();
    const { user } = useAuth();
    const { toast } = useToast();
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    
    const [cart, setCart] = useState<PosItem[]>([]);
    const [subtotal, setSubtotal] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [total, setTotal] = useState(0);
    const [paidAmount, setPaidAmount] = useState(0);
    const [change, setChange] = useState(0);
    const [activeGroupId, setActiveGroupId] = useState<string | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState("");
    const [currentInvoiceNumber, setCurrentInvoiceNumber] = useState<string>("");

    const generateInvoiceNumber = useCallback(async () => {
        const nextId = await getNextId('posSale');
        setCurrentInvoiceNumber(`POS-${nextId}`);
    }, [getNextId]);

    useEffect(() => {
        generateInvoiceNumber();
    }, [generateInvoiceNumber]);


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
        generateInvoiceNumber();
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
                customerName: 'عميل نقدي',
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

    return (
        <div className="h-screen bg-muted flex flex-col">
            {/* Header */}
            <header className="bg-card h-14 flex items-center justify-between px-4 shadow-sm shrink-0">
                <div className='font-bold text-lg'>
                    فاتورة: <span className="font-mono">{currentInvoiceNumber}</span>
                </div>
                <div className='text-sm text-muted-foreground'>
                    الكاشير: <span className="font-semibold">{user?.name}</span>
                </div>
            </header>

            <main className="flex-grow grid grid-cols-12 gap-4 p-4 overflow-hidden" style={{ height: 'calc(100vh - 3.5rem)' }}>
                
                {/* Right Side - Item Selection */}
                <div className="col-span-7 flex flex-col gap-4 overflow-hidden">
                     <div className="shrink-0">
                        <form onSubmit={handleBarcodeSubmit}>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input ref={barcodeInputRef} placeholder="امسح الباركود أو ابحث بالاسم..." className="h-12 text-lg pl-10" onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                        </form>
                    </div>
                    
                    <Card className="flex-grow flex flex-col overflow-hidden">
                         <CardHeader className="p-2 border-b shrink-0">
                            <ScrollArea className="w-full whitespace-nowrap">
                                <div className="flex gap-2 p-2">
                                     <Button size="lg" variant={activeGroupId === 'all' ? 'default' : 'outline'} onClick={() => setActiveGroupId('all')} className="h-16 px-6 shrink-0">
                                        <Grip className="ml-2 h-5 w-5" /> كل الأصناف
                                    </Button>
                                    {itemGroups.map((group: ItemGroup) => (
                                        <Button key={group.id} size="lg" variant={activeGroupId === group.id ? 'default' : 'outline'} onClick={() => setActiveGroupId(group.id!)} className="h-16 px-6 shrink-0">
                                           <div className={`ml-2 h-5 w-5 rounded-full ${group.color}`} />
                                            {group.name}
                                        </Button>
                                    ))}
                                </div>
                            </ScrollArea>
                         </CardHeader>
                         <ScrollArea className="flex-grow">
                            <div className="p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
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


                {/* Left Side - Cart and Payment */}
                <div className="col-span-5 flex flex-col gap-4 overflow-hidden">
                    <Card className="flex-grow flex flex-col overflow-hidden">
                        <CardHeader className="shrink-0">
                            <CardTitle className="flex items-center gap-2"><ShoppingCart/> سلة المبيعات</CardTitle>
                        </CardHeader>
                        <ScrollArea className="flex-grow border-t border-b">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50%]">الصنف</TableHead>
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
                         <div className="p-4 bg-muted/50 shrink-0">
                             <div className="w-full space-y-3 text-lg">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">الإجمالي الفرعي</span>
                                    <span className="font-semibold">{subtotal.toFixed(2)} ج.م</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="discount" className="text-muted-foreground">الخصم</Label>
                                    <Input id="discount" type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="max-w-[120px] text-left h-10 text-lg" />
                                </div>
                                <div className="border-t pt-3 mt-3 flex justify-between items-center text-3xl font-bold text-primary">
                                    <span>المبلغ المطلوب</span>
                                    <span>{total.toFixed(2)} ج.م</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                     <Card className="shrink-0">
                        <CardContent className="p-4 grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="paidAmount" className="text-xl">المبلغ المدفوع</Label>
                                <Input id="paidAmount" type="number" value={paidAmount} onChange={e => setPaidAmount(Number(e.target.value))} className="h-16 text-4xl font-mono text-center" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xl text-green-600">المتبقي</Label>
                                <div className="h-16 text-4xl font-mono text-center flex items-center justify-center bg-muted rounded-md text-green-600">
                                    {change.toFixed(2)}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="grid grid-cols-2 gap-2 p-2">
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="lg"><XCircle className="ml-2"/> إلغاء الفاتورة</Button>
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
            </main>
        </div>
    );
}
