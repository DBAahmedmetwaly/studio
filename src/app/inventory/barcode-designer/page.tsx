
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
} from "@/components/ui/card";
import { useData } from '@/contexts/data-provider';
import { Loader2, Save, Trash2, PlusCircle, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import Barcode from 'react-barcode';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';

interface DesignElementPositions {
    y: number;
    x: number;
}
interface Design {
    id?: string;
    name: string;
    companyName: string;
    showCompanyName: boolean;
    showPrice: boolean;
    showCode: boolean;
    showBarcode: boolean;
    labelWidth: number;
    labelHeight: number;
    barcodeType: string;
    fontSize: number;
    positions: {
        companyName: DesignElementPositions;
        itemName: DesignElementPositions;
        barcode: DesignElementPositions;
        price: DesignElementPositions;
    }
}

const DEFAULT_POSITIONS = {
    companyName: { y: 10, x: 50 },
    itemName: { y: 30, x: 50 },
    barcode: { y: 60, x: 50 },
    price: { y: 85, x: 50 },
};

const DEFAULT_DESIGN: Design = {
    name: "تصميم جديد",
    companyName: "اسم شركتك",
    showCompanyName: true,
    showPrice: true,
    showCode: true,
    showBarcode: true,
    labelWidth: 50,
    labelHeight: 25,
    barcodeType: 'CODE128',
    fontSize: 10,
    positions: DEFAULT_POSITIONS
};

const SAMPLE_ITEM = {
    name: "صنف افتراضي",
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
                // Ensure loaded design has all fields, fallback to default if not
                const mergedDesign = {...DEFAULT_DESIGN, ...loadedDesign};
                mergedDesign.positions = {...DEFAULT_DESIGN.positions, ...loadedDesign.positions};
                setCurrentDesign(mergedDesign);
            }
        } else {
            setCurrentDesign(DEFAULT_DESIGN);
        }
    }, [selectedDesignId, barcodeDesigns]);
    
    const handleSettingChange = (key: keyof Design, value: any) => {
        setCurrentDesign(prev => ({ ...prev, [key]: value }));
    };
    
    const handlePositionChange = (element: keyof Design['positions'], axis: 'x' | 'y', value: number) => {
        setCurrentDesign(prev => ({
            ...prev,
            positions: {
                ...prev.positions,
                [element]: { ...prev.positions[element], [axis]: value }
            }
        }))
    }

    const resetPositions = () => {
        setCurrentDesign(prev => ({...prev, positions: DEFAULT_POSITIONS }));
    }

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
            <main className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 md:p-6 h-[calc(100vh-100px)]">
                <Card className="md:col-span-1 flex flex-col h-full">
                    <CardHeader>
                        <div className='flex justify-between items-center'>
                            <CardTitle>الإعدادات</CardTitle>
                            <Button size="sm" variant="outline" onClick={handleNewDesign}>
                                <PlusCircle className="ml-2 h-4 w-4"/> تصميم جديد
                            </Button>
                        </div>
                    </CardHeader>
                     <ScrollArea className="flex-grow">
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>قوالب محفوظة</Label>
                                <div className="h-32 border rounded-md p-2 space-y-1">
                                    <ScrollArea className="h-full">
                                    {barcodeDesigns.length > 0 ? barcodeDesigns.map((design: Design) => (
                                        <div key={design.id} className="flex items-center justify-between gap-2 p-1 hover:bg-muted rounded-md">
                                            <Button variant="link" className="p-0 h-auto flex-1 justify-start" onClick={() => setSelectedDesignId(design.id!)}>{design.name}</Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteDesign(design.id!)}><Trash2 className="h-3 w-3"/></Button>
                                        </div>
                                    )) : <p className="text-sm text-muted-foreground text-center p-4">لا توجد تصاميم محفوظة.</p>}
                                    </ScrollArea>
                                </div>
                            </div>
                            
                            <Separator />
                            <Label className="font-semibold">إعدادات الملصق</Label>
                             <div className="space-y-2">
                                <Label className="text-xs">اسم التصميم</Label>
                                <Input value={currentDesign.name} onChange={e => handleSettingChange('name', e.target.value)} placeholder="مثال: ملصق 5x2.5" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">اسم الشركة</Label>
                                <Input value={currentDesign.companyName} onChange={e => handleSettingChange('companyName', e.target.value)} />
                            </div>
                             <div className="space-y-2">
                                <Label className="text-xs">نوع الباركود</Label>
                                <Select value={currentDesign.barcodeType} onValueChange={v => handleSettingChange('barcodeType', v)}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CODE128">Code 128</SelectItem>
                                        <SelectItem value="CODE39">Code 39</SelectItem>
                                        <SelectItem value="EAN13">EAN-13</SelectItem>
                                        <SelectItem value="UPC">UPC</SelectItem>
                                        <SelectItem value="QR">QR Code</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-between"><Label className="text-xs">إظهار اسم الشركة</Label><Switch checked={currentDesign.showCompanyName} onCheckedChange={v => handleSettingChange('showCompanyName', v)} /></div>
                            <div className="flex items-center justify-between"><Label className="text-xs">إظهار السعر</Label><Switch checked={currentDesign.showPrice} onCheckedChange={v => handleSettingChange('showPrice', v)} /></div>
                             <div className="flex items-center justify-between"><Label className="text-xs">إظهار رسم الباركود</Label><Switch checked={currentDesign.showBarcode} onCheckedChange={v => handleSettingChange('showBarcode', v)} /></div>
                             <div className="flex items-center justify-between"><Label className="text-xs">إظهار الكود (نص)</Label><Switch checked={currentDesign.showCode} onCheckedChange={v => handleSettingChange('showCode', v)} /></div>
                             <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2"><Label className="text-xs">عرض الملصق (mm)</Label><Input type="number" value={currentDesign.labelWidth} onChange={e => handleSettingChange('labelWidth', Number(e.target.value))} /></div>
                                <div className="space-y-2"><Label className="text-xs">ارتفاع الملصق (mm)</Label><Input type="number" value={currentDesign.labelHeight} onChange={e => handleSettingChange('labelHeight', Number(e.target.value))} /></div>
                            </div>
                            <div className="space-y-2"><Label className="text-xs">حجم الخط (px)</Label><Input type="number" value={currentDesign.fontSize} onChange={e => handleSettingChange('fontSize', Number(e.target.value))} /></div>

                            <Separator />
                            <div className='flex justify-between items-center'><Label className="font-semibold">موضع العناصر</Label><Button size="sm" variant="ghost" onClick={resetPositions}><RotateCcw className="ml-2 h-3 w-3" />إعادة تعيين</Button></div>
                             {(Object.keys(currentDesign.positions) as Array<keyof Design['positions']>).map(element => (
                                <div key={element} className="space-y-2 border p-2 rounded-md">
                                    <Label className="text-xs">{element}</Label>
                                    <div className='grid grid-cols-2 gap-2 text-xs'><div>أعلى/أسفل: {currentDesign.positions[element].y}%</div><div>يمين/يسار: {currentDesign.positions[element].x}%</div></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Slider defaultValue={[currentDesign.positions[element].y]} max={100} step={1} onValueChange={(v) => handlePositionChange(element, 'y', v[0])} />
                                        <Slider defaultValue={[currentDesign.positions[element].x]} max={100} step={1} onValueChange={(v) => handlePositionChange(element, 'x', v[0])} />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </ScrollArea>
                </Card>
                
                <div className="md:col-span-2 flex flex-col h-full bg-muted rounded-lg items-center justify-center p-4">
                    <div 
                        className="bg-white shadow-lg overflow-hidden relative"
                        style={{
                            width: `${currentDesign.labelWidth}mm`,
                            height: `${currentDesign.labelHeight}mm`,
                            fontFamily: 'sans-serif',
                            transform: 'scale(3)',
                            transformOrigin: 'center'
                        }}
                    >
                        {currentDesign.showCompanyName && (
                            <p style={{ position: 'absolute', top: `${currentDesign.positions.companyName.y}%`, left: `${currentDesign.positions.companyName.x}%`, transform: 'translate(-50%, -50%)', width: '100%', textAlign: 'center', fontSize: `${currentDesign.fontSize-2}px`, fontWeight: 'bold', padding: '0 2px' }}>{currentDesign.companyName}</p>
                        )}
                         <p style={{ position: 'absolute', top: `${currentDesign.positions.itemName.y}%`, left: `${currentDesign.positions.itemName.x}%`, transform: 'translate(-50%, -50%)', width: '100%', textAlign: 'center', fontSize: `${currentDesign.fontSize-1}px`, fontWeight: '600', padding: '0 2px' }}>{SAMPLE_ITEM.name}</p>
                         
                         {currentDesign.showBarcode && (
                         <div style={{ position: 'absolute', top: `${currentDesign.positions.barcode.y}%`, left: `${currentDesign.positions.barcode.x}%`, transform: 'translate(-50%, -50%)', width: '90%', boxSizing: 'border-box' }}>
                           {currentDesign.barcodeType === 'QR' ? (
                                <QRCodeSVG value={sampleBarcodeValue} width="100%" height="auto" />
                            ) : (
                                <Barcode 
                                    value={sampleBarcodeValue} 
                                    width={1} 
                                    height={currentDesign.labelHeight / 3}
                                    fontSize={currentDesign.fontSize}
                                    margin={2}
                                    displayValue={currentDesign.showCode}
                                    format={currentDesign.barcodeType}
                                    renderer="svg"
                                    background='transparent'
                                />
                            )}
                        </div>
                        )}
                       
                        {currentDesign.showPrice && (
                             <p style={{ position: 'absolute', top: `${currentDesign.positions.price.y}%`, left: `${currentDesign.positions.price.x}%`, transform: 'translate(-50%, -50%)', width: '100%', textAlign: 'center', fontSize: `${currentDesign.fontSize}px`, fontWeight: 'bold', padding: '0 2px' }}>{SAMPLE_ITEM.price.toFixed(2)} EGP</p>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
};

export default BarcodeDesignerPage;

