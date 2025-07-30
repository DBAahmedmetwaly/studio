
"use client"

import React, { useState, useEffect } from "react";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import useFirebase from "@/hooks/use-firebase"; // Assuming a hook for single object might be needed
import { database } from "@/lib/firebase";
import { ref, onValue, set } from "firebase/database";
import { Loader2 } from "lucide-react";


interface GeneralSettings {
    companyName: string;
    companyAddress: string;
    language: 'ar' | 'en';
    mobileFabPosition: 'bottom-right' | 'top-right';
}

interface FinancialSettings {
    openingCapital: number;
    fiscalYearStart: string;
    currency: 'EGP' | 'SAR' | 'USD';
    allowNegativeStock: boolean;
}

interface Settings {
    general: GeneralSettings;
    financial: FinancialSettings;
}

export default function SettingsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const settingsRef = ref(database, 'settings/main');
        const unsubscribe = onValue(settingsRef, (snapshot) => {
            if (snapshot.exists()) {
                setSettings(snapshot.val());
            } else {
                // Initialize with default settings if none exist
                setSettings({
                    general: { companyName: '', companyAddress: '', language: 'ar', mobileFabPosition: 'bottom-right' },
                    financial: { openingCapital: 0, fiscalYearStart: '', currency: 'EGP', allowNegativeStock: false }
                });
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleSave = async () => {
        if (!settings) return;
        try {
            const settingsRef = ref(database, 'settings/main');
            await set(settingsRef, settings);
            toast({
                title: "تم الحفظ بنجاح",
                description: "تم تحديث الإعدادات.",
            });
        } catch (error) {
            console.error("Failed to save settings: ", error);
            toast({
                variant: "destructive",
                title: "خطأ",
                description: "فشل حفظ الإعدادات. يرجى المحاولة مرة أخرى.",
            });
        }
    };
    
    const handleGeneralChange = (field: keyof GeneralSettings, value: any) => {
        setSettings(prev => prev ? { ...prev, general: { ...prev.general, [field]: value } } : null);
    }
    
    const handleFinancialChange = (field: keyof FinancialSettings, value: any) => {
         setSettings(prev => prev ? { ...prev, financial: { ...prev.financial, [field]: value } } : null);
    }

    if (loading || !settings) {
        return (
            <div className="flex flex-1 justify-center items-center">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
        );
    }

  return (
    <>
      <PageHeader title="الإعدادات" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">إعدادات عامة</TabsTrigger>
            <TabsTrigger value="financial">إعدادات مالية</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات عامة</CardTitle>
                <CardDescription>
                  تكوين معلومات الشركة واللغة والخيارات العامة الأخرى.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">اسم الشركة</Label>
                  <Input id="company-name" placeholder="أدخل اسم الشركة" value={settings.general.companyName} onChange={e => handleGeneralChange('companyName', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-address">عنوان الشركة</Label>
                  <Textarea id="company-address" placeholder="أدخل عنوان الشركة" value={settings.general.companyAddress} onChange={e => handleGeneralChange('companyAddress', e.target.value)} />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="language">اللغة</Label>
                      <Select value={settings.general.language} onValueChange={(value: GeneralSettings['language']) => handleGeneralChange('language', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر اللغة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ar">العربية</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="fab-position">موضع زر القائمة (موبايل)</Label>
                      <Select value={settings.general.mobileFabPosition || 'bottom-right'} onValueChange={(value: GeneralSettings['mobileFabPosition']) => handleGeneralChange('mobileFabPosition', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الموضع" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bottom-right">أسفل اليمين</SelectItem>
                          <SelectItem value="top-right">أعلى اليمين</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                 </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSave}>حفظ التغييرات</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="financial">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات مالية</CardTitle>
                <CardDescription>
                  إدارة الإعدادات المتعلقة بالمحاسبة والمالية.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                  <Label htmlFor="opening-capital">رأس مال أول الفترة</Label>
                  <Input id="opening-capital" type="number" placeholder="أدخل رأس مال أول الفترة" value={settings.financial.openingCapital} onChange={e => handleFinancialChange('openingCapital', Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fiscal-year-start">بداية السنة المالية</Label>
                  <Input id="fiscal-year-start" type="date" value={settings.financial.fiscalYearStart} onChange={e => handleFinancialChange('fiscalYearStart', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">العملة</Label>
                  <Select value={settings.financial.currency} onValueChange={(value: FinancialSettings['currency']) => handleFinancialChange('currency', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر العملة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EGP">الجنيه المصري (EGP)</SelectItem>
                      <SelectItem value="SAR">الريال السعودي (SAR)</SelectItem>
                      <SelectItem value="USD">الدولار الأمريكي (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <Label htmlFor="allow-negative-stock">السماح بالبيع بالرصيد السالب</Label>
                     <p className="text-xs text-muted-foreground">
                      السماح بإنشاء فواتير بيع حتى لو كان رصيد الصنف صفر أو أقل.
                    </p>
                  </div>
                  <Switch id="allow-negative-stock" checked={settings.financial.allowNegativeStock} onCheckedChange={checked => handleFinancialChange('allowNegativeStock', checked)} />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSave}>حفظ التغييرات</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}

    