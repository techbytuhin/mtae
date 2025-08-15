import React from 'react';
import ReactDOM from 'react-dom';
import { User } from '../types';
import { PrintableIDCardFront, PrintableIDCardBack } from './PrintableIDCard';
import { XMarkIcon, PrinterIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../hooks/useTranslation';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface IDCardPrintModalProps {
    user: User;
    onClose: () => void;
}

export const IDCardPrintModal: React.FC<IDCardPrintModalProps> = ({ user, onClose }) => {
    const { t } = useTranslation();
    const portalRoot = document.getElementById('portal-root');
    if (!portalRoot) return null;

    const handlePrint = () => {
        const printStyle = document.createElement('style');
        printStyle.innerHTML = `
            @page {
                size: 85.6mm 53.98mm; /* ID Card size */
                margin: 0;
            }
            @media print {
                html, body {
                    margin: 0;
                    padding: 0;
                }
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .invoice-page {
                    page-break-after: always;
                }
                .invoice-page:last-child {
                    page-break-after: auto;
                }
            }
        `;
        document.head.appendChild(printStyle);
        window.print();
        document.head.removeChild(printStyle);
    };

    const handleDownloadPdf = async () => {
        const frontInput = document.getElementById('id-card-front-area');
        const backInput = document.getElementById('id-card-back-area');
        if (frontInput && backInput) {
            
             const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'in',
                format: [3.375, 2.125]
            });

            // Process front
            const frontCanvas = await html2canvas(frontInput, { scale: 4, useCORS: true });
            const frontImgData = frontCanvas.toDataURL('image/png');
            pdf.addImage(frontImgData, 'PNG', 0, 0, 3.375, 2.125);

            // Process back
            pdf.addPage();
            const backCanvas = await html2canvas(backInput, { scale: 4, useCORS: true });
            const backImgData = backCanvas.toDataURL('image/png');
            pdf.addImage(backImgData, 'PNG', 0, 0, 3.375, 2.125);
            
            pdf.save(`${user.name}-id-card.pdf`);
        }
    };

    const modalContent = (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 no-print-section">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl flex flex-col">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{t('id_card')} - {user.name}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>
                <div className="p-8 bg-gray-200 dark:bg-gray-900 flex flex-col md:flex-row justify-center items-center gap-8">
                    <div id="id-card-front-area">
                        <PrintableIDCardFront user={user} />
                    </div>
                     <div id="id-card-back-area">
                        <PrintableIDCardBack user={user} />
                    </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-700 flex justify-end space-x-3">
                    <button onClick={onClose} type="button" className="py-2 px-4 rounded-lg bg-gray-500 text-white hover:bg-gray-600">{t('close')}</button>
                    <button onClick={handleDownloadPdf} type="button" className="py-2 px-4 rounded-lg bg-green-600 text-white hover:bg-green-700 flex items-center">
                        <DocumentArrowDownIcon className="h-5 w-5 mr-2" /> {t('download_pdf')}
                    </button>
                    <button onClick={handlePrint} type="button" className="py-2 px-4 rounded-lg bg-primary-600 text-white hover:bg-primary-700 flex items-center">
                        <PrinterIcon className="h-5 w-5 mr-2" /> {t('print')}
                    </button>
                </div>
            </div>
        </div>
    );
    
    // Hidden element purely for printing
    const printContent = (
        <div className="hidden print:block">
            <div className="invoice-page">
                <PrintableIDCardFront user={user} />
            </div>
             <div className="invoice-page">
                <PrintableIDCardBack user={user} />
            </div>
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