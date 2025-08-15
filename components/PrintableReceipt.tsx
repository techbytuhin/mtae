import React, { useContext, useMemo, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { Sale } from '../types';
import { useTranslation, handleImageError, TranslationKey } from '../hooks/useTranslation';
import QRCode from 'qrcode';

export const PrintableReceipt: React.FC<{ sale: Sale }> = ({ sale }) => {
    const { state } = useContext(AppContext);
    const { t, lang, formatDateTime, currency } = useTranslation();
    const { settings, products, customers } = state;
    const customer = customers.find(c => c.id === sale.customerId);
    const qrRef = useRef<HTMLCanvasElement>(null);

     useEffect(() => {
        if (qrRef.current) {
            QRCode.toCanvas(qrRef.current, sale.id, {
                width: 80,
                margin: 1,
                errorCorrectionLevel: 'H'
            }, (error) => {
                if (error) console.error("QR Code generation failed:", error);
            });
        }
    }, [sale.id]);

    const currencyFormatter = useMemo(() => new Intl.NumberFormat(lang, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }), [lang, currency]);

    const totalItemDiscount = sale.items.reduce((sum, item) => sum + (item.discount || 0), 0);
    const netSubtotal = sale.subtotal - totalItemDiscount;
    const vatAmount = netSubtotal * (sale.vatPercentage / 100);

    const receiptStyle: React.CSSProperties = {
        width: '100%',
        padding: '10px',
        background: 'white',
        color: 'black',
        fontFamily: '"Source Code Pro", "Courier New", monospace',
        fontSize: '12px',
        lineHeight: '1.4',
        boxSizing: 'border-box',
    };
    
    const textCenter: React.CSSProperties = { textAlign: 'center' };
    const textRight: React.CSSProperties = { textAlign: 'right' };
    const textLeft: React.CSSProperties = { textAlign: 'left' };
    const bold: React.CSSProperties = { fontWeight: 'bold' };
    const noMargin: React.CSSProperties = { margin: 0 };
    const hrStyle: React.CSSProperties = { border: 'none', borderTop: '1px dashed black', margin: '10px 0' };

    return (
        <div style={receiptStyle}>
            {/* Header */}
            <header style={textCenter}>
                {settings.shopLogo && <img src={settings.shopLogo} alt="Logo" style={{ width: '60px', margin: '0 auto 10px' }} onError={handleImageError} />}
                <h2 style={{ ...bold, fontSize: '16px', ...noMargin }}>{settings.shopName}</h2>
                <p style={{ ...noMargin, fontSize: '11px' }}>{settings.shopAddress}</p>
                <p style={{ ...noMargin, fontSize: '11px' }}>{settings.shopPhone}</p>
            </header>

            <hr style={hrStyle} />

            {/* Info Section */}
            <section style={{ fontSize: '11px' }}>
                <p style={noMargin}>Receipt No: {sale.id}</p>
                <p style={noMargin}>Date: {formatDateTime(sale.date)}</p>
                <p style={noMargin}>Customer: {customer?.name}</p>
                <p style={{ ...noMargin, textTransform: 'capitalize' }}>
                    {t('payment_method')}: {t(sale.paymentMethod as TranslationKey)} ({sale.total - sale.paidAmount > 0.01 ? t('due') : t('paid')})
                </p>
            </section>

            <hr style={hrStyle} />

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                    <tr>
                        <th style={{ ...textLeft, paddingBottom: '5px' }}>Item</th>
                        <th style={{ ...textCenter, paddingBottom: '5px' }}>Qty</th>
                        <th style={{ ...textRight, paddingBottom: '5px' }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items.map((item) => {
                        const product = products.find(p => p.id === item.productId);
                        const lineTotal = item.priceAtSale * item.quantity;
                        const lineDiscount = item.discount || 0;
                        return (
                            <React.Fragment key={item.productId}>
                                <tr>
                                    <td style={{...textLeft, verticalAlign: 'top', paddingTop: '5px'}}>
                                        {product?.name || 'Unknown Product'}
                                        <br/>
                                        <span style={{fontSize: '10px'}}>({item.quantity} {product?.unit || ''} x {currencyFormatter.format(item.priceAtSale)})</span>
                                    </td>
                                    <td style={{ ...textCenter, verticalAlign: 'top', paddingTop: '5px' }}>{item.quantity}</td>
                                    <td style={{ ...textRight, verticalAlign: 'top', paddingTop: '5px' }}>{currencyFormatter.format(lineTotal)}</td>
                                </tr>
                                {lineDiscount > 0 && (
                                     <tr>
                                         <td colSpan={2} style={{...textLeft, paddingLeft: '10px', fontSize: '10px'}}>Discount</td>
                                         <td style={{...textRight, fontSize: '10px'}}>-{currencyFormatter.format(lineDiscount)}</td>
                                     </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
            
            <hr style={hrStyle} />

            {/* Totals */}
            <table style={{ width: '100%', fontSize: '12px' }}>
                <tbody>
                    <tr>
                        <td style={textLeft}>Subtotal:</td>
                        <td style={textRight}>{currencyFormatter.format(sale.subtotal)}</td>
                    </tr>
                    {totalItemDiscount > 0 && (
                        <tr>
                            <td style={textLeft}>Item Discounts:</td>
                            <td style={textRight}>- {currencyFormatter.format(totalItemDiscount)}</td>
                        </tr>
                    )}
                    {sale.vatPercentage > 0 && (
                        <tr>
                            <td style={textLeft}>VAT ({sale.vatPercentage}%):</td>
                            <td style={textRight}>{currencyFormatter.format(vatAmount)}</td>
                        </tr>
                    )}
                    {sale.discountAmount > 0 && (
                        <tr>
                            <td style={textLeft}>Invoice Discount:</td>
                            <td style={textRight}>- {currencyFormatter.format(sale.discountAmount)}</td>
                        </tr>
                    )}
                </tbody>
                <tfoot>
                    <tr style={{...bold, fontSize: '16px', borderTop: '1px dashed black', paddingTop: '5px'}}>
                        <td style={{ ...textLeft, paddingTop: '5px' }}>Grand Total:</td>
                        <td style={{ ...textRight, paddingTop: '5px' }}>{currencyFormatter.format(sale.total)}</td>
                    </tr>
                    {sale.paidAmount < sale.total && (
                        <>
                            <tr style={{...bold, fontSize: '14px'}}>
                                <td style={{ ...textLeft, paddingTop: '5px' }}>{t('amount_paid')}:</td>
                                <td style={{ ...textRight, paddingTop: '5px' }}>{currencyFormatter.format(sale.paidAmount)}</td>
                            </tr>
                            <tr style={{...bold, fontSize: '14px'}}>
                                <td style={{ ...textLeft, paddingTop: '5px' }}>{t('due')}:</td>
                                <td style={{ ...textRight, paddingTop: '5px' }}>{currencyFormatter.format(sale.total - sale.paidAmount)}</td>
                            </tr>
                        </>
                    )}
                </tfoot>
            </table>

            <hr style={hrStyle} />
            
            {/* Footer */}
            <footer style={{...textCenter, fontSize: '11px'}}>
                <p style={noMargin}>{settings.invoiceNotes}</p>
                 <p style={{...noMargin, marginTop: '5px'}}>{settings.footerText}</p>
                 <div style={{ marginTop: '15px' }}>
                    <canvas ref={qrRef} style={{ margin: '0 auto' }}></canvas>
                </div>
            </footer>
        </div>
    );
};