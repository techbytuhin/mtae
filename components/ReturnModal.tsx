import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { Sale, SaleReturn, SaleReturnItem } from '../types';
import { FormModal } from './FormModal';
import { useTranslation } from '../hooks/useTranslation';
import { useToast } from '../context/ToastContext';
import { ActionType } from '../types';

interface ReturnItemState {
    productId: string;
    productName: string;
    priceAtSale: number;
    purchasedQty: number;
    returnableQty: number;
    returnQty: number;
}

interface ReturnModalProps {
    isOpen: boolean;
    onClose: () => void;
    sale: Sale | null;
}

export const ReturnModal: React.FC<ReturnModalProps> = ({ isOpen, onClose, sale }) => {
    const { state, dispatch } = useContext(AppContext);
    const { products, currentUser } = state;
    const { t, lang, currency } = useTranslation();
    const { showToast } = useToast();

    const [returnItems, setReturnItems] = useState<ReturnItemState[]>([]);
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (sale) {
            const initialItems = sale.items.map(item => {
                const product = products.find(p => p.id === item.productId);
                const purchasedQty = item.quantity;
                const returnedQty = item.returnedQuantity || 0;
                return {
                    productId: item.productId,
                    productName: product?.name || 'Unknown',
                    priceAtSale: item.priceAtSale,
                    purchasedQty: purchasedQty,
                    returnableQty: purchasedQty - returnedQty,
                    returnQty: 0,
                };
            }).filter(item => item.returnableQty > 0);
            setReturnItems(initialItems);
            setReason('');
        }
    }, [sale, products]);

    const handleQuantityChange = (productId: string, qty: number) => {
        setReturnItems(prevItems =>
            prevItems.map(item => {
                if (item.productId === productId) {
                    const newQty = Math.max(0, Math.min(item.returnableQty, qty));
                    return { ...item, returnQty: newQty };
                }
                return item;
            })
        );
    };

    const totalRefundAmount = useMemo(() => {
        return returnItems.reduce((total, item) => total + (item.returnQty * item.priceAtSale), 0);
    }, [returnItems]);

    const currencyFormatter = useMemo(() => new Intl.NumberFormat(lang, {
        style: 'currency',
        currency: currency,
    }), [currency, lang]);

    const handleSubmit = () => {
        if (!sale || !currentUser) return;
        
        const itemsToProcess = returnItems.filter(item => item.returnQty > 0);
        if (itemsToProcess.length === 0) {
            showToast(t('return_no_items_error'), 'error');
            return;
        }

        const newReturn: SaleReturn = {
            id: `RTN-${sale.id}-${Date.now()}`,
            originalSaleId: sale.id,
            items: itemsToProcess.map(item => ({
                productId: item.productId,
                quantity: item.returnQty,
                priceAtReturn: item.priceAtSale,
            })),
            total: totalRefundAmount,
            reason: reason.trim(),
            date: new Date().toISOString(),
            processedByUserId: currentUser.id,
        };

        dispatch({ type: ActionType.CREATE_SALE_RETURN, payload: newReturn });
        showToast(t('return_success'), 'success');
        onClose();
    };

    if (!sale) return null;

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={`${t('process_return_for_invoice')} #${sale.id}`}>
            <div className="space-y-4">
                <div className="max-h-64 overflow-y-auto pr-2 space-y-3">
                    {returnItems.map(item => (
                        <div key={item.productId} className="grid grid-cols-5 gap-3 items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="col-span-2">
                                <p className="font-semibold text-sm">{item.productName}</p>
                                <p className="text-xs text-gray-500">{t('purchased')}: {item.purchasedQty}</p>
                            </div>
                            <div className="col-span-1 text-center">
                                <p className="text-sm font-mono">{currencyFormatter.format(item.priceAtSale)}</p>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-500 text-center mb-1">{t('quantity_to_return')}</label>
                                <input
                                    type="number"
                                    value={item.returnQty}
                                    onChange={e => handleQuantityChange(item.productId, parseInt(e.target.value) || 0)}
                                    min="0"
                                    max={item.returnableQty}
                                    className="w-full p-1 text-center border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600"
                                />
                                <p className="text-xs text-center text-gray-400">{t('returnable')}: {item.returnableQty}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div>
                    <label htmlFor="return-reason" className="block text-sm font-medium mb-1">{t('reason_for_return')}</label>
                    <textarea
                        id="return-reason"
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        rows={2}
                        className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600"
                    />
                </div>
                <div className="pt-4 text-right">
                    <span className="text-sm font-medium">{t('total_refund_amount')}: </span>
                    <span className="text-xl font-bold text-primary-600 dark:text-primary-400">{currencyFormatter.format(totalRefundAmount)}</span>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
                    <button type="button" onClick={onClose} className="py-2 px-4 rounded-lg bg-gray-500 text-white hover:bg-gray-600">{t('cancel')}</button>
                    <button type="button" onClick={handleSubmit} className="py-2 px-4 rounded-lg bg-primary-600 text-white hover:bg-primary-700">{t('process_return')}</button>
                </div>
            </div>
        </FormModal>
    );
};