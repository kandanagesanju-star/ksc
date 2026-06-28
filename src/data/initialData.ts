import { Product, Customer, Supplier, RepairJob, Sale, Employee, AttendanceRecord, CommissionRecord, SpecialOrder, Expense, StockAdjustment, StockReturn, Quotation, SystemAuditLog, ShopSettings } from '../types';

export const initialProducts: Product[] = [
  {
    id: 'P001',
    nameEn: 'Tempered Glass Screen Protector (iPhone 13/14)',
    nameSi: 'ටෙම්පර්ඩ් ග්ලාස් (iPhone 13/14)',
    category: 'Phone Accessories',
    source: 'Supplier Purchased',
    costPrice: 150,
    retailPrice: 450,
    wholesalePrice: 250,
    wholesaleMinQty: 10,
    stock: 45,
    lowStockAlert: 10,
    brand: 'Premium-X',
    rackLocation: 'Rack A-2',
    isWeighted: false,
    isTaxable: true,
    imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'P002',
    nameEn: 'Fast Charging USB-C Cable 1M',
    nameSi: 'වේගවත් ආරෝපණ USB-C කේබලය 1M',
    category: 'Phone Accessories',
    source: 'Supplier Purchased',
    costPrice: 200,
    retailPrice: 650,
    wholesalePrice: 350,
    wholesaleMinQty: 5,
    stock: 80,
    lowStockAlert: 15,
    brand: 'Anker',
    rackLocation: 'Rack A-3',
    isWeighted: false,
    isTaxable: true,
    imageUrl: 'https://images.unsplash.com/photo-1541660724482-65d97a3a4970?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'C001',
    nameEn: 'Kingston 8GB DDR4 3200MHz RAM',
    nameSi: 'කිංග්ස්ටන් 8GB DDR4 රැම් (RAM)',
    category: 'Computer Parts',
    source: 'Supplier Purchased',
    costPrice: 4500,
    retailPrice: 7500,
    wholesalePrice: 5800,
    wholesaleMinQty: 5,
    stock: 18,
    lowStockAlert: 4,
    brand: 'Kingston',
    rackLocation: 'Cabinet B-1',
    isWeighted: false,
    isTaxable: true,
    imageUrl: 'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'V001',
    nameEn: 'Fresh Sri Lankan Carrots (1kg)',
    nameSi: 'නැවුම් කැරට් (1kg)',
    category: 'Grocery Items',
    source: 'Supplier Purchased',
    costPrice: 180,
    retailPrice: 320,
    wholesalePrice: 240,
    wholesaleMinQty: 10,
    stock: 120,
    lowStockAlert: 15,
    brand: 'Local Farm',
    rackLocation: 'Veggie Rack-1',
    isWeighted: true, // Sold by weight
    isTaxable: false, // Vegetables are usually tax-exempt in SL
    imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'V002',
    nameEn: 'Fresh Red Onions (1kg)',
    nameSi: 'රතු ළූණු (1kg)',
    category: 'Grocery Items',
    source: 'Supplier Purchased',
    costPrice: 240,
    retailPrice: 450,
    wholesalePrice: 350,
    wholesaleMinQty: 10,
    stock: 200,
    lowStockAlert: 20,
    brand: 'Local Farm',
    rackLocation: 'Veggie Rack-2',
    isWeighted: true,
    isTaxable: false,
    imageUrl: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'RC001',
    nameEn: 'Dialog Rs.100 Reload / Card',
    nameSi: 'ඩයලොග් රු.100 රීලෝඩ් / කාඩ්පත',
    category: 'Phone Cards & Reload',
    source: 'Service (Unlimited)',
    costPrice: 94,
    retailPrice: 100,
    wholesalePrice: 97,
    wholesaleMinQty: 20,
    stock: 'Unlimited',
    lowStockAlert: 0,
    brand: 'Dialog',
    rackLocation: 'Counter-1',
    isWeighted: false,
    isTaxable: false,
    imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1d704d3?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'S001',
    nameEn: 'A4 Photocopy (Single Side)',
    nameSi: 'A4 ෆොටෝ කොපි (තනි පැත්ත)',
    category: 'Services',
    source: 'Service (Unlimited)',
    costPrice: 3,
    retailPrice: 15,
    wholesalePrice: 10,
    wholesaleMinQty: 50,
    stock: 'Unlimited',
    lowStockAlert: 0,
    brand: 'Shop Service',
    rackLocation: 'Photocopy Area',
    isWeighted: false,
    isTaxable: true,
    imageUrl: 'https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?auto=format&fit=crop&w=300&q=80'
  }
];

export const initialCustomers: Customer[] = [
  {
    id: 'CUST001',
    name: 'Nimal Perera',
    phone: '0771234567',
    email: 'nimal@gmail.com',
    address: 'No 45, Galle Road, Colombo 03',
    notes: 'Regular customer for repairs.',
    loyaltyPoints: 12,
    createdAt: '2025-01-15T10:00:00.000Z'
  },
  {
    id: 'CUST002',
    name: 'Kasun Rathnayake',
    phone: '0719876543',
    email: 'kasun.r@yahoo.com',
    address: '12/A, Kandy Road, Kadawatha',
    notes: 'Wholesale customer.',
    loyaltyPoints: 55,
    createdAt: '2025-02-01T14:30:00.000Z'
  }
];

