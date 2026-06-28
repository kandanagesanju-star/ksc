import React, { useState, useMemo } from 'react';
import { ShopSettings, SystemAuditLog, Product, Customer, RepairJob, Sale, BankTransaction } from '../types';
import { translations } from '../lib/translations';
import { 
  Settings, User, Key, Printer, Database, Award, 
  CreditCard, Activity, Save, RefreshCw, AlertCircle, Layout, Eye, EyeOff, ShieldAlert, ShieldCheck, Check, History, Trash, Download, Upload, Lock, Unlock, Image, X
} from 'lucide-react';

interface SettingsPanelProps {
  language: 'en' | 'si';
  settings: ShopSettings;
  auditLogs: SystemAuditLog[];
  products: Product[];
  customers: Customer[];
  repairs: RepairJob[];
  sales: Sale[];
  onUpdateSettings: (newSettings: ShopSettings) => void;
  onClearLogs: () => void;
  onUpdateProduct: (product: Product) => void;
  onRestoreDatabase: (data: any) => void;
  dbSnapshots: any[];
  onCreateSnapshot: (label: string) => void;
  onRollbackSnapshot: (id: string) => void;
  onDeleteSnapshot: (id: string) => void;
  bankTransactions?: BankTransaction[];
  bankBalance?: number;
}

const compressImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Start with quality 0.55, reduce further if still too big
        let quality = 0.55;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        // If still larger than ~300KB base64 (~400KB raw), reduce quality more
        while (dataUrl.length > 400_000 && quality > 0.15) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(dataUrl);
      };
      img.onerror = () => {
        resolve(event.target?.result as string);
      };
    };
    reader.onerror = () => {
      resolve('');
    };
  });
};

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  language,
  settings,
  auditLogs,
  products,
  customers,
  repairs,
  sales,
  onUpdateSettings,
  onClearLogs,
  onUpdateProduct,
  onRestoreDatabase,
  dbSnapshots,
  onCreateSnapshot,
  onRollbackSnapshot,
  onDeleteSnapshot,
  bankTransactions = [],
  bankBalance = 125000
}) => {
  const t = translations[language];

  // Sub tabs
  const [subTab, setSubTab] = useState<'shop' | 'online-store' | 'users' | 'pos' | 'loyalty' | 'bank' | 'database' | 'logs' | 'features'>('shop');

  // Form states
  const [shopName, setShopName] = useState(settings.shopName);
  const [shopAddress, setShopAddress] = useState(settings.shopAddress);
  const [shopPhone, setShopPhone] = useState(settings.shopPhone);
  const [shopEmail, setShopEmail] = useState(settings.shopEmail);
  const [shopLogoUrl, setShopLogoUrl] = useState(settings.shopLogoUrl);
  const [taxNo, setTaxNo] = useState(settings.taxRegistrationNo);
  const [footerMsg, setFooterMsg] = useState(settings.receiptFooterMessage);

  // Sri Lankan Tax Config
  const [vatRate, setVatRate] = useState(settings.vatRate ?? 15);
  const [ssclRate, setSsclRate] = useState(settings.ssclRate ?? 2.5);

  // Loyalty Config
  const [loyaltyValue, setLoyaltyValue] = useState(settings.loyaltyPointValue);

  // POS Shortcuts
  const [shortcutComplete, setShortcutComplete] = useState(settings.posShortcuts.completeSale || 'F8');
  const [shortcutClear, setShortcutClear] = useState(settings.posShortcuts.clearCart || 'F9');
  const [shortcutSearch, setShortcutSearch] = useState(settings.posShortcuts.focusSearch || 'F1');
  const [shortcutCash, setShortcutCash] = useState(settings.posShortcuts.cashCheckout || 'F2');
  const [shortcutCard, setShortcutCard] = useState(settings.posShortcuts.cardCheckout || 'F4');
  const [shortcutBank, setShortcutBank] = useState(settings.posShortcuts.bankCheckout || 'F6');
  const [receiptWidth, setReceiptWidth] = useState(settings.receiptWidth);

  // Bank Info
  const [bankName, setBankName] = useState(settings.bankName);
  const [accNo, setAccNo] = useState(settings.bankAccountNo);
  const [accName, setAccName] = useState(settings.bankAccountName);

  // Online Storefront Customizer states
  const [onlineStoreName, setOnlineStoreName] = useState(settings.onlineStoreName || 'My Online Shop');
  const [onlineLogoUrl, setOnlineLogoUrl] = useState(settings.onlineStoreLogoUrl || '');
  const [onlineHeaderBg, setOnlineHeaderBg] = useState(settings.onlineHeaderBgColor || 'bg-slate-900');
  const [onlineHeroBanner, setOnlineHeroBanner] = useState(settings.onlineHeroBannerUrl || '');
  // Multi-banner slideshow state
  const [heroBannerUrls, setHeroBannerUrls] = useState<string[]>(
    settings.heroBannerUrls && settings.heroBannerUrls.length > 0
      ? settings.heroBannerUrls
      : (settings.onlineHeroBannerUrl ? [settings.onlineHeroBannerUrl] : ['/hero-banner.png'])
  );
  const [newBannerUrl, setNewBannerUrl] = useState('');
  const addBannerFileRef = React.useRef<HTMLInputElement>(null);
  const [onlineThemeColor, setOnlineThemeColor] = useState(settings.onlinePrimaryThemeColor || 'bg-blue-600');
  
  // Storefront editable contact details states
  const [onlinePhone, setOnlinePhone] = useState(settings.onlinePhone || '+94 11 234 5678');
  const [onlineEmail, setOnlineEmail] = useState(settings.onlineEmail || 'info@smartshoppro.lk');
  const [onlineAddress, setOnlineAddress] = useState(settings.onlineAddress || 'No. 250, Galle Road, Colombo 03, Sri Lanka');
  const [onlineTagline, setOnlineTagline] = useState(settings.onlineTagline || 'Premium Quality & Fast Repairs');
  const [onlineAnnouncementMessage, setOnlineAnnouncementMessage] = useState(settings.onlineAnnouncementMessage || '');
  const [onlineAnnouncementBgColor, setOnlineAnnouncementBgColor] = useState(settings.onlineAnnouncementBgColor || 'bg-blue-500/15 text-blue-300 border-blue-500/30');

  // Advanced settings (Theme & PIN)
  const [uiTheme, setUiTheme] = useState(settings.uiTheme || 'slate');
  const [adminPin, setAdminPin] = useState(settings.adminPin || '1234');

  // Feature toggles states
  const [enableSms, setEnableSms] = useState(!!settings.enableSms);

  const [shopLogoTab, setShopLogoTab] = useState<'url' | 'upload'>('url');
  const [onlineLogoTab, setOnlineLogoTab] = useState<'url' | 'upload'>('url');
  const [onlineBannerTab, setOnlineBannerTab] = useState<'url' | 'upload'>('url');

  const shopLogoFileRef = React.useRef<HTMLInputElement>(null);
  const onlineLogoFileRef = React.useRef<HTMLInputElement>(null);
  const onlineBannerFileRef = React.useRef<HTMLInputElement>(null);
  const [enableRepairs, setEnableRepairs] = useState(!!settings.enableRepairs);
  const [enableSpecialOrders, setEnableSpecialOrders] = useState(!!settings.enableSpecialOrders);
  const [enableHp, setEnableHp] = useState(!!settings.enableHP);
  const [enableBatches, setEnableBatches] = useState(!!settings.enableBatches);

  // Sync state with settings prop when settings updates from parent (e.g. database restore, tab switches, quota fallback updates)
  React.useEffect(() => {
    setShopName(settings.shopName || '');
    setShopAddress(settings.shopAddress || '');
    setShopPhone(settings.shopPhone || '');
    setShopEmail(settings.shopEmail || '');
    setShopLogoUrl(settings.shopLogoUrl || '');
    setTaxNo(settings.taxRegistrationNo || '');
    setFooterMsg(settings.receiptFooterMessage || '');
    setVatRate(settings.vatRate ?? 15);
    setSsclRate(settings.ssclRate ?? 2.5);
    setLoyaltyValue(settings.loyaltyPointValue ?? 100);
    setShortcutComplete(settings.posShortcuts.completeSale || 'F8');
    setShortcutClear(settings.posShortcuts.clearCart || 'F9');
    setShortcutSearch(settings.posShortcuts.focusSearch || 'F1');
    setShortcutCash(settings.posShortcuts.cashCheckout || 'F2');
    setShortcutCard(settings.posShortcuts.cardCheckout || 'F4');
    setShortcutBank(settings.posShortcuts.bankCheckout || 'F6');
    setReceiptWidth(settings.receiptWidth || '80mm');
    setBankName(settings.bankName || '');
    setAccNo(settings.bankAccountNo || '');
    setAccName(settings.bankAccountName || '');
    setOnlineStoreName(settings.onlineStoreName || 'My Online Shop');
    setOnlineLogoUrl(settings.onlineStoreLogoUrl || '');
    setOnlineHeaderBg(settings.onlineHeaderBgColor || 'bg-slate-900');
    setOnlineHeroBanner(settings.onlineHeroBannerUrl || '');
    setHeroBannerUrls(
      settings.heroBannerUrls && settings.heroBannerUrls.length > 0
        ? settings.heroBannerUrls
        : (settings.onlineHeroBannerUrl ? [settings.onlineHeroBannerUrl] : ['/hero-banner.png'])
    );
    setOnlineThemeColor(settings.onlinePrimaryThemeColor || 'bg-blue-600');
    setOnlinePhone(settings.onlinePhone || '+94 11 234 5678');
    setOnlineEmail(settings.onlineEmail || 'info@smartshoppro.lk');
    setOnlineAddress(settings.onlineAddress || 'No. 250, Galle Road, Colombo 03, Sri Lanka');
    setOnlineTagline(settings.onlineTagline || 'Premium Quality & Fast Repairs');
    setOnlineAnnouncementMessage(settings.onlineAnnouncementMessage || '');
    setOnlineAnnouncementBgColor(settings.onlineAnnouncementBgColor || 'bg-blue-500/15 text-blue-300 border-blue-500/30');
    setUiTheme(settings.uiTheme || 'slate');
    setAdminPin(settings.adminPin || '1234');
    setEnableSms(!!settings.enableSms);
    setEnableRepairs(!!settings.enableRepairs);
    setEnableSpecialOrders(!!settings.enableSpecialOrders);
    setEnableHp(!!settings.enableHP);
    setEnableBatches(!!settings.enableBatches);
  }, [settings]);

  // Database Health check helper (Database Engineer)
  const dbHealth = useMemo(() => {
    let issues: string[] = [];
    let checkedCount = 0;
    
    // Check products
    products.forEach(p => {
      checkedCount++;
      if (p.costPrice < 0 || p.retailPrice < 0 || p.wholesalePrice < 0) {
        issues.push(`Product ${p.id}: Negative price detected.`);
      }
      if (p.costPrice > p.retailPrice) {
        issues.push(`Product ${p.id}: Cost price exceeds retail price.`);
      }
      if (p.stock !== 'Unlimited' && p.stock < 0) {
        issues.push(`Product ${p.id}: Negative stock level.`);
      }
    });

    // Check customers
    customers.forEach(c => {
      checkedCount++;
      if (c.loyaltyPoints < 0) {
        issues.push(`Customer ${c.id}: Negative loyalty points.`);
      }
    });

    // Check sales reference integrity
    sales.forEach(s => {
      checkedCount++;
      if (s.customerId) {
        const custExists = customers.some(c => c.id === s.customerId);
        if (!custExists) {
          issues.push(`Sale ${s.id}: Customer ID ${s.customerId} does not exist in database.`);
        }
      }
    });

    // Check repairs reference integrity
    repairs.forEach(r => {
      checkedCount++;
      const custExists = customers.some(c => c.id === r.customerId);
      if (!custExists) {
        issues.push(`Repair ${r.id}: Customer ID ${r.customerId} does not exist.`);
      }
    });

    const score = checkedCount > 0 ? Math.max(0, 100 - (issues.length / checkedCount) * 100) : 100;
    return {
      score: score.toFixed(1),
      issues,
      checkedCount
    };
  }, [products, customers, sales, repairs]);

  // Log integrity verifier (Security Specialist)
  const [logIntegrity, setLogIntegrity] = useState<{ status: 'idle' | 'success' | 'failed'; message: string }>({ status: 'idle', message: '' });

  const verifyLogIntegrity = () => {
    if (auditLogs.length === 0) {
      setLogIntegrity({ status: 'success', message: 'No logs to verify. Chain is empty.' });
      return;
    }

    let isValid = true;
    let failIndex = -1;

    for (let i = auditLogs.length - 1; i >= 0; i--) {
      const log = auditLogs[i];
      const expectedPrevHash = i === auditLogs.length - 1 ? 'GENESIS_HASH_INIT' : (auditLogs[i + 1].currentHash || 'GENESIS_HASH_INIT');
      if (log.prevHash !== expectedPrevHash) {
        isValid = false;
        failIndex = i;
        break;
      }

      const payload = `${log.id}|Admin|${log.action}|${log.details}|${log.createdAt}|${log.prevHash}`;
      let hash = 5381;
      for (let j = 0; j < payload.length; j++) {
        hash = (hash * 33) ^ payload.charCodeAt(j);
      }
      const calculatedHash = Math.abs(hash).toString(16).padStart(8, '0');

      if (log.currentHash !== calculatedHash) {
        isValid = false;
        failIndex = i;
        break;
      }
    }

    if (isValid) {
      setLogIntegrity({ 
        status: 'success', 
        message: `Logs Integrity Verified: 100% Secure. Checked ${auditLogs.length} entries successfully.` 
      });
    } else {
      setLogIntegrity({ 
        status: 'failed', 
        message: `Tampering Detected: Chain broken at log entry index ${auditLogs.length - 1 - failIndex} (ID: ${auditLogs[failIndex].id}). Hash mismatch.` 
      });
    }
  };

  // Secure Backup Encryption/Decryption (Security Specialist & DB Engineer)
  const [encryptPassword, setEncryptPassword] = useState('');
  const [importPayload, setImportPayload] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [newSnapshotLabel, setNewSnapshotLabel] = useState('');

  // Change Admin & POS Passcode PIN States
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    const requiredPin = settings.adminPin || '1234';
    if (currentPin !== requiredPin) {
      setPinError(language === 'en' ? 'Incorrect current passcode PIN!' : 'වත්මන් පින් අංකය (PIN) වැරදියි!');
      return;
    }

    if (newPin.length < 4) {
      setPinError(language === 'en' ? 'New passcode must be at least 4 digits.' : 'නව පින් අංකය (PIN) අවම වශයෙන් ඉලක්කම් 4ක් විය යුතුය.');
      return;
    }

    if (newPin !== confirmNewPin) {
      setPinError(language === 'en' ? 'New passcodes do not match.' : 'නව පින් අංක එකිනෙකට නොගැලපේ.');
      return;
    }

    // Call settings update
    onUpdateSettings({
      ...settings,
      adminPin: newPin
    });

    setPinSuccess(language === 'en' ? 'Admin & POS passcode changed successfully!' : 'කළමනාකරණ සහ POS පින් අංකය සාර්ථකව වෙනස් කරන ලදී!');
    setCurrentPin('');
    setNewPin('');
    setConfirmNewPin('');
    
    // Sync with local state so the Shop Profile field is also updated
    setAdminPin(newPin);
  };

  // Simple XOR + Base64 symmetric encryption
  const encryptData = (dataStr: string, pass: string): string => {
    let key = pass;
    while (key.length < dataStr.length) {
      key += pass;
    }
    let encryptedChars = [];
    for (let i = 0; i < dataStr.length; i++) {
      encryptedChars.push(String.fromCharCode(dataStr.charCodeAt(i) ^ key.charCodeAt(i)));
    }
    return btoa(unescape(encodeURIComponent(encryptedChars.join(''))));
  };

  const decryptData = (base64Str: string, pass: string): string => {
    const rawStr = decodeURIComponent(escape(atob(base64Str)));
    let key = pass;
    while (key.length < rawStr.length) {
      key += pass;
    }
    let decryptedChars = [];
    for (let i = 0; i < rawStr.length; i++) {
      decryptedChars.push(String.fromCharCode(rawStr.charCodeAt(i) ^ key.charCodeAt(i)));
    }
    return decryptedChars.join('');
  };

  const handleSecureExport = () => {
    if (!encryptPassword) {
      alert('Please enter an encryption password!');
      return;
    }
    const dbState = { products, customers, repairs, sales };
    try {
      const encrypted = encryptData(JSON.stringify(dbState), encryptPassword);
      const blob = new Blob([encrypted], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `secure-backup-${Date.now()}.enc`;
      link.click();
      URL.revokeObjectURL(url);
      setEncryptPassword('');
      alert('Secure encrypted backup downloaded successfully.');
    } catch (e) {
      alert('Backup encryption failed: ' + (e as any).message);
    }
  };

  const handleSecureImport = () => {
    if (!importPayload || !importPassword) {
      alert('Both encrypted payload and decryption password are required!');
      return;
    }
    try {
      const decrypted = decryptData(importPayload.trim(), importPassword);
      const parsed = JSON.parse(decrypted);
      if (parsed.products && parsed.customers && parsed.repairs && parsed.sales) {
        onRestoreDatabase(parsed);
        alert('Database decrypted and restored successfully!');
        setImportPayload('');
        setImportPassword('');
      } else {
        alert('Invalid data elements inside decrypted backup file.');
      }
    } catch (e) {
      alert('Decryption failed! Please verify password and payload.');
    }
  };

  // Handle Save Settings
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    onUpdateSettings({
      ...settings,
      shopName: shopName.trim(),
      shopAddress: shopAddress.trim(),
      shopPhone: shopPhone.trim(),
      shopEmail: shopEmail.trim(),
      shopLogoUrl: shopLogoUrl.trim(),
      taxRegistrationNo: taxNo.trim(),
      receiptFooterMessage: footerMsg.trim(),
      loyaltyPointValue: loyaltyValue,
      posShortcuts: {
        completeSale: shortcutComplete,
        clearCart: shortcutClear,
        focusSearch: shortcutSearch,
        cashCheckout: shortcutCash,
        cardCheckout: shortcutCard,
        bankCheckout: shortcutBank,
        addCustomer: settings.posShortcuts.addCustomer
      },
      receiptWidth,
      bankName: bankName.trim(),
      bankAccountNo: accNo.trim(),
      bankAccountName: accName.trim(),
      vatRate,
      ssclRate,
      onlineStoreName: onlineStoreName.trim(),
      onlineStoreLogoUrl: onlineLogoUrl.trim(),
      onlineHeaderBgColor: onlineHeaderBg,
      onlineHeroBannerUrl: heroBannerUrls[0] || onlineHeroBanner.trim(),
      heroBannerUrls: heroBannerUrls.length > 0 ? heroBannerUrls : [onlineHeroBanner.trim()],
      onlinePrimaryThemeColor: onlineThemeColor,
      onlinePhone: onlinePhone.trim(),
      onlineEmail: onlineEmail.trim(),
      onlineAddress: onlineAddress.trim(),
      onlineTagline: onlineTagline.trim(),
      onlineAnnouncementMessage: onlineAnnouncementMessage.trim(),
      onlineAnnouncementBgColor,
      uiTheme,
      adminPin,
      enableSms,
      enableRepairs,
      enableSpecialOrders,
      enableHP: enableHp,
      enableBatches
    });

    alert(language === 'en' ? 'Settings updated successfully!' : 'සිටින්ස් සාර්ථකව යාවත්කාලීන කරන ලදී!');
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs Toggle */}
      <div className="flex border-b border-slate-200 bg-white p-2 rounded-xl shadow-sm space-x-2 overflow-x-auto scrollbar-none">
        {[
          { key: 'shop' as const, label: 'Shop Profile', icon: Settings },
          { key: 'features' as const, label: 'Feature Toggles', icon: Settings },
          { key: 'online-store' as const, label: 'Online Store Customizer', icon: Layout },
          { key: 'users' as const, label: 'Users & Roles', icon: User },
          { key: 'pos' as const, label: 'POS & Hardware', icon: Printer },
          { key: 'loyalty' as const, label: 'Loyalty Settings', icon: Award },
          { key: 'bank' as const, label: 'Bank & QR', icon: CreditCard },
          { key: 'database' as const, label: 'Database & Security', icon: Database },
          { key: 'logs' as const, label: 'Register Logs', icon: Activity }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setSubTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center whitespace-nowrap ${
                subTab === tab.key ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="h-4 w-4 mr-1.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ONLINE STOREFRONT CUSTOMIZER */}
      {subTab === 'online-store' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form */}
          <form onSubmit={handleSave} className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4 text-xs font-semibold">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">Online Storefront Customizer</h3>
              <p className="text-[10px] text-slate-400 font-medium">Change client-facing shop name, logos, banner backgrounds and primary themes.</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Online Store Name *</label>
                <input
                  type="text" required value={onlineStoreName} onChange={(e) => setOnlineStoreName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 flex items-center gap-1">
                  <Image className="h-3 w-3" /> Online Store Logo (Optional)
                </label>
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setOnlineLogoTab('url')}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-md transition ${
                      onlineLogoTab === 'url' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Web URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnlineLogoTab('upload')}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-md transition ${
                      onlineLogoTab === 'upload' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Upload File
                  </button>
                </div>
                {onlineLogoTab === 'url' ? (
                  <input
                    type="text"
                    value={onlineLogoUrl.startsWith('data:image') ? '' : onlineLogoUrl}
                    onChange={(e) => setOnlineLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.jpg"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                  />
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onlineLogoFileRef.current?.click()}
                      className="w-full h-8 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-600 rounded-lg font-bold transition flex items-center justify-center gap-1 text-xs"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Select Logo File
                    </button>
                    <input
                      ref={onlineLogoFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const compressed = await compressImage(file, 300, 300);
                          setOnlineLogoUrl(compressed);
                        } catch (err) {
                          console.error('Error compressing logo:', err);
                        }
                      }}
                    />
                  </div>
                )}
                {onlineLogoUrl && (
                  <div className="flex items-center gap-2 mt-1 p-1 bg-slate-50 border border-slate-200 rounded-lg">
                    <img src={onlineLogoUrl} alt="logo preview" className="w-8 h-8 object-cover rounded border bg-white shrink-0" onError={() => setOnlineLogoUrl('')} />
                    <span className="text-[9px] text-slate-500 truncate flex-1">{onlineLogoUrl.startsWith('data:image') ? 'Uploaded Local Logo' : onlineLogoUrl}</span>
                    <button type="button" onClick={() => setOnlineLogoUrl('')} className="p-0.5 text-rose-500 hover:bg-rose-50 rounded">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* ── HERO BANNER BACKGROUND CUSTOMIZER ─────────────────────── */}
              <div className="space-y-3 border border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
                <label className="font-extrabold text-slate-700 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <Image className="h-3.5 w-3.5 text-blue-600" />
                  Hero Banner Background (Optional)
                  <span className="ml-auto bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">{heroBannerUrls.length} Banner{heroBannerUrls.length !== 1 ? 's' : ''}</span>
                </label>

                <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center space-x-2.5 text-blue-800 font-extrabold text-[11px] mb-2 shadow-sm">
                  <span className="text-base shrink-0">📏</span>
                  <div>
                    <div>REQUIRED BANNER SIZE: 1200 × 400 PX (Aspect Ratio 3:1)</div>
                    <div className="text-[9.5px] opacity-75 font-bold mt-0.5">පින්තූරවල දිග පළල (Size) 1200 × 400 PX ලෙස සකසා එක් කරන්න.</div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500">
                  Add 2-3 images to create an automatically changing slideshow background. You can select all images at once.
                  <br />
                  <span className="text-[9px] text-slate-400 font-medium">
                    ස්වයංක්‍රීයව මාරුවන පසුබිමක් සෑදීමට පින්තූර 2-3ක් එක් කරන්න. එකම අවස්ථාවක පින්තූර කිහිපයක්ම තෝරාගත හැක.
                  </span>
                </p>

                {/* Banner Input Tabs */}
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setOnlineBannerTab('url')}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-md transition ${
                      onlineBannerTab === 'url' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Web URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnlineBannerTab('upload')}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-md transition ${
                      onlineBannerTab === 'upload' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Upload File
                  </button>
                </div>

                {onlineBannerTab === 'url' ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newBannerUrl}
                      onChange={e => setNewBannerUrl(e.target.value)}
                      placeholder="https://example.com/banner.jpg"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newBannerUrl.trim()) {
                          setHeroBannerUrls(prev => [...prev, newBannerUrl.trim()]);
                          setNewBannerUrl('');
                        }
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shrink-0"
                    >Add URL</button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => onlineBannerFileRef.current?.click()}
                      className="w-full h-8 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-600 rounded-lg font-bold transition flex items-center justify-center gap-1 text-xs"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Select Banner File(s)
                    </button>
                    <input
                      ref={onlineBannerFileRef}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const files = e.target.files;
                        if (!files || files.length === 0) return;
                        Array.from(files).forEach(async (file) => {
                          try {
                            const compressed = await compressImage(file, 1200, 400);
                            if (compressed) {
                              setHeroBannerUrls(prev => [...prev, compressed]);
                            }
                          } catch (err) {
                            console.error('Error compressing banner:', err);
                          }
                        });
                        e.target.value = '';
                      }}
                    />
                  </div>
                )}

                {/* Current banner list */}
                <div className="space-y-2 mt-3 pt-3 border-t border-slate-100">
                  <p className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Banner Slideshow List:</p>
                  {heroBannerUrls.map((url, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-2 shadow-sm">
                      <span className="text-[9px] font-extrabold text-slate-400 w-5 text-center shrink-0">#{idx + 1}</span>
                      <img
                        src={url}
                        alt={`Banner ${idx + 1}`}
                        className="w-20 h-10 object-cover rounded-lg border border-slate-200 shrink-0 bg-slate-100"
                        onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%2250%22><rect fill=%22%23e2e8f0%22 width=%22100%22 height=%2250%22/><text x=%2250%22 y=%2228%22 text-anchor=%22middle%22 font-size=%2210%22 fill=%22%2394a3b8%22>No Image</text></svg>'; }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-slate-700 truncate font-semibold block">
                          {url.startsWith('data:image') ? 'Uploaded Local Banner' : url}
                        </span>
                        <span className="text-[8px] text-slate-400 block font-medium">banner preview</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setHeroBannerUrls(prev => { const a=[...prev]; if(idx>0){[a[idx-1],a[idx]]=[a[idx],a[idx-1]];} return a; })}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 transition font-bold"
                          title="Move Up"
                        >↑</button>
                        <button
                          type="button"
                          onClick={() => setHeroBannerUrls(prev => { const a=[...prev]; if(idx<a.length-1){[a[idx],a[idx+1]]=[a[idx+1],a[idx]];} return a; })}
                          disabled={idx === heroBannerUrls.length - 1}
                          className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 transition font-bold"
                          title="Move Down"
                        >↓</button>
                        <button
                          type="button"
                          onClick={() => setHeroBannerUrls(prev => prev.filter((_, i) => i !== idx))}
                          className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                          title="Remove"
                        ><X className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))}
                  {heroBannerUrls.length === 0 && (
                    <div className="text-center py-4 text-slate-400 text-xs">No banners added yet. Add one above!</div>
                  )}
                </div>
              </div>


              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Header Background Color</label>
                  <select
                    value={onlineHeaderBg} onChange={(e) => setOnlineHeaderBg(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-bold"
                  >
                    <option value="bg-slate-900">Dark Slate (bg-slate-900)</option>
                    <option value="bg-blue-900">Navy Blue (bg-blue-900)</option>
                    <option value="bg-emerald-900">Forest Green (bg-emerald-900)</option>
                    <option value="bg-rose-950">Deep Red (bg-rose-950)</option>
                    <option value="bg-white">Light Minimalist (bg-white)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Primary Theme Accent Color</label>
                  <select
                    value={onlineThemeColor} onChange={(e) => setOnlineThemeColor(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-bold"
                  >
                    <option value="bg-blue-600">Vibrant Blue (bg-blue-600)</option>
                    <option value="bg-emerald-600">Emerald Green (bg-emerald-600)</option>
                    <option value="bg-purple-600">Royal Purple (bg-purple-600)</option>
                    <option value="bg-indigo-600">Classic Indigo (bg-indigo-600)</option>
                  </select>
                </div>
              </div>

              {/* Online Storefront Contact Details */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h4 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider">
                  Storefront Contact Information & Tagline
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Contact Number</label>
                    <input
                      type="text"
                      value={onlinePhone}
                      onChange={(e) => setOnlinePhone(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                      placeholder="+94 11 234 5678"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Email Address</label>
                    <input
                      type="email"
                      value={onlineEmail}
                      onChange={(e) => setOnlineEmail(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                      placeholder="info@shop.lk"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Storefront Address / Physical Location</label>
                  <input
                    type="text"
                    value={onlineAddress}
                    onChange={(e) => setOnlineAddress(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                    placeholder="No. 250, Galle Road, Colombo 03, Sri Lanka"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Storefront Subtitle Tagline</label>
                  <input
                    type="text"
                    value={onlineTagline}
                    onChange={(e) => setOnlineTagline(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                    placeholder="Premium Quality & Fast Repairs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Storefront Top Announcement Message (Empty to disable)</label>
                  <input
                    type="text"
                    value={onlineAnnouncementMessage}
                    onChange={(e) => setOnlineAnnouncementMessage(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                    placeholder="e.g. 📢 Special Eid & Sinhala Hindu New Year Discounts Available now!"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Announcement Banner Design style</label>
                  <select
                    value={onlineAnnouncementBgColor}
                    onChange={(e) => setOnlineAnnouncementBgColor(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-bold"
                  >
                    <option value="bg-blue-500/15 text-blue-300 border-blue-500/30">Vibrant Blue Border (Pulsing)</option>
                    <option value="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">Emerald Green Border (Success/Open)</option>
                    <option value="bg-rose-500/15 text-rose-300 border-rose-500/30">Crimson Rose Border (Hot Offer)</option>
                    <option value="bg-amber-500/15 text-amber-300 border-amber-500/30">Amber Orange Border (Notice/Alert)</option>
                    <option value="bg-purple-500/15 text-purple-300 border-purple-500/30">Royal Purple Border (Exclusive)</option>
                    <option value="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500/20">Solid Royal Gradient (No Border)</option>
                    <option value="bg-gradient-to-r from-amber-500 to-rose-500 text-white border-amber-500/20">Solid Sunrise Gradient (No Border)</option>
                  </select>
                </div>
              </div>

            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center space-x-1.5"
              >
                <Save className="h-4 w-4" />
                <span>Save Storefront Design</span>
              </button>
            </div>
          </form>

          {/* Visibility Controls for items online */}
          <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Online Store Visibility</h3>
              <p className="text-[10px] text-slate-400 font-medium">Hide or reveal items on the client-facing online storefront.</p>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {products.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100 text-xs font-bold">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-slate-800 truncate">{p.nameEn}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">ID: {p.id} • {p.category}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateProduct({
                        ...p,
                        isHiddenOnline: !p.isHiddenOnline
                      });
                    }}
                    className={`p-1.5 rounded-lg border transition ${
                      p.isHiddenOnline 
                        ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100' 
                        : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                    }`}
                    title={p.isHiddenOnline ? 'Hidden Online (Click to reveal)' : 'Visible Online (Click to hide)'}
                  >
                    {p.isHiddenOnline ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SHOP PROFILE */}
      {subTab === 'shop' && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4 text-xs font-semibold">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-500">Shop Name *</label>
              <input
                type="text" required value={shopName} onChange={(e) => setShopName(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-500">Shop Phone *</label>
              <input
                type="text" required value={shopPhone} onChange={(e) => setShopPhone(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="font-bold text-slate-500">Shop Address *</label>
              <input
                type="text" required value={shopAddress} onChange={(e) => setShopAddress(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-500">Shop Email</label>
              <input
                type="email" value={shopEmail} onChange={(e) => setShopEmail(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-500">Tax Registration Number (VAT/SSCL)</label>
              <input
                type="text" value={taxNo} onChange={(e) => setTaxNo(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg animate-in"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 md:col-span-2 bg-indigo-50/40 p-4 rounded-xl border border-indigo-100/60">
              <div className="space-y-1">
                <label className="font-bold text-slate-500 text-indigo-700 flex items-center">
                  <Layout className="h-3.5 w-3.5 mr-1" />
                  System Theme Mode
                </label>
                <select
                  value={uiTheme} onChange={(e) => setUiTheme(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-bold"
                >
                  <option value="slate">Light Slate Theme</option>
                  <option value="oled">OLED Deep Black Theme</option>
                  <option value="emerald">Emerald Cyber Theme</option>
                  <option value="glass">Glassmorphism Cyber Theme</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500 text-indigo-700 flex items-center">
                  <Key className="h-3.5 w-3.5 mr-1" />
                  Admin Passcode PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="1234"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-center font-extrabold tracking-widest bg-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Sri Lanka VAT Rate (%) <span className="text-[10px] text-slate-400 font-medium">(0 = disabled)</span></label>
                <input
                  type="number" min="0" max="100" step="0.5"
                  value={vatRate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setVatRate(val === '' ? 0 : Number(val));
                  }}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Sri Lanka SSCL Rate (%) <span className="text-[10px] text-slate-400 font-medium">(0 = disabled)</span></label>
                <input
                  type="number" min="0" max="100" step="0.5"
                  value={ssclRate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSsclRate(val === '' ? 0 : Number(val));
                  }}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-bold"
                />
              </div>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="font-bold text-slate-500 flex items-center gap-1">
                <Image className="h-3 w-3" /> Shop Logo (Optional)
              </label>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setShopLogoTab('url')}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-md transition ${
                    shopLogoTab === 'url' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Web URL
                </button>
                <button
                  type="button"
                  onClick={() => setShopLogoTab('upload')}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-md transition ${
                    shopLogoTab === 'upload' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Upload File
                </button>
              </div>
              {shopLogoTab === 'url' ? (
                <input
                  type="text"
                  value={shopLogoUrl.startsWith('data:image') ? '' : shopLogoUrl}
                  onChange={(e) => setShopLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.jpg"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                />
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => shopLogoFileRef.current?.click()}
                    className="w-full h-8 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-600 rounded-lg font-bold transition flex items-center justify-center gap-1 text-xs"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Select Logo File
                  </button>
                  <input
                    ref={shopLogoFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setShopLogoUrl(ev.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </div>
              )}
              {shopLogoUrl && (
                <div className="flex items-center gap-2 mt-1 p-1 bg-slate-50 border border-slate-200 rounded-lg">
                  <img src={shopLogoUrl} alt="shop logo preview" className="w-8 h-8 object-cover rounded border bg-white shrink-0" onError={() => setShopLogoUrl('')} />
                  <span className="text-[9px] text-slate-500 truncate flex-1">{shopLogoUrl.startsWith('data:image') ? 'Uploaded Local Logo' : shopLogoUrl}</span>
                  <button type="button" onClick={() => setShopLogoUrl('')} className="p-0.5 text-rose-500 hover:bg-rose-50 rounded">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="font-bold text-slate-500">Receipt Footer Message</label>
              <input
                type="text" value={footerMsg} onChange={(e) => setFooterMsg(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center space-x-1.5"
            >
              <Save className="h-4 w-4" />
              <span>Save Profile Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* USERS & ROLES */}
      {subTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          {/* Left Column: static roles list */}
          <div className="lg:col-span-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">User Roles & Access Control</h3>
              <p className="text-[10px] text-slate-400 font-medium">Manage cashiers, admins and technical staff roles.</p>
            </div>

            <div className="space-y-2 text-xs font-semibold">
              {[
                { role: 'Admin', desc: 'Full access to all settings, inventory, sales reports, and database backups.' },
                { role: 'Cashier', desc: 'Can operate POS Cash Register Terminal. Restricted from accessing analytics, settings, and full reports.' },
                { role: 'Technician', desc: 'Access to computer and mobile repair logs and job tracking boards. Restricted from billing.' }
              ].map(usr => (
                <div key={usr.role} className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex items-start space-x-3">
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-lg font-bold">{usr.role[0]}</div>
                  <div className="flex-1">
                    <h4 className="font-extrabold text-slate-800">{usr.role}</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">{usr.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Change passcode PIN form */}
          <form onSubmit={handleChangePin} className="lg:col-span-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4 text-xs font-semibold flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center">
                  <Key className="h-4 w-4 mr-1.5 text-blue-650" />
                  {language === 'en' ? 'Change Admin & POS Passcode PIN' : 'කළමනාකරණ සහ POS පින් අංකය වෙනස් කිරීම'}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  {language === 'en' ? 'Update the secure numeric PIN passcode used to switch to the admin dashboard and POS terminal.' : 'කළමනාකරණ අංශයට සහ POS පර්යන්තයට ඇතුළු වීමට භාවිතා කරන රහස් පින් අංකය යාවත්කාලීන කරන්න.'}
                </p>
              </div>

              {pinError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl font-bold flex items-center space-x-2 animate-pulse">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              {pinSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl font-bold flex items-center space-x-2">
                  <Check className="h-4 w-4 shrink-0 animate-bounce" />
                  <span>{pinSuccess}</span>
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">{language === 'en' ? 'Current Passcode PIN *' : 'වත්මන් පින් අංකය (PIN) *'}</label>
                  <input
                    type="password"
                    required
                    maxLength={6}
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-center font-extrabold tracking-widest bg-slate-50 text-slate-800 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500">{language === 'en' ? 'New Passcode PIN *' : 'නව පින් අංකය (PIN) *'}</label>
                  <input
                    type="password"
                    required
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-center font-extrabold tracking-widest bg-slate-50 text-slate-800 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500">{language === 'en' ? 'Confirm New Passcode PIN *' : 'නව පින් අංකය තහවුරු කරන්න *'}</label>
                  <input
                    type="password"
                    required
                    maxLength={6}
                    value={confirmNewPin}
                    onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-center font-extrabold tracking-widest bg-slate-50 text-slate-800 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center space-x-1.5 cursor-pointer active:scale-95"
              >
                <Save className="h-4 w-4" />
                <span>{language === 'en' ? 'Update Passcode PIN' : 'පින් අංකය යාවත්කාලීන කරන්න'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* POS & HARDWARE */}
      {subTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleSave} className="lg:col-span-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4 text-xs font-semibold">
            <div className="space-y-3">
              <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-100 pb-1">
                Custom Keyboard Shortcut Configuration
              </h4>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 text-[10px]">Focus Search Input</label>
                  <input
                    type="text" value={shortcutSearch} onChange={(e) => setShortcutSearch(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-center font-bold bg-slate-50 text-slate-800 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 text-[10px]">Cash Checkout Key</label>
                  <input
                    type="text" value={shortcutCash} onChange={(e) => setShortcutCash(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-center font-bold bg-slate-50 text-slate-800 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 text-[10px]">Card Checkout Key</label>
                  <input
                    type="text" value={shortcutCard} onChange={(e) => setShortcutCard(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-center font-bold bg-slate-50 text-slate-800 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 text-[10px]">Bank Checkout Key</label>
                  <input
                    type="text" value={shortcutBank} onChange={(e) => setShortcutBank(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-center font-bold bg-slate-50 text-slate-800 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 text-[10px]">Complete Sale Key</label>
                  <input
                    type="text" value={shortcutComplete} onChange={(e) => setShortcutComplete(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-center font-bold bg-slate-50 text-slate-800 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 text-[10px]">Clear Cart Key</label>
                  <input
                    type="text" value={shortcutClear} onChange={(e) => setShortcutClear(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-center font-bold bg-slate-50 text-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100">
                <label className="font-bold text-slate-500">Thermal Receipt Printer Width</label>
                <select
                  value={receiptWidth} onChange={(e) => setReceiptWidth(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-bold text-slate-800"
                >
                  <option value="58mm">58mm (Small Thermal)</option>
                  <option value="80mm">80mm (Standard Thermal)</option>
                  <option value="A4">A4 (Standard Laser)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center space-x-1.5"
              >
                <Save className="h-4 w-4" />
                <span>Save POS Hardware Settings</span>
              </button>
            </div>
          </form>

          {/* Thermal Receipt Visual Previewer (UI/UX Designer & Product Manager) */}
          <div className="lg:col-span-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Bilingual Thermal Receipt Preview</h3>
            <div className="bg-slate-100 p-4 rounded-xl border border-slate-200/60 max-h-[350px] overflow-y-auto flex justify-center">
              <div 
                className="bg-white p-5 text-slate-800 shadow-md font-mono text-[10px] leading-relaxed border border-slate-200 flex flex-col"
                style={{ width: receiptWidth === '58mm' ? '200px' : receiptWidth === '80mm' ? '280px' : '100%' }}
              >
                <div className="text-center space-y-1">
                  <h4 className="font-extrabold text-[11px] uppercase tracking-wide">{shopName || 'SmartShop Pro'}</h4>
                  <p className="text-[8px] font-medium text-slate-500">{shopAddress || 'Kurunegala, Sri Lanka'}</p>
                  <p className="text-[8px] font-medium text-slate-500">TEL: {shopPhone || '077-1234567'}</p>
                  {taxNo && <p className="text-[8px] font-bold text-slate-600">VAT REG: {taxNo}</p>}
                </div>
                <div className="border-b border-dashed border-slate-300 my-2"></div>
                <div className="space-y-1">
                  <div className="flex justify-between font-medium">
                    <span>1x Fast Charging USB-C Cable</span>
                    <span>Rs. 650.00</span>
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-400">
                    <span>Dialog Rs.100 Reload</span>
                    <span>Rs. 100.00</span>
                  </div>
                </div>
                <div className="border-b border-dashed border-slate-300 my-2"></div>
                <div className="space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>SUBTOTAL:</span>
                    <span>Rs. 750.00</span>
                  </div>
                  {vatRate > 0 && (
                    <div className="flex justify-between text-[8px] text-slate-500">
                      <span>VAT ({vatRate}%):</span>
                      <span>Rs. 112.50</span>
                    </div>
                  )}
                  {ssclRate > 0 && (
                    <div className="flex justify-between text-[8px] text-slate-500">
                      <span>SSCL ({ssclRate}%):</span>
                      <span>Rs. 18.75</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-extrabold border-t border-slate-200 pt-1 mt-1 text-blue-600">
                    <span>TOTAL LKR:</span>
                    <span>Rs. 881.25</span>
                  </div>
                </div>
                <div className="border-b border-dashed border-slate-300 my-2"></div>
                <div className="text-center space-y-1.5 pt-1">
                  <p className="text-[8px] leading-tight font-medium text-slate-500">{footerMsg || 'Thank You! Come Again.'}</p>
                  <div className="flex flex-col items-center pt-2">
                    <img 
                      src={settings.qrCodeUrl || "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=CommercialBank-1002938475"} 
                      className="h-16 w-16 border border-slate-100 p-1 bg-white" 
                      alt="LANKAQR Code" 
                    />
                    <span className="text-[7px] text-slate-400 mt-1 uppercase font-bold tracking-wider">SCAN TO PAY / LANKA QR</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOYALTY SETTINGS */}
      {subTab === 'loyalty' && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4 text-xs font-semibold">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loyalty Point Calculation Rules</h3>
            <p className="text-xs text-slate-400 font-medium">Configure how many rupees spent earn 1 loyalty point.</p>
          </div>

          <div className="max-w-xs space-y-1">
            <label className="font-bold text-slate-500">Rupees spent per 1 point *</label>
            <input
              type="number" min="1" required value={loyaltyValue} onChange={(e) => setLoyaltyValue(Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-bold"
            />
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center space-x-1.5"
            >
              <Save className="h-4 w-4" />
              <span>Save Loyalty Rules</span>
            </button>
          </div>
        </form>
      )}

      {/* BANK & QR */}
      {subTab === 'bank' && (
        <div className="space-y-6">
          <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4 text-xs font-semibold">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Bank & LankaQR Settlement Settings</h3>
                <p className="text-[10px] text-slate-400 font-medium">Configure bank details to show on receipts and QR payment codes.</p>
              </div>
              <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 text-right">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Dynamic Bank Balance</span>
                <span className="text-sm font-extrabold text-blue-600">Rs. {(bankBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Bank Name</label>
                <input
                  type="text" value={bankName} onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Account Number</label>
                <input
                  type="text" value={accNo} onChange={(e) => setAccNo(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Account Name</label>
                <input
                  type="text" value={accName} onChange={(e) => setAccName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center space-x-1.5"
              >
                <Save className="h-4 w-4" />
                <span>Save Bank Details</span>
              </button>
            </div>
          </form>

          {/* Recent Bank Transactions Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recent Bank & QR Transactions</h3>
              <p className="text-[10px] text-slate-400 font-medium">Automatic ledger records from POS Card & QR checkouts.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                    <th className="py-2.5">Date & Time</th>
                    <th>Transaction Type</th>
                    <th>Sale ID</th>
                    <th>Previous Balance</th>
                    <th>Amount Added</th>
                    <th className="text-right">New Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {bankTransactions && bankTransactions.length > 0 ? (
                    bankTransactions.map(tx => (
                      <tr key={tx.id} className="text-slate-700 hover:bg-slate-50/50">
                        <td className="py-2.5 text-slate-500">{new Date(tx.timestamp).toLocaleString()}</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                            tx.type === 'QR' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {tx.type} Payment
                          </span>
                        </td>
                        <td><span className="font-mono text-[10px] text-slate-500">{tx.saleId}</span></td>
                        <td>Rs. {tx.prevBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="text-blue-600 font-bold">+ Rs. {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="text-right font-extrabold text-slate-800">Rs. {tx.newBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                        No recent bank transactions recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* FEATURE TOGGLES */}
      {subTab === 'features' && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6 text-xs font-semibold text-slate-800">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">Feature Management & Modular Toggles</h3>
            <p className="text-[10px] text-slate-400 font-medium">Enable or disable advanced business modules. Historical data is preserved safely.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'enableSms', label: 'SMS Notifications Gateway', desc: 'Send automated transaction receipts and repair updates via USB SIM Dongle.', state: enableSms, setState: setEnableSms },
              { key: 'enableRepairs', label: 'Device Repairs & Quotations Tracking', desc: 'Register repair jobs, assign technicians, issue quotations, and monitor device diagnostics.', state: enableRepairs, setState: setEnableRepairs },
              { key: 'enableSpecialOrders', label: 'Custom Special Orders', desc: 'Track custom apparel orders (T-shirts, caps, embroidery) with advance payment ledgers.', state: enableSpecialOrders, setState: setEnableSpecialOrders },
              { key: 'enableHP', label: 'Hire Purchase & Debtor Instalments', desc: 'Track customer outstanding balances and EMI schedule payments.', state: enableHp, setState: setEnableHp },
              { key: 'enableBatches', label: 'Product Expiry Batch Control', desc: 'Add multiple batches with expiry dates to products and enforce FIFO stock deduction.', state: enableBatches, setState: setEnableBatches }
            ].map(f => (
              <div key={f.key} className="flex items-start justify-between p-4 rounded-xl border border-slate-200/60 bg-slate-50/50 hover:bg-slate-50 transition">
                <div className="space-y-0.5 max-w-[80%] text-left">
                  <h4 className="font-extrabold text-slate-800">{f.label}</h4>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{f.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => f.setState(!f.state)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    f.state ? 'bg-blue-600' : 'bg-slate-350'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      f.state ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center space-x-1.5"
            >
              <Save className="h-4 w-4" />
              <span>Save Modular Features</span>
            </button>
          </div>
        </form>
      )}

      {/* REGISTER LOGS */}
      {subTab === 'logs' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
              <Activity className="h-4.5 w-4.5 mr-1.5 text-blue-600" />
              System Audit Logs & Activity
            </h3>
            <button
              onClick={onClearLogs}
              className="text-[10px] text-rose-600 font-bold hover:underline"
            >
              Clear Logs
            </button>
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {auditLogs.map(log => (
              <div key={log.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] font-semibold flex flex-col space-y-1">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-slate-400 font-bold">[{log.user}]</span>{' '}
                    <span className="text-slate-800 font-extrabold">{log.action}:</span>{' '}
                    <span className="text-slate-600 font-medium">{log.details}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{new Date(log.createdAt).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between text-[8px] font-mono text-slate-400 bg-white/40 px-2 py-0.5 rounded border border-slate-100">
                  <span>Prev Hash: <span className="font-bold text-slate-600">{log.prevHash || 'None'}</span></span>
                  <span>Curr Hash: <span className="font-bold text-indigo-600">{log.currentHash || 'None'}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DATABASE & SECURITY SUB-TAB (Database Engineer & Cybersecurity Specialist) */}
      {subTab === 'database' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs font-semibold">
          {/* Health Check and Log Integrity Verification */}
          <div className="lg:col-span-6 space-y-6">
            {/* Health Check Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                <ShieldCheck className="h-4.5 w-4.5 mr-1.5 text-emerald-500" />
                Database Integrity Health Check
              </h3>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                Scan table row mappings, positive values, out-of-bounds metrics, and constraint validations.
              </p>
              
              <div className="flex items-center space-x-4 p-3 bg-slate-50 rounded-xl border border-slate-150">
                <div className="text-2xl font-black text-emerald-600">{dbHealth.score}%</div>
                <div>
                  <div className="font-extrabold text-slate-800">Database Health Score</div>
                  <div className="text-[10px] text-slate-400">Scanned {dbHealth.checkedCount} table references</div>
                </div>
              </div>

              {dbHealth.issues.length > 0 ? (
                <div className="bg-rose-50 border border-rose-100 text-[10px] text-rose-700 p-3 rounded-xl max-h-32 overflow-y-auto space-y-1 font-mono">
                  <div className="font-bold mb-1">Found Integrity Warnings:</div>
                  {dbHealth.issues.map((iss: string, idx: number) => (
                    <div key={idx}>⚠️ {iss}</div>
                  ))}
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-100 text-[10px] text-emerald-700 p-3 rounded-xl flex items-center space-x-1.5 font-bold">
                  <Check className="h-4 w-4" />
                  <span>All table index constraints and references are 100% integral!</span>
                </div>
              )}
            </div>

            {/* Cryptographic Audit Chain Verifier */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                <Lock className="h-4.5 w-4.5 mr-1.5 text-indigo-500" />
                Cryptographic Audit Log chaining
              </h3>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                Verify audit logs chain links (rolling DJB2 checksums). Prevents unauthorized manual record altering.
              </p>

              <button
                onClick={verifyLogIntegrity}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Verify Log Chaining integrity</span>
              </button>

              {logIntegrity.status !== 'idle' && (
                <div className={`p-3 rounded-xl border font-mono text-[10px] ${
                  logIntegrity.status === 'success' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold' 
                    : 'bg-rose-50 border-rose-200 text-rose-700 font-bold'
                }`}>
                  {logIntegrity.status === 'success' ? '🛡️ ' : '❌ '}
                  {logIntegrity.message}
                </div>
              )}
            </div>
            
            {/* Secure Backup & Encryption */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                  <Key className="h-4.5 w-4.5 mr-1.5 text-amber-500" />
                  Encrypted Database Backup & File Import
                </h3>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5">
                  Encrypt exported data files with symmetric passphrases to secure sensitive customer data.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                {/* Export */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-slate-600">Export Password Protected Backup</div>
                  <input
                    type="password"
                    placeholder="Enter backup passcode"
                    value={encryptPassword}
                    onChange={(e) => setEncryptPassword(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[10px]"
                  />
                  <button
                    onClick={handleSecureExport}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white py-1.5 rounded-lg font-bold flex items-center justify-center space-x-1"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Encrypted .enc</span>
                  </button>
                </div>

                {/* Import */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-slate-600">Import Protected Database</div>
                  <input
                    type="password"
                    placeholder="Enter decryption password"
                    value={importPassword}
                    onChange={(e) => setImportPassword(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[10px]"
                  />
                  <textarea
                    placeholder="Paste encrypted base64 payload"
                    value={importPayload}
                    onChange={(e) => setImportPayload(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-200 rounded-lg text-[8px] font-mono h-12 scrollbar-none"
                  />
                  <button
                    onClick={handleSecureImport}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded-lg font-bold flex items-center justify-center space-x-1"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Decrypt & Import State</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Database snapshot History Rollbacks */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                  <History className="h-4.5 w-4.5 mr-1.5 text-blue-500" />
                  Database snapshots & Rollbacks
                </h3>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5">
                  Save snapshot bookmarks of current database states in local history, allowing instant rolls backs.
                </p>
              </div>

              {/* Create Snapshot Form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Snapshot label e.g., Pre-Inventory Clear"
                  value={newSnapshotLabel}
                  onChange={(e) => setNewSnapshotLabel(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newSnapshotLabel.trim()) return;
                    onCreateSnapshot(newSnapshotLabel.trim());
                    setNewSnapshotLabel('');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-bold"
                >
                  Take Snapshot
                </button>
              </div>

              {/* Snapshot List */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saved State Rollback History</div>
                {dbSnapshots.length === 0 ? (
                  <div className="text-[10px] text-slate-400 text-center py-4 font-medium">No snapshots saved. Take one above!</div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {dbSnapshots.map(snap => (
                      <div key={snap.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 flex justify-between items-center text-xs">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-slate-800 truncate">{snap.label}</h4>
                          <p className="text-[9px] text-slate-400 font-medium">{new Date(snap.timestamp).toLocaleString()} • P:{snap.products.length} C:{snap.customers.length}</p>
                        </div>
                        <div className="flex space-x-1.5">
                          <button
                            onClick={() => onRollbackSnapshot(snap.id)}
                            className="bg-blue-50 text-blue-600 border border-blue-150 px-2.5 py-1 rounded-lg text-[10px] font-bold hover:bg-blue-100 transition flex items-center space-x-0.5"
                          >
                            <RefreshCw className="h-3 w-3" />
                            <span>Rollback</span>
                          </button>
                          <button
                            onClick={() => onDeleteSnapshot(snap.id)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
