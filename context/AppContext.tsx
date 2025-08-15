import React, { createContext, useReducer, ReactNode, useEffect } from 'react';
import { AppState, Action, ActionType, User, DueCollection, Notification, Printer, CardMachine, DiscountOffer, AttendanceRecord, Product, SaleReturn, ServicePurchase, AttendanceMachine, DamagedProduct } from '../types';
import { MOCK_PRODUCTS, MOCK_CUSTOMERS, MOCK_SUPPLIERS, MOCK_SALES, MOCK_SETTINGS, MOCK_NOTIFICATIONS, MOCK_PURCHASES, MOCK_USERS, MOCK_DUE_COLLECTIONS, MOCK_PRINTERS, MOCK_CARD_MACHINES, MOCK_BLUETOOTH_DEVICES, MOCK_NETWORK_DEVICES, MOCK_SERVICE_PURCHASES, MOCK_ATTENDANCE_MACHINES, MOCK_DAMAGED_PRODUCTS } from '../data/mockData';
import { MOCK_USB_DEVICES } from '../data/mockUsbDevices';

// --- Security Enhancement: localStorage Encryption ---
// A simple XOR-based obfuscation function. This is not cryptographically secure
// but provides a layer of protection against casual inspection of localStorage.
const ENCRYPTION_KEY = 'ThisIsASimpleKeyForObfuscationAndSecurity';

const processString = (input: string): string => {
    let output = '';
    for (let i = 0; i < input.length; i++) {
        const charCode = input.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
        output += String.fromCharCode(charCode);
    }
    return output;
};

const encryptState = (state: any): string => {
    try {
        const jsonString = JSON.stringify(state);
        const processed = processString(jsonString);
        return btoa(processed); // Base64 encode to handle special characters
    } catch (e) {
        console.error("Failed to encrypt state", e);
        return '';
    }
};

const decryptState = (encryptedState: string): any | null => {
    try {
        const decoded = atob(encryptedState);
        const processed = processString(decoded);
        return JSON.parse(processed);
    } catch (e) {
        // This can happen if data is corrupted or not encrypted.
        // We'll also try to parse as plain JSON for backward compatibility.
        try {
            return JSON.parse(encryptedState);
        } catch (jsonError) {
             console.error("Failed to decrypt state, possibly corrupt data.", e);
             return null;
        }
    }
};

