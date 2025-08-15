import React, { useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import {
  CogIcon, BellIcon, CalculatorIcon, XMarkIcon, MagnifyingGlassIcon, Bars3Icon, UsersIcon, ArrowLeftOnRectangleIcon, DocumentArrowDownIcon,
  HomeIcon, CurrencyDollarIcon, CubeIcon, UserGroupIcon, BuildingStorefrontIcon, ChartBarIcon, ScaleIcon, ExclamationTriangleIcon, CalendarDaysIcon, CheckCircleIcon, BanknotesIcon, CpuChipIcon, WrenchScrewdriverIcon, UserIcon, DocumentTextIcon, FireIcon, QrCodeIcon, ComputerDesktopIcon, FingerPrintIcon, Squares2X2Icon, AdjustmentsHorizontalIcon, ChartPieIcon, IdentificationIcon
} from '@heroicons/react/24/outline';
import { ActionType, Notification, Product, Customer, Supplier, Sale } from '../types';
import { useTranslation, TranslationKey, handleImageError } from '../hooks/useTranslation';
import { Calculator } from './Calculator';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { useToast } from '../context/ToastContext';

const CountdownTimer = ({ text, expiry }: { text: string; expiry: string }) => {
    const { t } = useTranslation();

    const calculateTimeLeft = useCallback(() => {
        const difference = +new Date(expiry) - +new Date();
        let timeLeft: { [key: string]: number } = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    }, [expiry]);

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearTimeout(timer);
    });

    const timerComponents = Object.keys(timeLeft).length ? (
        Object.entries(timeLeft).map(([interval, value]) => (
            <div key={interval} className="flex flex-col items-center">
                <span className="text-xl md:text-2xl font-bold font-mono tracking-tighter">{String(value).padStart(2, '0')}</span>
                <span className="text-[10px] uppercase -mt-1">{t(interval as TranslationKey)}</span>
            </div>
        ))
    ) : (
        <span>{t('offer_expired')}</span>
    );
    
    if (!Object.keys(timeLeft).length) {
        return (
             <div className="w-full flex items-center justify-center font-semibold">
                <FireIcon className="h-5 w-5 mr-3 text-red-400" />
                 {text} {t('offer_expired')}
            </div>
        )
    }

    return (
        <div className="w-full flex items-center justify-center space-x-2 md:space-x-4">
            <FireIcon className="h-5 w-5 mr-2 text-orange-300 animate-pulse"/>
            <span className="font-semibold text-sm md:text-base text-center">{text}</span>
            <div className="flex items-center space-x-2 md:space-x-3 text-center">
                {timerComponents}
            </div>
        </div>
    );
};

const AttendanceStatus: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { t, formatTime } = useTranslation();
    const { showToast } = useToast();
    const { currentUser, attendance } = state;

    const today = new Date().toISOString().split('T')[0];

    const todaysRecord = useMemo(() => {
        return attendance.find(a => a.userId === currentUser?.id && a.date === today);
    }, [attendance, currentUser, today]);

    const status = useMemo(() => {
        if (!todaysRecord) return 'out';
        if (todaysRecord.clockIn && !todaysRecord.clockOut) return 'in';
        return 'out';
    }, [todaysRecord]);

    const handleClockIn = () => {
        if (currentUser) {
            dispatch({ type: ActionType.CLOCK_IN, payload: { userId: currentUser.id } });
            showToast(t('clock_in_success'), 'success');
        }
    };
    
    const handleClockOut = () => {
         if (currentUser) {
            dispatch({ type: ActionType.CLOCK_OUT, payload: { userId: currentUser.id } });
            showToast(t('clock_out_success'), 'info');
        }
    };

    if (!currentUser || !['staff', 'sales_manager'].includes(currentUser.role)) {
        return null;
    }
    
    return status === 'in' ? (
        <button
            onClick={handleClockOut}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-white bg-red-500 rounded-full hover:bg-red-600 transition-colors"
            title={`${t('you_are_clocked_in_at', { time: formatTime(todaysRecord!.clockIn) })}`}
        >
            <FingerPrintIcon className="h-5 w-5" />
            <span>{t('clock_out')}</span>
        </button>
    ) : (
        <button
            onClick={handleClockIn}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-white bg-green-500 rounded-full hover:bg-green-600 transition-colors"
            title={t('you_are_not_clocked_in')}
        >
            <FingerPrintIcon className="h-5 w-5" />
            <span>{t('clock_in')}</span>
        </button>
    );
};

