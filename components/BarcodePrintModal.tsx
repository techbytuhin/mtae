import React, { useEffect, useRef, useContext, useState } from 'react';
import ReactDOM from 'react-dom';
import { Product } from '../types';
import { AppContext } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import { XMarkIcon, PrinterIcon } from '@heroicons/react/24/outline';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

type ContentType = 'barcode' | 'qrcode' | 'both';

interface BarcodeLabelProps {
    product: Product;
    currencyFormatter: Intl.NumberFormat;
    contentType: ContentType;
}

const BarcodeLabel: React.FC<BarcodeLabelProps> = ({ product, currencyFormatter, contentType }) => {
    const barcodeRef = useRef<SVGSVGElement>(null);
    const qrRef = useRef<HTMLCanvasElement>(null);
    const { state } = useContext(AppContext);

    useEffect(() => {
        if (product && barcodeRef.current && (contentType === 'barcode' || contentType === 'both')) {
            try {
                JsBarcode(barcodeRef.current, product.id, {
                    format: 'CODE128',
                    displayValue: false,
                    margin: 0,
                    height: 40,
                    width: 1.5,
                });
            } catch (e) {
                console.error("Failed to generate barcode:", e);
            }
        }
        if (product && qrRef.current && (contentType === 'qrcode' || contentType === 'both')) {
            try {
                QRCode.toCanvas(qrRef.current, product.id, {
                    width: 60,
                    margin: 1,
                    errorCorrectionLevel: 'H'
                });
            } catch (e) {
                console.error("Failed to generate QR code:", e);
            }
        }
    }, [product, contentType]);

    return (
        <div className="barcode-label">
            <div className="product-info">
                <p className="shop-name">{state.settings.shopName}</p>
                <p className="product-name">{product.name}</p>
                <p className="price">{currencyFormatter.format(product.price)}</p>
            </div>
            <div className="codes-container">
                 {(contentType === 'barcode' || contentType === 'both') && (
                    <div className="flex flex-col items-center">
                        <svg ref={barcodeRef}></svg>
                        <span className="text-xs mt-1">{product.id}</span>
                    </div>
                )}
                {(contentType === 'qrcode' || contentType === 'both') && (
                    <canvas ref={qrRef}></canvas>
                )}
            </div>
        </div>
    );
};


interface BarcodePrintModalProps {
    product: Product;
    onClose: () => void;
}

export const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({ product, onClose }) => {
    const { t, lang, currency } = useTranslation();
    const portalRoot = document.getElementById('portal-root');

    const [labelWidth, setLabelWidth] = useState<number>(90);
    const [labelHeight, setLabelHeight] = useState<number>(30);
    const [contentType, setContentType] = useState<ContentType>('both');
    const printStyleRef = useRef<HTMLStyleElement | null>(null);

    const currencyFormatter = new Intl.NumberFormat(lang, {
        style: 'currency',
        currency: currency,
    });

    const handlePrint = () => {
        // Create or update the style element
        if (!printStyleRef.current) {
            const style = document.createElement('style');
            style.id = 'dynamic-print-style';
            document.head.appendChild(style);
            printStyleRef.current = style;
        }
        printStyleRef.current.innerHTML = `
            @page {
                size: ${labelWidth}mm ${labelHeight}mm;
                margin: 2mm;
            }
        `;
        window.print();
    };

    useEffect(() => {
        // Cleanup function to remove the style element
        return () => {
            if (printStyleRef.current) {
                printStyleRef.current.remove();
            }
        };
    }, []);

    if (!portalRoot) return null;

    const modalContent = (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-start sm:items-center z-50 p-4 overflow-y-auto no-print-section">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{t('barcode_qr_code')}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>
                <div className="overflow-y-auto bg-gray-200 dark:bg-gray-900 flex-grow flex items-center justify-center p-4">
                     <div 
                        className="shadow-lg"
                        style={{ width: `${labelWidth}mm`, height: `${labelHeight}mm`, overflow: 'hidden' }}
                    >
                        <BarcodeLabel product={product} currencyFormatter={currencyFormatter} contentType={contentType} />
                    </div>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-700 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-end gap-4 flex-wrap">
                        <div>
                            <label htmlFor="label-width" className="block text-sm font-medium dark:text-gray-300">Width (mm)</label>
                            <input
                                id="label-width"
                                type="number"
                                value={labelWidth}
                                onChange={(e) => setLabelWidth(Math.max(10, parseInt(e.target.value, 10) || 10))}
                                className="w-24 p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="label-height" className="block text-sm font-medium dark:text-gray-300">Height (mm)</label>
                            <input
                                id="label-height"
                                type="number"
                                value={labelHeight}
                                onChange={(e) => setLabelHeight(Math.max(10, parseInt(e.target.value, 10) || 10))}
                                className="w-24 p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium dark:text-gray-300">Content</label>
                            <div className="flex items-center rounded-md bg-gray-200 dark:bg-gray-700 p-1 mt-1">
                                {(['both', 'barcode', 'qrcode'] as const).map(type => (
                                    <button key={type} onClick={() => setContentType(type)} className={`px-3 py-1 text-sm rounded-md capitalize ${contentType === type ? 'bg-white dark:bg-gray-600 shadow' : ''}`}>
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex space-x-3">
                        <button onClick={onClose} type="button" className="py-2 px-4 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors">
                            {t('close')}
                        </button>
                        <button onClick={handlePrint} type="button" className="py-2 px-4 rounded-lg bg-primary-600 text-white hover:bg-primary-700 flex items-center transition-colors">
                            <PrinterIcon className="h-5 w-5 mr-2" />
                            {t('print_barcode')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
    
    // This is a hidden element purely for printing
    const printContent = (
         <div id="print-area" className="hidden print:block print-modal-content">
            <BarcodeLabel product={product} currencyFormatter={currencyFormatter} contentType={contentType} />
        </div>
    );

    return ReactDOM.createPortal(
        <>
            {modalContent}
            {printContent}
        </>
    , portalRoot);
};