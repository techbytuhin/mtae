import React, { useContext, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { Sale } from '../types';
import { useTranslation, handleImageError, TranslationKey } from '../hooks/useTranslation';
import QRCode from 'qrcode';

const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertLt1000 = (n: number): string => {
        let result = '';
        if (n >= 100) {
            result += ones[Math.floor(n / 100)] + ' Hundred';
            n %= 100;
        }
        if (n > 0) {
            if (result) result += ' ';
            if (n < 10) {
                result += ones[n];
            } else if (n < 20) {
                result += teens[n - 10];
            } else {
                result += tens[Math.floor(n / 10)];
                if (n % 10 > 0) {
                    result += ' ' + ones[n % 10];
                }
            }
        }
        return result;
    };

    if (num === 0) return 'Zero';

    const crore = Math.floor(num / 10000000);
    num %= 10000000;
    const lakh = Math.floor(num / 100000);
    num %= 100000;
    const thousand = Math.floor(num / 1000);
    num %= 1000;
    const remainder = num;

    let result = '';
    if (crore > 0) result += convertLt1000(crore) + ' Crore ';
    if (lakh > 0) result += convertLt1000(lakh) + ' Lakh ';
    if (thousand > 0) result += convertLt1000(thousand) + ' Thousand ';
    if (remainder > 0) result += convertLt1000(remainder);

    return result.trim();
};

