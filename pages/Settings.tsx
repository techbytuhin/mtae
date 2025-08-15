import React, { useContext, useState, ChangeEvent } from 'react';
import { AppContext } from '../context/AppContext';
import { ActionType, Settings as SettingsType, SocialLink, User, ProductCategory, DiscountOffer, Product } from '../types';
import { useTranslation, TranslationKey } from '../hooks/useTranslation';
import { PlusIcon, TrashIcon, ShieldCheckIcon, LockClosedIcon, CircleStackIcon, DevicePhoneMobileIcon, ComputerDesktopIcon, ArrowRightOnRectangleIcon, ExclamationTriangleIcon, PencilIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { ImageUploader } from '../components/ImageUploader';
import { useToast } from '../context/ToastContext';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { FormModal } from '../components/FormModal';

// Helper components for form fields
const InputField = ({ label, name, ...props }: { label: string, name: string, [key: string]: any }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium mb-1 dark:text-gray-300">{label}</label>
        <input id={name} name={name} {...props} className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"/>
    </div>
);

const SelectField = ({ label, name, options, ...props }: { label: string, name: string, options: {value: string, label: string}[], [key: string]: any }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium mb-1 dark:text-gray-300">{label}</label>
        <select id={name} name={name} {...props} className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500">
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

const CheckboxField = ({ label, description, ...props }: { label: string, description?: string, [key: string]: any }) => (
    <div>
        <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" {...props} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"/>
            <span className="text-sm">{label}</span>
        </label>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">{description}</p>}
    </div>
);

const SettingsCard: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg">
        <div className="p-6 border-b dark:border-gray-700">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        </div>
        <div className="p-6 space-y-4">
            {children}
        </div>
    </div>
);

const PromotionForm: React.FC<{ offer: DiscountOffer | null; onSave: (offer: DiscountOffer) => void; onCancel: () => void }> = ({ offer, onSave, onCancel }) => {
    const { state } = useContext(AppContext);
    const { products, settings } = state;
    const { t } = useTranslation();
    const [formData, setFormData] = useState<Omit<DiscountOffer, 'id'>>({
        name: offer?.name || '',
        discountType: offer?.discountType || 'percentage',
        discountValue: offer?.discountValue || 0,
        appliesTo: offer?.appliesTo || 'all',
        targetIds: offer?.targetIds || [],
        enabled: offer?.enabled ?? true,
        expiryDate: offer?.expiryDate || '',
    });

    const handleMultiSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const options = e.target.options;
        const value: string[] = [];
        for (let i = 0, l = options.length; i < l; i++) {
            if (options[i].selected) {
                value.push(options[i].value);
            }
        }
        setFormData(prev => ({ ...prev, targetIds: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalOffer: DiscountOffer = {
            id: offer?.id || `offer_${crypto.randomUUID()}`,
            ...formData,
        };
        onSave(finalOffer);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <InputField label={t('offer_name')} name="name" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} required />
            <div className="grid grid-cols-2 gap-4">
                 <SelectField label={t('discount_type')} name="discountType" value={formData.discountType} onChange={e => setFormData(p => ({...p, discountType: e.target.value as any}))} options={[ { value: 'percentage', label: t('percentage') }, { value: 'fixed', label: t('fixed_amount') } ]} />
                <InputField label={t('value')} name="discountValue" type="number" step="0.01" value={formData.discountValue} onChange={e => setFormData(p => ({...p, discountValue: parseFloat(e.target.value) || 0}))} required />
            </div>
            <SelectField label={t('applies_to')} name="appliesTo" value={formData.appliesTo} onChange={e => setFormData(p => ({...p, appliesTo: e.target.value as any, targetIds: []}))} options={[ { value: 'all', label: t('all_products') }, { value: 'categories', label: t('specific_categories') }, { value: 'products', label: t('specific_products') } ]} />
            
            {formData.appliesTo === 'categories' && (
                <div>
                    <label className="block text-sm font-medium mb-1">{t('target_categories')}</label>
                    <select multiple value={formData.targetIds} onChange={handleMultiSelectChange} className="w-full p-2 border rounded-md h-32 bg-white dark:bg-gray-700 dark:border-gray-600">
                        {settings.productCategories.filter(c => c.enabled).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            )}
             {formData.appliesTo === 'products' && (
                <div>
                    <label className="block text-sm font-medium mb-1">{t('target_products')}</label>
                    <select multiple value={formData.targetIds} onChange={handleMultiSelectChange} className="w-full p-2 border rounded-md h-32 bg-white dark:bg-gray-700 dark:border-gray-600">
                        {products.filter(p => !p.isDeleted).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            )}
            
            <InputField label={t('expiry_date')} name="expiryDate" type="date" value={formData.expiryDate?.split('T')[0] || ''} onChange={e => setFormData(p => ({...p, expiryDate: e.target.value}))} />
            <CheckboxField label={t('enabled')} name="enabled" checked={formData.enabled} onChange={e => setFormData(p => ({...p, enabled: e.target.checked}))} />

            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="py-2 px-4 rounded-lg bg-gray-500 text-white hover:bg-gray-600">{t('cancel')}</button>
                <button type="submit" className="py-2 px-4 rounded-lg bg-primary-600 text-white hover:bg-primary-700">{t('save')}</button>
            </div>
        </form>
    );
};

const themes = [
    { value: 'light', nameKey: 'indigo_theme' as TranslationKey, colorClass: 'bg-indigo-500' },
    { value: 'dark', nameKey: 'dark_theme' as TranslationKey, colorClass: 'bg-slate-800 border-2 border-slate-500' },
    { value: 'light-green', nameKey: 'light_green_theme' as TranslationKey, colorClass: 'bg-green-500' },
    { value: 'amber', nameKey: 'amber_theme' as TranslationKey, colorClass: 'bg-amber-500' },
    { value: 'rose', nameKey: 'rose_theme' as TranslationKey, colorClass: 'bg-rose-500' },
    { value: 'teal', nameKey: 'teal_theme' as TranslationKey, colorClass: 'bg-teal-500' },
    { value: 'slate', nameKey: 'slate_theme' as TranslationKey, colorClass: 'bg-slate-500' },
    { value: 'astra', nameKey: 'astra_theme' as TranslationKey, colorClass: 'bg-violet-500' },
];

const ThemePicker = ({ currentTheme, onChange }: { currentTheme: string, onChange: (e: any) => void }) => {
    const { t } = useTranslation();
    return (
        <div>
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">{t('theme')}</label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-4">
                {themes.map(theme => (
                    <div key={theme.value} className="flex flex-col items-center space-y-1">
                        <button
                            type="button"
                            onClick={() => onChange({ target: { name: 'theme', value: theme.value } })}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ring-offset-2 dark:ring-offset-gray-800 ${theme.colorClass} ${currentTheme === theme.value ? 'ring-2 ring-primary-500' : 'hover:ring-2 hover:ring-primary-300'}`}
                            aria-label={t(theme.nameKey)}
                        >
                            {currentTheme === theme.value && (
                                <CheckIcon className="h-6 w-6 text-white" />
                            )}
                        </button>
                        <span className="text-xs text-gray-600 dark:text-gray-400">{t(theme.nameKey)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const GatewayConfigurator = ({ title, gateways, gatewayType, onChange }: {
    title: string;
    gateways: { [key: string]: { enabled: boolean; apiKey: string; apiSecret: string } };
    gatewayType: 'cardPaymentGateways' | 'mobileBankingGateways';
    onChange: (gatewayType: 'cardPaymentGateways' | 'mobileBankingGateways', key: string, field: string, value: string | boolean) => void;
}) => {
    const { t } = useTranslation();
    return (
        <div>
            <h4 className="text-base font-semibold mb-3 border-b dark:border-gray-700 pb-2">{title}</h4>
            <div className="space-y-4 pt-2">
                {Object.entries(gateways || {}).map(([key, gateway]) => (
                    <div key={key} className="p-3 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <h5 className="font-semibold capitalize flex justify-between items-center">{key}
                            <CheckboxField label={t('enabled')} checked={gateway.enabled} onChange={(e: any) => onChange(gatewayType, key, 'enabled', e.target.checked)} />
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <InputField name={`${key}-apiKey`} label={t('api_key')} value={gateway.apiKey} onChange={(e: any) => onChange(gatewayType, key, 'apiKey', e.target.value)} disabled={!gateway.enabled} />
                            <InputField name={`${key}-apiSecret`} label={t('api_secret')} value={gateway.apiSecret} onChange={(e: any) => onChange(gatewayType, key, 'apiSecret', e.target.value)} disabled={!gateway.enabled} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


type SettingsTab = 'shop' | 'appearance' | 'system' | 'permissions' | 'security' | 'categories' | 'promotions' | 'gateways';

const Settings: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { t } = useTranslation();
    const { showToast } = useToast();
    const { setPreferences } = useUserPreferences();
    const [formData, setFormData] = useState<SettingsType>(state.settings);
    const [activeTab, setActiveTab] = useState<SettingsTab>('shop');
    const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);
    const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState<DiscountOffer | null>(null);
    const [promoToDelete, setPromoToDelete] = useState<DiscountOffer | null>(null);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
             setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (type === 'datetime-local') {
            // Convert local datetime string to ISO string for storage
            setFormData(prev => ({...prev, [name]: value ? new Date(value).toISOString() : ''}));
        } else {
             setFormData(prev => ({ ...prev, [name]: value }));
             // For user-specific preferences, update them immediately for a "quick change" effect
             if (name === 'language' || name === 'theme' || name === 'currency' || name === 'timeZone') {
                setPreferences({ [name]: value });
             }
        }
    };

    const handleGatewayChange = (gatewayType: 'smsGateway' | 'cardPaymentGateways' | 'mobileBankingGateways', key: string, field: string, value: string | boolean) => {
        setFormData(prev => {
            if (gatewayType === 'smsGateway') {
                return { ...prev, smsGateway: { ...prev.smsGateway!, [field]: value } };
            }
            
            const gateways = { ...(prev as any)[gatewayType] };
            gateways[key] = { ...gateways[key], [field]: value };
            return { ...prev, [gatewayType]: gateways };
        });
    };
    
    const handleCategoryChange = (index: number, field: keyof ProductCategory, value: string | boolean) => {
        setFormData(prev => {
            const newCategories = [...prev.productCategories];
            const categoryToUpdate = { ...newCategories[index], [field]: value };
            newCategories[index] = categoryToUpdate;
            return { ...prev, productCategories: newCategories };
        });
    };

    const handleAddCategory = () => {
        setFormData(prev => ({
            ...prev,
            productCategories: [
                ...prev.productCategories,
                { id: `cat_${crypto.randomUUID()}`, name: 'New Category', enabled: true }
            ]
        }));
    };

    const handleDeleteCategory = (categoryId: string) => {
        const isUsed = state.products.some(p => p.categoryId === categoryId);
        if (isUsed) {
            showToast(t('category_in_use_error'), 'error');
            return;
        }
        setFormData(prev => ({
            ...prev,
            productCategories: prev.productCategories.filter(c => c.id !== categoryId)
        }));
    };

    const handleLogoChange = (newLogoUrl: string) => {
        setFormData(prev => ({ ...prev, shopLogo: newLogoUrl }));
    };

    const handlePermissionChange = (page: string, role: 'sales_manager' | 'staff', isChecked: boolean) => {
        setFormData(prev => {
            const currentRoles = prev.permissions[page] || [];
            let newRoles: Array<User['role']>;
            if (isChecked) {
                newRoles = [...new Set([...currentRoles, role])];
            } else {
                newRoles = currentRoles.filter(r => r !== role);
            }
            return {
                ...prev,
                permissions: {
                    ...prev.permissions,
                    [page]: newRoles,
                }
            };
        });
    };
    
    const handleAddPromo = () => {
        setEditingPromo(null);
        setIsPromoModalOpen(true);
    };

    const handleEditPromo = (offer: DiscountOffer) => {
        setEditingPromo(offer);
        setIsPromoModalOpen(true);
    };
    
    const handleSavePromo = (offer: DiscountOffer) => {
        const action = editingPromo ? ActionType.EDIT_OFFER : ActionType.ADD_OFFER;
        dispatch({ type: action, payload: offer });
        showToast(t(editingPromo ? 'offer_updated_success' : 'offer_added_success'), 'success');
        setIsPromoModalOpen(false);
    };
    
    const handleConfirmDeletePromo = () => {
        if (promoToDelete) {
            dispatch({ type: ActionType.DELETE_OFFER, payload: { offerId: promoToDelete.id } });
            showToast(t('offer_deleted_success'), 'info');
            setPromoToDelete(null);
        }
    };
    
    const handleSocialLinkChange = (index: number, field: 'platform' | 'url', value: string) => {
        setFormData(prev => {
            const newLinks = [...prev.socialLinks];
            newLinks[index] = { ...newLinks[index], [field]: value as any };
            return { ...prev, socialLinks: newLinks };
        });
    };

    const handleAddSocialLink = () => {
        setFormData(prev => ({
            ...prev,
            socialLinks: [
                ...prev.socialLinks,
                { id: `sl_${crypto.randomUUID()}`, platform: 'facebook', url: '' }
            ]
        }));
    };

    const handleDeleteSocialLink = (id: string) => {
        setFormData(prev => ({
            ...prev,
            socialLinks: prev.socialLinks.filter(link => link.id !== id)
        }));
    };

    const handleSave = () => {
        dispatch({ type: ActionType.UPDATE_SETTINGS, payload: formData });
        showToast(t('settings_saved_success'), 'success');
    };

    const handleClearData = () => {
        dispatch({ type: ActionType.CLEAR_ALL_DATA });
        showToast(t('data_cleared_success'), 'info');
        setIsClearDataModalOpen(false);
    };

    const handleLogoutAll = () => {
        showToast(t('all_sessions_logged_out'), 'success');
    };

    const pagesForPermissions: { path: string; nameKey: TranslationKey }[] = [
        { path: '/', nameKey: 'dashboard' },
        { path: '/sales', nameKey: 'billing' },
        { path: '/purchases', nameKey: 'order' },
        { path: '/products', nameKey: 'products' },
        { path: '/customers', nameKey: 'customers' },
        { path: '/suppliers', nameKey: 'suppliers' },
        { path: '/reports', nameKey: 'summary_report' },
        { path: '/users', nameKey: 'users' },
        { path: '/files', nameKey: 'files' },
    ];
    
    const timeZoneOptions = [
      { value: 'UTC', label: 'UTC' },
      { value: 'America/New_York', label: 'America/New_York (EST)' },
      { value: 'Europe/London', label: 'Europe/London (GMT)' },
      { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
      { value: 'Asia/Dhaka', label: 'Asia/Dhaka (BST)' },
      { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
      { value: 'Asia/Kuala_Lumpur', label: 'Asia/Kuala_Lumpur (MYT)' },
      { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
    ];
    
    const socialPlatformOptions: {value: SocialLink['platform'], label: string}[] = [
        { value: 'facebook', label: 'Facebook' },
        { value: 'twitter', label: 'Twitter / X' },
        { value: 'instagram', label: 'Instagram' },
        { value: 'linkedin', label: 'LinkedIn' },
        { value: 'youtube', label: 'YouTube' },
        { value: 'whatsapp', label: 'WhatsApp' },
        { value: 'telegram', label: 'Telegram' },
        { value: 'gmail', label: 'Gmail' },
        { value: 'website', label: 'Website' },
    ];

    const formatForDateTimeLocal = (isoString?: string) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return '';
        const pad = (num: number) => String(num).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    
    const TabButton = ({ tab, label }: { tab: SettingsTab, label: string }) => (
        <button onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-white dark:bg-gray-800 shadow text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:bg-white/50 dark:hover:bg-gray-800/50'}`}>
            {label}
        </button>
    );

    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                     <h1 className="text-3xl font-bold">{t('settings')}</h1>
                     <button onClick={handleSave} className="bg-primary-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-700 transition-colors">
                        {t('save_changes')}
                    </button>
                </div>

                <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg">
                    <TabButton tab="shop" label={t('shop')} />
                    <TabButton tab="appearance" label={t('appearance')} />
                    <TabButton tab="promotions" label={t('promotions')} />
                    <TabButton tab="system" label={t('system')} />
                    <TabButton tab="categories" label={t('categories')} />
                    <TabButton tab="gateways" label={t('gateways')} />
                    <TabButton tab="security" label={t('security')} />
                    {state.currentUser && ['admin', 'super_user'].includes(state.currentUser.role) && <TabButton tab="permissions" label={t('permissions')} />}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {activeTab === 'shop' && (
                            <>
                             <SettingsCard title={t('shop_information')} description={t('shop_info_desc')}>
                                <InputField label={t('shop_name')} name="shopName" value={formData.shopName} onChange={handleChange} />
                                <InputField label={t('shop_address')} name="shopAddress" value={formData.shopAddress} onChange={handleChange} />
                                <InputField label={t('shop_phone')} name="shopPhone" value={formData.shopPhone} onChange={handleChange} />
                                <ImageUploader label={t('shop_logo')} value={formData.shopLogo} onChange={handleLogoChange} />
                            </SettingsCard>
                            {state.currentUser?.role === 'super_user' && (
                                <SettingsCard title="Social Media Links" description="Manage the social media links displayed in the footer. (Super User only)">
                                    <div className="space-y-3">
                                        {formData.socialLinks.map((link, index) => (
                                            <div key={link.id} className="flex items-center space-x-3 p-2 rounded-md bg-gray-50 dark:bg-gray-700/50">
                                                <div className="w-1/3">
                                                    <select
                                                        value={link.platform}
                                                        onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value)}
                                                        className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600"
                                                    >
                                                        {socialPlatformOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                    </select>
                                                </div>
                                                <input
                                                    type="url"
                                                    value={link.url}
                                                    onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                                                    className="flex-grow p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600"
                                                    placeholder="https://example.com"
                                                />
                                                <button onClick={() => handleDeleteSocialLink(link.id)} className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                                                    <TrashIcon className="h-5 w-5 text-red-500"/>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={handleAddSocialLink} className="mt-4 w-full text-primary-600 border-2 border-primary-500/50 rounded-lg py-2 flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-900/50 transition-colors font-semibold">
                                        <PlusIcon className="h-5 w-5 mr-2"/> Add Social Link
                                    </button>
                                </SettingsCard>
                            )}
                            </>
                        )}
                        {activeTab === 'appearance' && (
                             <SettingsCard title={t('appearance_locale')} description={t('appearance_locale_desc')}>
                                <ThemePicker currentTheme={formData.theme} onChange={handleChange} />
                                <SelectField label={t('language')} name="language" value={formData.language} onChange={handleChange} options={[
                                    {value: 'en', label: 'English'}, {value: 'bn', label: 'Bengali'}, {value: 'hi', label: 'Hindi'},
                                    {value: 'zh', label: 'Chinese'}, {value: 'ja', label: 'Japanese'},
                                    {value: 'ur', label: 'Urdu'}, {value: 'ms', label: 'Malay'},
                                ]}/>
                                <SelectField label={t('currency')} name="currency" value={formData.currency} onChange={handleChange} options={[
                                     {value: 'BDT', label: 'BDT'}, {value: 'INR', label: 'INR'}, {value: 'CNY', label: 'CNY'},
                                     {value: 'USD', label: 'USD'}, {value: 'EUR', label: 'EUR'}, {value: 'GBP', label: 'GBP'},
                                     {value: 'MYR', label: 'MYR'},
                                ]}/>
                                <SelectField label={t('font_family')} name="fontFamily" value={formData.fontFamily} onChange={handleChange} options={[
                                    {value: 'Inter', label: 'Inter'},
                                    {value: 'Hind', label: 'Hind'},
                                    {value: 'Noto Sans', label: 'Noto Sans'},
                                    {value: 'Rubik', label: 'Rubik'},
                                    {value: 'Source Code Pro', label: 'Source Code Pro'},
                                ]}/>
                                <SelectField label={t('time_zone')} name="timeZone" value={formData.timeZone} onChange={handleChange} options={timeZoneOptions} />
                            </SettingsCard>
                        )}
                         {activeTab === 'promotions' && (
                            <>
                                <SettingsCard title={t('promotions')} description={t('promotions_desc')}>
                                   <button onClick={handleAddPromo} className="w-full text-primary-600 border-2 border-primary-500/50 rounded-lg py-2 flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-900/50 transition-colors font-semibold">
                                        <PlusIcon className="h-5 w-5 mr-2"/> {t('add_offer')}
                                    </button>
                                    <div className="space-y-2 pt-4">
                                        {state.settings.specialOffers.length > 0 ? state.settings.specialOffers.map(offer => {
                                            const isExpired = offer.expiryDate && new Date(offer.expiryDate) < new Date();
                                            const status = !offer.enabled ? 'disabled' : isExpired ? 'expired' : 'active';
                                            const statusText = t(`status_${status}` as TranslationKey);
                                            const statusColor = status === 'active' ? 'bg-green-100 text-green-800' : status === 'expired' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800';

                                            return (
                                                <div key={offer.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center">
                                                    <div>
                                                        <p className="font-semibold">{offer.name}</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">{offer.discountType === 'percentage' ? `${offer.discountValue}%` : `$${offer.discountValue}`} off {t(offer.appliesTo as TranslationKey)}</p>
                                                    </div>
                                                    <div className="flex items-center space-x-3">
                                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColor}`}>{statusText}</span>
                                                        <button onClick={() => handleEditPromo(offer)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><PencilIcon className="h-5 w-5 text-primary-500"/></button>
                                                        <button onClick={() => setPromoToDelete(offer)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><TrashIcon className="h-5 w-5 text-red-500"/></button>
                                                    </div>
                                                </div>
                                            );
                                        }) : <p className="text-center text-gray-500 py-4">{t('no_offers_found')}</p>}
                                    </div>
                                </SettingsCard>

                                {state.currentUser?.role === 'super_user' && (
                                    <>
                                        <SettingsCard title={t('special_offer_countdown')} description={t('special_offer_countdown_desc')}>
                                            <CheckboxField 
                                                label={t('enable_special_offer')}
                                                name="countdownOfferEnabled"
                                                checked={!!formData.countdownOfferEnabled}
                                                onChange={handleChange}
                                            />
                                            <InputField
                                                label={t('special_offer_text')}
                                                name="countdownOfferText"
                                                value={formData.countdownOfferText || ''}
                                                onChange={handleChange}
                                                disabled={!formData.countdownOfferEnabled}
                                            />
                                            <InputField
                                                label={t('offer_expiry_date')}
                                                name="countdownOfferExpiry"
                                                type="datetime-local"
                                                value={formatForDateTimeLocal(formData.countdownOfferExpiry)}
                                                onChange={handleChange}
                                                disabled={!formData.countdownOfferEnabled}
                                            />
                                        </SettingsCard>
                                    </>
                                )}
                            </>
                        )}
                        {activeTab === 'system' && (
                             <SettingsCard title={t('system_settings')} description={t('system_settings_desc')}>
                                <InputField label={t('footer_text')} name="footerText" value={formData.footerText} onChange={handleChange} />
                                <CheckboxField label={t('barcode_scanner')} name="barcodeEnabled" checked={formData.barcodeEnabled} onChange={handleChange} />
                                <CheckboxField label={t('enable_warranty_guaranty')} name="warrantyAndGuarantyEnabled" checked={!!formData.warrantyAndGuarantyEnabled} onChange={handleChange} />
                                 <CheckboxField 
                                    label={t('enable_delete_all_products')}
                                    description={t('enable_delete_all_products_desc')}
                                    name="deleteAllProductsEnabled" 
                                    checked={!!formData.deleteAllProductsEnabled} 
                                    onChange={handleChange} 
                                />
                                {state.currentUser && ['admin', 'super_user'].includes(state.currentUser.role) && (
                                    <>
                                        <CheckboxField label={t('enable_pc_builder_feature')} name="pcBuilderEnabled" checked={!!formData.pcBuilderEnabled} onChange={handleChange} />
                                        <CheckboxField label={t('enable_order_feature')} name="purchasesEnabled" checked={!!formData.purchasesEnabled} onChange={handleChange} />
                                    </>
                                )}
                            </SettingsCard>
                        )}
                        {activeTab === 'categories' && (
                            <SettingsCard title={t('product_categories')} description={t('product_categories_desc')}>
                                <div className="space-y-3">
                                    {formData.productCategories.map((category, index) => (
                                        <div key={category.id} className="flex items-center space-x-3 p-2 rounded-md bg-gray-50 dark:bg-gray-700/50">
                                            <input
                                                type="text"
                                                value={category.name}
                                                onChange={(e) => handleCategoryChange(index, 'name', e.target.value)}
                                                className="flex-grow p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600"
                                            />
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={category.enabled}
                                                    onChange={(e) => handleCategoryChange(index, 'enabled', e.target.checked)}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                />
                                                <span className="text-sm">{t('enabled')}</span>
                                            </label>
                                            <button onClick={() => handleDeleteCategory(category.id)} className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                                                <TrashIcon className="h-5 w-5 text-red-500"/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={handleAddCategory} className="mt-4 w-full text-primary-600 border-2 border-primary-500/50 rounded-lg py-2 flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-900/50 transition-colors font-semibold">
                                    <PlusIcon className="h-5 w-5 mr-2"/> {t('add_category')}
                                </button>
                            </SettingsCard>
                        )}
                        {activeTab === 'gateways' && (
                            <>
                                <SettingsCard title="SMS Gateway" description="Configure your SMS provider to send messages.">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InputField label="Provider" name="smsGateway.provider" value={formData.smsGateway?.provider || ''} onChange={e => handleGatewayChange('smsGateway', '', 'provider', e.target.value)} />
                                        <InputField label="Sender ID" name="smsGateway.senderId" value={formData.smsGateway?.senderId || ''} onChange={e => handleGatewayChange('smsGateway', '', 'senderId', e.target.value)} />
                                        <InputField label={t('api_key')} name="smsGateway.apiKey" value={formData.smsGateway?.apiKey || ''} onChange={e => handleGatewayChange('smsGateway', '', 'apiKey', e.target.value)} />
                                        <InputField label={t('api_secret')} name="smsGateway.apiSecret" value={formData.smsGateway?.apiSecret || ''} onChange={e => handleGatewayChange('smsGateway', '', 'apiSecret', e.target.value)} />
                                    </div>
                                </SettingsCard>
                                <SettingsCard title={t('payment_methods')} description={t('payment_methods_desc')}>
                                    <div className="space-y-6">
                                        <GatewayConfigurator
                                            title={t('card_payments')}
                                            gateways={formData.cardPaymentGateways || {}}
                                            gatewayType="cardPaymentGateways"
                                            onChange={handleGatewayChange}
                                        />
                                        <GatewayConfigurator
                                            title={t('mobile_banking')}
                                            gateways={formData.mobileBankingGateways || {}}
                                            gatewayType="mobileBankingGateways"
                                            onChange={handleGatewayChange}
                                        />
                                    </div>
                                </SettingsCard>
                            </>
                        )}
                        {activeTab === 'security' && (
                            <>
                                <SettingsCard title={t('security')} description={t('security_desc')}>
                                    <div className="p-4 border dark:border-gray-700 rounded-lg">
                                        <h4 className="font-semibold text-base flex items-center"><LockClosedIcon className="h-5 w-5 mr-2" />{t('two_factor_auth')}</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3">{t('two_factor_auth_desc')}</p>
                                        <CheckboxField label={t('enable_two_factor_auth')} name="twoFactorEnabled" checked={!!formData.twoFactorEnabled} onChange={handleChange} />
                                    </div>
                                </SettingsCard>
                                <SettingsCard title={t('data_security')} description={t('data_security_desc')}>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <div className="flex items-center space-x-2">
                                            <ShieldCheckIcon className="h-5 w-5 text-green-500"/>
                                            <span className="font-medium">{t('local_data_encryption')}</span>
                                        </div>
                                        <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-800/50 dark:text-green-300">{t('encryption_status_active')}</span>
                                    </div>
                                    <button onClick={() => setIsClearDataModalOpen(true)} className="w-full mt-4 text-red-600 dark:text-red-400 border-2 border-red-500/50 rounded-lg py-2 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors font-semibold">
                                       <ExclamationTriangleIcon className="h-5 w-5 mr-2"/> {t('clear_all_local_data')}
                                    </button>
                                </SettingsCard>
                            </>
                        )}
                    </div>

                     <div className="lg:col-span-1 space-y-8">
                        {activeTab === 'permissions' && state.currentUser && ['admin', 'super_user'].includes(state.currentUser.role) && (
                             <SettingsCard title={t('permissions')} description={t('permissions_desc')}>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left">
                                            <th className="py-2">{t('page')}</th>
                                            <th className="py-2 text-center">{t('sales_manager')}</th>
                                            <th className="py-2 text-center">{t('staff')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pagesForPermissions.map(page => (
                                            <tr key={page.path} className="border-t dark:border-gray-700">
                                                <td className="py-2 font-medium">{t(page.nameKey)}</td>
                                                <td className="py-2 text-center">
                                                    <input type="checkbox" className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500" 
                                                        checked={formData.permissions[page.path]?.includes('sales_manager')}
                                                        onChange={(e) => handlePermissionChange(page.path, 'sales_manager', e.target.checked)} />
                                                </td>
                                                <td className="py-2 text-center">
                                                    <input type="checkbox" className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500" 
                                                        checked={formData.permissions[page.path]?.includes('staff')}
                                                        onChange={(e) => handlePermissionChange(page.path, 'staff', e.target.checked)} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </SettingsCard>
                        )}
                         {activeTab === 'security' && (
                            <SettingsCard title={t('active_sessions')} description={t('active_sessions_desc')}>
                                <ul className="space-y-3">
                                    <li className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <ComputerDesktopIcon className="h-6 w-6 text-green-500" />
                                            <div>
                                                <p className="font-semibold text-sm">Chrome on Windows</p>
                                                <p className="text-xs text-green-600 dark:text-green-400 font-bold">{t('current_session')}</p>
                                            </div>
                                        </div>
                                    </li>
                                     <li className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <DevicePhoneMobileIcon className="h-6 w-6 text-gray-500" />
                                            <div>
                                                <p className="font-semibold text-sm">Safari on iPhone</p>
                                                <p className="text-xs text-gray-400">2 hours ago</p>
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                                <button onClick={handleLogoutAll} className="w-full mt-4 text-gray-700 dark:text-gray-300 border rounded-lg py-2 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium">
                                   <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2"/> {t('log_out_all_other')}
                                </button>
                            </SettingsCard>
                         )}
                    </div>
                </div>

                 <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700">
                    <button onClick={handleSave} className="bg-primary-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-primary-700 transition-colors">
                        {t('save_changes')}
                    </button>
                </div>
            </div>
            <ConfirmationModal
                isOpen={isClearDataModalOpen}
                onClose={() => setIsClearDataModalOpen(false)}
                onConfirm={handleClearData}
                title={t('clear_all_local_data')}
                message={t('clear_data_confirm_message')}
                confirmText={t('delete')}
            />
            <FormModal isOpen={isPromoModalOpen} onClose={() => setIsPromoModalOpen(false)} title={editingPromo ? t('edit_offer') : t('add_offer')}>
                <PromotionForm offer={editingPromo} onSave={handleSavePromo} onCancel={() => setIsPromoModalOpen(false)} />
            </FormModal>
            <ConfirmationModal
                isOpen={!!promoToDelete}
                onClose={() => setPromoToDelete(null)}
                onConfirm={handleConfirmDeletePromo}
                title={t('confirm_delete_title')}
                message={t('confirm_delete_message', { itemName: promoToDelete?.name || '' })}
            />
        </>
    );
};

export default Settings;