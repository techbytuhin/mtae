import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { DueCollection, User } from '../types';
import { XMarkIcon, PrinterIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../hooks/useTranslation';
import { PrintableDueReceipt } from './PrintableDueReceipt';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface DueReceiptPrintModalProps {
    collection: DueCollection;
    previousDue: number;
    user: User;
    onClose: () => void;
}

export const DueReceiptPrintModal: React.FC<DueReceiptPrintModalProps> = ({ collection, previousDue, user, onClose }) => {
    const { t } = useTranslation();
    
    const portalRoot = document.getElementById('portal-root');
    if (!portalRoot) return null;

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPdf = () => {
        const input = document.getElementById(`pdf-area-${collection.id}`);
        if (input) {
            html2canvas(input, { scale: 2, useCORS: true })
                .then((canvas) => {
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const canvasWidth = canvas.width;
                    const canvasHeight = canvas.height;
                    const ratio = pdfWidth / canvasWidth;
                    const pdfHeight = canvasHeight * ratio;
                    
                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                    pdf.save(`due-receipt-${collection.id}.pdf`);
                });
        }
    };

    const modalContent = (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-start sm:items-center z-50 p-4 overflow-y-auto no-print-section">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-xl max-h-full flex flex-col">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{t('due_collection_receipt')}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>
                <div className="overflow-y-auto bg-gray-200 dark:bg-gray-900 flex-grow flex justify-center py-6">
                    <div className="shadow-lg w-[210mm] h-[297mm] overflow-auto">
                         <div className="bg-white text-black">
                            <PrintableDueReceipt collection={collection} previousDue={previousDue} user={user} />
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-700 flex justify-end space-x-3">
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
    
    const printAndPdfContent = (
         <>
            <div className="hidden print:block print-modal-content">
                <PrintableDueReceipt collection={collection} previousDue={previousDue} user={user}/>
            </div>
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <div id={`pdf-area-${collection.id}`} style={{ width: '210mm', background: 'white' }}>
                    <PrintableDueReceipt collection={collection} previousDue={previousDue} user={user}/>
                </div>
            </div>
        </>
    );

    return ReactDOM.createPortal(
      <>
        {modalContent}
        {printAndPdfContent}
      </>
    , portalRoot);
};