
import React from 'react';

interface InvoiceTemplateProps {
  invoice: any; 
  company: any;
  customer: any;
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ invoice, company, customer }) => {
    
  const receiptStyle: React.CSSProperties = {
    width: '272px', // Approx 72mm for thermal printers
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '12px',
    color: '#000',
    padding: '10px',
    boxSizing: 'border-box',
    direction: 'rtl',
    textAlign: 'right'
  };

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '10px',
  };
  
  const h1Style: React.CSSProperties = {
    margin: '0',
    fontSize: '16px',
    fontWeight: 'bold',
  };

  const pStyle: React.CSSProperties = {
    margin: '2px 0',
    fontSize: '10px',
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '10px',
    fontSize: '10px',
  };

  const thStyle: React.CSSProperties = {
    borderBottom: '1px dashed #000',
    padding: '4px 2px',
    textAlign: 'right',
  };
  
  const tdStyle: React.CSSProperties = {
    padding: '2px',
    verticalAlign: 'top',
  };
  
   const totalsStyle: React.CSSProperties = {
    marginTop: '10px',
    paddingTop: '5px',
    borderTop: '1px solid #000',
    fontSize: '11px',
  };

  const footerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginTop: '15px',
    fontSize: '10px',
  };


  return (
    <div style={receiptStyle} className="bg-white text-black printable-area">
      <div style={headerStyle}>
        <h1 style={h1Style}>{company?.companyName || 'اسم الشركة'}</h1>
        <p style={pStyle}>{company?.companyAddress || 'عنوان الشركة'}</p>
        <p style={pStyle}>فاتورة بيع</p>
      </div>
      
      <div style={{ borderBottom: '1px dashed #000', paddingBottom: '5px', marginBottom: '5px' }}>
          <p style={pStyle}>رقم: {invoice.invoiceNumber}</p>
          <p style={pStyle}>التاريخ: {new Date(invoice.date).toLocaleString('ar-EG')}</p>
          <p style={pStyle}>العميل: {customer?.name || invoice.customerName}</p>
      </div>
      
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>الصنف</th>
            <th style={{...thStyle, textAlign: 'center'}}>كمية</th>
            <th style={{...thStyle, textAlign: 'left'}}>إجمالي</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item: any, index: number) => (
            <React.Fragment key={index}>
             <tr>
              <td colSpan={3} style={{...tdStyle, paddingBottom: 0}}>{item.name}</td>
            </tr>
            <tr>
              <td style={{...tdStyle, paddingTop: 0}}></td>
              <td style={{...tdStyle, textAlign: 'center', paddingTop: 0}}>{item.qty} x {item.price?.toLocaleString()}</td>
              <td style={{...tdStyle, textAlign: 'left', paddingTop: 0}}>{item.total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
           </React.Fragment>
          ))}
        </tbody>
      </table>

      <div style={totalsStyle}>
        <p style={{...pStyle, display: 'flex', justifyContent: 'space-between'}}><span>الإجمالي الفرعي:</span> <span>{invoice.subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></p>
        <p style={{...pStyle, display: 'flex', justifyContent: 'space-between'}}><span>الخصم:</span> <span>{invoice.discount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></p>
        <p style={{...pStyle, display: 'flex', justifyContent: 'space-between'}}><span>الضريبة:</span> <span>{invoice.tax?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></p>
        <p style={{...pStyle, display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', margin: '4px 0'}}><span>الإجمالي:</span> <span>{invoice.total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></p>
        <p style={{...pStyle, display: 'flex', justifyContent: 'space-between'}}><span>المدفوع:</span> <span>{invoice.paidAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></p>
        <p style={{...pStyle, display: 'flex', justifyContent: 'space-between', fontWeight: 'bold'}}><span>المتبقي:</span> <span>{(invoice.total - (invoice.paidAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></p>
      </div>

      <div style={footerStyle}>
        <p>شكرًا لتعاملكم معنا!</p>
      </div>
    </div>
  );
};
