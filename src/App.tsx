import { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Storefront } from './components/Storefront';
import { POS } from './components/POS';
import { Inventory } from './components/Inventory';
import { CustomerRepairs } from './components/CustomerRepairs';
import { Analytics } from './components/Analytics';
import { ExpertInsights } from './components/ExpertInsights';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';

import { Dashboard } from './components/Dashboard';
import { ContactsLoyalty } from './components/ContactsLoyalty';
import { PurchasesAdjustments } from './components/PurchasesAdjustments';
import { SpecialOrders } from './components/SpecialOrders';
import { QuotationsRepairs } from './components/QuotationsRepairs';
import { AttendanceStaff } from './components/AttendanceStaff';
import { ReportsPanel } from './components/ReportsPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { getCloudSyncTimestamp, getCloudSyncState, pushLocalStateToCloud, saveCloudDoc, deleteCloudDoc } from './lib/syncService';

import { 
  initialProducts, 
  initialCustomers, 
  initialSuppliers,
  initialRepairs, 
  initialSales,
  initialEmployees,
  initialAttendance,
  initialCommissions,
  initialSpecialOrders,
  initialExpenses,
  initialStockAdjustments,
  initialStockReturns,
  initialQuotations,
  initialAuditLogs,
  initialSettings
} from './data/initialData';

import { 
  Product, Customer, Supplier, RepairJob, Sale, Employee, 
  AttendanceRecord, CommissionRecord, SpecialOrder, Expense, 
  StockAdjustment, StockReturn, Quotation, SystemAuditLog, 
  ShopSettings, RepairStatus, RegisterShift, SmsLog, BankTransaction, WarrantyReplacement,
  Cheque
} from './types';
import { translations } from './lib/translations';
import { 
  ShoppingCart, Laptop, UserCheck, BarChart3, Layers, 
  TrendingUp, Users, Truck, ShoppingBag, FileText, Award, 
  Activity, Settings, Menu, X, ChevronRight, Maximize2, Minimize2, ShieldAlert,
  Download, Upload, ChevronDown, ClipboardList, DollarSign, Package, UserX, FileSpreadsheet, Shield, PieChart, Clock, AlertTriangle, Key, User, Printer, Database, History, AlertCircle, ToggleLeft, CreditCard, MessageSquare, Wrench, RefreshCw, Sliders, Calendar
} from 'lucide-react';

