

"use client";

import React from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Package,
  Users,
  BookUser,
  AreaChart,
  Settings,
  ChevronDown,
  Boxes,
  ShoppingCart,
  ShoppingBag,
  BarChart,
  History,
  Gift,
  Warehouse,
  ArrowRightLeft,
  Banknote,
  DatabaseBackup,
  Landmark,
  Wallet,
  UserRound,
  Calculator,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ModeToggle } from "@/components/mode-toggle";
import { usePermissions } from "@/contexts/permissions-context";

const Logo = () => (
    <div className="flex items-center gap-2" >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-primary"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
        <h1 className="text-lg font-bold text-primary">المحاسب الذكي</h1>
    </div>
);


const NavLink = ({ href, children, icon, module }: { href: string; children: React.ReactNode; icon: React.ReactNode, module: string }) => {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { can } = usePermissions();
  const isActive = pathname === href;
  
  if (!can('view', module)) {
    return null;
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={href} onClick={() => setOpenMobile(false)}>
          {icon}
          <span>{children}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

const NavCollapsible = ({ title, icon, children, module, defaultOpen = false }: { title: string; icon: React.ReactNode; children: React.ReactNode; module: string, defaultOpen?: boolean }) => {
    const pathname = usePathname();
    const { can } = usePermissions();
    
    if (!can('view', module)) {
        return null;
    }

    const childPaths = React.Children.map(children, child => {
        if (React.isValidElement(child) && child.props.href) {
            return child.props.href;
        }
        return null;
    }) || [];
    
    const isAnyChildActive = childPaths.some(path => path && pathname.startsWith(path));

    return (
        <Collapsible defaultOpen={isAnyChildActive || defaultOpen}>
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                        {icon}
                        <span>{title}</span>
                        <ChevronDown className="mr-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
            </SidebarMenuItem>
            <CollapsibleContent asChild>
                <SidebarMenuSub>{children}</SidebarMenuSub>
            </CollapsibleContent>
        </Collapsible>
    );
};

const NavSubLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const pathname = usePathname();
    const { setOpenMobile } = useSidebar();
    const isActive = pathname === href || pathname.startsWith(href + '/');
    return (
        <SidebarMenuSubItem>
            <SidebarMenuSubButton asChild isActive={isActive}>
                <Link href={href} onClick={() => setOpenMobile(false)}>{children}</Link>
            </SidebarMenuSubButton>
        </SidebarMenuSubItem>
    );
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar side="right">
        <SidebarHeader>
            <div className="flex w-full items-center justify-between p-4 border-b">
                <Logo />
            </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <NavLink href="/" icon={<LayoutDashboard />} module="dashboard">لوحة التحكم</NavLink>
            
            <NavCollapsible title="البيانات الرئيسية" icon={<Package />} module="masterData">
                <NavSubLink href="/master-data/items">الأصناف</NavSubLink>
                <NavSubLink href="/master-data/warehouses">المخازن</NavSubLink>
                <NavSubLink href="/master-data/customers">العملاء</NavSubLink>
                <NavSubLink href="/master-data/suppliers">الموردون</NavSubLink>
                <NavSubLink href="/master-data/partners">الشركاء</NavSubLink>
                <NavSubLink href="/master-data/cash-accounts">الخزائن والبنوك</NavSubLink>
            </NavCollapsible>

            <NavCollapsible title="المخزون" icon={<Boxes />} module="inventory">
                <NavSubLink href="/inventory/stock-in">استلام مخزون</NavSubLink>
                <NavSubLink href="/inventory/stock-out">صرف مخزون</NavSubLink>
                <NavSubLink href="/inventory/transfer">تحويل مخزون</NavSubLink>
                <NavSubLink href="/inventory/adjustment">تسوية المخزون</NavSubLink>
                <NavSubLink href="/inventory/movements">حركة المخزون</NavSubLink>
            </NavCollapsible>

            <NavCollapsible title="المبيعات" icon={<ShoppingCart />} module="sales">
                <NavSubLink href="/sales/invoices/list">فواتير البيع</NavSubLink>
                <NavSubLink href="/sales/returns">مرتجعات البيع</NavSubLink>
            </NavCollapsible>
            
            <NavCollapsible title="المشتريات" icon={<ShoppingBag />} module="purchases">
                <NavSubLink href="/purchases/invoices/list">فواتير الشراء</NavSubLink>
                <NavSubLink href="/purchases/returns">مرتجعات الشراء</NavSubLink>
            </NavCollapsible>

             <NavCollapsible title="المحاسبة" icon={<BookUser />} module="accounting">
                <NavSubLink href="/accounting/journal">قيود اليومية</NavSubLink>
                <NavSubLink href="/accounting/expenses">إدارة المصروفات</NavSubLink>
                <NavSubLink href="/accounting/exceptional-income">الدخل الاستثنائي</NavSubLink>
                <NavSubLink href="/accounting/supplier-payments">مدفوعات الموردين</NavSubLink>
                <NavSubLink href="/accounting/treasury">حركة الخزينة</NavSubLink>
                <NavSubLink href="/accounting/ai-analysis">تحليل مالي بالذكاء الاصطناعي</NavSubLink>
            </NavCollapsible>
            
            <NavCollapsible title="الموارد البشرية" icon={<UserRound />} module="hr">
                <NavSubLink href="/hr/employees">الموظفين</NavSubLink>
                <NavSubLink href="/hr/advances">سلف الموظفين</NavSubLink>
                <NavSubLink href="/hr/adjustments">المكافآت والجزاءات</NavSubLink>
                <NavSubLink href="/hr/payroll">احتساب الرواتب</NavSubLink>
            </NavCollapsible>

            <NavLink href="/analytics" icon={<BarChart />} module="analytics">التحليلات</NavLink>

            <NavCollapsible title="التقارير" icon={<AreaChart />} module="reports">
                <NavSubLink href="/reports/financial-statements">القوائم المالية</NavSubLink>
                <NavSubLink href="/reports/partner-shares">حصص الشركاء</NavSubLink>
                <NavSubLink href="/reports/customer-statement">كشف حساب العملاء</NavSubLink>
                <NavSubLink href="/reports/supplier-statement">كشف حساب الموردين</NavSubLink>
                <NavSubLink href="/reports/item-profit-loss">أرباح وخسائر الأصناف</NavSubLink>
            </NavCollapsible>
            
            <NavCollapsible title="الإعدادات" icon={<Settings />} module="settings">
              <NavSubLink href="/users">المستخدمون</NavSubLink>
              <NavSubLink href="/roles">الأدوار والصلاحيات</NavSubLink>
              <NavSubLink href="/settings">الإعدادات العامة</NavSubLink>
              <NavSubLink href="/settings/backup">النسخ الاحتياطي</NavSubLink>
            </NavCollapsible>

          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-card m-2">
                <Avatar>
                    <AvatarImage src="https://placehold.co/100x100.png" />
                    <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="font-semibold text-sm">مستخدم مسؤول</span>
                    <span className="text-xs text-muted-foreground">admin@example.com</span>
                </div>
                 <ModeToggle />
            </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background px-6 sticky top-0 z-30">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
                {/* Header content can go here */}
            </div>
        </header>
        {children}
        </SidebarInset>
    </SidebarProvider>
  );
}
