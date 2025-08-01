
import React from 'react';
import Barcode from 'react-barcode';

export const PosReceipt = ({ invoice, company, design }: { invoice: any, company: any, design: any }) => {
  const receiptStyle: React.CSSProperties = {
    width: `${design?.receiptWidth || 72}mm`,
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: `${design?.fontSizes?.items || 10}px`,
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
    fontSize: `${design?.fontSizes?.companyName || 16}px`,
    fontWeight: 'bold',
  };

  const pStyle: React.CSSProperties = {
    margin: '2px 0',
    fontSize: `${design?.fontSizes?.header || 12}px`,
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '10px',
    fontSize: `${design?.fontSizes?.items || 10}px`,
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
    fontSize: `${design?.fontSizes?.totals || 11}px`,
  };

  const footerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginTop: '15px',
    fontSize: `${design?.fontSizes?.items || 10}px`,
  };

  return (
    <div style={receiptStyle} className="bg-white text-black printable-area">
      <div style={headerStyle}>
        {design?.showLogo && company?.logoUrl && <img src={company.logoUrl} alt="logo" style={{ maxWidth: '80px', margin: '0 auto 5px' }} />}
        {design?.showCompanyName && <h1 style={h1Style}>{company?.companyName || 'اسم الشركة'}</h1>}
        {design?.showAddress && <p style={pStyle}>{company?.companyAddress || 'عنوان الشركة'}</p>}
        {design?.showPhoneNumber && <p style={pStyle}>{company?.phone || 'رقم الهاتف'}</p>}
        <p style={pStyle}>فاتورة بيع</p>
      </div>
      
      <div style={{ borderBottom: '1px dashed #000', paddingBottom: '5px', marginBottom: '5px', fontSize: `${design?.fontSizes?.header || 12}px` }}>
        {design?.showInvoiceNumber && <p style={pStyle}>رقم: {invoice.invoiceNumber}</p>}
        <p style={pStyle}>التاريخ: {new Date(invoice.date).toLocaleString('ar-EG')}</p>
        {design?.showCashier && <p style={pStyle}>الكاشير: {invoice.cashierName}</p>}
      </div>
      
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>الصنف</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>الكمية</th>
            {design?.showItemPrice && <th style={{ ...thStyle, textAlign: 'right' }}>السعر</th>}
            <th style={{ ...thStyle, textAlign: 'right' }}>الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item: any, index: number) => (
            <tr key={`${item.id}-${index}`}>
              <td style={tdStyle}>{item.name}</td>
              <td style={{ ...tdStyle, textAlign: 'center' }}>{item.qty}</td>
              {design?.showItemPrice && <td style={{ ...tdStyle, textAlign: 'right' }}>{item.price.toFixed(2)}</td>}
              <td style={{ ...tdStyle, textAlign: 'right' }}>{item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={totalsStyle}>
        <p style={{ ...pStyle, display: 'flex', justifyContent: 'space-between' }}><span>الإجمالي الفرعي:</span> <span>{invoice.subtotal.toFixed(2)}</span></p>
        {design?.showDiscount && <p style={{ ...pStyle, display: 'flex', justifyContent: 'space-between' }}><span>الخصم:</span> <span>{invoice.discount.toFixed(2)}</span></p>}
        {design?.showTax && <p style={{ ...pStyle, display: 'flex', justifyContent: 'space-between' }}><span>الضريبة:</span> <span>{invoice.tax?.toFixed(2) || '0.00'}</span></p>}
        <p style={{ ...pStyle, display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', margin: '4px 0' }}><span>الإجمالي:</span> <span>{invoice.total.toFixed(2)}</span></p>
        <p style={{ ...pStyle, display: 'flex', justifyContent: 'space-between' }}><span>المدفوع:</span> <span>{invoice.paidAmount.toFixed(2)}</span></p>
        <p style={{ ...pStyle, display: 'flex', justifyContent: 'space-between' }}><span>المتبقي:</span> <span>{invoice.change.toFixed(2)}</span></p>
      </div>

       <div style={footerStyle}>
         {design?.showBarcode && invoice.invoiceNumber && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                <Barcode value={invoice.invoiceNumber} height={40} displayValue={false} margin={2} />
                <p style={{ ...pStyle, letterSpacing: '2px', fontSize: '10px' }}>{invoice.invoiceNumber}</p>
            </div>
         )}
        <p style={{marginTop: '10px'}}>{company?.invoiceFooter || 'شكرًا لتعاملكم معنا!'}</p>
      </div>
    </div>
  );
};
