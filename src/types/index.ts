export type Category = string;

export type ProductSource = 'Supplier Purchased' | 'Self-Manufactured' | 'Service (Unlimited)';

export interface Product {
  id: string;
  nameEn: string;
  nameSi: string;
  category: Category;
  source: ProductSource;
  costPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  wholesaleMinQty: number;
  stock: number | 'Unlimited';
  lowStockAlert: number;
  brand: string;
  rackLocation: string;
  isWeighted: boolean; // For vegetables/groceries sold by weight (kg)
  isTaxable: boolean;  // Subject to VAT & SSCL
  isHiddenOnline?: boolean; // Option to hide item from online storefront
  imageUrl?: string;
  descriptionEn?: string;
  descriptionSi?: string;
  batches?: ProductBatch[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  loyaltyPoints: number;
  loyaltyTier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  nic?: string;
  birthday?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  companyName: string;
  address?: string;
  notes?: string;
  nic?: string;
  birthday?: string;
  createdAt: string;
}

export type RepairStatus = 'Pending' | 'In Progress' | 'Ready for Pickup' | 'Delivered' | 'Cancelled';
export type DeviceType = 'Phone' | 'Computer' | 'Other';

export interface RepairJob {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deviceType: DeviceType;
  deviceName: string;
  serialNo?: string;
  issueDescription: string;
  assignedTechnician: string;
  estimatedCost: number;
  actualCost?: number;
  status: RepairStatus;
  notes: string;
  createdAt: string;
  completedAt?: string;
  customerAddress?: string;
  imei?: string;
  deviceFrontPhoto?: string;
  deviceBackPhoto?: string;
  expectedReturnDate?: string;
  patternLock?: string;
}

export interface Quotation {
  id: string;
  customerName: string;
  customerPhone: string;
  items: {
    description: string;
    price: number;
    qty: number;
  }[];
  total: number;
  validUntil: string;
  createdAt: string;
  notes?: string;
}

export interface SaleItem {
  productId: string;
  productNameEn: string;
  productNameSi: string;
  priceType: 'Retail' | 'Wholesale';
  price: number; // Unit price or Price per kg
  quantity: number; // Count or Weight in kg
  cost: number; // cost price snapshot
  isWeighted: boolean;
  isTaxable: boolean;
  taxAmount: number; // Combined VAT + SSCL for this line
  vatAmount: number;
  ssclAmount: number;
}

export interface Sale {
  id: string;
  customerId?: string;
  customerName?: string;
  cashierId?: string;
  cashierName?: string;
  saleType: 'POS' | 'Online';
  priceType: 'Retail' | 'Wholesale';
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  totalCost: number;
  profit: number;
  totalTax: number; // Combined VAT + SSCL
  vatTotal: number;
  ssclTotal: number;
  paymentMethod: 'Cash' | 'Card' | 'Online Transfer' | 'Pending';
  loyaltyPointsEarned: number;
  loyaltyPointsRedeemed?: number;
  loyaltyRedemptionDiscount?: number;
  createdAt: string;
  isOfflinePending?: boolean; // True if saved offline and waiting to sync
  paymentReference?: string; // Card/Bank transaction details
  amountPaid?: number;
  changeDue?: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  items: {
    productId: string;
    productName: string;
    qty: number;
    costPrice: number;
  }[];
  totalAmount: number;
  status: 'Ordered' | 'Received';
  createdAt: string;
  receivedAt?: string;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  type: 'Wastage' | 'Damage' | 'Manual Correction' | 'Warranty Replacement';
  qtyAdjusted: number;
  reason: string;
  adjustedBy: string;
  createdAt: string;
  warrantyReplacementId?: string; // Link back to WarrantyReplacement record
}

export interface StockReturn {
  id: string;
  type: 'Sales Return' | 'Purchase Return';
  relatedId: string;
  customerOrSupplierName: string;
  items: {
    productId: string;
    productName: string;
    qty: number;
    refundAmount: number;
  }[];
  totalRefund: number;
  reason: string;
  createdAt: string;
  action?: 'Return to Stock' | 'Scrap';
}

export interface WarrantyReplacement {
  id: string;
  originalSaleId: string;
  customerName: string;
  customerPhone?: string;
  originalProductId: string;
  originalProductName: string;
  replacementProductId: string;
  replacementProductName: string;
  quantity: number;
  reason: string;
  handledBy: string;
  createdAt: string;
  notes?: string;
}

export interface Expense {
  id: string;
  category: 'Rent' | 'Electricity' | 'Water' | 'Internet' | 'Salaries' | 'Supplier Payment' | 'Marketing' | 'Other';
  description: string;
  amount: number;
  recordedBy: string;
  createdAt: string;
}

export interface SpecialOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  itemName: string;
  estimatedCost: number;
  advancePaid: number;
  deliveryType: 'Store Pickup' | 'Courier';
  courierAddress?: string;
  courierTrackingNo?: string;
  status: 'Pending' | 'Ordered from Supplier' | 'Arrived' | 'Shipped/Delivered';
  notes?: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  role: 'Admin' | 'Cashier' | 'Technician';
  basicSalary: number;
  commissionRate: number;
  address?: string;
  joinedDate: string;
  walletBalance: number;
  passcode?: string; // Credentials passcode to access POS/Repairs panels
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  status: 'Present' | 'Absent' | 'Leave';
}

