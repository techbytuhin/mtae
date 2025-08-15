import React, { useContext, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { ActionType, Product, PurchaseItem, ServicePurchase, ServicePurchaseItem } from '../types';
import { MagnifyingGlassIcon, XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useTranslation, handleImageError } from '../hooks/useTranslation';
import { useToast } from '../context/ToastContext';

const TabButton = ({ isActive, onClick, text }: { isActive: boolean, onClick: () => void, text: string }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-white dark:bg-gray-800 shadow text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:bg-white/50 dark:hover:bg-gray-800/50'}`}
    >
        {text}
    </button>
);

const Purchases: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const location = useLocation();
    const { t, lang, currency } = useTranslation();
    const { showToast } = useToast();
    const { products, suppliers, settings } = state;

    const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');
    
    // State for Product Purchases
    const [searchTerm, setSearchTerm] = useState('');
    const [productOrder, setProductOrder] = useState<PurchaseItem[]>([]);
    
    // State for Service Purchases
    const [serviceItems, setServiceItems] = useState<{ id: string; description: string; cost: number }[]>([]);

    // Shared state
    const [selectedSupplierId, setSelectedSupplierId] = useState(location.state?.supplierId || suppliers[0]?.id || '');

    const currencyFormatter = useMemo(() => new Intl.NumberFormat(lang, {
        style: 'currency',
        currency: currency,
    }), [currency, lang]);

    const categoryMap = useMemo(() => new Map(settings.productCategories.map(c => [c.id, c.name])), [settings.productCategories]);

    // --- Product Purchase Logic ---
    const filteredProducts = useMemo(() => {
        return products.filter(p => 
            !p.isDeleted && 
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [products, searchTerm]);

    const addToProductOrder = (product: Product) => {
        const existingItem = productOrder.find(item => item.productId === product.id);
        if (existingItem) {
            setProductOrder(productOrder.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            setProductOrder([...productOrder, { productId: product.id, quantity: 1, costPrice: product.purchasePrice || 0 }]);
        }
    };

    const updateProductItem = (productId: string, quantity: number, costPrice: number) => {
        if (quantity > 0) {
            setProductOrder(productOrder.map(item => item.productId === productId ? { ...item, quantity, costPrice } : item));
        } else {
            removeFromProductOrder(productId);
        }
    };

    const removeFromProductOrder = (productId: string) => {
        setProductOrder(productOrder.filter(item => item.productId !== productId));
    };

    const productOrderTotal = useMemo(() => {
        return productOrder.reduce((total, item) => total + (item.costPrice * item.quantity), 0);
    }, [productOrder]);

    const handleCompleteProductPurchase = () => {
        if (productOrder.length === 0) {
            showToast(t('cart_is_empty'), 'error'); return;
        }
        if (!selectedSupplierId) {
            showToast(t('select_supplier_error'), 'error'); return;
        }
        if (productOrder.some(item => item.costPrice <= 0)) {
            showToast(t('invalid_cost_price_error'), 'error'); return;
        }
        const newPurchase = {
            id: `PO-${(state.purchases.length + 1).toString().padStart(5, '0')}`,
            supplierId: selectedSupplierId,
            items: productOrder,
            total: productOrderTotal,
            date: new Date().toISOString()
        };
        dispatch({ type: ActionType.CREATE_PURCHASE, payload: newPurchase });
        showToast(t('order_placed_successfully'), 'success');
        setProductOrder([]);
    };
    
    // --- Service Purchase Logic ---
    const handleAddService = () => {
        setServiceItems(prev => [...prev, { id: `service_${crypto.randomUUID()}`, description: '', cost: 0 }]);
    };
    
    const handleUpdateService = (id: string, field: 'description' | 'cost', value: string | number) => {
        const updatedValue = field === 'cost' ? Math.max(0, Number(value)) : value;
        setServiceItems(prev => prev.map(item => item.id === id ? { ...item, [field]: updatedValue } : item));
    };
    
    const handleRemoveService = (id: string) => {
        setServiceItems(prev => prev.filter(item => item.id !== id));
    };
    
    const serviceOrderTotal = useMemo(() => {
        return serviceItems.reduce((total, item) => total + item.cost, 0);
    }, [serviceItems]);

    const handlePlaceServiceOrder = () => {
        if (serviceItems.length === 0) {
            showToast(t('cart_is_empty'), 'error'); return;
        }
        if (!selectedSupplierId) {
            showToast(t('select_supplier_error'), 'error'); return;
        }
        if (serviceItems.some(item => item.cost <= 0 || !item.description.trim())) {
            showToast(t('enter_service_details'), 'error'); return;
        }

        const newServicePurchase: ServicePurchase = {
            id: `SPO-${(state.servicePurchases.length + 1).toString().padStart(5, '0')}`,
            supplierId: selectedSupplierId,
            items: serviceItems.map(({ id, ...rest }) => rest), // Remove temporary client-side ID
            total: serviceOrderTotal,
            date: new Date().toISOString(),
        };
        dispatch({ type: ActionType.CREATE_SERVICE_PURCHASE, payload: newServicePurchase });
        showToast(t('service_order_success'), 'success');
        setServiceItems([]);
    };


    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">{t('order')}</h1>
                <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg">
                    <TabButton isActive={activeTab === 'products'} onClick={() => setActiveTab('products')} text={t('purchase_products')} />
                    <TabButton isActive={activeTab === 'services'} onClick={() => setActiveTab('services')} text={t('other_services')} />
                </div>
            </div>

            {activeTab === 'products' ? (
                // --- PRODUCT PURCHASE UI ---
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col">
                        <div className="p-4 border-b dark:border-gray-700">
                            <div className="relative">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2"/>
                                <input type="text" placeholder={t('search_products_to_order')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"/>
                            </div>
                        </div>
                        <div className="flex-grow overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {filteredProducts.map(product => (
                                <div key={product.id} onClick={() => addToProductOrder(product)} className="cursor-pointer group bg-gray-50 dark:bg-gray-700 rounded-lg p-2 flex flex-col text-center shadow hover:shadow-lg transition-shadow">
                                    <img src={product.imageUrl} alt={product.name} className="h-20 w-20 object-cover rounded-md mb-2 mx-auto" onError={handleImageError}/>
                                    <div className="flex-grow flex flex-col justify-center">
                                        <p className="font-semibold text-sm leading-tight">{product.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{categoryMap.get(product.categoryId) || 'N/A'}</p>
                                    </div>
                                    <div className="mt-2 text-xs w-full">
                                        <p className="font-medium text-gray-600 dark:text-gray-300">{t('sale_rate')}: <span className="font-bold">{currencyFormatter.format(product.price)}</span></p>
                                        <p className="text-gray-500 dark:text-gray-400">{t('current_stock')}: {product.stock} {product.unit}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col">
                        <h2 className="text-xl font-bold p-4 border-b dark:border-gray-700">{t('new_order')}</h2>
                        <div className="p-4"><label htmlFor="supplier" className="block text-sm font-medium mb-1">{t('supplier')}</label><select id="supplier" value={selectedSupplierId} onChange={(e) => setSelectedSupplierId(e.target.value)} className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500">{suppliers.map(s => <option key={s.id} value={s.id}>{s.company}</option>)}</select></div>
                        <div className="flex-grow overflow-y-auto p-4 space-y-3">
                            {productOrder.map(item => { const product = products.find(p => p.id === item.productId); if (!product) return null; const saleRate = product.price; const purchaseRate = item.costPrice; const profitPercentage = purchaseRate > 0 ? ((saleRate - purchaseRate) / purchaseRate) * 100 : 0; const profitColor = profitPercentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
                                return (<div key={item.productId} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg space-y-3 shadow-sm"><div className="flex justify-between items-start"><div className="flex items-center space-x-3"><img src={product.imageUrl} alt={product.name} className="h-10 w-10 rounded-md object-cover" onError={handleImageError}/><div><p className="font-semibold text-sm">{product.name}</p><p className="text-xs text-gray-500 dark:text-gray-400">{categoryMap.get(product.categoryId) || 'N/A'}</p></div></div><button onClick={() => removeFromProductOrder(item.productId)} className="text-red-500 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"><XMarkIcon className="h-5 w-5"/></button></div><div className="grid grid-cols-3 gap-x-4 gap-y-2"><div className="col-span-1"><label htmlFor={`cost-${product.id}`} className="block text-xs font-medium text-gray-600 dark:text-gray-400">{t('purchase_rate')}</label><input id={`cost-${product.id}`} type="number" value={item.costPrice} onChange={(e) => updateProductItem(item.productId, item.quantity, parseFloat(e.target.value) || 0)} className="w-full p-1 text-sm rounded border bg-white dark:bg-gray-600 dark:border-gray-500 focus:ring-primary-500 focus:border-primary-500" step="0.01"/></div><div className="col-span-1"><label className="block text-xs font-medium text-gray-600 dark:text-gray-400">{t('sale_rate')}</label><p className="p-1.5 font-semibold text-sm">{currencyFormatter.format(saleRate)}</p></div><div className="col-span-1"><label className="block text-xs font-medium text-gray-600 dark:text-gray-400">{t('profit_margin')}</label><p className={`p-1.5 font-bold text-sm ${profitColor}`}>{profitPercentage.toFixed(1)}%</p></div><div className="col-span-3"><label htmlFor={`qty-${product.id}`} className="block text-xs font-medium text-gray-600 dark:text-gray-400">{t('quantity')}</label><div className="flex items-center mt-1"><button onClick={() => updateProductItem(item.productId, item.quantity - 1, item.costPrice)} className="px-3 py-1 rounded-l-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 font-bold text-lg leading-tight">-</button><input id={`qty-${product.id}`} type="number" value={item.quantity} onChange={(e) => updateProductItem(item.productId, parseInt(e.target.value, 10) || 0, item.costPrice)} className="w-16 text-center p-1 border-t border-b bg-white dark:bg-gray-700 dark:border-gray-500 focus:outline-none"/><button onClick={() => updateProductItem(item.productId, item.quantity + 1, item.costPrice)} className="px-3 py-1 rounded-r-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 font-bold text-lg leading-tight">+</button><span className="ml-2 text-gray-500 dark:text-gray-400 text-sm">{product.unit}</span></div></div></div></div>);
                            })}
                            {productOrder.length === 0 && <p className="text-center text-gray-500 pt-10">{t('select_products_to_order')}</p>}
                        </div>
                        <div className="p-4 border-t dark:border-gray-700 space-y-3"><div className="flex justify-between font-bold text-lg"><span>{t('total_cost')}</span><span>{currencyFormatter.format(productOrderTotal)}</span></div><button onClick={handleCompleteProductPurchase} disabled={productOrder.length === 0 || !selectedSupplierId} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors mt-2">{t('place_order')}</button></div>
                    </div>
                </div>
            ) : (
                // --- SERVICE PURCHASE UI ---
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col flex-grow">
                    <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-xl font-bold">{t('service_order')}</h2>
                        <div className="w-full max-w-sm">
                             <label htmlFor="service-supplier" className="block text-sm font-medium mb-1">{t('supplier')}</label>
                             <select id="service-supplier" value={selectedSupplierId} onChange={(e) => setSelectedSupplierId(e.target.value)} className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.company}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex-grow overflow-y-auto p-4 space-y-3">
                        {serviceItems.map(item => (
                             <div key={item.id} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg flex items-start gap-4">
                                <div className="flex-grow space-y-2">
                                    <input type="text" placeholder={t('service_description')} value={item.description} onChange={e => handleUpdateService(item.id, 'description', e.target.value)} className="w-full p-2 text-sm rounded border bg-white dark:bg-gray-600 dark:border-gray-500" />
                                </div>
                                <div className="w-40">
                                    <label className="block text-xs font-medium text-gray-500">{t('cost')}</label>
                                    <input type="number" value={item.cost} onChange={e => handleUpdateService(item.id, 'cost', e.target.value)} className="w-full p-2 text-sm rounded border bg-white dark:bg-gray-600 dark:border-gray-500" />
                                </div>
                                <button onClick={() => handleRemoveService(item.id)} className="p-2 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 mt-5"><TrashIcon className="h-5 w-5"/></button>
                             </div>
                        ))}
                         {serviceItems.length === 0 && <p className="text-center text-gray-500 pt-10">{t('no_services_in_order')}</p>}
                         <button onClick={handleAddService} className="w-full mt-4 text-primary-600 border-2 border-dashed border-primary-500/50 rounded-lg py-3 flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-900/50 transition-colors font-semibold">
                            <PlusIcon className="h-5 w-5 mr-2"/> {t('add_service')}
                        </button>
                    </div>
                    <div className="p-4 border-t dark:border-gray-700 space-y-3">
                        <div className="flex justify-between font-bold text-lg"><span>{t('total_cost')}</span><span>{currencyFormatter.format(serviceOrderTotal)}</span></div>
                        <button onClick={handlePlaceServiceOrder} disabled={serviceItems.length === 0 || !selectedSupplierId} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors mt-2">{t('place_order')}</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Purchases;