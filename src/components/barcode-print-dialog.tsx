
"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import Barcode from 'react-barcode';
import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';
import ReactDOMServer from 'react-dom/server';


interface Item {
  id?: string;
  code?: string;
  name: string;
  price: number;
}
interface DesignFontSizes {
    companyName: number;
    itemName: number;
    barcode: number;
    price: number;
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
    rotation?: number;
    fontSizes: DesignFontSizes;
    positions: {
        companyName: { y: number; x: number; };
        itemName: { y: number; x: number; };
        barcode: { y: number; x: number; };
        price: { y: number; x: number; };
    }
}

const DEFAULT_POSITIONS = {
    companyName: { y: 10, x: 50 },
    itemName: { y: 30, x: 50 },
    barcode: { y: 60, x: 50 },
    price: { y: 85, x: 50 },
};

const DEFAULT_FONTS: DesignFontSizes = {
    companyName: 8,
    itemName: 10,
    barcode: 8,
    price: 10,
}

const DEFAULT_DESIGN: Design = {
    name: "تصميم افتراضي",
    companyName: "اسم شركتك",
    showCompanyName: true,
    showPrice: true,
    showCode: true,
    showBarcode: true,
    labelWidth: 50,
    labelHeight: 25,
    rotation: 0,
    barcodeType: 'CODE128',
    fontSizes: DEFAULT_FONTS,
    positions: DEFAULT_POSITIONS
};


