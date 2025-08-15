import React, { useContext, useState, useEffect, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Supplier, ActionType, User } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { FormModal } from '../components/FormModal';
import { useTranslation } from '../hooks/useTranslation';
import { useToast } from '../context/ToastContext';
import { ConfirmationModal } from '../components/ConfirmationModal';

// Reusable input component
const FormInput = ({ label, id, ...props }: { label: string, id: string, [key: string]: any }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium mb-1 dark:text-gray-300">{label}</label>
        <input id={id} {...props} className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"/>
    </div>
);

// Form component
const SupplierForm = ({ supplier, onSave, onCancel }: { supplier: Supplier | null, onSave: (supplier: Supplier) => void, onCancel: () => void }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '', company: '', phone: '', address: ''
    });

    useEffect(() => {
        if (supplier) {
            setFormData({ name: supplier.name, company: supplier.company, phone: supplier.phone, address: supplier.address });
        } else {
             setFormData({ name: '', company: '', phone: '', address: '' });
        }
    }, [supplier]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalSupplier: Supplier = {
            id: supplier?.id || `sup_${crypto.randomUUID()}`,
            ...formData,
        };
        onSave(finalSupplier);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label={t('company_name')} id="company" name="company" type="text" value={formData.company} onChange={handleChange} required />
                <FormInput label={t('contact_person')} id="name" name="name" type="text" value={formData.name} onChange={handleChange} required />
                <FormInput label={t('phone')} id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required />
                <FormInput label={t('address')} id="address" name="address" type="text" value={formData.address} onChange={handleChange} required />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="py-2 px-4 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors">{t('cancel')}</button>
                <button type="submit" className="py-2 px-4 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors">{t('save')}</button>
            </div>
        </form>
    );
};


const Suppliers: React.FC = () => {
  const { state, dispatch } = useContext(AppContext);
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { currentUser } = state;

  const productCounts = useMemo(() => {
    const counts = new Map<string, number>();
    state.products.forEach(product => {
        if (!product.isDeleted) {
            counts.set(product.supplierId, (counts.get(product.supplierId) || 0) + 1);
        }
    });
    return counts;
  }, [state.products]);

  const filteredSuppliers = useMemo(() => {
      const lowerCaseSearch = searchTerm.toLowerCase();
      return state.suppliers.filter(s => 
          s.company.toLowerCase().includes(lowerCaseSearch) ||
          s.name.toLowerCase().includes(lowerCaseSearch)
      );
  }, [state.suppliers, searchTerm]);

  const handleAdd = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };
  
  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleSave = (supplier: Supplier) => {
    if (editingSupplier) {
        dispatch({ type: ActionType.EDIT_SUPPLIER, payload: supplier });
        showToast(t('supplier_updated_success'), 'success');
    } else {
        dispatch({ type: ActionType.ADD_SUPPLIER, payload: supplier });
        showToast(t('supplier_added_success'), 'success');
    }
    setIsModalOpen(false);
  };
  
  const handleDeleteRequest = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
  };

  const handleConfirmDelete = () => {
      if(supplierToDelete) {
          dispatch({ type: ActionType.DELETE_SUPPLIER, payload: { supplierId: supplierToDelete.id } });
          showToast(t('supplier_deleted_success'), 'info');
          setSupplierToDelete(null);
      }
  };


  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold">{t('suppliers')}</h1>
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
                  {t('add_supplier')}
              </button>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">{t('company_name')}</th>
                <th scope="col" className="px-6 py-3">{t('contact_person')}</th>
                <th scope="col" className="px-6 py-3">{t('phone')}</th>
                <th scope="col" className="px-6 py-3">{t('products_supplied')}</th>
                <th scope="col" className="px-6 py-3 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map(supplier => (
                <SupplierRow 
                    key={supplier.id} 
                    supplier={supplier}
                    currentUser={currentUser} 
                    productCount={productCounts.get(supplier.id) || 0}
                    onEdit={handleEdit} 
                    onDelete={handleDeleteRequest} 
                />
              ))}
               {filteredSuppliers.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-500">{t('no_suppliers_found')}</td></tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
       <FormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSupplier ? t('edit_supplier') : t('add_supplier')}>
        <SupplierForm supplier={editingSupplier} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
      </FormModal>
      <ConfirmationModal 
        isOpen={!!supplierToDelete}
        onClose={() => setSupplierToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t('confirm_delete_title')}
        message={t('confirm_delete_message', { itemName: supplierToDelete?.company || '' })}
      />
    </>
  );
};

interface SupplierRowProps {
    supplier: Supplier;
    currentUser: User | null;
    productCount: number;
    onEdit: (supplier: Supplier) => void;
    onDelete: (supplier: Supplier) => void;
}

const SupplierRow: React.FC<SupplierRowProps> = ({ supplier, currentUser, productCount, onEdit, onDelete }) => {
    const { t } = useTranslation();
    const { state } = useContext(AppContext);

    return (
         <tr className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
            <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{supplier.company}</th>
            <td className="px-6 py-4">{supplier.name}</td>
            <td className="px-6 py-4">{supplier.phone}</td>
            <td className="px-6 py-4">{productCount} product(s)</td>
            <td className="px-6 py-4 text-right">
                {currentUser?.role !== 'monitor' && (
                  <div className="flex justify-end space-x-1">
                      {state.settings.purchasesEnabled && (
                          <NavLink to="/purchases" state={{ supplierId: supplier.id }} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('create_order')}>
                              <ShoppingBagIcon className="h-5 w-5 text-green-500"/>
                          </NavLink>
                      )}
                      <button onClick={() => onEdit(supplier)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('edit')}>
                          <PencilIcon className="h-5 w-5 text-primary-500"/>
                      </button>
                      <button onClick={() => onDelete(supplier)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('delete')}>
                          <TrashIcon className="h-5 w-5 text-red-500"/>
                      </button>
                  </div>
                )}
            </td>
        </tr>
    );
}

export default Suppliers;