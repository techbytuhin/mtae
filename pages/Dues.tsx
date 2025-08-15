import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Customer, Sale, DueCollection, User } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { EyeIcon, BanknotesIcon, EnvelopeIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { FormModal } from '../components/FormModal';
import { DueCollectionModal } from '../components/DueCollectionModal';
import { DueReceiptPrintModal } from '../components/DueReceiptPrintModal';
import { useToast } from '../context/ToastContext';

const Dues: React.FC = () => {
    const { state } = useContext(AppContext);
    const { t, lang, formatDateTime, currency } = useTranslation();
    const { customers, sales, currentUser } = state;

    const [selectedCustomer, setSelectedCustomer] = useState<Customer & { totalDue: number } | null>(null);
    const [isDueListModalOpen, setIsDueListModalOpen] = useState(false);
    const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
    const [receiptData, setReceiptData] = useState<{ collection: DueCollection, previousDue: number, user: User } | null>(null);

    const currencyFormatter = useMemo(() => new Intl.NumberFormat(lang, {
        style: 'currency',
        currency: currency,
    }), [currency, lang]);

    const customersWithDueInfo = useMemo(() => {
        const dueInfoMap = new Map<string, { totalDue: number; hasDueInvoices: boolean }>();
        
        // Initialize every customer in the map
        customers.forEach(c => {
            dueInfoMap.set(c.id, { totalDue: 0, hasDueInvoices: false });
        });

        sales.forEach(sale => {
            const dueAmount = sale.total - sale.paidAmount;
            const info = dueInfoMap.get(sale.customerId);
            if (info) {
                info.totalDue += dueAmount;
                if (dueAmount > 0.001) {
                    info.hasDueInvoices = true;
                }
            }
        });

        return customers
            .map(customer => ({
                ...customer,
                ...(dueInfoMap.get(customer.id) || { totalDue: 0, hasDueInvoices: false }),
            }))
            .filter(customer => customer.hasDueInvoices)
            .sort((a, b) => b.totalDue - a.totalDue);

    }, [sales, customers]);
    
    const selectedCustomerDues = useMemo(() => {
        if (!selectedCustomer) return [];
        return sales.filter(s => s.customerId === selectedCustomer.id && (s.total - s.paidAmount > 0.001)).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [sales, selectedCustomer]);

    const handleViewDetails = (customer: Customer & { totalDue: number }) => {
        setSelectedCustomer(customer);
        setIsDueListModalOpen(true);
    };

    const handleCollectPayment = (customer: Customer & { totalDue: number }) => {
        setSelectedCustomer(customer);
        setIsCollectModalOpen(true);
    };
    
    const onCollectionSuccess = (collection: DueCollection, previousDue: number) => {
        setIsCollectModalOpen(false);
        if (currentUser) {
            setReceiptData({ collection, previousDue, user: currentUser });
        }
    }

    return (
        <>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">{t('due_list')}</h1>
                <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('customer_name')}</th>
                                <th scope="col" className="px-6 py-3">{t('phone')}</th>
                                <th scope="col" className="px-6 py-3">{t('total_due')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customersWithDueInfo.map(customer => (
                                <tr key={customer.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{customer.name}</td>
                                    <td className="px-6 py-4">{customer.phone}</td>
                                    <td className="px-6 py-4 font-bold text-red-500">{currencyFormatter.format(customer.totalDue)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end space-x-2">
                                            <button onClick={() => handleViewDetails(customer)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('view_details')}>
                                                <EyeIcon className="h-5 w-5 text-gray-500"/>
                                            </button>
                                            {currentUser?.role !== 'monitor' && (
                                              <>
                                                <button onClick={() => handleCollectPayment(customer)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('collect_payment')}>
                                                    <BanknotesIcon className="h-5 w-5 text-green-500"/>
                                                </button>
                                              </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                             {customersWithDueInfo.length === 0 && (
                                <tr><td colSpan={4} className="text-center py-8 text-gray-500">{t('no_customers_found')} with dues.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isDueListModalOpen && selectedCustomer && (
                <FormModal
                    isOpen={isDueListModalOpen}
                    onClose={() => setIsDueListModalOpen(false)}
                    title={`${t('due_invoices')} - ${selectedCustomer.name}`}
                >
                   <div className="space-y-4">
                       {selectedCustomerDues.length > 0 ? selectedCustomerDues.map(sale => (
                           <div key={sale.id} className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 flex justify-between items-center">
                               <div>
                                   <p className="font-semibold">{sale.id}</p>
                                   <p className="text-sm text-gray-500 dark:text-gray-400">{formatDateTime(sale.date)}</p>
                               </div>
                               <div className="text-right">
                                   <p className="font-bold text-red-500">{currencyFormatter.format(sale.total - sale.paidAmount)}</p>
                                   <p className="text-xs text-gray-500 dark:text-gray-400">Total: {currencyFormatter.format(sale.total)}</p>
                               </div>
                           </div>
                       )) : <p className="text-center text-gray-500">{t('customer_has_no_dues')}</p>}
                   </div>
                </FormModal>
            )}

            {isCollectModalOpen && selectedCustomer && (
                <DueCollectionModal 
                    customer={selectedCustomer}
                    onClose={() => setIsCollectModalOpen(false)}
                    onSuccess={onCollectionSuccess}
                />
            )}
            
            {receiptData && (
                <DueReceiptPrintModal
                    collection={receiptData.collection}
                    previousDue={receiptData.previousDue}
                    user={receiptData.user}
                    onClose={() => setReceiptData(null)}
                />
            )}
        </>
    );
};

export default Dues;