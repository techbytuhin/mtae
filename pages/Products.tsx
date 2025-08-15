import React, { useContext, useState, useEffect, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Product, ActionType, Supplier, DamagedProduct, User } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, ArchiveBoxXMarkIcon, ArrowUturnLeftIcon, QrCodeIcon, SparklesIcon, ShoppingBagIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { FormModal } from '../components/FormModal';
import { useTranslation, handleImageError, PLACEHOLDER_IMAGE } from '../hooks/useTranslation';
import { useToast } from '../context/ToastContext';
import { BarcodePrintModal } from '../components/BarcodePrintModal';
import { ConfirmationModal } from '../components/ConfirmationModal';

// Form Input component for reuse
const FormInput = ({ label, id, ...props }: { label: string, id: string, [key: string]: any }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium mb-1 dark:text-gray-300">{label}</label>
        <input id={id} {...props} className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"/>
    </div>
);

const FormSelect = ({ label, id, children, ...props }: { label: string, id: string, children: React.ReactNode, [key: string]: any }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium mb-1 dark:text-gray-300">{label}</label>
        <select id={id} {...props} className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500">
            {children}
        </select>
    </div>
);


const ProductForm = ({ product, suppliers, onSave, onCancel }: { product: Product | null, suppliers: Supplier[], onSave: (product: Product) => void, onCancel: () => void }) => {
    const { state } = useContext(AppContext);
    const { settings } = state;
    const { t, lang } = useTranslation();
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        name: '', description: '', categoryId: '', price: 0, purchasePrice: 0, stock: 0, unit: 'pc', supplierId: suppliers[0]?.id || '', imageUrl: '', expiryDate: '', warrantyPeriod: '', guarantyPeriod: ''
    });
    
    const enabledCategories = useMemo(() => settings.productCategories.filter(c => c.enabled), [settings.productCategories]);
    const unitOptions = [
        'pc', 'kg', 'g', 'mg', 'Litre', 'ml', 'dozen', 'pair', 'set', 'pack', 'box', 'case', 'roll', 'm', 'cm', 'mm', 'ft', 'in', 'sqm', 'sqft'
    ];

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                description: product.description || '',
                categoryId: product.categoryId,
                price: product.price,
                purchasePrice: product.purchasePrice || 0,
                stock: product.stock,
                unit: product.unit || 'pc',
                supplierId: product.supplierId,
                imageUrl: product.imageUrl,
                expiryDate: product.expiryDate || '',
                warrantyPeriod: product.warrantyPeriod || '',
                guarantyPeriod: product.guarantyPeriod || ''
            });
        } else {
             setFormData({
                name: '', description: '', categoryId: enabledCategories[0]?.id || '', price: 0, purchasePrice: 0, stock: 0, unit: 'pc', supplierId: suppliers[0]?.id || '', imageUrl: '', expiryDate: '',
                warrantyPeriod: settings.warrantyAndGuarantyEnabled ? (settings.defaultWarranty || '') : '',
                guarantyPeriod: settings.warrantyAndGuarantyEnabled ? (settings.defaultGuaranty || '') : ''
            });
        }
    }, [product, suppliers, settings, enabledCategories]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const finalValue = type === 'number' ? parseFloat(value) : value;
        setFormData({ ...formData, [name]: finalValue });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.supplierId) {
            showToast(t('select_supplier_error'), 'error');
            return;
        }
        if(!formData.categoryId) {
            showToast(t('select_category_error'), 'error');
            return;
        }
        const finalProduct: Product = {
            id: product?.id || `prod_${crypto.randomUUID()}`,
            name: formData.name,
            description: formData.description,
            categoryId: formData.categoryId,
            price: formData.price,
            purchasePrice: formData.purchasePrice,
            stock: formData.stock,
            unit: formData.unit,
            supplierId: formData.supplierId,
            imageUrl: formData.imageUrl,
            expiryDate: formData.expiryDate,
            warrantyPeriod: settings.warrantyAndGuarantyEnabled ? formData.warrantyPeriod : undefined,
            guarantyPeriod: settings.warrantyAndGuarantyEnabled ? formData.guarantyPeriod : undefined,
            isDeleted: product?.isDeleted || false,
        };
        onSave(finalProduct);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Form Fields */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Section 1: Core Details */}
                    <div className="p-4 border dark:border-gray-700 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">{t('product_name')} &amp; {t('category')}</h3>
                        <div className="space-y-4">
                            <FormInput label={t('product_name')} id="name" name="name" type="text" value={formData.name} onChange={handleChange} required />
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium mb-1 dark:text-gray-300">{t('product_description')}</label>
                                <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"/>
                            </div>
                            <FormSelect 
                                label={t('category')}
                                id="categoryId"
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleChange}
                                required
                            >
                                <option value="" disabled>{t('select_a_category')}</option>
                                {enabledCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </FormSelect>
                        </div>
                    </div>

                    {/* Section 2: Pricing & Stock */}
                    <div className="p-4 border dark:border-gray-700 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">{t('price')} &amp; {t('stock')}</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <FormInput label={t('purchase_rate')} id="purchasePrice" name="purchasePrice" type="number" step="0.01" value={formData.purchasePrice} onChange={handleChange} required />
                            <FormInput label={t('sale_rate')} id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} required />
                            <FormInput label={t('stock')} id="stock" name="stock" type="number" value={formData.stock} onChange={handleChange} required />
                            <FormSelect
                                label={t('unit')}
                                id="unit"
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                required
                            >
                                {unitOptions.map(option => <option key={option} value={option}>{option}</option>)}
                            </FormSelect>
                        </div>
                    </div>

                    {/* Section 3: Logistics */}
                    <div className="p-4 border dark:border-gray-700 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">{t('supplier')} &amp; {t('expiry_date')}</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormSelect label={t('supplier')} id="supplierId" name="supplierId" value={formData.supplierId} onChange={handleChange} required>
                                <option value="" disabled>{t('select_supplier')}</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.company}</option>)}
                            </FormSelect>
                            <FormInput label={`${t('expiry_date')} (${t('optional')})`} id="expiryDate" name="expiryDate" type="date" value={formData.expiryDate} onChange={handleChange} />
                        </div>
                    </div>
                    
                     {/* Section 4: Warranty */}
                    {settings.warrantyAndGuarantyEnabled && (
                        <div className="p-4 border dark:border-gray-700 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4">{t('warranty_guaranty')}</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInput label={`${t('warranty_period')} (${t('optional')})`} id="warrantyPeriod" name="warrantyPeriod" type="text" value={formData.warrantyPeriod} onChange={handleChange} placeholder="e.g., 1 Year"/>
                                <FormInput label={`${t('guaranty_period')} (${t('optional')})`} id="guarantyPeriod" name="guarantyPeriod" type="text" value={formData.guarantyPeriod} onChange={handleChange} placeholder="e.g., 6 Months"/>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Image URL & Preview */}
                <div className="lg:col-span-1">
                    <div className="p-4 border dark:border-gray-700 rounded-lg sticky top-4 space-y-4">
                        <FormInput 
                            label={t('product_image_url')} 
                            id="imageUrl" 
                            name="imageUrl" 
                            type="url" 
                            value={formData.imageUrl} 
                            onChange={handleChange} 
                            placeholder="https://example.com/image.png"
                        />
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('image_preview')}</label>
                            <div className="mt-1 flex-shrink-0 h-48 w-full rounded-md bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
                                <img 
                                    src={formData.imageUrl || PLACEHOLDER_IMAGE} 
                                    alt={t('image_preview')} 
                                    className="h-full w-full object-contain" 
                                    onError={handleImageError}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t dark:border-gray-700">
                <button type="button" onClick={onCancel} className="py-2 px-4 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors">{t('cancel')}</button>
                <button type="submit" className="py-2 px-4 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors">{t('save')}</button>
            </div>
        </form>
    );
};

