import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { DueCollection, User } from '../types';
import { useTranslation, TranslationKey } from '../hooks/useTranslation';

interface PrintableDueReceiptProps {
    collection: DueCollection;
    previousDue: number;
    user: User;
}

export const PrintableDueReceipt: React.FC<PrintableDueReceiptProps> = ({ collection, previousDue, user }) => {
    const { state } = useContext(AppContext);
    const { t, lang, formatDateTime, currency } = useTranslation();
    const { settings, customers } = state;
    const customer = customers.find(c => c.id === collection.customerId);
    
    const currencyFormatter = new Intl.NumberFormat(lang, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const remainingDue = previousDue - collection.amount;
    const receivedByName = (user.role === 'super_user' && user.id !== state.currentUser?.id) ? 'Admin' : user.name;

    return (
        <div style={{ background: 'white', color: 'black', padding: '20px', fontFamily: 'Arial, sans-serif', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid black', paddingBottom: '10px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                    {settings.shopLogo && <img src={settings.shopLogo} alt="Shop Logo" style={{ height: '60px', width: 'auto', marginBottom: '10px' }}/>}
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{settings.shopName}</h2>
                    <p style={{ margin: '2px 0', fontSize: '11px' }}>{settings.shopAddress}</p>
                    <p style={{ margin: '2px 0', fontSize: '11px' }}>{t('phone')}: {settings.shopPhone}</p>
                </div>
                <div style={{ textAlign: 'right', flex: 1 }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase', color: '#333', margin: 0 }}>{t('due_collection_receipt')}</h1>
                    <p style={{ margin: '5px 0' }}><strong>Receipt ID:</strong> {collection.id}</p>
                    <p style={{ margin: '5px 0' }}><strong>{t('date')}:</strong> {formatDateTime(collection.date)}</p>
                </div>
            </div>

            {/* Paid By */}
            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>Paid By:</h3>
                <p style={{ margin: '2px 0', fontWeight: 'bold' }}>{customer?.name || 'N/A'}</p>
                {customer?.phone && customer.phone !== 'N/A' && <p style={{ margin: '2px 0' }}>{t('phone')}: {customer.phone}</p>}
            </div>

            {/* Due Summary Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead style={{ backgroundColor: '#f2f2f2' }}>
                    <tr>
                        <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Description</th>
                        <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{t('amount')}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{t('previous_due')}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{currencyFormatter.format(previousDue)}</td>
                    </tr>
                    <tr style={{color: 'green', fontWeight: 'bold'}}>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{t('amount_paid')}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{currencyFormatter.format(collection.amount)}</td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr style={{ fontWeight: 'bold', fontSize: '16px', backgroundColor: '#f2f2f2', borderTop: '2px solid black' }}>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{t('remaining_due')}</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>{currencyFormatter.format(remainingDue)}</td>
                    </tr>
                </tfoot>
            </table>

            {/* Payment Info & Footer */}
            <div style={{ marginTop: '20px' }}>
                <p><strong>{t('payment_method')}:</strong> {t(collection.paymentMethod as TranslationKey)}</p>
                <p><strong>{t('payment_received_by')}:</strong> {receivedByName}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '60px', paddingTop: '10px' }}>
                <div>
                    <p style={{ borderTop: '1px solid #555', paddingTop: '5px' }}>Customer Signature</p>
                </div>
                <div>
                    <p style={{ borderTop: '1px solid #555', paddingTop: '5px' }}>Authorized Signature</p>
                </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '10px', color: '#777' }}>
                <p>{settings.footerText}</p>
            </div>
        </div>
    );
};