export interface ProductCategory {
  id: string;
  name: string;
  enabled: boolean;
}

export interface DiscountOffer {
  id: string;
  name: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  appliesTo: 'all' | 'categories' | 'products';
  targetIds: string[]; // List of product or category IDs. Empty if appliesTo is 'all'.
  enabled: boolean;
  expiryDate?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  price: number;
  mrp?: number;
  purchasePrice: number;
  stock: number;
  unit: string;
  supplierId: string;
  imageUrl: string;
  expiryDate?: string;
  isDeleted: boolean;
  warrantyPeriod?: string;
  guarantyPeriod?: string;
}

export interface DamagedProduct {
  id: string;
  productId: string;
  quantity: number;
  date: string; // ISO String
  reason?: string;
  recordedByUserId: string;
}

export interface Printer {
  id: string;
  name: string;
  type: 'thermal' | 'laser' | 'inkjet';
  connectionType: 'usb' | 'network' | 'lan' | 'bluetooth';
  ipAddress?: string;
  description?: string;
  isDeleted: boolean;
}

export interface CardMachine {
  id: string;
  name: string;
  provider: string;
  status: 'Connected' | 'Disconnected';
  description?: string;
  isDeleted: boolean;
}

export interface UsbDevice {
  id: string;
  name: string;
  type: 'Keyboard' | 'Mouse' | 'Webcam' | 'Storage' | 'Printer' | 'Other';
  status: 'Connected';
}

export interface BluetoothDevice {
  id: string; // MAC Address
  name: string;
  type: 'Headset' | 'Speaker' | 'Phone' | 'Other';
  signalStrength: number; // in dBm
  status: 'Connected' | 'Paired';
}

export interface NetworkDevice {
  ipAddress: string;
  macAddress: string;
  hostname: string;
  type: 'Router' | 'Computer' | 'NAS' | 'Other';
  connection: 'WiFi' | 'Ethernet';
}


export interface Customer {
  id:string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  company: string;
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'staff' | 'sales_manager' | 'super_user' | 'monitor';
  phone: string;
  email?: string;
  iconUrl: string;
  password?: string;
  pin?: string;
}

export interface SaleItem {
  productId: string;
  quantity: number;
  priceAtSale: number;
  discount?: number;
  returnedQuantity?: number;
}

export interface Sale {
  id: string;
  customerId: string;
  items: SaleItem[];
  subtotal: number;
  vatPercentage: number;
  discountAmount: number;
  total: number;
  paidAmount: number;
  paymentMethod: 'due' | 'cash' | 'card' | 'bKash' | 'nagad' | 'rocket' | 'upay';
  date: string;
  soldByUserId?: string;
  cardMachineId?: string;
  cogs?: number; // Cost of Goods Sold at time of sale
}

export interface SaleReturnItem {
  productId: string;
  quantity: number;
  priceAtReturn: number;
}

export interface SaleReturn {
  id: string;
  originalSaleId: string;
  items: SaleReturnItem[];
  total: number;
  reason: string;
  date: string;
  processedByUserId: string;
}

export interface PurchaseItem {
  productId: string;
  quantity: number;
  costPrice: number;
}

export interface Purchase {
  id: string;
  supplierId: string;
  items: PurchaseItem[];
  total: number;
  date: string;
}

export interface ServicePurchaseItem {
  description: string;
  cost: number;
}

export interface ServicePurchase {
  id: string;
  supplierId: string;
  items: ServicePurchaseItem[];
  total: number;
  date: string;
}

export interface SocialLink {
    id: string;
    platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'whatsapp' | 'telegram' | 'gmail' | 'website';
    url: string;
}

export interface DueCollection {
    id: string;
    customerId: string;
    amount: number;
    date: string;
    paymentMethod: 'cash' | 'card' | 'bKash' | 'nagad' | 'rocket' | 'upay';
}

export interface CardPaymentGateway {
    enabled: boolean;
    apiKey: string;
    apiSecret: string;
}

export interface MobileBankingGateway {
    enabled: boolean;
    apiKey: string;
    apiSecret: string;
}