const DamageProductModal = ({ product, onClose, onConfirm }: { product: Product, onClose: () => void, onConfirm: (quantity: number, reason: string) => void }) => {
    const { t } = useTranslation();
    const [quantity, setQuantity] = useState(1);
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        if (quantity > 0 && quantity <= product.stock) {
            onConfirm(quantity, reason);
        }
    };

    return (
        <FormModal isOpen={true} onClose={onClose} title={`${t('mark_as_damaged')}: ${product.name}`}>
            <div className="space-y-4">
                <p>{t('current_stock')}: <span className="font-bold">{product.stock} {product.unit}</span></p>
                <div>
                    <label htmlFor="damage-quantity" className="block text-sm font-medium mb-1">{t('quantity_damaged')}</label>
                    <input
                        id="damage-quantity"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value, 10) || 1)))}
                        className="w-full p-2 border rounded-md"
                        max={product.stock}
                        min="1"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="damage-reason" className="block text-sm font-medium mb-1">{t('reason_for_damage')} ({t('optional')})</label>
                    <textarea
                        id="damage-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        className="w-full p-2 border rounded-md"
                    />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="py-2 px-4 rounded-lg bg-gray-500 text-white">{t('cancel')}</button>
                    <button type="button" onClick={handleConfirm} className="py-2 px-4 rounded-lg bg-red-600 text-white">{t('record_damage')}</button>
                </div>
            </div>
        </FormModal>
    );
};


