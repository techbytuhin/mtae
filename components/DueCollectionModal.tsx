import React, { useState, useContext, useMemo } from 'react';
import { FormModal } from './FormModal';
import { AppContext } from '../context/AppContext';
import { Customer, ActionType, DueCollection } from '../types';
import { useTranslation, TranslationKey } from '../hooks/useTranslation';
import { useToast } from '../context/ToastContext';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface DueCollectionModalProps {
    customer: Customer;
    onClose: () => void;
    onSuccess: (collection: DueCollection, previousDue: number) => void;
}

export const DueCollectionModal: React.FC<DueCollectionModalProps> = ({ customer, onClose, onSuccess }) => {
    const { state, dispatch } = useContext(AppContext);
    const { t, lang, currency } = useTranslation();
    const { showToast } = useToast();
    const { sales } = state;

    const [amount, setAmount] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bKash' | 'nagad' | 'rocket' | 'upay'>('cash');
    const [isMobileBankingOpen, setIsMobileBankingOpen] = useState(false);

    const currencyFormatter = useMemo(() => new Intl.NumberFormat(lang, {
        style: 'currency',
        currency: currency,
    }), [currency, lang]);
    
    const totalDue = useMemo(() => {
        return sales
            .filter(sale => sale.customerId === customer.id)
            .reduce((acc, sale) => acc + (sale.total - sale.paidAmount), 0);
    }, [sales, customer.id]);
    
    const primaryPaymentMethods = ['cash', 'card'] as const;
    const mobilePaymentMethods = ['bKash', 'nagad', 'rocket', 'upay'] as const;
    const isMobileMethodSelected = (mobilePaymentMethods as readonly string[]).includes(paymentMethod);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (amount <= 0) {
            showToast(t('invalid_amount_error'), 'error');
            return;
        }
        if (amount > totalDue + 0.001) { // Add epsilon for float comparison
            showToast(t('amount_exceeds_due_error'), 'error');
            return;
        }

        const newCollection: DueCollection = {
            id: `DUE-${crypto.randomUUID().slice(0, 8)}`,
            customerId: customer.id,
            amount: amount,
            date: new Date().toISOString(),
            paymentMethod: paymentMethod,
        };
        
        dispatch({ type: ActionType.COLLECT_DUE, payload: newCollection });
        showToast(t('payment_collected_success'), 'success');
        onSuccess(newCollection, totalDue);
    };
    
    return (
        <FormModal isOpen={true} onClose={onClose} title={`${t('collect_payment')} - ${customer.name}`}>
            <div className="text-center mb-6">
                <p className="text-lg text-gray-500 dark:text-gray-400">{t('total_due')}</p>
                <p className="text-4xl font-bold text-red-500">{currencyFormatter.format(totalDue)}</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium mb-1 dark:text-gray-300">{t('amount_paid')}</label>
                    <input
                        id="amount"
                        name="amount"
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">{t('payment_method')}</label>
                     <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            {primaryPaymentMethods.map(method => (
                               <button
                                   key={method}
                                   type="button"
                                   onClick={() => setPaymentMethod(method)}
                                   className={`p-2 text-sm rounded-lg border-2 capitalize transition-colors flex items-center justify-center ${paymentMethod === method ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                               >
                                   {t(method as TranslationKey)}
                               </button>
                           ))}
                        </div>
                        <div>
                            <button
                                type="button"
                                onClick={() => setIsMobileBankingOpen(!isMobileBankingOpen)}
                                className={`w-full p-2 text-sm rounded-lg border-2 capitalize transition-colors flex items-center justify-between ${isMobileMethodSelected ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            >
                                <span>{t('online_mobile_banking')}</span>
                                <ChevronDownIcon className={`h-4 w-4 transition-transform ${isMobileBankingOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isMobileBankingOpen && (
                                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                    {mobilePaymentMethods.map(method => (
                                       <button
                                           key={method}
                                           type="button"
                                           onClick={() => setPaymentMethod(method)}
                                           className={`p-2 text-sm rounded-lg border-2 capitalize transition-colors ${paymentMethod === method ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                       >
                                           {t(method as TranslationKey)}
                                       </button>
                                   ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                 <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="py-2 px-4 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors">{t('cancel')}</button>
                    <button type="submit" className="py-2 px-4 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors">{t('collect_payment')}</button>
                </div>
            </form>
        </FormModal>
    );
};