export interface SmsGateway {
    provider: string;
    apiKey: string;
    apiSecret: string;
    senderId: string;
}

export interface CloudBackupProviderSettings {
    enabled: boolean;
    apiKey: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  clockIn: string; // ISO string
  clockOut?: string; // ISO string
}

export interface AttendanceMachine {
  id: string;
  name: string;
  type: 'fingerprint' | 'face_recognition' | 'card_scanner';
  ipAddress?: string;
  status: 'online' | 'offline';
  isDeleted: boolean;
}

export interface Settings {
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  shopLogo: string;
  footerText: string;
  headerMessage?: string;
  developerName: string;
  developerCompany: string;
  theme: 'light' | 'dark' | 'light-green' | 'amber' | 'rose' | 'teal' | 'slate' | 'astra';
  language: 'en' | 'bn' | 'hi' | 'zh' | 'ja' | 'ur' | 'ms';
  currency: 'BDT' | 'INR' | 'CNY' | 'USD' | 'EUR' | 'GBP' | 'MYR';
  barcodeEnabled: boolean;
  pcBuilderEnabled?: boolean;
  purchasesEnabled?: boolean;
  socialLinks: SocialLink[];
  fontFamily: string;
  timeZone: string;
  permissions: {
      [key: string]: Array<User['role']>;
  };
  invoiceDueDateDays?: number;
  invoiceNotes?: string;
  invoiceTerms?: string;
  defaultWarranty?: string;
  defaultGuaranty?: string;
  defaultPrintFormat?: 'invoice' | 'receipt';
  warrantyAndGuarantyEnabled?: boolean;
  deleteAllProductsEnabled?: boolean;
  defaultPrinters?: {
      invoice?: string;
      receipt?: string;
      barcode?: string;
  };
   cardPaymentGateways?: {
      [key: string]: CardPaymentGateway;
  };
  mobileBankingGateways?: {
      [key: string]: MobileBankingGateway;
  };
  smsGateway?: SmsGateway;
  countdownOfferEnabled?: boolean;
  countdownOfferText?: string;
  countdownOfferExpiry?: string;
  specialOffersEnabled?: boolean;
  specialOffers: DiscountOffer[];
  invoiceTitle?: string;
  invoiceAccentColor?: string;
  twoFactorEnabled?: boolean;
  cloudBackup?: {
    automatic: boolean;
    providers: {
        googleDrive: CloudBackupProviderSettings;
        oneDrive: CloudBackupProviderSettings;
        iCloud: CloudBackupProviderSettings;
        mega: CloudBackupProviderSettings;
        pCloud: CloudBackupProviderSettings;
    }
  };
  productCategories: ProductCategory[];
  backupDrivePath?: string;
}

export interface Notification {
    id: string;
    type: 'low_stock' | 'expiry_warning' | 'expiry_alert' | 'new_due_sale' | 'due_collection' | 'due_cleared';
    isRead: boolean;
    date: string;
    metadata: { [key: string]: any }; // e.g., { productId: 'p1', productName: 'Milk', stock: 5 }
}

export interface AppState {
  products: Product[];
  printers: Printer[];
  cardMachines: CardMachine[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  saleReturns: SaleReturn[];
  purchases: Purchase[];
  servicePurchases: ServicePurchase[];
  dueCollections: DueCollection[];
  attendance: AttendanceRecord[];
  attendanceMachines: AttendanceMachine[];
  damagedProducts: DamagedProduct[];
  settings: Settings;
  notifications: Notification[];
  users: User[];
  currentUser: User | null;
  loginError: string | null;
  usbDevices: UsbDevice[];
  bluetoothDevices: BluetoothDevice[];
  networkDevices: NetworkDevice[];
}

export enum ActionType {
    // Sales Returns
    CREATE_SALE_RETURN = 'CREATE_SALE_RETURN',
    
    // Products
    ADD_PRODUCT = 'ADD_PRODUCT',
    EDIT_PRODUCT = 'EDIT_PRODUCT',
    DELETE_PRODUCT = 'DELETE_PRODUCT',
    RESTORE_PRODUCT = 'RESTORE_PRODUCT',
    BULK_DELETE_PRODUCTS = 'BULK_DELETE_PRODUCTS',
    ADD_DAMAGED_PRODUCT = 'ADD_DAMAGED_PRODUCT',
    
