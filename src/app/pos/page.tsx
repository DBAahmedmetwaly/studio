
"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, ShoppingCart, XCircle, Printer } from "lucide-react";
import { useData } from '@/contexts/data-provider';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface PosItem {
  id: string; // The database ID of the item
  code: string;
  name: string;
  qty: number;
  price: number;
  total: number;
  uniqueId: string; // A unique ID for the list key
}

export default function PosPage() {
    const { items: allItems, dbAction, getNextId, salesInvoices } = useData();
    const { user } = useAuth();
    const { toast } = useToast();
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    
    const [cart, setCart] = useState<PosItem[]>([]);
    const [subtotal, setSubtotal] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [total, setTotal] = useState(0);
    const [paidAmount, setPaidAmount] = useState(0);
    const [change, setChange] = useState(0);

    const resetSale = useCallback(() => {
        setCart([]);
        setDiscount(0);
        setPaidAmount(0);
        barcodeInputRef.current?.focus();
    }, []);

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


    const handleBarcodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const code = barcodeInputRef.current?.value;
        if (!code) return;

        const itemToAdd = allItems.find(item => item.code === code);
        if (!itemToAdd) {
            toast({ variant: 'destructive', title: 'خطأ', description: `الصنف بالكود ${code} غير موجود.` });
            barcodeInputRef.current!.value = "";
            return;
        }

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
        
        barcodeInputRef.current!.value = "";
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
        
        const invoiceNumber = `POS-${await getNextId('posSale')}`;
        
        const saleData = {
            invoiceNumber,
            date: new Date().toISOString(),
            items: cart.map(({ uniqueId, ...rest }) => rest), // remove uniqueId
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
                invoiceNumber,
                date: new Date().toISOString(),
                customerId: 'cash-customer', // Generic cash customer
                customerName: 'عميل نقدي',
                warehouseId: user?.warehouse, // Assumes cashier is tied to a warehouse
                status: 'approved', // POS sales are always approved
                items: cart.map(item => ({ id: item.id, qty: item.qty, price: item.price, cost: 0 })),
                total,
                paidAmount: total, // POS sales are fully paid
            });

            toast({ title: 'تمت العملية بنجاح', description: `تم حفظ الفاتورة ${invoiceNumber}`});
            resetSale();
        } catch (error) {
            console.error("Failed to save POS sale:", error);
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حفظ الفاتورة.'});
        }
    };

    return (
        <div className="h-screen bg-muted/30 flex flex-col p-4 gap-4">
            <div className="grid grid-cols-12 gap-4 flex-grow overflow-hidden">
                {/* Left Side - Cart and Items */}
                <div className="col-span-7 flex flex-col gap-4">
                    <form onSubmit={handleBarcodeSubmit}>
                         <Input ref={barcodeInputRef} placeholder="أدخل كود الصنف أو امسح الباركود..." className="h-12 text-lg" />
                    </form>
                    <Card className="flex-grow flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ShoppingCart/> سلة المبيعات</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[60%]">الصنف</TableHead>
                                        <TableHead className="text-center">الكمية</TableHead>
                                        <TableHead className="text-center">السعر</TableHead>
                                        <TableHead className="text-center">الإجمالي</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cart.map(item => (
                                        <TableRow key={item.uniqueId}>
                                            <TableCell>{item.name}</TableCell>
                                            <TableCell><Input type="number" value={item.qty} onChange={e => updateQty(item.uniqueId, Number(e.target.value))} className="w-20 text-center mx-auto" /></TableCell>
                                            <TableCell className="text-center">{item.price.toFixed(2)}</TableCell>
                                            <TableCell className="text-center font-bold">{item.total.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => updateQty(item.uniqueId, 0)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Side - Totals and Payment */}
                <div className="col-span-5 flex flex-col gap-4">
                    <Card className="flex-grow flex flex-col justify-between">
                         <CardHeader>
                            <CardTitle>الدفع</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-lg">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">الإجمالي الفرعي</span>
                                <span className="font-semibold">{subtotal.toFixed(2)} ج.م</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <Label htmlFor="discount" className="text-muted-foreground">الخصم</Label>
                                <Input id="discount" type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="max-w-[120px] text-left h-10 text-lg" />
                            </div>
                            <div className="border-t pt-4 mt-4 flex justify-between items-center text-3xl font-bold text-primary">
                                <span>المبلغ المطلوب</span>
                                <span>{total.toFixed(2)} ج.م</span>
                            </div>
                             <div className="border-t pt-4 mt-4 space-y-2">
                                <Label htmlFor="paidAmount" className="text-xl">المبلغ المدفوع</Label>
                                <Input id="paidAmount" type="number" value={paidAmount} onChange={e => setPaidAmount(Number(e.target.value))} className="h-16 text-4xl font-mono text-center" />
                            </div>
                             <div className="pt-4 flex justify-between items-center text-2xl font-bold text-green-600">
                                <span>المتبقي</span>
                                <span>{change.toFixed(2)} ج.م</span>
                            </div>
                        </CardContent>
                        <CardFooter className="grid grid-cols-2 gap-2">
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
            </div>
        </div>
    );
}