export interface CommissionRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  sourceType: 'Repair' | 'Sale';
  sourceId: string;
  amount: number;
  createdAt: string;
}

export interface SystemAuditLog {
  id: string;
  user: string;
  action: string;
  details: string;
  createdAt: string;
  prevHash?: string;
  currentHash?: string;
}

export interface ProductBatch {
  id: string;
  expiryDate: string;
  qty: number;
}

export interface RegisterShift {
  id: string;
  cashierName: string;
  floatCash: number;
  cashSales: number;
  cardSales: number;
  transferSales: number;
  expectedCash: number;
  actualCash: number;
  status: 'Open' | 'Closed';
  openedAt: string;
  closedAt?: string;
}

export interface SmsLog {
  id: string;
  phone: string;
  message: string;
  direction: 'Incoming' | 'Outgoing';
  status: 'Sent' | 'Failed' | 'Received' | 'Pending';
  timestamp: string;
}

export interface BankTransaction {
  id: string;
  saleId: string;
  type: 'Card' | 'QR';
  amount: number;
  prevBalance: number;
  newBalance: number;
  timestamp: string;
}

export interface ShopSettings {
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  shopEmail: string;
  shopLogoUrl: string;
  taxRegistrationNo: string;
  receiptFooterMessage: string;
  loyaltyPointValue: number;
  pointRedemptionValue: number;
  posShortcuts: {
    completeSale: string;
    clearCart: string;
    addCustomer: string;
    focusSearch?: string;
    cashCheckout?: string;
    cardCheckout?: string;
    bankCheckout?: string;
  };
  receiptWidth: '58mm' | '80mm' | 'A4';
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
  qrCodeUrl: string;
  vatRate: number;  // VAT % (e.g. 15 for Sri Lanka)
  ssclRate: number; // SSCL % (e.g. 2.5 for Sri Lanka)
  
  // ONLINE STORE EDITABLE VARIABLES
  onlineStoreName: string;
  onlineStoreLogoUrl: string;
  onlineHeaderBgColor: string; // Hex or CSS tailwind class e.g. 'bg-slate-900'
  onlineHeroBannerUrl: string;
  heroBannerUrls?: string[]; // Array of banner image URLs for carousel slideshow
  onlinePrimaryThemeColor: string; // e.g. bg-blue-600
  fontSize?: 'sm' | 'base' | 'lg' | 'xl';
  
  // THEME AND SECURITY ADVANCED VARIABLES
  uiTheme?: 'slate' | 'oled' | 'glass' | 'emerald';
  adminPin?: string;

  // FEATURE TOGGLES
  enableSms?: boolean;
  enableRepairs?: boolean;
  enableSpecialOrders?: boolean;
  enableHP?: boolean;
  enableBatches?: boolean;

  // ONLINE STORE EDITABLE CONTACT DETAILS
  onlinePhone?: string;
  onlineEmail?: string;
  onlineAddress?: string;
  onlineTagline?: string;
  onlineAnnouncementMessage?: string;
  onlineAnnouncementBgColor?: string;

  // ROLE-BASED ACCESS CONTROL PERMISSIONS
  rolePermissions?: {
    cashier: {
      allowPOS: boolean;
      allowRepairs: boolean;
      allowCustomers: boolean;
      allowInventory: boolean;
    };
    technician: {
      allowPOS: boolean;
      allowRepairs: boolean;
      allowCustomers: boolean;
      allowInventory: boolean;
    };
  };

  // CLOUD SMS GATEWAY SETTINGS
  smsProvider?: 'Twilio' | 'Alert.lk' | 'Notify.lk' | 'Custom';
  smsApiKey?: string;
  smsSenderId?: string;
  smsUsername?: string; // Twilio Account SID or other username
  smsCustomUrlTemplate?: string;
}

export interface Review {
  id: string;
  productId: string;
  customerName: string;
  customerPhone: string;
  rating: number; // 1 to 5
  comment: string;
  isVerified: boolean;
  createdAt: string;
}

