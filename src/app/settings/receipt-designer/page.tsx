
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, Wifi, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import useFirebase from "@/hooks/use-firebase";
import { PosReceipt } from '@/components/pos-receipt';
import { useData } from '@/contexts/data-provider';


interface ReceiptSettings {
    id?: string;
    receiptWidth: number;
    showLogo: boolean;
    logoUrl: string;
    showCompanyName: boolean;
    showAddress: boolean;
    showPhoneNumber: boolean;
    showCashier: boolean;
    showTax: boolean;
    showDiscount: boolean;
    showBarcode: boolean;
    showItemPrice: boolean;
    showInvoiceNumber: boolean;
    fontSizes: {
        companyName: number;
        header: number;
        items: number;
        totals: number;
    };
}

const DEFAULT_SETTINGS: ReceiptSettings = {
    receiptWidth: 72,
    showLogo: true,
    logoUrl: "https://placehold.co/100x100.png",
    showCompanyName: true,
    showAddress: true,
    showPhoneNumber: true,
    showCashier: true,
    showTax: true,
    showDiscount: true,
    showItemPrice: true,
    showInvoiceNumber: true,
    showBarcode: true,
    fontSizes: {
        companyName: 16,
        header: 12,
        items: 10,
        totals: 11
    }
}

const SAMPLE_INVOICE = {
    invoiceNumber: "POS-00123",
    date: new Date().toISOString(),
    cashierName: "أحمد علي",
    items: [
        { name: "صنف افتراضي 1", qty: 2, price: 15.00, total: 30.00 },
        { name: "صنف طويل جدا لاختبار التفاف النص", qty: 1, price: 25.50, total: 25.50 },
        { name: "صنف 3", qty: 3, price: 10.00, total: 30.00 },
    ],
    subtotal: 85.50,
    discount: 5.50,
    tax: 11.20,
    total: 91.20,
    paidAmount: 100.00,
    change: 8.80
}