export const PrintableCashMemo: React.FC<{ sale: Sale }> = ({ sale }) => {
    const { state } = useContext(AppContext);
    const { t, lang, formatDate, currency } = useTranslation();
    const { settings, products, customers, currentUser, users } = state;
    const customer = customers.find(c => c.id === sale.customerId);
    const orderedByUser = users.find(u => u.id === sale.soldByUserId);
    const soldByName = (orderedByUser?.role === 'super_user' && orderedByUser.id !== currentUser?.id) ? 'Admin' : (orderedByUser?.name || 'N/A');
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

    const currencyFormatter = (value: number) => {
        return new Intl.NumberFormat(lang, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    }
    
    const totalItemDiscount = sale.items.reduce((sum, item) => sum + (item.discount || 0), 0);
    const netSubtotal = sale.subtotal - totalItemDiscount;
    const vatAmount = netSubtotal * (sale.vatPercentage / 100);
    const dueDate = new Date(sale.date);
    if(settings.invoiceDueDateDays){
        dueDate.setDate(dueDate.getDate() + settings.invoiceDueDateDays);
    }

    const accentColor = settings.invoiceAccentColor || '#4f46e5';

    const styles: { [key: string]: React.CSSProperties } = {
        page: {
            background: 'white', color: '#333', padding: '40px', fontFamily: 'Arial, sans-serif', fontSize: '12px',
            width: '210mm', minHeight: '297mm', boxSizing: 'border-box'
        },
        header: {
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '20px',
            borderBottom: `2px solid ${accentColor}`
        },
        shopDetails: { textAlign: 'right' },
        shopName: { fontSize: '28px', fontWeight: 'bold', margin: '0', color: accentColor },
        shopAddress: { margin: '5px 0 0 0' },
        invoiceMeta: {
            display: 'flex', justifyContent: 'space-between', marginTop: '30px', marginBottom: '30px'
        },
        billTo: { maxWidth: '50%' },
        metaDetails: { textAlign: 'right' },
        invoiceTitle: { fontSize: '36px', fontWeight: 'bold', margin: '0 0 10px 0', color: accentColor },
        metaTable: { borderCollapse: 'collapse', width: '100%' },
        metaTableTd: { padding: '2px 8px', fontSize: '12px' },
        itemsTable: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
        th: { padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd', color: 'white', backgroundColor: accentColor },
        td: { padding: '10px', borderBottom: '1px solid #eee' },
        rowEven: { backgroundColor: '#f9f9f9' },
        rowOdd: { backgroundColor: '#fff' },
        productInfo: { fontWeight: 'bold' },
        productSubInfo: { fontSize: '10px', color: '#666', paddingLeft: '10px' },
        summarySection: { display: 'flex', justifyContent: 'space-between', marginTop: '20px', alignItems: 'flex-start' },
        notes: { width: '50%', fontSize: '11px', color: '#555' },
        totals: { width: '40%' },
        totalsTable: { width: '100%', borderCollapse: 'collapse' },
        totalsTd: { padding: '8px', borderBottom: '1px solid #eee' },
        grandTotalRow: { fontWeight: 'bold', fontSize: '16px', color: accentColor, borderTop: `2px solid ${accentColor}` },
        inWords: { marginTop: '20px', padding: '10px', backgroundColor: '#f2f2f2', fontWeight: 'bold', borderRadius: '5px' },
        signatures: { display: 'flex', justifyContent: 'space-between', marginTop: '80px' },
        signatureBox: { borderTop: '1px solid #555', paddingTop: '8px', width: '200px', textAlign: 'center', fontSize: '12px' },
        pageFooter: { position: 'absolute', bottom: '20px', left: '40px', right: '40px', textAlign: 'center', fontSize: '10px', color: '#999', borderTop: '1px solid #eee', paddingTop: '10px' }
    };

    return (
        <div style={styles.page}>
            <header style={styles.header}>
                <img src={settings.shopLogo} alt="Shop Logo" style={{ height: '70px', width: 'auto' }} onError={handleImageError}/>
                <div style={styles.shopDetails}>
                    <h1 style={styles.shopName}>{settings.shopName}</h1>
                    <p style={styles.shopAddress}>{settings.shopAddress}</p>
                    <p style={styles.shopAddress}>{settings.shopPhone}</p>
                </div>
            </header>

            <section style={styles.invoiceMeta}>
                <div style={styles.billTo}>
                    <h3 style={{ margin: '0 0 5px 0', color: '#555' }}>{t('bill_to')}</h3>
                    <p style={{ fontWeight: 'bold', margin: 0 }}>{customer?.name || 'N/A'}</p>
                    {customer?.address && customer.address !== 'N/A' && <p style={{ margin: '2px 0' }}>{customer.address}</p>}
                    {customer?.phone && customer.phone !== 'N/A' && <p style={{ margin: '2px 0' }}>{customer.phone}</p>}
                </div>
                <div style={styles.metaDetails}>
                    <h2 style={styles.invoiceTitle}>{(settings.invoiceTitle || t('invoice')).toUpperCase()}</h2>
                    <table style={styles.metaTable}>
                        <tbody>
                            <tr>
                                <td style={{ ...styles.metaTableTd, textAlign: 'right' }}>{t('invoice_id')}:</td>
                                <td style={{ ...styles.metaTableTd, fontWeight: 'bold' }}>{sale.id}</td>
                            </tr>
                            <tr>
                                <td style={{ ...styles.metaTableTd, textAlign: 'right' }}>{t('date')}:</td>
                                <td style={{ ...styles.metaTableTd }}>{formatDate(sale.date)}</td>
                            </tr>
                            {settings.invoiceDueDateDays && sale.paymentMethod === 'due' && (
                                <tr>
                                    <td style={{ ...styles.metaTableTd, textAlign: 'right' }}>{t('invoice_due_date')}:</td>
                                    <td style={{ ...styles.metaTableTd }}>{formatDate(dueDate)}</td>
                                </tr>
                            )}
                            <tr>
                                <td style={{ ...styles.metaTableTd, textAlign: 'right' }}>{t('ordered_by')}:</td>
                                <td style={{ ...styles.metaTableTd }}>{soldByName}</td>
                            </tr>
                            <tr>
                                <td style={{ ...styles.metaTableTd, textAlign: 'right' }}>{t('payment_method')}:</td>
                                <td style={{ ...styles.metaTableTd, textTransform: 'capitalize' }}>{t(sale.paymentMethod as TranslationKey)}</td>
                            </tr>
                             <tr>
                                <td style={{ ...styles.metaTableTd, textAlign: 'right' }}>{t('status')}:</td>
                                <td style={{ ...styles.metaTableTd, fontWeight: 'bold', textTransform: 'uppercase', color: sale.total - sale.paidAmount > 0.01 ? '#ef4444' : '#22c55e' }}>
                                    {sale.total - sale.paidAmount > 0.01 ? t('due') : t('paid')}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                     <div style={{ marginTop: '15px', textAlign: 'right' }}>
                        <canvas ref={qrRef}></canvas>
                    </div>
                </div>
            </section>

            <table style={styles.itemsTable}>
                <thead>
                    <tr>
                        <th style={{...styles.th, width: '40px', textAlign: 'center'}}>#</th>
                        <th style={{...styles.th}}>{t('item_description')}</th>
                        <th style={{...styles.th, width: '60px', textAlign: 'center'}}>{t('qty')}</th>
                        <th style={{...styles.th, width: '100px', textAlign: 'right'}}>{t('unit_price')}</th>
                        <th style={{...styles.th, width: '100px', textAlign: 'right'}}>{t('discount')}</th>
                        <th style={{...styles.th, width: '120px', textAlign: 'right'}}>{t('total')}</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items.map((item, index) => {
                        const product = products.find(p => p.id === item.productId);
                        const lineTotal = item.priceAtSale * item.quantity;
                        const lineDiscount = item.discount || 0;
                        return (
                            <tr key={item.productId} style={index % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                                <td style={{...styles.td, textAlign: 'center'}}>{index + 1}</td>
                                <td style={styles.td}>
                                    <div style={styles.productInfo}>{product?.name || 'Unknown'}</div>
                                    {settings.warrantyAndGuarantyEnabled && product?.warrantyPeriod && (
                                        <div style={styles.productSubInfo}>{t('warranty')}: {product.warrantyPeriod} | SN: {product.id}</div>
                                    )}
                                </td>
                                <td style={{...styles.td, textAlign: 'center'}}>{item.quantity} {product?.unit}</td>
                                <td style={{...styles.td, textAlign: 'right'}}>{currencyFormatter(item.priceAtSale)}</td>
                                <td style={{...styles.td, textAlign: 'right'}}>{currencyFormatter(lineDiscount)}</td>
                                <td style={{...styles.td, textAlign: 'right', fontWeight: 'bold'}}>{currencyFormatter(lineTotal - lineDiscount)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <section style={styles.summarySection}>
                <div style={styles.notes}>
                     <h4 style={{ margin: '0 0 5px 0', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>{t('notes_and_terms')}</h4>
                     <p style={{ margin: '2px 0' }}>{settings.invoiceNotes}</p>
                     <p style={{ margin: '2px 0' }}>{settings.invoiceTerms}</p>
                </div>
                <div style={styles.totals}>
                    <table style={styles.totalsTable}>
                        <tbody>
                            <tr>
                                <td style={styles.totalsTd}>{t('subtotal')}</td>
                                <td style={{...styles.totalsTd, textAlign: 'right'}}>{currencyFormatter(sale.subtotal)}</td>
                            </tr>
                             <tr>
                                <td style={styles.totalsTd}>{t('item_discounts')}</td>
                                <td style={{...styles.totalsTd, textAlign: 'right'}}>- {currencyFormatter(totalItemDiscount)}</td>
                            </tr>
                            {sale.vatPercentage > 0 && (
                                <tr>
                                    <td style={styles.totalsTd}>{t('vat_tax')} ({sale.vatPercentage}%)</td>
                                    <td style={{...styles.totalsTd, textAlign: 'right'}}>{currencyFormatter(vatAmount)}</td>
                                </tr>
                            )}
                            <tr>
                                <td style={styles.totalsTd}>{t('invoice_discount')}</td>
                                <td style={{...styles.totalsTd, textAlign: 'right'}}>- {currencyFormatter(sale.discountAmount)}</td>
                            </tr>
                             <tr style={styles.grandTotalRow}>
                                <td style={{...styles.totalsTd, borderTop: `2px solid ${accentColor}`}}>{t('grand_total')} ({currency})</td>
                                <td style={{...styles.totalsTd, textAlign: 'right', borderTop: `2px solid ${accentColor}`}}>{currencyFormatter(sale.total)}</td>
                            </tr>
                            {sale.paidAmount < sale.total && (
                                <>
                                    <tr style={{borderTop: `1px solid #ddd`}}>
                                        <td style={{...styles.totalsTd, fontWeight: 'bold'}}>{t('amount_paid')}</td>
                                        <td style={{...styles.totalsTd, textAlign: 'right', fontWeight: 'bold', color: '#22c55e'}}>{currencyFormatter(sale.paidAmount)}</td>
                                    </tr>
                                    <tr>
                                        <td style={{...styles.totalsTd, fontWeight: 'bold'}}>{t('due')}</td>
                                        <td style={{...styles.totalsTd, textAlign: 'right', fontWeight: 'bold', color: '#ef4444'}}>{currencyFormatter(sale.total - sale.paidAmount)}</td>
                                    </tr>
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {['BDT', 'INR'].includes(currency) && (
                <div style={styles.inWords}>
                    <strong>{t('in_words')}:</strong> {numberToWords(Math.round(sale.total))} {currency} Only.
                </div>
            )}

            <section style={styles.signatures}>
                <div style={styles.signatureBox}>{t('customer_signature')}</div>
                <div style={styles.signatureBox}>{t('approved_by')}</div>
            </section>
        </div>
    );
};