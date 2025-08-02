

"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import useFirebase from '@/hooks/use-firebase';
import { Loader2 } from 'lucide-react';

interface DataContextType {
    // Master Data
    items: any[];
    customers: any[];
    suppliers: any[];
    warehouses: any[];
    cashAccounts: any[];
    partners: any[];
    users: any[];
    itemGroups: any[];
    barcodeDesigns: any[];
    roles: any; 
    settings: any;

    // Inventory
    stockInRecords: any[];
    stockOutRecords: any[];
    stockTransferRecords: any[];
    stockAdjustmentRecords: any[];
    stockIssuesToReps: any[];
    stockReturnsFromReps: any[];
    inventoryClosings: any[];

    // Sales & Purchases
    salesInvoices: any[];
    salesReturns: any[];
    purchaseInvoices: any[];
    purchaseReturns: any[];
    posSales: any[];
    posReturns: any[];
    posSessions: any[];
    posAuditLogs: any[];

    // Accounting
    expenses: any[];
    exceptionalIncomes: any[];
    customerPayments: any[];
    supplierPayments: any[];
    treasuryTransactions: any[];
    profitDistributions: any[];
    
    // HR
    employees: any[];
    employeeAdvances: any[];
    employeeAdjustments: any[];
    repRemittances: any[];
    
    // Actions
    dbAction: (path: string, action: 'add' | 'update' | 'remove', payload?: any) => Promise<string | void>;
    getNextId: (counterName: string, startFrom?: number) => Promise<number | null>;

    loading: boolean;
    allData: any; // For backup purposes
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Master Data
    const { data: items, loading: l_items, add: add_item, update: update_item, remove: remove_item, getNextId: getNextId_item } = useFirebase('items');
    const { data: customers, loading: l_customers, add: add_customer, update: update_customer, remove: remove_customer } = useFirebase('customers');
    const { data: suppliers, loading: l_suppliers, add: add_supplier, update: update_supplier, remove: remove_supplier } = useFirebase('suppliers');
    const { data: warehouses, loading: l_warehouses, add: add_warehouse, update: update_warehouse, remove: remove_warehouse } = useFirebase('warehouses');
    const { data: cashAccounts, loading: l_cashAccounts, add: add_cashAccount, update: update_cashAccount, remove: remove_cashAccount } = useFirebase('cashAccounts');
    const { data: partners, loading: l_partners, add: add_partner, update: update_partner, remove: remove_partner } = useFirebase('partners');
    const { data: users, loading: l_users, add: add_user, update: update_user, remove: remove_user } = useFirebase('users');
    const { data: itemGroups, loading: l_itemGroups, add: add_itemGroup, update: update_itemGroup, remove: remove_itemGroup } = useFirebase('itemGroups');
    const { data: barcodeDesigns, loading: l_barcodeDesigns, add: add_barcodeDesign, update: update_barcodeDesign, remove: remove_barcodeDesign } = useFirebase('barcodeDesigns');
    const { data: roles, loading: l_roles, setData: set_roles } = useFirebase('roles'); // Special handling for roles
    const { data: settings, loading: l_settings, update: update_settings } = useFirebase('settings');
    const { data: allData, loading: l_allData, remove: remove_allData } = useFirebase('/');


    // Inventory
    const { data: stockInRecords, loading: l_stockInRecords, add: add_stockInRecord, remove: remove_stockInRecord } = useFirebase('stockInRecords');
    const { data: stockOutRecords, loading: l_stockOutRecords, add: add_stockOutRecord, remove: remove_stockOutRecord } = useFirebase('stockOutRecords');
    const { data: stockTransferRecords, loading: l_stockTransferRecords, add: add_stockTransferRecord, remove: remove_stockTransferRecord } = useFirebase('stockTransferRecords');
    const { data: stockAdjustmentRecords, loading: l_stockAdjustmentRecords, add: add_stockAdjustmentRecord, remove: remove_stockAdjustmentRecord } = useFirebase('stockAdjustmentRecords');
    const { data: stockIssuesToReps, loading: l_stockIssuesToReps, add: add_stockIssueToRep, remove: remove_stockIssueToRep } = useFirebase('stockIssuesToReps');
    const { data: stockReturnsFromReps, loading: l_stockReturnsFromReps, add: add_stockReturnFromRep, remove: remove_stockReturnFromRep } = useFirebase('stockReturnsFromReps');
    const { data: inventoryClosings, loading: l_inventoryClosings, add: add_inventoryClosing, remove: remove_inventoryClosing } = useFirebase('inventoryClosings');