export const BarcodePrintDialog = ({ item, barcodeDesigns, trigger }: { item: Item, barcodeDesigns: Design[], trigger: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDesignId, setSelectedDesignId] = useState('');
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        // Set a default design when the dialog opens and designs are available
        if (isOpen && barcodeDesigns.length > 0 && !selectedDesignId) {
            setSelectedDesignId(barcodeDesigns[0].id!);
        }
    }, [isOpen, barcodeDesigns, selectedDesignId]);

    const activeDesign = useMemo(() => {
        const design = barcodeDesigns.find(d => d.id === selectedDesignId);
        if (!design) return DEFAULT_DESIGN;
        
        // Deep merge with defaults to avoid errors with older designs
        return {
            ...DEFAULT_DESIGN,
            ...design,
            positions: {
                ...DEFAULT_DESIGN.positions,
                ...(design.positions || {})
            },
            fontSizes: {
                ...DEFAULT_DESIGN.fontSizes,
                ...(design.fontSizes || {})
            }
        };
    }, [selectedDesignId, barcodeDesigns]);

    const handlePrint = () => {
        if (!activeDesign) return;

        const printWindow = window.open('', '_blank', 'height=600,width=800');
        if (printWindow) {
            const barcodeValue = item.code || "NO_CODE";
            const barcodeComponent = activeDesign.barcodeType === 'QR'
                ? <QRCodeSVG value={barcodeValue} width="100%" height="auto" />
                : <Barcode 
                    value={barcodeValue} 
                    width={1} 
                    height={activeDesign.labelHeight / 3}
                    fontSize={activeDesign.fontSizes.barcode}
                    margin={2}
                    displayValue={activeDesign.showCode}
                    format={activeDesign.barcodeType}
                    renderer="svg"
                    background='transparent'
                  />;

            const barcodeHtml = ReactDOMServer.renderToStaticMarkup(barcodeComponent);

            const labelStyle = `width: ${activeDesign.labelWidth}mm; height: ${activeDesign.labelHeight}mm; position: relative; display: inline-block; vertical-align: top; overflow: hidden; border: 1px dotted #ccc; box-sizing: border-box; transform: rotate(${activeDesign.rotation || 0}deg);`;
            const companyNameStyle = `position: absolute; top: ${activeDesign.positions.companyName.y}%; left: ${activeDesign.positions.companyName.x}%; transform: translate(-50%, -50%); width: 100%; text-align: center; font-size: ${activeDesign.fontSizes.companyName}px; font-weight: bold;`;
            const itemNameStyle = `position: absolute; top: ${activeDesign.positions.itemName.y}%; left: ${activeDesign.positions.itemName.x}%; transform: translate(-50%, -50%); width: 100%; text-align: center; font-size: ${activeDesign.fontSizes.itemName}px; font-weight: 600;`;
            const barcodeContainerStyle = `position: absolute; top: ${activeDesign.positions.barcode.y}%; left: ${activeDesign.positions.barcode.x}%; transform: translate(-50%, -50%); width: 90%;`;
            const priceStyle = `position: absolute; top: ${activeDesign.positions.price.y}%; left: ${activeDesign.positions.price.x}%; transform: translate(-50%, -50%); width: 100%; text-align: center; font-size: ${activeDesign.fontSizes.price}px; font-weight: bold;`;

            let labelsHtml = '';
            for (let i = 0; i < quantity; i++) {
                labelsHtml += `<div class="label" style="${labelStyle}">`;
                if (activeDesign.showCompanyName) labelsHtml += `<p style="${companyNameStyle}">${activeDesign.companyName}</p>`;
                labelsHtml += `<p style="${itemNameStyle}">${item.name}</p>`;
                if (activeDesign.showBarcode) {
                    labelsHtml += `<div style="${barcodeContainerStyle}">${barcodeHtml}</div>`;
                }
                if (activeDesign.showPrice) labelsHtml += `<p style="${priceStyle}">${item.price.toFixed(2)} EGP</p>`;
                labelsHtml += `</div>`;
            }

            printWindow.document.write(`
                <html>
                    <head>
                        <title>Print Barcode</title>
                        <style>
                            @media print { @page { size: auto; margin: 0mm; } body { margin: 0; } }
                            .label-container { display: flex; flex-wrap: wrap; gap: 0; }
                            .label { page-break-inside: avoid; }
                            p { margin: 0; padding: 0; }
                            svg { max-width: 100%; height: auto; }
                        </style>
                    </head>
                    <body style="font-family: sans-serif;">
                        <div class="label-container">${labelsHtml}</div>
                    </body>
                </html>
            `);
            
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {React.cloneElement(trigger as React.ReactElement, { onClick: () => setIsOpen(true) })}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>طباعة باركود لـ: {item.name}</DialogTitle>
                    <DialogDescription>اختر تصميمًا وكمية للطباعة.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>تصميم الملصق</Label>
                            <Select value={selectedDesignId} onValueChange={setSelectedDesignId}>
                                <SelectTrigger><SelectValue placeholder="اختر تصميمًا..." /></SelectTrigger>
                                <SelectContent>
                                    {barcodeDesigns.map(d => <SelectItem key={d.id} value={d.id!}>{d.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>الكمية</Label>
                            <Input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min={1} />
                        </div>
                    </div>
                    {activeDesign && (
                        <div className="space-y-2">
                            <Label>معاينة</Label>
                             <div className="p-4 bg-muted rounded-md flex justify-center items-center min-h-[150px]">
                                <div 
                                    className="bg-white shadow-lg overflow-hidden relative"
                                    style={{
                                        width: `${activeDesign.labelWidth * 2.5}px`, // Render at a larger size for clarity
                                        height: `${activeDesign.labelHeight * 2.5}px`,
                                        fontFamily: 'sans-serif',
                                        transform: `rotate(${activeDesign.rotation || 0}deg)`
                                    }}
                                >
                                    {activeDesign.showCompanyName && (
                                        <p style={{ position: 'absolute', top: `${activeDesign.positions.companyName.y}%`, left: `${activeDesign.positions.companyName.x}%`, transform: 'translate(-50%, -50%)', width: '100%', textAlign: 'center', fontSize: `${activeDesign.fontSizes.companyName}px`, fontWeight: 'bold' }}>{activeDesign.companyName}</p>
                                    )}
                                    <p style={{ position: 'absolute', top: `${activeDesign.positions.itemName.y}%`, left: `${activeDesign.positions.itemName.x}%`, transform: 'translate(-50%, -50%)', width: '100%', textAlign: 'center', fontSize: `${activeDesign.fontSizes.itemName}px`, fontWeight: '600' }}>{item.name}</p>
                                    
                                    {activeDesign.showBarcode && (
                                    <div style={{ position: 'absolute', top: `${activeDesign.positions.barcode.y}%`, left: `${activeDesign.positions.barcode.x}%`, transform: 'translate(-50%, -50%)', width: '90%', boxSizing: 'border-box' }}>
                                       {activeDesign.barcodeType === 'QR' ? (
                                            <QRCodeSVG value={item.code || "NO_CODE"} width="100%" height="auto" />
                                        ) : (
                                            <Barcode 
                                                value={item.code || "NO_CODE"} 
                                                width={1} 
                                                height={activeDesign.labelHeight} // Adjust height for preview
                                                fontSize={activeDesign.fontSizes.barcode}
                                                margin={2}
                                                displayValue={activeDesign.showCode}
                                                format={activeDesign.barcodeType}
                                                renderer="svg"
                                                background='transparent'
                                            />
                                        )}
                                    </div>
                                    )}
                                    {activeDesign.showPrice && (
                                         <p style={{ position: 'absolute', top: `${activeDesign.positions.price.y}%`, left: `${activeDesign.positions.price.x}%`, transform: 'translate(-50%, -50%)', width: '100%', textAlign: 'center', fontSize: `${activeDesign.fontSizes.price}px`, fontWeight: 'bold' }}>{item.price.toFixed(2)} EGP</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                 <div className="flex justify-end pt-4">
                    <Button onClick={handlePrint} disabled={!activeDesign || quantity < 1}>
                        <Printer className="ml-2 h-4 w-4" />
                        طباعة
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