    // Printers
    ADD_PRINTER = 'ADD_PRINTER',
    EDIT_PRINTER = 'EDIT_PRINTER',
    DELETE_PRINTER = 'DELETE_PRINTER',
    RESTORE_PRINTER = 'RESTORE_PRINTER',

    // Card Machines
    ADD_CARD_MACHINE = 'ADD_CARD_MACHINE',
    EDIT_CARD_MACHINE = 'EDIT_CARD_MACHINE',
    DELETE_CARD_MACHINE = 'DELETE_CARD_MACHINE',
    RESTORE_CARD_MACHINE = 'RESTORE_CARD_MACHINE',
    
    // Customers
    ADD_CUSTOMER = 'ADD_CUSTOMER',
    EDIT_CUSTOMER = 'EDIT_CUSTOMER',

    // Suppliers
    ADD_SUPPLIER = 'ADD_SUPPLIER',
    EDIT_SUPPLIER = 'EDIT_SUPPLIER',
    DELETE_SUPPLIER = 'DELETE_SUPPLIER',

    // Users
    ADD_USER = 'ADD_USER',
    EDIT_USER = 'EDIT_USER',
    DELETE_USER = 'DELETE_USER',
    RESET_USER_PASSWORD = 'RESET_USER_PASSWORD',

    // Sales
    CREATE_SALE = 'CREATE_SALE',
    COLLECT_DUE = 'COLLECT_DUE',

    // Purchases
    CREATE_PURCHASE = 'CREATE_PURCHASE',
    CREATE_SERVICE_PURCHASE = 'CREATE_SERVICE_PURCHASE',

    // Attendance
    CLOCK_IN = 'CLOCK_IN',
    CLOCK_OUT = 'CLOCK_OUT',

    // Attendance Machines
    ADD_ATTENDANCE_MACHINE = 'ADD_ATTENDANCE_MACHINE',
    EDIT_ATTENDANCE_MACHINE = 'EDIT_ATTENDANCE_MACHINE',
    DELETE_ATTENDANCE_MACHINE = 'DELETE_ATTENDANCE_MACHINE',
    RESTORE_ATTENDANCE_MACHINE = 'RESTORE_ATTENDANCE_MACHINE',

    // Settings
    UPDATE_SETTINGS = 'UPDATE_SETTINGS',

    // Notifications
    ADD_NOTIFICATION = 'ADD_NOTIFICATION',
    DISMISS_NOTIFICATION = 'DISMISS_NOTIFICATION',
    MARK_ALL_NOTIFICATIONS_AS_READ = 'MARK_ALL_NOTIFICATIONS_AS_READ',
    
    // Auth
    LOGOUT_USER = 'LOGOUT_USER',
    LOGIN_WITH_PIN = 'LOGIN_WITH_PIN',
    LOGIN_WITH_PASSWORD = 'LOGIN_WITH_PASSWORD',
    CLEAR_LOGIN_ERROR = 'CLEAR_LOGIN_ERROR',
    
    // Backup & Restore
    RESTORE_BACKUP = 'RESTORE_BACKUP',
    CLEAR_ALL_DATA = 'CLEAR_ALL_DATA',

    // Devices
    REFRESH_USB_DEVICES = 'REFRESH_USB_DEVICES',
    REFRESH_BLUETOOTH_DEVICES = 'REFRESH_BLUETOOTH_DEVICES',
    REFRESH_NETWORK_DEVICES = 'REFRESH_NETWORK_DEVICES',