    // Sales & Purchases
    const { data: salesInvoices, loading: l_salesInvoices, add: add_salesInvoice, update: update_salesInvoice, remove: remove_salesInvoice } = useFirebase('salesInvoices');
    const { data: salesReturns, loading: l_salesReturns, add: add_salesReturn, remove: remove_salesReturn } = useFirebase('salesReturns');
    const { data: purchaseInvoices, loading: l_purchaseInvoices, add: add_purchaseInvoice, update: update_purchaseInvoice, remove: remove_purchaseInvoice } = useFirebase('purchaseInvoices');
    const { data: purchaseReturns, loading: l_purchaseReturns, add: add_purchaseReturn, remove: remove_purchaseReturn } = useFirebase('purchaseReturns');
    const { data: posSales, loading: l_posSales, add: add_posSale, remove: remove_posSale } = useFirebase('posSales');
    const { data: posReturns, loading: l_posReturns, add: add_posReturn, remove: remove_posReturn } = useFirebase('posReturns');
    const { data: posSessions, loading: l_posSessions, add: add_posSession, update: update_posSession, remove: remove_posSession } = useFirebase('posSessions');
    const { data: posAuditLogs, loading: l_posAuditLogs, add: add_posAuditLog, remove: remove_posAuditLog } = useFirebase('posAuditLogs');

    // Accounting
    const { data: expenses, loading: l_expenses, add: add_expense, remove: remove_expense } = useFirebase('expenses');
    const { data: exceptionalIncomes, loading: l_exceptionalIncomes, add: add_exceptionalIncome, remove: remove_exceptionalIncome } = useFirebase('exceptionalIncomes');
    const { data: customerPayments, loading: l_customerPayments, add: add_customerPayment, remove: remove_customerPayment } = useFirebase('customerPayments');
    const { data: supplierPayments, loading: l_supplierPayments, add: add_supplierPayment, remove: remove_supplierPayment } = useFirebase('supplierPayments');
    const { data: treasuryTransactions, loading: l_treasuryTransactions, add: add_treasuryTransaction, remove: remove_treasuryTransaction } = useFirebase('treasuryTransactions');
    const { data: profitDistributions, loading: l_profitDistributions, add: add_profitDistribution, remove: remove_profitDistribution } = useFirebase('profitDistributions');
    
    // HR
    const { data: employees, loading: l_employees, add: add_employee, update: update_employee, remove: remove_employee } = useFirebase('employees');
    const { data: employeeAdvances, loading: l_employeeAdvances, add: add_employeeAdvance, remove: remove_employeeAdvance } = useFirebase('employeeAdvances');
    const { data: employeeAdjustments, loading: l_employeeAdjustments, add: add_employeeAdjustment, remove: remove_employeeAdjustment } = useFirebase('employeeAdjustments');
    const { data: repRemittances, loading: l_repRemittances, add: add_repRemittance, remove: remove_repRemittance } = useFirebase('repRemittances');
    const { data: counters, loading: l_counters, remove: remove_counters } = useFirebase('counters');
    
    // Generic getNextId from a single hook instance
    const { getNextId } = useFirebase('counters');


    const loading = l_items || l_customers || l_suppliers || l_warehouses || l_cashAccounts || l_partners || l_users || l_itemGroups || l_roles || l_settings || l_stockInRecords || l_stockOutRecords || l_stockTransferRecords || l_stockAdjustmentRecords || l_stockIssuesToReps || l_stockReturnsFromReps || l_salesInvoices || l_salesReturns || l_purchaseInvoices || l_purchaseReturns || l_expenses || l_exceptionalIncomes || l_customerPayments || l_supplierPayments || l_treasuryTransactions || l_employees || l_employeeAdvances || l_employeeAdjustments || l_repRemittances || l_posSales || l_posSessions || l_profitDistributions || l_posAuditLogs || l_barcodeDesigns || l_inventoryClosings || l_posReturns || l_allData || l_counters;
    
