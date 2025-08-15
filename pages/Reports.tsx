import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Sale, Purchase, DamagedProduct, Product } from '../types';
import { PrintModal } from '../components/PrintModal';
import { PrintSummaryModal } from '../components/PrintSummaryModal';
import { PrinterIcon, ShoppingCartIcon, BanknotesIcon, QrCodeIcon, ArrowUturnLeftIcon, ArrowTrendingUpIcon, ExclamationTriangleIcon, ArchiveBoxXMarkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../hooks/useTranslation';
import { PdfColumn } from '../services/exportService';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { useToast } from '../context/ToastContext';
import { BulkPrintModal } from '../components/BulkPrintModal';
import { ReturnModal } from '../components/ReturnModal';

const Reports: React.FC = () => {
    const { state } = useContext(AppContext);
    const { t, lang, formatDateTime, currency } = useTranslation();
    const { showToast } = useToast();
    const { sales, customers, products, settings, purchases, suppliers, users, damagedProducts } = state;
    const [saleToPrint, setSaleToPrint] = useState<Sale | null>(null);
    const [saleForReturn, setSaleForReturn] = useState<Sale | null>(null);
    const [showPrintSummary, setShowPrintSummary] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isBulkPrintOpen, setIsBulkPrintOpen] = useState(false);
    
    const [activeTab, setActiveTab] = useState<'sales' | 'orders' | 'profit' | 'loss' | 'damaged'>('sales');
    const [filterPeriod, setFilterPeriod] = useState<number | null>(null); // null for 'all'
    const [selectedSales, setSelectedSales] = useState<Set<string>>(new Set());
    
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');
    const [selectedUserId, setSelectedUserId] = useState<string>('all');

    const currencyFormatter = useMemo(() => new Intl.NumberFormat(lang, {
        style: 'currency',
        currency: currency,
    }), [currency, lang]);
    
    const filterByPeriod = (items: (Sale | Purchase | DamagedProduct)[], period: number | null) => {
        if (period === null) return items;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - period);
        return items.filter(item => new Date(item.date) >= cutoffDate);
    };

    const filteredSales = useMemo(() => {
        let salesToFilter = [...sales];
        if (selectedCustomerId !== 'all') salesToFilter = salesToFilter.filter(s => s.customerId === selectedCustomerId);
        if (selectedUserId !== 'all') salesToFilter = salesToFilter.filter(s => s.soldByUserId === selectedUserId);
        const sorted = salesToFilter.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return filterByPeriod(sorted, filterPeriod) as Sale[];
    }, [sales, filterPeriod, selectedCustomerId, selectedUserId]);

    const salesToBulkPrint = useMemo(() => filteredSales.filter(s => selectedSales.has(s.id)), [filteredSales, selectedSales]);
    const handleSelectSale = (saleId: string) => {
        setSelectedSales(prev => { const newSet = new Set(prev); if (newSet.has(saleId)) { newSet.delete(saleId); } else { newSet.add(saleId); } return newSet; });
    };
    const handleSelectAllSales = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) { setSelectedSales(new Set(filteredSales.map(s => s.id))); } else { setSelectedSales(new Set()); }
    };
    
    const filteredOrders = useMemo(() => {
        const sorted = [...purchases].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return filterByPeriod(sorted, filterPeriod) as Purchase[];
    }, [purchases, filterPeriod]);

    const filteredDamaged = useMemo(() => {
        const sorted = [...damagedProducts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return filterByPeriod(sorted, filterPeriod) as DamagedProduct[];
    }, [damagedProducts, filterPeriod]);
    
    const lossItems = useMemo(() => {
        const saleLosses = filteredSales
            .filter(s => s.cogs !== undefined && s.total < s.cogs)
            .map(s => ({
                id: s.id,
                date: s.date,
                type: 'sale_loss' as const,
                details: `Invoice #${s.id}`,
                lossAmount: s.cogs! - s.total
            }));

        const damageLosses = filteredDamaged.map(d => {
            const product = products.find(p => p.id === d.productId);
            return {
                id: d.id,
                date: d.date,
                type: 'damage_loss' as const,
                details: `${d.quantity} x ${product?.name || 'Unknown'}`,
                lossAmount: (product?.purchasePrice || 0) * d.quantity
            };
        });

        return [...saleLosses, ...damageLosses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [filteredSales, filteredDamaged, products]);


    const { salesSummary, orderSummary, profitSummary, lossSummary, damagedSummary } = useMemo(() => {
        const salesSummary = {
            count: filteredSales.length,
            totalRevenue: filteredSales.reduce((sum, s) => sum + s.total, 0),
            totalItemsSold: filteredSales.reduce((sum, s) => sum + s.items.reduce((iSum, i) => iSum + i.quantity, 0), 0)
        };
        const orderSummary = {
            count: filteredOrders.length,
            totalCost: filteredOrders.reduce((sum, p) => sum + p.total, 0),
            totalItemsOrdered: filteredOrders.reduce((sum, p) => sum + p.items.reduce((iSum, i) => iSum + i.quantity, 0), 0)
        };
        const profitSummary = {
            totalProfit: filteredSales.reduce((sum, s) => sum + (s.total - (s.cogs || 0)), 0)
        };
        const lossSummary = {
            totalLoss: lossItems.reduce((sum, item) => sum + item.lossAmount, 0)
        };
        const damagedSummary = {
            count: filteredDamaged.reduce((sum, d) => sum + d.quantity, 0),
            totalCost: filteredDamaged.reduce((sum, d) => {
                const product = products.find(p => p.id === d.productId);
                return sum + (product?.purchasePrice || 0) * d.quantity;
            }, 0)
        };
        return { salesSummary, orderSummary, profitSummary, lossSummary, damagedSummary };
    }, [filteredSales, filteredOrders, filteredDamaged, lossItems, products]);

    const summaryReportData = useMemo(() => {
        const shopInfo = { name: settings.shopName, address: settings.shopAddress, phone: settings.shopPhone };
        const totalStockValue = products.reduce((sum, p) => sum + ((p.purchasePrice || 0) * p.stock), 0);
        const lowStockCount = products.filter(p => !p.isDeleted && p.stock > 0 && p.stock < 10).length;

        const summaryData = [
            { title: t('total_sales'), value: currencyFormatter.format(salesSummary.totalRevenue) },
            { title: t('total_profit'), value: currencyFormatter.format(profitSummary.totalProfit) },
            { title: t('total_orders'), value: currencyFormatter.format(orderSummary.totalCost) },
            { title: t('total_products'), value: products.filter(p => !p.isDeleted).length },
            { title: t('total_stock_value'), value: currencyFormatter.format(totalStockValue) },
            { title: t('low_stock_items'), value: lowStockCount },
        ];

        const tableColumns: PdfColumn[] = [
            { header: t('product_name'), dataKey: 'name' },
            { header: t('category'), dataKey: 'category' },
            { header: t('purchase_rate'), dataKey: 'purchasePrice' },
            { header: t('sale_rate'), dataKey: 'price' },
            { header: t('stock'), dataKey: 'stock' },
            { header: t('stock_value'), dataKey: 'stockValue' },
        ];
        
        const categoryMap = new Map(settings.productCategories.map(c => [c.id, c.name]));
        
        const tableData = products
            .filter(p => !p.isDeleted)
            .map(p => ({
                name: p.name,
                category: categoryMap.get(p.categoryId) || 'N/A',
                purchasePrice: p.purchasePrice,
                price: p.price,
                stock: `${p.stock} ${p.unit}`,
                stockValue: p.stock * (p.purchasePrice || 0),
            }));

        const pdfTableData = tableData.map(p => ({
            ...p,
            purchasePrice: currencyFormatter.format(p.purchasePrice),
            price: currencyFormatter.format(p.price),
            stockValue: currencyFormatter.format(p.stockValue)
        }));

        return { shopInfo, summaryData, tableColumns, tableData: pdfTableData };
    }, [settings, products, salesSummary, profitSummary, orderSummary, t, currencyFormatter]);


    const handleScanSuccess = (decodedText: string) => {
        setIsScannerOpen(false);
        const sale = sales.find(s => s.id === decodedText.trim());
        if (sale) { setSaleToPrint(sale); } else { showToast(t('sale_not_found'), 'error'); }
    };
    
    // UI Render functions and components
    const timeFilterButtons = (period: number | null, setPeriod: (p: number | null) => void) => (
        <div className="flex flex-wrap items-center gap-2">
            {[null, 3, 7, 15, 30].map(p => (
                <button key={p ?? 'all'} onClick={() => setPeriod(p)} className={`px-3 py-1 text-sm rounded-full transition-colors ${period === p ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                    {p === null ? t('all_time') : t('last_days', { days: p })}
                </button>
            ))}
        </div>
    );
    const TabButton = ({icon, text, isActive, onClick} : {icon:React.ReactNode, text:string, isActive:boolean, onClick:()=>void}) => (
        <button onClick={onClick} className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-500 hover:bg-white/50 dark:hover:bg-gray-800/50'}`}>
            <span className={`h-5 w-5 ${isActive ? 'text-primary-500' : ''}`}>{icon}</span>
            <span>{text}</span>
        </button>
    );
    const SummaryCard = ({ title, value }: { title: string, value: string | number }) => (
        <div><h4 className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</h4><p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{value}</p></div>
    );

    // Content rendering logic
    const renderSalesContent = () => (<div className="space-y-4"><div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 text-center"><SummaryCard title={t('total_sales')} value={salesSummary.count.toLocaleString(lang)} /><SummaryCard title={t('total_revenue')} value={currencyFormatter.format(salesSummary.totalRevenue)} /><SummaryCard title={t('total_items_sold')} value={salesSummary.totalItemsSold.toLocaleString(lang)} /></div><div className="overflow-x-auto"><table className="w-full text-sm text-left text-gray-500 dark:text-gray-400"><thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400"><tr><th scope="col" className="p-4"><input type="checkbox" onChange={handleSelectAllSales} checked={selectedSales.size > 0 && selectedSales.size === filteredSales.length && filteredSales.length > 0} className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500" /></th><th scope="col" className="px-6 py-3">{t('invoice_id')}</th><th scope="col" className="px-6 py-3">{t('date')}</th><th scope="col" className="px-6 py-3">{t('customer')}</th><th scope="col" className="px-6 py-3">{t('paid')}</th><th scope="col" className="px-6 py-3">{t('due')}</th><th scope="col" className="px-6 py-3">{t('total')}</th><th scope="col" className="px-6 py-3 text-right">{t('actions')}</th></tr></thead><tbody>{filteredSales.map(sale => { const customer = customers.find(c => c.id === sale.customerId); const dueAmount = sale.total - sale.paidAmount; return (<tr key={sale.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"><td className="p-4"><input type="checkbox" checked={selectedSales.has(sale.id)} onChange={() => handleSelectSale(sale.id)} className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500" /></td><td className="px-6 py-4 font-mono text-xs">{sale.id}</td><td className="px-6 py-4">{formatDateTime(sale.date)}</td><td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{customer?.name || 'N/A'}</td><td className="px-6 py-4 text-green-500 font-medium">{currencyFormatter.format(sale.paidAmount)}</td><td className={`px-6 py-4 font-bold ${dueAmount > 0.01 ? 'text-red-500' : ''}`}>{currencyFormatter.format(dueAmount)}</td><td className="px-6 py-4 font-bold">{currencyFormatter.format(sale.total)}</td><td className="px-6 py-4 text-right"><div className="flex justify-end space-x-1"><button onClick={() => setSaleForReturn(sale)} className="p-2 rounded-full hover:bg-yellow-100 dark:hover:bg-gray-700" title={t('process_return')}><ArrowUturnLeftIcon className="h-5 w-5 text-yellow-600"/></button><button onClick={() => setSaleToPrint(sale)} className="p-2 rounded-full text-primary-600 hover:bg-primary-100 dark:hover:bg-gray-700" title={t('print_memo')}><PrinterIcon className="h-5 w-5"/></button></div></td></tr>);})}{filteredSales.length === 0 && (<tr><td colSpan={8} className="text-center py-8 text-gray-500">{t('no_sales_records')}</td></tr>)}</tbody></table></div></div>);
    const renderProfitContent = () => (<div className="space-y-4"><div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4 text-center"><SummaryCard title={t('total_revenue')} value={currencyFormatter.format(salesSummary.totalRevenue)} /><SummaryCard title={t('total_profit')} value={currencyFormatter.format(profitSummary.totalProfit)} /></div><div className="overflow-x-auto"><table className="w-full text-sm text-left text-gray-500 dark:text-gray-400"><thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700"><tr><th className="px-6 py-3">{t('invoice_id')}</th><th className="px-6 py-3">{t('date')}</th><th className="px-6 py-3">{t('total')}</th><th className="px-6 py-3">{t('profit')}</th></tr></thead><tbody>{filteredSales.map(sale => { const profit = sale.cogs !== undefined ? sale.total - sale.cogs : 0; const profitColor = profit >= 0 ? 'text-green-500' : 'text-red-500'; return (<tr key={sale.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"><td className="px-6 py-4 font-mono">{sale.id}</td><td className="px-6 py-4">{formatDateTime(sale.date)}</td><td className="px-6 py-4 font-bold">{currencyFormatter.format(sale.total)}</td><td className={`px-6 py-4 font-bold ${profitColor}`}>{currencyFormatter.format(profit)}</td></tr>);})}</tbody></table></div></div>);
    const renderOrdersContent = () => (<div className="space-y-4"><div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 text-center"><SummaryCard title={t('total_orders')} value={orderSummary.count.toLocaleString(lang)} /><SummaryCard title={t('total_spending')} value={currencyFormatter.format(orderSummary.totalCost)} /><SummaryCard title={t('total_items_ordered')} value={orderSummary.totalItemsOrdered.toLocaleString(lang)} /></div><div className="overflow-x-auto"><table className="w-full text-sm text-left text-gray-500 dark:text-gray-400"><thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700"><tr><th className="px-6 py-3">{t('order_id')}</th><th className="px-6 py-3">{t('date')}</th><th className="px-6 py-3">{t('supplier')}</th><th className="px-6 py-3">{t('items')}</th><th className="px-6 py-3">{t('total_cost')}</th></tr></thead><tbody>{filteredOrders.map(p => { const s = suppliers.find(s => s.id === p.supplierId); const i = p.items.reduce((sum, item) => sum + item.quantity, 0); return (<tr key={p.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"><td className="px-6 py-4 font-mono">{p.id}</td><td className="px-6 py-4">{formatDateTime(p.date)}</td><td className="px-6 py-4 font-medium">{s?.company || 'N/A'}</td><td className="px-6 py-4">{i}</td><td className="px-6 py-4 font-bold">{currencyFormatter.format(p.total)}</td></tr>)})}</tbody></table></div></div>);
    const renderLossContent = () => (<div className="space-y-4"><div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-center"><SummaryCard title={t('total_loss')} value={currencyFormatter.format(lossSummary.totalLoss)} /></div><div className="overflow-x-auto"><table className="w-full text-sm text-left text-gray-500 dark:text-gray-400"><thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700"><tr><th className="px-6 py-3">{t('date')}</th><th className="px-6 py-3">{t('loss_type')}</th><th className="px-6 py-3">{t('description')}</th><th className="px-6 py-3">{t('amount')}</th></tr></thead><tbody>{lossItems.map(item => (<tr key={item.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"><td className="px-6 py-4">{formatDateTime(item.date)}</td><td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${item.type === 'sale_loss' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{t(item.type)}</span></td><td className="px-6 py-4">{item.details}</td><td className="px-6 py-4 font-bold text-red-500">{currencyFormatter.format(item.lossAmount)}</td></tr>))}</tbody></table></div></div>);
    const renderDamagedContent = () => (<div className="space-y-4"><div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4 text-center"><SummaryCard title={t('total_items_sold')} value={damagedSummary.count} /><SummaryCard title={t('cost_value')} value={currencyFormatter.format(damagedSummary.totalCost)} /></div><div className="overflow-x-auto"><table className="w-full text-sm text-left text-gray-500 dark:text-gray-400"><thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700"><tr><th className="px-6 py-3">{t('product_name')}</th><th className="px-6 py-3">{t('quantity_damaged')}</th><th className="px-6 py-3">{t('date')}</th><th className="px-6 py-3">{t('reason_for_damage')}</th><th className="px-6 py-3">{t('recorded_by')}</th></tr></thead><tbody>{filteredDamaged.map(d => { const p = products.find(p => p.id === d.productId); const u = users.find(u => u.id === d.recordedByUserId); return (<tr key={d.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"><td className="px-6 py-4 font-medium">{p?.name || 'N/A'}</td><td className="px-6 py-4">{d.quantity}</td><td className="px-6 py-4">{formatDateTime(d.date)}</td><td className="px-6 py-4">{d.reason}</td><td className="px-6 py-4">{u?.name || 'N/A'}</td></tr>)})}</tbody></table></div></div>);

    return (
        <>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">{t('reports')}</h1>
                <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg">
                    <div className="border-b border-gray-200 dark:border-gray-700 flex justify-between items-center p-4 pr-6">
                        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg">
                           <TabButton icon={<BanknotesIcon/>} text={t('sales_reports')} isActive={activeTab === 'sales'} onClick={() => setActiveTab('sales')} />
                           <TabButton icon={<ShoppingCartIcon/>} text={t('order_reports')} isActive={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
                           <TabButton icon={<ArrowTrendingUpIcon/>} text={t('profit_report')} isActive={activeTab === 'profit'} onClick={() => setActiveTab('profit')} />
                           <TabButton icon={<ExclamationTriangleIcon/>} text={t('loss_report')} isActive={activeTab === 'loss'} onClick={() => setActiveTab('loss')} />
                           <TabButton icon={<ArchiveBoxXMarkIcon/>} text={t('damaged_products')} isActive={activeTab === 'damaged'} onClick={() => setActiveTab('damaged')} />
                        </div>
                         <div className="flex items-center space-x-2">
                             <button onClick={() => setIsScannerOpen(true)} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 flex items-center transition-colors">
                               <QrCodeIcon className="h-5 w-5 mr-2" /> {t('scan_invoice_qr')}
                            </button>
                            <button onClick={() => setShowPrintSummary(true)} className="bg-primary-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-600 flex items-center transition-colors">
                               <PrinterIcon className="h-5 w-5 mr-2" /> {t('print_summary')}
                            </button>
                             {activeTab === 'sales' && <button onClick={() => setIsBulkPrintOpen(true)} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 flex items-center transition-colors" disabled={selectedSales.size === 0}>
                               <PrinterIcon className="h-5 w-5 mr-2" /> {t('bulk_print_all_invoices')} ({selectedSales.size})
                            </button>}
                         </div>
                    </div>
                    <div className="p-4 space-y-4">
                         <div className="flex flex-wrap items-center gap-x-6 gap-y-3 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                            <div className="flex items-center gap-2"><span className="text-sm font-semibold">{t('date')}:</span>{timeFilterButtons(filterPeriod, setFilterPeriod)}</div>
                            {activeTab === 'sales' && (<>
                                <div className="flex items-center gap-2"><label htmlFor="customer-filter" className="text-sm font-semibold">{t('customer')}:</label><select id="customer-filter" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} className="py-1 px-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"><option value="all">{t('all')} {t('customers')}</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                                <div className="flex items-center gap-2"><label htmlFor="user-filter" className="text-sm font-semibold">{t('employee')}:</label><select id="user-filter" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="py-1 px-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"><option value="all">{t('all')} {t('users')}</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
                            </>)}
                        </div>
                        {activeTab === 'sales' && renderSalesContent()}
                        {activeTab === 'profit' && renderProfitContent()}
                        {activeTab === 'orders' && renderOrdersContent()}
                        {activeTab === 'loss' && renderLossContent()}
                        {activeTab === 'damaged' && renderDamagedContent()}
                    </div>
                </div>
            </div>
            {saleToPrint && <PrintModal sale={saleToPrint} onClose={() => setSaleToPrint(null)} />}
            <ReturnModal isOpen={!!saleForReturn} onClose={() => setSaleForReturn(null)} sale={saleForReturn} />
            {showPrintSummary && (
                <PrintSummaryModal 
                    onClose={() => setShowPrintSummary(false)} 
                    title={`${t('summary_report')}`} 
                    pdfData={summaryReportData}
                >
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {summaryReportData.summaryData.map(item => (
                                <div key={item.title} className="bg-gray-100 p-4 rounded-lg text-center">
                                    <h4 className="text-sm text-gray-600 uppercase tracking-wider">{item.title}</h4>
                                    <p className="text-2xl font-bold text-gray-800">{String(item.value)}</p>
                                </div>
                            ))}
                        </div>
                        
                        {/* Product Table */}
                        <div>
                            <h3 className="text-xl font-semibold mb-2">{t('product_inventory_summary')}</h3>
                            <div className="overflow-x-auto border rounded-lg">
                                <table className="w-full text-sm text-left text-gray-700">
                                    <thead className="text-xs text-gray-800 uppercase bg-gray-200">
                                        <tr>
                                            {summaryReportData.tableColumns.map(col => (
                                                <th key={col.dataKey} scope="col" className="px-6 py-3">{col.header}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summaryReportData.tableData.map((row, index) => (
                                            <tr key={index} className="bg-white border-b last:border-b-0">
                                                {summaryReportData.tableColumns.map(col => (
                                                     <td key={col.dataKey} className="px-6 py-4">{(row as any)[col.dataKey]}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </PrintSummaryModal>
            )}
            {isBulkPrintOpen && <BulkPrintModal sales={salesToBulkPrint} onClose={() => setIsBulkPrintOpen(false)} title={t('bulk_print_all_invoices')} />}
            <BarcodeScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScanSuccess={handleScanSuccess} />
        </>
    );
};

export default Reports;