    // Promotions
    ADD_OFFER = 'ADD_OFFER',
    EDIT_OFFER = 'EDIT_OFFER',
    DELETE_OFFER = 'DELETE_OFFER',
}

export type Action =
  | { type: ActionType.CREATE_SALE_RETURN; payload: SaleReturn }
  | { type: ActionType.ADD_PRODUCT; payload: Product }
  | { type: ActionType.EDIT_PRODUCT; payload: Product }
  | { type: ActionType.DELETE_PRODUCT; payload: { productId: string } }
  | { type: ActionType.RESTORE_PRODUCT; payload: { productId: string } }
  | { type: ActionType.BULK_DELETE_PRODUCTS }
  | { type: ActionType.ADD_DAMAGED_PRODUCT; payload: DamagedProduct }
  | { type: ActionType.ADD_PRINTER; payload: Printer }
  | { type: ActionType.EDIT_PRINTER; payload: Printer }
  | { type: ActionType.DELETE_PRINTER; payload: { printerId: string } }
  | { type: ActionType.RESTORE_PRINTER; payload: { printerId: string } }
  | { type: ActionType.ADD_CARD_MACHINE; payload: CardMachine }
  | { type: ActionType.EDIT_CARD_MACHINE; payload: CardMachine }
  | { type: ActionType.DELETE_CARD_MACHINE; payload: { machineId: string } }
  | { type: ActionType.RESTORE_CARD_MACHINE; payload: { machineId: string } }
  | { type: ActionType.ADD_CUSTOMER; payload: Customer }
  | { type: ActionType.EDIT_CUSTOMER; payload: Customer }
  | { type: ActionType.ADD_SUPPLIER; payload: Supplier }
  | { type: ActionType.EDIT_SUPPLIER; payload: Supplier }
  | { type: ActionType.DELETE_SUPPLIER; payload: { supplierId: string } }
  | { type: ActionType.ADD_USER; payload: User }
  | { type: ActionType.EDIT_USER; payload: { originalId: string; updatedUser: User } }
  | { type: ActionType.DELETE_USER; payload: { userId: string } }
  | { type: ActionType.RESET_USER_PASSWORD; payload: { userId: string; newPassword: string } }
  | { type: ActionType.CREATE_SALE; payload: Sale }
  | { type: ActionType.COLLECT_DUE; payload: DueCollection }
  | { type: ActionType.CREATE_PURCHASE; payload: Purchase }
  | { type: ActionType.CREATE_SERVICE_PURCHASE; payload: ServicePurchase }
  | { type: ActionType.CLOCK_IN; payload: { userId: string } }
  | { type: ActionType.CLOCK_OUT; payload: { userId: string } }
  | { type: ActionType.ADD_ATTENDANCE_MACHINE; payload: AttendanceMachine }
  | { type: ActionType.EDIT_ATTENDANCE_MACHINE; payload: AttendanceMachine }
  | { type: ActionType.DELETE_ATTENDANCE_MACHINE; payload: { machineId: string } }
  | { type: ActionType.RESTORE_ATTENDANCE_MACHINE; payload: { machineId: string } }
  | { type: ActionType.UPDATE_SETTINGS; payload: Partial<Settings> }
  | { type: ActionType.ADD_NOTIFICATION; payload: Omit<Notification, 'id' | 'date' | 'isRead'> }
  | { type: ActionType.DISMISS_NOTIFICATION; payload: { notificationId: string } }
  | { type: ActionType.MARK_ALL_NOTIFICATIONS_AS_READ }
  | { type: ActionType.LOGIN_WITH_PIN; payload: { userId: string } }
  | { type: ActionType.LOGIN_WITH_PASSWORD; payload: { userId: string; password: string } }
  | { type: ActionType.CLEAR_LOGIN_ERROR }
  | { type: ActionType.LOGOUT_USER }
  | { type: ActionType.REFRESH_USB_DEVICES }
  | { type: ActionType.REFRESH_BLUETOOTH_DEVICES }
  | { type: ActionType.REFRESH_NETWORK_DEVICES }
  | { type: ActionType.CLEAR_ALL_DATA }
  | { type: ActionType.ADD_OFFER; payload: DiscountOffer }
  | { type: ActionType.EDIT_OFFER; payload: DiscountOffer }
  | { type: ActionType.DELETE_OFFER; payload: { offerId: string } }
  | { type: ActionType.RESTORE_BACKUP; payload: Omit<AppState, 'currentUser' | 'users' | 'loginError' | 'notifications'> };