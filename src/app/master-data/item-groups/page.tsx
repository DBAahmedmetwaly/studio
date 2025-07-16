
"use client";

import React, { useState, useMemo } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreHorizontal, PlusCircle, Edit, Trash2, Loader2, Palette } from "lucide-react";
import { useData } from "@/contexts/data-provider";
import { useToast } from "@/hooks/use-toast";
import { AddEntityDialog } from "@/components/add-entity-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";

const COLORS = [
  "bg-blue-500", "bg-green-500", "bg-red-500", "bg-yellow-500",
  "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500"
];

interface ItemGroup {
  id?: string;
  name: string;
  color: string;
  image?: string;
  itemIds: string[];
}

interface Item {
  id: string;
  name: string;
}

const GroupForm = ({ group, onSave, onClose }: { group?: ItemGroup; onSave: (data: ItemGroup) => void; onClose: () => void }) => {
  const [formData, setFormData] = useState<ItemGroup>(
    group || { name: "", color: COLORS[0], image: "", itemIds: [] }
  );
  const { items } = useData();

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleItemToggle = (itemId: string, checked: boolean) => {
    setFormData(prev => {
      const newItemIds = checked
        ? [...prev.itemIds, itemId]
        : prev.itemIds.filter(id => id !== itemId);
      return { ...prev, itemIds: newItemIds };
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="group-name">اسم المجموعة</Label>
        <Input id="group-name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
      </div>
       <div className="space-y-2">
        <Label htmlFor="group-image">رابط صورة المجموعة</Label>
        <Input id="group-image" placeholder="https://example.com/image.png" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>لون المجموعة</Label>
        <div className="flex gap-2">
          {COLORS.map(color => (
            <div
              key={color}
              onClick={() => setFormData({ ...formData, color })}
              className={`h-8 w-8 rounded-full cursor-pointer ${color} ${formData.color === color ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
            />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>أصناف المجموعة</Label>
        <ScrollArea className="h-64 rounded-md border p-4">
          <div className="space-y-2">
            {items.map((item: Item) => (
              <div key={item.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`item-${item.id}`}
                  checked={formData.itemIds.includes(item.id)}
                  onCheckedChange={(checked) => handleItemToggle(item.id, !!checked)}
                />
                <Label htmlFor={`item-${item.id}`} className="flex-1 cursor-pointer">{item.name}</Label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave}>حفظ المجموعة</Button>
      </div>
    </div>
  );
};

export default function ItemGroupsPage() {
  const { itemGroups, dbAction, loading } = useData();

  const handleSave = async (data: ItemGroup) => {
    if (data.id) {
      await dbAction("itemGroups", "update", { id: data.id, data });
    } else {
      await dbAction("itemGroups", "add", data);
    }
  };

  const handleDelete = async (id: string) => {
    await dbAction("itemGroups", "remove", { id });
  };

  return (
    <>
      <PageHeader title="مجموعات الأصناف (للكاشير)">
        <AddEntityDialog
          title="إضافة مجموعة أصناف جديدة"
          description="أنشئ مجموعة جديدة وخصص لها الأصناف التي ستظهر في شاشة الكاشير."
          triggerButton={
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              إضافة مجموعة
            </Button>
          }
        >
          <GroupForm onSave={handleSave} onClose={() => {}} />
        </AddEntityDialog>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>قائمة المجموعات</CardTitle>
            <CardDescription>
              إدارة مجموعات الأصناف التي تظهر في شاشة البيع السريع (الكاشير).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {itemGroups.map((group: ItemGroup) => (
                  <Card key={group.id} className="flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <div className={`h-6 w-6 rounded-full ${group.color}`} />
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col items-center justify-center gap-2">
                        <Image src={group.image || "https://placehold.co/100x100.png"} alt={group.name} width={80} height={80} className="rounded-lg object-cover" />
                        <p className="text-sm text-muted-foreground">
                            تحتوي على {group.itemIds?.length || 0} صنف.
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-end bg-muted/50 p-2">
                       <AlertDialog>
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">قائمة</span>
                              </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                                  <AddEntityDialog
                                      title="تعديل المجموعة"
                                      description="تعديل اسم ولون وأصناف المجموعة."
                                      triggerButton={
                                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                              <Edit className="ml-2 h-4 w-4" /> تعديل
                                          </DropdownMenuItem>
                                      }
                                  >
                                      <GroupForm group={group} onSave={handleSave} onClose={() => {}} />
                                  </AddEntityDialog>
                                  <AlertDialogTrigger asChild>
                                      <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                          <Trash2 className="ml-2 h-4 w-4" /> حذف
                                      </DropdownMenuItem>
                                  </AlertDialogTrigger>
                              </DropdownMenuContent>
                          </DropdownMenu>
                           <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                                  <AlertDialogDescription>سيؤدي هذا الإجراء إلى حذف المجموعة بشكل دائم.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(group.id!)}>متابعة</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