export const initialSuppliers: Supplier[] = [
  {
    id: 'SUP001',
    name: 'Asela Distributors',
    phone: '0112345678',
    email: 'asela.dist@gmail.com',
    companyName: 'Asela Mobile & Computer Accessories',
    address: 'First Cross Street, Colombo 11',
    notes: 'Primary supplier for tempered glass and fast chargers.',
    createdAt: '2025-01-01T08:00:00.000Z'
  },
  {
    id: 'SUP002',
    name: 'Metropolitan Tech Solutions',
    phone: '0119876543',
    email: 'info@metropolitantech.lk',
    companyName: 'Metropolitan Holdings Ltd',
    address: 'Galle Road, Colombo 04',
    notes: 'Primary supplier for computer parts and SSDs.',
    createdAt: '2025-01-10T09:00:00.000Z'
  }
];

export const initialRepairs: RepairJob[] = [
  {
    id: 'REP001',
    customerId: 'CUST001',
    customerName: 'Nimal Perera',
    customerPhone: '0771234567',
    deviceType: 'Phone',
    deviceName: 'Samsung Galaxy A52',
    serialNo: 'IMEI-883920193849',
    issueDescription: 'Display cracked. Needs full screen replacement.',
    assignedTechnician: 'Asanka (Senior Tech)',
    estimatedCost: 18500,
    status: 'In Progress',
    notes: 'Ordered original Samsung OLED panel. Waiting for delivery from Colombo supplier.',
    createdAt: '2025-02-18T11:20:00.000Z'
  }
];

export const initialSales: Sale[] = [
  {
    id: 'S-1001',
    customerId: 'CUST002',
    customerName: 'Kasun Rathnayake',
    saleType: 'POS',
    priceType: 'Wholesale',
    items: [
      {
        productId: 'C001',
        productNameEn: 'Kingston 8GB DDR4 3200MHz RAM',
        productNameSi: 'කිංග්ස්ටන් 8GB DDR4 රැම් (RAM)',
        priceType: 'Wholesale',
        price: 5800,
        quantity: 5,
        cost: 4500,
        isWeighted: false,
        isTaxable: true,
        taxAmount: 5075, // Simulated VAT (15%) + SSCL (2.5%)
        vatAmount: 4350,
        ssclAmount: 725
      }
    ],
    subtotal: 29000,
    discount: 500,
    total: 28500,
    totalCost: 22500,
    profit: 6000,
    totalTax: 5075,
    vatTotal: 4350,
    ssclTotal: 725,
    paymentMethod: 'Card',
    loyaltyPointsEarned: 28,
    createdAt: '2025-02-18T16:00:00.000Z'
  }
];

export const initialEmployees: Employee[] = [
  {
    id: 'EMP001',
    name: 'Asanka Gunasekara',
    phone: '0775556667',
    role: 'Technician',
    basicSalary: 45000,
    commissionRate: 10,
    address: 'Kurunegala Road, Wariyapola',
    joinedDate: '2024-06-01',
    walletBalance: 0,
    passcode: '4321'
  },
  {
    id: 'EMP002',
    name: 'Dilki Perera',
    phone: '0712223334',
    role: 'Cashier',
    basicSalary: 30000,
    commissionRate: 1,
    address: 'Negombo Road, Kurunegala',
    joinedDate: '2024-11-15',
    walletBalance: 0,
    passcode: '1111'
  }
];

export const initialAttendance: AttendanceRecord[] = [
  {
    id: 'ATT001',
    employeeId: 'EMP001',
    employeeName: 'Asanka Gunasekara',
    date: '2025-02-21',
    clockIn: '08:15',
    clockOut: '17:30',
    status: 'Present'
  },
  {
    id: 'ATT002',
    employeeId: 'EMP002',
    employeeName: 'Dilki Perera',
    date: '2025-02-21',
    clockIn: '08:30',
    clockOut: '17:45',
    status: 'Present'
  }
];

export const initialCommissions: CommissionRecord[] = [
  {
    id: 'COM001',
    employeeId: 'EMP001',
    employeeName: 'Asanka Gunasekara',
    sourceType: 'Repair',
    sourceId: 'REP001',
    amount: 1850,
    createdAt: '2025-02-18T11:20:00.000Z'
  }
];

export const initialSpecialOrders: SpecialOrder[] = [
  {
    id: 'SPO001',
    customerName: 'Roshan Silva',
    customerPhone: '0761122334',
    itemName: 'Logitech MX Master 3S Mouse',
    estimatedCost: 28500,
    advancePaid: 5000,
    deliveryType: 'Courier',
    courierAddress: 'No 15, Circular Road, Kurunegala',
    status: 'Ordered from Supplier',
    notes: 'Customer requested grey color. Courier delivery needed.',
    createdAt: '2025-02-19T10:00:00.000Z'
  }
];

