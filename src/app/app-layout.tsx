
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
  Truck,
  FileUp,
  FileDown,
  Coins,
  LogOut,
  FileCheck,
  Monitor,
  List,
  Laptop,
  Group,
  Receipt,
  FilePieChart,
  UserSquare,
  Building2,
  Users2,
  PackageSearch,
  BookCopy,
  Printer,
  QrCode,
  PowerOff,
  ClipboardList,
  PanelLeft,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ModeToggle } from "@/components/mode-toggle";
import { usePermissions } from "@/contexts/permissions-context";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { useData } from "@/contexts/data-provider";
import { cn } from "@/lib/utils";


const Logo = () => {
    const { settings } = useData();
    const companyName = settings?.main?.general?.companyName || "المحاسب الذكي";

    return (
        <div className="flex items-center gap-2" >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-primary"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
            <h1 className="text-lg font-bold text-primary">{companyName}</h1>
        </div>
    );
};


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

const NavCollapsible = ({ title, icon, children, modules }: { title: string; icon: React.ReactNode; children: React.ReactNode; modules: string[] }) => {
    const pathname = usePathname();
    const { can } = usePermissions();
    
    const canViewCollapsible = modules.some(module => can('view', module));

    if (!canViewCollapsible) {
        return null;
    }

    const childHrefs = React.Children.map(children, child => {
        if (React.isValidElement(child) && child.props.href) {
            return child.props.href;
        }
        return null;
    })?.filter(Boolean) as string[] | undefined;

    const isAnyChildActive = childHrefs?.some(href => pathname.startsWith(href));

    return (
        <Collapsible defaultOpen={isAnyChildActive}>
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

const NavSubLink = ({ href, children, module }: { href: string; children: React.ReactNode, module: string }) => {
    const pathname = usePathname();
    const { setOpenMobile } = useSidebar();
    const { can } = usePermissions();
    const isActive = pathname === href || pathname.startsWith(`${href}/`);

    if (!can('view', module)) {
        return null;
    }

    return (
        <SidebarMenuSubItem>
            <SidebarMenuSubButton asChild isActive={isActive}>
                <Link href={href} onClick={() => setOpenMobile(false)}>{children}</Link>
            </SidebarMenuSubButton>
        </SidebarMenuSubItem>
    );
};

const AppLayoutContent = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth();
  const { toggleSidebar } = useSidebar();
  const { settings } = useData();
  
  const generalSettings = settings?.main?.general || {};
  const fabPosition = generalSettings.mobileFabPosition || 'bottom-right';

  return (
    <>
      <Sidebar side="right">
        <SidebarHeader>
            <div className="flex w-full items-center justify-between p-4 border-b">
                <Logo />
            </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <NavLink href="/" icon={<LayoutDashboard />} module="dashboard">لوحة التحكم</NavLink>
            <NavLink href="/analytics" icon={<BarChart />} module="analytics">التحليلات الرسومية</NavLink>

            <NavCollapsible title="نقاط البيع" icon={<Receipt />} modules={['pos', 'pos_itemGroups', 'pos_sessions', 'reports_pos', 'sales_posReturns']}>
                <NavSubLink href="/pos" module="pos">شاشة الكاشير</NavSubLink>
                <NavSubLink href="/master-data/item-groups" module="pos_itemGroups">مجموعات الأصناف</NavSubLink>
                <NavSubLink href="/pos/sessions" module="pos_sessions">إدارة يومية الكاشير</NavSubLink>
                <NavSubLink href="/sales/returns/pos" module="sales_posReturns">مرتجع نقاط البيع</NavSubLink>
                 <NavSubLink href="/reports/pos-reports" module="reports_pos">تقارير نقاط البيع</NavSubLink>
            </NavCollapsible>

            <NavCollapsible title="الأصناف" icon={<PackageSearch />} modules={['inventory_items', 'inventory_barcodeDesigner', 'reports_itemProfitLoss']}>
                <NavSubLink href="/master-data/items" module="inventory_items">بطاقة الأصناف</NavSubLink>
                <NavSubLink href="/inventory/barcode-designer" module="inventory_barcodeDesigner">تصميم الباركود</NavSubLink>
                <NavSubLink href="/reports/item-profit-loss" module="reports_itemProfitLoss">تقرير أرباح الأصناف</NavSubLink>
            </NavCollapsible>

            <NavCollapsible title="المخزون" icon={<Warehouse />} modules={['inventory_warehouses', 'inventory_stockIn', 'inventory_stockOut', 'inventory_transfer', 'inventory_adjustment', 'inventory_movements', 'inventory_stockStatus', 'reports_inventory', 'inventory_goodsInTransit']}>
                <NavSubLink href="/master-data/warehouses" module="inventory_warehouses">المخازن</NavSubLink>
                <NavSubLink href="/inventory/stock-in/new" module="inventory_stockIn">استلام مخزون</NavSubLink>
                <NavSubLink href="/inventory/stock-out/new" module="inventory_stockOut">صرف مخزون</NavSubLink>
                <NavSubLink href="/inventory/transfer/new" module="inventory_transfer">تحويل مخزون</NavSubLink>
                <NavSubLink href="/inventory/adjustment" module="inventory_adjustment">تسوية المخزون</NavSubLink>
                <NavSubLink href="/inventory/goods-in-transit" module="inventory_goodsInTransit">بضاعة بالطريق</NavSubLink>
                <NavSubLink href="/inventory/movements" module="inventory_movements">حركة المخزون</NavSubLink>
                <NavSubLink href="/inventory/stock-status" module="inventory_stockStatus">أرصدة المخزون</NavSubLink>
            </NavCollapsible>
            
            <NavCollapsible title="العملاء والمبيعات" icon={<UserSquare />} modules={['customers_data', 'sales_invoices', 'sales_returns', 'reports_customerStatement', 'accounting_customerPayments']}>
                <NavSubLink href="/master-data/customers" module="customers_data">بيانات العملاء</NavSubLink>
                <NavSubLink href="/sales/invoices/list" module="sales_invoices">فواتير البيع</NavSubLink>
                <NavSubLink href="/sales/returns/new" module="sales_returns">مرتجعات البيع</NavSubLink>
                <NavSubLink href="/accounting/customer-payments" module="accounting_customerPayments">مقبوضات العملاء</NavSubLink>
                <NavSubLink href="/reports/customer-statement" module="reports_customerStatement">كشف حساب العملاء</NavSubLink>
            </NavCollapsible>

            <NavCollapsible title="الموردون والمشتريات" icon={<Building2 />} modules={['suppliers_data', 'purchases_invoices', 'purchases_returns', 'reports_supplierStatement', 'accounting_supplierPayments']}>
                <NavSubLink href="/master-data/suppliers" module="suppliers_data">بيانات الموردين</NavSubLink>
                <NavSubLink href="/purchases/invoices/list" module="purchases_invoices">فواتير الشراء</NavSubLink>
                <NavSubLink href="/purchases/returns/new" module="purchases_returns">مرتجعات الشراء</NavSubLink>
                <NavSubLink href="/accounting/supplier-payments" module="accounting_supplierPayments">مدفوعات الموردين</NavSubLink>
                <NavSubLink href="/reports/supplierStatement" module="reports_supplierStatement">كشف حساب الموردين</NavSubLink>
            </NavCollapsible>
            
            <NavCollapsible title="المحاسبة والمالية" icon={<BookUser />} modules={['accounting_journal', 'accounting_expenses', 'accounting_exceptionalIncome', 'accounting_treasury', 'accounting_profitDistribution', 'reports_financialStatements']}>
                <NavSubLink href="/accounting/journal" module="accounting_journal">قيود اليومية</NavSubLink>
                <NavSubLink href="/accounting/expenses" module="accounting_expenses">إدارة المصروفات</NavSubLink>
                <NavSubLink href="/accounting/exceptional-income" module="accounting_exceptionalIncome">الدخل الاستثنائي</NavSubLink>
                <NavSubLink href="/accounting/treasury" module="accounting_treasury">حركة الخزينة</NavSubLink>
                <NavSubLink href="/accounting/profit-distribution" module="accounting_profitDistribution">توزيعات الأرباح</NavSubLink>
                <NavSubLink href="/reports/financial-statements" module="reports_financialStatements">القوائم المالية</NavSubLink>
            </NavCollapsible>
            
            <NavCollapsible title="المناديب والشركاء" icon={<Users2 />} modules={['salesReps_data', 'partners_data', 'sales_issueToRep', 'sales_returnFromRep', 'sales_repInvoices', 'sales_repOperations', 'sales_remitFromRep', 'reports_partnerShares']}>
                <NavSubLink href="/master-data/sales-reps" module="salesReps_data">بيانات المناديب</NavSubLink>
                 <NavSubLink href="/master-data/partners" module="partners_data">بيانات الشركاء</NavSubLink>
                <NavSubLink href="/sales/issue-to-rep/list" module="sales_issueToRep">صرف بضاعة لمندوب</NavSubLink>
                <NavSubLink href="/sales/return-from-rep/list" module="sales_returnFromRep">مرتجع بضاعة من مندوب</NavSubLink>
                <NavSubLink href="/sales/rep-invoices" module="sales_repInvoices">اعتماد فواتير المناديب</NavSubLink>
                <NavSubLink href="/sales/rep-operations" module="sales_repOperations">مراقبة أداء المناديب</NavSubLink>
                <NavSubLink href="/sales/remit-from-rep" module="sales_remitFromRep">توريد نقدية من مندوب</NavSubLink>
                <NavSubLink href="/reports/partner-shares" module="reports_partnerShares">تقرير حصص الشركاء</NavSubLink>
            </NavCollapsible>
            
            <NavCollapsible title="الموظفون والموارد البشرية" icon={<UserRound />} modules={['hr_employees', 'hr_advances', 'hr_adjustments', 'hr_payroll']}>
                <NavSubLink href="/hr/employees" module="hr_employees">الموظفين</NavSubLink>
                <NavSubLink href="/hr/advances" module="hr_advances">سلف الموظفين</NavSubLink>
                <NavSubLink href="/hr/adjustments" module="hr_adjustments">المكافآت والجزاءات</NavSubLink>
                <NavSubLink href="/hr/payroll" module="hr_payroll">احتساب الرواتب</NavSubLink>
            </NavCollapsible>
            
            <NavCollapsible title="الإعدادات" icon={<Settings />} modules={['settings_users', 'settings_roles', 'settings_general', 'settings_backup', 'settings_periodClosing', 'settings_cashAccounts', 'settings_printers', 'settings_receiptDesigner']}>
              <NavSubLink href="/users" module="settings_users">المستخدمون</NavSubLink>
              <NavSubLink href="/roles" module="settings_roles">الوظائف والصلاحيات</NavSubLink>
              <NavSubLink href="/master-data/cash-accounts" module="settings_cashAccounts">الخزائن والبنوك</NavSubLink>
              <NavSubLink href="/settings" module="settings_general">الإعدادات العامة</NavSubLink>
              <NavSubLink href="/settings/printers" module="settings_printers">إعدادات الطباعة</NavSubLink>
              <NavSubLink href="/settings/receipt-designer" module="settings_receiptDesigner">مصمم الإيصالات</NavSubLink>
              <NavSubLink href="/settings/backup" module="settings_backup">النسخ الاحتياطي</NavSubLink>
              <NavSubLink href="/settings/period-closing" module="settings_periodClosing">إقفال الفترات</NavSubLink>
            </NavCollapsible>

          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="hidden md:flex">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-card m-2">
                <Avatar>
                    <AvatarImage src="https://placehold.co/100x100.png" />
                    <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 overflow-hidden">
                    <span className="font-semibold text-sm truncate">{user?.name || "مستخدم"}</span>
                    <span className="text-xs text-muted-foreground truncate">{user?.loginName ? `${user.loginName}@admin.com` : "email@example.com"}</span>
                </div>
                 <ModeToggle />
                 <Button variant="ghost" size="icon" onClick={signOut}>
                    <LogOut className="h-5 w-5 text-destructive" />
                 </Button>
            </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
         <div className="md:hidden fixed z-50">
            <SidebarTrigger className={cn(
                "rounded-full w-14 h-14 shadow-lg bg-primary text-primary-foreground hover:bg-primary/90",
                {
                    'top-4 right-4': fabPosition === 'top-right',
                    'bottom-4 right-4': fabPosition === 'bottom-right',
                    'top-1/2 right-4 -translate-y-1/2': fabPosition === 'middle-right',
                    'top-4 left-4': fabPosition === 'top-left',
                    'bottom-4 left-4': fabPosition === 'bottom-left',
                    'top-1/2 left-4 -translate-y-1/2': fabPosition === 'middle-left',
                }
            )} />
        </div>
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 sticky top-0 z-30">
            <Button variant="ghost" size="icon" className="hidden md:flex" onClick={toggleSidebar}>
              <PanelLeft />
            </Button>
            <div className="flex-1">
                {/* Header content can go here */}
            </div>
            <div className="md:hidden flex items-center gap-2">
                 <ModeToggle />
                 <Button variant="ghost" className="flex items-center gap-2 p-1 h-auto">
                    <UserRound className="h-5 w-5" />
                    <span className="text-sm font-semibold">{user?.name}</span>
                 </Button>
                 <Button variant="ghost" size="icon" onClick={signOut}>
                    <LogOut className="h-5 w-5 text-destructive" />
                 </Button>
            </div>
        </header>
        {children}
        </SidebarInset>
    </>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </SidebarProvider>
  );
}
