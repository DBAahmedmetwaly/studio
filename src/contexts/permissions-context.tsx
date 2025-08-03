
"use client";

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import useFirebase from '@/hooks/use-firebase';
import { database } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

type RoleName = 'مسؤول' | 'محاسب' | 'أمين مخزن' | 'أمين صندوق';

export type PermissionAction = "view" | "add" | "edit" | "delete" | "print" | "generate" | "approve";

export type PermissionModule = {
    label: string;
    group: string;
    actions: PermissionAction[];
};

export const permissionsConfig = {
    dashboard: { label: "لوحة التحكم", group: "general", actions: ["view"] },
    analytics: { label: "التحليلات", group: "general", actions: ["view"] },
    
    pos: { label: "شاشة الكاشير", group: "pos", actions: ["view"] },
    pos_itemGroups: { label: "مجموعات الأصناف", group: "pos", actions: ["view", "add", "edit", "delete"] },
    pos_sessions: { label: "إدارة يومية الكاشير", group: "pos", actions: ["view", "add", "delete"] },
    reports_pos: { label: "تقارير نقاط البيع", group: "pos", actions: ["view", "generate"] },
    sales_posReturns: { label: "مرتجع نقاط البيع", group: "pos", actions: ["view", "add"] },
    
    inventory_items: { label: "بطاقة الأصناف", group: "inventory", actions: ["view", "add", "edit", "delete"] },
    inventory_barcodeDesigner: { label: "تصميم الباركود", group: "inventory", actions: ["view", "print"] },
    inventory_warehouses: { label: "المخازن", group: "inventory", actions: ["view", "add", "edit", "delete"] },
    inventory_stockIn: { label: "استلام مخزون", group: "inventory", actions: ["view", "add", "delete", "print"] },
    inventory_stockOut: { label: "صرف مخزون", group: "inventory", actions: ["view", "add", "delete", "print"] },
    inventory_transfer: { label: "تحويل مخزون", group: "inventory", actions: ["view", "add", "delete", "print"] },
    inventory_adjustment: { label: "تسوية المخزون", group: "inventory", actions: ["view", "add", "delete", "print"] },
    inventory_goodsInTransit: { label: "بضاعة بالطريق", group: "inventory", actions: ["view"] },
    inventory_movements: { label: "حركة المخزون", group: "inventory", actions: ["view"] },
    inventory_stockStatus: { label: "أرصدة المخزون", group: "inventory", actions: ["view"] },
    reports_itemLedger: { label: "كارت الصنف", group: "inventory", actions: ["view"] },
    reports_itemProfitLoss: { label: "تقرير أرباح الأصناف", group: "inventory", actions: ["view", "generate", "print"] },
    reports_inventory: { label: "تقارير المخزون", group: "inventory", actions: ["view", "generate", "print"] },
    
    customers_data: { label: "بيانات العملاء", group: "customers", actions: ["view", "add", "edit", "delete"] },
    sales_invoices: { label: "فواتير البيع", group: "customers", actions: ["view", "add", "edit", "delete", "print"] },
    sales_returns: { label: "مرتجعات البيع", group: "customers", actions: ["view", "add", "edit", "delete", "print"] },
    reports_customerStatement: { label: "كشف حساب العملاء", group: "customers", actions: ["view", "generate", "print"] },

    suppliers_data: { label: "بيانات الموردين", group: "suppliers", actions: ["view", "add", "edit", "delete"] },
    purchases_invoices: { label: "فواتير الشراء", group: "suppliers", actions: ["view", "add", "edit", "delete", "print"] },
    purchases_returns: { label: "مرتجعات الشراء", group: "suppliers", actions: ["view", "add", "edit", "delete", "print"] },
    reports_supplierStatement: { label: "كشف حساب الموردين", group: "suppliers", actions: ["view", "generate", "print"] },

    accounting_journal: { label: "قيود اليومية", group: "accounting", actions: ["view"] },
    accounting_expenses: { label: "إدارة المصروفات", group: "accounting", actions: ["view", "add", "delete"] },
    accounting_exceptionalIncome: { label: "الدخل الاستثنائي", group: "accounting", actions: ["view", "add", "delete"] },
    accounting_supplierPayments: { label: "مدفوعات الموردين", group: "accounting", actions: ["view", "add", "delete"] },
    accounting_customerPayments: { label: "مقبوضات العملاء", group: "accounting", actions: ["view", "add", "delete"] },
    accounting_treasury: { label: "حركة الخزينة", group: "accounting", actions: ["view", "add", "delete"] },
    accounting_profitDistribution: { label: "توزيعات الأرباح", group: "accounting", actions: ["view", "add", "delete"] },
    accounting_aiAnalysis: { label: "تحليل مالي بالذكاء الاصطناعي", group: "accounting", actions: ["view", "generate"] },
    reports_financialStatements: { label: "القوائم المالية", group: "accounting", actions: ["view", "print"] },

    salesReps_data: { label: "بيانات المناديب", group: "salesReps", actions: ["view"] },
    partners_data: { label: "بيانات الشركاء", group: "salesReps", actions: ["view", "add", "edit", "delete"] },
    sales_issueToRep: { label: "صرف بضاعة لمندوب", group: "salesReps", actions: ["view", "add", "delete"] },
    sales_returnFromRep: { label: "مرتجع بضاعة من مندوب", group: "salesReps", actions: ["view", "add", "delete"] },
    sales_remitFromRep: { label: "توريد نقدية من مندوب", group: "salesReps", actions: ["view", "add", "delete"] },
    sales_repInvoices: { label: "اعتماد فواتير المناديب", group: "salesReps", actions: ["view", "approve", "delete"] },
    sales_repOperations: { label: "مراقبة أداء المناديب", group: "salesReps", actions: ["view"] },
    reports_partnerShares: { label: "تقرير حصص الشركاء", group: "salesReps", actions: ["view", "generate", "print"] },
    
    hr_employees: { label: "الموظفين", group: "hr", actions: ["view", "add", "edit", "delete"] },
    hr_advances: { label: "سلف الموظفين", group: "hr", actions: ["view", "add", "delete"] },
    hr_adjustments: { label: "المكافآت والجزاءات", group: "hr", actions: ["view", "add", "delete"] },
    hr_payroll: { label: "احتساب الرواتب", group: "hr", actions: ["view", "generate", "print"] },

    settings_users: { label: "المستخدمون", group: "settings", actions: ["view", "add", "edit", "delete"] },
    settings_roles: { label: "الأدوار والصلاحيات", group: "settings", actions: ["view", "edit"] },
    settings_cashAccounts: { label: "الخزائن والبنوك", group: "settings", actions: ["view", "add", "edit", "delete"] },
    settings_general: { label: "الإعدادات العامة", group: "settings", actions: ["view", "edit"] },
    settings_printers: { label: "إعدادات الطباعة", group: "settings", actions: ["view", "edit"] },
    settings_receiptDesigner: { label: "مصمم الإيصالات", group: "settings", actions: ["view", "edit"] },
    settings_backup: { label: "النسخ الاحتياطي", group: "settings", actions: ["view", "generate"] },
    settings_periodClosing: { label: "إقفال الفترات", group: "settings", actions: ["view", "generate"] },
};

