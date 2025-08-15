import React, { useContext, useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import { ActionType, Product, SaleItem, Sale, Customer, ProductCategory } from '../types';
import {
    MagnifyingGlassIcon, PlusIcon, MinusIcon, XCircleIcon, ChevronDownIcon, QrCodeIcon, UserGroupIcon,
    BanknotesIcon, CreditCardIcon, DevicePhoneMobileIcon, XMarkIcon as XMarkIconSolid
} from '@heroicons/react/24/solid';
import { PrintModal } from '../components/PrintModal';
import { useTranslation, TranslationKey, handleImageError } from '../hooks/useTranslation';
import { useToast } from '../context/ToastContext';
import { calculateProductPrice } from '../utils/priceCalculator';
import { FormModal } from '../components/FormModal';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { ConfirmationModal } from '../components/ConfirmationModal';

// --- SUB-COMPONENTS for the new Sales Page UI ---

const ProductCard: React.FC<{ product: Product; onAddToCart: (product: Product) => void; }> = ({ product, onAddToCart }) => {
    const { state } = useContext(AppContext);
    const { t, lang, currency } = useTranslation();
    const { finalPrice, saveAmount, originalPrice, mrp } = useMemo(() => calculateProductPrice(product, state.settings), [product, state.settings]);
    const currencyFormatter = new Intl.NumberFormat(lang, { style: 'currency', currency });
    const isOutOfStock = product.stock <= 0;
    const isLowStock = product.stock > 0 && product.stock < 10;

    const stockIndicator = () => {
        if (isOutOfStock) {
            return (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-white font-bold text-sm bg-red-600 px-2 py-1 rounded">{t('out_of_stock')}</span>
                </div>
            );
        }
        
        let bgColor = 'bg-green-500 bg-opacity-80';
        if (isLowStock) {
            bgColor = 'bg-yellow-500 bg-opacity-80';
        }
        
        return (
             <div className={`absolute top-1 right-1 text-white text-xs font-bold px-2 py-0.5 rounded-full ${bgColor} shadow`}>
                {product.stock} {product.unit}
            </div>
        );
    };

    return (
        <div
            onClick={() => !isOutOfStock && onAddToCart(product)}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden group transition-all duration-200 ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg hover:-translate-y-1'}`}
        >
            <div className="relative">
                <img src={product.imageUrl} alt={product.name} className="w-full h-28 object-cover" onError={handleImageError} />
                {stockIndicator()}
            </div>
            <div className="p-3">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white truncate group-hover:text-primary-600">{product.name}</h3>
                <div className="mt-1">
                    <span className="text-lg font-bold text-primary-600 dark:text-primary-400">{currencyFormatter.format(finalPrice)}</span>
                    {saveAmount > 0 && <span className="ml-2 text-xs text-gray-500 line-through">{currencyFormatter.format(mrp || originalPrice)}</span>}
                </div>
            </div>
        </div>
    );
};

const CategoryDropdown: React.FC<{ categories: (ProductCategory & {id: 'all' | string})[], selectedCategory: string, onSelect: (categoryId: string) => void }> = ({ categories, selectedCategory, onSelect }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedCategoryName = categories.find(c => c.id === selectedCategory)?.name || t('all_categories');

    const filteredCategories = useMemo(() => {
        return categories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [categories, searchTerm]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (categoryId: string) => {
        onSelect(categoryId);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className="relative flex-shrink-0" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 text-base rounded-lg bg-white dark:bg-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
                <span className="font-medium">{selectedCategoryName}</span>
                <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-10 top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700">
                    <div className="p-2">
                        <input
                            type="text"
                            placeholder={t('search') + '...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                            className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>
                    <ul className="max-h-60 overflow-y-auto p-1">
                        {filteredCategories.map(cat => (
                            <li key={cat.id}>
                                <button
                                    onClick={() => handleSelect(cat.id)}
                                    className={`w-full text-left px-3 py-2 text-sm rounded-md ${selectedCategory === cat.id ? 'bg-primary-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    {cat.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};


// --- MAIN SALES COMPONENT ---
const Sales: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { t, lang, currency } = useTranslation();
    const { showToast } = useToast();
    const { settings, products, customers } = state;

    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<SaleItem[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState(customers.find(c => c.id === 'cust_walkin')?.id || customers[0]?.id || '');
    const [completedSale, setCompletedSale] = useState<Sale | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    
    // Modal states
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isClearCartModalOpen, setIsClearCartModalOpen] = useState(false);
    const [vatPercentage, setVatPercentage] = useState(0);
    const [invoiceDiscount, setInvoiceDiscount] = useState(0);

    // Refs
    const searchInputRef = useRef<HTMLInputElement>(null);
    
    const currencyFormatter = new Intl.NumberFormat(lang, { style: 'currency', currency });

    // Memoized data
    const selectedCustomer = useMemo(() => customers.find(c => c.id === selectedCustomerId), [customers, selectedCustomerId]);
    
    const categories = useMemo(() => [
        { id: 'all', name: t('all_categories'), enabled: true },
        ...settings.productCategories.filter(c => c.enabled)
    ], [settings.productCategories, t]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const searchMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
            const categoryMatch = selectedCategory === 'all' || p.categoryId === selectedCategory;
            return !p.isDeleted && searchMatch && categoryMatch;
        });
    }, [products, searchTerm, selectedCategory]);

    const { subtotal, taxAmount, grandTotal } = useMemo(() => {
        const subtotal = cart.reduce((total, item) => total + (item.priceAtSale * item.quantity), 0);
        const taxAmount = subtotal * (vatPercentage / 100);
        const grandTotal = (subtotal + taxAmount) - invoiceDiscount;
        return { subtotal, taxAmount, grandTotal };
    }, [cart, vatPercentage, invoiceDiscount]);

    // Handlers
    const addToCart = useCallback((product: Product) => {
        if (product.stock <= 0) {
             showToast(t('out_of_stock'), 'error');
             return;
        }
        const { finalPrice } = calculateProductPrice(product, settings);
        const existingItem = cart.find(item => item.productId === product.id);
        if (existingItem) {
            if (product.stock > existingItem.quantity) {
                setCart(cart.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item));
            } else {
                showToast(t('stock_exceeded_error'), 'error');
            }
        } else {
            setCart([...cart, { productId: product.id, quantity: 1, priceAtSale: finalPrice, discount: 0, returnedQuantity: 0 }]);
        }
    }, [cart, settings, showToast, t]);

    const handleBarcodeScan = useCallback((barcode: string) => {
        const product = products.find(p => !p.isDeleted && p.id === barcode.trim());
        if (product) {
            addToCart(product);
            return true;
        } else {
            showToast(t('product_not_found_error'), 'error');
            return false;
        }
    }, [products, addToCart, showToast, t]);

    const updateCartItemQuantity = (productId: string, newQuantity: number) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        if (newQuantity <= 0) {
            setCart(cart => cart.filter(item => item.productId !== productId));
        } else if (newQuantity > product.stock) {
            showToast(t('stock_exceeded_error'), 'error');
        } else {
            setCart(cart => cart.map(item => item.productId === productId ? { ...item, quantity: newQuantity } : item));
        }
    };
    
    const handleClearCart = () => {
        setCart([]);
        setIsClearCartModalOpen(false);
    };

    const handleCheckout = () => {
        if (cart.length === 0) {
            showToast(t('cart_is_empty'), 'error');
            return;
        }
        setIsPaymentModalOpen(true);
    };

    const handleConfirmPayment = (paymentMethod: Sale['paymentMethod'], cardMachineId?: string, partialAmount?: number) => {
        const saleCogs = cart.reduce((totalCost, item) => {
            const product = products.find(p => p.id === item.productId);
            return totalCost + ((product?.purchasePrice || 0) * item.quantity);
        }, 0);

        const newSale: Sale = {
            id: `CM-${(state.sales.length + 1).toString().padStart(5, '0')}`,
            customerId: selectedCustomerId,
            items: cart,
            subtotal: subtotal,
            vatPercentage: vatPercentage,
            discountAmount: invoiceDiscount,
            total: grandTotal,
            cogs: saleCogs,
            paymentMethod,
            paidAmount: paymentMethod === 'due' ? (partialAmount || 0) : grandTotal,
            date: new Date().toISOString(),
            soldByUserId: state.currentUser?.id,
            ...(paymentMethod === 'card' && { cardMachineId }),
        };

        dispatch({ type: ActionType.CREATE_SALE, payload: newSale });
        showToast(t('payment_successful'), 'success');
        setCompletedSale(newSale);
        
        setCart([]);
        setIsPaymentModalOpen(false);
        setSearchTerm('');
        setSelectedCustomerId(customers.find(c => c.id === 'cust_walkin')?.id || customers[0]?.id || '');
        setVatPercentage(0);
        setInvoiceDiscount(0);
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F1') { e.preventDefault(); searchInputRef.current?.focus(); }
            if (e.key === 'F2') { e.preventDefault(); setIsCustomerModalOpen(true); }
            if (e.key === 'F9') { e.preventDefault(); handleCheckout(); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
                {/* --- Left Panel: Product Selection --- */}
                <div className="lg:col-span-2 flex flex-col h-full gap-4">
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="flex-grow relative">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-4 -translate-y-1/2" />
                            <input
                                ref={searchInputRef} type="text" placeholder={t('search_for_products')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="w-full text-base p-3 pl-12 rounded-lg bg-white dark:bg-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                             <button onClick={() => setIsScannerOpen(true)} className="absolute top-1/2 right-4 -translate-y-1/2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" title={t('scan_code')}>
                                <QrCodeIcon className="h-6 w-6 text-gray-500" />
                            </button>
                        </div>
                        <div className="w-full max-w-xs">
                             <CategoryDropdown categories={categories} selectedCategory={selectedCategory} onSelect={setSelectedCategory} />
                        </div>
                    </div>
                    <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredProducts.map(p => <ProductCard key={p.id} product={p} onAddToCart={addToCart} />)}
                        </div>
                    </div>
                </div>

                {/* --- Right Panel: Cart --- */}
                <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col h-full">
                    <div className="p-4 border-b dark:border-gray-700 flex-shrink-0">
                        <button onClick={() => setIsCustomerModalOpen(true)} className="w-full flex items-center justify-between p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600">
                             <div className="flex items-center space-x-2">
                                <UserGroupIcon className="h-6 w-6 text-primary-500"/>
                                <span className="font-semibold text-left">{selectedCustomer?.name || t('customer_not_selected')}</span>
                            </div>
                            <ChevronDownIcon className="h-4 w-4 text-gray-500"/>
                        </button>
                    </div>

                    <div className="flex-grow overflow-y-auto p-4 space-y-3">
                         {cart.length > 0 ? cart.map(item => {
                             const product = products.find(p => p.id === item.productId);
                             if (!product) return null;
                             return (
                                 <div key={item.productId} className="flex items-center space-x-3">
                                     <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-md object-cover" onError={handleImageError}/>
                                     <div className="flex-grow">
                                         <p className="text-sm font-semibold truncate">{product.name}</p>
                                         <div className="flex items-center space-x-2 mt-1">
                                             <button onClick={() => updateCartItemQuantity(product.id, item.quantity - 1)} className="p-1 rounded-full bg-gray-200 dark:bg-gray-600"><MinusIcon className="h-3 w-3"/></button>
                                             <input type="number" value={item.quantity} onChange={(e) => updateCartItemQuantity(product.id, parseInt(e.target.value) || 0)} className="w-10 text-center text-sm p-0.5 border rounded-md dark:bg-gray-700"/>
                                             <button onClick={() => updateCartItemQuantity(product.id, item.quantity + 1)} className="p-1 rounded-full bg-gray-200 dark:bg-gray-600"><PlusIcon className="h-3 w-3"/></button>
                                         </div>
                                     </div>
                                     <div className="text-right">
                                         <p className="font-semibold text-sm">{currencyFormatter.format(item.priceAtSale * item.quantity)}</p>
                                         <button onClick={() => updateCartItemQuantity(product.id, 0)} className="text-xs text-red-500 hover:underline">{t('remove_image')}</button>
                                     </div>
                                 </div>
                             );
                         }) : (
                             <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                 <BanknotesIcon className="h-20 w-20" />
                                 <p className="mt-2 text-sm">{t('cart_is_empty')}</p>
                             </div>
                         )}
                    </div>
                    
                    <div className="p-4 border-t dark:border-gray-700 space-y-2 flex-shrink-0">
                        <div className="flex justify-between text-sm"><span>{t('subtotal')}</span><span>{currencyFormatter.format(subtotal)}</span></div>
                        <div className="flex items-center justify-between text-sm">
                            <label htmlFor="vat-tax" className="text-gray-600 dark:text-gray-400">{t('vat_tax')}</label>
                            <div className="flex items-center">
                                <input
                                    id="vat-tax"
                                    type="number"
                                    value={vatPercentage}
                                    onChange={(e) => setVatPercentage(parseFloat(e.target.value) || 0)}
                                    className="w-20 p-1 text-right border rounded-md dark:bg-gray-700"
                                />
                                <span className="ml-1">%</span>
                            </div>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                            <span></span>
                            <span>+ {currencyFormatter.format(taxAmount)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <label htmlFor="invoice-discount" className="text-gray-600 dark:text-gray-400">{t('invoice_discount')}</label>
                            <input
                                id="invoice-discount"
                                type="number"
                                value={invoiceDiscount}
                                onChange={(e) => setInvoiceDiscount(parseFloat(e.target.value) || 0)}
                                className="w-28 p-1 text-right border rounded-md dark:bg-gray-700"
                            />
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t dark:border-gray-600 pt-2 mt-2">
                            <span>{t('grand_total')}</span>
                            <span className="text-primary-600 dark:text-primary-400">{currencyFormatter.format(grandTotal)}</span>
                        </div>
                        <div className="flex gap-2 pt-2">
                             <button onClick={() => setIsClearCartModalOpen(true)} disabled={cart.length === 0} className="w-1/3 bg-red-100 text-red-700 font-bold py-3 px-4 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed">
                                {t('clear_all_local_data')}
                            </button>
                            <button onClick={handleCheckout} disabled={cart.length === 0} className="w-2/3 bg-primary-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed">
                                {t('checkout')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Modals */}
            <CustomerSelectionModal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} onSelect={setSelectedCustomerId} />
            <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onConfirm={handleConfirmPayment} totalAmount={grandTotal} />
            <BarcodeScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScanSuccess={(text) => { setIsScannerOpen(false); handleBarcodeScan(text); }} />
            <ConfirmationModal isOpen={isClearCartModalOpen} onClose={() => setIsClearCartModalOpen(false)} onConfirm={handleClearCart} title="Clear Cart?" message="Are you sure you want to remove all items from the cart?" />
            {completedSale && <PrintModal sale={completedSale} onClose={() => setCompletedSale(null)} />}
        </>
    );
};

// Re-integrated modal components for simplicity as they are only used here.
const CustomerSelectionModal: React.FC<{ isOpen: boolean; onClose: () => void; onSelect: (customerId: string) => void; }> = ({ isOpen, onClose, onSelect }) => {
    const { state } = useContext(AppContext);
    const { customers } = state;
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCustomers = useMemo(() =>
        customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())),
        [customers, searchTerm]
    );

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={t('customers')} size="lg">
            <div className="space-y-4">
                <input
                    type="text"
                    placeholder={t('search') + '...'}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600"
                />
                <ul className="max-h-80 overflow-y-auto space-y-2">
                    {filteredCustomers.map(customer => (
                        <li key={customer.id}>
                            <button
                                onClick={() => { onSelect(customer.id); onClose(); }}
                                className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <p className="font-semibold">{customer.name}</p>
                                <p className="text-sm text-gray-500">{customer.phone}</p>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </FormModal>
    );
};

const PaymentModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: (paymentMethod: Sale['paymentMethod'], cardMachineId?: string, partialAmount?: number) => void; totalAmount: number; }> = ({ isOpen, onClose, onConfirm, totalAmount }) => {
    const { state } = useContext(AppContext);
    const { t, lang, currency } = useTranslation();
    const activeCardMachines = useMemo(() => state.cardMachines.filter(m => !m.isDeleted && m.status === 'Connected'), [state.cardMachines]);
    const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('cash');
    const [cardMachineId, setCardMachineId] = useState(activeCardMachines[0]?.id || '');
    const [amountTendered, setAmountTendered] = useState(0);
    const [partialAmountPaid, setPartialAmountPaid] = useState(0);
    const [isMobileBankingOpen, setIsMobileBankingOpen] = useState(false);
    const currencyFormatter = new Intl.NumberFormat(lang, { style: 'currency', currency });
    const changeDue = amountTendered > totalAmount ? amountTendered - totalAmount : 0;

    const confirmButtonText = useMemo(() => {
        if (paymentMethod === 'due') {
            return partialAmountPaid > 0 ? t('confirm_and_create_due_partial') : t('confirm_and_create_due');
        }
        return t('confirm_payment');
    }, [paymentMethod, partialAmountPaid, t]);

    const paymentMethods: { primary: { id: Sale['paymentMethod'], icon: React.FC<any> }[], mobile: Sale['paymentMethod'][] } = {
        primary: [{ id: 'cash', icon: BanknotesIcon }, { id: 'card', icon: CreditCardIcon }, { id: 'due', icon: XCircleIcon }],
        mobile: ['bKash', 'nagad', 'rocket', 'upay']
    };
    const isMobileMethodSelected = (paymentMethods.mobile as readonly string[]).includes(paymentMethod);

    useEffect(() => {
        if (paymentMethod !== 'due') {
            setPartialAmountPaid(0);
        }
        if (paymentMethod !== 'cash') {
            setAmountTendered(0);
        }
    }, [paymentMethod]);


    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={t('payment_details')} size="md">
            <div className="space-y-6">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-sm uppercase text-gray-500">{t('grand_total')}</p>
                    <p className="text-5xl font-bold tracking-tight">{currencyFormatter.format(totalAmount)}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {paymentMethods.primary.map(method => (
                        <button key={method.id} onClick={() => setPaymentMethod(method.id)} className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center transition-colors ${paymentMethod === method.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/50' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                            <method.icon className="h-6 w-6 mb-1"/>
                            <span className="text-sm font-semibold">{t(method.id as TranslationKey)}</span>
                        </button>
                    ))}
                </div>
                <div>
                    <button type="button" onClick={() => setIsMobileBankingOpen(!isMobileBankingOpen)} className={`w-full p-3 text-sm rounded-lg border-2 capitalize transition-colors flex items-center justify-between ${isMobileMethodSelected ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/50' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        <span className="font-semibold flex items-center"><DevicePhoneMobileIcon className="h-5 w-5 mr-2"/>{t('online_mobile_banking')}</span>
                        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isMobileBankingOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isMobileBankingOpen && <div className="grid grid-cols-2 gap-2 mt-2 pt-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700">{paymentMethods.mobile.map(method => <button key={method} type="button" onClick={() => setPaymentMethod(method)} className={`p-2 text-sm rounded-lg border-2 capitalize transition-colors ${paymentMethod === method ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/50' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>{t(method as TranslationKey)}</button>)}</div>}
                </div>
                {paymentMethod === 'cash' && <div className="grid grid-cols-2 gap-4 pt-4 border-t dark:border-gray-700"><div><label className="block text-sm font-medium mb-1">{t('amount_tendered')}</label><input type="number" onChange={e => setAmountTendered(parseFloat(e.target.value) || 0)} className="w-full p-2 border rounded-md" /></div><div className="text-right"><p className="text-sm font-medium">{t('change_due')}</p><p className="text-2xl font-bold text-green-600">{currencyFormatter.format(changeDue)}</p></div></div>}
                {paymentMethod === 'card' && <div className="pt-4 border-t dark:border-gray-700"><label className="block text-sm font-medium mb-1">{t('select_card_machine')}</label><select value={cardMachineId} onChange={e => setCardMachineId(e.target.value)} className="w-full p-2 border rounded-md">{activeCardMachines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>}
                {paymentMethod === 'due' && (
                    <div className="pt-4 border-t dark:border-gray-700">
                        <label htmlFor="partial-payment" className="block text-sm font-medium mb-1">
                            {t('amount_paid')} ({t('optional')})
                        </label>
                        <input
                            id="partial-payment"
                            type="number"
                            value={partialAmountPaid}
                            onChange={e => setPartialAmountPaid(Math.max(0, Math.min(totalAmount, parseFloat(e.target.value) || 0)))}
                            className="w-full p-2 border rounded-md"
                        />
                    </div>
                )}
                <button onClick={() => onConfirm(paymentMethod, paymentMethod === 'card' ? cardMachineId : undefined, paymentMethod === 'due' ? partialAmountPaid : undefined)} className="w-full bg-primary-600 text-white font-bold py-3 text-lg rounded-lg hover:bg-primary-700">{confirmButtonText}</button>
            </div>
        </FormModal>
    );
};

export default Sales;
