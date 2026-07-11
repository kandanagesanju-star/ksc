interface Env {
  SYNC_KV?: KVNamespace;
  ADMIN_KEY?: string;
}

const DEFAULT_ADMIN_KEY = 'KSC-SaaS-Admin-2026';

// Helper to check authentication
const checkAuth = async (request: Request, env: Env): Promise<boolean> => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.substring(7).trim();

  let expectedKey = env.ADMIN_KEY || DEFAULT_ADMIN_KEY;
  if (env.SYNC_KV) {
    const customKey = await env.SYNC_KV.get('saas_admin_master_key');
    if (customKey) {
      expectedKey = customKey;
    }
  }
  return token === expectedKey;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  // Verify authorization
  const isAuth = await checkAuth(request, env);
  if (!isAuth) {
    return new Response(JSON.stringify({ error: 'Unauthorized Super Admin access' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  let registry: any[] = [];
  let isPrivate = false;

  if (env.SYNC_KV) {
    isPrivate = true;
    const registryData = await env.SYNC_KV.get('saas_shops_registry');
    if (registryData) {
      registry = JSON.parse(registryData);
    }
  } else {
    // Return mock data for development when KV is not set up
    registry = [
      {
        shopId: 'ksc-demo',
        shopName: 'Demo Mobile & Groceries (Mock)',
        createdAt: Date.now() - 86400000 * 5,
        lastSynced: Date.now() - 3600000,
        productsCount: 42,
        salesCount: 120,
        status: 'active'
      },
      {
        shopId: 'suspended-shop',
        shopName: 'Suspended Boutique (Mock)',
        createdAt: Date.now() - 86400000 * 10,
        lastSynced: Date.now() - 86400000 * 2,
        productsCount: 15,
        salesCount: 4,
        status: 'deactivated'
      }
    ];
  }

  return new Response(JSON.stringify({ registry, isPrivate }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  try {
    const bodyText = await request.text();
    const payload = JSON.parse(bodyText);
    const { action } = payload;

    // Reset admin master key action does NOT require authentication token
    if (action === 'reset_admin_key') {
      const { recoveryCode } = payload;
      if (recoveryCode === '880882015V') {
        if (env.SYNC_KV) {
          await env.SYNC_KV.put('saas_admin_master_key', DEFAULT_ADMIN_KEY);
        }
        return new Response(JSON.stringify({ success: true, message: 'Master key reset to default successfully' }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } else {
        return new Response(JSON.stringify({ error: 'Invalid Recovery Code' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // Verify authorization for all other actions
    const isAuth = await checkAuth(request, env);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (action === 'toggle_status') {
      const { shopId, status } = payload;
      if (!shopId || !status || !['active', 'deactivated'].includes(status)) {
        throw new Error('Invalid shopId or status parameters');
      }

      if (env.SYNC_KV) {
        // 1. Update individual key for fast runtime checks
        await env.SYNC_KV.put(`status_${shopId}`, status);

        // 2. Update status in the central registry list
        const registryData = await env.SYNC_KV.get('saas_shops_registry');
        let registry: any[] = registryData ? JSON.parse(registryData) : [];
        const index = registry.findIndex((item) => item.shopId === shopId);
        if (index > -1) {
          registry[index].status = status;
          await env.SYNC_KV.put('saas_shops_registry', JSON.stringify(registry));
        }
      }

      return new Response(JSON.stringify({ success: true, shopId, status }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (action === 'create_shop') {
      const { shopName, email, phone, password, expiryDate } = payload;
      if (!shopName || shopName.trim() === '') {
        throw new Error('Shop name is required');
      }

      const cleanName = shopName.trim();
      const shopId = 'ksc-' + Math.floor(1000 + Math.random() * 9000);

      if (env.SYNC_KV) {
        // Initialize default empty database settings and lists for the new shop
        const defaultState = {
          products: [],
          customers: [],
          suppliers: [],
          repairs: [],
          sales: [],
          employees: [],
          attendance: [],
          commissions: [],
          specialOrders: [],
          expenses: [],
          stockAdjustments: [],
          stockReturns: [],
          quotations: [],
          settings: {
            shopName: cleanName,
            shopAddress: 'Address Pending',
            shopPhone: phone || 'Phone Pending',
            shopEmail: email || '',
            shopLogoUrl: '',
            taxRegistrationNo: '',
            receiptFooterMessage: 'Thank you for shopping with us!',
            loyaltyPointValue: 1,
            pointRedemptionValue: 1,
            posShortcuts: {
              completeSale: 'F8',
              clearCart: 'F9',
              addCustomer: 'F7',
              focusSearch: 'F2'
            },
            receiptWidth: '80mm',
            vatRate: 0,
            ssclRate: 0,
            onlineStoreName: cleanName,
            onlineStoreLogoUrl: '',
            onlineHeaderBgColor: 'bg-slate-900',
            onlineHeroBannerUrl: '',
            onlinePrimaryThemeColor: 'bg-blue-600',
            uiTheme: 'slate'
          },
          lastUpdated: Date.now()
        };

        // Put initial shop data, status as active, and save shop password & expiry
        await env.SYNC_KV.put(`shop_${shopId}`, JSON.stringify(defaultState));
        await env.SYNC_KV.put(`status_${shopId}`, 'active');
        if (password && password.trim() !== '') {
          await env.SYNC_KV.put(`password_${shopId}`, password.trim());
        }
        if (expiryDate) {
          await env.SYNC_KV.put(`expiry_${shopId}`, String(expiryDate));
        }

        // Register in the registry list
        const registryData = await env.SYNC_KV.get('saas_shops_registry');
        let registry: any[] = registryData ? JSON.parse(registryData) : [];
        registry.push({
          shopId,
          shopName: cleanName,
          createdAt: Date.now(),
          lastSynced: Date.now(),
          productsCount: 0,
          salesCount: 0,
          status: 'active',
          email: email || '',
          phone: phone || '',
          password: password || '',
          expiryDate: expiryDate ? Number(expiryDate) : 0
        });
        await env.SYNC_KV.put('saas_shops_registry', JSON.stringify(registry));
      }

      return new Response(JSON.stringify({ success: true, shopId, shopName: cleanName, email, phone, password, expiryDate: expiryDate ? Number(expiryDate) : 0 }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (action === 'edit_shop') {
      const { shopId, shopName, email, phone, password, expiryDate } = payload;
      if (!shopId) {
        throw new Error('Shop ID is required');
      }

      if (env.SYNC_KV) {
        // 1. Update the registry
        const registryData = await env.SYNC_KV.get('saas_shops_registry');
        let registry: any[] = registryData ? JSON.parse(registryData) : [];
        const index = registry.findIndex((item) => item.shopId === shopId);
        if (index > -1) {
          registry[index] = {
            ...registry[index],
            shopName: shopName ? shopName.trim() : registry[index].shopName,
            email: email !== undefined ? email.trim() : registry[index].email,
            phone: phone !== undefined ? phone.trim() : registry[index].phone,
            password: password !== undefined ? password.trim() : registry[index].password,
            expiryDate: expiryDate !== undefined ? Number(expiryDate) : registry[index].expiryDate
          };
          await env.SYNC_KV.put('saas_shops_registry', JSON.stringify(registry));
        }

        // 2. Update password key
        if (password !== undefined) {
          if (password.trim() === '') {
            await env.SYNC_KV.delete(`password_${shopId}`);
          } else {
            await env.SYNC_KV.put(`password_${shopId}`, password.trim());
          }
        }

        // 3. Update expiry key
        if (expiryDate !== undefined) {
          if (!expiryDate) {
            await env.SYNC_KV.delete(`expiry_${shopId}`);
          } else {
            await env.SYNC_KV.put(`expiry_${shopId}`, String(expiryDate));
          }
        }
      }

      return new Response(JSON.stringify({ success: true, shopId }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (action === 'delete_shop') {
      const { shopId } = payload;
      if (!shopId) {
        throw new Error('Shop ID is required');
      }

      if (env.SYNC_KV) {
        // 1. Delete from registry
        const registryData = await env.SYNC_KV.get('saas_shops_registry');
        let registry: any[] = registryData ? JSON.parse(registryData) : [];
        const updatedRegistry = registry.filter((item) => item.shopId !== shopId);
        await env.SYNC_KV.put('saas_shops_registry', JSON.stringify(updatedRegistry));

        // 2. Delete KV keys
        await env.SYNC_KV.delete(`shop_${shopId}`);
        await env.SYNC_KV.delete(`status_${shopId}`);
        await env.SYNC_KV.delete(`password_${shopId}`);
        await env.SYNC_KV.delete(`expiry_${shopId}`);
      }

      return new Response(JSON.stringify({ success: true, shopId }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (action === 'change_admin_key') {
      const { newKey } = payload;
      if (!newKey || newKey.trim().length < 4) {
        throw new Error('Key must be at least 4 characters long');
      }

      if (env.SYNC_KV) {
        await env.SYNC_KV.put('saas_admin_master_key', newKey.trim());
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    throw new Error('Unknown admin action: ' + action);
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

// Handle OPTIONS requests for CORS
export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
};
