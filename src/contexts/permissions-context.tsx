
"use client";

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import useFirebase from '@/hooks/use-firebase';
import { database } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';
import { Loader2 } from 'lucide-react';

// This is a simplified version. In a real app, you'd fetch this from your auth provider/backend.
const MOCK_CURRENT_USER_ROLE: Role = 'مسؤول'; 

const initialRoles = {
  مسؤول: {
    dashboard: { view: true },
    masterData: { view: true, add: true, edit: true, delete: true },
    inventory: { view: true, add: true, edit: true, delete: true },
    sales: { view: true, add: true, edit: true, delete: true, print: true },
    purchases: { view: true, add: true, edit: true, delete: true, print: true },
    accounting: { view: true, add: true, edit: true, delete: true },
    hr: { view: true, add: true, edit: true, delete: true },
    reports: { view: true, generate: true },
    analytics: { view: true },
    users: { view: true, add: true, edit: true, delete: true },
    roles: { view: true, edit: true },
    settings: { view: true, edit: true },
  },
  محاسب: {
    dashboard: { view: true },
    masterData: { view: true, add: true, edit: true, delete: false },
    inventory: { view: true, add: false, edit: false, delete: false },
    sales: { view: true, add: true, edit: true, delete: false, print: true },
    purchases: { view: true, add: true, edit: true, delete: false, print: true },
    accounting: { view: true, add: true, edit: true, delete: true },
    hr: { view: false, add: false, edit: false, delete: false },
    reports: { view: true, generate: true },
    analytics: { view: true },
    users: { view: false, add: false, edit: false, delete: false },
    roles: { view: false, edit: false },
    settings: { view: false, edit: false },
  },
  "أمين مخزن": {
    dashboard: { view: true },
    masterData: { view: true, add: false, edit: false, delete: false },
    inventory: { view: true, add: true, edit: true, delete: true },
    sales: { view: false, add: false, edit: false, delete: false, print: false },
    purchases: { view: false, add: false, edit: false, delete: false, print: false },
    accounting: { view: false, add: false, edit: false, delete: false },
    hr: { view: false, add: false, edit: false, delete: false },
    reports: { view: true, generate: false },
    analytics: { view: false },
    users: { view: false, add: false, edit: false, delete: false },
    roles: { view: false, edit: false },
    settings: { view: false, edit: false },
  },
  "أمين صندوق": {
    dashboard: { view: true },
    masterData: { view: true, add: false, edit: false, delete: false },
    inventory: { view: false, add: false, edit: false, delete: false },
    sales: { view: true, add: true, edit: false, delete: false, print: true },
    purchases: { view: true, add: true, edit: false, delete: false, print: true },
    accounting: { view: true, add: true, edit: false, delete: false },
    hr: { view: false, add: false, edit: false, delete: false },
    reports: { view: true, generate: false },
    analytics: { view: true },
    users: { view: false, add: false, edit: false, delete: false },
    roles: { view: false, edit: false },
    settings: { view: false, edit: false },
  },
};

type Role = keyof typeof initialRoles;
type Module = keyof (typeof initialRoles)[Role];
type Action = keyof (typeof initialRoles)[Role][Module];

interface PermissionsContextType {
  role: Role;
  permissions: (typeof initialRoles)[Role];
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

  const role = MOCK_CURRENT_USER_ROLE;
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
