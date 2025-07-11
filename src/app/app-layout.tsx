

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
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ModeToggle } from "@/components/mode-toggle";
import { usePermissions } from "@/contexts/permissions-context";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";

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

const NavCollapsible = ({ title, icon, children, modules }: { title: string; icon: React.ReactNode; children: React.ReactNode; modules: string[] }) => {
    const pathname = usePathname();
    const { can } = usePermissions();
    
    // Show the collapsible menu if the user can view at least one of its sub-modules
    const canViewCollapsible = modules.some(module => can('view', module));

    if (!canViewCollapsible) {
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

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  
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
            
            <NavCollapsible title="البيانات الرئيسية" icon={<Package />} modules={['masterData_items', 'masterData_warehouses', 'masterData_customers', 'masterData_suppliers', 'masterData_partners', 'masterData_cashAccounts', 'masterData_salesReps']}>
                <NavSubLink href="/master-data/items" module="masterData_items">الأصناف</NavSubLink>
                <NavSubLink href="/master-data/warehouses" module="masterData_warehouses">المخازن</NavSubLink>
                <NavSubLink href="/master-data/customers" module="masterData_customers">العملاء</NavSubLink>
                <NavSubLink href="/master-data/suppliers" module="masterData_suppliers">الموردون</NavSubLink>
                <NavSubLink href="/master-data/partners" module="masterData_partners">الشركاء</NavSubLink>
                <NavSubLink href="/master-data/cash-accounts" module="masterData_cashAccounts">الخزائن والبنوك</NavSubLink>
                <NavSubLink href="/master-data/sales-reps" module="masterData_salesReps">مناديب المبيعات</NavSubLink>
            </NavCollapsible>

            <NavCollapsible title="المخزون" icon={<Boxes />} modules={['inventory_stockIn', 'inventory_stockOut', 'inventory_transfer', 'inventory_adjustment', 'inventory_movements']}>
                <NavSubLink href="/inventory/stock-in" module="inventory_stockIn">استلام مخزون</NavSubLink>
                <NavSubLink href="/inventory/stock-out" module="inventory_stockOut">صرف مخزون</NavSubLink>
                <NavSubLink href="/inventory/transfer" module="inventory_transfer">تحويل مخزون</NavSubLink>
                <NavSubLink href="/inventory/adjustment" module="inventory_adjustment">تسوية المخزون</NavSubLink>
                <NavSubLink href="/inventory/movements" module="inventory_movements">حركة المخزون</NavSubLink>
            </NavCollapsible>

            <NavCollapsible title="المبيعات" icon={<ShoppingCart />} modules={['sales_invoices', 'sales_returns', 'sales_issueToRep', 'sales_returnFromRep', 'sales_remitFromRep']}>
                <NavSubLink href="/sales/invoices/list" module="sales_invoices">فواتير البيع</NavSubLink>
                <NavSubLink href="/sales/returns" module="sales_returns">مرتجعات البيع</NavSubLink>
                 <SidebarMenuSubItem>
                    <hr className="my-2" />
                </SidebarMenuSubItem>
                <SidebarMenuSubButton>
                    <Truck className="h-4 w-4" />
                    <span>عمليات المناديب</span>
                </SidebarMenuSubButton>
                 <NavSubLink href="/sales/issue-to-rep" module="sales_issueToRep"><FileUp className="h-3 w-3" />صرف بضاعة لمندوب</NavSubLink>
                <NavSubLink href="/sales/return-from-rep" module="sales_returnFromRep"><FileDown className="h-3 w-3" />مرتجع بضاعة من مندوب</NavSubLink>
                <NavSubLink href="/sales/remit-from-rep" module="sales_remitFromRep"><Coins className="h-3 w-3" />توريد نقدية من مندوب</NavSubLink>
            </NavCollapsible>
            
            <NavCollapsible title="المشتريات" icon={<ShoppingBag />} modules={['purchases_invoices', 'purchases_returns']}>
                <NavSubLink href="/purchases/invoices/list" module="purchases_invoices">فواتير الشراء</NavSubLink>
                <NavSubLink href="/purchases/returns" module="purchases_returns">مرتجعات الشراء</NavSubLink>
            </NavCollapsible>

             <NavCollapsible title="المحاسبة" icon={<BookUser />} modules={['accounting_journal', 'accounting_expenses', 'accounting_exceptionalIncome', 'accounting_supplierPayments', 'accounting_customerPayments', 'accounting_treasury', 'accounting_aiAnalysis']}>
                <NavSubLink href="/accounting/journal" module="accounting_journal">قيود اليومية</NavSubLink>
                <NavSubLink href="/accounting/expenses" module="accounting_expenses">إدارة المصروفات</NavSubLink>
                <NavSubLink href="/accounting/exceptional-income" module="accounting_exceptionalIncome">الدخل الاستثنائي</NavSubLink>
                <NavSubLink href="/accounting/supplier-payments" module="accounting_supplierPayments">مدفوعات الموردين</NavSubLink>
                <NavSubLink href="/accounting/customer-payments" module="accounting_customerPayments">مقبوضات العملاء</NavSubLink>
                <NavSubLink href="/accounting/treasury" module="accounting_treasury">حركة الخزينة</NavSubLink>
                <NavSubLink href="/accounting/ai-analysis" module="accounting_aiAnalysis">تحليل مالي بالذكاء الاصطناعي</NavSubLink>
            </NavCollapsible>
            
            <NavCollapsible title="الموارد البشرية" icon={<UserRound />} modules={['hr_employees', 'hr_advances', 'hr_adjustments', 'hr_payroll']}>
                <NavSubLink href="/hr/employees" module="hr_employees">الموظفين</NavSubLink>
                <NavSubLink href="/hr/advances" module="hr_advances">سلف الموظفين</NavSubLink>
                <NavSubLink href="/hr/adjustments" module="hr_adjustments">المكافآت والجزاءات</NavSubLink>
                <NavSubLink href="/hr/payroll" module="hr_payroll">احتساب الرواتب</NavSubLink>
            </NavCollapsible>

            <NavLink href="/analytics" icon={<BarChart />} module="analytics">التحليلات</NavLink>

            <NavCollapsible title="التقارير" icon={<AreaChart />} modules={['reports_financialStatements', 'reports_partnerShares', 'reports_customerStatement', 'reports_supplierStatement', 'reports_itemProfitLoss']}>
                <NavSubLink href="/reports/financial-statements" module="reports_financialStatements">القوائم المالية</NavSubLink>
                <NavSubLink href="/reports/partner-shares" module="reports_partnerShares">حصص الشركاء</NavSubLink>
                <NavSubLink href="/reports/customer-statement" module="reports_customerStatement">كشف حساب العملاء</NavSubLink>
                <NavSubLink href="/reports/supplier-statement" module="reports_supplierStatement">كشف حساب الموردين</NavSubLink>
                <NavSubLink href="/reports/item-profit-loss" module="reports_itemProfitLoss">أرباح وخسائر الأصناف</NavSubLink>
            </NavCollapsible>
            
            <NavCollapsible title="الإعدادات" icon={<Settings />} modules={['settings_users', 'settings_roles', 'settings_general', 'settings_backup']}>
              <NavSubLink href="/users" module="settings_users">المستخدمون</NavSubLink>
              <NavSubLink href="/roles" module="settings_roles">الوظائف والصلاحيات</NavSubLink>
              <NavSubLink href="/settings" module="settings_general">الإعدادات العامة</NavSubLink>
              <NavSubLink href="/settings/backup" module="settings_backup">النسخ الاحتياطي</NavSubLink>
            </NavCollapsible>

          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
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
