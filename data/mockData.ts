

import { Product, Customer, Supplier, Sale, Settings, Notification, Purchase, User, DueCollection, Printer, CardMachine, BluetoothDevice, NetworkDevice, ProductCategory, DiscountOffer, ServicePurchase, AttendanceMachine, DamagedProduct } from '../types';

export const MOCK_PRODUCT_CATEGORIES: ProductCategory[] = [
    { id: 'cat_motherboard', name: 'Motherboards', enabled: true },
    { id: 'cat_processor', name: 'Processors', enabled: true },
    { id: 'cat_beverages', name: 'Beverages', enabled: true },
    { id: 'cat_dairy_eggs', name: 'Dairy & Eggs', enabled: true },
    { id: 'cat_bakery_breads', name: 'Bakery & Breads', enabled: true },
    { id: 'cat_snacks', name: 'Snacks & Confectionery', enabled: true },
    { id: 'cat_fruits_veg', name: 'Fruits & Vegetables', enabled: true },
    { id: 'cat_electronics', name: 'Electronics', enabled: true },
    { id: 'cat_computer_parts', name: 'Computer Parts', enabled: true },
    { id: 'cat_bill_recharge', name: 'Bill Payment & Recharge', enabled: true },
    { id: 'cat_household', name: 'Household & Cleaning', enabled: false }, // Disabled for testing
];

export const MOCK_OFFERS: DiscountOffer[] = [
    {
        id: 'offer_1',
        name: 'Motherboard Mania',
        discountType: 'percentage',
        discountValue: 10,
        appliesTo: 'categories',
        targetIds: ['cat_motherboard'],
        enabled: true,
    },
    {
        id: 'offer_2',
        name: 'Staff Discount on Snacks',
        discountType: 'fixed',
        discountValue: 50,
        appliesTo: 'products',
        targetIds: [], // Add specific snack product IDs if available
        enabled: true,
    }
];


export const MOCK_PRINTERS: Printer[] = [
  {
    id: 'printer_thermal_1',
    name: 'Cashier Receipt Printer',
    type: 'thermal',
    connectionType: 'usb',
    description: 'Main printer for receipts at the front desk.',
    isDeleted: false,
  },
  {
    id: 'printer_laser_1',
    name: 'Office Laser Printer',
    type: 'laser',
    connectionType: 'network',
    ipAddress: '192.168.1.100',
    description: 'For printing A4 invoices and reports.',
    isDeleted: false,
  },
  {
    id: 'printer_barcode_1',
    name: 'DYMO LabelWriter',
    type: 'thermal',
    connectionType: 'usb',
    description: 'Used for printing product barcode labels.',
    isDeleted: true,
  },
  {
    id: 'printer_lan_1',
    name: 'Warehouse LAN Printer',
    type: 'laser',
    connectionType: 'lan',
    ipAddress: '192.168.1.102',
    description: 'Network printer in the warehouse for packing slips.',
    isDeleted: false,
  },
  {
    id: 'printer_bt_1',
    name: 'Mobile Bluetooth Printer',
    type: 'thermal',
    connectionType: 'bluetooth',
    description: 'Portable printer for on-the-go receipts.',
    isDeleted: false,
  }
];

export const MOCK_ATTENDANCE_MACHINES: AttendanceMachine[] = [
  {
    id: 'attm-001',
    name: 'Main Entrance Fingerprint',
    type: 'fingerprint',
    status: 'online',
    ipAddress: '192.168.1.150',
    isDeleted: false,
  },
  {
    id: 'attm-002',
    name: 'Warehouse Face Scanner',
    type: 'face_recognition',
    status: 'offline',
    ipAddress: '192.168.1.151',
    isDeleted: false,
  },
  {
    id: 'attm-003',
    name: 'Old Card Scanner',
    type: 'card_scanner',
    status: 'offline',
    isDeleted: true,
  }
];

export const MOCK_CARD_MACHINES: CardMachine[] = [
    {
        id: 'cm_1',
        name: 'Front Desk Terminal',
        provider: 'Stripe',
        status: 'Connected',
        description: 'Main card reader at the front counter.',
        isDeleted: false,
    },
    {
        id: 'cm_2',
        name: 'Manager Office POS',
        provider: 'Square',
        status: 'Connected',
        description: 'POS terminal in the manager\'s office for phone orders.',
        isDeleted: false,
    },
    {
        id: 'cm_3',
        name: 'Old Bank Terminal',
        provider: 'Local Bank',
        status: 'Disconnected',
        description: 'Old terminal, kept as a backup.',
        isDeleted: true,
    }
];