const Products: React.FC = () => {
  const { state, dispatch } = useContext(AppContext);
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [showTrash, setShowTrash] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForBarcode, setProductForBarcode] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productToDamage, setProductToDamage] = useState<Product | null>(null);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const { currentUser, settings } = state;

  const activeProducts = state.products.filter(p => !p.isDeleted);
  const deletedProducts = state.products.filter(p => p.isDeleted);
  const productsToShow = showTrash ? deletedProducts : activeProducts;
  
  const handleAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };
  
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSave = (product: Product) => {
    if (editingProduct) {
        dispatch({ type: ActionType.EDIT_PRODUCT, payload: product });
        showToast(t('product_updated_success'), 'success');
    } else {
        dispatch({ type: ActionType.ADD_PRODUCT, payload: product });
        showToast(t('product_added_success'), 'success');
    }
    setIsModalOpen(false);
  };

  const handlePrintBarcode = (product: Product) => {
    setProductForBarcode(product);
  };
  
  const handleDeleteRequest = (product: Product) => {
    setProductToDelete(product);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
        dispatch({ type: ActionType.DELETE_PRODUCT, payload: { productId: productToDelete.id } });
        showToast(t('product_deleted_success'), 'info');
        setProductToDelete(null);
    }
  };

  const handleConfirmBulkDelete = () => {
    dispatch({ type: ActionType.BULK_DELETE_PRODUCTS });
    showToast(t('all_products_deleted_success'), 'success');
    setIsBulkDeleteConfirmOpen(false);
  };
  
  const handleDamageRequest = (product: Product) => {
    setProductToDamage(product);
  };

  const handleConfirmDamage = (quantity: number, reason: string) => {
      if (productToDamage && currentUser) {
          const damagedRecord: DamagedProduct = {
              id: `dmg_${crypto.randomUUID()}`,
              productId: productToDamage.id,
              quantity,
              reason,
              date: new Date().toISOString(),
              recordedByUserId: currentUser.id,
          };
          dispatch({ type: ActionType.ADD_DAMAGED_PRODUCT, payload: damagedRecord });
          showToast(t('damage_recorded_success'), 'success');
          setProductToDamage(null);
      }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{t('products')}</h1>
          <div className="flex space-x-2">
              {currentUser?.role !== 'monitor' && (
                <>
                  {showTrash && currentUser && ['admin', 'super_user'].includes(currentUser.role) && settings.deleteAllProductsEnabled && (
                      <button
                          onClick={() => setIsBulkDeleteConfirmOpen(true)}
                          className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 flex items-center transition-colors"
                      >
                          <TrashIcon className="h-5 w-5 mr-2"/>
                          {t('delete_all_products')}
                      </button>
                  )}
                  <button
                      onClick={() => setShowTrash(!showTrash)}
                      className="bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-600 flex items-center transition-colors"
                  >
                      <ArchiveBoxXMarkIcon className="h-5 w-5 mr-2"/>
                      {showTrash ? t('view_active') : t('view_trash')} ({deletedProducts.length})
                  </button>
                  {!showTrash && settings.purchasesEnabled && (
                    <NavLink to="/purchases" className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 flex items-center transition-colors">
                        <ShoppingBagIcon className="h-5 w-5 mr-2"/>
                        {t('create_purchase_order')}
                    </NavLink>
                  )}
                  {!showTrash && (
                    <button onClick={handleAdd} className="bg-primary-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-600 flex items-center transition-colors">
                      <PlusIcon className="h-5 w-5 mr-2" />
                      {t('add_product')}
                    </button>
                  )}
                </>
              )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">{t('product_name')}</th>
                <th scope="col" className="px-6 py-3">{t('category')}</th>
                <th scope="col" className="px-6 py-3">{t('sale_rate')}</th>
                <th scope="col" className="px-6 py-3">{t('stock')}</th>
                {state.settings.warrantyAndGuarantyEnabled && <th scope="col" className="px-6 py-3">{t('warranty_guaranty')}</th>}
                <th scope="col" className="px-6 py-3 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {productsToShow.map(product => (
                <ProductRow key={product.id} product={product} currentUser={currentUser} isTrashView={showTrash} onEdit={handleEdit} onPrintBarcode={handlePrintBarcode} onDelete={handleDeleteRequest} onDamage={handleDamageRequest} />
              ))}
              {productsToShow.length === 0 && (
                  <tr>
                      <td colSpan={state.settings.warrantyAndGuarantyEnabled ? 6 : 5} className="text-center py-8 text-gray-500">
                          {showTrash ? t('trash_is_empty') : t('no_products_found')}
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <FormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? t('edit_product') : t('add_product')}>
        <ProductForm 
            product={editingProduct}
            suppliers={state.suppliers}
            onSave={handleSave}
            onCancel={() => setIsModalOpen(false)}
        />
      </FormModal>
      {productForBarcode && (
        <BarcodePrintModal
          product={productForBarcode}
          onClose={() => setProductForBarcode(null)}
        />
      )}
      {productToDamage && (
          <DamageProductModal
              product={productToDamage}
              onClose={() => setProductToDamage(null)}
              onConfirm={handleConfirmDamage}
          />
      )}
      <ConfirmationModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t('confirm_delete_title')}
        message={t('confirm_delete_message', { itemName: productToDelete?.name || '' })}
      />
      <ConfirmationModal
        isOpen={isBulkDeleteConfirmOpen}
        onClose={() => setIsBulkDeleteConfirmOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title={t('confirm_bulk_delete_title')}
        message={t('confirm_bulk_delete_message')}
        confirmText={t('delete')}
      />
    </>
  );
};

