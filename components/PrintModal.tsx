import React, { useEffect, useState, useContext } from 'react';
import ReactDOM from 'react-dom';
import { Sale } from '../types';
import { AppContext } from '../context/AppContext';
import { XMarkIcon, PrinterIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../hooks/useTranslation';
import { PrintableCashMemo } from './PrintableCashMemo';
import { PrintableReceipt } from './PrintableReceipt';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PrintModalProps {
    sale: Sale;
    onClose: () => void;
    title?: string;
}

export const PrintModal: React.FC<PrintModalProps> = ({ sale, onClose, title }) => {
    const { t } = useTranslation();
    const { state } = useContext(AppContext);
    const { settings } = state;
    const [activeView, setActiveView] = useState<'invoice' | 'receipt'>(settings.defaultPrintFormat || 'invoice');
    
    const portalRoot = document.getElementById('portal-root');
    if (!portalRoot) return null;
    
    useEffect(() => {
        const printAreaWrapper = document.getElementById('print-area-wrapper');
        if (printAreaWrapper) {
            if (activeView === 'receipt') {
                printAreaWrapper.classList.add('print-format-receipt');
            } else {
                printAreaWrapper.classList.remove('print-format-receipt');
            }
        }
    }, [activeView]);

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPdf = () => {
        const input = document.getElementById(`pdf-area-content`);
        if (input) {
            html2canvas(input, { scale: 2, useCORS: true })
                .then((canvas) => {
                    const imgData = canvas.toDataURL('image/png');
                    const isReceipt = activeView === 'receipt';
                    
                    const pdfWidth = isReceipt ? 80 : 210; // 80mm for receipt, 210mm for A4
                    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

                    const pdf = new jsPDF({
                        orientation: 'p',
                        unit: 'mm',
                        format: isReceipt ? [pdfWidth, pdfHeight] : 'a4'
                    });
                    
                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                    pdf.save(`${activeView}-${sale.id}.pdf`);
                });
        }
    };
    
    const ViewToggle = () => (
        <div className="inline-flex rounded-md shadow-sm bg-gray-200 dark:bg-gray-700 p-1">
            <button
                onClick={() => setActiveView('invoice')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeView === 'invoice' ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-white/50'}`}
            >
                {t('invoice')}
            </button>
            <button
                onClick={() => setActiveView('receipt')}
                 className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeView === 'receipt' ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-white/50'}`}
            >
                {t('receipt')}
            </button>
        </div>
    );
    
    const modalTitle = title || (activeView === 'invoice' ? t('invoice') : t('receipt'));

    const modalContent = (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 no-print-section">
            <div className="bg-gray-100 dark:bg-gray-900 w-full h-full flex flex-col">
                {/* Header */}
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 flex-shrink-0">
                    <h3 className="text-lg font-semibold">{modalTitle}</h3>
                    <div className="flex items-center space-x-4">
                        <ViewToggle />
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
                
                {/* Content */}
                <div className="overflow-y-auto flex-grow flex justify-center py-8">
                    <div className={`shadow-lg ${activeView === 'invoice' ? 'w-[210mm]' : 'w-[80mm]'}`}>
                         <div id="pdf-area-content" className="bg-white text-black">
                            {activeView === 'invoice' ? (
                                <PrintableCashMemo sale={sale} />
                            ) : (
                                <PrintableReceipt sale={sale} />
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Footer */}
                <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex justify-end space-x-3 flex-shrink-0">
                    <button onClick={onClose} type="button" className="py-2 px-4 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors">
                        {t('close')}
                    </button>
                    <button onClick={handleDownloadPdf} type="button" className="py-2 px-4 rounded-lg bg-green-600 text-white hover:bg-green-700 flex items-center transition-colors">
                        <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                        {t('download_pdf')}
                    </button>
                    <button onClick={handlePrint} type="button" className="py-2 px-4 rounded-lg bg-primary-600 text-white hover:bg-primary-700 flex items-center transition-colors">
                        <PrinterIcon className="h-5 w-5 mr-2" />
                        {t('print_memo')}
                    </button>
                </div>
            </div>
        </div>
    );
    
    // This is a hidden element purely for printing
    const printContent = (
        <div id="print-area-wrapper" className="hidden print:block print-modal-content">
             {activeView === 'invoice' ? (
                <PrintableCashMemo sale={sale} />
            ) : (
                <PrintableReceipt sale={sale} />
            )}
        </div>
    );

    return ReactDOM.createPortal(
      <>
        {modalContent}
        {printContent}
      </>
    , portalRoot);
};