    // A single function to dispatch actions to the correct hook
    const dbAction = async (path: string, action: 'add' | 'update' | 'remove', payload?: any) => {
        const actionsMap: { [key: string]: any } = {
            'items': { add: add_item, update: update_item, remove: remove_item },
            'customers': { add: add_customer, update: update_customer, remove: remove_customer },
            'suppliers': { add: add_supplier, update: update_supplier, remove: remove_supplier },
            'warehouses': { add: add_warehouse, update: update_warehouse, remove: remove_warehouse },
            'cashAccounts': { add: add_cashAccount, update: update_cashAccount, remove: remove_cashAccount },
            'partners': { add: add_partner, update: update_partner, remove: remove_partner },
            'users': { add: add_user, update: update_user, remove: remove_user },
            'itemGroups': { add: add_itemGroup, update: update_itemGroup, remove: remove_itemGroup },
            'barcodeDesigns': { add: add_barcodeDesign, update: update_barcodeDesign, remove: remove_barcodeDesign },
            'salesInvoices': { add: add_salesInvoice, update: update_salesInvoice, remove: remove_salesInvoice },
            'salesReturns': { add: add_salesReturn, remove: remove_salesReturn },
            'purchaseInvoices': { add: add_purchaseInvoice, update: update_purchaseInvoice, remove: remove_purchaseInvoice },
            'purchaseReturns': { add: add_purchaseReturn, remove: remove_purchaseReturn },
            'posSales': { add: add_posSale, remove: remove_posSale },
            'posReturns': { add: add_posReturn, remove: remove_posReturn },
            'posSessions': { add: add_posSession, update: update_posSession, remove: remove_posSession },
            'posAuditLogs': { add: add_posAuditLog, remove: remove_posAuditLog },
            'stockInRecords': { add: add_stockInRecord, remove: remove_stockInRecord },
            'stockOutRecords': { add: add_stockOutRecord, remove: remove_stockOutRecord },
            'stockTransferRecords': { add: add_stockTransferRecord, remove: remove_stockTransferRecord },
            'stockAdjustmentRecords': { add: add_stockAdjustmentRecord, remove: remove_stockAdjustmentRecord },
            'stockIssuesToReps': { add: add_stockIssueToRep, remove: remove_stockIssueToRep },
            'stockReturnsFromReps': { add: add_stockReturnFromRep, remove: remove_stockReturnFromRep },
            'inventoryClosings': { add: add_inventoryClosing, remove: remove_inventoryClosing },
            'expenses': { add: add_expense, remove: remove_expense },
            'exceptionalIncomes': { add: add_exceptionalIncome, remove: remove_exceptionalIncome },
            'customerPayments': { add: add_customerPayment, remove: remove_customerPayment },
            'supplierPayments': { add: add_supplierPayment, remove: remove_supplierPayment },
            'treasuryTransactions': { add: add_treasuryTransaction, remove: remove_treasuryTransaction },
            'profitDistributions': { add: add_profitDistribution, remove: remove_profitDistribution },
            'employees': { add: add_employee, update: update_employee, remove: remove_employee },
            'employeeAdvances': { add: add_employeeAdvance, remove: remove_employeeAdvance },
            'employeeAdjustments': { add: add_employeeAdjustment, remove: remove_employeeAdjustment },
            'repRemittances': { add: add_repRemittance, remove: remove_repRemittance },
            'settings': { update: update_settings },
            'counters': { remove: remove_counters },
            // Add other paths here
        };

        const actionFn = actionsMap[path]?.[action];
        if (!actionFn) {
            throw new Error(`Action '${action}' not found for path '${path}'`);
        }

        if (action === 'add') return actionFn(payload);
        if (action === 'update') return actionFn(payload.id, payload.data);
        if (action === 'remove') return actionFn(payload.root ? '' : payload.id);
    };

    const value = {
        items, customers, suppliers, warehouses, cashAccounts, partners, users, itemGroups, barcodeDesigns, roles, settings,
        stockInRecords, stockOutRecords, stockTransferRecords, stockAdjustmentRecords, stockIssuesToReps, stockReturnsFromReps, inventoryClosings,
        salesInvoices, salesReturns, purchaseInvoices, purchaseReturns, posSales, posReturns, posSessions, posAuditLogs,
        expenses, exceptionalIncomes, customerPayments, supplierPayments, treasuryTransactions, profitDistributions,
        employees, employeeAdvances, employeeAdjustments, repRemittances,
        dbAction, getNextId,
        loading,
        allData
    };

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="mr-2">جارٍ تحميل بيانات التطبيق...</p>
            </div>
        );
    }
    
    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
