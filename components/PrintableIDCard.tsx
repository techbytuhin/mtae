import React, { useContext, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { User } from '../types';
import { useTranslation, TranslationKey, handleImageError } from '../hooks/useTranslation';
import QRCode from 'qrcode';

interface PrintableIDCardProps {
    user: User;
}

const cardStyles: React.CSSProperties = {
    width: '3.375in', // 85.6mm
    height: '2.125in', // 53.98mm
    fontFamily: 'sans-serif',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    backgroundColor: 'white',
    color: '#1f2937',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    overflow: 'hidden',
    boxSizing: 'border-box'
};


export const PrintableIDCardFront: React.FC<PrintableIDCardProps> = ({ user }) => {
    const { state } = useContext(AppContext);
    const { settings } = state;
    const { t } = useTranslation();
    const accentColor = settings.invoiceAccentColor || '#4f46e5';

    return (
        <div style={cardStyles}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '10px', backgroundColor: accentColor, color: 'white', flexShrink: 0 }}>
                <img src={settings.shopLogo} alt="Logo" style={{ height: '30px', width: '30px', borderRadius: '50%', marginRight: '8px', border: '1px solid white', objectFit: 'cover' }} onError={handleImageError} />
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{settings.shopName}</span>
            </div>
            
            {/* Body */}
            <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, padding: '10px', justifyContent: 'center' }}>
                {/* Top part: Photo and Details */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {/* Photo */}
                    <div style={{ flexShrink: 0 }}>
                        <img src={user.iconUrl} alt={user.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #e5e7eb' }} onError={handleImageError} />
                    </div>
                    
                    {/* Details */}
                    <div style={{ flexGrow: 1 }}>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', lineHeight: '1.2' }}>{user.name}</h3>
                        <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280', textTransform: 'capitalize' }}>{t(user.role as TranslationKey)}</p>
                        <div style={{ marginTop: '10px', borderTop: '1px solid #f3f4f6', paddingTop: '10px' }}>
                            <p style={{ margin: '0', fontSize: '10px' }}>
                                <strong style={{ color: '#1f2937', fontSize: '9px' }}>{t('id_number')}: </strong>{user.id}
                            </p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '10px' }}>
                                <strong style={{ color: '#1f2937', fontSize: '9px' }}>{t('phone')}: </strong>{user.phone}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const PrintableIDCardBack: React.FC<PrintableIDCardProps> = ({ user }) => {
    const { state } = useContext(AppContext);
    const { settings } = state;
    const { t, formatDate } = useTranslation();
    const qrRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (qrRef.current && user.id) {
            QRCode.toCanvas(qrRef.current, user.id, {
                width: 60,
                margin: 1,
                errorCorrectionLevel: 'H'
            }, (error) => {
                if (error) console.error("QR Code generation failed:", error);
            });
        }
    }, [user.id]);
    
    const issueDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 3);

    return (
        <div style={cardStyles}>
            {/* Magnetic Stripe */}
            <div style={{ height: '30px', backgroundColor: '#374151', width: '100%', flexShrink: 0 }}></div>
            
            <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, padding: '12px', justifyContent: 'space-between' }}>
                {/* Details Section */}
                <div style={{ fontSize: '10px' }}>
                    <p style={{ margin: 0 }}><strong>{t('issue_date')}:</strong> {formatDate(issueDate)}</p>
                    <p style={{ margin: '2px 0 0 0' }}><strong>{t('expiry_date_card')}:</strong> {formatDate(expiryDate)}</p>
                    <div style={{ marginTop: '10px' }}>
                         <p style={{ margin: '5px 0 0 0', fontStyle: 'italic', color: '#6b7280' }}>
                           {t('if_found_return_to')}
                        </p>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>{settings.shopName}</p>
                        <p style={{ margin: 0, fontSize: '9px' }}>{settings.shopAddress}</p>
                    </div>
                </div>
                
                {/* Signature and QR Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    {/* Signature Section */}
                    <div style={{ textAlign: 'center', width: '60%' }}>
                        <div style={{ width: '100%', height: '35px', backgroundColor: '#e5e7eb', marginBottom: '2px', borderRadius: '4px' }}></div>
                        <span style={{ fontSize: '10px', color: '#6b7280', borderTop: '1px solid #9ca3af', paddingTop: '2px', display: 'block', marginTop: '2px' }}>{t('signature')}</span>
                    </div>

                    {/* QR Code Section */}
                    <div style={{ textAlign: 'center' }}>
                         <canvas ref={qrRef} />
                    </div>
                </div>
            </div>
        </div>
    );
};