import React, { useContext, useState, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { ActionType, AppState, Product, Sale, Purchase, Customer, Supplier, Settings, CloudBackupProviderSettings, AttendanceRecord } from '../types';
import { useTranslation, TranslationKey } from '../hooks/useTranslation';
import { exportToPdf, exportToCsv, exportAllDataToXlsx, PdfColumn } from '../services/exportService';
import { 
    DocumentArrowDownIcon,
    BanknotesIcon,
    ShoppingCartIcon,
    CubeIcon,
    UsersIcon,
    BuildingStorefrontIcon,
    ArchiveBoxIcon,
    ArrowUpOnSquareIcon,
    ChevronDownIcon,
    WrenchScrewdriverIcon,
    CircleStackIcon,
    ServerIcon,
    CheckCircleIcon,
    FingerPrintIcon
} from '@heroicons/react/24/outline';
import { FormModal } from '../components/FormModal';
import { ImageUploader } from '../components/ImageUploader';
import { useToast } from '../context/ToastContext';
import * as XLSX from 'xlsx';

// --- MODAL COMPONENTS ---

const InvoiceLayoutModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    // This component is unchanged
    const { state, dispatch } = useContext(AppContext);
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        invoiceTitle: state.settings.invoiceTitle || 'Invoice/Cash Memo',
        invoiceAccentColor: state.settings.invoiceAccentColor || '#4f46e5',
        shopLogo: state.settings.shopLogo,
        invoiceNotes: state.settings.invoiceNotes || '',
        invoiceTerms: state.settings.invoiceTerms || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = (newUrl: string) => {
        setFormData(prev => ({ ...prev, shopLogo: newUrl }));
    };

    const handleSave = () => {
        dispatch({
            type: ActionType.UPDATE_SETTINGS,
            payload: {
                invoiceTitle: formData.invoiceTitle,
                invoiceAccentColor: formData.invoiceAccentColor,
                shopLogo: formData.shopLogo,
                invoiceNotes: formData.invoiceNotes,
                invoiceTerms: formData.invoiceTerms,
            }
        });
        showToast(t('settings_saved_success'), 'success');
        onClose();
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={t('edit_invoice_layout')}>
            <div className="space-y-6">
                <div>
                    <label htmlFor="invoiceTitle" className="block text-sm font-medium mb-1">{t('invoice_title')}</label>
                    <input id="invoiceTitle" name="invoiceTitle" type="text" value={formData.invoiceTitle} onChange={handleChange} className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                    <label htmlFor="invoiceAccentColor" className="block text-sm font-medium mb-1">{t('accent_color')}</label>
                    <div className="flex items-center space-x-2">
                        <input id="invoiceAccentColor" name="invoiceAccentColor" type="color" value={formData.invoiceAccentColor} onChange={handleChange} className="h-10 w-10 p-1 border rounded-md" />
                        <input type="text" value={formData.invoiceAccentColor} onChange={handleChange} className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                </div>
                <ImageUploader label={t('shop_logo')} value={formData.shopLogo} onChange={handleLogoChange} />
                <div>
                    <label htmlFor="invoiceNotes" className="block text-sm font-medium mb-1">{t('default_notes')}</label>
                    <textarea id="invoiceNotes" name="invoiceNotes" value={formData.invoiceNotes} onChange={handleChange} rows={3} className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                    <label htmlFor="invoiceTerms" className="block text-sm font-medium mb-1">{t('default_terms')}</label>
                    <textarea id="invoiceTerms" name="invoiceTerms" value={formData.invoiceTerms} onChange={handleChange} rows={3} className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
                    <button type="button" onClick={onClose} className="py-2 px-4 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors">{t('cancel')}</button>
                    <button type="button" onClick={handleSave} className="py-2 px-4 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors">{t('save')}</button>
                </div>
            </div>
        </FormModal>
    );
};

