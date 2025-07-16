
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
    pos: { label: "نقطة البيع (الكاشير)", group: "general", actions: ["view"] },
    pos_closing: { label: "إقفال وردية الكاشير", group: "settings", actions: ["view"] },
    
    masterData_items: { label: "الأصناف", group: "masterData", actions: ["view", "add", "edit", "delete"] },
    masterData_itemGroups: { label: "مجموعات الأصناف", group: "masterData", actions: ["view", "add", "edit", "delete"] },
    masterData_warehouses: { label: "المخازن", group: "masterData", actions: ["view", "add", "edit", "delete"] },
    masterData_customers: { label: "العملاء", group: "masterData", actions: ["view", "add", "edit", "delete"] },
    masterData_suppliers: { label: "الموردون", group: "masterData", actions: ["view", "add", "edit", "delete"] },
    masterData_partners: { label: "الشركاء", group: "masterData", actions: ["view", "add", "edit", "delete"] },
    masterData_cashAccounts: { label: "الخزائن والبنوك", group: "masterData", actions: ["view", "add", "edit", "delete"] },
    masterData_salesReps: { label: "مناديب المبيعات", group: "masterData", actions: ["view"] },

    inventory_stockIn: { label: "استلام مخزون", group: "inventory", actions: ["view", "add", "delete", "print"] },
    inventory_stockOut: { label: "صرف مخزون", group: "inventory", actions: ["view", "add", "delete", "print"] },
    inventory_transfer: { label: "تحويل مخزون", group: "inventory", actions: ["view", "add", "delete", "print"] },
    inventory_adjustment: { label: "تسوية المخزون", group: "inventory", actions: ["view", "add", "delete", "print"] },
    inventory_movements: { label: "حركة المخزون", group: "inventory", actions: ["view"] },
    inventory_stockStatus: { label: "أرصدة المخزون", group: "inventory", actions: ["view"] },

    sales_invoices: { label: "فواتير البيع", group: "sales", actions: ["view", "add", "edit", "delete", "print"] },
    sales_returns: { label: "مرتجعات البيع", group: "sales", actions: ["view", "add", "edit", "delete", "print"] },
    
    sales_issueToRep: { label: "صرف بضاعة لمندوب", group: "salesReps", actions: ["view", "add", "delete"] },
    sales_returnFromRep: { label: "مرتجع بضاعة من مندوب", group: "salesReps", actions: ["view", "add", "delete"] },
    sales_remitFromRep: { label: "توريد نقدية من مندوب", group: "salesReps", actions: ["view", "add", "delete"] },
    sales_repInvoices: { label: "اعتماد فواتير المناديب", group: "salesReps", actions: ["view", "approve", "delete"] },
    sales_repOperations: { label: "مراقبة أداء المناديب", group: "salesReps", actions: ["view"] },

    purchases_invoices: { label: "فواتير الشراء", group: "purchases", actions: ["view", "add", "edit", "delete", "print"] },
    purchases_returns: { label: "مرتجعات الشراء", group: "purchases", actions: ["view", "add", "edit", "delete", "print"] },

    accounting_journal: { label: "قيود اليومية", group: "accounting", actions: ["view"] },
    accounting_expenses: { label: "إدارة المصروفات", group: "accounting", actions: ["view", "add", "delete"] },
    accounting_exceptionalIncome: { label: "الدخل الاستثنائي", group: "accounting", actions: ["view", "add", "delete"] },
    accounting_supplierPayments: { label: "مدفوعات الموردين", group: "accounting", actions: ["view", "add", "delete"] },
    accounting_customerPayments: { label: "مقبوضات العملاء", group: "accounting", actions: ["view", "add", "delete"] },
    accounting_treasury: { label: "حركة الخزينة", group: "accounting", actions: ["view", "add", "delete"] },
    accounting_profitDistribution: { label: "توزيعات الأرباح", group: "accounting", actions: ["view", "add", "delete"] },
    accounting_aiAnalysis: { label: "تحليل مالي بالذكاء الاصطناعي", group: "accounting", actions: ["view", "generate"] },
    
    hr_employees: { label: "الموظفين", group: "hr", actions: ["view", "add", "edit", "delete"] },
    hr_advances: { label: "سلف الموظفين", group: "hr", actions: ["view", "add", "delete"] },
    hr_adjustments: { label: "المكافآت والجزاءات", group: "hr", actions: ["view", "add", "delete"] },
    hr_payroll: { label: "احتساب الرواتب", group: "hr", actions: ["view", "generate", "print"] },

    analytics: { label: "التحليلات", group: "reports", actions: ["view"] },
    reports_financialStatements: { label: "القوائم المالية", group: "reports", actions: ["view", "print"] },
    reports_partnerShares: { label: "حصص الشركاء", group: "reports", actions: ["view", "generate", "print"] },
    reports_customerStatement: { label: "كشف حساب العملاء", group: "reports", actions: ["view", "generate", "print"] },
    reports_supplierStatement: { label: "كشف حساب الموردين", group: "reports", actions: ["view", "generate", "print"] },
    reports_itemProfitLoss: { label: "أرباح وخسائر الأصناف", group: "reports", actions: ["view", "generate", "print"] },

    settings_users: { label: "المستخدمون", group: "settings", actions: ["view", "add", "edit", "delete"] },
    settings_roles: { label: "الأدوار والصلاحيات", group: "settings", actions: ["view", "edit"] },
    settings_general: { label: "الإعدادات العامة", group: "settings", actions: ["view", "edit"] },
    settings_backup: { label: "النسخ الاحتياطي", group: "settings", actions: ["view", "generate"] },
    settings_periodClosing: { label: "إقفال الفترات", group: "settings", actions: ["view", "generate"] },
};

const moduleGroupLabels: Record<string, string> = {
    general: "عام",
    masterData: "البيانات الرئيسية",
    inventory: "المخزون",
    sales: "المبيعات",
    salesReps: "عمليات المناديب",
    purchases: "المشتريات",
    accounting: "المحاسبة",
    hr: "الموارد البشرية",
    reports: "التقارير والتحليلات",
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
    masterData_items: { view: true, add: true, edit: true, delete: false },
    sales_invoices: { view: true, add: true, edit: true, delete: false, print: true },
    sales_repInvoices: { view: true, approve: true, delete: true },
    purchases_invoices: { view: true, add: true, edit: true, delete: false, print: true },
    accounting_journal: { view: true },
    accounting_expenses: { view: true, add: true, edit: false, delete: false },
    reports_customerStatement: { view: true, generate: true, print: true },
  },
  "أمين مخزن": {
    dashboard: { view: true },
    masterData_items: { view: true, add: false, edit: false, delete: false },
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
