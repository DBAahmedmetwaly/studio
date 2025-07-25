
"use client";

import React, { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import useFirebase from "@/hooks/use-firebase";
import { Loader2, Save, Bluetooth, Wifi } from "lucide-react";
import { usePermissions } from "@/contexts/permissions-context";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface PrinterSettings {
  posPrinterType: 'bluetooth' | 'ip';
  posPrinterAddress: string;
  purchasePrinterType: 'bluetooth' | 'ip';
  purchasePrinterAddress: string;
  barcodePrinterType: 'bluetooth' | 'ip';
  barcodePrinterAddress: string;
}

export default function PrintersPage() {
    const { toast } = useToast();
    const { can } = usePermissions();
    const { data: settingsData, update: updateSettings, loading } = useFirebase<PrinterSettings>('settings/printers');
    const [settings, setSettings] = useState<PrinterSettings>({
        posPrinterType: 'bluetooth',
        posPrinterAddress: '',
        purchasePrinterType: 'bluetooth',
        purchasePrinterAddress: '',
        barcodePrinterType: 'bluetooth',
        barcodePrinterAddress: '',
    });
    
    const [discoveredDevices, setDiscoveredDevices] = useState<any[]>([]);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        if (settingsData && settingsData.length > 0) {
            // Data is an array, we need to find the main settings object
            const mainSettings = settingsData.find(s => s.id === 'main');
            if (mainSettings) {
                setSettings(mainSettings);
            }
        }
    }, [settingsData]);


    const handleScanBluetooth = async () => {
        if (!navigator.bluetooth) {
            toast({ variant: 'destructive', title: 'غير مدعوم', description: 'متصفحك لا يدعم Web Bluetooth.' });
            return;
        }
        setIsScanning(true);
        try {
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
            });
            setDiscoveredDevices(prev => {
                const exists = prev.some(d => d.id === device.id);
                if (!exists) return [...prev, device];
                return prev;
            });
            toast({ title: 'تم العثور على جهاز', description: `تم العثور على ${device.name || `جهاز غير مسمى (${device.id})`}` });
        } catch (error) {
            console.error('Error scanning for bluetooth devices:', error);
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل البحث عن الأجهزة.' });
        } finally {
            setIsScanning(false);
        }
    };
    
    const handleSave = async () => {
        if (!can('edit', 'settings_printers')) {
            toast({ variant: "destructive", title: "غير مصرح به" });
            return;
        }
        try {
            await updateSettings('main', settings);
            toast({ title: "تم الحفظ بنجاح", description: "تم تحديث إعدادات الطابعات." });
        } catch (error) {
            toast({ variant: "destructive", title: "خطأ", description: "فشل حفظ الإعدادات." });
        }
    }

    const PrinterSelector = ({ type, address, onTypeChange, onAddressChange, title }: { type: 'bluetooth' | 'ip', address: string, onTypeChange: (value: any) => void, onAddressChange: (value: string) => void, title: string }) => (
        <Card>
            <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <Select value={type} onValueChange={onTypeChange}>
                    <SelectTrigger><SelectValue placeholder="اختر نوع الاتصال" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="bluetooth">بلوتوث (Bluetooth)</SelectItem>
                        <SelectItem value="ip">شبكة (IP Address)</SelectItem>
                    </SelectContent>
                </Select>
                 {type === 'bluetooth' ? (
                    <div className="space-y-2">
                        <Label>الطابعة المكتشفة</Label>
                        <Select value={address} onValueChange={onAddressChange}>
                             <SelectTrigger><SelectValue placeholder="اختر طابعة" /></SelectTrigger>
                             <SelectContent>
                                {discoveredDevices.map(device => (
                                    <SelectItem key={device.id} value={device.id}>
                                        {device.name || `جهاز غير مسمى (${device.id})`}
                                    </SelectItem>
                                ))}
                                {discoveredDevices.length === 0 && <SelectItem value="" disabled>لم يتم العثور على أجهزة</SelectItem>}
                             </SelectContent>
                        </Select>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <Label>عنوان IP للطابعة</Label>
                        <Input value={address} onChange={e => onAddressChange(e.target.value)} placeholder="e.g., 192.168.1.100" />
                    </div>
                )}
            </CardContent>
        </Card>
    );

    if (loading) return <div className="flex flex-1 justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div>

    return (
        <>
            <PageHeader title="إعدادات الطباعة" />
            <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Bluetooth /> البحث عن طابعات البلوتوث</CardTitle>
                        <CardDescription>
                            استخدم هذا الزر للبحث عن طابعات البلوتوث القريبة. يجب أن يكون البلوتوث ممكّنًا في جهازك وأن توافق على إذن الوصول في متصفحك.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleScanBluetooth} disabled={isScanning}>
                            {isScanning && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                            {isScanning ? 'جارٍ البحث...' : 'بحث عن طابعات'}
                        </Button>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <PrinterSelector 
                        title="طابعة فواتير الكاشير"
                        type={settings.posPrinterType}
                        address={settings.posPrinterAddress}
                        onTypeChange={value => setSettings(prev => ({ ...prev, posPrinterType: value }))}
                        onAddressChange={value => setSettings(prev => ({ ...prev, posPrinterAddress: value }))}
                   />
                   <PrinterSelector 
                        title="طابعة فواتير الشراء"
                        type={settings.purchasePrinterType}
                        address={settings.purchasePrinterAddress}
                        onTypeChange={value => setSettings(prev => ({ ...prev, purchasePrinterType: value }))}
                        onAddressChange={value => setSettings(prev => ({ ...prev, purchasePrinterAddress: value }))}
                   />
                   <PrinterSelector 
                        title="طابعة الباركود"
                        type={settings.barcodePrinterType}
                        address={settings.barcodePrinterAddress}
                        onTypeChange={value => setSettings(prev => ({ ...prev, barcodePrinterType: value }))}
                        onAddressChange={value => setSettings(prev => ({ ...prev, barcodePrinterAddress: value }))}
                   />
                </div>
                 <div className="flex justify-end">
                    <Button size="lg" onClick={handleSave} disabled={loading}>
                        <Save className="ml-2 h-4 w-4" />
                        حفظ الإعدادات
                    </Button>
                </div>
            </main>
        </>
    );
}
