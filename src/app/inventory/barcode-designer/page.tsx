
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useData } from '@/contexts/data-provider';
import { Loader2, Printer, Settings, Save, Trash2, PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import Barcode from 'react-barcode';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Design {
    id?: string;
    name: string;
    companyName: string;
    showCompanyName: boolean;
    showPrice: boolean;
    showCode: boolean;
    labelWidth: number;
    labelHeight: number;
    barcodeType: string;
    fontSize: number;
}

const DEFAULT_DESIGN: Design = {
    name: "",
    companyName: "اسم شركتك",
    showCompanyName: true,
    showPrice: true,
    showCode: true,
    labelWidth: 50,
    labelHeight: 25,
    barcodeType: 'CODE128',
    fontSize: 10,
};

const SAMPLE_ITEM = {
    name: "صنف افتراضي للمعاينة",
    code: "123456789012",
    price: 99.99
};

const BarcodeDesignerPage = () => {
    const { barcodeDesigns, dbAction, loading } = useData();
    const { toast } = useToast();
    const [currentDesign, setCurrentDesign] = useState<Design>(DEFAULT_DESIGN);
    const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);

    useEffect(() => {
        if (selectedDesignId) {
            const loadedDesign = barcodeDesigns.find((d: Design) => d.id === selectedDesignId);
            if (loadedDesign) {
                setCurrentDesign(loadedDesign);
            }
        } else {
            setCurrentDesign(DEFAULT_DESIGN);
        }
    }, [selectedDesignId, barcodeDesigns]);

    const handleSettingChange = (key: keyof Design, value: any) => {
        setCurrentDesign(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveDesign = async () => {
        if (!currentDesign.name) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'يجب إدخال اسم للتصميم.' });
            return;
        }

        try {
            if (currentDesign.id) {
                await dbAction('barcodeDesigns', 'update', { id: currentDesign.id, data: currentDesign });
                toast({ title: 'تم التحديث', description: 'تم تحديث تصميم الباركود بنجاح.' });
            } else {
                const newId = await dbAction('barcodeDesigns', 'add', currentDesign);
                toast({ title: 'تم الحفظ', description: 'تم حفظ تصميم الباركود الجديد.' });
                if (newId) setSelectedDesignId(newId as string);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حفظ التصميم.' });
        }
    };
    
    const handleDeleteDesign = async (id: string) => {
        if (confirm('هل أنت متأكد من حذف هذا التصميم؟')) {
            await dbAction('barcodeDesigns', 'remove', {id});
            if(selectedDesignId === id) {
                setSelectedDesignId(null);
            }
            toast({title: 'تم الحذف بنجاح'});
        }
    }

    const handleNewDesign = () => {
        setSelectedDesignId(null);
        setCurrentDesign(DEFAULT_DESIGN);
    }
    
    const sampleBarcodeValue = useMemo(() => {
        if (currentDesign.barcodeType === 'EAN13') return "123456789012";
        if (currentDesign.barcodeType === 'UPC') return "12345678901";
        return "SAMPLE12345";
    }, [currentDesign.barcodeType]);


    if (loading) {
        return <div className="flex flex-1 justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <>
            <PageHeader title="مصمم ملصقات الباركود">
                <Button onClick={handleSaveDesign}>
                    <Save className="ml-2 h-4 w-4" />
                    حفظ التصميم الحالي
                </Button>
            </PageHeader>
            <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 md:p-6">
                <Card className="md:col-span-1 flex flex-col h-full">
                    <CardHeader>
                        <div className='flex justify-between items-center'>
                            <CardTitle>الإعدادات</CardTitle>
                            <Button size="sm" variant="outline" onClick={handleNewDesign}>
                                <PlusCircle className="ml-2 h-4 w-4"/> تصميم جديد
                            </Button>
                        </div>
                    </CardHeader>
                     <CardContent className="flex-grow space-y-6">
                        {/* Saved Designs */}
                        <div className="space-y-2">
                            <Label>قوالب محفوظة</Label>
                            <ScrollArea className="h-32 border rounded-md p-2">
                                {barcodeDesigns.length > 0 ? barcodeDesigns.map((design: Design) => (
                                    <div key={design.id} className="flex items-center justify-between gap-2 p-1 hover:bg-muted rounded-md">
                                        <Button variant="link" className="p-0 h-auto flex-1 justify-start" onClick={() => setSelectedDesignId(design.id!)}>{design.name}</Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteDesign(design.id!)}><Trash2 className="h-3 w-3"/></Button>
                                    </div>
                                )) : <p className="text-sm text-muted-foreground text-center p-4">لا توجد تصاميم محفوظة.</p>}
                            </ScrollArea>
                        </div>

                        {/* Design Settings */}
                        <div className="space-y-4">
                             <div className="space-y-2">
                                <Label>اسم التصميم</Label>
                                <Input value={currentDesign.name} onChange={e => handleSettingChange('name', e.target.value)} placeholder="مثال: ملصق 5x2.5" />
                            </div>
                            <div className="space-y-2">
                                <Label>اسم الشركة</Label>
                                <Input value={currentDesign.companyName} onChange={e => handleSettingChange('companyName', e.target.value)} />
                            </div>
                             <div className="space-y-2">
                                <Label>نوع الباركود</Label>
                                <Select value={currentDesign.barcodeType} onValueChange={v => handleSettingChange('barcodeType', v)}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CODE128">Code 128</SelectItem>
                                        <SelectItem value="CODE39">Code 39</SelectItem>
                                        <SelectItem value="EAN13">EAN-13</SelectItem>
                                        <SelectItem value="UPC">UPC</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-between">
                                <Label>إظهار اسم الشركة</Label>
                                <Switch checked={currentDesign.showCompanyName} onCheckedChange={v => handleSettingChange('showCompanyName', v)} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label>إظهار السعر</Label>
                                <Switch checked={currentDesign.showPrice} onCheckedChange={v => handleSettingChange('showPrice', v)} />
                            </div>
                             <div className="flex items-center justify-between">
                                <Label>إظهار الكود</Label>
                                <Switch checked={currentDesign.showCode} onCheckedChange={v => handleSettingChange('showCode', v)} />
                            </div>
                             <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                    <Label>عرض الملصق (mm)</Label>
                                    <Input type="number" value={currentDesign.labelWidth} onChange={e => handleSettingChange('labelWidth', Number(e.target.value))} />
                                </div>
                                <div className="space-y-2">
                                    <Label>ارتفاع الملصق (mm)</Label>
                                    <Input type="number" value={currentDesign.labelHeight} onChange={e => handleSettingChange('labelHeight', Number(e.target.value))} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>حجم الخط (px)</Label>
                                <Input type="number" value={currentDesign.fontSize} onChange={e => handleSettingChange('fontSize', Number(e.target.value))} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="md:col-span-2 flex flex-col">
                    <CardHeader><CardTitle>معاينة التصميم</CardTitle></CardHeader>
                    <CardContent className="bg-muted flex-grow p-4 flex items-center justify-center">
                        <div 
                            className="bg-white p-1 flex flex-col items-center justify-center overflow-hidden shadow-lg"
                            style={{
                                width: `${currentDesign.labelWidth}mm`,
                                height: `${currentDesign.labelHeight}mm`,
                                transform: 'scale(2)', // Scale up for better visibility in smaller area
                                transformOrigin: 'center'
                            }}
                        >
                            {currentDesign.showCompanyName && <p className="text-center font-bold" style={{fontSize: `${currentDesign.fontSize-2}px`}}>{currentDesign.companyName}</p>}
                            <p className="text-center font-semibold leading-tight my-0.5" style={{fontSize: `${currentDesign.fontSize-1}px`}}>{SAMPLE_ITEM.name}</p>
                            <Barcode 
                                value={sampleBarcodeValue} 
                                width={1} 
                                height={currentDesign.labelHeight / 3}
                                fontSize={currentDesign.fontSize}
                                margin={2}
                                displayValue={currentDesign.showCode}
                                format={currentDesign.barcodeType}
                            />
                            {currentDesign.showPrice && <p className="font-bold text-center mt-0.5" style={{fontSize: `${currentDesign.fontSize}px`}}>{SAMPLE_ITEM.price.toFixed(2)} EGP</p>}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </>
    );
};

export default BarcodeDesignerPage;
