import { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Storefront } from './components/Storefront';
import { POS } from './components/POS';
import { Inventory } from './components/Inventory';
import { CustomerRepairs } from './components/CustomerRepairs';
import { Analytics } from './components/Analytics';
import { ExpertInsights } from './components/ExpertInsights';

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
  ShopSettings, RepairStatus, RegisterShift, SmsLog, BankTransaction, WarrantyReplacement
} from './types';
import { translations } from './lib/translations';
import { 
  ShoppingCart, Laptop, UserCheck, BarChart3, Layers, 
  TrendingUp, Users, Truck, ShoppingBag, FileText, Award, 
  Activity, Settings, Menu, X, ChevronRight, Maximize2, Minimize2, ShieldAlert,
  Download, Upload
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

  const [viewMode, setViewMode] = useState<'storefront' | 'admin'>(() => {
    const saved = localStorage.getItem('shop_view_mode');
    return (saved === 'storefront' || saved === 'admin') ? saved : 'storefront';
  });

  const [activeUser, setActiveUser] = useState<any>(() => {
    const saved = localStorage.getItem('active_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [adminTab, setAdminTab] = useState<'dashboard' | 'pos' | 'inventory' | 'sales-history' | 'contacts' | 'purchases' | 'special-orders' | 'quotations' | 'attendance' | 'reports' | 'settings' | 'insights' | 'backup'>(() => {
    const saved = localStorage.getItem('shop_admin_tab');
    return saved ? (saved as any) : 'dashboard';
  });

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
  }, []);

  // Monitor database state changes to update local modification timestamp
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    if (isPullingRef.current) return;
    localStorage.setItem('shop_last_updated', Date.now().toString());
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

  // Timestamp-Based Zero-Setup Cloud Synchronizer
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
          // Push local database state to cloud (only if initialization is needed)
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
          // Cloud has a newer update than this device last saw
          const hasLocalUnsavedChanges = localTime > lastSyncTime;
          
          if (hasLocalUnsavedChanges) {
            // Conflict! Both cloud and local have changes.
            if (lastCheckedCloudTime.current === cloudMeta.lastUpdated) {
              // Already prompted for this cloud version, skip to avoid prompt loop
              return;
            }
            lastCheckedCloudTime.current = cloudMeta.lastUpdated;
            
            const cloudProducts = cloudMeta.productsCount || 0;
            const cloudSales = cloudMeta.salesCount || 0;
            const cloudSizeKb = cloudMeta.dataSize ? (cloudMeta.dataSize / 1024).toFixed(1) : 'N/A';
            const cloudDate = new Date(cloudMeta.lastUpdated).toLocaleString(language === 'si' ? 'si-LK' : 'en-US');
            
            const localProducts = productsRef.current.length;
            const localSales = salesRef.current.length;
            const localJson = JSON.stringify(getCompleteDatabaseState());
            const localSizeKb = (localJson.length / 1024).toFixed(1);
            const localDate = new Date(localTime).toLocaleString(language === 'si' ? 'si-LK' : 'en-US');
            
            const confirmMessage = language === 'en'
              ? `⚠️ Sync Conflict Detected!
The cloud database has been updated by another device.

Cloud Version:
- Last Saved: ${cloudDate}
- Products: ${cloudProducts}
- Sales: ${cloudSales}
- Size: ${cloudSizeKb} KB

Your Local Version (with unsaved changes):
- Last Modified: ${localDate}
- Products: ${localProducts}
- Sales: ${localSales}
- Size: ${localSizeKb} KB

Would you like to PULL the cloud version and OVERWRITE your local changes?
Click 'OK' to replace local data with cloud data.
Click 'Cancel' to keep your local changes (you can upload them manually using 'Upload Sync Now').`
              : `⚠️ සමමුහුර්ත ගැටුමක් හඳුනා ගන්නා ලදී!
Cloud දත්ත සමුදාය වෙනත් උපාංගයකින් යාවත්කාලීන කර ඇත.

Cloud පිටපත (නවීන):
- අවසන් වරට අප්ලෝඩ් කළේ: ${cloudDate}
- භාණ්ඩ ගණන: ${cloudProducts}
- විකුණුම් ගණන: ${cloudSales}
- ධාරිතාව: ${cloudSizeKb} KB

ඔබගේ උපාංගයේ පිටපත (සුරැකීමට නොහැකි වූ දත්ත සහිත):
- අවසන් වරට වෙනස් කළේ: ${localDate}
- භාණ්ඩ ගණන: ${localProducts}
- විකුණුම් ගණන: ${localSales}
- ධාරිතාව: ${localSizeKb} KB

ඔබට Cloud පිටපත ලබාගෙන ඔබගේ දේශීය දත්ත වෙනස්කම් මකාදැමීමට අවශ්‍යද?
Cloud පිටපත ලබා ගැනීමට 'OK' ඔබන්න (දේශීය දත්ත මකාදැමෙනු ඇත).
දේශීය දත්ත තබා ගැනීමට 'Cancel' ඔබන්න (ඔබට 'Upload Sync Now' මඟින් ඒවා පසුව Cloud එකට යැවිය හැක).`;
            
            const pull = window.confirm(confirmMessage);
            if (!pull) {
              return;
            }
          }
          
          // Pull cloud state
          const cloudState = await getCloudSyncState(syncId);
          if (cloudState) {
            handleSyncPullUpdate(cloudState);
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

    // Poll every 15 seconds
    const interval = setInterval(performSync, 15000);

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

  const handleSendSms = (phone: string, message: string) => {
    const newLog: SmsLog = {
      id: `SMS-${Date.now()}`,
      phone,
      message,
      direction: 'Outgoing',
      status: 'Sent',
      timestamp: new Date().toISOString()
    };
    setSmsLogs(prev => [newLog, ...prev]);
    addAuditLog('SMS_SENT', `Sent SMS to ${phone}: "${message.slice(0, 35)}..."`);
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

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const confirmRestore = confirm(
      language === 'en'
        ? '⚠️ WARNING: Restoring from a backup file will OVERWRITE all current data on this device.\nAre you sure you want to continue?'
        : '⚠️ අවධානය: උපස්ථ ගොනුවෙන් නැවත පිහිටුවීමෙන් දැනට මෙම උපාංගයේ ඇති සියලු දත්ත මකා දැමෙනු ඇත.\nඔබට ඉදිරියට යාමට විශ්වාසද?'
    );
    if (!confirmRestore) {
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid JSON format');
        }

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

        alert(
          language === 'en'
            ? '✅ Database restored successfully! The application will now reload.'
            : '✅ දත්ත සමුදාය සාර්ථකව ප්‍රතිස්ථාපනය කරන ලදී! පද්ධතිය දැන් නැවත පූරණය වනු ඇත.'
        );
        window.location.reload();
      } catch (err) {
        alert(language === 'en' ? '❌ Invalid backup file format! Restoring failed.' : '❌ නොගැලපෙන උපස්ථ ගොනුවකි! ප්‍රතිස්ථාපනය අසාර්ථක විය.');
      }
    };
    reader.readAsText(file);
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800">
      {/* Navigation Header */}
      <Navbar
        language={language}
        setLanguage={setLanguage}
        viewMode={viewMode}
        setViewMode={setViewMode}
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
                  onClick={() => setAdminTab('dashboard')}
                  className={`w-full flex items-center ${isPosFullScreen ? 'justify-center p-2.5' : 'px-4 py-2.5'} rounded-xl text-xs font-bold transition ${
                    adminTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
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
                  onClick={() => setAdminTab('pos')}
                  className={`w-full flex items-center ${isPosFullScreen ? 'justify-center p-2.5' : 'px-4 py-2.5'} rounded-xl text-xs font-bold transition ${
                    adminTab === 'pos' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
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
                  onClick={() => setAdminTab('inventory')}
                  className={`w-full flex items-center ${isPosFullScreen ? 'justify-center p-2.5' : 'px-4 py-2.5'} rounded-xl text-xs font-bold transition ${
                    adminTab === 'inventory' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  title={t.inventoryTitle}
                >
                  <Laptop className={`h-4 w-4 shrink-0 ${isPosFullScreen ? '' : 'mr-2.5'}`} />
                  {!isPosFullScreen && t.inventoryTitle}
                </button>
              )}

              {/* Contacts & Loyalty */}
              {isTabAllowed('contacts') && (
                <button
                  onClick={() => setAdminTab('contacts')}
                  className={`w-full flex items-center ${isPosFullScreen ? 'justify-center p-2.5' : 'px-4 py-2.5'} rounded-xl text-xs font-bold transition ${
                    adminTab === 'contacts' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  title={language === 'en' ? 'Contacts & Loyalty' : 'ගැනුම්කරුවන් සහ ලෝයල්ටි'}
                >
                  <Users className={`h-4 w-4 shrink-0 ${isPosFullScreen ? '' : 'mr-2.5'}`} />
                  {!isPosFullScreen && (language === 'en' ? 'Contacts & Loyalty' : 'ගැනුම්කරුවන් සහ ලෝයල්ටි')}
                </button>
              )}

              {/* Purchases & Adjustments */}
              {isTabAllowed('purchases') && (
                <button
                  onClick={() => setAdminTab('purchases')}
                  className={`w-full flex items-center ${isPosFullScreen ? 'justify-center p-2.5' : 'px-4 py-2.5'} rounded-xl text-xs font-bold transition ${
                    adminTab === 'purchases' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  title={language === 'en' ? 'Purchases & Adjusts' : 'මිලදී ගැනීම් සහ තොග'}
                >
                  <Truck className={`h-4 w-4 shrink-0 ${isPosFullScreen ? '' : 'mr-2.5'}`} />
                  {!isPosFullScreen && (language === 'en' ? 'Purchases & Adjusts' : 'මිලදී ගැනීම් සහ තොග')}
                </button>
              )}

              {/* Special Custom Orders */}
              {isTabAllowed('special-orders') && (
                <button
                  onClick={() => setAdminTab('special-orders')}
                  className={`w-full flex items-center ${isPosFullScreen ? 'justify-center p-2.5' : 'px-4 py-2.5'} rounded-xl text-xs font-bold transition ${
                    adminTab === 'special-orders' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  title={language === 'en' ? 'Special Custom Orders' : 'විශේෂ ඇණවුම්'}
                >
                  <ShoppingBag className={`h-4 w-4 shrink-0 ${isPosFullScreen ? '' : 'mr-2.5'}`} />
                  {!isPosFullScreen && (language === 'en' ? 'Special Custom Orders' : 'විශේෂ ඇණවුම්')}
                </button>
              )}

              {/* Quotations & Repairs */}
              {isTabAllowed('quotations') && (
                <button
                  onClick={() => setAdminTab('quotations')}
                  className={`w-full flex items-center ${isPosFullScreen ? 'justify-center p-2.5' : 'px-4 py-2.5'} rounded-xl text-xs font-bold transition ${
                    adminTab === 'quotations' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  title={language === 'en' ? 'Quotations & Repairs' : 'කොටේෂන් සහ රෙපෙයාර්'}
                >
                  <FileText className={`h-4 w-4 shrink-0 ${isPosFullScreen ? '' : 'mr-2.5'}`} />
                  {!isPosFullScreen && (language === 'en' ? 'Quotations & Repairs' : 'කොටේෂන් සහ රෙපෙයාර්')}
                </button>
              )}

              {/* Attendance & Staff Profiles */}
              {isTabAllowed('attendance') && (
                <button
                  onClick={() => setAdminTab('attendance')}
                  className={`w-full flex items-center ${isPosFullScreen ? 'justify-center p-2.5' : 'px-4 py-2.5'} rounded-xl text-xs font-bold transition ${
                    adminTab === 'attendance' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  title={language === 'en' ? 'Attendance & Profiles' : 'පැමිණීම සහ සේවක පැතිකඩ'}
                >
                  <UserCheck className={`h-4 w-4 shrink-0 ${isPosFullScreen ? '' : 'mr-2.5'}`} />
                  {!isPosFullScreen && (language === 'en' ? 'Attendance & Profiles' : 'පැමිණීම සහ සේවක පැතිකඩ')}
                </button>
              )}

              {/* Reports Panel */}
              {isTabAllowed('reports') && (
                <button
                  onClick={() => setAdminTab('reports')}
                  className={`w-full flex items-center ${isPosFullScreen ? 'justify-center p-2.5' : 'px-4 py-2.5'} rounded-xl text-xs font-bold transition ${
                    adminTab === 'reports' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  title={language === 'en' ? 'Reports' : 'වාර්තා (Reports)'}
                >
                  <BarChart3 className={`h-4 w-4 shrink-0 ${isPosFullScreen ? '' : 'mr-2.5'}`} />
                  {!isPosFullScreen && (language === 'en' ? 'Reports' : 'වාර්තා (Reports)')}
                </button>
              )}

              {/* Settings Panel */}
              {isTabAllowed('settings') && (
                <button
                  onClick={() => setAdminTab('settings')}
                  className={`w-full flex items-center ${isPosFullScreen ? 'justify-center p-2.5' : 'px-4 py-2.5'} rounded-xl text-xs font-bold transition ${
                    adminTab === 'settings' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  title={language === 'en' ? 'Settings' : 'සිටින්ස් (Settings)'}
                >
                  <Settings className={`h-4 w-4 shrink-0 ${isPosFullScreen ? '' : 'mr-2.5'}`} />
                  {!isPosFullScreen && (language === 'en' ? 'Settings' : 'සිටින්ස් (Settings)')}
                </button>
              )}

              {/* Expert Insights */}
              {isTabAllowed('insights') && (
                <button
                  onClick={() => setAdminTab('insights')}
                  className={`w-full flex items-center ${isPosFullScreen ? 'justify-center p-2.5' : 'px-4 py-2.5'} rounded-xl text-xs font-bold transition ${
                    adminTab === 'insights' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
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
                  onClick={() => setAdminTab('backup')}
                  className={`w-full flex items-center ${isPosFullScreen ? 'justify-center p-2.5' : 'px-4 py-2.5'} rounded-xl text-xs font-bold transition ${
                    adminTab === 'backup' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
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
                  smsLogs={smsLogs}
                  onSendSms={handleSendSms}
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
                />
              )}

              {adminTab === 'backup' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6 text-xs text-slate-700">
                  <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                    <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-600 border border-emerald-500/20">
                      <Download className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800">
                        {language === 'en' ? 'Full System Database Backup & Restore' : 'සම්පූර්ණ පද්ධති උපස්ථය සහ ප්‍රතිස්ථාපනය'}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {language === 'en' ? 'Download a copy of the entire local database or restore it from a backup file.' : 'පද්ධති දත්ත සමුදාය සම්පූර්ණයෙන්ම බාගත කරන්න හෝ පෙර උපස්ථයකින් ප්‍රතිස්ථාපනය කරන්න.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* EXPORT SECTION */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          {language === 'en' ? '1. Export Database Backup' : '1. පද්ධති දත්ත බාගත කිරීම'}
                        </span>
                        <h4 className="font-extrabold text-slate-800 text-xs">
                          {language === 'en' ? 'Download Full JSON Dump' : 'සම්පූර්ණ දත්ත ගොනුව බාගත කරන්න'}
                        </h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          {language === 'en' 
                            ? 'Downloads all system tables (including Products, Sales logs, Customers list, Expenses, Shifts, and System Settings) in a single JSON file. You can store this file on your local drive or USB backup stick.' 
                            : 'තොග දත්ත, විකුණුම් වාර්තා, ගනුදෙනුකරුවන්, වියදම් සහ සිටින්ස් ඇතුළු සමස්ත පද්ධති දත්ත එකම ගොනුවක් ලෙස බාගත කෙරේ. මෙය ඔබේ පරිගණකයේ සුරක්ෂිතව තබාගත හැක.'}
                        </p>
                      </div>

                      <button
                        onClick={handleExportBackup}
                        className="w-full mt-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-md active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <Download className="h-4 w-4" />
                        <span>{language === 'en' ? 'Export Database (Download JSON)' : 'දත්ත සමුදාය බාගත කරන්න'}</span>
                      </button>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-wider block">
                          {language === 'en' ? '2. Restore Database Backup' : '2. දත්ත සමුදාය ප්‍රතිස්ථාපනය'}
                        </span>
                        <h4 className="font-extrabold text-slate-800 text-xs">
                          {language === 'en' ? 'Upload Backup File' : 'පෙර බාගත කල උපස්ථ ගොනුව තෝරන්න'}
                        </h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          {language === 'en'
                            ? '⚠️ WARNING: Restoring from a backup file will overwrite all current system data on this device. Make sure you select a valid SmartShop JSON backup file.'
                            : '⚠️ අවධානය: උපස්ථ ගොනුව ප්‍රතිස්ථාපනය කිරීම මඟින් දැනට පද්ධතියේ ඇති සියලුම දත්ත සම්පූර්ණයෙන්ම මැකී යනු ඇත.'}
                        </p>
                      </div>

                      <div>
                        <label className="w-full mt-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-md active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer text-center text-xs">
                          <Upload className="h-4 w-4" />
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
