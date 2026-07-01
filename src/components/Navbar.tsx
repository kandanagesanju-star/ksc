import React, { useState } from 'react';
import { translations } from '../lib/translations';
import { ShopSettings, Customer, Employee } from '../types';
import { ShoppingBag, ShieldAlert, Laptop, Languages, Layers, Wifi, WifiOff, Key, Lock, User, Award, X, LogOut, ChevronDown, RefreshCw } from 'lucide-react';

interface NavbarProps {
  language: 'en' | 'si';
  setLanguage: (lang: 'en' | 'si') => void;
  viewMode: 'storefront' | 'admin';
  setViewMode: (mode: 'storefront' | 'admin') => void;
  adminTab: string;
  setAdminTab: (tab: any) => void;
  cartCount: number;
  settings: ShopSettings;
  showPasscodeModal: boolean;
  setShowPasscodeModal: (show: boolean) => void;
  customers?: Customer[];
  onAddCustomer?: (customer: Customer) => Customer;
  onUpdateSettings?: (settings: ShopSettings) => void;
  showCustomerPortal: boolean;
  setShowCustomerPortal: (show: boolean) => void;
  loggedInCustomer: any;
  setLoggedInCustomer: (customer: any) => void;
  employees?: Employee[];
  activeUser?: any;
  onLoginUser?: (user: any) => void;
  onLogoutUser?: () => void;
  onUpdateEmployee?: (emp: Employee) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  setLanguage,
  viewMode,
  setViewMode,
  adminTab,
  setAdminTab,
  cartCount,
  settings,
  showPasscodeModal,
  setShowPasscodeModal,
  customers = [],
  onAddCustomer,
  onUpdateSettings,
  showCustomerPortal,
  setShowCustomerPortal,
  loggedInCustomer,
  setLoggedInCustomer,
  employees = [],
  activeUser = null,
  onLoginUser,
  onLogoutUser,
  onUpdateEmployee
}) => {
  const t = translations[language];
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [passcode, setPasscode] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');

  const [syncEnabled, setSyncEnabled] = useState(() => localStorage.getItem('shop_sync_enabled') === 'true');
  const [syncId, setSyncId] = useState(() => localStorage.getItem('shop_sync_id') || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPrivate, setIsPrivate] = useState(() => localStorage.getItem('shop_sync_private') === 'true');
  const [showSyncPopover, setShowSyncPopover] = useState(false);

  React.useEffect(() => {
    const handleStart = () => setIsSyncing(true);
    const handleEnd = () => {
      setIsSyncing(false);
      setSyncEnabled(localStorage.getItem('shop_sync_enabled') === 'true');
      setSyncId(localStorage.getItem('shop_sync_id') || '');
      setIsPrivate(localStorage.getItem('shop_sync_private') === 'true');
    };

    window.addEventListener('shop-sync-start', handleStart);
    window.addEventListener('shop-sync-end', handleEnd);

    return () => {
      window.removeEventListener('shop-sync-start', handleStart);
      window.removeEventListener('shop-sync-end', handleEnd);
    };
  }, []);

  const handleManualSyncNow = () => {
    if (isSyncing || !isOnline) return;
    setIsSyncing(true);
    window.dispatchEvent(new Event('trigger-shop-sync'));
  };

  const handleUploadSyncNow = () => {
    if (isSyncing || !isOnline) return;
    setIsSyncing(true);
    window.dispatchEvent(new Event('trigger-shop-upload'));
  };

  // Customer Portal states (local form input states)
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPass, setCustomerPass] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

  // States for Active User Change PIN Modal
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [changePinCurrent, setChangePinCurrent] = useState('');
  const [changePinNew, setChangePinNew] = useState('');
  const [changePinConfirm, setChangePinConfirm] = useState('');
  const [changePinError, setChangePinError] = useState('');
  const [changePinSuccess, setChangePinSuccess] = useState('');

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChangePinError('');
    setChangePinSuccess('');

    if (changePinNew.length !== 4) {
      setChangePinError(language === 'en' ? 'New PIN passcode must be exactly 4 digits.' : 'නව පින් අංකය (PIN) ඉලක්කම් 4ක් විය යුතුය.');
      return;
    }

    if (changePinNew !== changePinConfirm) {
      setChangePinError(language === 'en' ? 'New PIN passcodes do not match.' : 'නව පින් අංක එකිනෙකට නොගැලපේ.');
      return;
    }

    if (!activeUser) {
      setChangePinError(language === 'en' ? 'No active logged-in user.' : 'සක්‍රිය පරිශීලකයෙකු නොමැත.');
      return;
    }

    const isAdmin = activeUser.id === 'admin' || activeUser.role === 'Admin';

    if (isAdmin) {
      const currentRequired = settings.adminPin || '8892';
      if (changePinCurrent !== currentRequired) {
        setChangePinError(language === 'en' ? 'Incorrect current PIN passcode.' : 'වත්මන් පින් අංකය වැරදියි.');
        return;
      }

      if (onUpdateSettings) {
        onUpdateSettings({
          ...settings,
          adminPin: changePinNew
        });
      }
      
      // Also update local storage settings
      const savedSettings = localStorage.getItem('shop_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        localStorage.setItem('shop_settings', JSON.stringify({ ...parsed, adminPin: changePinNew }));
      }

      setChangePinSuccess(language === 'en' ? 'Admin PIN changed successfully!' : 'කළමනාකරු පින් අංකය සාර්ථකව වෙනස් කරන ලදී!');
      setTimeout(() => setShowChangePinModal(false), 1500);
    } else {
      // Find employee
      const emp = employees.find(empItem => empItem.id === activeUser.id);
      if (!emp) {
        setChangePinError(language === 'en' ? 'Employee profile not found.' : 'සේවක ගිණුම සොයාගත නොහැකි විය.');
        return;
      }

      // Check current passcode
      const currentRequired = emp.passcode || '';
      if (changePinCurrent !== currentRequired) {
        setChangePinError(language === 'en' ? 'Incorrect current PIN passcode.' : 'වත්මන් පින් අංකය වැරදියි.');
        return;
      }

      if (onUpdateEmployee) {
        onUpdateEmployee({
          ...emp,
          passcode: changePinNew
        });
      }

      setChangePinSuccess(language === 'en' ? 'Your passcode PIN changed successfully!' : 'ඔබගේ පින් අංකය සාර්ථකව වෙනස් කරන ලදී!');
      setTimeout(() => setShowChangePinModal(false), 1500);
    }
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr >= 5 && hr < 12) return language === 'en' ? '☀️ Good Morning!' : '☀️ සුභ උදෑසනක්!';
    if (hr >= 12 && hr < 17) return language === 'en' ? '🌤️ Good Afternoon!' : '🌤️ සුභ පස්වරුවක්!';
    if (hr >= 17 && hr < 22) return language === 'en' ? '🌙 Good Evening!' : '🌙 සුභ සැන්දෑවක්!';
    return language === 'en' ? '✨ Welcome to our Shop!' : '✨ සාදරයෙන් පිළිගනිමු!';
  };

  // Handle countdown timer for lockout
  React.useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setTimeout(() => setLockoutTime(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [lockoutTime]);

  // Handle browser online/offline status shifts
  React.useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Secure passcode check to protect admin panels from normal customers
  const handleAdminAccess = () => {
    if (lockoutTime > 0) return;
    const requiredPin = settings.adminPin || '8892';
    
    const matchedEmployee = employees.find(e => e.passcode === passcode);

    if (passcode === requiredPin || matchedEmployee) {
      setViewMode('admin');
      
      const loggedUser = matchedEmployee 
        ? { id: matchedEmployee.id, name: matchedEmployee.name, role: matchedEmployee.role }
        : { id: 'admin', name: 'Admin', role: 'Admin' as const };
        
      if (onLoginUser) {
        onLoginUser(loggedUser);
      }
      
      setShowPasscodeModal(false);
      setPasscode('');
      setAttempts(0);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        setLockoutTime(30);
        setPasscode('');
        alert(language === 'en' 
          ? 'Security Alert: Too many failed PIN attempts! Locked for 30 seconds.' 
          : 'ආරක්ෂක අවවාදයයි: වැරදි PIN අංක උත්සාහයන් වැඩිය! තත්පර 30කට අගුළු දමා ඇත.');
      } else {
        alert(language === 'en' 
          ? `Incorrect passcode! ${3 - newAttempts} attempts remaining.` 
          : `වැරදි PIN අංකයකි! තව ${3 - newAttempts} වරක් ඇතුළත් කළ හැක.`);
      }
    }
  };

  const handleEmergencyReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (recoveryCode.trim() === '880882015V') {
      const updatedSettings = { ...settings, adminPin: '8892' };
      if (onUpdateSettings) {
        onUpdateSettings(updatedSettings);
      }
      localStorage.setItem('shop_settings', JSON.stringify(updatedSettings));
      
      alert(language === 'en' 
        ? 'Passcode PIN reset successful! The admin PIN has been set back to default: 8892' 
        : 'පින් අංකය සාර්ථකව යථා තත්ත්වයට පත් කරන ලදී! පද්ධතියේ පින් අංකය පෙරනිමි PIN අංකය (8892) ලෙස සකසා ඇත.');
      
      setShowRecovery(false);
      setRecoveryCode('');
      setPasscode('');
      setAttempts(0);
      setLockoutTime(0);
    } else {
      alert(language === 'en'
        ? 'Invalid Master Recovery PIN! Please check and try again.'
        : 'ප්‍රධාන පින් අංකය (Master PIN) වැරදියි! කරුණාකර නැවත උත්සාහ කරන්න.');
    }
  };

  return (
    <header className="bg-slate-950 text-white shadow-xl sticky top-0 z-50 border-b border-slate-800/80">
      <div className="max-w-[100vw] px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Online/Offline Real-time Status */}
          <div className="flex items-center space-x-3">
            {viewMode === 'storefront' && settings.onlineStoreLogoUrl ? (
              <img 
                src={settings.onlineStoreLogoUrl} 
                alt="Store Logo" 
                className="h-10 w-10 object-contain rounded-xl bg-white/10 p-0.5 border border-white/20" 
              />
            ) : (
              <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/10 border border-blue-400/20">
                <Laptop className="h-5.5 w-5.5 animate-pulse" />
              </div>
            )}
            <div>
              <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-200 to-white bg-clip-text text-transparent">
                {viewMode === 'storefront' 
                  ? (settings.onlineStoreName || settings.shopName || t.appName)
                  : (settings.shopName || t.appName)}
              </h1>
              {viewMode === 'admin' ? (
                <div className="flex items-center space-x-1.5 mt-0.5">
                  {isOnline ? (
                    <>
                      <Wifi className="h-3 w-3 text-emerald-400" />
                      <span className="text-[9px] text-emerald-400 font-extrabold tracking-wider uppercase">
                        {language === 'en' ? 'ONLINE • CLOUD SYNCED' : 'සබැඳිව පවතී • සජීවී'}
                      </span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 text-amber-400 animate-bounce" />
                      <span className="text-[9px] text-amber-400 font-extrabold tracking-wider uppercase">
                        {language === 'en' ? 'OFFLINE MODE • LOCAL BILLING ACTIVE' : 'නොබැඳිව පවතී • බිල්පත් සක්‍රීයයි'}
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="text-[9px] text-emerald-400 font-extrabold tracking-wider uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/25">
                    {getGreeting()}
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold hidden sm:inline">
                    • {settings.onlineTagline || (language === 'en' ? 'Premium Quality & Fast Repairs' : 'උසස් තත්ත්වයේ සේවාව සහ විශ්වාසනීය අලුත්වැඩියාව')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Middle Announcement Banner (Storefront Mode) */}
          {viewMode === 'storefront' && settings.onlineAnnouncementMessage && (
            <div className="hidden lg:flex items-center justify-center flex-1 max-w-xl mx-4">
              <div className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-inner border flex items-center space-x-2 ${
                settings.onlineAnnouncementBgColor || 'bg-blue-500/15 text-blue-300 border-blue-500/30'
              }`}>
                <span className="h-2 w-2 rounded-full bg-current animate-ping shrink-0"></span>
                <span className="truncate">{settings.onlineAnnouncementMessage}</span>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="hidden md:flex items-center space-x-4">
            {viewMode === 'admin' ? (
              <>
                {/* Real-time Cloud Sync status widget */}
                {syncEnabled && (
                  <div className="relative flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-350 mr-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        isSyncing ? 'bg-blue-400' : isOnline ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${
                        isSyncing ? 'bg-blue-500' : isOnline ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}></span>
                    </span>
                    <button
                      onClick={() => setShowSyncPopover(!showSyncPopover)}
                      className="hover:text-white transition uppercase text-[9px] tracking-wider font-extrabold flex items-center gap-1 cursor-pointer"
                      title={language === 'en' ? 'Click to view sync status details' : 'සමමුහුර්ත විස්තර බැලීමට ක්ලික් කරන්න'}
                    >
                      <span>{isSyncing ? (language === 'en' ? 'Syncing...' : 'යාවත්කාලීන වේ...') : isOnline ? (language === 'en' ? 'Online' : 'සබැඳිව') : (language === 'en' ? 'Offline' : 'නොබැඳි')}</span>
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    <button
                      onClick={handleManualSyncNow}
                      disabled={isSyncing || !isOnline}
                      className="p-0.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-400 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      title={language === 'en' ? 'Live Sync (Check Cloud)' : 'Live Sync (Cloud පරීක්ෂා කරන්න)'}
                    >
                      <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
                    </button>

                    {/* Popover detailed stats */}
                    {showSyncPopover && (
                      <div className="absolute right-0 top-11 bg-slate-900 border border-slate-800 p-3 rounded-2xl shadow-2xl z-50 text-xs font-semibold text-slate-300 w-48 space-y-2 text-left animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="flex justify-between items-center pb-1 border-b border-slate-800">
                          <span className="font-extrabold uppercase text-[9px] tracking-wider text-slate-450">{language === 'en' ? 'Sync Profile' : 'සමමුහුර්ත විස්තර'}</span>
                          <button onClick={() => setShowSyncPopover(false)} className="text-[10px] text-slate-500 hover:text-white font-extrabold">✕</button>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px]"><span className="text-slate-500 font-bold">{language === 'en' ? 'Sync ID:' : 'ID අංකය:'}</span> <code className="bg-slate-950 px-1 py-0.5 rounded text-blue-400 select-all font-mono">{syncId ? `${syncId.slice(0, 8)}...` : 'N/A'}</code></p>
                          <p className="text-[10px]"><span className="text-slate-500 font-bold">{language === 'en' ? 'Live Sync:' : 'Live Sync:'}</span> <span className={syncEnabled ? 'text-emerald-400' : 'text-rose-450'}>{syncEnabled ? (language === 'en' ? 'ON' : 'ක්‍රියාත්මකයි') : (language === 'en' ? 'OFF' : 'අක්‍රියයි')}</span></p>
                          <p className="text-[10px]"><span className="text-slate-500 font-bold">{language === 'en' ? 'Private Cloud:' : 'පෞද්ගලික වලාකුළු:'}</span> <span className={isPrivate ? 'text-emerald-400' : 'text-slate-400'}>{isPrivate ? (language === 'en' ? 'Yes' : 'ඔව්') : (language === 'en' ? 'No (Public)' : 'නැත (පොදු)')}</span></p>
                          <p className="text-[10px]"><span className="text-slate-500 font-bold">{language === 'en' ? 'Connection:' : 'සම්බන්ධතාවය:'}</span> <span className={isOnline ? 'text-emerald-400' : 'text-rose-500'}>{isOnline ? (language === 'en' ? 'Connected' : 'සම්බන්ධයි') : (language === 'en' ? 'Disconnected' : 'විසන්ධි වී ඇත')}</span></p>
                        </div>
                        <button
                          onClick={() => {
                            handleUploadSyncNow();
                            setShowSyncPopover(false);
                          }}
                          disabled={isSyncing || !isOnline}
                          className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded-lg text-[10px] transition active:scale-95 text-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {language === 'en' ? 'Upload Sync Now' : 'අප්ලෝඩ් Sync Now'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Active User Session Details */}
                {activeUser && (
                  <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                    <div className="h-6 w-6 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                      {activeUser.name.charAt(0)}
                    </div>
                    <div className="text-[10px] text-left">
                      <p className="font-extrabold text-slate-200 leading-tight">{activeUser.name}</p>
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">{activeUser.role}</p>
                    </div>
                    <button
                      onClick={() => {
                        setChangePinCurrent('');
                        setChangePinNew('');
                        setChangePinConfirm('');
                        setChangePinError('');
                        setChangePinSuccess('');
                        setShowChangePinModal(true);
                      }}
                      className="ml-1.5 p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-yellow-400 transition cursor-pointer"
                      title={language === 'en' ? 'Change My PIN/Passcode' : 'මාගේ PIN අංකය වෙනස් කරන්න'}
                    >
                      <Key className="h-3.5 w-3.5" />
                    </button>
                    {onLogoutUser && (
                      <button
                        onClick={onLogoutUser}
                        className="ml-1 p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition cursor-pointer"
                        title="Logout Session"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* View Toggle */}
                <div className="bg-slate-900 p-1 rounded-xl flex space-x-1 border border-slate-800">
                  <button
                    onClick={() => {
                      if (onLogoutUser) onLogoutUser();
                    }}
                    className="flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-white"
                  >
                    <ShoppingBag className="h-4 w-4 mr-1.5" />
                    {t.storefront}
                  </button>
                  <button
                    disabled
                    className="flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-500/15"
                  >
                    <ShieldAlert className="h-4 w-4 mr-1.5" />
                    {t.adminDashboard}
                  </button>
                </div>

                {/* Language Switcher */}
                <button
                  onClick={() => setLanguage(language === 'en' ? 'si' : 'en')}
                  className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-800 transition"
                >
                  <Languages className="h-4 w-4 text-blue-400" />
                  <span>{language === 'en' ? 'සිංහල' : 'English'}</span>
                </button>

                {/* Expert Insights Tab Button */}
                <button
                  onClick={() => {
                    setViewMode('admin');
                    setAdminTab('insights');
                  }}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
                    viewMode === 'admin' && adminTab === 'insights'
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                >
                  <Layers className="h-4 w-4 text-indigo-400" />
                  <span>{language === 'en' ? 'Architect Insights' : 'නිර්මාණ සැලසුම්'}</span>
                </button>
              </>
            ) : null}
          </div>

          {/* Mobile Menu */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setLanguage(language === 'en' ? 'si' : 'en')}
              className="p-2 bg-slate-900 text-slate-300 rounded-xl text-xs border border-slate-800"
            >
              {language === 'en' ? 'සිං' : 'EN'}
            </button>

            {viewMode === 'storefront' && (
              <button
                onClick={() => setShowCustomerPortal(true)}
                className={`p-2 rounded-xl border text-xs font-bold transition ${
                  loggedInCustomer
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <User className="h-4 w-4" />
              </button>
            )}

            {viewMode === 'admin' && (
              <div className="flex items-center gap-1.5">
                {activeUser && (
                  <span className="text-[9px] bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-slate-300 font-extrabold max-w-[60px] truncate">
                    {activeUser.name.split(' ')[0]}
                  </span>
                )}
                <button
                  onClick={() => {
                    if (onLogoutUser) onLogoutUser();
                  }}
                  className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {viewMode === 'admin' && (
        <div className="bg-slate-950 text-slate-400 text-[10px] py-1 text-center font-semibold border-t border-slate-900/60 hidden sm:block tracking-wider">
          {t.tagline}
        </div>
      )}

      {/* ADMIN PASSCODE LOCK MODAL */}
      {showPasscodeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden p-6 space-y-4 text-center animate-in fade-in zoom-in-95 duration-150">
            {showRecovery ? (
              // RECOVERY VIEW
              <>
                <div className="bg-amber-500/10 p-3 rounded-full text-amber-500 w-fit mx-auto border border-amber-500/20">
                  <ShieldAlert className="h-6 w-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-100">
                    {language === 'en' ? 'Emergency PIN Reset' : 'හදිසි පින් අංකය නැවත පිහිටුවීම'}
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    {language === 'en' 
                      ? 'Enter the Master Recovery PIN to reset the admin passcode back to default: 8892'
                      : 'පින් අංකය 8892 ලෙස නැවත පිහිටුවීමට ප්‍රධාන පින් අංකය (Master PIN) ඇතුළත් කරන්න.'}
                  </p>
                </div>

                <form onSubmit={handleEmergencyReset} className="space-y-3">
                  <input
                    type="password"
                    maxLength={12}
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-center px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-lg font-bold tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent font-sans"
                    autoFocus
                  />
                  <div className="flex space-x-2 text-xs font-bold pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRecovery(false);
                        setRecoveryCode('');
                      }}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl transition"
                    >
                      {language === 'en' ? 'Back' : 'ආපසු'}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-xl shadow transition"
                    >
                      {language === 'en' ? 'Reset PIN' : 'යළි පිහිටුවන්න'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              // DEFAULT PASSCODE LOGIN VIEW
              <>
                {lockoutTime > 0 ? (
                  <div className="bg-rose-500/10 p-3 rounded-full text-rose-500 w-fit mx-auto border border-rose-500/20">
                    <Lock className="h-6 w-6 animate-pulse" />
                  </div>
                ) : (
                  <div className="bg-indigo-500/10 p-3 rounded-full text-indigo-400 w-fit mx-auto border border-indigo-500/20">
                    <Key className="h-6 w-6 animate-bounce" />
                  </div>
                )}
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-100">
                    {lockoutTime > 0 
                      ? (language === 'en' ? 'System Locked' : 'පද්ධතිය අගුළු දමා ඇත')
                      : (language === 'en' ? 'Access Control PIN' : 'පාලන පද්ධති පිවිසුම් PIN')}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {lockoutTime > 0 
                      ? (language === 'en' ? `Please wait ${lockoutTime}s before trying again.` : `නැවත උත්සාහ කිරීමට පෙර තත්පර ${lockoutTime}ක් රැඳී සිටින්න.`)
                      : (language === 'en' ? 'Enter Admin or Employee Passcode PIN (Default Admin: 8892)' : 'කළමනාකරු හෝ සේවකයාගේ පින් (PIN) අංකය ඇතුළත් කරන්න (Default Admin: 8892)')}
                  </p>
                </div>

                {lockoutTime === 0 && (
                  <div className="space-y-3">
                    <input
                      type="password"
                      maxLength={6}
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="••••"
                      className="w-full text-center px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-lg font-bold tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-sans"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAdminAccess();
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowRecovery(true)}
                      className="text-[10px] font-bold text-slate-500 hover:text-indigo-400 transition underline underline-offset-2"
                    >
                      {language === 'en' ? 'Forgot Passcode? / Emergency Reset' : 'පින් අංකය අමතකද? / හදිසි නැවත පිහිටුවීම'}
                    </button>
                  </div>
                )}

                <div className="flex space-x-2 pt-2 text-xs font-bold">
                  <button
                    onClick={() => {
                      setShowPasscodeModal(false);
                      setPasscode('');
                    }}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl transition"
                  >
                    {t.cancel}
                  </button>
                  {lockoutTime === 0 && (
                    <button
                      onClick={handleAdminAccess}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl shadow transition"
                    >
                      {language === 'en' ? 'Unlock' : 'පිවිසෙන්න'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* CUSTOMER PORTAL MODAL */}
      {showCustomerPortal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-1.5">
                <Award className="h-4 w-4 text-amber-400" />
                {language === 'en' ? 'Customer Loyalty Portal' : 'පාරිභෝගික ගිණුම් අංශය'}
              </h3>
              <button 
                onClick={() => {
                  setShowCustomerPortal(false);
                  setIsRegistered(false);
                }} 
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {loggedInCustomer ? (
              /* LOGGED IN ACCOUNT VIEW */
              <div className="space-y-4 text-center">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-full flex items-center justify-center mx-auto text-lg font-bold">
                    {loggedInCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-100 text-sm">{loggedInCustomer.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{loggedInCustomer.phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 text-center">
                    <span className="text-[10px] text-slate-500 font-bold block">Loyalty Points</span>
                    <span className="text-lg font-black text-amber-400 mt-1 block">{loggedInCustomer.points || 0}</span>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 text-center">
                    <span className="text-[10px] text-slate-500 font-bold block">Membership Status</span>
                    <span className="text-xs font-extrabold text-blue-400 mt-1 block">
                      {(loggedInCustomer.points || 0) > 1000 ? 'Gold VIP' : 'Silver Tier'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('logged_in_customer');
                    setLoggedInCustomer(null);
                  }}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition active:scale-95 cursor-pointer"
                >
                  {language === 'en' ? 'Sign Out' : 'ගිණුමෙන් ඉවත් වන්න'}
                </button>
              </div>
            ) : (
              /* LOGIN / REGISTER TABS */
              <div className="space-y-4">
                <div className="bg-slate-950 p-1 rounded-xl flex border border-slate-850">
                  <button
                    onClick={() => setIsRegistered(false)}
                    className={`flex-1 py-1.5 rounded-lg font-bold transition text-center ${
                      !isRegistered ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {language === 'en' ? 'Sign In' : 'පිවිසෙන්න'}
                  </button>
                  <button
                    onClick={() => setIsRegistered(true)}
                    className={`flex-1 py-1.5 rounded-lg font-bold transition text-center ${
                      isRegistered ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {language === 'en' ? 'Register' : 'ලියාපදිංචි වන්න'}
                  </button>
                </div>

                <div className="space-y-3">
                  {isRegistered && (
                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold">Full Name</label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 font-bold text-slate-200"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Mobile Number (SL)</label>
                    <input
                      type="text"
                      value={customerMobile}
                      onChange={(e) => setCustomerMobile(e.target.value)}
                      placeholder="0771234567"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 font-bold text-slate-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Password</label>
                    <input
                      type="password"
                      value={customerPass}
                      onChange={(e) => setCustomerPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 font-bold text-slate-200"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const cleanPhone = customerMobile.trim();
                    if (!cleanPhone || !customerPass) {
                      alert(language === 'en' ? 'Please fill in all fields!' : 'කරුණාකර සියලු විස්තර පුරවන්න!');
                      return;
                    }

                    if (isRegistered) {
                      // REGISTRATION MODE
                      if (!customerName.trim()) {
                        alert(language === 'en' ? 'Name is required!' : 'නම ඇතුළත් කිරීම අනිවාර්ය වේ!');
                        return;
                      }
                      
                      const existing = customers?.find(c => c.phone === cleanPhone);
                      if (existing) {
                        alert(language === 'en' ? 'Account with this number already exists!' : 'මෙම දුරකථන අංකයෙන් ගිණුමක් දැනටමත් පවතී!');
                        return;
                      }

                      const newCust = {
                        id: 'CUST-' + Math.floor(1000 + Math.random() * 9000),
                        name: customerName.trim(),
                        phone: cleanPhone,
                        loyaltyPoints: 100,
                        email: '',
                        address: '',
                        notes: 'Self Registered via Online Storefront',
                        createdAt: new Date().toISOString()
                      };

                      if (onAddCustomer) {
                        onAddCustomer(newCust);
                      }

                      const userSession = {
                        name: newCust.name,
                        phone: newCust.phone,
                        points: newCust.loyaltyPoints
                      };
                      localStorage.setItem('logged_in_customer', JSON.stringify(userSession));
                      setLoggedInCustomer(userSession);
                      setShowCustomerPortal(false);
                      setCustomerName('');
                      setCustomerMobile('');
                      setCustomerPass('');
                      setIsRegistered(false);
                      alert(language === 'en' ? 'Account registered successfully! Received 100 welcome loyalty points!' : 'ගිණුම සාර්ථකව ලියාපදිංචි කරන ලදී! ඔබට නොමිලේ ලෝයල්ටි ලකුණු 100ක් හිමිවිය!');
                    } else {
                      // LOGIN MODE
                      const match = customers?.find(c => c.phone === cleanPhone);
                      if (match) {
                        const userSession = {
                          name: match.name,
                          phone: match.phone,
                          points: match.loyaltyPoints || 0
                        };
                        localStorage.setItem('logged_in_customer', JSON.stringify(userSession));
                        setLoggedInCustomer(userSession);
                        setShowCustomerPortal(false);
                        setCustomerMobile('');
                        setCustomerPass('');
                        alert(language === 'en' ? `Welcome back, ${match.name}!` : `නැවත සාදරයෙන් පිළිගනිමු, ${match.name}!`);
                      } else {
                        const userSession = {
                          name: 'Guest Shopper',
                          phone: cleanPhone,
                          points: 50
                        };
                        localStorage.setItem('logged_in_customer', JSON.stringify(userSession));
                        setLoggedInCustomer(userSession);
                        setShowCustomerPortal(false);
                        setCustomerMobile('');
                        setCustomerPass('');
                        alert(language === 'en' ? 'Logged in as Guest Shopper!' : 'අමුත්තෙකු ලෙස සාර්ථකව පිවිසුණි!');
                      }
                    }
                  }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow active:scale-95 cursor-pointer"
                >
                  {isRegistered 
                    ? (language === 'en' ? 'Create Account & Sign In' : 'ගිණුම සාදා පිවිසෙන්න')
                    : (language === 'en' ? 'Sign In to Portal' : 'ගිණුමට පිවිසෙන්න')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* EMPLOYEE & ADMIN CHANGE PASSCODE PIN MODAL */}
      {showChangePinModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
              <h3 className="text-xs font-bold flex items-center">
                <Key className="h-4 w-4 mr-1.5 text-blue-400" />
                {language === 'en' ? 'Change Passcode PIN' : 'පින් අංකය වෙනස් කරන්න'}
              </h3>
              <button 
                onClick={() => setShowChangePinModal(false)} 
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePinSubmit} className="p-5 space-y-4 text-xs font-semibold text-slate-800">
              {changePinError && (
                <div className="bg-rose-50 text-rose-600 p-2.5 rounded-xl border border-rose-200 text-center font-bold">
                  {changePinError}
                </div>
              )}
              {changePinSuccess && (
                <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl border border-emerald-250 text-center font-bold">
                  {changePinSuccess}
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-500">
                  {language === 'en' ? 'Current Passcode PIN' : 'වත්මන් පින් අංකය'} *
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={changePinCurrent}
                  onChange={(e) => setChangePinCurrent(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-center font-extrabold tracking-widest text-slate-850 bg-white focus:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">
                  {language === 'en' ? 'New Passcode PIN (4 digits)' : 'නව පින් අංකය (ඉලක්කම් 4)'} *
                </label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  value={changePinNew}
                  onChange={(e) => setChangePinNew(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-center font-extrabold tracking-widest text-slate-850 bg-white focus:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">
                  {language === 'en' ? 'Confirm New Passcode PIN' : 'නව පින් අංකය තහවුරු කරන්න'} *
                </label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  value={changePinConfirm}
                  onChange={(e) => setChangePinConfirm(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-center font-extrabold tracking-widest text-slate-850 bg-white focus:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChangePinModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-650 py-2.5 rounded-xl font-bold transition cursor-pointer"
                >
                  {language === 'en' ? 'Cancel' : 'අවලංගු කරන්න'}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-750 text-white py-2.5 rounded-xl font-bold shadow-md transition cursor-pointer"
                >
                  {language === 'en' ? 'Update PIN' : 'පින් එක වෙනස් කරන්න'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
