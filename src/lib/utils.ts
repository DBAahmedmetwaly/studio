import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function getLinkForReceipt(receiptNumber?: string, id?: string): string {
    if (!receiptNumber || !id) return '#';

    const prefixes: Record<string, string> = {
        'ف-ب-': `/sales/invoices/${id}`,
        'ف-ش-': `/purchases/invoices/${id}`,
        'م-ب-': `/sales/returns/${id}`,
        'م-ش-': `/purchases/returns/${id}`,
        'إذ-د-': `/inventory/stock-in/${id}`,
        'إذ-خ-': `/inventory/stock-out/${id}`,
        'إذ-ت-': `/inventory/transfer/${id}`,
        'ت-م-': `/inventory/adjustment/${id}`, // Assuming adjustment page exists
        'م-': `/accounting/expenses/${id}`, // Assuming expense detail page exists
        'إ-س-': `/accounting/exceptional-income/${id}`, // Assuming income detail page exists
        'س-ع-': `/accounting/customer-payments/${id}`, // Assuming payment detail page exists
        'س-م-': `/accounting/supplier-payments/${id}`, // Assuming payment detail page exists
        'ح-خ-': `/accounting/treasury/${id}`, // Assuming treasury detail page exists
    };

    for (const prefix in prefixes) {
        if (receiptNumber.startsWith(prefix)) {
            return prefixes[prefix];
        }
    }
    return '#'; // Fallback for unknown prefixes
}
