

import React from 'react';

export const PosReceipt = ({ invoice, company }: { invoice: any, company: any }) => {
  const receiptStyle: React.CSSProperties = {
    width: '272px', // Approx 72mm for thermal printers
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '12px',
    color: '#000',
    padding: '10px',
    boxSizing: 'border-box',
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
    textAlign: 'left',
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
    <div style={receiptStyle}>
      <div style={headerStyle}>
        <h1 style={h1Style}>{company.companyName || 'اسم الشركة'}</h1>
        <p style={pStyle}>{company.companyAddress || 'عنوان الشركة'}</p>
        <p style={pStyle}>فاتورة بيع</p>
      </div>
      <p style={pStyle}>رقم الفاتورة: {invoice.invoiceNumber}</p>
      <p style={pStyle}>التاريخ: {new Date(invoice.date).toLocaleString('ar-EG')}</p>
      <p style={{...pStyle, marginBottom: '10px'}}>الكاشير: {invoice.cashierName}</p>
      
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>الصنف</th>
            <th style={{...thStyle, textAlign: 'center'}}>كمية</th>
            <th style={{...thStyle, textAlign: 'right'}}>سعر</th>
            <th style={{...thStyle, textAlign: 'right'}}>إجمالي</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item: any, index: number) => (
            <tr key={`${item.id}-${index}`}>
              <td style={tdStyle}>{item.name}</td>
              <td style={{...tdStyle, textAlign: 'center'}}>{item.qty}</td>
              <td style={{...tdStyle, textAlign: 'right'}}>{item.price.toFixed(2)}</td>
              <td style={{...tdStyle, textAlign: 'right'}}>{item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={totalsStyle}>
        <p style={{...pStyle, display: 'flex', justifyContent: 'space-between'}}><span>الإجمالي الفرعي:</span> <span>{invoice.subtotal.toFixed(2)}</span></p>
        <p style={{...pStyle, display: 'flex', justifyContent: 'space-between'}}><span>الخصم:</span> <span>{invoice.discount.toFixed(2)}</span></p>
        <p style={{...pStyle, display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', margin: '4px 0'}}><span>الإجمالي:</span> <span>{invoice.total.toFixed(2)}</span></p>
        <p style={{...pStyle, display: 'flex', justifyContent: 'space-between'}}><span>المدفوع:</span> <span>{invoice.paidAmount.toFixed(2)}</span></p>
        <p style={{...pStyle, display: 'flex', justifyContent: 'space-between'}}><span>المتبقي:</span> <span>{invoice.change.toFixed(2)}</span></p>
      </div>

      <div style={footerStyle}>
        <p>شكرًا لتسوقكم معنا!</p>
      </div>
    </div>
  );
};
