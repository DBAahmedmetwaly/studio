
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/contexts/data-provider';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Loader2, Printer, ArrowRight } from 'lucide-react';
import { InvoiceTemplate } from '@/components/invoice-template';

interface SaleInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  items: { id: string; name: string; qty: number; price: number; total: number; }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
}

export default function SaleInvoiceDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const id = params.id;

  const { salesInvoices, customers, settings, loading } = useData();

  const [invoice, setInvoice] = useState<SaleInvoice | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [companySettings, setCompanySettings] = useState<any>(null);

  useEffect(() => {
    if (salesInvoices.length > 0 && id) {
      const foundInvoice = salesInvoices.find((r:any) => r.id === id);
      setInvoice(foundInvoice || null);
      if(foundInvoice) {
        const foundCustomer = customers.find((c:any) => c.id === foundInvoice.customerId);
        setCustomer(foundCustomer || null);
      }
    }
    if (settings.length > 0) {
      setCompanySettings(settings.find((s:any) => s.id === 'main')?.general);
    }
  }, [salesInvoices, customers, settings, id]);

  const handlePrint = () => {
    window.print();
  };
  
  if (loading) {
    return <div className="flex flex-1 justify-center items-center"><Loader2 className="h-10 w-10 animate-spin" /></div>;
  }
  
  if (!invoice) {
    return <div className="flex flex-1 justify-center items-center"><p>لم يتم العثور على الفاتورة.</p></div>;
  }

  return (
    <>
      <PageHeader title={`فاتورة: ${invoice.invoiceNumber}`}>
        <div className="flex gap-2 no-print">
            <Button onClick={handlePrint} variant="outline">
                <Printer className="ml-2 h-4 w-4" />
                طباعة
            </Button>
             <Button onClick={() => router.back()}>الرجوع إلى القائمة</Button>
        </div>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-8">
        <InvoiceTemplate invoice={invoice} company={companySettings} customer={customer} />
      </main>
    </>
  );
}
