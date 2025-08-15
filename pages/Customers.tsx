import React, { useContext, useState, useEffect, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { Customer, ActionType, Sale, DiscountOffer, User } from '../types';
import { PlusIcon, PencilIcon, MagnifyingGlassIcon, EnvelopeIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { FormModal } from '../components/FormModal';
import { useTranslation } from '../hooks/useTranslation';
import { useToast } from '../context/ToastContext';

// Reusable input component
const FormInput = ({ label, id, ...props }: { label: string, id: string, [key: string]: any }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium mb-1 dark:text-gray-300">{label}</label>
        <input id={id} {...props} className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"/>
    </div>
);


// Form component
const CustomerForm = ({ customer, onSave, onCancel }: { customer: Customer | null, onSave: (customer: Customer) => void, onCancel: () => void }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '', phone: '', email: '', address: ''
    });

    useEffect(() => {
        if (customer) {
            setFormData({ name: customer.name, phone: customer.phone, email: customer.email, address: customer.address });
        } else {
             setFormData({ name: '', phone: '', email: '', address: '' });
        }
    }, [customer]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalCustomer: Omit<Customer, 'id'> & { id: string } = {
            id: customer?.id || `cust_${crypto.randomUUID()}`,
            ...formData,
        };
        onSave(finalCustomer as Customer);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label={t('full_name')} id="name" name="name" type="text" value={formData.name} onChange={handleChange} required />
                <FormInput label={t('phone')} id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required />
            </div>
            <FormInput label={t('email')} id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
            <FormInput label={t('address')} id="address" name="address" type="text" value={formData.address} onChange={handleChange} />
            
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="py-2 px-4 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors">{t('cancel')}</button>
                <button type="submit" className="py-2 px-4 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors">{t('save')}</button>
            </div>
        </form>
    );
};

const Customers: React.FC = () => {
  const { state, dispatch } = useContext(AppContext);
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { currentUser } = state;

  const handleAdd = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };
  
  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };
  
  const handleSave = (customer: Customer) => {
    if (editingCustomer) {
        dispatch({ type: ActionType.EDIT_CUSTOMER, payload: customer });
        showToast(t('customer_updated_success'), 'success');
    } else {
        dispatch({ type: ActionType.ADD_CUSTOMER, payload: customer });
        showToast(t('customer_added_success'), 'success');
    }
    setIsModalOpen(false);
  };

  const customerData = useMemo(() => {
    const statsMap = new Map<string, { totalDue: number; purchaseCount: number }>();
    state.sales.forEach(sale => {
        const stats = statsMap.get(sale.customerId) || { totalDue: 0, purchaseCount: 0 };
        stats.totalDue += sale.total - sale.paidAmount;
        stats.purchaseCount++;
        statsMap.set(sale.customerId, stats);
    });

    const lowerCaseSearch = searchTerm.toLowerCase();
    
    return state.customers
        .filter(customer => 
            customer.name.toLowerCase().includes(lowerCaseSearch) || 
            customer.phone.includes(lowerCaseSearch)
        )
        .map(customer => ({
            ...customer,
            totalDue: statsMap.get(customer.id)?.totalDue || 0,
            purchaseCount: statsMap.get(customer.id)?.purchaseCount || 0
        }));

  }, [state.customers, state.sales, searchTerm]);


  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold">{t('customers')}</h1>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-grow">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2"/>
                <input
                    type="text"
                    placeholder={`${t('search')}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-gray-700 rounded-lg pl-10 pr-4 py-2 border dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
            </div>
            {currentUser?.role !== 'monitor' && (
              <button onClick={handleAdd} className="bg-primary-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-600 flex items-center transition-colors flex-shrink-0">
                <PlusIcon className="h-5 w-5 mr-2" />
                {t('add_customer')}
              </button>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">{t('customer_name')}</th>
                <th scope="col" className="px-6 py-3">{t('phone')}</th>
                <th scope="col" className="px-6 py-3">{t('total_due')}</th>
                <th scope="col" className="px-6 py-3">{t('purchase_history')}</th>
                <th scope="col" className="px-6 py-3 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {customerData.map(customer => (
                <CustomerRow key={customer.id} customer={customer} currentUser={currentUser} onEdit={handleEdit} />
              ))}
               {customerData.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-500">{t('no_customers_found')}</td></tr>
                )}
            </tbody>
          </table>
        </div>
      </div>

      <FormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCustomer ? t('edit_customer') : t('add_customer')}>
        <CustomerForm customer={editingCustomer} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
      </FormModal>
    </>
  );
};

interface CustomerRowProps {
    customer: Customer & { totalDue: number; purchaseCount: number };
    currentUser: User | null;
    onEdit: (customer: Customer) => void;
}

const CustomerRow: React.FC<CustomerRowProps> = ({ customer, currentUser, onEdit }) => {
    const { t, lang, currency } = useTranslation();

    const currencyFormatter = useMemo(() => new Intl.NumberFormat(lang, {
        style: 'currency',
        currency: currency,
    }), [currency, lang]);
    
    return (
         <tr className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
            <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{customer.name}</th>
            <td className="px-6 py-4">{customer.phone}</td>
            <td className={`px-6 py-4 font-semibold ${customer.totalDue > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {currencyFormatter.format(customer.totalDue)}
            </td>
            <td className="px-6 py-4">{customer.purchaseCount} {t('purchase_history')}</td>
            <td className="px-6 py-4 text-right">
                {currentUser?.role !== 'monitor' && (
                  <div className="flex justify-end space-x-1">
                      <button onClick={() => onEdit(customer)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('edit')}>
                          <PencilIcon className="h-5 w-5 text-primary-500"/>
                      </button>
                  </div>
                )}
            </td>
        </tr>
    );
}

export default Customers;