function App() {
  // 1. Core States
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('shop_products');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('shop_customers');
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('shop_suppliers');
    return saved ? JSON.parse(saved) : initialSuppliers;
  });

  const [repairs, setRepairs] = useState<RepairJob[]>(() => {
    const saved = localStorage.getItem('shop_repairs');
    return saved ? JSON.parse(saved) : initialRepairs;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('shop_sales');
    return saved ? JSON.parse(saved) : initialSales;
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('shop_employees');
    return saved ? JSON.parse(saved) : initialEmployees;
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('shop_attendance');
    return saved ? JSON.parse(saved) : initialAttendance;
  });

  const [commissions, setCommissions] = useState<CommissionRecord[]>(() => {
    const saved = localStorage.getItem('shop_commissions');
    return saved ? JSON.parse(saved) : initialCommissions;
  });

  const [specialOrders, setSpecialOrders] = useState<SpecialOrder[]>(() => {
    const saved = localStorage.getItem('shop_special_orders');
    return saved ? JSON.parse(saved) : initialSpecialOrders;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('shop_expenses');
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>(() => {
    const saved = localStorage.getItem('shop_stock_adjustments');
    return saved ? JSON.parse(saved) : initialStockAdjustments;
  });

  const [stockReturns, setStockReturns] = useState<StockReturn[]>(() => {
    const saved = localStorage.getItem('shop_stock_returns');
    return saved ? JSON.parse(saved) : initialStockReturns;
  });

  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const saved = localStorage.getItem('shop_quotations');
    return saved ? JSON.parse(saved) : initialQuotations;
  });

  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>(() => {
    const saved = localStorage.getItem('shop_audit_logs');
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });

  const [cheques, setCheques] = useState<Cheque[]>(() => {
    const saved = localStorage.getItem('shop_cheques');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<ShopSettings>(() => {
    const saved = localStorage.getItem('shop_settings');
    // Merge initialSettings with saved data so any NEW fields always have defaults
    // (prevents missing-field issues when old localStorage data lacks new settings keys)
    const loaded = saved ? { ...initialSettings, ...JSON.parse(saved) } : initialSettings;
    if (loaded.adminPin === '1234') {
      loaded.adminPin = '8892';
    }
    return loaded;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<any[]>(() => {
    const saved = localStorage.getItem('shop_purchase_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [warrantyReplacements, setWarrantyReplacements] = useState<WarrantyReplacement[]>(() => {
    const saved = localStorage.getItem('shop_warranty_replacements');
    return saved ? JSON.parse(saved) : [];
  });

  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('shop_categories');
    return saved ? JSON.parse(saved) : [
      'Phone Accessories',
      'Computer Parts',
      'Electric Items',
      'Drink Items',
      'Food Items',
      'Grocery Items',
      'Phone Cards & Reload',
      'Gift Items',
      'Services'
    ];
  });

  useEffect(() => {
    localStorage.setItem('shop_categories', JSON.stringify(categories));
  }, [categories]);

  const handleAddCategory = (newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    const exists = categories.some(c => c.toLowerCase() === trimmed.toLowerCase());
    if (exists) return;
    setCategories(prev => [...prev, trimmed]);
    addAuditLog('CATEGORY_ADDED', `Added new product category: "${trimmed}".`);
  };

  // DATABASE SNAPSHOT HISTORY STATE (Database Engineer)
  const [dbSnapshots, setDbSnapshots] = useState<any[]>(() => {
    const saved = localStorage.getItem('shop_db_snapshots');
    return saved ? JSON.parse(saved) : [];
  });

  // Backup validation and preview state (Database Engineer & UI/UX Designer)
  const [pendingRestoreData, setPendingRestoreData] = useState<any>(null);
  const [showRestoreModal, setShowRestoreModal] = useState<boolean>(false);
  const [isOverwriteConfirmed, setIsOverwriteConfirmed] = useState<boolean>(false);

  // Shifts state
  const [shifts, setShifts] = useState<RegisterShift[]>(() => {
    const saved = localStorage.getItem('shop_shifts');
    return saved ? JSON.parse(saved) : [];
  });

  // SMS Logs state
  const [smsLogs, setSmsLogs] = useState<SmsLog[]>(() => {
    const saved = localStorage.getItem('shop_sms_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Bank transactions & balance state
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>(() => {
    const saved = localStorage.getItem('shop_bank_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [bankBalance, setBankBalance] = useState<number>(() => {
    const saved = localStorage.getItem('shop_bank_balance');
    return saved ? Number(saved) : 125000;
  });

  // ONLINE/OFFLINE NETWORK SIMULATOR
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSyncSales, setPendingSyncSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('shop_pending_sync');
    return saved ? JSON.parse(saved) : [];
  });

  // Language & View State
  const [language, setLanguage] = useState<'en' | 'si'>(() => {
    const saved = localStorage.getItem('shop_lang');
    return (saved === 'en' || saved === 'si') ? saved : 'en';
  });

  const [viewMode, setViewMode] = useState<'storefront' | 'admin' | 'super-admin'>(() => {
    const saved = localStorage.getItem('shop_view_mode');
    return (saved === 'storefront' || saved === 'admin' || saved === 'super-admin') ? saved : 'storefront';
  });

  const [isSuspended, setIsSuspended] = useState<boolean>(false);
  const [suspensionReason, setSuspensionReason] = useState<'Suspended' | 'Expired'>('Suspended');
  const [subscriptionExpiry, setSubscriptionExpiry] = useState<{ daysRemaining: number; expiryDate: number } | null>(null);

  const [activeUser, setActiveUser] = useState<any>(() => {
    const saved = localStorage.getItem('active_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [adminTab, setAdminTab] = useState<'dashboard' | 'pos' | 'inventory' | 'sales-history' | 'contacts' | 'purchases' | 'special-orders' | 'quotations' | 'attendance' | 'reports' | 'settings' | 'insights' | 'backup'>(() => {
    const saved = localStorage.getItem('shop_admin_tab');
    return saved ? (saved as any) : 'dashboard';
  });

  const [adminSubTab, setAdminSubTab] = useState<string>(() => {
    return localStorage.getItem('shop_admin_sub_tab') || '';
  });

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('shop_expanded_menus');
    return saved ? JSON.parse(saved) : {
      contacts: false,
      purchases: false,
      quotations: false,
      attendance: false,
      reports: false,
      settings: false
    };
  });

  useEffect(() => {
    localStorage.setItem('shop_admin_sub_tab', adminSubTab);
  }, [adminSubTab]);

  useEffect(() => {
    localStorage.setItem('shop_expanded_menus', JSON.stringify(expandedMenus));
  }, [expandedMenus]);

  const toggleMenu = (menuKey: string) => {
    setExpandedMenus(prev => {
      const willBeOpen = !prev[menuKey];
      if (willBeOpen) {
        // If opening this menu, close all other menus
        return {
          contacts: menuKey === 'contacts',
          purchases: menuKey === 'purchases',
          quotations: menuKey === 'quotations',
          attendance: menuKey === 'attendance',
          reports: menuKey === 'reports',
          settings: menuKey === 'settings'
        };
      } else {
        // If closing this menu, just set it to false
        return {
          ...prev,
          [menuKey]: false
        };
      }
    });
  };

  useEffect(() => {
    // Sync sub-tabs on main tab changes if subtab is invalid for the new tab
    if (adminTab === 'contacts') {
      if (!['customers', 'suppliers', 'loyalty', 'debtors', 'sms-gateway'].includes(adminSubTab)) {
        setAdminSubTab('customers');
      }
      setExpandedMenus({
        contacts: true,
        purchases: false,
        quotations: false,
        attendance: false,
        reports: false,
        settings: false
      });
    } else if (adminTab === 'purchases') {
      if (!['purchases', 'adjustments', 'returns'].includes(adminSubTab)) {
        setAdminSubTab('purchases');
      }
      setExpandedMenus({
        contacts: false,
        purchases: true,
        quotations: false,
        attendance: false,
        reports: false,
        settings: false
      });
    } else if (adminTab === 'quotations') {
      if (!['repairs', 'quotations'].includes(adminSubTab)) {
        setAdminSubTab('repairs');
      }
      setExpandedMenus({
        contacts: false,
        purchases: false,
        quotations: true,
        attendance: false,
        reports: false,
        settings: false
      });
    } else if (adminTab === 'attendance') {
      if (!['profiles', 'attendance', 'commissions'].includes(adminSubTab)) {
        setAdminSubTab('profiles');
      }
      setExpandedMenus({
        contacts: false,
        purchases: false,
        quotations: false,
        attendance: true,
        reports: false,
        settings: false
      });
    } else if (adminTab === 'reports') {
      if (!['sales', 'tax', 'expenses', 'profit-loss', 'stock', 'dues', 'estimates', 'warranty', 'turnover', 'shifts', 'wastage'].includes(adminSubTab)) {
        setAdminSubTab('sales');
      }
      setExpandedMenus({
        contacts: false,
        purchases: false,
        quotations: false,
        attendance: false,
        reports: true,
        settings: false
      });
    } else if (adminTab === 'settings') {
      if (!['shop', 'features', 'online-store', 'users', 'pos', 'loyalty', 'bank', 'database', 'logs', 'sms'].includes(adminSubTab)) {
        setAdminSubTab('shop');
      }
      setExpandedMenus({
        contacts: false,
        purchases: false,
        quotations: false,
        attendance: false,
        reports: false,
        settings: true
      });
    } else {
      setAdminSubTab('');
      // Optionally collapse all when moving to a non-collapsible root tab like Dashboard
      setExpandedMenus({
        contacts: false,
        purchases: false,
        quotations: false,
        attendance: false,
        reports: false,
        settings: false
      });
    }
  }, [adminTab]);

  const [isPosFullScreen, setIsPosFullScreen] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [showCustomerPortal, setShowCustomerPortal] = useState(false);
  const [loggedInCustomer, setLoggedInCustomer] = useState<any>(() => {
    const saved = localStorage.getItem('logged_in_customer');
    return saved ? JSON.parse(saved) : null;
  });

  const isTabAllowed = (tab: string) => {
    if (!activeUser) return true;
    if (activeUser.role === 'Admin' || activeUser.id === 'admin') return true;

    const permissions = settings.rolePermissions || {
      cashier: { allowPOS: true, allowRepairs: false, allowCustomers: true, allowInventory: false },
      technician: { allowPOS: false, allowRepairs: true, allowCustomers: true, allowInventory: false }
    };

    if (activeUser.role === 'Cashier') {
      if (tab === 'pos') return permissions.cashier.allowPOS;
      if (tab === 'special-orders') return true;
      if (tab === 'quotations') return permissions.cashier.allowRepairs;
      if (tab === 'contacts') return permissions.cashier.allowCustomers;
      if (tab === 'inventory') return permissions.cashier.allowInventory;
      return false;
    }

    if (activeUser.role === 'Technician') {
      if (tab === 'quotations') return permissions.technician.allowRepairs;
      if (tab === 'special-orders') return true;
      if (tab === 'contacts') return permissions.technician.allowCustomers;
      if (tab === 'inventory') return permissions.technician.allowInventory;
      if (tab === 'pos') return permissions.technician.allowPOS;
      return false;
    }

    return false;
  };

  // Network offline/online listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addAuditLog('NETWORK_STATUS', 'Internet connection restored. Online mode active.');
    };
    const handleOffline = () => {
      setIsOnline(false);
      addAuditLog('NETWORK_STATUS', 'Internet connection lost. Offline mode active.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Font Size Scaling effect (Senior Architect & UI/UX)
  useEffect(() => {
    const size = settings.fontSize || 'base';
    let px = '16px';
    if (size === 'sm') px = '14px';
    if (size === 'lg') px = '18px';
    if (size === 'xl') px = '20px';
    document.documentElement.style.fontSize = px;
  }, [settings.fontSize]);

  // Auto-Lock Inactivity Timer (Cybersecurity Specialist)
  useEffect(() => {
    if (viewMode !== 'admin' || !activeUser) return;

    let lastActivity = Date.now();
    const updateActivity = () => {
      lastActivity = Date.now();
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    const interval = setInterval(() => {
      // Lock after 5 minutes of inactivity (300,000 ms)
      if (Date.now() - lastActivity > 300000 && !showPasscodeModal) {
        setShowPasscodeModal(true);
      }
    }, 10000);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      clearInterval(interval);
    };
  }, [viewMode, activeUser, showPasscodeModal]);

  const getCompleteDatabaseState = () => {
    return {
      products,
      customers,
      suppliers,
      repairs,
      sales,
      employees,
      attendance,
      commissions,
      specialOrders,
      expenses,
      stockAdjustments,
      stockReturns,
      quotations,
      settings,
      cheques,
      lastUpdated: parseInt(localStorage.getItem('shop_last_updated') || '0', 10)
    };
  };

  // Save states to LocalStorage
  useEffect(() => {
    localStorage.setItem('shop_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('shop_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('shop_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('shop_repairs', JSON.stringify(repairs));
  }, [repairs]);

  useEffect(() => {
    localStorage.setItem('shop_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('shop_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('shop_attendance', JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem('shop_commissions', JSON.stringify(commissions));
  }, [commissions]);

  useEffect(() => {
    localStorage.setItem('shop_special_orders', JSON.stringify(specialOrders));
  }, [specialOrders]);

  useEffect(() => {
    localStorage.setItem('shop_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('shop_stock_adjustments', JSON.stringify(stockAdjustments));
  }, [stockAdjustments]);

  useEffect(() => {
    localStorage.setItem('shop_stock_returns', JSON.stringify(stockReturns));
  }, [stockReturns]);

  useEffect(() => {
    localStorage.setItem('shop_quotations', JSON.stringify(quotations));
  }, [quotations]);

  useEffect(() => {
    localStorage.setItem('shop_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('shop_cheques', JSON.stringify(cheques));
  }, [cheques]);

  useEffect(() => {
    try {
      localStorage.setItem('shop_settings', JSON.stringify(settings));
    } catch {
      // Storage quota hit — strip heavy base64 image data and retry silently
      try {
        const stripped = {
          ...settings,
          shopLogoUrl: settings.shopLogoUrl?.startsWith('http') ? settings.shopLogoUrl : '',
          onlineStoreLogoUrl: settings.onlineStoreLogoUrl?.startsWith('http') ? settings.onlineStoreLogoUrl : '',
          heroBannerUrls: (settings.heroBannerUrls || []).filter((u: string) => u.startsWith('http')),
          onlineHeroBannerUrl: settings.onlineHeroBannerUrl?.startsWith('http') ? settings.onlineHeroBannerUrl : '',
        };
        localStorage.setItem('shop_settings', JSON.stringify(stripped));
        setSettings(stripped);
      } catch (e2) {
        console.error('Could not save settings even after stripping images.', e2);
      }
    }
  }, [settings]);



  useEffect(() => {
    localStorage.setItem('shop_purchase_orders', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem('shop_warranty_replacements', JSON.stringify(warrantyReplacements));
  }, [warrantyReplacements]);

  useEffect(() => {
    localStorage.setItem('shop_pending_sync', JSON.stringify(pendingSyncSales));
  }, [pendingSyncSales]);

  useEffect(() => {
    localStorage.setItem('shop_shifts', JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem('shop_sms_logs', JSON.stringify(smsLogs));
  }, [smsLogs]);

  useEffect(() => {
    localStorage.setItem('shop_bank_transactions', JSON.stringify(bankTransactions));
  }, [bankTransactions]);

  useEffect(() => {
    localStorage.setItem('shop_bank_balance', bankBalance.toString());
  }, [bankBalance]);

  useEffect(() => {
    localStorage.setItem('shop_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('shop_view_mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (activeUser) {
      localStorage.setItem('active_user', JSON.stringify(activeUser));
    } else {
      localStorage.removeItem('active_user');
    }
  }, [activeUser]);

  useEffect(() => {
    localStorage.setItem('shop_admin_tab', adminTab);
  }, [adminTab]);

  // SaaS URL Routing and startup check
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
       // Check if dynamic onboarding setup link is clicked
    const setupSyncId = params.get('setupSyncId');
    const setupPassword = params.get('setupPassword');
    const setupShopName = params.get('setupShopName');
    const setupId = params.get('setup');

    if (setupId) {
      const configureShop = async () => {
        try {
          const res = await fetch(`/api/sync?shopId=${encodeURIComponent(setupId)}&setup=true`);
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              localStorage.setItem('shop_sync_id', setupId);
              localStorage.setItem('shop_sync_enabled', 'true');
              localStorage.setItem('shop_sync_private', 'true');
              localStorage.setItem('shop_sync_password', data.password || '8892');
              localStorage.setItem('shop_view_mode', 'storefront'); // Reset super-admin view lock!

              if (data.expiryDate) {
                localStorage.setItem(`expiry_${setupId}`, String(data.expiryDate));
              }

              // Update settings
              const savedSettings = localStorage.getItem('shop_settings');
              const currentSettings = savedSettings ? JSON.parse(savedSettings) : settings;
              const updated = {
                ...currentSettings,
                shopName: data.shopName || 'Connected Shop',
                adminPin: data.password || '8892'
              };
              localStorage.setItem('shop_settings', JSON.stringify(updated));
              
              alert(language === 'en' 
                ? `✅ System configured successfully!\nConnected Shop ID: ${setupId}` 
                : `✅ පද්ධතිය සාර්ථකව සක්‍රීය කරන ලදී!\nසම්බන්ධිත Shop ID එක: ${setupId}`
              );

              // Clean up URL parameters to keep address bar tidy
              window.history.replaceState({}, document.title, window.location.pathname);
              
              // Force page reload to initialize database sync pull cleanly
              localStorage.setItem('shop_sync_force_pull', 'true');
              window.location.reload();
            } else {
              alert(language === 'en' ? '❌ Invalid shop credentials!' : '❌ වැරදි වෙළඳසැල් හැඳුනුම්පතකි!');
            }
          } else {
            alert(language === 'en' ? '❌ Failed to connect to server!' : '❌ සේවාදායකයට සම්බන්ධ විය නොහැක!');
          }
        } catch (err) {
          console.error('Setup configuration failed:', err);
          alert(language === 'en' ? '❌ Connection error!' : '❌ සම්බන්ධතා දෝෂයකි!');
        }
      };
      configureShop();
      return;
    }

    if (setupSyncId) {
      localStorage.setItem('shop_sync_id', setupSyncId);
      localStorage.setItem('shop_sync_enabled', 'true');
      localStorage.setItem('shop_sync_private', 'true');
      localStorage.setItem('shop_view_mode', 'storefront'); // Reset super-admin view lock!
      if (setupPassword) {
        localStorage.setItem('shop_sync_password', setupPassword);
      }
      
      // Update shop name settings dynamically
      const savedSettings = localStorage.getItem('shop_settings');
      const currentSettings = savedSettings ? JSON.parse(savedSettings) : settings;
      const updated = {
        ...currentSettings,
        shopName: setupShopName ? decodeURIComponent(setupShopName) : currentSettings.shopName || 'Connected Shop',
        adminPin: setupPassword || '8892'
      };
      localStorage.setItem('shop_settings', JSON.stringify(updated));
      setSettings(updated);

      alert(language === 'en' 
        ? `✅ System configured successfully!\nConnected Shop ID: ${setupSyncId}` 
        : `✅ පද්ධතිය සාර්ථකව සක්‍රීය කරන ලදී!\nසම්බන්ධිත Shop ID එක: ${setupSyncId}`
      );

      // Clean up URL parameters to keep address bar tidy
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Force page reload to initialize database sync pull cleanly
      localStorage.setItem('shop_sync_force_pull', 'true');
      window.location.reload();
      return;
    }

    if (params.get('view') === 'super-admin') {
      setViewMode('super-admin');
    }
  }, []);

  // Subscription Active Check on startup
  useEffect(() => {
    const checkSubscription = async () => {
      const syncId = localStorage.getItem('shop_sync_id');
      if (!syncId) return;

      // 1. Local fallback simulation check
      const localStatus = localStorage.getItem(`status_${syncId}`);
      const localExpiryStr = localStorage.getItem(`expiry_${syncId}`);
      let localExpired = false;
      let localDaysRemaining = 9999;
      
      if (localExpiryStr) {
        const expiry = Number(localExpiryStr);
        const diff = expiry - Date.now();
        localDaysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (localDaysRemaining <= 0) {
          localExpired = true;
        }
      }

      if (localStatus === 'deactivated' || localExpired) {
        setIsSuspended(true);
        setSuspensionReason(localExpired ? 'Expired' : 'Suspended');
        return;
      } else {
        if (localDaysRemaining <= 30) {
          setSubscriptionExpiry({ daysRemaining: localDaysRemaining, expiryDate: localExpiryStr ? Number(localExpiryStr) : 0 });
        } else {
          setSubscriptionExpiry(null);
        }
      }

      // 2. Cloud Server check
      try {
        const cloudMeta = await getCloudSyncTimestamp(syncId);
        if (cloudMeta.suspended) {
          setIsSuspended(true);
          setSuspensionReason(cloudMeta.reason === 'Expired' ? 'Expired' : 'Suspended');
        } else {
          setIsSuspended(false);
          if (cloudMeta.daysRemaining !== undefined && cloudMeta.daysRemaining <= 30) {
            setSubscriptionExpiry({
              daysRemaining: cloudMeta.daysRemaining,
              expiryDate: cloudMeta.expiryDate || 0
            });
          }
        }
      } catch (err) {
        console.error('Error checking subscription status:', err);
      }
    };
    checkSubscription();
    const interval = setInterval(checkSubscription, 300000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Synchronizer refs to prevent loops and intervals re-registering
  const isPullingRef = useRef(false);
  const isFirstMountRef = useRef(true);
  const lastCheckedCloudTime = useRef<number | null>(null);
  
  const productsRef = useRef(products);
  const salesRef = useRef(sales);
  
  useEffect(() => {
    productsRef.current = products;
  }, [products]);
  
  useEffect(() => {
    salesRef.current = sales;
  }, [sales]);

  // Initialize shop_last_sync_time if not set
  useEffect(() => {
    const lastSyncTimeStr = localStorage.getItem('shop_last_sync_time');
    if (!lastSyncTimeStr) {
      const currentUpdated = localStorage.getItem('shop_last_updated') || '0';
      localStorage.setItem('shop_last_sync_time', currentUpdated);
    }
  }, []);  // Debounced Silent Cloud Push & State Monitor
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    if (isPullingRef.current) return;

    const newTimestamp = Date.now();
    localStorage.setItem('shop_last_updated', newTimestamp.toString());

    const isSyncEnabled = localStorage.getItem('shop_sync_enabled') === 'true';
    const syncId = localStorage.getItem('shop_sync_id');
    if (!isSyncEnabled || !syncId) return;

    const delayDebounce = setTimeout(async () => {
      try {
        const state: any = {
          products: productsRef.current,
          customers,
          suppliers,
          repairs,
          sales: salesRef.current,
          employees,
          attendance,
          commissions,
          specialOrders,
          expenses,
          stockAdjustments,
          stockReturns,
          quotations,
          settings,
          lastUpdated: newTimestamp
        };
        
        await pushLocalStateToCloud(syncId, state);
        localStorage.setItem('shop_last_sync_time', newTimestamp.toString());
        console.log('Silent sync push successful at:', new Date(newTimestamp).toLocaleTimeString());
      } catch (err) {
        console.error('Silent sync push failed:', err);
      }
    }, 1500); // 1.5 second debounce

    return () => clearTimeout(delayDebounce);
  }, [
    products,
    customers,
    suppliers,
    repairs,
    sales,
    employees,
    attendance,
    commissions,
    specialOrders,
    expenses,
    stockAdjustments,
    stockReturns,
    quotations,
    settings
  ]);

  // Silent Real-Time Cloud Synchronizer
  useEffect(() => {
    const isSyncEnabled = localStorage.getItem('shop_sync_enabled') === 'true';
    const syncId = localStorage.getItem('shop_sync_id');
    if (!isSyncEnabled || !syncId) return;

    let isSyncing = false;

    const performSync = async () => {
      if (isSyncing) return;
      isSyncing = true;
      window.dispatchEvent(new Event('shop-sync-start'));

      try {
        const forcePull = localStorage.getItem('shop_sync_force_pull') === 'true';
        const localTimeStr = localStorage.getItem('shop_last_updated') || '0';
        const localTime = parseInt(localTimeStr, 10);
        const lastSyncTimeStr = localStorage.getItem('shop_last_sync_time') || '0';
        const lastSyncTime = parseInt(lastSyncTimeStr, 10);

        // 1. Fetch cloud metadata timestamp
        const cloudMeta = await getCloudSyncTimestamp(syncId);
        
        // Local simulation check fallback
        const localStatus = localStorage.getItem(`status_${syncId}`);
        if (localStatus === 'deactivated' || cloudMeta.suspended) {
          setIsSuspended(true);
          return;
        } else {
          setIsSuspended(false);
        }
        
        // Save private cloud flag
        localStorage.setItem('shop_sync_private', cloudMeta.isPrivate ? 'true' : 'false');

        if (forcePull) {
          // Force download requested (connected to new sync ID)
          if (cloudMeta.found) {
            const cloudState = await getCloudSyncState(syncId);
            if (cloudState) {
              handleSyncPullUpdate(cloudState);
            }
          }
          localStorage.removeItem('shop_sync_force_pull');
        } else if (!cloudMeta.found) {
          // Cloud has no data yet (first time set up)
          if (lastSyncTime === 0) {
            const completeState: any = getCompleteDatabaseState();
            const newTime = Date.now();
            completeState.lastUpdated = newTime;
            const res = await pushLocalStateToCloud(syncId, completeState);
            if (res.shopId && res.shopId !== syncId) {
              localStorage.setItem('shop_sync_id', res.shopId);
            }
            localStorage.setItem('shop_last_updated', newTime.toString());
            localStorage.setItem('shop_last_sync_time', newTime.toString());
          }
        } else if (cloudMeta.lastUpdated > lastSyncTime) {
          // Cloud is newer than what we last synced.
          // Decide conflict using Last-Write-Wins (LWW) silently:
          if (localTime > cloudMeta.lastUpdated) {
            // Local changes are actually newer than the cloud version! Silently upload local.
            const completeState: any = getCompleteDatabaseState();
            completeState.lastUpdated = localTime;
            await pushLocalStateToCloud(syncId, completeState);
            localStorage.setItem('shop_last_sync_time', localTime.toString());
            console.log('Silent push performed to resolve conflict (LWW).');
          } else {
            // Cloud has a newer update than our local database. Silently pull and apply.
            const cloudState = await getCloudSyncState(syncId);
            if (cloudState) {
              handleSyncPullUpdate(cloudState);
              localStorage.setItem('shop_last_sync_time', cloudMeta.lastUpdated.toString());
              localStorage.setItem('shop_last_updated', cloudMeta.lastUpdated.toString());
              console.log('Silent pull performed to update local database (LWW).');
            }
          }
        }
      } catch (err) {
        console.error('Cloud Sync background check error:', err);
      } finally {
        isSyncing = false;
        window.dispatchEvent(new Event('shop-sync-end'));
      }
    };

    // Run sync instantly on start
    performSync();

    // Poll every 4 seconds for real-time responsiveness
    const interval = setInterval(performSync, 4000);

    const handleManualSync = () => {
      performSync();
    };

    const handleManualUploadToCloud = async () => {
      if (isSyncing) return;
      isSyncing = true;
      window.dispatchEvent(new Event('shop-sync-start'));
      try {
        const state = getCompleteDatabaseState();
        const newTimestamp = Date.now();
        state.lastUpdated = newTimestamp;
        const res = await pushLocalStateToCloud(syncId, state);
        if (res.shopId && res.shopId !== syncId) {
          localStorage.setItem('shop_sync_id', res.shopId);
        }
        localStorage.setItem('shop_last_updated', newTimestamp.toString());
        localStorage.setItem('shop_last_sync_time', newTimestamp.toString());
        
        alert(language === 'en' ? 'Successfully uploaded database to cloud!' : 'දත්ත සමුදාය සාර්ථකව Cloud එකට අප්ලෝඩ් කරන ලදී!');
      } catch (err: any) {
        console.error(err);
        alert(language === 'en' ? `Upload failed: ${err.message}` : `අප්ලෝඩ් කිරීම අසාර්ථක විය: ${err.message}`);
      } finally {
        isSyncing = false;
        window.dispatchEvent(new Event('shop-sync-end'));
      }
    };

    window.addEventListener('trigger-shop-sync', handleManualSync);
    window.addEventListener('trigger-shop-upload', handleManualUploadToCloud);
    window.addEventListener('online', handleManualSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('trigger-shop-sync', handleManualSync);
      window.removeEventListener('trigger-shop-upload', handleManualUploadToCloud);
      window.removeEventListener('online', handleManualSync);
    };
  }, []);

  // Apply theme settings to root HTML element (UI/UX Designer & Architect)
  useEffect(() => {
    const themeName = settings.uiTheme || 'slate';
    document.documentElement.className = `theme-${themeName}`;
  }, [settings.uiTheme]);

  // Sync offline sales to cloud
  const triggerOfflineSync = () => {
    if (!isOnline) {
      alert(language === 'en' ? 'Still offline! Please connect to internet to sync.' : 'තවමත් නොබැඳි (Offline) තත්ත්වයේ පවතී. කරුණාකර අන්තර්ජාලය සම්බන්ධ කරන්න.');
      return;
    }

    if (pendingSyncSales.length === 0) return;

    // Move pending sales to active sales
    setSales(prev => [...pendingSyncSales, ...prev]);
    addAuditLog('CLOUD_SYNC_SUCCESS', `Successfully synced ${pendingSyncSales.length} offline bills to cloud database.`);
    setPendingSyncSales([]);
    alert(language === 'en' ? 'All offline bills synced successfully!' : 'නොබැඳි බිල්පත් සියල්ල සාර්ථකව සමමුහුර්ත කරන ලදී!');
  };

  // Central Mutation Handlers
  const handleOpenShift = (cashier: string, float: number) => {
    const newShift: RegisterShift = {
      id: `SHIFT-${Date.now()}`,
      cashierName: cashier,
      floatCash: float,
      cashSales: 0,
      cardSales: 0,
      transferSales: 0,
      expectedCash: float,
      actualCash: 0,
      status: 'Open',
      openedAt: new Date().toISOString()
    };
    setShifts(prev => [newShift, ...prev]);
    addAuditLog('SHIFT_OPENED', `Register shift opened by ${cashier} with float cash Rs. ${float}`);
  };

  const handleCloseShift = (actualCash: number) => {
    setShifts(prev => prev.map(s => {
      if (s.status === 'Open') {
        return {
          ...s,
          actualCash,
          status: 'Closed',
          closedAt: new Date().toISOString()
        };
      }
      return s;
    }));
    addAuditLog('SHIFT_CLOSED', `Register shift closed. Actual cash in drawer: Rs. ${actualCash}`);
  };

  const handleSendSms = async (phone: string, message: string) => {
    // 1. Create a log entry with "Pending" status
    const logId = `SMS-${Date.now()}`;
    const newLog: SmsLog = {
      id: logId,
      phone,
      message,
      direction: 'Outgoing',
      status: 'Pending',
      timestamp: new Date().toISOString()
    };
    
    // Add to state immediately
    setSmsLogs(prev => [newLog, ...prev]);

    // 2. If SMS is disabled, mark as "Sent" (fallback simulator) and return
    if (!settings.enableSms) {
      setSmsLogs(prev => prev.map(log => log.id === logId ? { ...log, status: 'Sent' } : log));
      addAuditLog('SMS_SENT', `Simulated SMS to ${phone}: "${message.slice(0, 35)}..."`);
      return;
    }

    // 3. Clean and format the phone number
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    let formattedPhone = cleanPhone;

    // Convert local format (e.g. 0771234567) to international
    if (settings.smsProvider === 'Twilio') {
      if (cleanPhone.startsWith('0')) {
        formattedPhone = '+94' + cleanPhone.slice(1);
      } else if (!cleanPhone.startsWith('+') && cleanPhone.startsWith('7')) {
        formattedPhone = '+94' + cleanPhone;
      }
    } else {
      // Alert.lk / Notify.lk / Custom Sri Lankan gateways usually want 947xxxxxxxx format
      if (cleanPhone.startsWith('0')) {
        formattedPhone = '94' + cleanPhone.slice(1);
      } else if (cleanPhone.startsWith('+')) {
        formattedPhone = cleanPhone.slice(1);
      } else if (cleanPhone.startsWith('7')) {
        formattedPhone = '94' + cleanPhone;
      }
    }

    try {
      let responseStatus = false;
      let errorMsg = '';

      if (settings.smsProvider === 'Twilio') {
        const auth = btoa(`${settings.smsUsername}:${settings.smsApiKey}`);
        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${settings.smsUsername}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `To=${encodeURIComponent(formattedPhone)}&From=${encodeURIComponent(settings.smsSenderId || '')}&Body=${encodeURIComponent(message)}`
          }
        );
        responseStatus = res.ok;
        if (!res.ok) {
          const errData = await res.json();
          errorMsg = errData.message || 'Twilio API Error';
        }
      } else if (settings.smsProvider === 'Alert.lk') {
        const url = `https://alert.lk/api/v1/send?apikey=${encodeURIComponent(settings.smsApiKey || '')}&sender=${encodeURIComponent(settings.smsSenderId || '')}&to=${formattedPhone}&message=${encodeURIComponent(message)}`;
        const res = await fetch(url, { method: 'GET' });
        responseStatus = res.ok;
        if (!res.ok) errorMsg = `Alert.lk returned status ${res.status}`;
      } else if (settings.smsProvider === 'Notify.lk') {
        const url = `https://api.notify.lk/api/v1/send?api_key=${encodeURIComponent(settings.smsApiKey || '')}&to=${formattedPhone}&message=${encodeURIComponent(message)}&sender_id=${encodeURIComponent(settings.smsSenderId || '')}`;
        const res = await fetch(url, { method: 'GET' });
        responseStatus = res.ok;
        if (!res.ok) errorMsg = `Notify.lk returned status ${res.status}`;
      } else if (settings.smsProvider === 'Custom' && settings.smsCustomUrlTemplate) {
        let url = settings.smsCustomUrlTemplate;
        url = url.replace('[PHONE]', encodeURIComponent(formattedPhone));
        url = url.replace('[MESSAGE]', encodeURIComponent(message));
        const res = await fetch(url, { method: 'GET' });
        responseStatus = res.ok;
        if (!res.ok) errorMsg = `Custom gateway returned status ${res.status}`;
      } else {
        errorMsg = 'Gateway not configured';
      }

      if (responseStatus) {
        setSmsLogs(prev => prev.map(log => log.id === logId ? { ...log, status: 'Sent' } : log));
        addAuditLog('SMS_SENT', `Real SMS sent to ${phone} via ${settings.smsProvider}: "${message.slice(0, 35)}..."`);
      } else {
        throw new Error(errorMsg || 'Failed to dispatch SMS');
      }
    } catch (err: any) {
      console.error('SMS Gateway Error:', err);
      setSmsLogs(prev => prev.map(log => log.id === logId ? { ...log, status: 'Failed' } : log));
      addAuditLog('SMS_FAILED', `Failed to send SMS to ${phone} via ${settings.smsProvider || 'Unknown'}: ${err.message || err}`);
    }
  };

  const handlePayoutStaff = (employeeId: string, amount: number) => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;
    
    setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, walletBalance: Math.max(0, e.walletBalance - amount) } : e));
    
    // Record expense
    const newExpense: Expense = {
      id: `EXP-${Date.now()}`,
      category: 'Salaries',
      description: `Commission payout for ${emp.name}`,
      amount: amount,
      recordedBy: 'Admin',
      createdAt: new Date().toISOString()
    };
    setExpenses(prev => [newExpense, ...prev]);
    addAuditLog('STAFF_PAYOUT', `Paid out Rs. ${amount} commission wallet to ${emp.name}`);
  };

  const handleAddExpense = (newExpense: Expense) => {
    setExpenses(prev => [newExpense, ...prev]);
    addAuditLog('EXPENSE_ADDED', `Recorded expense of Rs. ${newExpense.amount} for category ${newExpense.category}`);
    saveCloudDoc('expenses', newExpense.id, newExpense);
  };

  const handleUpdateExpense = (updatedExpense: Expense) => {
    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
    addAuditLog('EXPENSE_UPDATED', `Updated expense details for ${updatedExpense.category} (Rs. ${updatedExpense.amount})`);
    saveCloudDoc('expenses', updatedExpense.id, updatedExpense);
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
    addAuditLog('EXPENSE_DELETED', `Deleted expense ID ${expenseId}`);
    deleteCloudDoc('expenses', expenseId);
  };

  const handleDeleteSale = (saleId: string) => {
    setSales(prev => prev.filter(s => s.id !== saleId));
    addAuditLog('SALE_DELETED', `Deleted sales transaction/invoice ID ${saleId}`);
    deleteCloudDoc('sales', saleId);
  };

  const handleAddSale = (newSale: Sale) => {
    if (!isOnline) {
      // Offline billing mode
      const offlineSale = { ...newSale, isOfflinePending: true };
      setPendingSyncSales(prev => [offlineSale, ...prev]);
      addAuditLog('OFFLINE_BILL_CREATED', `Offline bill ${newSale.id} created and queued for sync.`);
    } else {
      // Standard online billing
      setSales(prev => [newSale, ...prev]);
      addAuditLog('SALE_COMPLETED', `Completed sale ${newSale.id} for Rs. ${newSale.total}`);
      saveCloudDoc('sales', newSale.id, newSale);
    }

    // Award and deduct loyalty points
    if (newSale.customerId) {
      const pointsEarned = Math.floor(newSale.total / settings.loyaltyPointValue);
      const pointsRedeemed = newSale.loyaltyPointsRedeemed || 0;
      
      setCustomers(prevCust => prevCust.map(c => {
        if (c.id === newSale.customerId) {
          const updated = { 
            ...c, 
            loyaltyPoints: Math.max(0, c.loyaltyPoints + pointsEarned - pointsRedeemed) 
          };
          saveCloudDoc('customers', updated.id, updated);
          return updated;
        }
        return c;
      }));

      if (pointsRedeemed > 0) {
        addAuditLog('LOYALTY_REDEMPTION', `Redeemed ${pointsRedeemed} points for Rs. ${newSale.loyaltyRedemptionDiscount} on sale ${newSale.id}.`);
      }
    }

    // Update bank balance & record bank transaction for Card & Online Transfer
    if (newSale.paymentMethod === 'Card' || newSale.paymentMethod === 'Online Transfer') {
      const type = newSale.paymentMethod === 'Card' ? 'Card' : 'QR';
      const amount = newSale.total;
      setBankBalance(prev => {
        const nextBalance = prev + amount;
        const newTx: BankTransaction = {
          id: `BTX-${Date.now()}`,
          saleId: newSale.id,
          type,
          amount,
          prevBalance: prev,
          newBalance: nextBalance,
          timestamp: new Date().toISOString()
        };
        setBankTransactions(prevTxs => [newTx, ...prevTxs]);
        return nextBalance;
      });
    }

    // Update active register shift stats
    setShifts(prevShifts => {
      return prevShifts.map(s => {
        if (s.status === 'Open') {
          const cashSales = newSale.paymentMethod === 'Cash' ? s.cashSales + newSale.total : s.cashSales;
          const cardSales = newSale.paymentMethod === 'Card' ? s.cardSales + newSale.total : s.cardSales;
          const transferSales = newSale.paymentMethod === 'Online Transfer' ? s.transferSales + newSale.total : s.transferSales;
          const expectedCash = s.floatCash + cashSales;
          return {
            ...s,
            cashSales,
            cardSales,
            transferSales,
            expectedCash
          };
        }
        return s;
      });
    });

    // Award staff commission
    if (newSale.cashierId && newSale.profit > 0) {
      const cashier = employees.find(e => e.id === newSale.cashierId);
      if (cashier) {
        const comAmount = Math.max(0, newSale.profit * (cashier.commissionRate / 100));
        if (comAmount > 0) {
          handleAddCommission({
            id: `COM-${Date.now()}`,
            employeeId: cashier.id,
            employeeName: cashier.name,
            sourceType: 'Sale',
            sourceId: newSale.id,
            amount: comAmount,
            createdAt: new Date().toISOString()
          });
        }
      }
    }
  };

  const handleAddCustomer = (newCustomer: Customer): Customer => {
    setCustomers(prev => [...prev, newCustomer]);
    addAuditLog('CUSTOMER_REGISTERED', `Registered customer ${newCustomer.name}`);
    saveCloudDoc('customers', newCustomer.id, newCustomer);
    return newCustomer;
  };

  const handleAddSupplier = (newSupplier: Supplier) => {
    setSuppliers(prev => [...prev, newSupplier]);
    addAuditLog('SUPPLIER_ADDED', `Added supplier ${newSupplier.companyName}`);
    saveCloudDoc('suppliers', newSupplier.id, newSupplier);
  };

  const handleAddCheque = (newCheque: Cheque) => {
    setCheques(prev => [newCheque, ...prev]);
    addAuditLog('CHEQUE_RECORDED', `Recorded cheque ${newCheque.chequeNumber} for LKR ${newCheque.amount}`);
    saveCloudDoc('cheques', newCheque.id, newCheque);
  };

  const handleUpdateChequeStatus = (chequeId: string, status: 'Pending' | 'Realized' | 'Bounced', notes?: string) => {
    setCheques(prev => prev.map(ch => {
      if (ch.id === chequeId) {
        const updated = { ...ch, status, notes: notes !== undefined ? notes : ch.notes };
        addAuditLog('CHEQUE_STATUS_UPDATED', `Updated cheque ${ch.chequeNumber} status to ${status}`);
        saveCloudDoc('cheques', ch.id, updated);
        return updated;
      }
      return ch;
    }));
  };

  const handleAddRepair = (newRepair: RepairJob) => {
    setRepairs(prev => [newRepair, ...prev]);
    addAuditLog('REPAIR_REGISTERED', `Registered repair job ${newRepair.id} for ${newRepair.deviceName}`);
    saveCloudDoc('repairs', newRepair.id, newRepair);
  };

  const handleUpdateRepairStatus = (
    repairId: string, 
    status: RepairStatus, 
    notes: string, 
    actualCost?: number
  ) => {
    let updatedRep: RepairJob | null = null;
    setRepairs(prev => prev.map(rep => {
      if (rep.id === repairId) {
        updatedRep = {
          ...rep,
          status,
          notes,
          actualCost: actualCost !== undefined ? actualCost : rep.actualCost,
          completedAt: status === 'Delivered' ? new Date().toISOString() : rep.completedAt
        };
        return updatedRep;
      }
      return rep;
    }));
    addAuditLog('REPAIR_STATUS_UPDATED', `Updated repair ${repairId} status to ${status}`);
    if (updatedRep) {
      saveCloudDoc('repairs', repairId, updatedRep);
    }
  };

  const updateProductStock = (productId: string, quantitySold: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        if (p.stock === 'Unlimited') return p;
        
        let newBatches = p.batches ? [...p.batches] : [];
        if (newBatches.length > 0) {
          // Sort batches by expiry date (FIFO)
          newBatches.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
          
          let remainingToDeduct = quantitySold;
          newBatches = newBatches.map(batch => {
            if (remainingToDeduct <= 0) return batch;
            const deduct = Math.min(batch.qty, remainingToDeduct);
            remainingToDeduct -= deduct;
            return { ...batch, qty: batch.qty - deduct };
          }).filter(batch => batch.qty > 0);
        }

        return {
          ...p,
          stock: Math.max(0, p.stock - quantitySold),
          batches: newBatches
        };
      }
      return p;
    }));
  };

  const handleAddProduct = (newProduct: Product) => {
    setProducts(prev => [...prev, newProduct]);
    addAuditLog('PRODUCT_ADDED', `Added new product ${newProduct.nameEn}`);
    saveCloudDoc('products', newProduct.id, newProduct);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    addAuditLog('PRODUCT_UPDATED', `Updated product details for ${updatedProduct.nameEn}`);
    saveCloudDoc('products', updatedProduct.id, updatedProduct);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    addAuditLog('PRODUCT_DELETED', `Deleted product ${productId}`);
    deleteCloudDoc('products', productId);
  };

  const handleBulkProductsImport = (importedProducts: Product[]) => {
    setProducts(prev => {
      const productMap = new Map<string, Product>();
      prev.forEach(p => productMap.set(p.id, p));
      importedProducts.forEach(newP => {
        productMap.set(newP.id, newP);
      });
      return Array.from(productMap.values());
    });
    addAuditLog('PRODUCTS_BULK_IMPORT', `Bulk processed ${importedProducts.length} items from CSV template.`);
  };

  const handleAddEmployee = (emp: Employee) => {
    setEmployees(prev => [...prev, emp]);
    addAuditLog('EMPLOYEE_ADDED', `Added employee ${emp.name}`);
    saveCloudDoc('employees', emp.id, emp);
  };

  const handleRecordAttendance = (rec: AttendanceRecord) => {
    setAttendance(prev => [rec, ...prev]);
    addAuditLog('ATTENDANCE_RECORDED', `Recorded attendance for ${rec.employeeName}`);
    saveCloudDoc('attendance', rec.id, rec);
  };

  const handleAddCommission = (com: CommissionRecord) => {
    setCommissions(prev => [com, ...prev]);
    setEmployees(prevEmp => prevEmp.map(e => {
      if (e.id === com.employeeId) {
        const updated = { ...e, walletBalance: e.walletBalance + com.amount };
        saveCloudDoc('employees', updated.id, updated);
        return updated;
      }
      return e;
    }));
    addAuditLog('COMMISSION_RECORDED', `Recorded Rs. ${com.amount} commission for ${com.employeeName}`);
    saveCloudDoc('commissions', com.id, com);
  };

  const handleAddSpecialOrder = (order: SpecialOrder) => {
    setSpecialOrders(prev => [order, ...prev]);
    addAuditLog('SPECIAL_ORDER_ADDED', `Added custom special order ${order.id} for ${order.itemName}`);
    saveCloudDoc('special_orders', order.id, order);
  };

  const handleUpdateSpecialOrderStatus = (orderId: string, status: SpecialOrder['status'], trackingNo?: string) => {
    let updatedOrder: SpecialOrder | null = null;
    setSpecialOrders(prev => prev.map(so => {
      if (so.id === orderId) {
        updatedOrder = {
          ...so,
          status,
          courierTrackingNo: trackingNo !== undefined ? trackingNo : so.courierTrackingNo
        };
        return updatedOrder;
      }
      return so;
    }));
    addAuditLog('SPECIAL_ORDER_UPDATED', `Updated special order ${orderId} to ${status}`);
    if (updatedOrder) {
      saveCloudDoc('special_orders', orderId, updatedOrder);
    }
  };

  const handleAddStockAdjustment = (adj: StockAdjustment) => {
    setStockAdjustments(prev => [adj, ...prev]);
    setProducts(prevProducts => prevProducts.map(p => {
      if (p.id === adj.productId && p.stock !== 'Unlimited') {
        const updated = {
          ...p,
          stock: Math.max(0, p.stock + adj.qtyAdjusted)
        };
        saveCloudDoc('products', updated.id, updated);
        return updated;
      }
      return p;
    }));
    addAuditLog('STOCK_ADJUSTED', `Adjusted stock for ${adj.productName} by ${adj.qtyAdjusted}`);
    saveCloudDoc('stock_adjustments', adj.id, adj);
  };

  const handleAddStockReturn = (ret: StockReturn) => {
    setStockReturns(prev => [ret, ...prev]);
    ret.items.forEach(item => {
      // 1. Update Product Inventory Stock levels based on return type and action
      setProducts(prevProducts => prevProducts.map(p => {
        if (p.id === item.productId && p.stock !== 'Unlimited') {
          let newStock = Number(p.stock);
          if (ret.type === 'Sales Return') {
            if (ret.action === 'Return to Stock' || !ret.action) {
              newStock += item.qty;
            }
          } else if (ret.type === 'Purchase Return') {
            newStock = Math.max(0, newStock - item.qty);
          }
          const updated = {
            ...p,
            stock: newStock
          };
          saveCloudDoc('products', updated.id, updated);
          return updated;
        }
        return p;
      }));

      // 2. If it is a scrapped Sales Return, log a Damage stock adjustment to maintain full ledger traceability
      if (ret.type === 'Sales Return' && ret.action === 'Scrap') {
        const scrapAdj: StockAdjustment = {
          id: `ADJ-SCR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          productId: item.productId,
          productName: item.productName,
          type: 'Damage',
          qtyAdjusted: -item.qty,
          reason: `Scrapped damaged item from return ${ret.id}`,
          adjustedBy: 'System (Return Module)',
          createdAt: new Date().toISOString()
        };
        setStockAdjustments(prev => [scrapAdj, ...prev]);
        addAuditLog('STOCK_ADJUSTED', `Adjusted stock for ${scrapAdj.productName} by ${scrapAdj.qtyAdjusted} (Scrapped Return ${ret.id})`);
        saveCloudDoc('stock_adjustments', scrapAdj.id, scrapAdj);
      }
    });

    addAuditLog('STOCK_RETURNED', `Recorded ${ret.type} ${ret.id} - Refund: Rs. ${ret.totalRefund}`);
    saveCloudDoc('stock_returns', ret.id, ret);
  };

  const handleAddQuotation = (quote: Quotation) => {
    setQuotations(prev => [quote, ...prev]);
    addAuditLog('QUOTATION_CREATED', `Created quotation ${quote.id} for ${quote.customerName}`);
    saveCloudDoc('quotations', quote.id, quote);
  };

  // --- EDIT AND DELETE HANDLERS ---
  const handleUpdateCustomer = (updatedCust: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updatedCust.id ? updatedCust : c));
    addAuditLog('CUSTOMER_UPDATED', `Updated customer details for ${updatedCust.name}`);
    saveCloudDoc('customers', updatedCust.id, updatedCust);
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    addAuditLog('CUSTOMER_DELETED', `Deleted customer ID ${id}`);
    deleteCloudDoc('customers', id);
  };

  const handleUpdateSupplier = (updatedSupp: Supplier) => {
    setSuppliers(prev => prev.map(s => s.id === updatedSupp.id ? updatedSupp : s));
    addAuditLog('SUPPLIER_UPDATED', `Updated supplier details for ${updatedSupp.companyName}`);
    saveCloudDoc('suppliers', updatedSupp.id, updatedSupp);
  };

  const handleDeleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
    addAuditLog('SUPPLIER_DELETED', `Deleted supplier ID ${id}`);
    deleteCloudDoc('suppliers', id);
  };

  const handleDeletePurchaseOrder = (id: string) => {
    setPurchaseOrders(prev => prev.filter(o => o.id !== id));
    addAuditLog('PURCHASE_ORDER_DELETED', `Deleted purchase order ${id}`);
  };

  const handleDeleteStockAdjustment = (id: string) => {
    setStockAdjustments(prev => prev.filter(a => a.id !== id));
    addAuditLog('STOCK_ADJUSTMENT_DELETED', `Deleted stock adjustment ${id}`);
    deleteCloudDoc('stock_adjustments', id);
  };

  const handleDeleteStockReturn = (id: string) => {
    setStockReturns(prev => prev.filter(r => r.id !== id));
    addAuditLog('STOCK_RETURN_DELETED', `Deleted stock return ${id}`);
    deleteCloudDoc('stock_returns', id);
  };

  // WARRANTY REPLACEMENT HANDLER
  // Records the replacement item, deducts stock, creates audit log.
  // Does NOT create a new Sale — so daily revenue is unaffected.
  const handleWarrantyReplacement = (replacement: WarrantyReplacement) => {
    // 1. Save warranty replacement record
    setWarrantyReplacements(prev => [replacement, ...prev]);

    // 2. Deduct stock of the replacement product
    const stockAdj: StockAdjustment = {
      id: `ADJ-WR-${Date.now()}`,
      productId: replacement.replacementProductId,
      productName: replacement.replacementProductName,
      type: 'Warranty Replacement',
      qtyAdjusted: -replacement.quantity, // negative = stock deduction
      reason: `Warranty replacement for sale ${replacement.originalSaleId} — ${replacement.reason}`,
      adjustedBy: replacement.handledBy,
      createdAt: replacement.createdAt,
      warrantyReplacementId: replacement.id,
    };
    setStockAdjustments(prev => [stockAdj, ...prev]);
    saveCloudDoc('stock_adjustments', stockAdj.id, stockAdj);

    setProducts(prev => prev.map(p => {
      if (p.id === replacement.replacementProductId && p.stock !== 'Unlimited') {
        const updated = { ...p, stock: Math.max(0, p.stock - replacement.quantity) };
        saveCloudDoc('products', updated.id, updated);
        return updated;
      }
      return p;
    }));

    // 3. Audit log — no revenue impact
    addAuditLog(
      'WARRANTY_REPLACEMENT',
      `Warranty replacement issued for sale ${replacement.originalSaleId}: ${replacement.quantity}x ${replacement.replacementProductName} given to ${replacement.customerName}. Stock deducted. No revenue impact.`
    );
  };

  const handleUpdateSpecialOrder = (updatedOrder: SpecialOrder) => {
    setSpecialOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    addAuditLog('SPECIAL_ORDER_UPDATED', `Updated special order ${updatedOrder.id}`);
    saveCloudDoc('special_orders', updatedOrder.id, updatedOrder);
  };

  const handleDeleteSpecialOrder = (id: string) => {
    setSpecialOrders(prev => prev.filter(o => o.id !== id));
    addAuditLog('SPECIAL_ORDER_DELETED', `Deleted special order ${id}`);
    deleteCloudDoc('special_orders', id);
  };

  const handleUpdateQuotation = (updatedQuot: Quotation) => {
    setQuotations(prev => prev.map(q => q.id === updatedQuot.id ? updatedQuot : q));
    addAuditLog('QUOTATION_UPDATED', `Updated quotation ${updatedQuot.id}`);
    saveCloudDoc('quotations', updatedQuot.id, updatedQuot);
  };

  const handleDeleteQuotation = (id: string) => {
    setQuotations(prev => prev.filter(q => q.id !== id));
    addAuditLog('QUOTATION_DELETED', `Deleted quotation ${id}`);
    deleteCloudDoc('quotations', id);
  };

  const handleUpdateRepair = (updatedRep: RepairJob) => {
    setRepairs(prev => prev.map(r => r.id === updatedRep.id ? updatedRep : r));
    addAuditLog('REPAIR_UPDATED', `Updated repair job ${updatedRep.id}`);
    saveCloudDoc('repairs', updatedRep.id, updatedRep);
  };

  const handleDeleteRepair = (id: string) => {
    setRepairs(prev => prev.filter(r => r.id !== id));
    addAuditLog('REPAIR_DELETED', `Deleted repair job ${id}`);
    deleteCloudDoc('repairs', id);
  };

  const handleUpdateEmployee = (updatedEmp: Employee) => {
    const oldEmp = employees.find(e => e.id === updatedEmp.id);
    const nameChanged = oldEmp && oldEmp.name !== updatedEmp.name;

    setEmployees(prev => prev.map(e => e.id === updatedEmp.id ? updatedEmp : e));
    saveCloudDoc('employees', updatedEmp.id, updatedEmp);

    if (nameChanged && oldEmp) {
      setAttendance(prev => prev.map(a => {
        if (a.employeeId === updatedEmp.id) {
          const updated = { ...a, employeeName: updatedEmp.name };
          saveCloudDoc('attendance', updated.id, updated);
          return updated;
        }
        return a;
      }));
      setCommissions(prev => prev.map(c => {
        if (c.employeeId === updatedEmp.id) {
          const updated = { ...c, employeeName: updatedEmp.name };
          saveCloudDoc('commissions', updated.id, updated);
          return updated;
        }
        return c;
      }));
      setShifts(prev => prev.map(s => s.cashierName === oldEmp.name ? { ...s, cashierName: updatedEmp.name } : s));
    }

    addAuditLog('EMPLOYEE_UPDATED', `Updated employee details for ${updatedEmp.name}`);
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
    deleteCloudDoc('employees', id);

    setAttendance(prev => {
      prev.forEach(a => {
        if (a.employeeId === id) deleteCloudDoc('attendance', a.id);
      });
      return prev.filter(a => a.employeeId !== id);
    });

    setCommissions(prev => {
      prev.forEach(c => {
        if (c.employeeId === id) deleteCloudDoc('commissions', c.id);
      });
      return prev.filter(c => c.employeeId !== id);
    });

    addAuditLog('EMPLOYEE_DELETED', `Deleted employee ID ${id}`);
  };

  const handleUpdateAttendance = (updatedRec: AttendanceRecord) => {
    setAttendance(prev => prev.map(a => a.id === updatedRec.id ? updatedRec : a));
    addAuditLog('ATTENDANCE_UPDATED', `Updated attendance record for ${updatedRec.employeeName}`);
    saveCloudDoc('attendance', updatedRec.id, updatedRec);
  };

  const handleDeleteAttendance = (id: string) => {
    setAttendance(prev => prev.filter(a => a.id !== id));
    addAuditLog('ATTENDANCE_DELETED', `Deleted attendance record ID ${id}`);
    deleteCloudDoc('attendance', id);
  };

  const addAuditLog = (action: string, details: string) => {
    setAuditLogs(prev => {
      const prevLog = prev[0];
      const prevHash = prevLog ? (prevLog.currentHash || 'GENESIS_HASH_INIT') : 'GENESIS_HASH_INIT';
      const newId = `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const createdAt = new Date().toISOString();
      const payload = `${newId}|Admin|${action}|${details}|${createdAt}|${prevHash}`;
      
      // Simple custom hashing (DJB2 polynomial rolled checksum) for security chain
      let hash = 5381;
      for (let i = 0; i < payload.length; i++) {
        hash = (hash * 33) ^ payload.charCodeAt(i);
      }
      const currentHash = Math.abs(hash).toString(16).padStart(8, '0');

      const newLog: SystemAuditLog = {
        id: newId,
        user: 'Admin',
        action,
        details,
        createdAt,
        prevHash,
        currentHash
      };
      
      return [newLog, ...prev];
    });
  };

  const handleUpdateSettings = (newSettings: ShopSettings) => {
    if (newSettings.adminPin && newSettings.adminPin !== settings.adminPin) {
      localStorage.setItem('shop_sync_password', newSettings.adminPin);
    }
    setSettings(newSettings);
  };

  // Database Snapshotting & History Rollbacks (Database Engineer)
  const handleCreateSnapshot = (label: string) => {
    const newSnapshot = {
      id: `SNAP-${Date.now()}`,
      label,
      timestamp: new Date().toISOString(),
      products,
      customers,
      repairs,
      sales,
      auditLogs
    };
    const updated = [newSnapshot, ...dbSnapshots].slice(0, 5);
    setDbSnapshots(updated);
    localStorage.setItem('shop_db_snapshots', JSON.stringify(updated));
    addAuditLog('DB_SNAPSHOT_CREATED', `Database snapshot "${label}" created.`);
  };

  const handleRollbackSnapshot = (snapshotId: string) => {
    const snap = dbSnapshots.find(s => s.id === snapshotId);
    if (!snap) return;
    setProducts(snap.products);
    setCustomers(snap.customers);
    setRepairs(snap.repairs);
    setSales(snap.sales);
    if (snap.auditLogs) setAuditLogs(snap.auditLogs);
    addAuditLog('DB_ROLLBACK', `Rolled back database state to snapshot: ${snap.label}`);
    alert(language === 'en' ? 'Database state rolled back successfully!' : 'දත්ත සමුදාය සාර්ථකව පෙර තත්ත්වයට පත් කරන ලදී!');
  };

  const handleDeleteSnapshot = (snapshotId: string) => {
    const updated = dbSnapshots.filter(s => s.id !== snapshotId);
    setDbSnapshots(updated);
    localStorage.setItem('shop_db_snapshots', JSON.stringify(updated));
    addAuditLog('DB_SNAPSHOT_DELETED', `Deleted database snapshot.`);
  };

  const handleRestoreDatabase = (data: {
    products: Product[];
    customers: Customer[];
    repairs: RepairJob[];
    sales: Sale[];
  }) => {
    setProducts(data.products);
    setCustomers(data.customers);
    setRepairs(data.repairs);
    setSales(data.sales);
    addAuditLog('DATABASE_RESTORED', 'Restored complete database state from backup file.');
  };

  const handleSyncPullUpdate = (data: any) => {
    isPullingRef.current = true;
    if (data.products) setProducts(data.products);
    if (data.customers) setCustomers(data.customers);
    if (data.suppliers) setSuppliers(data.suppliers);
    if (data.repairs) setRepairs(data.repairs);
    if (data.sales) setSales(data.sales);
    if (data.employees) setEmployees(data.employees);
    if (data.attendance) setAttendance(data.attendance);
    if (data.commissions) setCommissions(data.commissions);
    if (data.specialOrders) setSpecialOrders(data.specialOrders);
    if (data.expenses) setExpenses(data.expenses);
    if (data.stockAdjustments) setStockAdjustments(data.stockAdjustments);
    if (data.stockReturns) setStockReturns(data.stockReturns);
    if (data.quotations) setQuotations(data.quotations);
    if (data.settings) setSettings(data.settings);
    if (data.cheques) setCheques(data.cheques);
    
    const timestamp = data.lastUpdated ? data.lastUpdated.toString() : Date.now().toString();
    localStorage.setItem('shop_last_updated', timestamp);
    localStorage.setItem('shop_last_sync_time', timestamp);
    
    setTimeout(() => {
      isPullingRef.current = false;
    }, 200);
  };

  const handleExportBackup = () => {
    try {
      const backupData = {
        products: JSON.parse(localStorage.getItem('shop_products') || '[]'),
        sales: JSON.parse(localStorage.getItem('shop_sales') || '[]'),
        customers: JSON.parse(localStorage.getItem('shop_customers') || '[]'),
        suppliers: JSON.parse(localStorage.getItem('shop_suppliers') || '[]'),
        employees: JSON.parse(localStorage.getItem('shop_employees') || '[]'),
        settings: JSON.parse(localStorage.getItem('shop_settings') || '{}'),
        repairs: JSON.parse(localStorage.getItem('shop_repairs') || '[]'),
        specialOrders: JSON.parse(localStorage.getItem('shop_special_orders') || '[]'),
        quotations: JSON.parse(localStorage.getItem('shop_quotations') || '[]'),
        expenses: JSON.parse(localStorage.getItem('shop_expenses') || '[]'),
        shifts: JSON.parse(localStorage.getItem('shop_shifts') || '[]'),
        purchaseOrders: JSON.parse(localStorage.getItem('shop_purchase_orders') || '[]'),
        bankTransactions: JSON.parse(localStorage.getItem('shop_bank_transactions') || '[]'),
        bankBalance: Number(localStorage.getItem('shop_bank_balance') || '0'),
        stockAdjustments: JSON.parse(localStorage.getItem('shop_stock_adjustments') || '[]'),
        auditLogs: JSON.parse(localStorage.getItem('shop_audit_logs') || '[]'),
        cheques: JSON.parse(localStorage.getItem('shop_cheques') || '[]'),
        version: '1.0.0',
        exportedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SmartShop_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addAuditLog('BACKUP_EXPORTED', 'Exported a full database JSON backup file.');
    } catch (err) {
      alert('Failed to generate system backup download.');
    }
  };

  const validateBackupSchema = (data: any): boolean => {
    if (!data || typeof data !== 'object') return false;
    const hasProducts = Array.isArray(data.products);
    const hasSales = Array.isArray(data.sales);
    const hasCustomers = Array.isArray(data.customers);
    return hasProducts || hasSales || hasCustomers;
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!validateBackupSchema(data)) {
          alert(language === 'en' ? '❌ Invalid backup file format! Restoring failed.' : '❌ නොගැලපෙන උපස්ථ ගොනුවකි! ප්‍රතිස්ථාපනය අසාර්ථක විය.');
          event.target.value = '';
          return;
        }

        setPendingRestoreData({
          ...data,
          fileName: file.name,
          fileSize: file.size
        });
        setShowRestoreModal(true);
        event.target.value = '';
      } catch (err) {
        alert(language === 'en' ? '❌ Invalid backup file format! Restoring failed.' : '❌ නොගැලපෙන උපස්ථ ගොනුවකි! ප්‍රතිස්ථාපනය අසාර්ථක විය.');
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const executeRestoreBackup = () => {
    if (!pendingRestoreData) return;
    const data = pendingRestoreData;

    try {
      if (data.products) localStorage.setItem('shop_products', JSON.stringify(data.products));
      if (data.sales) localStorage.setItem('shop_sales', JSON.stringify(data.sales));
      if (data.customers) localStorage.setItem('shop_customers', JSON.stringify(data.customers));
      if (data.suppliers) localStorage.setItem('shop_suppliers', JSON.stringify(data.suppliers));
      if (data.employees) localStorage.setItem('shop_employees', JSON.stringify(data.employees));
      if (data.settings) localStorage.setItem('shop_settings', JSON.stringify(data.settings));
      if (data.repairs) localStorage.setItem('shop_repairs', JSON.stringify(data.repairs));
      if (data.specialOrders) localStorage.setItem('shop_special_orders', JSON.stringify(data.specialOrders));
      if (data.quotations) localStorage.setItem('shop_quotations', JSON.stringify(data.quotations));
      if (data.expenses) localStorage.setItem('shop_expenses', JSON.stringify(data.expenses));
      if (data.shifts) localStorage.setItem('shop_shifts', JSON.stringify(data.shifts));
      if (data.purchaseOrders) localStorage.setItem('shop_purchase_orders', JSON.stringify(data.purchaseOrders));
      if (data.bankTransactions) localStorage.setItem('shop_bank_transactions', JSON.stringify(data.bankTransactions));
      if (data.bankBalance !== undefined) localStorage.setItem('shop_bank_balance', String(data.bankBalance));
      if (data.stockAdjustments) localStorage.setItem('shop_stock_adjustments', JSON.stringify(data.stockAdjustments));
      if (data.auditLogs) localStorage.setItem('shop_audit_logs', JSON.stringify(data.auditLogs));
      if (data.cheques) localStorage.setItem('shop_cheques', JSON.stringify(data.cheques));

      addAuditLog('DATABASE_RESTORED', 'Restored complete database state from backup file.');
      alert(
        language === 'en'
          ? '✅ Database restored successfully! The application will now reload.'
          : '✅ දත්ත සමුදාය සාර්ථකව ප්‍රතිස්ථාපනය කරන ලදී! පද්ධතිය දැන් නැවත පූරණය වනු ඇත.'
      );
      window.location.reload();
    } catch (err) {
      alert(language === 'en' ? '❌ Restoring failed due to storage error.' : '❌ දත්ත ප්‍රතිස්ථාපනය අසාර්ථක විය.');
    }
  };

  const handlePurgeLogs = (days: number) => {
    const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
    setAuditLogs(prev => prev.filter(log => new Date(log.createdAt).getTime() >= threshold));
    addAuditLog('LOGS_PURGED', `Purged audit logs older than ${days} days.`);
  };

  const t = translations[language];

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Mobile bottom nav tabs — the 5 most important, filtered by permissions
  const mobileNavItems = [
    { key: 'pos', icon: ShoppingCart, label: language === 'en' ? 'POS' : 'POS' },
    { key: 'dashboard', icon: TrendingUp, label: language === 'en' ? 'Dash' : 'ප්‍රධාන' },
    { key: 'inventory', icon: Laptop, label: language === 'en' ? 'Stock' : 'තොග' },
    { key: 'contacts', icon: Users, label: language === 'en' ? 'People' : 'ජනයා' },
    { key: 'more', icon: Menu, label: language === 'en' ? 'More' : 'තව' },
  ].filter(item => item.key === 'more' || isTabAllowed(item.key));

  if (viewMode === 'super-admin') {
    return (
      <SuperAdminDashboard
        language={language}
        setViewMode={(mode) => setViewMode(mode)}
      />
    );
  }

  if (isSuspended) {
    const isExpired = suspensionReason === 'Expired';
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 font-sans">
        <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center space-y-6">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-red-500 to-orange-500"></div>
          
          <div className="flex flex-col items-center">
            <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-500 mb-4 animate-pulse">
              <ShieldAlert size={48} />
            </div>
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">
              {isExpired 
                ? (language === 'en' ? 'SaaS Subscription Expired' : 'දායකත්ව කාලය අවසන් වී ඇත')
                : (language === 'en' ? 'POS System Suspended' : 'පද්ධතිය තාවකාලිකව අත්හිටුවා ඇත')}
            </h1>
            <p className="text-slate-400 text-sm mt-2 font-medium">
              {isExpired
                ? (language === 'en' 
                    ? 'Your platform subscription period has expired. Access will remain locked until renewed.' 
                    : 'මෙම වෙළඳසැලට අදාළ දායකත්ව කාලය අවසන් වී ඇති බැවින් පද්ධතිය ක්‍රියා විරහිත කර ඇත.')
                : (language === 'en' 
                    ? 'Your shop subscription has been deactivated or is overdue.' 
                    : 'මෙම වෙළඳසැලට අදාළ ගිණුම අක්‍රීය කර හෝ සේවාව තාවකාලිකව අත්හිටුවා ඇත.')}
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800/60 rounded-2xl p-4 text-xs font-mono text-left space-y-2 select-all">
            <div className="text-slate-500">Shop ID: <span className="text-cyan-400 font-bold">{localStorage.getItem('shop_sync_id')}</span></div>
            <div className="text-slate-500">Shop Name: <span className="text-slate-300 font-bold">{settings.shopName}</span></div>
          </div>

          <div className="text-xs text-slate-400 leading-relaxed font-medium bg-rose-500/5 p-4 rounded-xl border border-rose-500/10">
            {isExpired ? (
              language === 'en' ? (
                <span>Please make the payment and contact the platform administrator to renew your subscription immediately.</span>
              ) : (
                <span>දායකත්ව ගාස්තුව ගෙවා, සේවා කාලය දීර්ඝ කර ගැනීම සඳහා කරුණාකර ප්‍රධාන පරිපාලකවරයා අමතන්න.</span>
              )
            ) : (
              language === 'en' ? (
                <span>Please contact the platform administrator to activate your subscription and restore database operations.</span>
              ) : (
                <span>සේවාව නැවත සක්‍රීය කර දත්ත සමුදාය යාවත්කාලීන කර ගැනීමට කරුණාකර ප්‍රධාන පරිපාලකවරයා අමතන්න.</span>
              )
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={async () => {
                const syncId = localStorage.getItem('shop_sync_id');
                if (syncId) {
                  try {
                    const localStatus = localStorage.getItem(`status_${syncId}`);
                    const cloudMeta = await getCloudSyncTimestamp(syncId);
                    if (localStatus !== 'deactivated' && !cloudMeta.suspended) {
                      setIsSuspended(false);
                      alert(language === 'en' ? 'Subscription active! Restoring system...' : 'ගිණුම සක්‍රීයයි! පද්ධතිය යථා තත්ත්වයට පත් කරමින්...');
                    } else {
                      alert(language === 'en' ? 'System remains suspended.' : 'පද්ධතිය තවමත් අත්හිටුවා ඇත.');
                    }
                  } catch (e) {
                    alert(language === 'en' ? 'Network error checking status' : 'තත්ත්වය පරීක්ෂා කිරීමේදී දෝෂයක් ඇති විය');
                  }
                }
              }}
              className="bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-xs py-3 px-6 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
            >
              <RefreshCw size={14} />
              <span>{language === 'en' ? 'Re-check Status' : 'නැවත පරීක්ෂා කරන්න'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800">
      {/* Navigation Header */}
      <Navbar
        language={language}
        setLanguage={setLanguage}
        viewMode={viewMode as any}
        setViewMode={setViewMode as any}
        adminTab={adminTab as any}
        setAdminTab={setAdminTab}
        cartCount={0}
        settings={settings}
        showPasscodeModal={showPasscodeModal}
        setShowPasscodeModal={setShowPasscodeModal}
        customers={customers}
        onAddCustomer={handleAddCustomer}
        onUpdateSettings={setSettings}
        showCustomerPortal={showCustomerPortal}
        setShowCustomerPortal={setShowCustomerPortal}
        loggedInCustomer={loggedInCustomer}
        setLoggedInCustomer={setLoggedInCustomer}
        employees={employees}
        activeUser={activeUser}
        onUpdateEmployee={handleUpdateEmployee}
        onLoginUser={(user) => {
          setActiveUser(user);
          if (user.role === 'Cashier') {
            setAdminTab('pos');
          } else if (user.role === 'Technician') {
            setAdminTab('quotations');
          } else {
            setAdminTab('dashboard');
          }
        }}
        onLogoutUser={() => {
          setActiveUser(null);
          setViewMode('storefront');
        }}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-[100vw] w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 lg:pb-6">
        {viewMode === 'storefront' ? (
          /* CUSTOMER STOREFRONT VIEW */
          <Storefront
            language={language}
            products={products}
            customers={customers}
            repairs={repairs}
            sales={sales}
            onAddSale={handleAddSale}
            onAddCustomer={handleAddCustomer}
            updateProductStock={updateProductStock}
            settings={settings}
            categories={categories}
            setLanguage={setLanguage}
            showCustomerPortal={showCustomerPortal}
            setShowCustomerPortal={setShowCustomerPortal}
            loggedInCustomer={loggedInCustomer}
          />
        ) : (
          /* ADMIN / POS DASHBOARD VIEW */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            {/* Sidebar Navigation — desktop only (lg+) */}
            <div className={`hidden lg:block ${isPosFullScreen ? 'lg:col-span-1 p-2 flex flex-col items-center' : 'lg:col-span-3 p-4'} bg-white rounded-2xl shadow-sm border border-slate-100 space-y-1.5 h-fit transition-all duration-300`}>
              {/* Full Screen Toggle Control at top of sidebar */}
              <div className={`flex ${isPosFullScreen ? 'justify-center w-full' : 'justify-between items-center w-full'} pb-2 border-b border-slate-100 mb-2`}>
                {!isPosFullScreen && (
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                    {language === 'en' ? 'Modules' : 'මෙනුව'}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsPosFullScreen(!isPosFullScreen)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer"
                  title={isPosFullScreen ? (language === 'en' ? 'Expand Menu' : 'මෙනුව පෙන්වන්න') : (language === 'en' ? 'Collapse Menu (Full Screen)' : 'මෙනුව හංගන්න')}
                >
                  {isPosFullScreen ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </button>
              </div>

                {/* Dashboard */}
              {isTabAllowed('dashboard') && (
                <button
                  onClick={() => { setAdminTab('dashboard'); setAdminSubTab(''); }}
                  className={`w-full flex items-center ${isPosFullScreen ? 'justify-center p-2.5' : 'px-4 py-2.5'} rounded-xl text-xs font-bold transition ${
                    adminTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-650 hover:bg-slate-50'
                  }`}
                  title={language === 'en' ? 'Dashboard' : 'ප්‍රධාන පුවරුව'}
                >
                  <TrendingUp className={`h-4 w-4 shrink-0 ${isPosFullScreen ? '' : 'mr-2.5'}`} />
                  {!isPosFullScreen && (language === 'en' ? 'Dashboard' : 'ප්‍රධාන පුවරුව')}
                </button>
              )}

              {/* POS Terminal */}
              {isTabAllowed('pos') && (
                <button
                  onClick={() => { setAdminTab('pos'); setAdminSubTab(''); }}
                  className={`w-full flex items-center ${isPosFullScreen ? 'justify-center p-2.5' : 'px-4 py-2.5'} rounded-xl text-xs font-bold transition ${
                    adminTab === 'pos' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-655 hover:bg-slate-50'
                  }`}
                  title={t.posTerminal}
                >
                  <ShoppingCart className={`h-4 w-4 shrink-0 ${isPosFullScreen ? '' : 'mr-2.5'}`} />
                  {!isPosFullScreen && t.posTerminal}
                </button>
              )}

              {/* Central Inventory */}
              {isTabAllowed('inventory') && (
                <button
                  onClick={() => { setAdminTab('inventory'); setAdminSubTab(''); }}
                  className={`w-full flex items-center ${isPosFullScreen ? 'justify-center p-2.5' : 'px-4 py-2.5'} rounded-xl text-xs font-bold transition ${
                    adminTab === 'inventory' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-655 hover:bg-slate-50'
                  }`}
                  title={t.inventoryTitle}
                >
                  <Laptop className={`h-4 w-4 shrink-0 ${isPosFullScreen ? '' : 'mr-2.5'}`} />
                  {!isPosFullScreen && t.inventoryTitle}
                </button>
              )}

              {/* Contacts & Loyalty (Collapsible Folder) */}
              {isTabAllowed('contacts') && (
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      if (isPosFullScreen) {
                        setAdminTab('contacts');
                        setAdminSubTab('customers');
                      } else {
                        toggleMenu('contacts');
                        if (adminTab !== 'contacts') {
                          setAdminTab('contacts');
                          setAdminSubTab('customers');
                        }
                      }
                    }}
                    className={`w-full flex items-center justify-between ${isPosFullScreen ? 'justify-center p-2.5' : 'px-4 py-2.5'} rounded-xl text-xs font-bold transition ${
                      adminTab === 'contacts' ? 'bg-slate-100 text-slate-800' : 'text-slate-655 hover:bg-slate-50'
                    }`}
                    title={language === 'en' ? 'Contacts & Loyalty' : 'ගැනුම්කරුවන් සහ ලෝයල්ටි'}
                  >
                    <div className="flex items-center">
                      <Users className={`h-4 w-4 shrink-0 ${isPosFullScreen ? '' : 'mr-2.5'}`} />
                      {!isPosFullScreen && (language === 'en' ? 'Contacts & Loyalty' : 'ගැනුම්කරුවන් & ලෝයල්ටි')}
                    </div>
                    {!isPosFullScreen && (
                      expandedMenus.contacts ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </button>

                  {!isPosFullScreen && expandedMenus.contacts && (
                    <div className="border-l border-slate-150 ml-5 pl-2 space-y-1 mt-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                      {[
                        { key: 'customers', label: language === 'en' ? 'Customers List' : 'ගැනුම්කරුවන්' },
                        { key: 'suppliers', label: language === 'en' ? 'Suppliers' : 'විකුණුම්කරුවන්' },
                        { key: 'loyalty', label: language === 'en' ? 'Loyalty Settings' : 'ලෝයල්ටි රූල්ස්' },
                        { key: 'debtors', label: language === 'en' ? 'Debtors & Dues' : 'ණයගැතියන්' },
                        { key: 'sms-gateway', label: language === 'en' ? 'SIM Gateway' : 'SIM ගේට්වේ' }
                      ].map(sub => (
                        <button
                          key={sub.key}
                          onClick={() => { setAdminTab('contacts'); setAdminSubTab(sub.key); }}
                          className={`w-full flex items-center px-3 py-1.5 rounded-lg text-[11px] font-bold transition text-left ${
                            adminTab === 'contacts' && adminSubTab === sub.key
                              ? 'text-blue-600 bg-blue-50/50'
                              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full mr-2 shrink-0 ${adminTab === 'contacts' && adminSubTab === sub.key ? 'bg-blue-600' : 'bg-slate-300'}`} />
                          <span>{sub.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Purchases & Stock (Collapsible Folder) */}
              {isTabAllowed('purchases') && (
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      if (isPosFullScreen) {
                        setAdminTab('purchases');
                        setAdminSubTab('purchases');
                      } else {
                        toggleMenu('purchases');
                        if (adminTab !== 'purchases') {
                          setAdminTab('purchases');
                          setAdminSubTab('purchases');
                        }
                      }
                    }}
                    className={`w-full flex items-center justify-between ${isPosFullScreen ? 'justify-center p-2.5' : 'px-4 py-2.5'} rounded-xl text-xs font-bold transition ${
                      adminTab === 'purchases' ? 'bg-slate-100 text-slate-800' : 'text-slate-655 hover:bg-slate-50'
                    }`}
                    title={language === 'en' ? 'Purchases & Stock' : 'මිලදී ගැනීම් සහ තොග'}
                  >
                    <div className="flex items-center">
                      <Truck className={`h-4 w-4 shrink-0 ${isPosFullScreen ? '' : 'mr-2.5'}`} />
                      {!isPosFullScreen && (language === 'en' ? 'Purchases & Stock' : 'මිලදී ගැනීම් & තොග')}
                    </div>
                    {!isPosFullScreen && (
                      expandedMenus.purchases ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </button>

                  {!isPosFullScreen && expandedMenus.purchases && (
                    <div className="border-l border-slate-150 ml-5 pl-2 space-y-1 mt-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                      {[
                        { key: 'purchases', label: language === 'en' ? 'Supplier Orders' : 'මිලදී ගැනීමේ ඇණවුම්', icon: ClipboardList },
                        { key: 'adjustments', label: language === 'en' ? 'Stock Adjusts' : 'තොග වෙනස් කිරීම්', icon: Sliders },
                        { key: 'returns', label: language === 'en' ? 'Supplier Returns' : 'භාණ්ඩ ආපසු යැවීම්', icon: RefreshCw }
                      ].map(sub => {
                        const Icon = sub.icon;
                        const isActive = adminTab === 'purchases' && adminSubTab === sub.key;
                        return (
                          <button
                            key={sub.key}
                            onClick={() => { setAdminTab('purchases'); setAdminSubTab(sub.key); }}
                            className={`w-full flex items-center px-3 py-1.5 rounded-lg text-[11px] font-bold transition text-left ${
                              isActive
                                ? 'text-blue-600 bg-blue-50/50'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                          >
                            <Icon className={`h-3.5 w-3.5 mr-2 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Special Custom Orders */}
              {isTabAllowed('special-orders') && (
                <button
                  onClick={() => { setAdminTab('special-orders'); setAdminSubTab(''); }}
                  className={`w-full flex items-center ${isPosFullScreen ? 'justify-center p-2.5' : 'px-4 py-2.5'} rounded-xl text-xs font-bold transition ${
                    adminTab === 'special-orders' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-655 hover:bg-slate-50'
                  }`}
                  title={language === 'en' ? 'Special Custom Orders' : 'විශේෂ ඇණවුම්'}
                >
                  <ShoppingBag className={`h-4 w-4 shrink-0 ${isPosFullScreen ? '' : 'mr-2.5'}`} />
                  {!isPosFullScreen && (language === 'en' ? 'Special Custom Orders' : 'විශේෂ ඇණවුම්')}
                </button>
              )}

              {/* Quotations & Repairs (Collapsible Folder) */}
              {isTabAllowed('quotations') && (
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      if (isPosFullScreen) {
                        setAdminTab('quotations');
                        setAdminSubTab('repairs');
                      } else {
                        toggleMenu('quotations');
                        if (adminTab !== 'quotations') {
                          setAdminTab('quotations');
                          setAdminSubTab('repairs');
                        }
                      }
                    }}
                    className={`w-full flex items-center justify-between ${isPosFullScreen ? 'justify-center p-2.5' : 'px-4 py-2.5'} rounded-xl text-xs font-bold transition ${
                      adminTab === 'quotations' ? 'bg-slate-100 text-slate-800' : 'text-slate-655 hover:bg-slate-50'
                    }`}
                    title={language === 'en' ? 'Quotations & Repairs' : 'කොටේෂන් සහ රෙපෙයාර්'}
                  >
                    <div className="flex items-center">
                      <FileText className={`h-4 w-4 shrink-0 ${isPosFullScreen ? '' : 'mr-2.5'}`} />
                      {!isPosFullScreen && (language === 'en' ? 'Quotations & Repairs' : 'කොටේෂන් & රෙපෙයාර්')}
                    </div>
                    {!isPosFullScreen && (
                      expandedMenus.quotations ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </button>

                  {!isPosFullScreen && expandedMenus.quotations && (
                    <div className="border-l border-slate-150 ml-5 pl-2 space-y-1 mt-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                      {[
                        { key: 'repairs', label: language === 'en' ? 'Repairs Tracker' : 'රෙපෙයාර් ට්‍රැකර්', icon: Wrench },
                        { key: 'quotations', label: language === 'en' ? 'Quotations List' : 'මිල ගණන් ලේඛන', icon: FileText }
                      ].map(sub => {
                        const Icon = sub.icon;
                        const isActive = adminTab === 'quotations' && adminSubTab === sub.key;
                        return (
                          <button
                            key={sub.key}
                            onClick={() => { setAdminTab('quotations'); setAdminSubTab(sub.key); }}
                            className={`w-full flex items-center px-3 py-1.5 rounded-lg text-[11px] font-bold transition text-left ${
                              isActive
                                ? 'text-blue-600 bg-blue-50/50'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                          >
                            <Icon className={`h-3.5 w-3.5 mr-2 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Attendance & Staff Profiles (Collapsible Folder) */}
              {isTabAllowed('attendance') && (
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      if (isPosFullScreen) {
                        setAdminTab('attendance');
                        setAdminSubTab('profiles');
                      } else {
                        toggleMenu('attendance');
                        if (adminTab !== 'attendance') {
                          setAdminTab('attendance');
                          setAdminSubTab('profiles');
                        }
                      }
                    }}
                    className={`w-full flex items-center justify-between ${isPosFullScreen ? 'justify-center p-2.5' : 'px-4 py-2.5'} rounded-xl text-xs font-bold transition ${
                      adminTab === 'attendance' ? 'bg-slate-100 text-slate-800' : 'text-slate-655 hover:bg-slate-50'
                    }`}
                    title={language === 'en' ? 'Staff & HR' : 'සේවකයින් සහ HR'}
                  >
                    <div className="flex items-center">
                      <UserCheck className={`h-4 w-4 shrink-0 ${isPosFullScreen ? '' : 'mr-2.5'}`} />
                      {!isPosFullScreen && (language === 'en' ? 'Staff & HR' : 'සේවකයින් & HR')}
                    </div>
                    {!isPosFullScreen && (
                      expandedMenus.attendance ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </button>

                  {!isPosFullScreen && expandedMenus.attendance && (
                    <div className="border-l border-slate-150 ml-5 pl-2 space-y-1 mt-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                      {[
                        { key: 'profiles', label: language === 'en' ? 'Staff Profiles' : 'සේවක පැතිකඩ', icon: User },
                        { key: 'attendance', label: language === 'en' ? 'Attendance log' : 'පැමිණීමේ සටහන්', icon: Calendar },
                        { key: 'commissions', label: language === 'en' ? 'Commissions List' : 'කොමිස් ගෙවීම්', icon: DollarSign }
                      ].map(sub => {
                        const Icon = sub.icon;
                        const isActive = adminTab === 'attendance' && adminSubTab === sub.key;
                        return (
                          <button
                            key={sub.key}
                            onClick={() => { setAdminTab('attendance'); setAdminSubTab(sub.key); }}
                            className={`w-full flex items-center px-3 py-1.5 rounded-lg text-[11px] font-bold transition text-left ${
                              isActive
                                ? 'text-blue-600 bg-blue-50/50'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                          >
                            <Icon className={`h-3.5 w-3.5 mr-2 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Reports Panel (Collapsible Folder) */}
              {isTabAllowed('reports') && (
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      if (isPosFullScreen) {
                        setAdminTab('reports');
                        setAdminSubTab('sales');
                      } else {
                        toggleMenu('reports');
                        if (adminTab !== 'reports') {
                          setAdminTab('reports');
                          setAdminSubTab('sales');
                        }
                      }
                    }}
                    className={`w-full flex items-center justify-between ${isPosFullScreen ? 'justify-center p-2.5' : 'px-4 py-2.5'} rounded-xl text-xs font-bold transition ${
                      adminTab === 'reports' ? 'bg-slate-100 text-slate-800' : 'text-slate-655 hover:bg-slate-50'
                    }`}
                    title={language === 'en' ? 'Reports & Taxes' : 'වාර්තා සහ බදු'}
                  >
                    <div className="flex items-center">
                      <BarChart3 className={`h-4 w-4 shrink-0 ${isPosFullScreen ? '' : 'mr-2.5'}`} />
                      {!isPosFullScreen && (language === 'en' ? 'Reports & Taxes' : 'වාර්තා & බදු')}
                    </div>
                    {!isPosFullScreen && (
                      expandedMenus.reports ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </button>

                  {!isPosFullScreen && expandedMenus.reports && (
                    <div className="border-l border-slate-150 ml-5 pl-2 space-y-1 mt-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                      {[
                        { key: 'sales', label: language === 'en' ? 'Sales Report' : 'විකුණුම් වාර්තා', icon: TrendingUp },
                        { key: 'tax', label: language === 'en' ? 'VAT & SSCL Taxes' : 'බදු වාර්තා', icon: ShieldAlert },
                        { key: 'expenses', label: language === 'en' ? 'Expenses List' : 'වියදම් ලේඛනය', icon: ClipboardList },
                        { key: 'profit-loss', label: language === 'en' ? 'Profit & Loss' : 'ලාභ අලාභ', icon: DollarSign },
                        { key: 'stock', label: language === 'en' ? 'Stock Audit' : 'තොග ගණන් බැලීම', icon: Package },
                        { key: 'dues', label: language === 'en' ? 'Customer Dues' : 'ණය බිල්පත්', icon: UserX },
                        { key: 'estimates', label: language === 'en' ? 'Estimates history' : 'ඇස්තමේන්තු', icon: FileSpreadsheet },
                        { key: 'warranty', label: language === 'en' ? 'Warranty replacements' : 'වගකීම් මාරු කිරීම්', icon: Shield },
                        { key: 'turnover', label: language === 'en' ? 'Turnover Analysis' : 'පිරිවැටුම් විශ්ලේෂණය', icon: PieChart },
                        { key: 'shifts', label: language === 'en' ? 'Register Shifts' : 'මුදල් ලාච්චු මාරු', icon: Clock },
                        { key: 'wastage', label: language === 'en' ? 'Wastage report' : 'අපතේ යාම්', icon: AlertTriangle },
                        { key: 'cheques', label: language === 'en' ? 'Cheque Registry' : 'චෙක්පත් ලේඛනය', icon: CreditCard }
                      ].map(sub => {
                        const Icon = sub.icon;
                        const isActive = adminTab === 'reports' && adminSubTab === sub.key;
                        return (
                          <button
                            key={sub.key}
                            onClick={() => { setAdminTab('reports'); setAdminSubTab(sub.key); }}
                            className={`w-full flex items-center px-3 py-1.5 rounded-lg text-[10px] font-bold transition text-left ${
                              isActive
                                ? 'text-blue-600 bg-blue-50/50'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                          >
                            <Icon className={`h-3.5 w-3.5 mr-2 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Settings Panel (Collapsible Folder) */}
              {isTabAllowed('settings') && (
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      if (isPosFullScreen) {
                        setAdminTab('settings');
                        setAdminSubTab('shop');
                      } else {
                        toggleMenu('settings');
                        if (adminTab !== 'settings') {
                          setAdminTab('settings');
                          setAdminSubTab('shop');
                        }
                      }
                    }}
                    className={`w-full flex items-center justify-between ${isPosFullScreen ? 'justify-center p-2.5' : 'px-4 py-2.5'} rounded-xl text-xs font-bold transition ${
                      adminTab === 'settings' ? 'bg-slate-100 text-slate-800' : 'text-slate-655 hover:bg-slate-50'
                    }`}
                    title={language === 'en' ? 'System Settings' : 'සිටින්ස් (Settings)'}
                  >
                    <div className="flex items-center">
                      <Settings className={`h-4 w-4 shrink-0 ${isPosFullScreen ? '' : 'mr-2.5'}`} />
                      {!isPosFullScreen && (language === 'en' ? 'System Settings' : 'සිටින්ස් (Settings)')}
                    </div>
                    {!isPosFullScreen && (
                      expandedMenus.settings ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </button>

                  {!isPosFullScreen && expandedMenus.settings && (
                    <div className="border-l border-slate-150 ml-5 pl-2 space-y-1 mt-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                      {[
                        { key: 'shop', label: language === 'en' ? 'Shop Profile' : 'ව්‍යාපාරික පැතිකඩ', icon: User },
                        { key: 'features', label: language === 'en' ? 'Feature Toggles' : 'මොඩියුල ක්‍රියාත්මක', icon: ToggleLeft },
                        { key: 'online-store', label: language === 'en' ? 'Online Store' : 'ඔන්ලයින් ෂොප් එක', icon: ShoppingCart },
                        { key: 'users', label: language === 'en' ? 'Users & Roles' : 'පරිශීලකයින් සහ භූමිකා', icon: Users },
                        { key: 'pos', label: language === 'en' ? 'POS Hardware' : 'POS යන්ත්‍ර සැකසුම්', icon: Printer },
                        { key: 'loyalty', label: language === 'en' ? 'Loyalty Settings' : 'ලෝයල්ටි සැකසුම්', icon: Award },
                        { key: 'bank', label: language === 'en' ? 'Bank & LankaQR' : 'බැංකු සහ LankaQR', icon: CreditCard },
                        { key: 'database', label: language === 'en' ? 'Database & Security' : 'දත්ත සහ ආරක්ෂාව', icon: Database },
                        { key: 'logs', label: language === 'en' ? 'Register Logs' : 'පරිශීලන සටහන් (Logs)', icon: History },
                        { key: 'sms', label: language === 'en' ? 'Cloud SMS gateway' : 'Cloud SMS ගේට්වේ', icon: MessageSquare }
                      ].map(sub => {
                        const Icon = sub.icon;
                        const isActive = adminTab === 'settings' && adminSubTab === sub.key;
                        return (
                          <button
                            key={sub.key}
                            onClick={() => { setAdminTab('settings'); setAdminSubTab(sub.key); }}
                            className={`w-full flex items-center px-3 py-1.5 rounded-lg text-[10px] font-bold transition text-left ${
                              isActive
                                ? 'text-blue-600 bg-blue-50/50'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                          >
                            <Icon className={`h-3.5 w-3.5 mr-2 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Expert Insights */}
              {isTabAllowed('insights') && (
                <button
                  onClick={() => { setAdminTab('insights'); setAdminSubTab(''); }}
                  className={`w-full flex items-center ${isPosFullScreen ? 'justify-center p-2.5' : 'px-4 py-2.5'} rounded-xl text-xs font-bold transition ${
                    adminTab === 'insights' ? 'bg-indigo-650 text-white shadow-md' : 'text-slate-655 hover:bg-slate-50'
                  }`}
                  title={language === 'en' ? 'Architect Insights' : 'නිර්මාණ සැලසුම්'}
                >
                  <Layers className={`h-4 w-4 shrink-0 text-indigo-400 ${isPosFullScreen ? '' : 'mr-2.5'}`} />
                  {!isPosFullScreen && (language === 'en' ? 'Architect Insights' : 'නිර්මාණ සැලසුම්')}
                </button>
              )}

              {/* System Backup & Restore */}
              {isTabAllowed('backup') && (
                <button
                  onClick={() => { setAdminTab('backup'); setAdminSubTab(''); }}
                  className={`w-full flex items-center ${isPosFullScreen ? 'justify-center p-2.5' : 'px-4 py-2.5'} rounded-xl text-xs font-bold transition ${
                    adminTab === 'backup' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-655 hover:bg-slate-50'
                  }`}
                  title={language === 'en' ? 'Database Backup' : 'පද්ධති උපස්ථය (Backup)'}
                >
                  <Download className={`h-4 w-4 shrink-0 text-emerald-500 ${isPosFullScreen ? '' : 'mr-2.5'}`} />
                  {!isPosFullScreen && (language === 'en' ? 'Database Backup' : 'පද්ධති උපස්ථය (Backup)')}
                </button>
              )}
            </div>

            {/* Admin Content Area */}
            <div className={`col-span-1 ${isPosFullScreen ? 'lg:col-span-11' : 'lg:col-span-9'} transition-all duration-300`}>

              {/* ⚠️ Default PIN Security Warning Banner */}
              {/* ⚠️ Subscription Expiring Soon Warning Banner */}
              {subscriptionExpiry && !isPosFullScreen && (
                <div className={`mb-4 flex items-center gap-3 border rounded-xl px-4 py-3 text-xs font-bold animate-in fade-in duration-300 ${
                  subscriptionExpiry.daysRemaining <= 7 
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 animate-pulse' 
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                }`}>
                  <span className="text-base shrink-0">⚠️</span>
                  <div className="text-left">
                    <span className="font-extrabold">{language === 'en' ? 'SaaS Subscription Warning:' : 'දායකත්ව කාලය අවසන් වීමේ නිවේදනය:'} </span>
                    <span className="font-semibold">
                      {language === 'en'
                        ? `Your subscription expires in ${subscriptionExpiry.daysRemaining} days (on ${new Date(subscriptionExpiry.expiryDate).toLocaleDateString()}). Please renew to avoid service interruption.`
                        : `ඔබගේ දායකත්ව කාලය තව දින ${subscriptionExpiry.daysRemaining} කින් අවසන් වේ (${new Date(subscriptionExpiry.expiryDate).toLocaleDateString()} දින). සේවාව අඛණ්ඩව ලබා ගැනීමට කරුණාකර අලුත් කරන්න.`}
                    </span>
                  </div>
                </div>
              )}

              {(settings.adminPin === '8892' || !settings.adminPin) && !isPosFullScreen && (
                <div className="mb-4 flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-amber-700 text-xs font-bold animate-in fade-in duration-300">
                  <span className="text-base shrink-0">⚠️</span>
                  <div>
                    <span className="font-extrabold">{language === 'en' ? 'Security Alert:' : 'ආරක්ෂක අවවාදයයි:'} </span>
                    <span className="font-semibold">
                      {language === 'en'
                        ? 'You are using the factory default admin PIN. Please change it in Settings → System Settings → Shop Profile to secure your system.'
                        : 'ඔබ දැනට කර්මාන්ත ශාලා Default PIN එක භාවිතා කරයි. Settings → System Settings → ව්‍යාපාරික පැතිකඩ (Shop Profile) හි ගොස් ඔබගේ PIN අංකය වෙනස් කරන්න.'}
                    </span>
                  </div>
                  <button
                    onClick={() => { setAdminTab('settings'); setAdminSubTab('shop'); }}
                    className="ml-auto shrink-0 px-3 py-1 bg-amber-500 text-white rounded-lg text-[10px] font-extrabold hover:bg-amber-600 transition whitespace-nowrap"
                  >
                    {language === 'en' ? 'Fix Now' : 'දැන් නිවැරදි කරන්න'}
                  </button>
                </div>
              )}

              {adminTab === 'dashboard' && (
                <Dashboard
                  language={language}
                  sales={sales}
                  products={products}
                  repairs={repairs}
                  customers={customers}
                  expenses={expenses}
                  specialOrders={specialOrders}
                  setViewMode={setViewMode}
                  setAdminTab={setAdminTab}
                  isOnline={isOnline}
                  onTriggerOfflineSync={triggerOfflineSync}
                  pendingSyncCount={pendingSyncSales.length}
                  onAddExpense={handleAddExpense}
                  onAddStockAdjustment={handleAddStockAdjustment}
                />
              )}

              {adminTab === 'pos' && (
                <POS
                  language={language}
                  products={products}
                  customers={customers}
                  sales={sales}
                  onAddSale={handleAddSale}
                  onAddCustomer={handleAddCustomer}
                  updateProductStock={updateProductStock}
                  vatRate={settings.vatRate}
                  ssclRate={settings.ssclRate}
                  employees={employees}
                  activeShift={shifts.find(s => s.status === 'Open')}
                  onOpenShift={handleOpenShift}
                  onCloseShift={handleCloseShift}
                  shifts={shifts}
                  settings={settings}
                  categories={categories}
                  onAddCategory={handleAddCategory}
                  onAddProduct={handleAddProduct}
                  isFullScreen={isPosFullScreen}
                  onToggleFullScreen={() => setIsPosFullScreen(!isPosFullScreen)}
                />
              )}

              {adminTab === 'inventory' && (
                <Inventory
                  language={language}
                  products={products}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  categories={categories}
                  onAddCategory={handleAddCategory}
                  onBulkProductsImport={handleBulkProductsImport}
                  settings={settings}
                />
              )}

              {adminTab === 'contacts' && (
                <ContactsLoyalty
                  language={language}
                  customers={customers}
                  suppliers={suppliers}
                  onAddCustomer={handleAddCustomer}
                  onAddSupplier={handleAddSupplier}
                  onUpdateCustomer={handleUpdateCustomer}
                  onDeleteCustomer={handleDeleteCustomer}
                  onUpdateSupplier={handleUpdateSupplier}
                  onDeleteSupplier={handleDeleteSupplier}
                  onUpdateCustomerPoints={() => {}}
                  loyaltyPointValue={settings.loyaltyPointValue}
                  pointRedemptionValue={settings.pointRedemptionValue}
                  smsLogs={smsLogs}
                  onSendSms={handleSendSms}
                  activeSubTab={adminSubTab}
                  onSubTabChange={setAdminSubTab}
                />
              )}

              {adminTab === 'purchases' && (
                <PurchasesAdjustments
                  language={language}
                  products={products}
                  suppliers={suppliers}
                  purchaseOrders={purchaseOrders}
                  stockAdjustments={stockAdjustments}
                  stockReturns={stockReturns}
                  sales={sales}
                  onAddPurchaseOrder={(order) => setPurchaseOrders(prev => [order, ...prev])}
                  onReceivePurchaseOrder={(orderId) => {
                    setPurchaseOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Received' } : o));
                    const orderItem = purchaseOrders.find(o => o.id === orderId);
                    if (orderItem) {
                      orderItem.items.forEach((item: any) => {
                        setProducts(prevProducts => prevProducts.map(p => p.id === item.productId && p.stock !== 'Unlimited' ? { ...p, stock: p.stock + item.qty } : p));
                      });
                    }
                  }}
                  onAddStockAdjustment={handleAddStockAdjustment}
                  onAddStockReturn={handleAddStockReturn}
                  onAddSupplier={handleAddSupplier}
                  onAddProduct={handleAddProduct}
                  onDeletePurchaseOrder={handleDeletePurchaseOrder}
                  onDeleteStockAdjustment={handleDeleteStockAdjustment}
                  onDeleteStockReturn={handleDeleteStockReturn}
                  categories={categories}
                  onAddCategory={handleAddCategory}
                  activeSubTab={adminSubTab}
                  onSubTabChange={setAdminSubTab}
                />
              )}

              {adminTab === 'special-orders' && (
                <SpecialOrders
                  language={language}
                  specialOrders={specialOrders}
                  products={products}
                  customers={customers}
                  onAddSpecialOrder={handleAddSpecialOrder}
                  onUpdateSpecialOrderStatus={handleUpdateSpecialOrderStatus}
                  onAddCustomer={handleAddCustomer}
                  onUpdateSpecialOrder={handleUpdateSpecialOrder}
                  onDeleteSpecialOrder={handleDeleteSpecialOrder}
                />
              )}

              {adminTab === 'quotations' && (
                <QuotationsRepairs
                  language={language}
                  repairs={repairs}
                  quotations={quotations}
                  customers={customers}
                  products={products}
                  onAddRepair={handleAddRepair}
                  onUpdateRepairStatus={handleUpdateRepairStatus}
                  onAddQuotation={handleAddQuotation}
                  onAddCustomer={handleAddCustomer}
                  onAddProduct={handleAddProduct}
                  onUpdateQuotation={handleUpdateQuotation}
                  onDeleteQuotation={handleDeleteQuotation}
                  onUpdateRepair={handleUpdateRepair}
                  onDeleteRepair={handleDeleteRepair}
                  activeSubTab={adminSubTab}
                  onSubTabChange={setAdminSubTab}
                  settings={settings}
                />
              )}

              {adminTab === 'attendance' && (
                <AttendanceStaff
                  language={language}
                  settings={settings}
                  employees={employees}
                  attendance={attendance}
                  commissions={commissions}
                  onAddEmployee={handleAddEmployee}
                  onRecordAttendance={handleRecordAttendance}
                  onAddCommission={handleAddCommission}
                  onPayoutStaff={handlePayoutStaff}
                  onUpdateEmployee={handleUpdateEmployee}
                  onDeleteEmployee={handleDeleteEmployee}
                  onUpdateAttendance={handleUpdateAttendance}
                  onDeleteAttendance={handleDeleteAttendance}
                  activeSubTab={adminSubTab}
                  onSubTabChange={setAdminSubTab}
                />
              )}

              {adminTab === 'reports' && (
                <ReportsPanel
                  language={language}
                  sales={sales}
                  expenses={expenses}
                  repairs={repairs}
                  customers={customers}
                  products={products}
                  quotations={quotations}
                  shifts={shifts}
                  stockAdjustments={stockAdjustments}
                  settings={settings}
                  cheques={cheques}
                  onAddCheque={handleAddCheque}
                  onUpdateChequeStatus={handleUpdateChequeStatus}
                  warrantyReplacements={warrantyReplacements}
                  onWarrantyReplacement={handleWarrantyReplacement}
                  onAddStockReturn={handleAddStockReturn}
                  onUpdateSale={(updatedSale) => {
                    setSales(prev => prev.map(s => s.id === updatedSale.id ? updatedSale : s));
                    addAuditLog('SALE_UPDATED', `Updated sale ID ${updatedSale.id}`);
                    saveCloudDoc('sales', updatedSale.id, updatedSale);
                  }}
                  onDeleteSale={handleDeleteSale}
                  onUpdateExpense={handleUpdateExpense}
                  onDeleteExpense={handleDeleteExpense}
                  activeSubTab={adminSubTab}
                  onSubTabChange={setAdminSubTab}
                />
              )}

              {adminTab === 'settings' && (
                <SettingsPanel
                  language={language}
                  settings={settings}
                  auditLogs={auditLogs}
                  products={products}
                  customers={customers}
                  repairs={repairs}
                  sales={sales}
                  onUpdateSettings={handleUpdateSettings}
                  onClearLogs={() => setAuditLogs([])}
                  onUpdateProduct={handleUpdateProduct}
                  onRestoreDatabase={handleRestoreDatabase}
                  dbSnapshots={dbSnapshots}
                  onCreateSnapshot={handleCreateSnapshot}
                  onRollbackSnapshot={handleRollbackSnapshot}
                  onDeleteSnapshot={handleDeleteSnapshot}
                  bankTransactions={bankTransactions}
                  bankBalance={bankBalance}
                  onGetCompleteDatabaseState={getCompleteDatabaseState}
                  activeSubTab={adminSubTab}
                  onSubTabChange={setAdminSubTab}
                  onPurgeLogs={handlePurgeLogs}
                />
              )}

              {adminTab === 'insights' && (
                <ExpertInsights 
                  language={language}
                  products={products}
                  sales={sales}
                  customers={customers}
                  repairs={repairs}
                  settings={settings}
                  auditLogs={auditLogs}
                  employees={employees}
                  attendance={attendance}
                  specialOrders={specialOrders}
                />
              )}

              {adminTab === 'backup' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6 text-xs text-slate-700 animate-in fade-in slide-in-from-top-4 duration-300">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center space-x-3">
                      <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-600 border border-emerald-500/20">
                        <Download className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-800 text-left">
                          {language === 'en' ? 'Full System Database Backup & Restore' : 'සම්පූර්ණ පද්ධති උපස්ථය සහ ප්‍රතිස්ථාපනය'}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed text-left">
                          {language === 'en' 
                            ? 'Download a copy of the entire local database or restore it from a backup file.' 
                            : 'පද්ධති දත්ත සමුදාය සම්පූර්ණයෙන්ම බාගත කරන්න හෝ පෙර උපස්ථයකින් ප්‍රතිස්ථාපනය කරන්න.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Warning Box */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-amber-850 text-left">
                    <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-amber-800 text-[11px]">
                        {language === 'en' ? 'Important Security & Data Handling Notice' : 'වැදගත් ආරක්ෂක සහ දත්ත හැසිරවීමේ නිවේදනය'}
                      </h4>
                      <p className="text-[9.5px] leading-relaxed font-medium">
                        {language === 'en'
                          ? 'This backup process exports your local database in an unencrypted JSON text format. Anyone with access to the JSON file can read your entire business details, inventory cost margins, sales metrics, and customer databases. Store downloaded files in secure, password-protected USB drives or folders. For encrypted exports, use "Database & Security" settings tab.'
                          : 'මෙම උපස්ථ ගොනුව සාමාන්‍ය JSON පෙළ ආකාරයෙන් බාගත වේ. එබැවින් මෙම ගොනුව ලැබෙන ඕනෑම අයෙකුට ඔබේ ව්‍යාපාරික විස්තර, භාණ්ඩ මිලදී ගත් මිල ගණන් සහ පාරිභෝගික දුරකථන අංක කියවිය හැක. එබැවින් මෙම ගොනුව සුරක්ෂිතව තබා ගන්න. මුරපදයකින් ආරක්ෂිතව බාගත කිරීමට settings වල ඇති "Database & Security" ටැබ් එක භාවිතා කරන්න.'}
                      </p>
                    </div>
                  </div>

                  {/* Current Database Statistics Dashboard */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left">
                      {language === 'en' ? 'Current Database Statistics' : 'දැනට පවතින දත්ත ගබඩාවේ සාරාංශය'}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-left">
                        <div className="text-[9px] font-extrabold text-slate-450 uppercase">{language === 'en' ? 'Products' : 'භාණ්ඩ'}</div>
                        <div className="text-sm font-black text-slate-800 mt-1">{products.length}</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-left">
                        <div className="text-[9px] font-extrabold text-slate-455 uppercase">{language === 'en' ? 'Sales Ledger' : 'විකුණුම්'}</div>
                        <div className="text-sm font-black text-slate-800 mt-1">{sales.length}</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-left">
                        <div className="text-[9px] font-extrabold text-slate-455 uppercase">{language === 'en' ? 'Customers' : 'ගනුදෙනුකරුවන්'}</div>
                        <div className="text-sm font-black text-slate-800 mt-1">{customers.length}</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-left">
                        <div className="text-[9px] font-extrabold text-slate-455 uppercase">{language === 'en' ? 'Repairs & Orders' : 'රෙපෙයාර් සහ ඇණවුම්'}</div>
                        <div className="text-sm font-black text-slate-800 mt-1">{repairs.length + specialOrders.length}</div>
                      </div>
                    </div>
                  </div>

                  {/* Export & Import Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* EXPORT SECTION */}
                    <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/60 flex flex-col justify-between hover:shadow-md transition duration-200">
                      <div className="space-y-2 text-left">
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block bg-emerald-50 w-fit px-2 py-0.5 rounded-md">
                          {language === 'en' ? '1. Export' : '1. අපනයනය'}
                        </span>
                        <h4 className="font-extrabold text-slate-800 text-xs">
                          {language === 'en' ? 'Download Full JSON Dump' : 'සම්පූර්ණ දත්ත ගොනුව බාගත කරන්න'}
                        </h4>
                        <p className="text-[9.5px] text-slate-450 leading-relaxed font-medium">
                          {language === 'en' 
                            ? 'Downloads all local data tables in a single JSON file. You can store this file on your local drive or USB backup stick to keep a copy of your work.' 
                            : 'පද්ධති දත්ත සමුදාය සම්පූර්ණයෙන්ම බාගත කරන්න. මෙය ඔබේ පරිගණකයේ හෝ USB ධාවකයක සුරක්ෂිතව තබාගත හැක.'}
                        </p>
                      </div>

                      <button
                        onClick={handleExportBackup}
                        className="w-full mt-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-md active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer text-[10px]"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>{language === 'en' ? 'Export Database (JSON)' : 'දත්ත සමුදාය බාගත කරන්න'}</span>
                      </button>
                    </div>

                    {/* IMPORT SECTION */}
                    <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/60 flex flex-col justify-between hover:shadow-md transition duration-200">
                      <div className="space-y-2 text-left">
                        <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest block bg-rose-50 w-fit px-2 py-0.5 rounded-md">
                          {language === 'en' ? '2. Import' : '2. ආනයනය'}
                        </span>
                        <h4 className="font-extrabold text-slate-800 text-xs">
                          {language === 'en' ? 'Upload Backup File' : 'පෙර බාගත කල උපස්ථ ගොනුව තෝරන්න'}
                        </h4>
                        <p className="text-[9.5px] text-slate-450 leading-relaxed font-medium">
                          {language === 'en'
                            ? 'Upload a previously exported JSON backup file. All current data on this device will be replaced with the data from the backup.'
                            : 'පෙර බාගත කල JSON උපස්ථ ගොනුවක් තෝරා ප්‍රතිස්ථාපනය කරන්න. මෙයින් දැනට පද්ධතියේ ඇති සියලුම දත්ත මැකී යනු ඇත.'}
                        </p>
                      </div>

                      <div>
                        <label className="w-full mt-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-md active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer text-center text-[10px]">
                          <Upload className="h-3.5 w-3.5" />
                          <span>{language === 'en' ? 'Import & Restore Backup' : 'උපස්ථ ගොනුවෙන් ප්‍රතිස්ථාපනය කරන්න'}</span>
                          <input
                            type="file"
                            accept=".json"
                            onChange={handleImportBackup}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Restore Confirmation Preview Modal */}
                  {showRestoreModal && pendingRestoreData && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                      <div className="bg-white rounded-3xl border border-slate-100 max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh] text-left animate-in zoom-in-95 duration-200">
                        
                        {/* Header */}
                        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 shrink-0">
                          <div className="bg-rose-500/10 p-2 rounded-xl text-rose-600 border border-rose-500/20">
                            <AlertCircle className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-extrabold text-slate-800">
                              {language === 'en' ? 'Verify Backup & Confirm Restore' : 'ගොනුව සත්‍යාපනය කර ප්‍රතිස්ථාපනය තහවුරු කරන්න'}
                            </h3>
                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                              {language === 'en' 
                                ? 'Verify file data table records side-by-side with your current database before applying changes.' 
                                : 'දත්ත ප්‍රතිස්ථාපනය කිරීමට පෙර Backup ගොනුවේ අඩංගු දත්ත ප්‍රමාණයන් වත්මන් දත්ත සමඟ සන්සන්දනය කරන්න.'}
                            </p>
                          </div>
                        </div>

                        {/* File Details */}
                        <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 my-4 grid grid-cols-2 gap-3 text-[10px] shrink-0">
                          <div>
                            <span className="font-extrabold text-slate-400 block uppercase tracking-wider">{language === 'en' ? 'Backup File' : 'ගොනුවේ නම'}</span>
                            <span className="font-bold text-slate-700 break-all">{pendingRestoreData.fileName}</span>
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-400 block uppercase tracking-wider">{language === 'en' ? 'File Size / Exported' : 'ගොනු ප්‍රමාණය / අපනයිත දිනය'}</span>
                            <span className="font-bold text-slate-700">
                              {(pendingRestoreData.fileSize / 1024).toFixed(2)} KB • {pendingRestoreData.exportedAt ? new Date(pendingRestoreData.exportedAt).toLocaleString() : 'N/A'}
                            </span>
                          </div>
                        </div>

                        {/* Overwrite Danger Warning Card */}
                        <div className="bg-rose-50 border border-rose-200 text-rose-850 p-3.5 rounded-xl flex items-start space-x-2.5 text-[10px] leading-relaxed shrink-0 mb-4">
                          <ShieldAlert className="h-5 w-5 text-rose-500 shrink-0" />
                          <div>
                            <span className="font-black block uppercase text-rose-800">{language === 'en' ? '⚠️ CRITICAL RESTORE ACTION WARNING' : '⚠️ අතිශය භයානක දත්ත වෙනස්කිරීමේ අනතුරු ඇඟවීමයි'}</span>
                            <span>
                              {language === 'en'
                                ? 'Proceeding will COMPLETELY WIPE OUT all current products, sales history, customer listings, employees data, and configurations on this browser storage, substituting it with the file contents. This action cannot be undone.'
                                : 'මෙමඟින් දැනට මෙම පරිගණකයේ ඇති සියලුම භාණ්ඩ, විකුණුම් ඉතිහාසය, පාරිභෝගික වාර්තා, සේවක පැමිණීම් සහ settings දත්ත සම්පූර්ණයෙන්ම මැකී යන අතර, ගොනුවේ ඇති දත්ත ප්‍රතිස්ථාපනය වේ. මෙය නැවත වෙනස් කල නොහැක.'}
                            </span>
                          </div>
                        </div>

                        {/* Comparison Table */}
                        <div className="flex-1 overflow-y-auto min-h-0 pr-1 mb-4 border border-slate-100 rounded-2xl">
                          <table className="w-full text-left text-[10.5px]">
                            <thead className="bg-slate-50 text-slate-500 font-extrabold sticky top-0 border-b border-slate-100 uppercase tracking-wider text-[9px]">
                              <tr>
                                <th className="px-4 py-2">{language === 'en' ? 'Data Table Description' : 'දත්ත වගුවේ නම'}</th>
                                <th className="px-4 py-2 text-center">{language === 'en' ? 'Current Count' : 'වත්මන් ප්‍රමාණය'}</th>
                                <th className="px-4 py-2 text-center">{language === 'en' ? 'Backup Count' : 'Backup ප්‍රමාණය'}</th>
                                <th className="px-4 py-2 text-right">{language === 'en' ? 'Trend' : 'වෙනස'}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                              {[
                                { nameEn: 'Products Catalog', nameSi: 'භාණ්ඩ නාමාවලිය', key: 'products', current: products.length },
                                { nameEn: 'Sales History Ledger', nameSi: 'විකුණුම් ඉතිහාසය', key: 'sales', current: sales.length },
                                { nameEn: 'Registered Customers', nameSi: 'පාරිභෝගික ලැයිස්තුව', key: 'customers', current: customers.length },
                                { nameEn: 'Registered Suppliers', nameSi: 'සැපයුම්කරුවන්', key: 'suppliers', current: suppliers.length },
                                { nameEn: 'Repair Services Log', nameSi: 'රෙපෙයාර් සටහන්', key: 'repairs', current: repairs.length },
                                { nameEn: 'Special Custom Orders', nameSi: 'විශේෂ ඇණවුම්', key: 'specialOrders', current: specialOrders.length },
                                { nameEn: 'Quotations & Estimates', nameSi: 'මිල ගණන් තක්සේරු', key: 'quotations', current: quotations.length },
                                { nameEn: 'Expenses Record', nameSi: 'වියදම් සටහන්', key: 'expenses', current: expenses.length },
                                { nameEn: 'Employees & Staff', nameSi: 'සේවකයින්', key: 'employees', current: employees.length },
                                { nameEn: 'Attendance Clock', nameSi: 'පැමිණීමේ සටහන්', key: 'attendance', current: attendance.length },
                                { nameEn: 'Register Shifts Log', nameSi: 'සේවා මුර (Shifts)', key: 'shifts', current: shifts.length },
                                { nameEn: 'Bank Ledger Trx', nameSi: 'බැංකු ගනුදෙනු', key: 'bankTransactions', current: bankTransactions.length },
                                { nameEn: 'Security Audit Logs', nameSi: 'පද්ධති ලොග් වාර්තා', key: 'auditLogs', current: auditLogs.length }
                              ].map((tbl) => {
                                const backupVal = Array.isArray(pendingRestoreData[tbl.key]) ? pendingRestoreData[tbl.key].length : 0;
                                const diff = backupVal - tbl.current;
                                return (
                                  <tr key={tbl.key} className="hover:bg-slate-50/50">
                                    <td className="px-4 py-2 font-bold text-slate-800">{language === 'en' ? tbl.nameEn : tbl.nameSi}</td>
                                    <td className="px-4 py-2 text-center text-slate-500 font-bold">{tbl.current}</td>
                                    <td className="px-4 py-2 text-center text-slate-900 font-extrabold">{backupVal}</td>
                                    <td className="px-4 py-2 text-right">
                                      {diff > 0 ? (
                                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[9px] font-black">+{diff}</span>
                                      ) : diff < 0 ? (
                                        <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full text-[9px] font-black">{diff}</span>
                                      ) : (
                                        <span className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full text-[9px] font-bold">0</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                              {/* Bank Balance Comparison Row */}
                              <tr className="hover:bg-slate-50/50">
                                <td className="px-4 py-2 font-extrabold text-slate-850">{language === 'en' ? 'Starting Bank Balance' : 'බැංකු ශේෂය'}</td>
                                <td className="px-4 py-2 text-center text-slate-500 font-bold">LKR {bankBalance.toLocaleString()}</td>
                                <td className="px-4 py-2 text-center text-slate-950 font-black">LKR {(pendingRestoreData.bankBalance || 0).toLocaleString()}</td>
                                <td className="px-4 py-2 text-right font-black">
                                  {Number(pendingRestoreData.bankBalance || 0) - bankBalance > 0 ? (
                                    <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[9px]">LKR +{(Number(pendingRestoreData.bankBalance || 0) - bankBalance).toLocaleString()}</span>
                                  ) : Number(pendingRestoreData.bankBalance || 0) - bankBalance < 0 ? (
                                    <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[9px]">LKR {(Number(pendingRestoreData.bankBalance || 0) - bankBalance).toLocaleString()}</span>
                                  ) : (
                                    <span className="text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded text-[9px]">0</span>
                                  )}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Confirmation Checkbox */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 shrink-0 flex items-start space-x-2.5">
                          <input
                            id="confirm-overwrite-checkbox"
                            type="checkbox"
                            checked={isOverwriteConfirmed}
                            onChange={(e) => setIsOverwriteConfirmed(e.target.checked)}
                            className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 mt-0.5 cursor-pointer"
                          />
                          <label htmlFor="confirm-overwrite-checkbox" className="text-[10px] text-slate-600 font-bold leading-relaxed cursor-pointer select-none">
                            {language === 'en'
                              ? 'I explicitly understand that this action is permanent and will completely overwrite all existing database records on this device.'
                              : 'මෙම ක්‍රියාව ස්ථිර වන අතර දැනට මෙම පරිගණකයේ ඇති සියලුම දත්ත මකාදමා Backup එකෙහි දත්ත ප්‍රතිස්ථාපනය කරන බව මම තහවුරු කරමි.'}
                          </label>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setShowRestoreModal(false);
                              setPendingRestoreData(null);
                              setIsOverwriteConfirmed(false);
                            }}
                            className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-bold text-xs transition cursor-pointer"
                          >
                            {language === 'en' ? 'Cancel' : 'අවලංගු කරන්න'}
                          </button>
                          <button
                            type="button"
                            disabled={!isOverwriteConfirmed}
                            onClick={() => {
                              executeRestoreBackup();
                              setShowRestoreModal(false);
                              setPendingRestoreData(null);
                              setIsOverwriteConfirmed(false);
                            }}
                            className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-extrabold text-xs disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center space-x-1 shadow-md"
                          >
                            <Upload className="h-4.5 w-4.5" />
                            <span>{language === 'en' ? 'Confirm & Restore' : 'තහවුරු කර ප්‍රතිස්ථාපනය කරන්න'}</span>
                          </button>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {viewMode === 'admin' && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-slate-200 shadow-xl">
          <div className="flex items-stretch h-16">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const isMore = item.key === 'more';
              const isActive = isMore ? mobileSidebarOpen : adminTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    if (isMore) {
                      setMobileSidebarOpen(prev => !prev);
                    } else {
                      setAdminTab(item.key as any);
                      setMobileSidebarOpen(false);
                    }
                  }}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                    isActive
                      ? 'text-blue-600 bg-blue-50/60'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  <span className={`text-[9px] font-bold ${isActive ? 'text-blue-600' : 'text-slate-500'}`}>{item.label}</span>
                  {isActive && !isMore && <div className="absolute bottom-0 w-8 h-0.5 bg-blue-600 rounded-t-full" />}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {mobileSidebarOpen && viewMode === 'admin' && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="fixed bottom-16 left-0 right-0 z-50 lg:hidden bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                {language === 'en' ? 'All Modules' : 'සියලු අංශ'}
              </span>
              <button onClick={() => setMobileSidebarOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2 text-xs">
              {[
                { key: 'purchases', icon: Truck, label: language === 'en' ? 'Purchases & Adjusts' : 'මිලදී ගැනීම්', color: 'text-orange-600 bg-orange-50' },
                { key: 'special-orders', icon: ShoppingBag, label: language === 'en' ? 'Special Orders' : 'විශේෂ ඇණවුම්', color: 'text-pink-600 bg-pink-50' },
                { key: 'quotations', icon: FileText, label: language === 'en' ? 'Quotations' : 'කොටේෂන්', color: 'text-cyan-600 bg-cyan-50' },
                { key: 'attendance', icon: UserCheck, label: language === 'en' ? 'Staff & Profiles' : 'සේවකයින්', color: 'text-violet-600 bg-violet-50' },
                { key: 'reports', icon: BarChart3, label: language === 'en' ? 'Reports' : 'වාර්තා', color: 'text-emerald-600 bg-emerald-50' },
                { key: 'settings', icon: Settings, label: language === 'en' ? 'Settings' : 'සිටින්ස්', color: 'text-slate-600 bg-slate-100' },
                { key: 'insights', icon: Layers, label: language === 'en' ? 'Insights' : 'නිර්මාණ', color: 'text-indigo-600 bg-indigo-50' },
                { key: 'backup', icon: Download, label: language === 'en' ? 'Backup' : 'උපස්ථ', color: 'text-emerald-650 bg-emerald-50' },
              ].filter(item => isTabAllowed(item.key)).map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => { setAdminTab(item.key as any); setMobileSidebarOpen(false); }}
                    className={`flex items-center gap-3 p-3 rounded-2xl text-left transition active:scale-95 ${
                      adminTab === item.key ? 'bg-blue-600 text-white shadow' : `${item.color} hover:opacity-80`
                    }`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${adminTab === item.key ? 'text-white' : ''}`} />
                    <span className={`text-[11px] font-bold leading-tight ${adminTab === item.key ? 'text-white' : ''}`}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
      {/* Footer — premium edge-to-edge dark footer */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-8 border-t border-slate-900 mt-12 w-full print:hidden">
        <div className="max-w-[100vw] px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-6">
          <div className="flex flex-col md:flex-row justify-between items-center w-full gap-6">
            <div className="text-center md:text-left space-y-1">
              <h4 className="font-extrabold text-slate-200 tracking-tight text-sm">{settings.shopName}</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {settings.onlineTagline || (language === 'en' 
                  ? 'Architected for 24-Hour Unified Wholesale, Retail & Repair Management.' 
                  : 'පැය 24 පුරා ක්‍රියාත්මක වන තොග, සිල්ලර සහ රෙපෙයාර් කළමනාකරණ පද්ධතිය.')}
              </p>
            </div>

            {/* Staff Login / Switch to Dashboard button for Shop Admins */}
            {viewMode === 'storefront' && (
              <div className="flex justify-center my-2 md:my-0">
                <button
                  type="button"
                  onClick={() => setShowPasscodeModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 text-xs font-bold transition shadow-lg shadow-black/30 active:scale-95 cursor-pointer"
                >
                  <ShieldAlert className="h-4 w-4 text-indigo-400" />
                  <span>{language === 'en' ? 'Staff Login (Admin & POS)' : 'සේවක පිවිසුම (Admin සහ POS)'}</span>
                </button>
              </div>
            )}

            <div className="text-[10px] text-slate-550 text-center md:text-right space-y-0.5">
              <div>&copy; {new Date().getFullYear()} {settings.shopName}. All Rights Reserved.</div>
              <div>{language === 'en' ? 'Designed with ❤️ for Sri Lankan Retailers' : 'ශ්‍රී ලාංකීය ව්‍යාපාරිකයන් සඳහාම ආදරයෙන් නිමවන ලදී'}</div>
            </div>
          </div>

          {/* Dynamic Storefront Contact Details Footer row */}
          {viewMode === 'storefront' && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-[10px] text-slate-550 font-bold border-t border-slate-900/40 pt-4 w-full text-center">
              {settings.onlinePhone && (
                <span className="flex items-center justify-center gap-1">
                  📞 {settings.onlinePhone}
                </span>
              )}
              {settings.onlineEmail && (
                <span className="flex items-center justify-center gap-1">
                  ✉️ {settings.onlineEmail}
                </span>
              )}
              {settings.onlineAddress && (
                <span className="flex items-center justify-center gap-1 text-center sm:text-left">
                  📍 {settings.onlineAddress}
                </span>
              )}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

export default App;
