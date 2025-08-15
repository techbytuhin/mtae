import React, { useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { BarChart, Bar, LineChart, Line, CartesianGrid, Tooltip, Legend, ResponsiveContainer, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import { CubeIcon, UsersIcon, CurrencyDollarIcon, ExclamationTriangleIcon, SparklesIcon, BanknotesIcon, ShoppingCartIcon, ArrowTrendingUpIcon, TrophyIcon, ScaleIcon, UserGroupIcon, BeakerIcon, ChartPieIcon } from '@heroicons/react/24/outline';
import { useTranslation, handleImageError } from '../hooks/useTranslation';

type Period = 'today' | '7' | '30' | 'all';

const CustomTooltip = ({ active, payload, label, formatter, nameMap }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg">
                <p className="label font-semibold">{label}</p>
                {payload.map((pld: any) => (
                    <p key={pld.dataKey} style={{ color: pld.color }}>
                        {`${nameMap[pld.dataKey] || pld.name}: ${formatter(pld.value)}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const Dashboard: React.FC = () => {
  const { state } = useContext(AppContext);
  const { t, lang, formatDate, currency } = useTranslation();
  
  // State for main tabs and Analytics tab
  const [mainTab, setMainTab] = useState<'summary' | 'analytics'>('summary');
  const [period, setPeriod] = useState<Period>('7');
  const [topPerformerTab, setTopPerformerTab] = useState<'products' | 'categories' | 'customers'>('products');

  const { sales, products, customers, settings } = state;
  const currencyFormatter = useMemo(() => new Intl.NumberFormat(lang, { style: 'currency', currency }), [lang, currency]);

  // --- Memos for Summary Tab ---
  const stats = useMemo(() => {
    const totalProducts = state.products.filter(p => !p.isDeleted).length;
    const totalCustomers = state.customers.length;
    const totalSales = state.sales.reduce((acc, sale) => acc + sale.total, 0);
    const totalDue = state.sales.reduce((acc, sale) => acc + (sale.total - sale.paidAmount), 0);
    const lowStockProducts = state.products.filter(p => !p.isDeleted && p.stock > 0 && p.stock < 10).length;
    return { totalProducts, totalCustomers, totalSales, lowStockProducts, totalDue };
  }, [state.products, state.customers, state.sales]);
  
  const lowStockProductDetails = useMemo(() => {
    return state.products.filter(p => !p.isDeleted && p.stock > 0 && p.stock < 10);
  }, [state.products]);
  
  const dailySummary = useMemo(() => {
    const today = new Date().toDateString();
    const todaysSales = state.sales.filter(s => new Date(s.date).toDateString() === today);
    const todaysRevenue = todaysSales.reduce((sum, s) => sum + s.total, 0);
    const todaysCOGS = todaysSales.reduce((sum, sale) => sum + (sale.cogs || 0), 0);
    const todaysProfit = todaysRevenue - todaysCOGS;
    return { todaysRevenue, todaysProfit };
  }, [state.sales]);

  // --- Memos for Analytics Tab ---
  const filteredSales = useMemo(() => {
    const now = new Date();
    if (period === 'all') return sales;
    if (period === 'today') {
        const todayStr = now.toISOString().split('T')[0];
        return sales.filter(s => new Date(s.date).toISOString().split('T')[0] === todayStr);
    }
    const days = parseInt(period, 10);
    const cutoff = new Date(new Date().setDate(now.getDate() - days));
    return sales.filter(s => new Date(s.date) >= cutoff);
  }, [sales, period]);

  const kpis = useMemo(() => {
    const grossRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const netProfit = filteredSales.reduce((sum, s) => sum + (s.total - (s.cogs || 0)), 0);
    const avgSaleValue = filteredSales.length > 0 ? grossRevenue / filteredSales.length : 0;
    const itemsSold = filteredSales.reduce((sum, s) => sum + s.items.reduce((iSum, i) => iSum + i.quantity, 0), 0);
    return { grossRevenue, netProfit, avgSaleValue, itemsSold };
  }, [filteredSales]);

  const salesTrendData = useMemo(() => {
    const grouped = filteredSales.reduce((acc, sale) => {
        const date = formatDate(sale.date);
        if (!acc[date]) acc[date] = { date, revenue: 0, profit: 0 };
        acc[date].revenue += sale.total;
        acc[date].profit += sale.total - (sale.cogs || 0);
        return acc;
    }, {} as Record<string, { date: string, revenue: number, profit: number }>);
    return Object.values(grouped).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredSales, formatDate]);

  const topPerformers = useMemo(() => {
    const productStats = new Map<string, { name: string, quantity: number, revenue: number }>();
    const categoryStats = new Map<string, { name: string, quantity: number, revenue: number }>();
    const customerStats = new Map<string, { name: string, spending: number }>();

    for (const sale of filteredSales) {
        const customer = customers.find(c => c.id === sale.customerId);
        if (customer) {
            const current = customerStats.get(customer.id) || { name: customer.name, spending: 0 };
            current.spending += sale.total;
            customerStats.set(customer.id, current);
        }

        for (const item of sale.items) {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                const pCurrent = productStats.get(product.id) || { name: product.name, quantity: 0, revenue: 0 };
                pCurrent.quantity += item.quantity;
                pCurrent.revenue += item.priceAtSale * item.quantity;
                productStats.set(product.id, pCurrent);

                const category = settings.productCategories.find(c => c.id === product.categoryId);
                if (category) {
                    const cCurrent = categoryStats.get(category.id) || { name: category.name, quantity: 0, revenue: 0 };
                    cCurrent.quantity += item.quantity;
                    cCurrent.revenue += item.priceAtSale * item.quantity;
                    categoryStats.set(category.id, cCurrent);
                }
            }
        }
    }
    
    return {
        productsByRevenue: [...productStats.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
        productsByQuantity: [...productStats.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5),
        categoriesByRevenue: [...categoryStats.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
        customersBySpending: [...customerStats.values()].sort((a, b) => b.spending - a.spending).slice(0, 5),
    };
  }, [filteredSales, products, customers, settings.productCategories]);

  const paymentDistribution = useMemo(() => {
    const counts = filteredSales.reduce((acc, sale) => {
        const method = t(sale.paymentMethod as any);
        acc[method] = (acc[method] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredSales, t]);

  const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff4d4d', '#4ddbff'];

  const renderBarChart = (data: any[], key: string, name: string) => (
    <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickFormatter={val => currencyFormatter.format(val)} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: number) => currencyFormatter.format(value)} />
            <Bar dataKey={key} name={name} fill="rgb(var(--primary-500))" />
        </BarChart>
    </ResponsiveContainer>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">{t('dashboard')}</h1>
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg">
            <TabButton text={t('summary')} isActive={mainTab === 'summary'} onClick={() => setMainTab('summary')} />
            <TabButton text={t('analytics')} isActive={mainTab === 'analytics'} onClick={() => setMainTab('analytics')} />
        </div>
      </div>
      
      {mainTab === 'summary' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard icon={<CubeIcon/>} themeColor="primary" title={t('total_products')} value={stats.totalProducts} />
            <StatCard icon={<UsersIcon/>} themeColor="green" title={t('total_customers')} value={stats.totalCustomers} />
            <StatCard icon={<ArrowTrendingUpIcon/>} themeColor="yellow" title={t('todays_revenue')} value={currencyFormatter.format(dailySummary.todaysRevenue)} />
            <StatCard icon={<ScaleIcon/>} themeColor="red" title={t('total_due')} value={currencyFormatter.format(stats.totalDue)} valueColor="text-red-500 dark:text-red-400" />
            <StatCard icon={<ExclamationTriangleIcon/>} themeColor="orange" title={t('low_stock_items')} value={stats.lowStockProducts} />
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mt-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-2"/>
                {t('low_stock_alerts')}
              </h2>
              {lowStockProductDetails.length > 0 ? (
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 sticky top-0">
                      <tr>
                        <th scope="col" className="px-6 py-3">{t('product_name')}</th>
                        <th scope="col" className="px-6 py-3 text-center">{t('current_stock')}</th>
                        <th scope="col" className="px-6 py-3">{t('supplier')}</th>
                        <th scope="col" className="px-6 py-3 text-right">{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockProductDetails.map(product => {
                        const supplier = state.suppliers.find(s => s.id === product.supplierId);
                        return (
                          <tr key={product.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                            <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap flex items-center space-x-3">
                                <img src={product.imageUrl} alt={product.name} className="h-10 w-10 rounded-full object-cover" onError={handleImageError}/>
                                <span>{product.name}</span>
                            </th>
                            <td className="px-6 py-4 text-center">
                                <span className="font-bold text-red-500 text-lg">{product.stock} {product.unit}</span>
                            </td>
                            <td className="px-6 py-4">{supplier?.company || 'N/A'}</td>
                            <td className="px-6 py-4 text-right">
                               {state.settings.purchasesEnabled && (
                                  <NavLink to="/purchases" className="font-medium text-primary-600 dark:text-primary-500 hover:underline">
                                      {t('order')}
                                  </NavLink>
                               )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">{t('no_low_stock_products')}</p>
              )}
            </div>
        </div>
      )}

      {mainTab === 'analytics' && (
        <div className="space-y-6">
            <div className="flex justify-end">
                <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg">
                    {(['today', '7', '30', 'all'] as const).map(p => (
                        <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${period === p ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-500 hover:bg-white/50 dark:hover:bg-gray-800/50'}`}>
                            {p === 'all' ? t('all_time') : p === 'today' ? t('today') : t('last_days', { days: p })}
                        </button>
                    ))}
                </div>
            </div>

            {filteredSales.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                    <ChartPieIcon className="h-24 w-24 mx-auto text-gray-300 dark:text-gray-600" />
                    <p className="mt-4 text-xl font-semibold">{t('no_data_for_period')}</p>
                </div>
            ) : (
                <>
                    {/* KPIs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard icon={<CurrencyDollarIcon/>} themeColor="green" title={t('gross_revenue')} value={currencyFormatter.format(kpis.grossRevenue)} />
                        <StatCard icon={<ArrowTrendingUpIcon/>} themeColor="primary" title={t('net_profit')} value={currencyFormatter.format(kpis.netProfit)} />
                        <StatCard icon={<ShoppingCartIcon/>} themeColor="yellow" title={t('items_sold')} value={kpis.itemsSold.toLocaleString(lang)} />
                        <StatCard icon={<UserGroupIcon/>} themeColor="indigo" title={t('avg_sale_value')} value={currencyFormatter.format(kpis.avgSaleValue)} />
                    </div>

                    {/* Sales Trends */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4">{t('sales_trends')}</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={salesTrendData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis tickFormatter={val => currencyFormatter.format(val)} tick={{ fontSize: 12 }} />
                                <Tooltip content={<CustomTooltip formatter={(v:any) => currencyFormatter.format(v)} nameMap={{revenue: t('gross_revenue'), profit: t('net_profit')}} />} />
                                <Legend />
                                <Line type="monotone" dataKey="revenue" name={t('gross_revenue')} stroke="rgb(var(--primary-500))" strokeWidth={2} />
                                <Line type="monotone" dataKey="profit" name={t('net_profit')} stroke="#00C49F" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Performers */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold mb-4">{t('top_performers')}</h2>
                            <div className="flex space-x-1 border-b dark:border-gray-700 mb-4">
                                {(['products', 'categories', 'customers'] as const).map(tab => (
                                    <button key={tab} onClick={() => setTopPerformerTab(tab)} className={`px-4 py-2 text-sm font-medium border-b-2 ${topPerformerTab === tab ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:border-gray-300'}`}>
                                        {t(`top_${tab}` as any)}
                                    </button>
                                ))}
                            </div>
                            {topPerformerTab === 'products' && renderBarChart(topPerformers.productsByRevenue, 'revenue', t('by_revenue'))}
                            {topPerformerTab === 'categories' && renderBarChart(topPerformers.categoriesByRevenue, 'revenue', t('by_revenue'))}
                            {topPerformerTab === 'customers' && renderBarChart(topPerformers.customersBySpending, 'spending', t('total_spending'))}
                        </div>

                        {/* Payment Distribution */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold mb-4">{t('payment_method_distribution')}</h2>
                             <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={paymentDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                        {paymentDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [`${value} (${((Number(value) / filteredSales.length) * 100).toFixed(1)}%)`, name]} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            )}
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactElement<React.SVGProps<SVGSVGElement>>; title: string; value: string | number; valueColor?: string; themeColor?: 'primary' | 'green' | 'yellow' | 'red' | 'orange' | 'indigo'; }> = ({ icon, title, value, valueColor = 'text-gray-900 dark:text-white', themeColor = 'primary' }) => {
    const colorClasses = {
        primary: { bg: 'bg-primary-100 dark:bg-primary-500/20', text: 'text-primary-600 dark:text-primary-400' },
        green: { bg: 'bg-green-100 dark:bg-green-500/20', text: 'text-green-600 dark:text-green-400' },
        yellow: { bg: 'bg-yellow-100 dark:bg-yellow-500/20', text: 'text-yellow-600 dark:text-yellow-400' },
        red: { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-600 dark:text-red-400' },
        orange: { bg: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-600 dark:text-orange-400' },
        indigo: { bg: 'bg-indigo-100 dark:bg-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400' },
    };
    const selectedColor = colorClasses[themeColor] || colorClasses.primary;
    return (
        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
                    <p className={`text-3xl font-bold mt-2 ${valueColor}`}>{value}</p>
                </div>
                <div className={`p-3 ${selectedColor.bg} rounded-lg`}>
                    {React.cloneElement(icon, { className: `h-6 w-6 ${selectedColor.text}` })}
                </div>
            </div>
        </div>
    );
};

const TabButton = ({ text, isActive, onClick }: { text: string, isActive: boolean, onClick: () => void }) => (
    <button onClick={onClick} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-500 hover:bg-white/50 dark:hover:bg-gray-800/50'}`}>
        {text}
    </button>
);

export default Dashboard;