const ElementControl = ({ label, posY, onPosYChange }: {
    label: string;
    posY: number;
    onPosYChange: (value: number) => void;
}) => (
    <div className="space-y-3 border p-3 rounded-md">
        <Label className="font-semibold">{label}</Label>
        <div className="space-y-4">
            <div className='text-xs space-y-2'>
                <div className="flex justify-between"><span>موضع (فوق/تحت)</span><span>{posY}%</span></div>
                <Input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={posY}
                    onChange={(e) => onPosYChange(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
            </div>
        </div>
    </div>
);

const SettingsToggle = ({ id, label, checked, onCheckedChange }: { id: string, label: string, checked: boolean, onCheckedChange: (checked: boolean) => void }) => (
    <div className="flex items-center justify-between">
        <Label htmlFor={id} className="cursor-pointer">{label}</Label>
        <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
);


const FontSizeControl = ({ label, value, onChange }: { label: string, value: number, onChange: (value: number) => void }) => (
    <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Input type="number" value={value} onChange={e => onChange(Number(e.target.value))} className="w-20 h-8 text-center" />
    </div>
)


export default function ReceiptDesignerPage() {
    const { settings: allSettings, dbAction } = useData();
    const { toast } = useToast();
    
    const [settings, setSettings] = useState<ReceiptSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        if(allSettings?.posReceipt) {
            setSettings(prev => ({...DEFAULT_SETTINGS, ...allSettings.posReceipt}));
        }
        setLoading(false);
    }, [allSettings]);


    const handleSettingChange = (key: keyof ReceiptSettings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };
    
    const handleFontSizeChange = (key: keyof ReceiptSettings['fontSizes'], value: number) => {
         setSettings(prev => ({ ...prev, fontSizes: { ...prev.fontSizes, [key]: value } }));
    }

    const handleSave = async () => {
        setLoading(true);
        try {
            // The `settings` path in firebase is an object, not an array.
            // We are updating a specific key ('posReceipt') within that object.
            await dbAction('settings/posReceipt', 'update', { id: '', data: settings }); // Using empty ID because we're targeting a direct path
            toast({ title: 'تم الحفظ', description: 'تم تحديث تصميم الإيصال بنجاح.' });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حفظ التصميم.' });
        } finally {
            setLoading(false);
        }
    };
    
    const companySettings = allSettings?.main?.general || {};

    if (loading) {
        return <div className="flex flex-1 justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <>
            <PageHeader title="مصمم إيصالات نقاط البيع">
                 <Button onClick={handleSave} disabled={loading}>
                    {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    <Save className="ml-2 h-4 w-4" />
                    حفظ التصميم
                </Button>
            </PageHeader>
            <main className="flex flex-col md:flex-row h-[calc(100vh-120px)] p-4 md:p-6 gap-4">
                <Card className="w-full md:w-1/3 lg:w-1/4 flex flex-col flex-none overflow-y-auto">
                    <CardContent className="p-4 space-y-4">
                        <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3']} className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>الإعدادات الأساسية</AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-4">
                                     <div className="space-y-2">
                                        <Label>عرض الإيصال (mm)</Label>
                                        <Input type="number" value={settings.receiptWidth} onChange={e => handleSettingChange('receiptWidth', Number(e.target.value))} placeholder="72 أو 80" />
                                     </div>
                                      <div className="space-y-2">
                                        <Label>رابط الشعار</Label>
                                        <Input value={settings.logoUrl} onChange={e => handleSettingChange('logoUrl', e.target.value)} placeholder="https://..." />
                                     </div>
                                </AccordionContent>
                            </AccordionItem>
                             <AccordionItem value="item-2">
                                <AccordionTrigger>إظهار/إخفاء العناصر</AccordionTrigger>
                                <AccordionContent className="space-y-3 pt-4">
                                    <SettingsToggle id="show-logo" label="إظهار الشعار" checked={settings.showLogo} onCheckedChange={v => handleSettingChange('showLogo', v)} />
                                    <SettingsToggle id="show-company" label="إظهار اسم الشركة" checked={settings.showCompanyName} onCheckedChange={v => handleSettingChange('showCompanyName', v)} />
                                    <SettingsToggle id="show-address" label="إظهار العنوان" checked={settings.showAddress} onCheckedChange={v => handleSettingChange('showAddress', v)} />
                                    <SettingsToggle id="show-phone" label="إظهار رقم الهاتف" checked={settings.showPhoneNumber} onCheckedChange={v => handleSettingChange('showPhoneNumber', v)} />
                                    <SettingsToggle id="show-cashier" label="إظهار اسم الكاشير" checked={settings.showCashier} onCheckedChange={v => handleSettingChange('showCashier', v)} />
                                    <SettingsToggle id="show-discount" label="إظهار الخصم" checked={settings.showDiscount} onCheckedChange={v => handleSettingChange('showDiscount', v)} />
                                    <SettingsToggle id="show-tax" label="إظهار الضريبة" checked={settings.showTax} onCheckedChange={v => handleSettingChange('showTax', v)} />
                                    <SettingsToggle id="show-barcode" label="إظهار الباركود" checked={settings.showBarcode} onCheckedChange={v => handleSettingChange('showBarcode', v)} />
                                    <SettingsToggle id="show-invoice-number" label="إظهار رقم الفاتورة" checked={settings.showInvoiceNumber} onCheckedChange={v => handleSettingChange('showInvoiceNumber', v)} />
                                    <SettingsToggle id="show-item-price" label="إظهار سعر الوحدة" checked={settings.showItemPrice} onCheckedChange={v => handleSettingChange('showItemPrice', v)} />
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3">
                                <AccordionTrigger>أحجام الخطوط (px)</AccordionTrigger>
                                <AccordionContent className="space-y-3 pt-4">
                                    <FontSizeControl label="اسم الشركة" value={settings.fontSizes.companyName} onChange={v => handleFontSizeChange('companyName', v)} />
                                    <FontSizeControl label="العناوين الفرعية" value={settings.fontSizes.header} onChange={v => handleFontSizeChange('header', v)} />
                                    <FontSizeControl label="بنود الفاتورة" value={settings.fontSizes.items} onChange={v => handleFontSizeChange('items', v)} />
                                    <FontSizeControl label="الإجماليات" value={settings.fontSizes.totals} onChange={v => handleFontSizeChange('totals', v)} />
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>
                 <div className="flex-1 flex bg-muted rounded-lg items-center justify-center p-4 overflow-hidden">
                    <div className="transform scale-125 md:scale-100 lg:scale-125 origin-center">
                        <PosReceipt invoice={SAMPLE_INVOICE} company={companySettings} design={settings} />
                    </div>
                </div>
            </main>
        </>
    );
};
