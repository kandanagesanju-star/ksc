import React, { useState, useEffect } from 'react';
import { Shield, Layout, Users, ShoppingBag, Database, Search, RefreshCw, Key, ToggleLeft, ToggleRight, Check, X, AlertTriangle, Plus, ArrowLeft, Settings, Edit2, Eye, EyeOff, Trash2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

const getApiBase = () => {
  return Capacitor.isNativePlatform() ? 'https://ksc-6ie.pages.dev' : '';
};

interface ShopTenant {
  shopId: string;
  shopName: string;
  createdAt: number;
  lastSynced: number;
  productsCount: number;
  salesCount: number;
  status: 'active' | 'deactivated';
  email?: string;
  phone?: string;
  password?: string;
  expiryDate?: number;
}

interface SuperAdminDashboardProps {
  language: 'en' | 'si';
  setViewMode: (mode: 'storefront' | 'admin') => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ language, setViewMode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('saas_admin_auth') === 'true';
  });
  const [adminKey, setAdminKey] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [shops, setShops] = useState<ShopTenant[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'deactivated'>('all');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLocalSimulation, setIsLocalSimulation] = useState<boolean>(() => {
    return localStorage.getItem('saas_is_local_sim') === 'true';
  });
  
  // Create shop states
  const [newShopName, setNewShopName] = useState<string>('');
  const [newShopEmail, setNewShopEmail] = useState<string>('');
  const [newShopPhone, setNewShopPhone] = useState<string>('');
  const [newShopPassword, setNewShopPassword] = useState<string>('');
  const [newShopExpiry, setNewShopExpiry] = useState<string>(() => new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [createSuccessMsg, setCreateSuccessMsg] = useState<string>('');
  const [createErrorMsg, setCreateErrorMsg] = useState<string>('');
  const [createdShopDetails, setCreatedShopDetails] = useState<{
    shopId: string;
    shopName: string;
    email: string;
    phone: string;
    password?: string;
    expiryDate?: number;
  } | null>(null);

  // Edit shop states
  const [editingShop, setEditingShop] = useState<ShopTenant | null>(null);
  const [editShopName, setEditShopName] = useState<string>('');
  const [editShopEmail, setEditShopEmail] = useState<string>('');
  const [editShopPhone, setEditShopPhone] = useState<string>('');
  const [editShopPassword, setEditShopPassword] = useState<string>('');
  const [editShopExpiry, setEditShopExpiry] = useState<string>('');
  const [editError, setEditError] = useState<string>('');

  // Delete shop states
  const [deletingShop, setDeletingShop] = useState<ShopTenant | null>(null);

  const [confirmToggle, setConfirmToggle] = useState<{ shopId: string; status: 'active' | 'deactivated'; name: string } | null>(null);
  
  // Change password states
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [passwordSuccess, setPasswordSuccess] = useState<string>('');
  
  // Password visibility toggles
  const [showOldPass, setShowOldPass] = useState<boolean>(false);
  const [showNewPass, setShowNewPass] = useState<boolean>(false);
  const [showConfirmPass, setShowConfirmPass] = useState<boolean>(false);
  const [showLoginPass, setShowLoginPass] = useState<boolean>(false);

  const fetchShops = async (keyToUse: string = adminKey) => {
    setLoading(true);
    const actualKey = keyToUse || sessionStorage.getItem('saas_admin_token') || '';
    
    try {
      // 1. Try to fetch from server API
      const res = await fetch(`${getApiBase()}/api/admin`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${actualKey}`
        }
      });

      const contentType = res.headers.get('Content-Type') || '';
      if (res.status === 404 || !contentType.includes('application/json')) {
        // Fallback to local simulation if API endpoint is missing or returns HTML fallback (Local Vite environment)
        throw new Error('FALLBACK_TO_LOCAL');
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch registry');
      }

      const data = await res.json();
      setShops(data.registry || []);
      setIsAuthenticated(true);
      setIsLocalSimulation(false);
      localStorage.setItem('saas_is_local_sim', 'false');
      sessionStorage.setItem('saas_admin_auth', 'true');
      sessionStorage.setItem('saas_admin_token', actualKey);
      setAuthError('');
    } catch (err: any) {
      const isFallback = 
        err.message === 'FALLBACK_TO_LOCAL' || 
        err.message.includes('Failed to fetch') || 
        err.message.includes('fetch failed') ||
        err instanceof SyntaxError;

      if (isFallback) {
        // --- LOCAL STORAGE SIMULATION MODE ---
        const savedKey = localStorage.getItem('saas_admin_key') || 'KSC-SaaS-Admin-2026';
        if (actualKey === savedKey) {
          setIsAuthenticated(true);
          setIsLocalSimulation(true);
          localStorage.setItem('saas_is_local_sim', 'true');
          sessionStorage.setItem('saas_admin_auth', 'true');
          sessionStorage.setItem('saas_admin_token', actualKey);
          setAuthError('');

          // Load local registry
          const localRegistryStr = localStorage.getItem('saas_shops_registry');
          if (localRegistryStr) {
            setShops(JSON.parse(localRegistryStr));
          } else {
            const defaultRegistry: ShopTenant[] = [
              {
                shopId: 'ksc-demo',
                shopName: 'Demo Electronics Shop (Simulated)',
                createdAt: Date.now() - 86400000 * 5,
                lastSynced: Date.now() - 3600000,
                productsCount: 25,
                salesCount: 48,
                status: 'active'
              }
            ];
            localStorage.setItem('saas_shops_registry', JSON.stringify(defaultRegistry));
            setShops(defaultRegistry);
          }
        } else {
          setAuthError(language === 'en' ? 'Incorrect Master Password / Key' : 'වැරදි පාලක කේතයකි');
          setIsAuthenticated(false);
        }
      } else {
        console.error(err);
        setAuthError(language === 'en' ? `Authentication Failed: ${err.message}` : `ලොග් වීම අසාර්ථකයි: ${err.message}`);
        setIsAuthenticated(false);
        sessionStorage.removeItem('saas_admin_auth');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchShops(sessionStorage.getItem('saas_admin_token') || '');
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey.trim()) {
      setAuthError(language === 'en' ? 'Admin key cannot be empty' : 'පාලක කේතය හිස් විය නොහැක');
      return;
    }
    fetchShops(adminKey.trim());
  };

  const handleLogout = () => {
    sessionStorage.removeItem('saas_admin_auth');
    sessionStorage.removeItem('saas_admin_token');
    setIsAuthenticated(false);
    setShops([]);
    setAdminKey('');
  };

  const handleToggleStatus = async (shopId: string, currentStatus: 'active' | 'deactivated') => {
    const nextStatus: 'active' | 'deactivated' = currentStatus === 'active' ? 'deactivated' : 'active';
    setLoading(true);
    try {
      if (isLocalSimulation) {
        // Update Local Simulation registry
        const updatedShops = shops.map(s => s.shopId === shopId ? { ...s, status: nextStatus } : s);
        setShops(updatedShops);
        localStorage.setItem('saas_shops_registry', JSON.stringify(updatedShops));
        
        // Save deactivation key directly in localStorage to block the current browser instance if needed
        localStorage.setItem(`status_${shopId}`, nextStatus);
        setConfirmToggle(null);
      } else {
        // Update Cloudflare KV registry
        const token = sessionStorage.getItem('saas_admin_token') || '';
        const res = await fetch(`${getApiBase()}/api/admin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            action: 'toggle_status',
            shopId,
            status: nextStatus
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Action failed');
        }

        // Update locally
        setShops(prev => prev.map(s => s.shopId === shopId ? { ...s, status: nextStatus } : s));
        setConfirmToggle(null);
      }
    } catch (err: any) {
      alert(language === 'en' ? `Failed to toggle status: ${err.message}` : `තත්ත්වය වෙනස් කිරීම අසාර්ථක විය: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName.trim()) return;
    setIsCreating(true);
    setCreateSuccessMsg('');
    setCreateErrorMsg('');

    try {
      const emailVal = newShopEmail.trim();
      const phoneVal = newShopPhone.trim();
      const passwordVal = newShopPassword.trim();
      const expiryVal = newShopExpiry ? new Date(newShopExpiry + 'T23:59:59').getTime() : 0;

      if (isLocalSimulation) {
        const shopId = 'ksc-' + Math.floor(1000 + Math.random() * 9000);
        const newShop: ShopTenant = {
          shopId,
          shopName: newShopName.trim(),
          createdAt: Date.now(),
          lastSynced: Date.now(),
          productsCount: 0,
          salesCount: 0,
          status: 'active',
          email: emailVal,
          phone: phoneVal,
          password: passwordVal,
          expiryDate: expiryVal
        };
        
        const updatedRegistry = [...shops, newShop];
        setShops(updatedRegistry);
        localStorage.setItem('saas_shops_registry', JSON.stringify(updatedRegistry));
        localStorage.setItem(`status_${shopId}`, 'active');
        if (passwordVal) {
          localStorage.setItem(`password_${shopId}`, passwordVal);
        }
        if (expiryVal) {
          localStorage.setItem(`expiry_${shopId}`, String(expiryVal));
        }

        setCreatedShopDetails({
          shopId,
          shopName: newShopName.trim(),
          email: emailVal,
          phone: phoneVal,
          password: passwordVal,
          expiryDate: expiryVal
        });

        setCreateSuccessMsg(language === 'en' 
          ? `Successfully created! Shop ID: ${shopId}` 
          : `සාර්ථකව සාදන ලදී! Shop ID: ${shopId}`
        );
        setNewShopName('');
        setNewShopEmail('');
        setNewShopPhone('');
        setNewShopPassword('');
      } else {
        const token = sessionStorage.getItem('saas_admin_token') || '';
        const res = await fetch(`${getApiBase()}/api/admin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            action: 'create_shop',
            shopName: newShopName.trim(),
            email: emailVal,
            phone: phoneVal,
            password: passwordVal,
            expiryDate: expiryVal
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Create shop failed');
        }

        const data = await res.json();
        setCreatedShopDetails({
          shopId: data.shopId,
          shopName: data.shopName,
          email: data.email || '',
          phone: data.phone || '',
          password: data.password || '',
          expiryDate: data.expiryDate
        });

        setCreateSuccessMsg(language === 'en' 
          ? `Successfully created! Shop ID: ${data.shopId}` 
          : `සාර්ථකව සාදන ලදී! Shop ID: ${data.shopId}`
        );
        setNewShopName('');
        setNewShopEmail('');
        setNewShopPhone('');
        setNewShopPassword('');
        fetchShops(); // Refresh the list
      }
    } catch (err: any) {
      setCreateErrorMsg(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShop) return;
    setLoading(true);
    setEditError('');

    try {
      const expiryVal = editShopExpiry ? new Date(editShopExpiry + 'T23:59:59').getTime() : 0;

      if (isLocalSimulation) {
        // Update registry in local simulation
        const updated = shops.map((s) => {
          if (s.shopId === editingShop.shopId) {
            return {
              ...s,
              shopName: editShopName.trim(),
              email: editShopEmail.trim(),
              phone: editShopPhone.trim(),
              password: editShopPassword.trim(),
              expiryDate: expiryVal
            };
          }
          return s;
        });
        setShops(updated);
        localStorage.setItem('saas_shops_registry', JSON.stringify(updated));
        
        // Update password in local storage
        if (editShopPassword.trim()) {
          localStorage.setItem(`password_${editingShop.shopId}`, editShopPassword.trim());
        } else {
          localStorage.removeItem(`password_${editingShop.shopId}`);
        }

        // Update expiry in local storage
        if (expiryVal) {
          localStorage.setItem(`expiry_${editingShop.shopId}`, String(expiryVal));
        } else {
          localStorage.removeItem(`expiry_${editingShop.shopId}`);
        }

        setEditingShop(null);
      } else {
        const token = sessionStorage.getItem('saas_admin_token') || '';
        const res = await fetch(`${getApiBase()}/api/admin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            action: 'edit_shop',
            shopId: editingShop.shopId,
            shopName: editShopName.trim(),
            email: editShopEmail.trim(),
            phone: editShopPhone.trim(),
            password: editShopPassword.trim(),
            expiryDate: expiryVal
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to update shop details');
        }

        setEditingShop(null);
        fetchShops();
      }
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShop = async () => {
    if (!deletingShop) return;
    setLoading(true);

    try {
      if (isLocalSimulation) {
        // Delete in local simulation
        const updated = shops.filter((s) => s.shopId !== deletingShop.shopId);
        setShops(updated);
        localStorage.setItem('saas_shops_registry', JSON.stringify(updated));
        
        // Remove associated local storage values
        localStorage.removeItem(`status_${deletingShop.shopId}`);
        localStorage.removeItem(`password_${deletingShop.shopId}`);
        localStorage.removeItem(`shop_${deletingShop.shopId}`);

        setDeletingShop(null);
      } else {
        const token = sessionStorage.getItem('saas_admin_token') || '';
        const res = await fetch(`${getApiBase()}/api/admin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            action: 'delete_shop',
            shopId: deletingShop.shopId
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to delete shop');
        }

        setDeletingShop(null);
        fetchShops();
      }
    } catch (err: any) {
      alert(language === 'en' ? `Failed to delete shop: ${err.message}` : `වෙළඳසැල ඉවත් කිරීම අසාර්ථක විය: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    const token = sessionStorage.getItem('saas_admin_token') || '';
    const localSavedKey = localStorage.getItem('saas_admin_key') || 'KSC-SaaS-Admin-2026';
    const expectedCurrentKey = isLocalSimulation ? localSavedKey : token;

    if (currentPassword.trim() !== expectedCurrentKey) {
      setPasswordError(language === 'en' ? 'Incorrect current master key' : 'වත්මන් පාලක කේතය වැරදියි');
      return;
    }

    if (newPassword.length < 4) {
      setPasswordError(language === 'en' ? 'Password must be at least 4 characters long' : 'නව කේතය අවම වශයෙන් අකුරු/ඉලක්කම් 4ක් විය යුතුය');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError(language === 'en' ? 'Passwords do not match' : 'मुරපදයන් එකිනෙකට නොගැලපේ');
      return;
    }

    setLoading(true);
    try {
      if (isLocalSimulation) {
        // Save locally
        localStorage.setItem('saas_admin_key', newPassword.trim());
        sessionStorage.setItem('saas_admin_token', newPassword.trim());
        setAdminKey(newPassword.trim());
        setPasswordSuccess(language === 'en' ? 'Master key changed successfully!' : 'පාලක කේතය සාර්ථකව වෙනස් කරන ලදී!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => setShowPasswordModal(false), 1500);
      } else {
        // Save to Cloud KV
        const res = await fetch(`${getApiBase()}/api/admin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            action: 'change_admin_key',
            newKey: newPassword.trim()
          })
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Request failed');
        }

        sessionStorage.setItem('saas_admin_token', newPassword.trim());
        setAdminKey(newPassword.trim());
        setPasswordSuccess(language === 'en' ? 'Master key changed successfully!' : 'පාලක කේතය සාර්ථකව වෙනස් කරන ලදී!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => setShowPasswordModal(false), 1500);
      }
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotMasterKey = async () => {
    const code = prompt(
      language === 'en'
        ? 'Enter the Master Recovery Code to reset the Super Admin password to default:'
        : 'Super Admin මුරපදය මුලින් තිබූ තත්වයට (default) පත් කිරීමට Master Recovery Code එක ඇතුළත් කරන්න:'
    );
    if (!code) return;

    setLoading(true);
    try {
      if (isLocalSimulation) {
        if (code === '880882015V') {
          localStorage.setItem('saas_admin_key', 'KSC-SaaS-Admin-2026');
          setAdminKey('KSC-SaaS-Admin-2026');
          alert(
            language === 'en'
              ? '✅ Super Admin password reset successfully to default: KSC-SaaS-Admin-2026'
              : '✅ Super Admin මුරපදය සාර්ථකව KSC-SaaS-Admin-2026 ලෙස reset කරන ලදී!'
          );
        } else {
          alert(language === 'en' ? '❌ Invalid Recovery Code!' : '❌ වැරදි Recovery Code එකක්!');
        }
      } else {
        const res = await fetch(`${getApiBase()}/api/admin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'reset_admin_key',
            recoveryCode: code
          })
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to reset key');
        }

        setAdminKey('KSC-SaaS-Admin-2026');
        alert(
          language === 'en'
            ? '✅ Super Admin password reset successfully to default: KSC-SaaS-Admin-2026'
            : '✅ Super Admin මුරපදය සාර්ථකව KSC-SaaS-Admin-2026 ලෙස reset කරන ලදී!'
        );
      }
    } catch (err: any) {
      alert(language === 'en' ? `Error: ${err.message}` : `දෝෂයක්: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredShops = shops.filter(shop => {
    const matchesSearch = shop.shopName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          shop.shopId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || shop.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const activeCount = shops.filter(s => s.status === 'active').length;
  const deactivatedCount = shops.filter(s => s.status === 'deactivated').length;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 font-sans">
        <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600"></div>
          
          <div className="flex flex-col items-center mb-8">
            <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-500 mb-4 animate-pulse">
              <Shield size={36} />
            </div>
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">KSC SaaS Core</h1>
            <p className="text-slate-400 text-sm mt-1 text-center font-medium">
              {language === 'en' ? 'Super Admin Gateway Services' : 'ප්‍රධාන පාලක පද්ධති ද්වාරය'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {language === 'en' ? 'Super Admin Master Key' : 'ප්‍රධාන පාලක මුරපදය'}
                </label>
                <button
                  type="button"
                  onClick={handleForgotMasterKey}
                  className="text-[10px] font-bold text-slate-500 hover:text-blue-400 transition underline underline-offset-2"
                >
                  {language === 'en' ? 'Forgot Master Key?' : 'මුරපදය අමතකද?'}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showLoginPass ? 'text' : 'password'}
                  placeholder="••••••••••••••••"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3.5 pl-11 pr-10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium transition-all"
                />
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowLoginPass(!showLoginPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-355 transition"
                >
                  {showLoginPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {authError && (
                <div className="mt-3 text-rose-400 text-xs font-semibold flex items-center gap-1.5 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{authError}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <span>{language === 'en' ? 'Verify & Authenticate' : 'තහවුරු කර ඇතුල් වන්න'}</span>
              )}
            </button>
          </form>

          <button
            onClick={() => setViewMode('storefront')}
            className="w-full mt-6 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-300 font-bold py-3 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            <ArrowLeft size={14} />
            <span>{language === 'en' ? 'Back to Storefront' : 'වෙළඳසැලට ආපසු යන්න'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-12">
      {/* Top Navbar */}
      <header className="bg-slate-900/60 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-md shadow-blue-500/20">
              <Shield size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-100 tracking-tight leading-tight">KSC SaaS Panel</h1>
                {isLocalSimulation && (
                  <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 font-extrabold text-[9px] uppercase px-1.5 py-0.5 rounded">
                    Simulated Fallback Mode
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Super Administrator</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setIsRefreshing(true);
                fetchShops();
              }}
              disabled={isRefreshing || loading}
              className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-xl transition-all cursor-pointer"
              title="Refresh Registry"
            >
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Settings size={14} />
              <span>{language === 'en' ? 'Change Master Key' : 'කේතය වෙනස් කරන්න'}</span>
            </button>
            <button
              onClick={handleLogout}
              className="bg-rose-600/10 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-500 text-rose-400 hover:text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer"
            >
              {language === 'en' ? 'Log Out' : 'පද්ධතියෙන් ඉවත් වන්න'}
            </button>
            <button
              onClick={() => setViewMode('storefront')}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Layout size={14} />
              <span>{language === 'en' ? 'Storefront' : 'වෙළඳසැල'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        {/* Local Simulation Info Banner */}
        {isLocalSimulation && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <div className="text-xs text-slate-300 leading-relaxed font-medium">
              <strong>Local Development Mode Active:</strong> Cloudflare Workers KV API was not detected. The Super Admin interface has automatically fallbacked to your local browser storage (localStorage) so you can test SaaS operations (shop creation, login key changes, active/deactive status) directly on localhost. Deactivating a shop locally will block syncing on this browser.
            </div>
          </div>
        )}

        {/* Metric Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Shops</span>
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Users size={16} /></div>
            </div>
            <h3 className="text-3xl font-black text-slate-100 mt-4">{shops.length}</h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">Onboarded business clients</p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Shops</span>
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><Check size={16} /></div>
            </div>
            <h3 className="text-3xl font-black text-emerald-400 mt-4">{activeCount}</h3>
            <p className="text-[10px] text-emerald-500/70 font-semibold mt-1">Normal service running</p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Suspended Shops</span>
              <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg"><X size={16} /></div>
            </div>
            <h3 className="text-3xl font-black text-rose-400 mt-4">{deactivatedCount}</h3>
            <p className="text-[10px] text-rose-500/70 font-semibold mt-1">Access suspended / overdue</p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Platform Total Stats</span>
              <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg"><Database size={16} /></div>
            </div>
            <h3 className="text-3xl font-black text-slate-100 mt-4">
              {shops.reduce((acc, s) => acc + s.productsCount, 0)} <span className="text-xs text-slate-500 font-bold">Items</span>
            </h3>
            <p className="text-[10px] text-indigo-400 font-bold mt-1">
              Total {shops.reduce((acc, s) => acc + s.salesCount, 0)} Bills Synced
            </p>
          </div>
        </section>

        {/* Dynamic Panel Row */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main List Column */}
          <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-extrabold text-slate-100">
                {language === 'en' ? 'Manage Business Tenants' : 'කඩවල් සහ පාරිභෝගික ගිණුම් පාලනය'}
              </h2>
              
              {/* Search & Filter Toolbar */}
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <input
                    type="text"
                    placeholder={language === 'en' ? 'Search Shop ID/Name...' : 'සොයන්න...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-8 pr-3 py-2 w-48 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-2 py-2 focus:outline-none cursor-pointer font-bold"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="deactivated">Suspended</option>
                </select>
              </div>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                    <th className="pb-3 pl-2">Shop Detail</th>
                    <th className="pb-3 text-center">Items count</th>
                    <th className="pb-3 text-center">Total Sales</th>
                    <th className="pb-3">Last Active</th>
                    <th className="pb-3">Expiry Date</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredShops.length > 0 ? (
                    filteredShops.map((shop) => (
                      <tr key={shop.shopId} className="hover:bg-slate-900/20 transition-all text-xs">
                        {/* Name and ID */}
                        <td className="py-4 pl-2 font-medium">
                          <div className="text-slate-200 font-bold text-sm">{shop.shopName}</div>
                          <div className="text-[10px] text-slate-500 font-mono tracking-wider mt-0.5 select-all">
                            ID: <span className="bg-slate-950 border border-slate-800/40 px-1 rounded text-cyan-400 font-bold">{shop.shopId}</span>
                          </div>
                        </td>
                        
                        {/* Products Count */}
                        <td className="py-4 text-center font-bold text-slate-300">
                          {shop.productsCount}
                        </td>

                        {/* Sales Count */}
                        <td className="py-4 text-center font-bold text-indigo-400">
                          {shop.salesCount}
                        </td>

                        {/* Last Synced */}
                        <td className="py-4 text-slate-400 font-medium">
                          {shop.lastSynced > 0 ? (
                            <span>{new Date(shop.lastSynced).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
                          ) : (
                            <span className="text-slate-600">Never</span>
                          )}
                        </td>

                        {/* Expiry Date */}
                        <td className="py-4 font-medium">
                          {shop.expiryDate ? (
                            <span className={Date.now() > shop.expiryDate ? "text-rose-400 font-bold" : "text-slate-300 font-semibold"}>
                              {new Date(shop.expiryDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                              {Date.now() > shop.expiryDate && <span className="block text-[9px] text-rose-500 uppercase font-bold tracking-wider mt-0.5">Expired</span>}
                            </span>
                          ) : (
                            <span className="text-slate-600">Lifetime</span>
                          )}
                        </td>

                        {/* Subscription Status */}
                        <td className="py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            shop.status === 'active' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {shop.status === 'active' ? 'Active' : 'Suspended'}
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="py-4 text-right pr-2">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setCreatedShopDetails({
                                shopId: shop.shopId,
                                shopName: shop.shopName,
                                email: shop.email || '',
                                phone: shop.phone || '',
                                password: shop.password || '',
                                expiryDate: shop.expiryDate
                              })}
                              className="p-1.5 rounded-lg border bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
                              title={language === 'en' ? 'View Details / Share' : 'විස්තර බලන්න'}
                            >
                              <Eye size={14} />
                            </button>

                            <button
                              onClick={() => {
                                setEditingShop(shop);
                                setEditShopName(shop.shopName);
                                setEditShopEmail(shop.email || '');
                                setEditShopPhone(shop.phone || '');
                                setEditShopPassword(shop.password || '');
                                setEditShopExpiry(shop.expiryDate ? new Date(shop.expiryDate).toISOString().split('T')[0] : '');
                                setEditError('');
                              }}
                              className="p-1.5 rounded-lg border bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
                              title={language === 'en' ? 'Edit details' : 'වෙනස් කරන්න'}
                            >
                              <Edit2 size={14} />
                            </button>

                            <button
                              onClick={() => setConfirmToggle({ shopId: shop.shopId, status: shop.status, name: shop.shopName })}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                shop.status === 'active'
                                  ? 'bg-amber-600/10 border-amber-500/20 text-amber-400 hover:bg-amber-600 hover:text-white'
                                  : 'bg-emerald-600/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-600 hover:text-white'
                              }`}
                              title={shop.status === 'active' ? (language === 'en' ? 'Suspend Subscription' : 'Suspend කරන්න') : (language === 'en' ? 'Activate Subscription' : 'Activate කරන්න')}
                            >
                              {shop.status === 'active' ? <ToggleLeft size={15} /> : <ToggleRight size={15} />}
                            </button>

                            <button
                              onClick={() => setDeletingShop(shop)}
                              className="p-1.5 rounded-lg border bg-rose-600/10 border-rose-500/20 text-rose-400 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                              title={language === 'en' ? 'Delete client' : 'ඉවත් කරන්න'}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">
                        No business tenants found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Shop Side Column */}
          <div className="space-y-6">
            
            {/* Create Shop Panel */}
            <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-md font-bold text-slate-100 flex items-center gap-2 mb-4">
                <Plus size={18} className="text-blue-500" />
                <span>{language === 'en' ? 'Register New Shop Client' : 'අලුත් Shop එකක් සෑදීම'}</span>
              </h3>

              <form onSubmit={handleCreateShop} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 font-bold mb-1.5">Shop Name (Sinhala or English)</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., KSC Mobile Centre"
                    value={newShopName}
                    onChange={(e) => setNewShopName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 font-bold mb-1.5">Owner Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="owner@example.com"
                    value={newShopEmail}
                    onChange={(e) => setNewShopEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 font-bold mb-1.5">Owner Phone / WhatsApp (Optional)</label>
                  <input
                    type="text"
                    placeholder="E.g., 94771234567"
                    value={newShopPhone}
                    onChange={(e) => setNewShopPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 font-bold mb-1.5">Shop Access Password / Key (Optional)</label>
                  <input
                    type="password"
                    placeholder="E.g., shopSecret123"
                    value={newShopPassword}
                    onChange={(e) => setNewShopPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 font-bold mb-1.5">Subscription Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={newShopExpiry}
                    onChange={(e) => setNewShopExpiry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {createSuccessMsg && (
                  <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold p-3.5 rounded-xl">
                    {createSuccessMsg}
                  </div>
                )}
                {createErrorMsg && (
                  <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold p-3.5 rounded-xl">
                    Error: {createErrorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isCreating || !newShopName.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 text-xs"
                >
                  {isCreating ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <>
                      <Plus size={14} />
                      <span>{language === 'en' ? 'Generate Shop Credentials' : 'Shop එක සාදන්න'}</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Quick documentation card */}
            <div className="bg-slate-900/20 border border-slate-800/60 rounded-2xl p-6 text-xs text-slate-400 leading-relaxed space-y-3">
              <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">SaaS Tenant Instructions</h4>
              <p>1. <strong>Create</strong> a new shop entry to generate a secure <code>shopId</code> (e.g. <code>ksc-4892</code>).</p>
              <p>2. Give the client this <strong>Shop ID</strong>. They must enter it in their POS <em>System Settings &gt; Database &amp; Security &gt; Connect Sync</em> tab.</p>
              <p>3. If they delay subscription payment, click <strong>Suspend</strong>. Their client POS and storefront will instantly lock up and block updates.</p>
            </div>

          </div>
        </section>
      </main>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-blue-500">
              <Settings size={22} />
              <h4 className="text-md font-bold text-slate-100">
                {language === 'en' ? 'Change Master Key / Password' : 'පාලක කේතය (Password) වෙනස් කරන්න'}
              </h4>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">
                  {language === 'en' ? 'Current Password' : 'වත්මන් පාලක කේතය (Current Password)'}
                </label>
                <div className="relative">
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-10 py-2.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 transition"
                  >
                    {showOldPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">
                  {language === 'en' ? 'New Password' : 'නව පාලක කේතය (New Password)'}
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-10 py-2.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 transition"
                  >
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">
                  {language === 'en' ? 'Confirm New Password' : 'නව පාලක කේතය නැවත ඇතුලත් කරන්න (Confirm)'}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-10 py-2.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 transition"
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {passwordError && (
                <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold p-3.5 rounded-xl">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold p-3.5 rounded-xl">
                  {passwordSuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 font-bold text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setPasswordError('');
                    setPasswordSuccess('');
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                >
                  {language === 'en' ? 'Cancel' : 'අවලංගු කරන්න'}
                </button>
                <button
                  type="submit"
                  disabled={loading || !currentPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()}
                  className="bg-blue-600 hover:bg-blue-500 text-white py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                >
                  {loading ? <RefreshCw size={14} className="animate-spin" /> : (language === 'en' ? 'Save Key' : 'සුරකින්න')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Onboarding Details Success Modal */}
      {createdShopDetails && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            
            <div className="flex items-center gap-3 text-emerald-400">
              <Check className="p-1 bg-emerald-500/10 rounded-lg" size={24} />
              <h4 className="text-md font-bold text-slate-100">
                {language === 'en' ? 'Shop Client Credentials Generated' : 'නව වෙළඳසැල් ගිණුම් විස්තර සාර්ථකයි!'}
              </h4>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-3 text-xs leading-relaxed">
                <div className="flex justify-between border-b border-slate-900 pb-2">
                  <span className="text-slate-500 font-bold">Shop ID</span>
                  <span className="text-cyan-400 font-mono font-bold select-all bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{createdShopDetails.shopId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-2">
                  <span className="text-slate-500 font-bold">Shop Name</span>
                  <span className="text-slate-200 font-bold">{createdShopDetails.shopName}</span>
                </div>
                {createdShopDetails.email && (
                  <div className="flex justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-500 font-bold">Owner Email</span>
                    <span className="text-slate-300 font-medium select-all">{createdShopDetails.email}</span>
                  </div>
                )}
                {createdShopDetails.phone && (
                  <div className="flex justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-500 font-bold">Owner Phone</span>
                    <span className="text-slate-300 font-medium select-all">{createdShopDetails.phone}</span>
                  </div>
                )}
                {createdShopDetails.password && (
                  <div className="flex justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-500 font-bold">Sync Password</span>
                    <span className="text-slate-200 font-mono font-bold select-all bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{createdShopDetails.password}</span>
                  </div>
                )}
                <div className="flex justify-between pb-1">
                  <span className="text-slate-500 font-bold">Expiry Date</span>
                  <span className="text-slate-300 font-bold">
                    {createdShopDetails.expiryDate ? new Date(createdShopDetails.expiryDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Lifetime'}
                  </span>
                </div>
              </div>

              {/* Dynamic Setup Link */}
              <div className="space-y-2">
                <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">One-Click Setup Link</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/?setup=${createdShopDetails.shopId}`}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[10px] text-slate-450 font-mono focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}/?setup=${createdShopDetails.shopId}`;
                      navigator.clipboard.writeText(link);
                      alert(language === 'en' ? 'Link copied to clipboard!' : 'ලින්ක් එක කොපි කරගන්නා ලදී!');
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-2 px-3.5 rounded-xl transition-all cursor-pointer shrink-0"
                  >
                    {language === 'en' ? 'Copy' : 'කොපි'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 font-bold text-xs">
              {createdShopDetails.phone ? (
                <button
                  onClick={() => {
                    const link = `${window.location.origin}/?setup=${createdShopDetails.shopId}`;
                    const message = language === 'en'
                      ? `Hi ${createdShopDetails.shopName} owner,\n\nWelcome to our POS Platform! Here is your setup link to configure your POS system automatically:\n\nSetup Link: ${link}\n\nShop Credentials:\n- Shop ID: ${createdShopDetails.shopId}\n- Sync Password: ${createdShopDetails.password || '(None)'}\n\nLet us know if you need assistance!`
                      : `ආයුබෝවන් ${createdShopDetails.shopName} හිමිකරුණි,\n\nඅපගේ POS පද්ධතියට ඔබව සාදරයෙන් පිළිගනිමු! ඔබගේ POS පද්ධතිය ස්වයංක්‍රීයව සක්‍රීය කර ගැනීමට පහත ලින්ක් එක ක්ලික් කරන්න:\n\nSetup Link: ${link}\n\nගිණුම් විස්තර:\n- Shop ID: ${createdShopDetails.shopId}\n- Password: ${createdShopDetails.password || '(නැත)'}\n\nස්තූතියි!`;
                    
                    window.open(`https://wa.me/${createdShopDetails.phone}?text=${encodeURIComponent(message)}`, '_blank');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>{language === 'en' ? 'Share via WhatsApp' : 'WhatsApp හරහා යවන්න'}</span>
                </button>
              ) : (
                <div className="text-[10px] text-slate-500 italic">Add phone number to enable direct WhatsApp sharing.</div>
              )}

              <button
                onClick={() => setCreatedShopDetails(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 px-4 rounded-xl transition-all cursor-pointer ml-auto"
              >
                {language === 'en' ? 'Close' : 'වහන්න'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Shop Tenant Modal */}
      {editingShop && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-blue-500">
              <Edit2 size={20} />
              <h4 className="text-md font-bold text-slate-100">
                {language === 'en' ? 'Edit Shop Client Details' : 'වෙළඳසැල් ගිණුම් විස්තර වෙනස් කරන්න'}
              </h4>
            </div>

            <form onSubmit={handleEditShop} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Shop Name</label>
                <input
                  type="text"
                  required
                  value={editShopName}
                  onChange={(e) => setEditShopName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Owner Email</label>
                <input
                  type="email"
                  value={editShopEmail}
                  onChange={(e) => setEditShopEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Owner Phone / WhatsApp</label>
                <input
                  type="text"
                  value={editShopPhone}
                  onChange={(e) => setEditShopPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Sync Access Password</label>
                <input
                  type="password"
                  placeholder="Keep original or type new password"
                  value={editShopPassword}
                  onChange={(e) => setEditShopPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Subscription Expiry Date</label>
                <input
                  type="date"
                  required
                  value={editShopExpiry}
                  onChange={(e) => setEditShopExpiry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {editError && (
                <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold p-3 rounded-xl">
                  {editError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 font-bold text-xs">
                <button
                  type="button"
                  onClick={() => setEditingShop(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                >
                  {language === 'en' ? 'Cancel' : 'අවලංගු කරන්න'}
                </button>
                <button
                  type="submit"
                  disabled={loading || !editShopName.trim()}
                  className="bg-blue-600 hover:bg-blue-500 text-white py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-blue-500/10"
                >
                  {loading ? <RefreshCw size={14} className="animate-spin" /> : (language === 'en' ? 'Save Changes' : 'සුරකින්න')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Shop Tenant Modal */}
      {deletingShop && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-rose-500">
              <AlertTriangle size={24} />
              <h4 className="text-md font-bold text-slate-100">
                {language === 'en' ? 'Delete Business Tenant' : 'වෙළඳසැල් ගිණුම ඉවත් කිරීම'}
              </h4>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed font-medium">
              {language === 'en' ? (
                <span>
                  Are you sure you want to permanently delete <strong>{deletingShop.shopName}</strong> ({deletingShop.shopId})?<br/><br/>
                  <span className="text-rose-400 font-bold">⚠️ Warning:</span> This will completely erase all their cloud sync backups, credentials, and settings. This action is <strong>irreversible</strong>.
                </span>
              ) : (
                <span>
                  ඔබ සැබවින්ම <strong>{deletingShop.shopName}</strong> ({deletingShop.shopId}) ගිණුම මකා දැමීමට කැමතිද?<br/><br/>
                  <span className="text-rose-400 font-bold">⚠️ අවධානයට:</span> මෙමගින් ඔවුන්ගේ සියලුම cloud sync දත්ත, backup, සහ password සදහටම මැකී යනු ඇත. මෙය නැවත සැකසිය නොහැක!
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 font-bold text-xs">
              <button
                onClick={() => setDeletingShop(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 px-4 rounded-xl transition-all cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : 'අවලංගු කරන්න'}
              </button>
              <button
                onClick={handleDeleteShop}
                disabled={loading}
                className="bg-rose-600 hover:bg-rose-500 text-white py-2.5 px-4 rounded-xl transition-all cursor-pointer shadow-md shadow-rose-600/10 flex items-center justify-center gap-1"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : (language === 'en' ? 'Permanently Delete' : 'සදහටම මකන්න')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Toggle Modal */}
      {confirmToggle && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-yellow-500">
              <AlertTriangle size={24} />
              <h4 className="text-md font-bold text-slate-100">
                {language === 'en' ? 'Confirm Status Toggle' : 'තහවුරු කිරීම'}
              </h4>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed font-medium">
              {confirmToggle.status === 'active' ? (
                <span>
                  Are you sure you want to <strong>suspend</strong> the subscription of <strong>{confirmToggle.name}</strong> ({confirmToggle.shopId})?<br/><br/>
                  This will immediately lock the client's POS and take their Online Storefront offline.
                </span>
              ) : (
                <span>
                  Are you sure you want to <strong>activate</strong> the subscription of <strong>{confirmToggle.name}</strong> ({confirmToggle.shopId})?<br/><br/>
                  This will restore complete access to their POS systems and Online Storefront immediately.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 font-bold text-xs">
              <button
                onClick={() => setConfirmToggle(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 px-4 rounded-xl transition-all cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : 'අවලංගු කරන්න'}
              </button>
              <button
                onClick={() => handleToggleStatus(confirmToggle.shopId, confirmToggle.status)}
                className={`py-2.5 px-4 rounded-xl transition-all cursor-pointer text-white ${
                  confirmToggle.status === 'active'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/10'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/10'
                }`}
              >
                {language === 'en' ? 'Confirm & Toggle' : 'වෙනස් කරන්න'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