interface ProductRowProps {
    product: Product;
    currentUser: User | null;
    isTrashView: boolean;
    onEdit: (product: Product) => void;
    onPrintBarcode: (product: Product) => void;
    onDelete: (product: Product) => void;
    onDamage: (product: Product) => void;
}

const ProductRow: React.FC<ProductRowProps> = ({ product, currentUser, isTrashView, onEdit, onPrintBarcode, onDelete, onDamage }) => {
    const { state, dispatch } = useContext(AppContext);
    const { t, lang, currency } = useTranslation();
    const { showToast } = useToast();
    const currencyFormatter = new Intl.NumberFormat(lang, {
        style: 'currency',
        currency: currency,
    });
    const stockColor = product.stock < 10 ? 'text-red-500 font-bold' : '';
    const category = state.settings.productCategories.find(c => c.id === product.categoryId);

    const handleRestore = (productId: string) => {
        dispatch({ type: ActionType.RESTORE_PRODUCT, payload: { productId } });
        showToast(t('product_restored_success'), 'success');
    }
    
    return (
         <tr className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
            <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap flex items-center space-x-3">
                <img src={product.imageUrl} alt={product.name} className="h-10 w-10 rounded-full object-cover" onError={handleImageError}/>
                <span>{product.name}</span>
            </th>
            <td className="px-6 py-4">{category?.name || 'N/A'}</td>
            <td className="px-6 py-4">{currencyFormatter.format(product.price)}</td>
            <td className={`px-6 py-4 ${stockColor}`}>{product.stock} {product.unit}</td>
            {state.settings.warrantyAndGuarantyEnabled && (
                <td className="px-6 py-4 text-xs">
                    {product.warrantyPeriod && <div>W: {product.warrantyPeriod}</div>}
                    {product.guarantyPeriod && <div>G: {product.guarantyPeriod}</div>}
                </td>
            )}
            <td className="px-6 py-4 text-right">
                {isTrashView ? (
                     currentUser?.role !== 'monitor' && (
                        <button onClick={() => handleRestore(product.id)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('restore')}>
                            <ArrowUturnLeftIcon className="h-5 w-5 text-green-500"/>
                        </button>
                     )
                ) : (
                    <div className="flex justify-end space-x-1">
                        <button onClick={() => onPrintBarcode(product)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('barcode_qr_code')}>
                            <QrCodeIcon className="h-5 w-5 text-gray-600 dark:text-gray-300"/>
                        </button>
                        {currentUser?.role !== 'monitor' && (
                            <>
                                <button onClick={() => onDamage(product)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('mark_as_damaged')}>
                                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600"/>
                                </button>
                                <button onClick={() => onEdit(product)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('edit')}>
                                    <PencilIcon className="h-5 w-5 text-primary-500"/>
                                </button>
                                <button onClick={() => onDelete(product)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('delete')}>
                                    <TrashIcon className="h-5 w-5 text-red-500"/>
                                </button>
                            </>
                        )}
                    </div>
                )}
            </td>
        </tr>
    );
}

export default Products;