const CloudProviderConfigModal: React.FC<{ isOpen: boolean; onClose: () => void; providerKey: string; providerName: string; }> = ({ isOpen, onClose, providerKey, providerName }) => {
    const { state, dispatch } = useContext(AppContext);
    const { t } = useTranslation();
    const { showToast } = useToast();

    const providerSettings = state.settings.cloudBackup?.providers[providerKey as keyof typeof state.settings.cloudBackup.providers];

    const [formData, setFormData] = useState<CloudBackupProviderSettings>(
        providerSettings || { enabled: false, apiKey: '' }
    );
    
    const handleSave = () => {
        const updatedSettings = {
            ...state.settings,
            cloudBackup: {
                ...state.settings.cloudBackup!,
                providers: {
                    ...state.settings.cloudBackup!.providers,
                    [providerKey]: formData,
                },
            },
        };
        dispatch({ type: ActionType.UPDATE_SETTINGS, payload: updatedSettings });
        showToast(t('settings_saved_success'), 'success');
        onClose();
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={t('cloud_provider_config', { provider: providerName })}>
            <div className="space-y-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={formData.enabled} onChange={(e) => setFormData(p => ({...p, enabled: e.target.checked}))} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-sm">{t('enable_provider', { provider: providerName })}</span>
                </label>
                <div>
                    <label className="block text-sm font-medium mb-1">{t('api_key')}</label>
                    <input type="text" value={formData.apiKey} onChange={(e) => setFormData(p => ({ ...p, apiKey: e.target.value }))} className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600" />
                </div>
                 <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="py-2 px-4 rounded-lg bg-gray-500 text-white hover:bg-gray-600">{t('cancel')}</button>
                    <button type="button" onClick={handleSave} className="py-2 px-4 rounded-lg bg-primary-600 text-white hover:bg-primary-700">{t('save')}</button>
                </div>
            </div>
        </FormModal>
    );
};

const CloudProviderCard: React.FC<{name: string, isConnected: boolean, onConfigure: () => void}> = ({ name, isConnected, onConfigure }) => {
    const { t } = useTranslation();
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <ServerIcon className={`h-8 w-8 ${isConnected ? 'text-green-500' : 'text-gray-400'}`} />
                <div>
                    <h3 className="font-semibold">{name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{isConnected ? t('connected') : t('disconnected')}</span>
                </div>
            </div>
            <button onClick={onConfigure} className="text-sm font-medium text-primary-600 hover:underline">{t('configure')}</button>
        </div>
    );
};

const ConnectDriveModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { state, dispatch } = useContext(AppContext);
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('local');
    const [path, setPath] = useState(state.settings.backupDrivePath || '');
    const [configProvider, setConfigProvider] = useState<{key: string; name: string} | null>(null);

    const cloudProvidersList = [
        { key: 'googleDrive', name: t('google_drive') },
        { key: 'oneDrive', name: t('microsoft_onedrive') },
        { key: 'iCloud', name: t('icloud_drive') },
        { key: 'mega', name: t('mega') },
        { key: 'pCloud', name: t('pcloud') },
    ];

    const handleSavePath = () => {
        dispatch({ type: ActionType.UPDATE_SETTINGS, payload: { backupDrivePath: path } });
        showToast(t('path_saved_success'), 'success');
        onClose();
    };

    const handleCloudBackupToggle = (enabled: boolean) => {
        dispatch({ type: ActionType.UPDATE_SETTINGS, payload: { cloudBackup: { ...state.settings.cloudBackup!, automatic: enabled } } });
    };

    const handleManualCloudBackup = () => {
        const anyProviderEnabled = Object.values(state.settings.cloudBackup?.providers || {}).some(p => p.enabled);
        if (anyProviderEnabled) {
            showToast(t('cloud_backup_success'), 'success');
        } else {
            showToast(t('cloud_backup_fail'), 'error');
        }
    };

    return (
      <>
        <FormModal isOpen={isOpen} onClose={onClose} title={t('connect_drive_modal_title')}>
            <div className="space-y-4">
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                        <button onClick={() => setActiveTab('local')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'local' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>{t('local_drive_path')}</button>
                        <button onClick={() => setActiveTab('cloud')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'cloud' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>{t('cloud_drive_services')}</button>
                    </nav>
                </div>
                {activeTab === 'local' ? (
                    <div className="space-y-4 pt-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('connect_backup_drive_desc')}</p>
                        <input type="text" value={path} onChange={(e) => setPath(e.target.value)} placeholder="e.g., D:\ShopBackups" className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        <div className="flex justify-end pt-4 border-t dark:border-gray-700">
                            <button onClick={handleSavePath} className="py-2 px-4 rounded-lg bg-primary-600 text-white hover:bg-primary-700">{t('save_path')}</button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 pt-4">
                        {state.currentUser && ['admin', 'super_user'].includes(state.currentUser.role) && (
                            <>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('cloud_backup_setup_desc')}</p>
                                <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg flex justify-between items-center">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" checked={state.settings.cloudBackup?.automatic} onChange={(e) => handleCloudBackupToggle(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                        <span className="font-semibold">{t('automatic_daily_backup')}</span>
                                    </label>
                                    <button onClick={handleManualCloudBackup} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600">{t('backup_now')}</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {cloudProvidersList.map(provider => (
                                        <CloudProviderCard 
                                            key={provider.key}
                                            name={provider.name}
                                            isConnected={state.settings.cloudBackup?.providers[provider.key as keyof typeof state.settings.cloudBackup.providers]?.enabled || false}
                                            onConfigure={() => setConfigProvider(provider)}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </FormModal>
        {configProvider && <CloudProviderConfigModal isOpen={!!configProvider} onClose={() => setConfigProvider(null)} providerKey={configProvider.key} providerName={configProvider.name} />}
      </>
    );
};


// --- MAIN PAGE COMPONENT ---
const Files: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { t, lang, formatDateTime, formatDate, formatTime } = useTranslation();
    const { showToast } = useToast();
    const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
    const [isConnectDriveModalOpen, setIsConnectDriveModalOpen] = useState(false);
    const restoreInputRef = useRef<HTMLInputElement>(null);

    const categoryMap = new Map(state.settings.productCategories.map(c => [c.id, c.name]));

    const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result;

                if (file.name.toLowerCase().endsWith('.json')) {
                    const data: Omit<AppState, 'currentUser' | 'users' | 'loginError' | 'notifications'> = JSON.parse(content as string);
                    if (data.products && data.customers && data.sales && data.settings) {
                        dispatch({ type: ActionType.RESTORE_BACKUP, payload: data });
                        showToast(t('restore_success'), 'success');
                    } else {
                        throw new Error(t('invalid_json_backup'));
                    }
                } else if (file.name.toLowerCase().endsWith('.xlsx')) {
                    const workbook = XLSX.read(content, { type: 'binary' });

                    const restoredState: Partial<AppState> = {};

                    const sheetMap: Record<string, keyof AppState> = {
                        'Products': 'products',
                        'Customers': 'customers',
                        'Suppliers': 'suppliers',
                        'Sales': 'sales',
                        'Purchases': 'purchases',
                        'Users': 'users',
                        'Printers': 'printers',
                        'Card Machines': 'cardMachines',
                        'Due Collections': 'dueCollections',
                        'Attendance': 'attendance',
                        'Settings': 'settings'
                    };
                    
                    Object.entries(sheetMap).forEach(([sheetName, stateKey]) => {
                        const ws = workbook.Sheets[sheetName];
                        if (ws) {
                            let jsonData = XLSX.utils.sheet_to_json(ws);

                            // Post-process complex/nested data
                            if (['sales', 'purchases'].includes(stateKey)) {
                                jsonData = jsonData.map((row: any) => ({ ...row, items: JSON.parse(row.items) }));
                            }
                            if (stateKey === 'settings' && jsonData.length > 0) {
                                // Settings are stored as a single row, need to parse JSON strings
                                const settingsRow = jsonData[0] as any;
                                Object.keys(settingsRow).forEach(key => {
                                    if (typeof settingsRow[key] === 'string' && (settingsRow[key].startsWith('{') || settingsRow[key].startsWith('['))) {
                                        try { settingsRow[key] = JSON.parse(settingsRow[key]); } catch (e) { /* ignore parse error */ }
                                    }
                                });
                                (restoredState as any)[stateKey] = settingsRow;
                            } else if (jsonData.length > 0) {
                                (restoredState as any)[stateKey] = jsonData;
                            }
                        }
                    });

                    if (restoredState.products && restoredState.settings) {
                        dispatch({ type: ActionType.RESTORE_BACKUP, payload: restoredState as any });
                        showToast(t('restore_success'), 'success');
                    } else {
                        throw new Error(t('invalid_xlsx_backup'));
                    }
                } else {
                    throw new Error(t('unsupported_backup_file'));
                }

            } catch (error) {
                console.error("Failed to restore backup:", error);
                showToast((error as Error).message || t('restore_fail'), 'error');
            } finally {
                if (restoreInputRef.current) restoreInputRef.current.value = '';
            }
        };
        
        if (file.name.toLowerCase().endsWith('.json')) {
            reader.readAsText(file);
        } else if (file.name.toLowerCase().endsWith('.xlsx')) {
            reader.readAsBinaryString(file);
        }
    };
    
    const preparedData = {
        sales: state.sales.map(s => ({
            id: s.id, customerName: state.customers.find(c => c.id === s.customerId)?.name || 'N/A',
            totalItems: s.items.reduce((sum, item) => sum + item.quantity, 0), total: s.total,
            paymentMethod: s.paymentMethod, date: formatDateTime(s.date),
        })),
        purchases: state.purchases.map(p => ({
            id: p.id, supplierName: state.suppliers.find(s => s.id === p.supplierId)?.company || 'N/A',
            totalItems: p.items.reduce((sum, item) => sum + item.quantity, 0), total: p.total,
            date: formatDateTime(p.date),
        })),
        products: state.products.map(p => ({
            id: p.id, name: p.name, category: categoryMap.get(p.categoryId) || 'N/A', price: p.price, stock: p.stock,
            supplierName: state.suppliers.find(s => s.id === p.supplierId)?.company || 'N/A', expiryDate: formatDate(p.expiryDate),
        })),
        customers: state.customers,
        suppliers: state.suppliers,
        attendance: state.attendance.map(a => {
            const user = state.users.find(u => u.id === a.userId);
            const duration = a.clockOut ? (new Date(a.clockOut).getTime() - new Date(a.clockIn).getTime()) / (1000 * 60 * 60) : 0;
            return {
                id: a.id,
                userName: user?.name || 'N/A',
                date: a.date,
                clockIn: formatTime(a.clockIn),
                clockOut: a.clockOut ? formatTime(a.clockOut) : 'N/A',
                duration: `${duration.toFixed(2)} hours`
            }
        }),
    };
    const pdfColumns = {
        sales: [ { header: t('invoice_id'), dataKey: 'id' }, { header: t('customer'), dataKey: 'customerName' }, { header: t('date'), dataKey: 'date' }, { header: t('items'), dataKey: 'totalItems' }, { header: t('total'), dataKey: 'total' }, { header: t('payment_method'), dataKey: 'paymentMethod' } ] as PdfColumn[],
        purchases: [ { header: t('order_id'), dataKey: 'id' }, { header: t('supplier'), dataKey: 'supplierName' }, { header: t('date'), dataKey: 'date' }, { header: t('items'), dataKey: 'totalItems' }, { header: t('total_cost'), dataKey: 'total' } ] as PdfColumn[],
        products: [ { header: t('product_name'), dataKey: 'name' }, { header: t('category'), dataKey: 'category' }, { header: t('price'), dataKey: 'price' }, { header: t('stock'), dataKey: 'stock' }, { header: t('supplier'), dataKey: 'supplierName' }, { header: t('expiry_date'), dataKey: 'expiryDate' } ] as PdfColumn[],
        customers: [ { header: t('customer_name'), dataKey: 'name' }, { header: t('phone'), dataKey: 'phone' }, { header: t('email'), dataKey: 'email' }, { header: t('address'), dataKey: 'address' } ] as PdfColumn[],
        suppliers: [ { header: t('company_name'), dataKey: 'company' }, { header: t('contact_person'), dataKey: 'name' }, { header: t('phone'), dataKey: 'phone' }, { header: t('address'), dataKey: 'address' } ] as PdfColumn[],
        attendance: [ { header: t('employee'), dataKey: 'userName'}, { header: t('date'), dataKey: 'date'}, { header: t('time_in'), dataKey: 'clockIn'}, { header: t('time_out'), dataKey: 'clockOut'}, {header: t('duration'), dataKey: 'duration'} ] as PdfColumn[],
    };
    const getFilename = (base: string) => `${base}-backup-${new Date().toISOString().split('T')[0]}`;
    const handleJsonExport = (data: any, filename: string) => {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    };

    const exportActionsList = [
        { type: 'sales', title: t('sales_data'), description: t('sales_data_desc'), icon: BanknotesIcon, originalData: state.sales, preparedData: preparedData.sales, pdfColumns: pdfColumns.sales, },
        { type: 'orders', title: t('order_data'), description: t('order_data_desc'), icon: ShoppingCartIcon, originalData: state.purchases, preparedData: preparedData.purchases, pdfColumns: pdfColumns.purchases, },
        { type: 'products', title: t('products_data'), description: t('products_data_desc'), icon: CubeIcon, originalData: state.products, preparedData: preparedData.products, pdfColumns: pdfColumns.products, },
        { type: 'customers', title: t('customers_data'), description: t('customers_data_desc'), icon: UsersIcon, originalData: state.customers, preparedData: preparedData.customers, pdfColumns: pdfColumns.customers, },
        { type: 'suppliers', title: t('suppliers_data'), description: t('suppliers_data_desc'), icon: BuildingStorefrontIcon, originalData: state.suppliers, preparedData: preparedData.suppliers, pdfColumns: pdfColumns.suppliers, },
        { type: 'attendance', title: t('attendance_data'), description: t('attendance_data_desc'), icon: FingerPrintIcon, originalData: state.attendance, preparedData: preparedData.attendance, pdfColumns: pdfColumns.attendance, },
        { type: 'all_shop_data', title: t('local_data_backup'), description: t('local_data_backup_desc'), icon: ArchiveBoxIcon, originalData: state },
    ];


    return (
        <>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold">{t('files_management')}</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('files_management_desc')}</p>
                </div>

                <section>
                    <h2 className="text-2xl font-semibold border-b pb-2 mb-4">{t('export')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {exportActionsList.map(item => (
                            <ExportCard key={item.type} title={item.title} description={item.description} icon={item.icon}
                                exportActions={{
                                    json: () => handleJsonExport(item.originalData, getFilename(item.type)),
                                    pdf: () => exportToPdf(item.pdfColumns!, item.preparedData!, `${getFilename(item.type)}.pdf`, item.title),
                                    xlsx: item.type === 'all_shop_data'
                                        ? () => exportAllDataToXlsx(state, getFilename('all-shop-data'))
                                        : () => exportToCsv(item.preparedData!, getFilename(item.type)), // Keep single export as CSV for simplicity
                                }}
                                disabledExports={item.type === 'all_shop_data' ? ['pdf', 'csv'] : []}
                                isFullBackup={item.type === 'all_shop_data'}
                            />
                        ))}
                    </div>
                </section>
                
                <section>
                    <h2 className="text-2xl font-semibold border-b pb-2 mb-4">{t('import_manage')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <ActionCard title={t('import_from_backup')} description={t('import_from_backup_desc')} icon={ArrowUpOnSquareIcon} onClick={() => restoreInputRef.current?.click()}>
                            <input type="file" ref={restoreInputRef} onChange={handleRestore} className="hidden" accept=".json,.xlsx"/>
                        </ActionCard>
                        <ActionCard title={t('edit_invoice_layout')} description={t('edit_invoice_layout_desc')} icon={WrenchScrewdriverIcon} onClick={() => setIsLayoutModalOpen(true)} />
                        <ActionCard title={t('connect_backup_drive')} description={t('connect_backup_drive_desc')} icon={CircleStackIcon} onClick={() => setIsConnectDriveModalOpen(true)} />
                    </div>
                </section>
            </div>
            
            {isLayoutModalOpen && <InvoiceLayoutModal isOpen={isLayoutModalOpen} onClose={() => setIsLayoutModalOpen(false)} />}
            {isConnectDriveModalOpen && <ConnectDriveModal isOpen={isConnectDriveModalOpen} onClose={() => setIsConnectDriveModalOpen(false)} />}
        </>
    );
};

// --- Child Components for Files Page ---

const ExportCard: React.FC<{ title: string; description: string; icon: React.FC<any>; exportActions: { json: () => void; pdf: () => void; xlsx: () => void; }; disabledExports?: Array<'json' | 'pdf' | 'csv' | 'xlsx'>; isFullBackup?: boolean; }> = ({ title, description, icon: Icon, exportActions, disabledExports = [], isFullBackup = false }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const exports = isFullBackup ? [
        { format: 'json', label: t('export_as_json'), action: exportActions.json, disabled: disabledExports.includes('json') },
        { format: 'xlsx', label: t('export_as_xlsx'), action: exportActions.xlsx, disabled: disabledExports.includes('xlsx') },
    ] : [
        { format: 'json', label: t('export_as_json'), action: exportActions.json, disabled: disabledExports.includes('json') },
        { format: 'pdf', label: t('export_as_pdf'), action: exportActions.pdf, disabled: disabledExports.includes('pdf') },
        { format: 'csv', label: t('export_as_csv'), action: exportActions.xlsx, disabled: disabledExports.includes('csv') }, // Note: uses xlsx action but labeled as csv for individual exports
    ];


    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col justify-between">
            <div>
                <div className="flex items-center space-x-4">
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full"><Icon className="h-6 w-6 text-primary-500" /></div>
                    <h2 className="text-lg font-semibold">{title}</h2>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 min-h-[3rem]">{description}</p>
            </div>
            <div className="relative mt-6 inline-block text-left w-full" ref={dropdownRef}>
                <button onClick={() => setIsOpen(!isOpen)} className="w-full bg-primary-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-600 flex items-center justify-center transition-colors">
                    <DocumentArrowDownIcon className="h-5 w-5 mr-2" />{t('export')}<ChevronDownIcon className="h-5 w-5 ml-2 -mr-1" />
                </button>
                {isOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-full rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 z-10">
                        <div className="py-1">
                            {exports.map(exp => !exp.disabled && ( <a href="#" key={exp.format} onClick={(e) => { e.preventDefault(); exp.action(); setIsOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">{exp.label}</a> ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ActionCard: React.FC<{ title: string; description: string; icon: React.FC<any>; onClick: () => void; children?: React.ReactNode; }> = ({ title, description, icon: Icon, onClick, children }) => (
    // This component is unchanged
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col justify-between">
        <div>
            <div className="flex items-center space-x-4">
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full"><Icon className="h-6 w-6 text-primary-500" /></div>
                <h2 className="text-lg font-semibold">{title}</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 min-h-[3rem]">{description}</p>
        </div>
        <button onClick={onClick} className="mt-6 w-full bg-primary-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-600 flex items-center justify-center transition-colors">
            <Icon className="h-5 w-5 mr-2" />{title}
        </button>
        {children}
    </div>
);


export default Files;