const moduleGroupLabels: Record<string, string> = {
    general: "عام",
    pos: "نقاط البيع",
    inventory: "الأصناف والمخزون",
    customers: "العملاء والمبيعات",
    suppliers: "الموردون والمشتريات",
    accounting: "المحاسبة والمالية",
    salesReps: "المناديب والشركاء",
    hr: "الموظفون والموارد البشرية",
    settings: "الإعدادات",
};

export const getModuleGroupLabel = (groupKey: string) => moduleGroupLabels[groupKey] || groupKey;

// Function to generate full permissions for the admin role
const generateAdminPermissions = () => {
    const adminPermissions: { [key: string]: { [key: string]: boolean } } = {};
    for (const moduleKey in permissionsConfig) {
        adminPermissions[moduleKey] = {};
        const module = permissionsConfig[moduleKey as keyof typeof permissionsConfig];
        for (const action of module.actions) {
            adminPermissions[moduleKey][action] = true;
        }
    }
    return adminPermissions;
};

export const initialRoles = {
  "مسؤول": generateAdminPermissions(),
  "محاسب": {
    dashboard: { view: true },
    inventory_items: { view: true, add: true, edit: true, delete: false },
    sales_invoices: { view: true, add: true, edit: true, delete: false, print: true },
    sales_repInvoices: { view: true, approve: true, delete: true },
    purchases_invoices: { view: true, add: true, edit: true, delete: false, print: true },
    accounting_journal: { view: true },
    accounting_expenses: { view: true, add: true, edit: false, delete: false },
    reports_customerStatement: { view: true, generate: true, print: true },
  },
  "أمين مخزن": {
    dashboard: { view: true },
    inventory_items: { view: true, add: false, edit: false, delete: false },
    inventory_stockIn: { view: true, add: true, delete: false, print: true },
    inventory_stockOut: { view: true, add: true, delete: false, print: true },
    inventory_transfer: { view: true, add: true, delete: false, print: true },
    inventory_movements: { view: true },
  },
  "أمين صندوق": {
    dashboard: { view: true },
    accounting_customerPayments: { view: true, add: true, delete: false },
    accounting_supplierPayments: { view: true, add: true, delete: false },
    accounting_treasury: { view: true, add: true, delete: false },
  },
};


type Role = keyof typeof initialRoles;
type Module = keyof typeof permissionsConfig;
type Action = PermissionAction;

interface PermissionsContextType {
  role: Role | null;
  permissions: any;
  can: (action: Action, module: Module | string) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [allRoles, setAllRoles] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const rolesRef = ref(database, 'roles');
    const unsubscribe = onValue(rolesRef, (snapshot) => {
        let rolesData;
        if (snapshot.exists()) {
            rolesData = snapshot.val();
        } else {
            // If roles don't exist in DB, set them from initialRoles
            set(rolesRef, initialRoles);
            rolesData = initialRoles;
        }
        setAllRoles(rolesData);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const role = user?.role as Role | null;
  const permissions = allRoles && role ? allRoles[role] : null;

  const can = useMemo(() => (action: Action, module: Module | string): boolean => {
    if (!permissions) return false;
    
    // The 'مسؤول' role can do everything if their permissions are somehow corrupted.
    if (role === 'مسؤول') {
        return true; 
    }
    
    const m = module as Module;
    if (!permissions[m] || !(action in permissions[m])) {
        return false;
    }
    return permissions[m][action as keyof typeof permissions[m]] || false;
  }, [permissions, role]);

  if (loading || !permissions) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="mr-2">جارٍ تحميل الصلاحيات...</p>
        </div>
    )
  }

  const value = { role, permissions, can };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = (): PermissionsContextType => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};