export const initialExpenses: Expense[] = [
  {
    id: 'EXP001',
    category: 'Electricity',
    description: 'Electricity bill for January 2025',
    amount: 14500,
    recordedBy: 'Dilki Perera',
    createdAt: '2025-02-05T12:00:00.000Z'
  },
  {
    id: 'EXP002',
    category: 'Rent',
    description: 'Shop rent for February 2025',
    amount: 45000,
    recordedBy: 'Admin',
    createdAt: '2025-02-01T10:00:00.000Z'
  }
];

export const initialStockAdjustments: StockAdjustment[] = [
  {
    id: 'ADJ001',
    productId: 'P001',
    productName: 'Tempered Glass Screen Protector (iPhone 13/14)',
    type: 'Damage',
    qtyAdjusted: -2,
    reason: 'Fell from shelf and cracked during cleaning',
    adjustedBy: 'Dilki Perera',
    createdAt: '2025-02-20T14:00:00.000Z'
  }
];

export const initialStockReturns: StockReturn[] = [
  {
    id: 'RET001',
    type: 'Sales Return',
    relatedId: 'S-1001',
    customerOrSupplierName: 'Kasun Rathnayake',
    items: [
      {
        productId: 'C001',
        productName: 'Kingston 8GB DDR4 3200MHz RAM',
        qty: 1,
        refundAmount: 5800
      }
    ],
    totalRefund: 5800,
    reason: 'Customer ordered wrong model by mistake',
    createdAt: '2025-02-19T11:00:00.000Z'
  }
];

export const initialQuotations: Quotation[] = [
  {
    id: 'QT001',
    customerName: 'Pradeep Kumara',
    customerPhone: '0714455667',
    items: [
      {
        description: 'Crucial BX500 500GB SSD',
        price: 11500,
        qty: 1
      },
      {
        description: 'Kingston 8GB DDR4 RAM',
        price: 7500,
        qty: 2
      }
    ],
    total: 26500,
    validUntil: '2025-03-01',
    createdAt: '2025-02-20T10:00:00.000Z',
    notes: 'Quotation for full laptop upgrade.'
  }
];

export const initialAuditLogs: SystemAuditLog[] = [
  {
    id: 'LOG001',
    user: 'Dilki Perera',
    action: 'CASHIER_LOGIN',
    details: 'Logged into cashier terminal successfully.',
    createdAt: '2025-02-21T08:00:00.000Z'
  },
  {
    id: 'LOG002',
    user: 'Admin',
    action: 'STOCK_ADJUSTMENT',
    details: 'Adjusted stock for P001 (-2 units due to Damage)',
    createdAt: '2025-02-20T14:00:00.000Z'
  }
];

export const initialSettings: ShopSettings = {
  shopName: 'SmartShop Pro & Repairs',
  shopAddress: 'No 120, Colombo Road, Kurunegala, Sri Lanka',
  shopPhone: '037-2234567 / 077-1234567',
  shopEmail: 'info@smartshoppro.lk',
  shopLogoUrl: 'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?auto=format&fit=crop&w=100&q=80',
  taxRegistrationNo: 'T-10029384-SL',
  receiptFooterMessage: 'Thank You! Come Again. / ඔබට ස්තුතියි! නැවත පැමිණෙන්න.',
  loyaltyPointValue: 1000,
  pointRedemptionValue: 10,
  posShortcuts: {
    completeSale: 'F8',
    clearCart: 'F9',
    addCustomer: 'F3',
    focusSearch: 'F1',
    cashCheckout: 'F2',
    cardCheckout: 'F4',
    bankCheckout: 'F6'
  },
  receiptWidth: '80mm',
  bankName: 'Commercial Bank',
  bankAccountNo: '1002938475',
  bankAccountName: 'SmartShop Pro Holdings',
  qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=CommercialBank-1002938475',
  vatRate: 15,   // 15% VAT Sri Lanka
  ssclRate: 2.5,  // 2.5% SSCL Sri Lanka
  onlineStoreName: 'SmartShop Online',
  onlineStoreLogoUrl: 'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?auto=format&fit=crop&w=100&q=80',
  onlineHeaderBgColor: 'bg-slate-900',
  onlineHeroBannerUrl: '/hero-banner.png',
  heroBannerUrls: ['/hero-banner.png', '/hero-banner-2.png', '/hero-banner-3.png'],
  onlinePrimaryThemeColor: 'bg-blue-600',
  onlinePhone: '+94 11 234 5678',
  onlineEmail: 'info@smartshoppro.lk',
  onlineAddress: 'No. 250, Galle Road, Colombo 03, Sri Lanka',
  onlineTagline: 'Premium Quality & Fast Repairs',
  onlineAnnouncementMessage: '',
  onlineAnnouncementBgColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  uiTheme: 'slate',
  adminPin: '1234',
  enableSms: true,
  enableRepairs: true,
  enableSpecialOrders: true,
  enableHP: true,
  enableBatches: true,
  rolePermissions: {
    cashier: {
      allowPOS: true,
      allowRepairs: false,
      allowCustomers: true,
      allowInventory: false
    },
    technician: {
      allowPOS: false,
      allowRepairs: true,
      allowCustomers: true,
      allowInventory: false
    }
  }
};
