/**
 * Storage Utility for Shop-Specific Multi-Tenant Isolation
 * Prefixes all shop-specific keys with the currently active shop_sync_id to prevent data leakage.
 */

export const getActiveShopId = (): string => {
  return localStorage.getItem('shop_sync_id') || 'default';
};

export const getShopStorageKey = (key: string, shopId?: string): string => {
  const currentShopId = shopId || getActiveShopId();
  
  // Keys that are shared globally across the browser (or are self-prefixed)
  const globalKeys = [
    'saas_shops_registry',
    'saas_admin_key',
    'saas_is_local_sim',
    'shop_sync_id',
    'shop_sync_enabled',
    'shop_sync_force_pull',
    'shop_storefront_id',
    'shop_view_mode',
    'shop_lang'
  ];

  if (globalKeys.includes(key)) {
    return key;
  }

  // Super admin flags that are already parameterized by shop ID
  if (key.startsWith('status_') || key.startsWith('password_') || key.startsWith('expiry_')) {
    return key;
  }

  // Format the key to be shop-specific
  if (key.startsWith('shop_')) {
    return `shop_${currentShopId}_${key.slice(5)}`;
  }
  if (key.startsWith('store_')) {
    return `shop_${currentShopId}_${key.slice(6)}`;
  }
  return `shop_${currentShopId}_${key}`;
};

export const getShopItem = (key: string, shopId?: string): string | null => {
  const finalKey = getShopStorageKey(key, shopId);
  const val = localStorage.getItem(finalKey);
  if (val !== null) return val;
  
  // Fallback to legacy non-prefixed key to preserve existing user data if no shop_sync_id is set
  const currentShopId = shopId || getActiveShopId();
  if (currentShopId === 'default' || currentShopId === 'ksc-demo') {
    return localStorage.getItem(key);
  }
  return null;
};

export const setShopItem = (key: string, value: string, shopId?: string) => {
  const finalKey = getShopStorageKey(key, shopId);
  localStorage.setItem(finalKey, value);
};

export const removeShopItem = (key: string, shopId?: string) => {
  const finalKey = getShopStorageKey(key, shopId);
  localStorage.removeItem(finalKey);
};

// One-time migration of legacy data to prefixed keys for the current active shop ID
const migrateLegacyData = () => {
  try {
    const migrated = localStorage.getItem('shop_isolation_migrated_v1');
    if (migrated === 'true') return;

    const currentShopId = localStorage.getItem('shop_sync_id') || 'default';
    
    // We only migrate if the shop ID is not default (since default falls back anyway)
    if (currentShopId !== 'default') {
      const keysToMigrate = [
        'shop_products',
        'shop_sales',
        'shop_customers',
        'shop_suppliers',
        'shop_employees',
        'shop_settings',
        'shop_repairs',
        'shop_special_orders',
        'shop_quotations',
        'shop_expenses',
        'shop_shifts',
        'shop_purchase_orders',
        'shop_bank_transactions',
        'shop_bank_balance',
        'shop_stock_adjustments',
        'shop_audit_logs',
        'shop_cheques',
        'shop_admin_sub_tab',
        'shop_expanded_menus',
        'logged_in_customer',
        'shop_last_updated',
        'shop_last_sync_time',
        'shop_sync_private',
        'shop_sync_password',
        'shop_sync_chunks'
      ];

      keysToMigrate.forEach(key => {
        const val = localStorage.getItem(key);
        if (val !== null) {
          const finalKey = getShopStorageKey(key, currentShopId);
          // Only copy if the new key doesn't already have data to avoid overwriting newer data
          if (localStorage.getItem(finalKey) === null) {
            localStorage.setItem(finalKey, val);
          }
        }
      });
      console.log(`Successfully migrated legacy data to shop ${currentShopId}`);
    }

    localStorage.setItem('shop_isolation_migrated_v1', 'true');
  } catch (err) {
    console.error('Error migrating legacy data:', err);
  }
};

// Execute migration
migrateLegacyData();