export const MOCK_BLUETOOTH_DEVICES: BluetoothDevice[] = [
  { id: '00:1A:7D:DA:71:13', name: 'Bose QC 35 II', type: 'Headset', signalStrength: -55, status: 'Connected' },
  { id: 'BC:F2:92:0A:9C:F5', name: 'JBL Flip 5', type: 'Speaker', signalStrength: -72, status: 'Paired' },
  { id: 'A1:B2:C3:D4:E5:F6', name: 'Staff Smartphone', type: 'Phone', signalStrength: -61, status: 'Connected' },
];

export const MOCK_NETWORK_DEVICES: NetworkDevice[] = [
  { ipAddress: '192.168.1.1', macAddress: 'C0:3E:BA:C1:23:45', hostname: 'router.local', type: 'Router', connection: 'Ethernet' },
  { ipAddress: '192.168.1.15', macAddress: 'A1:B2:C3:D4:E5:F6', hostname: 'manager-pc', type: 'Computer', connection: 'WiFi' },
  { ipAddress: '192.168.1.22', macAddress: 'F1:E2:D3:C4:B5:A6', hostname: 'storage-nas', type: 'NAS', connection: 'Ethernet' },
];


export const MOCK_USERS: User[] = [
  { id: 'Admin', name: 'Admin', role: 'admin', phone: '+8801521761658', email: 'tarikul.uv@gmail.com', iconUrl: 'https://lh3.googleusercontent.com/bLXpGTTIbBxB3XUk8e3nwjqkxWmyKYI4DnF6u2RoTOInI4m_xXvAdbSrdxdFJxKiJX88LYi-ajxpRqQaPd5rjF2fAIxyFcD3TP-_KWaAHtEl_VJ0y_x9kJJAI5aEyod3xyQ6YUVh_qo5ytBt3jBz48P9jcZG08CnsU7GVlVMpwShSlNjsyZOZQ=w1280', password: 'MyAdmin@@', pin: '2050' },
  { id: 'UID-0002', name: 'Staff', role: 'staff', phone: '+80010000001', email: 'staff@shop.com', iconUrl: 'https://lh6.googleusercontent.com/3fQAJoc9A6ldyXI_Ij3isK6Ylr-_xvBdZ3jym09wNpJT0DDuywXB6vJ7PcbJPRKnroLgroCtyWWgmClaZ_zie7JKhrxd5D_iHtVYtO57RizDsEsyGcknAblP7gVn_zhnl2oUt4zXG60=w1280', password: 'password', pin: '1234' },
  { id: 'UID-0003', name: 'Sales Manager', role: 'sales_manager', phone: '+80010000002', email: 'manager@shop.com', iconUrl: 'https://lh5.googleusercontent.com/pprSQ8VFcqo4yxAw2CRgrMqddTt5Cck_mAXUjJgPVzzE5Gp0YY2HgJfO6ANN6h8pq-8hbjAtIjZ8XD2vWVpnfhZOARo_US0mZvrtYJ8JVcMIKs1jBc4XR86C1Z_7vT-bOGfTxVweHbs=w1280', password: 'Rabbi@@##', pin: '2025' },
  { id: 'Monitor', name: 'Mominur Islam', role: 'monitor', phone: '+8801743224300', email: 'mominur0709@gmail.com', iconUrl: 'https://ssl.gstatic.com/s2/profiles/images/silhouette200.png', password: 'MySystem', pin: '2024' },
  { id: 'Developer', name: 'Tarikul Islam', role: 'super_user', phone: '+8801521761658', email: 'trl.uv2025@gmail.com', iconUrl: 'https://lh5.googleusercontent.com/yplhofCnwa6ZE1lKP0x5YRr1877lVTApJ2bSY41Tm_0CKVQFrGveb97FaZj2WQ4F3aEonR-qzQ-NpzzIk6K2nDClBd9KgzftL1JdKgvEnRklZNy3D7jkimawmexaviboyY3woWp9PU=w1280', password: 'Tarikul@@25', pin: '1658' }
];

export const MOCK_SUPPLIERS: Supplier[] = [
    { id: 'sup_intel', name: 'John Doe', phone: '+123456789', address: 'Santa Clara, CA', company: 'Intel Corp' },
    { id: 'sup_amd', name: 'Jane Smith', phone: '+987654321', address: 'Santa Clara, CA', company: 'AMD Inc.' },
    { id: 'sup_local_grocery', name: 'Local Grocer', phone: '+555-1234', address: 'Local Town', company: 'Fresh Foods Ltd.' }
];

export const MOCK_PRODUCTS: Product[] = [];

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'cust_walkin',
    name: 'Walk-in Customer',
    phone: 'N/A',
    email: 'N/A',
    address: 'N/A'
  }
];

export const MOCK_SALES: Sale[] = [];

export const MOCK_PURCHASES: Purchase[] = [];
export const MOCK_SERVICE_PURCHASES: ServicePurchase[] = [];
export const MOCK_DUE_COLLECTIONS: DueCollection[] = [];
export const MOCK_DAMAGED_PRODUCTS: DamagedProduct[] = [];

