"use client"

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export default function SettingsPage() {
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
                  <Input id="company-name" placeholder="أدخل اسم الشركة" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-address">عنوان الشركة</Label>
                  <Textarea id="company-address" placeholder="أدخل عنوان الشركة" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">اللغة</Label>
                  <Select defaultValue="ar">
                    <SelectTrigger>
                      <SelectValue placeholder="اختر اللغة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button>حفظ التغييرات</Button>
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
                  <Input id="opening-capital" type="number" placeholder="أدخل رأس مال أول الفترة" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fiscal-year-start">بداية السنة المالية</Label>
                  <Input id="fiscal-year-start" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">العملة</Label>
                  <Select defaultValue="EGP">
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
              </CardContent>
              <CardFooter>
                <Button>حفظ التغييرات</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
