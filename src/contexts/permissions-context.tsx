
"use client";

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import useFirebase from '@/hooks/use-firebase';
import { database } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';
import { Loader2 } from 'lucide-react';

// This is a simplified version. In a real app, you'd fetch this from your auth provider/backend.
const MOCK_CURRENT_USER_ROLE = 'مسؤول'; 

type RoleName = 'مسؤول' | 'محاسب' | 'أمين مخزن' | 'أمين صندوق';

export type PermissionAction = "view" | "add" | "edit" | "delete" | "print" | "generate";

export type PermissionModule = {
    label: string;
    group: string;
    actions: PermissionAction[];
};

export const permissionsConfig = {
    dashboard: { label: "لوحة التحكم", group: "general", actions: ["view"] },
    
    masterData_items: { label: "الأصناف", group: "masterData", actions: ["view", "add", "edit", "delete"] },
    masterData_warehouses: { label: "المخازن", group: "masterData", actions: ["view", "add", "edit", "delete"] },
    masterData_customers: { label: "العملاء", group: "masterData", actions: ["view", "add", "edit", "delete"] },
    masterData_suppliers: { label: "الموردون", group: "masterData", actions: ["view", "add", "edit", "delete"] },
    masterData_partners: { label: "الشركاء", group: "masterData", actions: ["view", "add", "edit", "delete"] },
    masterData_cashAccounts: { label: "الخزائن والبنوك", group: "masterData", actions: ["view", "add", "edit", "delete"] },
    masterData_salesReps: { label: "مناديب المبيعات", group: "masterData", actions: ["view", "add", "edit", "delete"] },

    inventory_stockIn: { label: "استلام مخزون", group: "inventory", actions: ["view", "add", "delete", "print"] },
    inventory_stockOut: { label: "صرف مخزون", group: "inventory", actions: ["view", "add", "delete", "print"] },
    inventory_transfer: { label: "تحويل مخزون", group: "inventory", actions: ["view", "add", "delete", "print"] },
    inventory_adjustment: { label: "تسوية المخزون", group: "inventory", actions: ["view", "add", "delete", "print"] },
    inventory_movements: { label: "حركة المخزون", group: "inventory", actions: ["view"] },

    sales_invoices: { label: "فواتير البيع", group: "sales", actions: ["view", "add", "edit", "delete", "print"] },
    sales_returns: { label: "مرتجعات البيع", group: "sales", actions: ["view", "add", "edit", "delete", "print"] },
    sales_issueToRep: { label: "صرف بضاعة لمندوب", group: "sales", actions: ["view", "add", "delete"] },
    sales_returnFromRep: { label: "مرتجع بضاعة من مندوب", group: "sales", actions: ["view", "add", "delete"] },
    sales_remitFromRep: { label: "توريد نقدية من مندوب", group: "sales", actions: ["view", "add", "delete"] },

    purchases_invoices: { label: "فواتير الشراء", group: "purchases", actions: ["view", "add", "edit", "delete", "print"] },
    purchases_returns: { label: "مرتجعات الشراء", group: "purchases", actions: ["view", "add", "edit", "delete", "print"] },

    accounting_journal: { label: "قيود اليومية", group: "accounting", actions: ["view"] },
    accounting_expenses: { label: "إدارة المصروفات", group: "accounting", actions: ["view", "add", "delete"] },
    accounting_exceptionalIncome: { label: "الدخل الاستثنائي", group: "accounting", actions: ["view", "add", "delete"] },
    accounting_supplierPayments: { label: "مدفوعات الموردين", group: "accounting", actions: ["view", "add", "delete"] },
    accounting_customerPayments: { label: "مقبوضات العملاء", group: "accounting", actions: ["view", "add", "delete"] },
    accounting_treasury: { label: "حركة الخزينة", group: "accounting", actions: ["view", "add", "delete"] },
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
};

const moduleGroupLabels: Record<string, string> = {
    general: "عام",
    masterData: "البيانات الرئيسية",
    inventory: "المخزون",
    sales: "المبيعات",
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

const initialRoles = {
  "مسؤول": generateAdminPermissions(),
  "محاسب": {
    dashboard: { view: true },
    masterData_items: { view: true, add: true, edit: true, delete: false },
    sales_invoices: { view: true, add: true, edit: true, delete: false, print: true },
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
  role: Role;
  permissions: any;
  can: (action: Action, module: Module | string) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allRoles, setAllRoles] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const rolesRef = ref(database, 'roles');
    const unsubscribe = onValue(rolesRef, (snapshot) => {
        if (snapshot.exists()) {
            setAllRoles(snapshot.val());
        } else {
            // If roles don't exist in DB, set them from initialRoles
            set(rolesRef, initialRoles);
            setAllRoles(initialRoles);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const role = MOCK_CURRENT_USER_ROLE as Role;
  const permissions = allRoles ? allRoles[role] : null;

  const can = useMemo(() => (action: Action, module: Module | string): boolean => {
    if (!permissions) return false;
    const m = module as Module;
    if (!permissions[m] || !(action in permissions[m])) {
        return false;
    }
    return permissions[m][action as keyof typeof permissions[m]] || false;
  }, [permissions]);

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