const QuickSettingsPanel: React.FC<{onClose: () => void}> = ({onClose}) => {
    const { t } = useTranslation();
    const { preferences, setPreferences } = useUserPreferences();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setPreferences({ [name]: value });
    };
    
    const themes = [
        { value: 'light', nameKey: 'indigo_theme' as TranslationKey }, { value: 'dark', nameKey: 'dark_theme' as TranslationKey },
        { value: 'light-green', nameKey: 'light_green_theme' as TranslationKey }, { value: 'amber', nameKey: 'amber_theme' as TranslationKey },
        { value: 'rose', nameKey: 'rose_theme' as TranslationKey }, { value: 'teal', nameKey: 'teal_theme' as TranslationKey },
        { value: 'slate', nameKey: 'slate_theme' as TranslationKey }, { value: 'astra', nameKey: 'astra_theme' as TranslationKey },
    ];
    const languageOptions = [
        {value: 'en', label: 'English'}, {value: 'bn', label: 'Bengali'}, {value: 'hi', label: 'Hindi'},
        {value: 'zh', label: 'Chinese'}, {value: 'ja', label: 'Japanese'},
        {value: 'ur', label: 'Urdu'}, {value: 'ms', label: 'Malay'},
    ];
    const currencyOptions = [
         {value: 'BDT', label: 'BDT'}, {value: 'INR', label: 'INR'}, {value: 'CNY', label: 'CNY'},
         {value: 'USD', label: 'USD'}, {value: 'EUR', label: 'EUR'}, {value: 'GBP', label: 'GBP'},
         {value: 'MYR', label: 'MYR'},
    ];
    const timeZoneOptions = [
      { value: 'UTC', label: 'UTC' }, { value: 'America/New_York', label: 'America/New_York (EST)' },
      { value: 'Europe/London', label: 'Europe/London (GMT)' }, { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
      { value: 'Asia/Dhaka', label: 'Asia/Dhaka (BST)' }, { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
      { value: 'Asia/Kuala_Lumpur', label: 'Asia/Kuala_Lumpur (MYT)' }, { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
    ];

    const Select = ({ label, name, value, onChange, options }: { label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: {value: string, label: string}[] }) => (
        <div>
            <label htmlFor={`quick-${name}`} className="block text-sm font-medium mb-1">{label}</label>
            <select id={`quick-${name}`} name={name} value={value} onChange={onChange} className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500">
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
    );

    return (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700 py-1 transition-opacity duration-200 ease-in-out">
            <div className="p-3 font-bold border-b dark:border-gray-700 flex justify-between items-center">
                <span>{t('quick_settings')}</span>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                    <XMarkIcon className="h-4 w-4" />
                </button>
            </div>
            <div className="p-4 space-y-4">
                <Select label={t('theme')} name="theme" value={preferences.theme} onChange={handleChange} options={themes.map(th => ({value: th.value, label: t(th.nameKey)}))} />
                <Select label={t('language')} name="language" value={preferences.language} onChange={handleChange} options={languageOptions} />
                <Select label={t('currency')} name="currency" value={preferences.currency} onChange={handleChange} options={currencyOptions} />
                <Select label={t('time_zone')} name="timeZone" value={preferences.timeZone} onChange={handleChange} options={timeZoneOptions} />
            </div>
        </div>
    );
};


const Header: React.FC = () => {
  const { state, dispatch } = useContext(AppContext);
  const { t, lang, formatDate, formatTime, currency } = useTranslation();
  const { settings, notifications, currentUser, products, customers, suppliers, sales } = state;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const quickSettingsRef = useRef<HTMLDivElement>(null);

  const currencyFormatter = useMemo(() => new Intl.NumberFormat(lang, {
    style: 'currency',
    currency: currency,
  }), [currency, lang]);

  const searchResults = useMemo(() => {
    if (searchQuery.trim().length < 2) {
      return { products: [], customers: [], suppliers: [], sales: [] };
    }
    const lowerCaseQuery = searchQuery.toLowerCase();

    const categoryMap = new Map(settings.productCategories.map(c => [c.id, c.name]));

    const foundProducts = products.filter(p => {
        const categoryName = (categoryMap.get(p.categoryId) || '').toLowerCase();
        return !p.isDeleted && (
            p.id.toLowerCase().includes(lowerCaseQuery) || 
            p.name.toLowerCase().includes(lowerCaseQuery) || 
            categoryName.includes(lowerCaseQuery)
        );
    }).slice(0, 5);
    const foundCustomers = customers.filter(c => c.name.toLowerCase().includes(lowerCaseQuery) || c.phone.includes(lowerCaseQuery)).slice(0, 5);
    const foundSuppliers = suppliers.filter(s => s.company.toLowerCase().includes(lowerCaseQuery) || s.name.toLowerCase().includes(lowerCaseQuery)).slice(0, 5);
    const foundSales = sales.filter(s => s.id.toLowerCase().includes(lowerCaseQuery)).slice(0, 5);

    return { products: foundProducts, customers: foundCustomers, suppliers: foundSuppliers, sales: foundSales };
  }, [searchQuery, products, customers, suppliers, sales, settings.productCategories]);

  const totalResults = Object.values(searchResults).reduce((sum, arr) => sum + arr.length, 0);

  const closeSearch = () => {
    setIsSearchExpanded(false);
    setSearchQuery('');
  };

  useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notificationsRef.current && !notificationsRef.current.contains(target)) setIsNotificationsOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(target)) setIsUserMenuOpen(false);
      if (quickSettingsRef.current && !quickSettingsRef.current.contains(target)) setIsQuickSettingsOpen(false);
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        closeSearch();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isSearchExpanded) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchExpanded]);
  
  const handleScanSuccess = (decodedText: string) => {
      setIsScannerOpen(false);
      setSearchQuery(decodedText.trim());
      setIsSearchExpanded(true);
      setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const navLinks = useMemo(() => {
    const role = currentUser?.role;
    const permissions = settings.permissions;
    if (!role || !permissions) return [];

    const allLinks: { to: string, text: string, icon?: React.FC<any> }[] = [
      { to: '/', text: t('dashboard'), icon: HomeIcon },
      { to: '/sales', text: t('billing'), icon: BanknotesIcon },
      { to: '/shop', text: t('shop'), icon: Squares2X2Icon },
      { to: '/products', text: t('products'), icon: CubeIcon },
      { to: '/customers', text: t('customers'), icon: UserGroupIcon },
      { to: '/suppliers', text: t('suppliers'), icon: BuildingStorefrontIcon },
      { to: '/dues', text: t('dues'), icon: ScaleIcon },
      { to: '/attendance', text: t('attendance'), icon: FingerPrintIcon },
      { to: '/attendance-machines', text: t('attendance_machines'), icon: IdentificationIcon },
      { to: '/reports', text: t('summary_report'), icon: ChartBarIcon },
      { to: '/analytics', text: t('analytics'), icon: ChartPieIcon },
      { to: '/files', text: t('files'), icon: DocumentArrowDownIcon },
      { to: '/users', text: t('users'), icon: UsersIcon },
      { to: '/connected-devices', text: t('connected_devices'), icon: WrenchScrewdriverIcon },
    ];
    
    return allLinks.filter(link => {
        if (role === 'super_user') return true;
        const allowedRoles = permissions[link.to] || [];
        return allowedRoles.includes(role);
    });
  }, [currentUser?.role, settings.permissions, t]);
  
  const timeString = formatTime(currentTime);

  const dayName = new Intl.DateTimeFormat(lang, { weekday: 'long', timeZone: settings.timeZone }).format(currentTime);
  const dateString = formatDate(currentTime);
  const dayAndDateString = `${dayName}, ${dateString}`;
  
  const isOfferActive = settings.countdownOfferEnabled && settings.countdownOfferExpiry && new Date(settings.countdownOfferExpiry) > new Date();


  const ResultSection = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
    <div className="mt-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center mb-2 px-4">
            {icon} <span className="ml-2">{title}</span>
        </h3>
        <ul className="space-y-1">
            {children}
        </ul>
    </div>
  );

  return (
    <>
      <header className="bg-white dark:bg-gray-800 shadow-md relative z-30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <NavLink to="/" className="flex items-center space-x-2">
                <img src={settings.shopLogo} alt="Shop Logo" className="h-10 w-10 rounded-full object-cover" onError={handleImageError} />
                <span className="text-xl font-bold text-gray-800 dark:text-white">{settings.shopName}</span>
              </NavLink>
            </div>
            
            <div ref={searchContainerRef} className="flex items-center space-x-1 sm:space-x-2">
                {isSearchExpanded ? (
                    <div className="relative w-56 sm:w-72">
                         <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" />
                         <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('search_for_products') + '...'}
                            className="w-full bg-gray-100 dark:bg-gray-700 rounded-full pl-10 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <button onClick={closeSearch} className="absolute top-1/2 right-3 -translate-y-1/2 p-1">
                            <XMarkIcon className="h-5 w-5 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" />
                        </button>
                        {searchQuery.trim().length > 1 && (
                            <div className="absolute top-full mt-2 w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-2xl border dark:border-gray-700 overflow-y-auto max-h-[60vh]">
                                <div className="p-2">
                                {totalResults === 0 ? (
                                    <div className="text-center py-10 text-gray-500">
                                        <p>No results found for "{searchQuery}"</p>
                                    </div>
                                ) : (
                                    <>
                                        {searchResults.products.length > 0 && (
                                            <ResultSection title={t('products')} icon={<CubeIcon className="h-4 w-4" />}>
                                                {searchResults.products.map(p => (
                                                    <li key={p.id}>
                                                        <NavLink to="/products" onClick={closeSearch} className="flex items-center space-x-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                                            <img src={p.imageUrl} alt={p.name} className="h-10 w-10 rounded-md object-cover" onError={handleImageError}/>
                                                            <div className="flex-grow">
                                                                <p className="font-semibold">{p.name}</p>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('in_stock')}: {p.stock}</p>
                                                            </div>
                                                            <p className="font-semibold">{currencyFormatter.format(p.price)}</p>
                                                        </NavLink>
                                                    </li>
                                                ))}
                                            </ResultSection>
                                        )}
                                        {searchResults.products.length > 0 && (searchResults.customers.length > 0 || searchResults.suppliers.length > 0 || searchResults.sales.length > 0) && <hr className="my-1 dark:border-gray-600"/>}
                                        
                                        {searchResults.customers.length > 0 && (
                                            <ResultSection title={t('customers')} icon={<UserIcon className="h-4 w-4" />}>
                                                {searchResults.customers.map(c => (
                                                    <li key={c.id}>
                                                        <NavLink to="/customers" onClick={closeSearch} className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                                            <p className="font-semibold">{c.name}</p>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">{c.phone}</p>
                                                        </NavLink>
                                                    </li>
                                                ))}
                                            </ResultSection>
                                        )}
                                        {searchResults.customers.length > 0 && (searchResults.suppliers.length > 0 || searchResults.sales.length > 0) && <hr className="my-1 dark:border-gray-600"/>}

                                        {searchResults.suppliers.length > 0 && (
                                            <ResultSection title={t('suppliers')} icon={<BuildingStorefrontIcon className="h-4 w-4" />}>
                                                {searchResults.suppliers.map(s => (
                                                    <li key={s.id}>
                                                        <NavLink to="/suppliers" onClick={closeSearch} className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                                            <p className="font-semibold">{s.company}</p>
                                                        </NavLink>
                                                    </li>
                                                ))}
                                            </ResultSection>
                                        )}
                                        {searchResults.suppliers.length > 0 && searchResults.sales.length > 0 && <hr className="my-1 dark:border-gray-600"/>}
                                        
                                        {searchResults.sales.length > 0 && (
                                            <ResultSection title={t('sales_reports')} icon={<DocumentTextIcon className="h-4 w-4" />}>
                                                {searchResults.sales.map(s => (
                                                    <li key={s.id}>
                                                        <NavLink to="/reports" onClick={closeSearch} className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                                            <p className="font-semibold font-mono text-sm">{s.id}</p>
                                                        </NavLink>
                                                    </li>
                                                ))}
                                            </ResultSection>
                                        )}
                                    </>
                                )}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <button onClick={() => setIsSearchExpanded(true)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('search')}>
                        <MagnifyingGlassIcon className="h-6 w-6" />
                    </button>
                )}

                <button onClick={() => setIsScannerOpen(true)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('scan_code')}>
                    <QrCodeIcon className="h-6 w-6" />
                </button>

                <button onClick={() => setIsCalculatorOpen(true)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('calculator')}>
                    <CalculatorIcon className="h-6 w-6" />
                </button>

                {settings.pcBuilderEnabled && currentUser && (currentUser.role === 'super_user' || settings.permissions['/pc-builder']?.includes(currentUser.role)) && (
                    <NavLink to="/pc-builder" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('pc_builder')}>
                        <CpuChipIcon className="h-6 w-6" />
                    </NavLink>
                )}

                 <div className="relative" ref={notificationsRef}>
                    <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('notifications')}>
                        <BellIcon className="h-6 w-6" />
                        {unreadCount > 0 && <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unreadCount}</span>}
                    </button>
                    {isNotificationsOpen && <NotificationDropdown onClose={() => setIsNotificationsOpen(false)} />}
                </div>
                
                 <div className="hidden sm:flex flex-col items-center justify-center text-center px-4 py-1">
                    <span className="font-semibold text-base leading-tight text-gray-800 dark:text-white">{timeString}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{dayAndDateString}</span>
                </div>

                <AttendanceStatus />
                
                {currentUser && ['admin', 'super_user'].includes(currentUser.role) && (
                    <NavLink to="/settings" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('settings')}>
                        <CogIcon className="h-6 w-6" />
                    </NavLink>
                )}

                {currentUser && (
                  <div className="relative hidden sm:block">
                    <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-l dark:border-gray-700 ml-2 pl-4">
                      <img src={currentUser.iconUrl} alt={currentUser.name} className="h-8 w-8 rounded-full object-cover" onError={handleImageError}/>
                      <span className="text-sm font-medium">{currentUser.name}</span>
                    </button>
                    <div ref={userMenuRef}>
                        {isUserMenuOpen && (
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700 py-1 transition-opacity duration-200 ease-in-out">
                             <button onClick={() => { setIsQuickSettingsOpen(true); setIsUserMenuOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <AdjustmentsHorizontalIcon className="h-5 w-5 mr-3" />
                                {t('quick_settings')}
                            </button>
                            <button
                              onClick={() => {
                                dispatch({ type: ActionType.LOGOUT_USER });
                                setIsUserMenuOpen(false);
                              }}
                              className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3" />
                              {t('logout')}
                            </button>
                          </div>
                        )}
                    </div>
                     <div ref={quickSettingsRef}>
                        {isQuickSettingsOpen && <QuickSettingsPanel onClose={() => setIsQuickSettingsOpen(false)} />}
                    </div>
                  </div>
                )}
                <button className="lg:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    <Bars3Icon className="h-6 w-6"/>
                </button>
            </div>
          </div>
          {/* Bottom Nav Area */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="py-2">
                 {isOfferActive ? (
                    <div className="bg-primary-600 dark:bg-primary-700 text-white p-2 text-sm">
                        <CountdownTimer text={settings.countdownOfferText!} expiry={settings.countdownOfferExpiry!} />
                    </div>
                 ) : settings.headerMessage ? (
                    <div className="bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-200 p-2 text-sm overflow-hidden">
                        <div className="animate-marquee whitespace-nowrap">
                            <span>{settings.headerMessage}</span>
                        </div>
                        <style>{`
                            @keyframes marquee {
                                0% { transform: translateX(100%); }
                                100% { transform: translateX(-100%); }
                            }
                            .animate-marquee {
                                display: inline-block;
                                animation: marquee 20s linear infinite;
                                padding-left: 100%;
                            }
                        `}</style>
                    </div>
                 ) : null}
                <nav className="hidden lg:flex justify-center items-center space-x-4 xl:space-x-6 py-2">
                     {navLinks.map(link => (
                         <NavLink key={link.to} to={link.to} className={({ isActive }) => `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                            {link.icon && <link.icon className="h-5 w-5 mr-2"/>}
                            {link.text}
                         </NavLink>
                     ))}
                </nav>
            </div>
          </div>
        </div>
      </header>
       {/* Mobile Menu */}
       {isMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-gray-800">
            <div className="flex sm:hidden items-center justify-center p-4 border-b dark:border-gray-700">
                <div className="flex flex-col items-center justify-center text-center">
                    <span className="font-semibold text-lg leading-tight text-gray-800 dark:text-white">{timeString}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{dayAndDateString}</span>
                </div>
            </div>
            <div className="p-4 border-b dark:border-gray-700 text-center">
                 {isOfferActive ? (
                    <div className="bg-primary-600 dark:bg-primary-700 text-white rounded-md p-2 text-sm">
                        <CountdownTimer text={settings.countdownOfferText!} expiry={settings.countdownOfferExpiry!} />
                    </div>
                 ) : settings.headerMessage ? (
                    <p className="text-sm text-gray-600 dark:text-gray-300">{settings.headerMessage}</p>
                 ) : null}
            </div>
             <nav className="flex flex-col space-y-2 p-4">
              {navLinks.map(link => (
                 <NavLink key={link.to} to={link.to} onClick={() => setIsMenuOpen(false)} className={({ isActive }) => `flex items-center px-3 py-2 rounded-md text-base font-medium ${isActive ? 'bg-primary-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                    {link.icon && <link.icon className="h-5 w-5 mr-2"/>}
                    {link.text}
                 </NavLink>
             ))}
              {currentUser && (
                 <div className="border-t dark:border-gray-700 my-2"></div>
              )}
               {currentUser && (
                  <button
                    onClick={() => {
                        dispatch({ type: ActionType.LOGOUT_USER });
                        setIsMenuOpen(false);
                    }}
                    className="w-full text-left flex items-center px-3 py-2 text-base font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md"
                  >
                    <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3" />
                    {t('logout')}
                  </button>
              )}
             </nav>
          </div>
       )}
       <Calculator isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />
       <BarcodeScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScanSuccess={handleScanSuccess} />
    </>
  );
};


const NotificationDropdown: React.FC<{onClose: () => void}> = ({onClose}) => {
    const { state, dispatch } = useContext(AppContext);
    const { t, lang, formatDate, formatDateTime, currency } = useTranslation();
    const unreadNotifications = state.notifications.filter(n => !n.isRead).slice(0, 5);
    
    const currencyFormatter = useMemo(() => new Intl.NumberFormat(lang, {
        style: 'currency',
        currency: currency,
    }), [currency, lang]);

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'low_stock': return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
            case 'expiry_warning': return <CalendarDaysIcon className="h-5 w-5 text-orange-500" />;
            case 'expiry_alert': return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
            case 'new_due_sale': return <CurrencyDollarIcon className="h-5 w-5 text-primary-500" />;
            case 'due_collection': return <BanknotesIcon className="h-5 w-5 text-green-500" />;
            case 'due_cleared': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
            default: return <BellIcon className="h-5 w-5 text-gray-500" />;
        }
    };
    
    const getLink = (notification: Notification): string => {
        switch (notification.type) {
            case 'low_stock':
            case 'expiry_warning':
            case 'expiry_alert':
                return '/products';
            case 'new_due_sale':
            case 'due_collection':
            case 'due_cleared':
                return '/dues';
            default:
                return '#';
        }
    };

    const formatNotificationMessage = (n: Notification): string => {
        const { type, metadata } = n;
        switch (type) {
            case 'low_stock': return t('notification_low_stock', { productName: metadata.productName, stock: metadata.stock });
            case 'expiry_warning': return t('notification_expiry_warning', { productName: metadata.productName, expiryDate: formatDate(metadata.expiryDate) });
            case 'expiry_alert': return t('notification_expiry_alert', { productName: metadata.productName, expiryDate: formatDate(metadata.expiryDate) });
            case 'new_due_sale': return t('notification_new_due_sale', { customerName: metadata.customerName, amount: currencyFormatter.format(metadata.amount) });
            case 'due_collection': return t('notification_due_collection', { customerName: metadata.customerName, amount: currencyFormatter.format(metadata.amount) });
            case 'due_cleared': return t('notification_due_cleared', { customerName: metadata.customerName });
            default: return 'Unknown notification';
        }
    };

    return (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700">
            <div className="p-3 font-bold border-b dark:border-gray-700">{t('notifications')}</div>
            <div className="max-h-96 overflow-y-auto">
                {unreadNotifications.length > 0 ? (
                    unreadNotifications.map(n => (
                        <NavLink 
                            key={n.id}
                            to={getLink(n)}
                            onClick={() => {
                                dispatch({type: ActionType.DISMISS_NOTIFICATION, payload: {notificationId: n.id}})
                                onClose();
                            }}
                            className="p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-start space-x-3"
                        >
                           <div className="flex-shrink-0 mt-1">{getIcon(n.type)}</div>
                           <div>
                             <p className="text-sm">{formatNotificationMessage(n)}</p>
                             <p className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(n.date)}</p>
                           </div>
                        </NavLink>
                    ))
                ) : (
                    <p className="p-4 text-sm text-gray-500">{t('no_new_notifications')}</p>
                )}
            </div>
             <div className="p-2 text-center text-sm bg-gray-50 dark:bg-gray-900/50 rounded-b-md">
                <NavLink to="/notifications" onClick={onClose} className="text-primary-500 hover:underline font-semibold">{t('view_all')}</NavLink>
            </div>
        </div>
    )
}

export default Header;