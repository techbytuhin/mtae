import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { useTranslation } from '../hooks/useTranslation';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface BarcodeScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScanSuccess: (decodedText: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
    const { t } = useTranslation();
    const readerElementId = "barcode-scanner-modal-reader";
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setErrorMessage(null);
            // Prevents multiple instances
            if (!scannerRef.current) {
                scannerRef.current = new Html5Qrcode(readerElementId, { verbose: false });
            }
            const scanner = scannerRef.current;

            if (scanner && !scanner.isScanning) {
                scanner.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                    },
                    (decodedText, decodedResult) => {
                        if (scanner?.isScanning) {
                             scanner.stop()
                                .then(() => {
                                    onScanSuccess(decodedText);
                                })
                                .catch(err => {
                                    console.error("Error stopping scanner after success:", err);
                                    // Still call onScanSuccess to ensure flow continues
                                    onScanSuccess(decodedText);
                                });
                        }
                    },
                    (error) => {
                        // This error callback is called frequently, so we don't log it unless debugging.
                    }
                ).catch(err => {
                    console.error("Error starting scanner:", err);
                    setErrorMessage(t('camera_unavailable'));
                });
            }
        }

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(err => {
                    // This error is expected if the component unmounts quickly.
                    // console.error("Error stopping scanner on cleanup:", err)
                });
            }
        };
    // onScanSuccess is removed from deps to prevent re-initialization on parent re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, t]);

    if (!isOpen) return null;

    const portalRoot = document.getElementById('portal-root');
    if (!portalRoot) return null;

    const modalContent = (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{t('scan_code')}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>
                <div className="relative overflow-hidden aspect-square bg-black">
                    <div id={readerElementId} className="w-full h-full"></div>
                    {errorMessage && (
                         <div className="absolute inset-0 bg-gray-800 bg-opacity-80 flex flex-col items-center justify-center text-white p-4">
                            <ExclamationTriangleIcon className="h-12 w-12 text-yellow-400 mb-4" />
                            <p className="text-center font-semibold">{errorMessage}</p>
                        </div>
                    )}
                </div>
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50">
                    {t('scanning_for_code')}
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, portalRoot);
};