const initialState: AppState = {
  products: MOCK_PRODUCTS,
  printers: MOCK_PRINTERS,
  cardMachines: MOCK_CARD_MACHINES,
  customers: MOCK_CUSTOMERS,
  suppliers: MOCK_SUPPLIERS,
  sales: MOCK_SALES,
  saleReturns: [],
  purchases: MOCK_PURCHASES,
  servicePurchases: MOCK_SERVICE_PURCHASES,
  dueCollections: MOCK_DUE_COLLECTIONS,
  attendance: [],
  attendanceMachines: MOCK_ATTENDANCE_MACHINES,
  damagedProducts: MOCK_DAMAGED_PRODUCTS,
  settings: MOCK_SETTINGS,
  notifications: MOCK_NOTIFICATIONS,
  users: MOCK_USERS,
  currentUser: null, // No user logged in by default
  loginError: null,
  usbDevices: MOCK_USB_DEVICES,
  bluetoothDevices: MOCK_BLUETOOTH_DEVICES,
  networkDevices: MOCK_NETWORK_DEVICES,
};

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case ActionType.CREATE_SALE_RETURN: {
        const returnPayload = action.payload;

        // 1. Update product stock
        const updatedProducts = state.products.map(p => {
            const returnedItem = returnPayload.items.find(item => item.productId === p.id);
            if (returnedItem) {
                return { ...p, stock: p.stock + returnedItem.quantity };
            }
            return p;
        });

        // 2. Update the original sale record
        const updatedSales = state.sales.map(sale => {
            if (sale.id === returnPayload.originalSaleId) {
                const updatedSaleItems = sale.items.map(saleItem => {
                    const returnedItem = returnPayload.items.find(item => item.productId === saleItem.productId);
                    if (returnedItem) {
                        return {
                            ...saleItem,
                            returnedQuantity: (saleItem.returnedQuantity || 0) + returnedItem.quantity,
                        };
                    }
                    return saleItem;
                });

                // 3. Adjust due amount if original sale was on due
                let updatedPaidAmount = sale.paidAmount;
                if (sale.paymentMethod === 'due') {
                    updatedPaidAmount += returnPayload.total;
                }

                return {
                    ...sale,
                    items: updatedSaleItems,
                    paidAmount: updatedPaidAmount,
                };
            }
            return sale;
        });

        return {
            ...state,
            products: updatedProducts,
            sales: updatedSales,
            saleReturns: [returnPayload, ...state.saleReturns],
        };
    }
    case ActionType.ADD_PRODUCT:
      return { ...state, products: [...state.products, action.payload] };
    case ActionType.EDIT_PRODUCT: {
      const originalProduct = state.products.find(p => p.id === action.payload.id);
      const updatedProduct = action.payload;
      
      let newNotifications = state.notifications;

      if (originalProduct && originalProduct.stock >= 10 && updatedProduct.stock < 10 && updatedProduct.stock > 0) {
        const isExistingNotification = state.notifications.some(n => !n.isRead && n.type === 'low_stock' && n.metadata.productId === updatedProduct.id);
        if (!isExistingNotification) {
          const newNotification: Notification = {
            id: `notif_${crypto.randomUUID()}`,
            type: 'low_stock',
            metadata: { productId: updatedProduct.id, productName: updatedProduct.name, stock: updatedProduct.stock },
            date: new Date().toISOString(),
            isRead: false,
          };
          newNotifications = [newNotification, ...state.notifications];
        }
      }

      return {
        ...state,
        products: state.products.map(p => p.id === action.payload.id ? action.payload : p),
        notifications: newNotifications,
      };
    }
    case ActionType.DELETE_PRODUCT:
      return {
        ...state,
        products: state.products.map(p => p.id === action.payload.productId ? { ...p, isDeleted: true } : p),
      };
    case ActionType.RESTORE_PRODUCT:
       return {
        ...state,
        products: state.products.map(p => p.id === action.payload.productId ? { ...p, isDeleted: false } : p),
      };
    case ActionType.BULK_DELETE_PRODUCTS:
        return {
            ...state,
            products: state.products.map(p => ({ ...p, isDeleted: true })),
        };
    case ActionType.ADD_DAMAGED_PRODUCT: {
        const { productId, quantity } = action.payload;
        const updatedProducts = state.products.map(p => {
            if (p.id === productId) {
                return { ...p, stock: Math.max(0, p.stock - quantity) };
            }
            return p;
        });

        return {
            ...state,
            products: updatedProducts,
            damagedProducts: [action.payload, ...state.damagedProducts],
        };
    }
    case ActionType.ADD_PRINTER:
      return { ...state, printers: [...state.printers, action.payload] };
    case ActionType.EDIT_PRINTER:
      return {
        ...state,
        printers: state.printers.map(p => p.id === action.payload.id ? action.payload : p),
      };
    case ActionType.DELETE_PRINTER:
      return {
        ...state,
        printers: state.printers.map(p => p.id === action.payload.printerId ? { ...p, isDeleted: true } : p),
      };
    case ActionType.RESTORE_PRINTER:
      return {
        ...state,
        printers: state.printers.map(p => p.id === action.payload.printerId ? { ...p, isDeleted: false } : p),
      };
    case ActionType.ADD_CARD_MACHINE:
      return { ...state, cardMachines: [...state.cardMachines, action.payload] };
    case ActionType.EDIT_CARD_MACHINE:
      return {
        ...state,
        cardMachines: state.cardMachines.map(m => m.id === action.payload.id ? action.payload : m),
      };
    case ActionType.DELETE_CARD_MACHINE:
      return {
        ...state,
        cardMachines: state.cardMachines.map(m => m.id === action.payload.machineId ? { ...m, isDeleted: true } : m),
      };
    case ActionType.RESTORE_CARD_MACHINE:
      return {
        ...state,
        cardMachines: state.cardMachines.map(m => m.id === action.payload.machineId ? { ...m, isDeleted: false } : m),
      };
    case ActionType.ADD_CUSTOMER:
        return { ...state, customers: [...state.customers, action.payload] };
    case ActionType.EDIT_CUSTOMER:
        return {
            ...state,
            customers: state.customers.map(c => c.id === action.payload.id ? action.payload : c),
        };
    case ActionType.ADD_SUPPLIER:
        return { ...state, suppliers: [...state.suppliers, action.payload] };
    case ActionType.EDIT_SUPPLIER:
        return {
            ...state,
            suppliers: state.suppliers.map(s => s.id === action.payload.id ? action.payload : s),
        };
    case ActionType.DELETE_SUPPLIER:
        return {
            ...state,
            suppliers: state.suppliers.filter(s => s.id !== action.payload.supplierId),
        };
    case ActionType.ADD_USER: {
        // Passwords are now stored in plaintext. Hashing is removed.
        return { ...state, users: [...state.users, action.payload] };
    }
    case ActionType.EDIT_USER: {
        const { originalId, updatedUser } = action.payload;
        return {
            ...state,
            users: state.users.map(u => {
                if (u.id === originalId) {
                    // Passwords are now stored in plaintext. Hashing is removed.
                    const { password, ...otherUpdates } = updatedUser;
                    const finalUser = { ...u, ...otherUpdates };

                    // Only update the password if a new one was provided
                    if (password) {
                        finalUser.password = password;
                    } else {
                        // Otherwise, ensure the existing password is kept
                        finalUser.password = u.password;
                    }
                    return finalUser;
                }
                return u;
            }),
        };
    }
    case ActionType.DELETE_USER:
        return {
            ...state,
            users: state.users.filter(u => u.id !== action.payload.userId),
        };
    case ActionType.RESET_USER_PASSWORD:
        return {
            ...state,
            users: state.users.map(u => u.id === action.payload.userId ? { ...u, password: action.payload.newPassword } : u),
        };
    case ActionType.CREATE_SALE: {
      const newNotifications: Notification[] = [];
      
      const updatedProducts = state.products.map(p => {
        const itemInSale = action.payload.items.find(item => item.productId === p.id);
        if (itemInSale) {
          const newStock = p.stock - itemInSale.quantity;
          if (newStock < 10 && p.stock >= 10) {
            const isExistingNotification = state.notifications.some(n => !n.isRead && n.type === 'low_stock' && n.metadata.productId === p.id);
            if (!isExistingNotification) {
                newNotifications.push({
                    id: `notif_${crypto.randomUUID()}`,
                    type: 'low_stock',
                    metadata: { productId: p.id, productName: p.name, stock: newStock },
                    date: new Date().toISOString(),
                    isRead: false,
                });
            }
          }
          return { ...p, stock: newStock };
        }
        return p;
      });
      
      if(action.payload.paymentMethod === 'due' && action.payload.total > 0){
        const customer = state.customers.find(c => c.id === action.payload.customerId);
        newNotifications.push({
            id: `notif_${crypto.randomUUID()}`,
            type: 'new_due_sale',
            metadata: { customerId: customer?.id, customerName: customer?.name, amount: action.payload.total },
            date: new Date().toISOString(),
            isRead: false,
        });
      }

      return { 
        ...state, 
        sales: [...state.sales, action.payload],
        products: updatedProducts,
        notifications: [...newNotifications, ...state.notifications]
      };
    }
    case ActionType.COLLECT_DUE: {
        const { customerId, amount } = action.payload;
        const customer = state.customers.find(c => c.id === customerId);
        let amountToSettle = amount;
        
        const updatedSales = state.sales.map(sale => {
            if (sale.customerId === customerId && sale.paidAmount < sale.total && amountToSettle > 0) {
                const dueAmount = sale.total - sale.paidAmount;
                const payment = Math.min(amountToSettle, dueAmount);
                amountToSettle -= payment;
                return { ...sale, paidAmount: sale.paidAmount + payment };
            }
            return sale;
        });

        const newNotifications: Notification[] = [{
            id: `notif_${crypto.randomUUID()}`,
            type: 'due_collection',
            metadata: { customerId: customer?.id, customerName: customer?.name, amount: action.payload.amount },
            date: new Date().toISOString(),
            isRead: false,
        }];
        
        const totalDueAfter = updatedSales
            .filter(s => s.customerId === customerId)
            .reduce((sum, s) => sum + (s.total - s.paidAmount), 0);
            
        if(totalDueAfter < 0.01){
            newNotifications.push({
                id: `notif_${crypto.randomUUID()}`,
                type: 'due_cleared',
                metadata: { customerId: customer?.id, customerName: customer?.name },
                date: new Date().toISOString(),
                isRead: false,
            });
        }

        return {
            ...state,
            sales: updatedSales,
            dueCollections: [...state.dueCollections, action.payload],
            notifications: [...newNotifications, ...state.notifications]
        }
    }
    case ActionType.CREATE_PURCHASE:
      const purchasedProducts = state.products.map(p => {
        const itemPurchased = action.payload.items.find(item => item.productId === p.id);
        if (itemPurchased) {
          return { ...p, stock: p.stock + itemPurchased.quantity };
        }
        return p;
      });
      return {
        ...state,
        purchases: [...state.purchases, action.payload],
        products: purchasedProducts,
      };
    case ActionType.CREATE_SERVICE_PURCHASE:
      return {
          ...state,
          servicePurchases: [...state.servicePurchases, action.payload],
      };
    case ActionType.CLOCK_IN: {
        const { userId } = action.payload;
        const today = new Date().toISOString().split('T')[0];
        const existingRecord = state.attendance.find(a => a.userId === userId && a.date === today);

        if (existingRecord) {
            // Already clocked in or out today, do nothing.
            // A more complex system could handle multiple clock-ins per day.
            return state;
        }

        const newRecord: AttendanceRecord = {
            id: `att_${crypto.randomUUID()}`,
            userId,
            date: today,
            clockIn: new Date().toISOString(),
        };

        return {
            ...state,
            attendance: [...state.attendance, newRecord],
        };
    }
    case ActionType.CLOCK_OUT: {
        const { userId } = action.payload;
        const today = new Date().toISOString().split('T')[0];

        return {
            ...state,
            attendance: state.attendance.map(a => {
                if (a.userId === userId && a.date === today && !a.clockOut) {
                    return { ...a, clockOut: new Date().toISOString() };
                }
                return a;
            }),
        };
    }
    case ActionType.ADD_ATTENDANCE_MACHINE:
      return { ...state, attendanceMachines: [...state.attendanceMachines, action.payload] };
    case ActionType.EDIT_ATTENDANCE_MACHINE:
      return {
        ...state,
        attendanceMachines: state.attendanceMachines.map(m => m.id === action.payload.id ? action.payload : m),
      };
    case ActionType.DELETE_ATTENDANCE_MACHINE:
      return {
        ...state,
        attendanceMachines: state.attendanceMachines.map(m => m.id === action.payload.machineId ? { ...m, isDeleted: true } : m),
      };
    case ActionType.RESTORE_ATTENDANCE_MACHINE:
      return {
        ...state,
        attendanceMachines: state.attendanceMachines.map(m => m.id === action.payload.machineId ? { ...m, isDeleted: false } : m),
      };
    case ActionType.UPDATE_SETTINGS:
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case ActionType.ADD_NOTIFICATION: {
        const { type, metadata } = action.payload;
        let isDuplicate = false;
        if (type === 'low_stock') {
            isDuplicate = state.notifications.some(n => !n.isRead && n.type === 'low_stock' && n.metadata.productId === metadata.productId);
        } else if (type === 'expiry_alert' || type === 'expiry_warning') {
            isDuplicate = state.notifications.some(n => !n.isRead && n.type === type && n.metadata.productId === metadata.productId);
        }
        
        if (isDuplicate) {
            return state; // Don't add duplicate unread notification
        }

        const newNotification: Notification = {
            id: `notif_${crypto.randomUUID()}`,
            date: new Date().toISOString(),
            isRead: false,
            ...action.payload,
        };
        return { ...state, notifications: [newNotification, ...state.notifications] };
    }
    case ActionType.DISMISS_NOTIFICATION:
        return {
            ...state,
            notifications: state.notifications.map(n => n.id === action.payload.notificationId ? {...n, isRead: true} : n)
        };
    case ActionType.MARK_ALL_NOTIFICATIONS_AS_READ:
        return {
            ...state,
            notifications: state.notifications.map(n => ({...n, isRead: true}))
        };
    case ActionType.LOGIN_WITH_PIN: {
        const { userId } = action.payload;
        const userToAuth = state.users.find(u => u.id === userId);

        if (userToAuth) {
            return {
                ...state,
                currentUser: userToAuth,
                loginError: null,
            };
        } else {
            // This should not happen if called from the UI, but as a safeguard:
            return {
                ...state,
                currentUser: null,
                loginError: 'User not found.',
            };
        }
    }
    case ActionType.LOGIN_WITH_PASSWORD: {
        const { userId, password } = action.payload;
        const userToAuth = state.users.find(u => u.id.toLowerCase() === userId.trim().toLowerCase());
        
        // Passwords are now stored in plaintext. Comparing directly.
        if (userToAuth && userToAuth.password === password.trim()) {
            return {
                ...state,
                currentUser: userToAuth,
                loginError: null,
            };
        } else {
            return {
                ...state,
                currentUser: null,
                loginError: 'Invalid User ID or Password.',
            };
        }
    }
    case ActionType.CLEAR_LOGIN_ERROR:
        return { ...state, loginError: null };
    case ActionType.LOGOUT_USER:
        return {
            ...state,
            currentUser: null,
            loginError: null,
        };
    case ActionType.ADD_OFFER:
        return {
            ...state,
            settings: {
                ...state.settings,
                specialOffers: [...state.settings.specialOffers, action.payload]
            }
        };
    case ActionType.EDIT_OFFER:
        return {
            ...state,
            settings: {
                ...state.settings,
                specialOffers: state.settings.specialOffers.map(o => o.id === action.payload.id ? action.payload : o)
            }
        };
    case ActionType.DELETE_OFFER:
        return {
            ...state,
            settings: {
                ...state.settings,
                specialOffers: state.settings.specialOffers.filter(o => o.id !== action.payload.offerId)
            }
        };
    case ActionType.REFRESH_USB_DEVICES:
    case ActionType.REFRESH_BLUETOOTH_DEVICES:
    case ActionType.REFRESH_NETWORK_DEVICES:
      // This is a mocked action. In a real app, you would rescan devices.
      // We can just return the state as is. The component will show a toast.
      return { ...state };
    case ActionType.RESTORE_BACKUP:
      return {
          ...state,
          products: action.payload.products,
          customers: action.payload.customers,
          suppliers: action.payload.suppliers,
          sales: action.payload.sales,
          saleReturns: action.payload.saleReturns || [],
          purchases: action.payload.purchases,
          servicePurchases: action.payload.servicePurchases || [],
          dueCollections: action.payload.dueCollections || [],
          attendance: action.payload.attendance || [],
          attendanceMachines: action.payload.attendanceMachines || [],
          damagedProducts: action.payload.damagedProducts || [],
          printers: action.payload.printers || [],
          cardMachines: action.payload.cardMachines || [],
          usbDevices: action.payload.usbDevices || [],
          bluetoothDevices: action.payload.bluetoothDevices || [],
          networkDevices: action.payload.networkDevices || [],
          settings: action.payload.settings,
          notifications: [],
      };
    case ActionType.CLEAR_ALL_DATA:
        localStorage.removeItem('superShopAppState');
        return { ...initialState, currentUser: null };
    default:
      return state;
  }
};

