import React from 'react';
import ReactDOM from 'react-dom';
import { XMarkIcon, PrinterIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../hooks/useTranslation';
import { PrintableCashMemo } from './PrintableCashMemo';
import { Sale } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface BulkPrintModalProps {
    sales: Sale[];
    onClose: () => void;
    title: string;
}

export const BulkPrintModal: React.FC<BulkPrintModalProps> = ({ sales, onClose, title }) => {
    const { t } = useTranslation();
    const portalRoot = document.getElementById('portal-root');
    if (!portalRoot) return null;

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPdf = async () => {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        
        for (let i = 0; i < sales.length; i++) {
            const saleId = sales[i].id;
            const input = document.getElementById(`invoice-for-bulk-${saleId}`);
            if (input) {
                const canvas = await html2canvas(input, { scale: 2, useCORS: true });
                const imgData = canvas.toDataURL('image/png');
                
                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                const ratio = pdfWidth / canvasWidth;
                const pdfHeight = canvasHeight * ratio;

                if (i > 0) {
                    pdf.addPage();
                }
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            }
        }
        
        pdf.save(`bulk-invoices-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const modalContent = (
         <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-start sm:items-center z-50 p-4 overflow-y-auto no-print-section">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-full flex flex-col">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{title} ({sales.length})</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>
                {/* On-screen preview */}
                <div className="overflow-y-auto bg-gray-200 dark:bg-gray-900 p-4 space-y-4">
                    {sales.length > 0 ? sales.map(sale => (
                        <div key={sale.id} className="shadow-lg">
                            <div id={`invoice-for-bulk-${sale.id}`}>
                                <PrintableCashMemo sale={sale} />
                            </div>
                        </div>
                    )) : (
                        <p className="text-center py-10 text-gray-500">{t('no_sales_records')}</p>
                    )}
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-700 flex justify-end space-x-3">
                     <button onClick={onClose} type="button" className="py-2 px-4 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors">
                        {t('close')}
                    </button>
                    <button onClick={handleDownloadPdf} type="button" className="py-2 px-4 rounded-lg bg-green-600 text-white hover:bg-green-700 flex items-center transition-colors" disabled={sales.length === 0}>
                        <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                        {t('download_pdf')}
                    </button>
                     <button onClick={handlePrint} type="button" className="py-2 px-4 rounded-lg bg-primary-600 text-white hover:bg-primary-700 flex items-center transition-colors" disabled={sales.length === 0}>
                        <PrinterIcon className="h-5 w-5 mr-2" />
                        {t('print')}
                    </button>
                </div>
            </div>
        </div>
    );
    
     const printContent = (
        <div className="hidden print:block print-modal-content">
            {sales.map(sale => (
                <div key={sale.id} className="invoice-page">
                    <PrintableCashMemo sale={sale} />
                </div>
             ))}
        </div>
    );

    return ReactDOM.createPortal(
        <>
            {modalContent}
            {printContent}
        </>,
        portalRoot
    );
};