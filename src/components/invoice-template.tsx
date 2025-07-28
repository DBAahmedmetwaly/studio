

import React from 'react';

interface InvoiceTemplateProps {
  invoice: any; 
  company: any;
  customer: any;
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ invoice, company, customer }) => {
    
  const totalAmount = invoice.items.reduce((sum: number, item: any) => sum + item.total, 0);

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto printable-area font-sans text-gray-800">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-gray-200 pb-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-primary text-primary-foreground h-16 w-16 flex items-center justify-center rounded-lg text-2xl font-bold">
            {company?.companyName?.charAt(0) || 'ش'}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{company?.companyName || 'اسم الشركة'}</h1>
            <p className="text-gray-500">{company?.companyAddress || 'عنوان الشركة'}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-bold text-primary uppercase tracking-wider">فاتورة</h2>
          <p className="text-gray-500 mt-1">رقم: {invoice.invoiceNumber}</p>
        </div>
      </div>

      {/* Bill To & Dates */}
      <div className="flex justify-between mb-8">
        <div>
          <h3 className="font-bold text-gray-600 mb-2">فاتورة إلى:</h3>
          <p className="font-bold text-gray-800">{customer?.name || invoice.customerName}</p>
          <p className="text-gray-500">{customer?.address || 'غير متوفر'}</p>
          <p className="text-gray-500">{customer?.phone || 'غير متوفر'}</p>
        </div>
        <div className="text-right">
          <p><span className="font-bold text-gray-600">تاريخ الفاتورة:</span> {new Date(invoice.date).toLocaleDateString('ar-EG')}</p>
          <p><span className="font-bold text-gray-600">تاريخ الاستحقاق:</span> {new Date(invoice.date).toLocaleDateString('ar-EG')}</p>
        </div>
      </div>

      {/* Items Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 font-bold text-gray-600">الصنف</th>
              <th className="p-3 font-bold text-gray-600 text-center">الكمية</th>
              <th className="p-3 font-bold text-gray-600 text-center">سعر الوحدة</th>
              <th className="p-3 font-bold text-gray-600 text-left">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item: any, index: number) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="p-3">{item.name}</td>
                <td className="p-3 text-center">{item.qty}</td>
                <td className="p-3 text-center">{item.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="p-3 text-left">{item.total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mt-8">
        <div className="w-full max-w-xs space-y-3">
          <div className="flex justify-between">
            <span className="font-bold text-gray-600">الإجمالي الفرعي:</span>
            <span className="font-bold text-gray-800">{invoice.subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-gray-600">الخصم:</span>
            <span className="font-bold text-gray-800">{invoice.discount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
           <div className="flex justify-between">
            <span className="font-bold text-gray-600">الضريبة (14%):</span>
            <span className="font-bold text-gray-800">{invoice.tax?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-2xl font-bold text-primary border-t-2 border-primary pt-3 mt-3">
            <span>الإجمالي:</span>
            <span>{invoice.total?.toLocaleString(undefined, { minimumFractionDigits: 2 })} ج.م</span>
          </div>
           <div className="flex justify-between">
            <span className="font-bold text-gray-600">المدفوع:</span>
            <span className="font-bold text-gray-800">{invoice.paidAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
           <div className="flex justify-between">
            <span className="font-bold text-gray-600">المتبقي:</span>
            <span className="font-bold text-gray-800">{(invoice.total - (invoice.paidAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-gray-500 text-sm">
        <p>شكرًا لك على عملك معنا.</p>
        <p>إذا كان لديك أي أسئلة حول هذه الفاتورة، يرجى الاتصال بنا.</p>
      </div>
    </div>
  );
};