export const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> }>({
  state: initialState,
  dispatch: () => null,
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState, (initial) => {
    try {
        const savedState = localStorage.getItem('superShopAppState');
        if (savedState) {
            const parsedState = decryptState(savedState);
            if(parsedState){
                // Ensure the user is always logged out on app load for security.
                // Crucially, also refresh the users list from the latest mock data
                // to prevent stale passwords from localStorage causing login issues after an update.
                const savedUsers = parsedState.users || [];
                const mockUsers = initial.users;

                const mergedUsersMap = new Map<string, User>(savedUsers.map((u: User) => [u.id, u]));

                // Update passwords/pins from mock data and add new mock users
                mockUsers.forEach(mockUser => {
                    const savedUser = mergedUsersMap.get(mockUser.id);
                    if (savedUser) {
                        // User exists, update sensitive/mock-driven fields like password and pin
                        savedUser.password = mockUser.password;
                        savedUser.pin = mockUser.pin;
                    } else {
                        // New user from mock data, add them
                        mergedUsersMap.set(mockUser.id, mockUser);
                    }
                });

                return { 
                    ...parsedState, 
                    users: Array.from(mergedUsersMap.values()),
                    currentUser: null, 
                    loginError: null 
                };
            }
        }
    } catch (e) {
        console.error("Failed to parse state from localStorage", e);
    }
    return initial;
  });

  useEffect(() => {
    try {
        const stateToSave = { ...state };
        // Do not persist the current user session or login errors
        delete stateToSave.currentUser;
        delete stateToSave.loginError;
        const encryptedState = encryptState(stateToSave);
        localStorage.setItem('superShopAppState', encryptedState);
    } catch (e) {
        console.error("Failed to save state to localStorage", e);
    }
  }, [state]);


  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
};