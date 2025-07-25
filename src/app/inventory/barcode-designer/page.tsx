
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
  CardFooter,
} from "@/components/ui/card";
import { useData } from '@/contexts/data-provider';
import { Loader2, Printer, Settings, Minus, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import Barcode from 'react-barcode';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

interface Item { id: string; name: string; unit: string; price: number; code?: string; }

const BarcodeDesignerPage = () => {
    const { items, loading } = useData();
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [printCount, setPrintCount] = useState<{ [key: string]: number }>({});
    
    const [settings, setSettings] = useState({
        companyName: "المحاسب الذكي",
        showCompanyName: true,
        showPrice: true,
        showCode: true,
        labelWidth: 60, // mm
        labelHeight: 40, // mm
        columns: 3,
        marginTop: 10,
        marginLeft: 10,
        marginRight: 10,
        marginBottom: 10,
        barcodeType: 'CODE128',
    });

    const handleSettingChange = (key: keyof typeof settings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleItemSelect = (itemId: string, checked: boolean) => {
        setSelectedItems(prev => {
            const newSelected = checked ? [...prev, itemId] : prev.filter(id => id !== itemId);
            setPrintCount(prevCount => ({ ...prevCount, [itemId]: checked ? 1 : 0 }));
            return newSelected;
        });
    };

    const handlePrintCountChange = (itemId: string, count: number) => {
        setPrintCount(prev => ({ ...prev, [itemId]: Math.max(0, count) }));
    };

    const barcodesToPrint = useMemo(() => {
        const result: { item: Item, count: number }[] = [];
        selectedItems.forEach(itemId => {
            const item = items.find((i: Item) => i.id === itemId);
            const count = printCount[itemId] || 0;
            if (item && count > 0) {
                result.push({ item, count });
            }
        });
        return result;
    }, [selectedItems, items, printCount]);
    
    const allBarcodes = useMemo(() => {
        return barcodesToPrint.flatMap(({ item, count }) => Array(count).fill(item));
    }, [barcodesToPrint]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return <div className="flex flex-1 justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <>
            <PageHeader title="تصميم وطباعة الباركود">
                <Button onClick={handlePrint} className="no-print">
                    <Printer className="ml-2 h-4 w-4" />
                    طباعة
                </Button>
            </PageHeader>
            <main className="flex flex-1 gap-4 p-4 md:gap-8 md:p-6">
                <div className="w-80 flex-shrink-0 space-y-6 no-print">
                    <Card>
                        <CardHeader><CardTitle>1. اختيار الأصناف</CardTitle></CardHeader>
                        <CardContent>
                            <ScrollArea className="h-64 border rounded-md p-2">
                                {items.map((item: Item) => (
                                    <div key={item.id} className="flex items-center gap-2 p-1">
                                        <Checkbox
                                            id={`item-${item.id}`}
                                            checked={selectedItems.includes(item.id)}
                                            onCheckedChange={(checked) => handleItemSelect(item.id, !!checked)}
                                        />
                                        <Label htmlFor={`item-${item.id}`} className="flex-1 cursor-pointer">{item.name}</Label>
                                        {selectedItems.includes(item.id) && (
                                             <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handlePrintCountChange(item.id, (printCount[item.id] || 1) - 1)}><Minus className="h-3 w-3"/></Button>
                                                <Input type="number" value={printCount[item.id] || 0} onChange={e => handlePrintCountChange(item.id, parseInt(e.target.value) || 0)} className="h-7 w-12 text-center p-0" />
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handlePrintCountChange(item.id, (printCount[item.id] || 0) + 1)}><Plus className="h-3 w-3"/></Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader><CardTitle>2. إعدادات التصميم</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>اسم الشركة</Label>
                                <Input value={settings.companyName} onChange={e => handleSettingChange('companyName', e.target.value)} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label>إظهار اسم الشركة</Label>
                                <Switch checked={settings.showCompanyName} onCheckedChange={v => handleSettingChange('showCompanyName', v)} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label>إظهار السعر</Label>
                                <Switch checked={settings.showPrice} onCheckedChange={v => handleSettingChange('showPrice', v)} />
                            </div>
                             <div className="flex items-center justify-between">
                                <Label>إظهار الكود</Label>
                                <Switch checked={settings.showCode} onCheckedChange={v => handleSettingChange('showCode', v)} />
                            </div>
                            <div className="space-y-2">
                                <Label>نوع الباركود</Label>
                                <Select value={settings.barcodeType} onValueChange={v => handleSettingChange('barcodeType', v)}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CODE128">Code 128</SelectItem>
                                        <SelectItem value="CODE39">Code 39</SelectItem>
                                        <SelectItem value="EAN13">EAN-13</SelectItem>
                                        <SelectItem value="UPC">UPC</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>3. إعدادات الملصق والصفحة</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                    <Label>عرض الملصق (mm)</Label>
                                    <Input type="number" value={settings.labelWidth} onChange={e => handleSettingChange('labelWidth', Number(e.target.value))} />
                                </div>
                                <div className="space-y-2">
                                    <Label>ارتفاع الملصق (mm)</Label>
                                    <Input type="number" value={settings.labelHeight} onChange={e => handleSettingChange('labelHeight', Number(e.target.value))} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>عدد الأعمدة في الصفحة</Label>
                                <Input type="number" value={settings.columns} onChange={e => handleSettingChange('columns', Number(e.target.value))} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                <Card className="flex-1 printable-area">
                    <CardHeader><CardTitle>معاينة الطباعة</CardTitle></CardHeader>
                    <CardContent>
                        <div 
                            className="bg-gray-100 p-4 grid gap-2"
                            style={{ gridTemplateColumns: `repeat(${settings.columns}, 1fr)` }}
                        >
                            {allBarcodes.map((item, index) => (
                                <div 
                                    key={index}
                                    className="bg-white p-1 flex flex-col items-center justify-center overflow-hidden"
                                    style={{
                                        width: `${settings.labelWidth}mm`,
                                        height: `${settings.labelHeight}mm`,
                                    }}
                                >
                                    {settings.showCompanyName && <p className="text-[6px] font-bold text-center">{settings.companyName}</p>}
                                    <p className="text-[7px] text-center font-semibold leading-tight my-0.5">{item.name}</p>
                                    <Barcode 
                                        value={item.code || 'NO-CODE'} 
                                        width={1} 
                                        height={15} 
                                        fontSize={8} 
                                        margin={2}
                                        displayValue={settings.showCode}
                                        format={settings.barcodeType}
                                    />
                                    {settings.showPrice && <p className="text-[8px] font-bold text-center mt-0.5">{item.price.toFixed(2)} EGP</p>}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </>
    );
};

export default BarcodeDesignerPage;

