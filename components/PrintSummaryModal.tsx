import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { XMarkIcon, PrinterIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../hooks/useTranslation';
import { PdfColumn, exportReportToPdf } from '../services/exportService';

interface PrintSummaryModalProps {
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    pdfData: {
        shopInfo: { name: string; address: string; phone: string; };
        summaryData: { title: string; value: string | number }[];
        tableColumns: PdfColumn[];
        tableData: any[];
    };
}

export const PrintSummaryModal: React.FC<PrintSummaryModalProps> = ({ onClose, title, children, pdfData }) => {
    const { t, lang, formatDateTime } = useTranslation();
    const portalRoot = document.getElementById('portal-root');
    if (!portalRoot) return null;

    const handlePrint = () => {
        document.body.classList.add('print-format-a4');
        window.print();
    };

    const handleDownloadPdf = () => {
        const date = new Date().toISOString().split('T')[0];
        const filename = `${title.replace(/\s/g, '_')}-summary-${date}.pdf`;
        exportReportToPdf(
            title,
            pdfData.summaryData,
            pdfData.tableColumns,
            pdfData.tableData,
            filename,
            pdfData.shopInfo
        );
    };

    useEffect(() => {
        const afterPrint = () => {
            document.body.classList.remove('print-format-a4');
        };
        window.addEventListener('afterprint', afterPrint);
        return () => {
            window.removeEventListener('afterprint', afterPrint);
        };
    }, []);

    const modalContent = (
         <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-start sm:items-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-full flex flex-col">
                
                {/* Content wrapper for both screen and print */}
                <div className="flex-grow overflow-y-auto">
                    <div id="print-area" className="bg-white text-black font-sans">
                        <div className="p-6">
                            <h1 className="text-2xl font-bold mb-4 print:text-black">{title}</h1>
                            <p className="text-sm mb-6 print:text-gray-600">Generated on: {formatDateTime(new Date())}</p>
                            {children}
                        </div>
                    </div>
                </div>

                {/* Modal UI (hidden on print) */}
                <div className="print:hidden p-4 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-700 flex justify-between items-center sticky bottom-0">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <div className="flex space-x-3">
                        <button onClick={onClose} type="button" className="py-2 px-4 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors">
                            {t('close')}
                        </button>
                        <button onClick={handleDownloadPdf} type="button" className="py-2 px-4 rounded-lg bg-green-600 text-white hover:bg-green-700 flex items-center transition-colors">
                            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                            {t('download_pdf')}
                        </button>
                        <button onClick={handlePrint} type="button" className="py-2 px-4 rounded-lg bg-primary-600 text-white hover:bg-primary-700 flex items-center transition-colors">
                            <PrinterIcon className="h-5 w-5 mr-2" />
                            {t('print_summary')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
    
    return ReactDOM.createPortal(modalContent, portalRoot);
}