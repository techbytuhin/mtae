import React, { useContext, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { ActionType, Notification } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { 
    BellIcon, 
    ExclamationTriangleIcon, 
    CalendarDaysIcon, 
    CheckCircleIcon, 
    CurrencyDollarIcon, 
    BanknotesIcon 
} from '@heroicons/react/24/outline';

const Notifications: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { t, lang, formatDate, formatDateTime, currency } = useTranslation();
    const { notifications } = state;

    const sortedNotifications = useMemo(() => 
        [...notifications].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [notifications]);

    const handleMarkAllAsRead = () => {
        dispatch({ type: ActionType.MARK_ALL_NOTIFICATIONS_AS_READ });
    };

    const currencyFormatter = useMemo(() => new Intl.NumberFormat(lang, {
        style: 'currency',
        currency: currency,
    }), [currency, lang]);

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'low_stock': return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
            case 'expiry_warning': return <CalendarDaysIcon className="h-6 w-6 text-orange-500" />;
            case 'expiry_alert': return <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />;
            case 'new_due_sale': return <CurrencyDollarIcon className="h-6 w-6 text-primary-500" />;
            case 'due_collection': return <BanknotesIcon className="h-6 w-6 text-green-500" />;
            case 'due_cleared': return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
            default: return <BellIcon className="h-6 w-6 text-gray-500" />;
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">{t('all_notifications')}</h1>
                <button 
                    onClick={handleMarkAllAsRead}
                    className="bg-primary-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-600 flex items-center transition-colors disabled:bg-primary-300"
                    disabled={notifications.every(n => n.isRead)}
                >
                    {t('mark_all_as_read')}
                </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {sortedNotifications.length > 0 ? (
                        sortedNotifications.map(notification => (
                            <li key={notification.id}>
                                <NavLink
                                    to={getLink(notification)}
                                    onClick={() => dispatch({ type: ActionType.DISMISS_NOTIFICATION, payload: { notificationId: notification.id }})}
                                    className={`p-4 flex items-start space-x-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${notification.isRead ? 'opacity-60' : ''}`}
                                >
                                    <div className="flex-shrink-0 mt-1">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{formatNotificationMessage(notification)}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(notification.date)}</p>
                                    </div>
                                    {!notification.isRead && (
                                        <div className="flex-shrink-0 self-center">
                                            <span className="h-2.5 w-2.5 bg-primary-500 rounded-full"></span>
                                        </div>
                                    )}
                                </NavLink>
                            </li>
                        ))
                    ) : (
                        <li className="p-8 text-center text-gray-500">{t('no_notifications_found')}</li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default Notifications;