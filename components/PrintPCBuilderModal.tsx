import React from 'react';
import ReactDOM from 'react-dom';
import { XMarkIcon, PrinterIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../hooks/useTranslation';
import { PrintablePCBuilder, SelectedComponent } from './PrintablePCBuilder';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PrintPCBuilderModalProps {
  selectedComponents: SelectedComponent[];
  total: number;
  onClose: () => void;
}

export const PrintPCBuilderModal: React.FC<PrintPCBuilderModalProps> = ({ selectedComponents, total, onClose }) => {
  const { t } = useTranslation();
  const portalRoot = document.getElementById('portal-root');
  if (!portalRoot) return null;

  const handlePrint = () => {
    const printFrame = document.getElementById('print-frame-pc-builder');
    if (printFrame) {
      const newWindow = window.open('', 'PRINT', 'height=650,width=900,top=100,left=100');
      newWindow?.document.write('<html><head><title>PC Quotation</title>');
      newWindow?.document.write('<style>body { margin: 0; } @page { size: A4; margin: 20mm; } table { width: 100%; border-collapse: collapse; } </style>');
      newWindow?.document.write('</head><body>');
      newWindow?.document.write(printFrame.innerHTML);
      newWindow?.document.write('</body></html>');
      newWindow?.document.close();
      newWindow?.focus();
      setTimeout(() => {
        newWindow?.print();
        newWindow?.close();
      }, 250);
    }
  };
  
  const handleDownloadPdf = () => {
    const input = document.getElementById('pdf-pc-builder-area');
    if (input) {
      html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`pc-quotation.pdf`);
      });
    }
  };
  
  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-start sm:items-center z-50 p-4 overflow-y-auto no-print-section">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-full flex flex-col">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold">{t('quotation_preview')}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div id="print-frame-pc-builder" className="overflow-y-auto bg-gray-200 dark:bg-gray-900 flex-grow flex justify-center py-6">
          <div className="w-[210mm] bg-white shadow-lg">
            <PrintablePCBuilder selectedComponents={selectedComponents} total={total} />
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
            {t('print_quotation')}
          </button>
        </div>
      </div>
    </div>
  );
  
  // Hidden div for PDF generation
  const pdfContent = (
    <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
      <div id="pdf-pc-builder-area" style={{ width: '210mm', background: 'white' }}>
        <PrintablePCBuilder selectedComponents={selectedComponents} total={total} />
      </div>
    </div>
  );

  return ReactDOM.createPortal(
    <>
      {modalContent}
      {pdfContent}
    </>,
    portalRoot
  );
};