export const MOCK_SETTINGS: Settings = {
  shopName: 'Mariam Telecom And Enterprise',
  shopAddress: '5520-Tushbhander, Lalmonirhat',
  shopPhone: '+8801521761658',
  shopLogo: 'https://lh6.googleusercontent.com/-oELHr9rynhW3Dhp646zws5OzLVEIEtgIJDieD3EIF4c6Qfi5Sv3PsroxThOmi3WIJp7GKlX-q58InXk4Vzm1y5fE9PJ1qjFEmZjoR__UMvnersC6S6lT9m9xcD4z3RE4rQCPwOs_qc=w1280',
  footerText: '© 2025 Mariam Telecom And Enterprise. All Rights Reserved.',
  headerMessage: 'Grand Opening! Up to 20% off on selected items.',
  developerName: 'Tarikul Islam Tuhin',
  developerCompany: '+8801521761658',
  theme: 'astra',
  language: 'en',
  currency: 'BDT',
  barcodeEnabled: true,
  pcBuilderEnabled: true,
  purchasesEnabled: true,
  deleteAllProductsEnabled: true,
  fontFamily: 'Inter',
  timeZone: 'Asia/Dhaka',
  invoiceDueDateDays: 30,
  invoiceNotes: 'Thank you for your business. Please contact us for any query.',
  invoiceTerms: 'All sales are final. Please check products before leaving.',
  invoiceTitle: 'Invoice/Cash Memo',
  invoiceAccentColor: '#4f46e5',
  defaultWarranty: '1 Year',
  defaultGuaranty: '6 Months',
  defaultPrintFormat: 'invoice',
  warrantyAndGuarantyEnabled: true,
  countdownOfferEnabled: true,
  countdownOfferText: 'Grand Opening Sale Ends In:',
  countdownOfferExpiry: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
  specialOffersEnabled: true,
  specialOffers: MOCK_OFFERS,
  twoFactorEnabled: false,
  productCategories: MOCK_PRODUCT_CATEGORIES,
  backupDrivePath: '',
  cloudBackup: {
    automatic: false,
    providers: {
        googleDrive: { enabled: true, apiKey: 'CONNECTED_VIA_GMAIL' },
        oneDrive: { enabled: false, apiKey: '' },
        iCloud: { enabled: false, apiKey: '' },
        mega: { enabled: false, apiKey: '' },
        pCloud: { enabled: false, apiKey: '' },
    }
  },
  defaultPrinters: {
      invoice: 'printer_laser_1',
      receipt: 'printer_thermal_1',
      barcode: 'printer_barcode_1'
  },
  socialLinks: [
    {id: 'sl1', platform: 'facebook', url: 'https://www.facebook.com/tituhin.io'},
    {id: 'sl2', platform: 'youtube', url: 'https://www.youtube.com/@technicalservicepoint'},
    {id: 'sl3', platform: 'whatsapp', url: 'https://wa.me/+8801521761658'},
    {id: 'sl4', platform: 'gmail', url: 'mailto:trl.uv2025@gmail.com'},
    {id: 'sl5', platform: 'website', url: 'https://sites.google.com/view/technicalservicepoint/management-software'},
  ],
  permissions: {
    '/': ['admin', 'sales_manager', 'monitor'],
    '/sales': ['admin', 'sales_manager', 'staff'],
    '/purchases': ['admin', 'sales_manager'],
    '/products': ['admin', 'sales_manager', 'monitor'],
    '/customers': ['admin', 'sales_manager', 'staff', 'monitor'],
    '/suppliers': ['admin', 'sales_manager', 'monitor'],
    '/reports': ['admin', 'sales_manager', 'monitor'],
    '/dues': ['admin', 'sales_manager', 'monitor'],
    '/users': ['admin', 'super_user', 'monitor'],
    '/settings': ['admin', 'super_user'],
    '/files': ['admin'],
    '/connected-devices': ['admin', 'super_user'],
    '/pc-builder': ['admin', 'sales_manager'],
    '/notifications': ['admin', 'sales_manager', 'staff', 'monitor'],
  },
  cardPaymentGateways: {
      stripe: { enabled: false, apiKey: '', apiSecret: '' },
      square: { enabled: false, apiKey: '', apiSecret: '' },
  },
  mobileBankingGateways: {
      bKash: { enabled: false, apiKey: '', apiSecret: '' },
      nagad: { enabled: false, apiKey: '', apiSecret: '' },
      rocket: { enabled: false, apiKey: '', apiSecret: '' },
      upay: { enabled: false, apiKey: '', apiSecret: '' },
  },
  smsGateway: {
      provider: 'MockSMS',
      apiKey: 'MOCK_API_KEY',
      apiSecret: 'MOCK_API_SECRET',
      senderId: 'ShopOS'
  }
};

export const MOCK_NOTIFICATIONS: Notification[] = [];