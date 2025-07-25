
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
        if (!design) return null;
        
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
            printWindow.document.write('<html><head><title>Print Barcode</title>');
            printWindow.document.write('<style>@media print { @page { size: auto; margin: 0mm; } body { margin: 0; } .label-container { display: flex; flex-wrap: wrap; gap: 0; } .label { display: inline-block; vertical-align: top; overflow: hidden; border: 1px dotted #ccc; box-sizing: border-box; } p { margin: 0; padding: 0; } svg { max-width: 100%; height: auto; } }</style>');
            printWindow.document.write('</head><body style="font-family: sans-serif;">');
            
            let labelsHtml = '<div class="label-container">';
            for (let i = 0; i < quantity; i++) {
                const labelStyle = `width: ${activeDesign.labelWidth}mm; height: ${activeDesign.labelHeight}mm; position: relative;`;
                const companyNameStyle = `position: absolute; top: ${activeDesign.positions.companyName.y}%; left: ${activeDesign.positions.companyName.x}%; transform: translate(-50%, -50%); width: 100%; text-align: center; font-size: ${activeDesign.fontSizes.companyName}px; font-weight: bold;`;
                const itemNameStyle = `position: absolute; top: ${activeDesign.positions.itemName.y}%; left: ${activeDesign.positions.itemName.x}%; transform: translate(-50%, -50%); width: 100%; text-align: center; font-size: ${activeDesign.fontSizes.itemName}px; font-weight: 600;`;
                const barcodeContainerStyle = `position: absolute; top: ${activeDesign.positions.barcode.y}%; left: ${activeDesign.positions.barcode.x}%; transform: translate(-50%, -50%); width: 90%;`;
                const priceStyle = `position: absolute; top: ${activeDesign.positions.price.y}%; left: ${activeDesign.positions.price.x}%; transform: translate(-50%, -50%); width: 100%; text-align: center; font-size: ${activeDesign.fontSizes.price}px; font-weight: bold;`;

                const barcodeValue = item.code || "123456789";

                labelsHtml += `<div class="label" style="${labelStyle}">`;
                if(activeDesign.showCompanyName) labelsHtml += `<p style="${companyNameStyle}">${activeDesign.companyName}</p>`;
                labelsHtml += `<p style="${itemNameStyle}">${item.name}</p>`;
                if(activeDesign.showBarcode) {
                    labelsHtml += `<div style="${barcodeContainerStyle}">`;
                    // This part is tricky. We can't render a React component directly. We need its SVG string.
                    const barcodeComponent = activeDesign.barcodeType === 'QR'
                        ? new QRCodeSVG({ value: barcodeValue, width: "100%", height: "auto" })
                        : new Barcode({ value: barcodeValue, width: 1, height: activeDesign.labelHeight / 3, fontSize: activeDesign.fontSizes.barcode, margin: 2, displayValue: activeDesign.showCode, format: activeDesign.barcodeType, renderer:"svg", background:'transparent' });
                    // A trick to get SVG string from a React component - render it to a temporary div.
                    const tempDiv = document.createElement('div');
                    const ReactDOM = require('react-dom'); // Temporary, not ideal for SSR
                    ReactDOM.render(barcodeComponent, tempDiv);
                    labelsHtml += tempDiv.innerHTML;
                    ReactDOM.unmountComponentAtNode(tempDiv);
                    labelsHtml += `</div>`;
                }
                if(activeDesign.showPrice) labelsHtml += `<p style="${priceStyle}">${item.price.toFixed(2)} EGP</p>`;
                labelsHtml += `</div>`;
            }
            labelsHtml += '</div>';

            printWindow.document.write(labelsHtml);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => { // Timeout to ensure content is rendered
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
            <DialogContent>
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
                            <div className="p-4 bg-muted rounded-md flex justify-center items-center">
                                <div 
                                    className="bg-white shadow-lg overflow-hidden relative"
                                    style={{
                                        width: `${activeDesign.labelWidth}mm`,
                                        height: `${activeDesign.labelHeight}mm`,
                                        fontFamily: 'sans-serif',
                                        transform: 'scale(2.5)',
                                        transformOrigin: 'center'
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
                                                height={activeDesign.labelHeight / 3}
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
