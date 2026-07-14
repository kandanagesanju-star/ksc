interface Env {
  SYNC_KV?: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const shopId = url.searchParams.get('shopId');
  const timestampOnly = url.searchParams.get('timestampOnly') === 'true';
  const setupMode = url.searchParams.get('setup') === 'true';

  if (setupMode && env.SYNC_KV) {
    const registryData = await env.SYNC_KV.get('saas_shops_registry');
    let registry: any[] = registryData ? JSON.parse(registryData) : [];
    const shop = registry.find((s: any) => s.shopId === shopId);
    if (shop) {
      return new Response(JSON.stringify({
        success: true,
        shopId,
        shopName: shop.shopName,
        password: shop.password || '8892',
        expiryDate: shop.expiryDate || 0
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }

  if (!shopId || shopId === 'undefined' || shopId === 'null') {
    return new Response(JSON.stringify({ found: false, error: 'Missing shopId', isPrivate: !!env.SYNC_KV }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  let data: string | null = null;
  let isPrivate = false;

  let daysRemaining = 9999;
  let expiryDateVal = 0;
  let isExpired = false;

  if (env.SYNC_KV) {
    isPrivate = true;
    
    // Check if subscription has expired
    const expiryStr = await env.SYNC_KV.get(`expiry_${shopId}`);
    if (expiryStr) {
      expiryDateVal = Number(expiryStr);
      const diff = expiryDateVal - Date.now();
      daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
      if (daysRemaining <= 0) {
        isExpired = true;
      }
    }

    // Check if the shop is deactivated or expired
    const status = await env.SYNC_KV.get(`status_${shopId}`) || 'active';
    if (status === 'deactivated' || isExpired) {
      return new Response(JSON.stringify({ 
        found: true, 
        suspended: true, 
        reason: isExpired ? 'Expired' : 'Suspended',
        isPrivate 
      }), {
        status: 200, // Return 200 so UI initialization fetches the status check gracefully
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Verify Password if set
    const password = request.headers.get('X-Shop-Password') || '';
    const expectedPassword = await env.SYNC_KV.get(`password_${shopId}`);
    if (expectedPassword && password !== expectedPassword) {
      // Return public storefront subset of the database instead of blocking GET completely
      data = await env.SYNC_KV.get(`shop_${shopId}`);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          return new Response(JSON.stringify({
            found: true,
            isPrivate,
            isPublicOnly: true,
            settings: {
              shopName: parsed.settings?.shopName || "Unnamed Shop",
              shopAddress: parsed.settings?.shopAddress || "",
              shopPhone: parsed.settings?.shopPhone || "",
              shopEmail: parsed.settings?.shopEmail || "",
              onlineStoreName: parsed.settings?.onlineStoreName || "",
              onlineStoreLogoUrl: parsed.settings?.onlineStoreLogoUrl || "",
              onlineHeaderBgColor: parsed.settings?.onlineHeaderBgColor || "",
              onlineHeroBannerUrl: parsed.settings?.onlineHeroBannerUrl || "",
              onlinePrimaryThemeColor: parsed.settings?.onlinePrimaryThemeColor || "",
              uiTheme: parsed.settings?.uiTheme || "slate",
              onlineAnnouncementMessage: parsed.settings?.onlineAnnouncementMessage || ""
            },
            products: (parsed.products || []).filter((p: any) => !p.isHiddenOnline).map((p: any) => ({
              id: p.id,
              nameEn: p.nameEn,
              nameSi: p.nameSi,
              retailPrice: p.retailPrice,
              stock: p.stock,
              category: p.category,
              image: p.image,
              descriptionEn: p.descriptionEn,
              descriptionSi: p.descriptionSi
            })),
            categories: parsed.categories || []
          }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        } catch (e) {}
      }
      return new Response(JSON.stringify({ error: 'Invalid Shop Password', authorized: false, isPrivate }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    data = await env.SYNC_KV.get(`shop_${shopId}`);
  } else {
    // Local simulation: block any shopId that starts with "suspended-"
    if (shopId.startsWith('suspended-')) {
      return new Response(JSON.stringify({ found: true, suspended: true, isPrivate: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    // Fetch from ExtendsClass JSON storage
    try {
      const res = await fetch(`https://extendsclass.com/api/json-storage/bin/${shopId}`);
      if (res.ok) {
        data = await res.text();
        
        // ExtendsClass local fallback password check:
        const parsed = JSON.parse(data);
        const expectedExtendsPassword = parsed.settings?.adminPin || '';
        if (expectedExtendsPassword && password !== expectedExtendsPassword) {
          return new Response(JSON.stringify({
            found: true,
            isPrivate: false,
            isPublicOnly: true,
            settings: {
              shopName: parsed.settings?.shopName || "Unnamed Shop",
              shopAddress: parsed.settings?.shopAddress || "",
              shopPhone: parsed.settings?.shopPhone || "",
              shopEmail: parsed.settings?.shopEmail || "",
              onlineStoreName: parsed.settings?.onlineStoreName || "",
              onlineStoreLogoUrl: parsed.settings?.onlineStoreLogoUrl || "",
              onlineHeaderBgColor: parsed.settings?.onlineHeaderBgColor || "",
              onlineHeroBannerUrl: parsed.settings?.onlineHeroBannerUrl || "",
              onlinePrimaryThemeColor: parsed.settings?.onlinePrimaryThemeColor || "",
              uiTheme: parsed.settings?.uiTheme || "slate",
              onlineAnnouncementMessage: parsed.settings?.onlineAnnouncementMessage || ""
            },
            products: (parsed.products || []).filter((p: any) => !p.isHiddenOnline).map((p: any) => ({
              id: p.id,
              nameEn: p.nameEn,
              nameSi: p.nameSi,
              retailPrice: p.retailPrice,
              stock: p.stock,
              category: p.category,
              image: p.image,
              descriptionEn: p.descriptionEn,
              descriptionSi: p.descriptionSi
            })),
            categories: parsed.categories || []
          }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
      }
    } catch (err) {
      console.error('ExtendsClass GET error:', err);
    }
  }

  if (!data) {
    return new Response(JSON.stringify({ found: false, isPrivate, daysRemaining, expiryDate: expiryDateVal }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const parsed = JSON.parse(data);
    if (timestampOnly) {
      const dataSize = parsed.dataSize !== undefined ? parsed.dataSize : data.length;
      const productsCount = parsed.productsCount !== undefined ? parsed.productsCount : (parsed.products?.length || 0);
      const salesCount = parsed.salesCount !== undefined ? parsed.salesCount : (parsed.sales?.length || 0);
      return new Response(JSON.stringify({
        found: true,
        lastUpdated: parsed.lastUpdated || 0,
        isPrivate,
        dataSize,
        productsCount,
        salesCount,
        daysRemaining,
        expiryDate: expiryDateVal
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    if (typeof parsed === 'object' && parsed !== null) {
      parsed.isPrivate = isPrivate;
      parsed.found = true;
      parsed.daysRemaining = daysRemaining;
      parsed.expiryDate = expiryDateVal;

      // Force sync settings.adminPin with KV password key (Super Admin password registry)
      if (env.SYNC_KV) {
        const expectedPassword = await env.SYNC_KV.get(`password_${shopId}`);
        if (expectedPassword) {
          if (!parsed.settings) parsed.settings = {};
          parsed.settings.adminPin = expectedPassword.trim();
        }
      }
    }
    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON stored', isPrivate, daysRemaining, expiryDate: expiryDateVal }), {
      status: 200, // Return 200 so frontend doesn't crash on invalid data, just treats it as not found
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const shopId = url.searchParams.get('shopId');
  const createBin = url.searchParams.get('createBin') === 'true';
  const placeOrder = url.searchParams.get('placeOrder') === 'true';

  if (placeOrder) {
    if (!shopId) {
      return new Response(JSON.stringify({ error: 'Missing shopId for placing order' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    try {
      let shopDataText: string | null = null;
      if (env.SYNC_KV) {
        shopDataText = await env.SYNC_KV.get(`shop_${shopId}`);
      } else {
        const res = await fetch(`https://extendsclass.com/api/json-storage/bin/${shopId}`);
        if (res.ok) {
          shopDataText = await res.text();
        }
      }

      if (!shopDataText) {
        return new Response(JSON.stringify({ error: 'Shop not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      const shopData = JSON.parse(shopDataText);
      const orderBody = await request.text();
      const { sale, customer } = JSON.parse(orderBody);

      if (!sale) {
        return new Response(JSON.stringify({ error: 'Missing sale in request body' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      // Update product stock
      if (sale.items && Array.isArray(sale.items)) {
        for (const item of sale.items) {
          const pIdx = (shopData.products || []).findIndex((p: any) => p.id === item.product.id);
          if (pIdx > -1) {
            const p = shopData.products[pIdx];
            if (p.stock !== 'Unlimited' && typeof p.stock === 'number') {
              p.stock = Math.max(0, p.stock - item.quantity);
            }
          }
        }
      }

      // Add or update customer loyalty points
      if (customer) {
        if (!shopData.customers) shopData.customers = [];
        const cIdx = shopData.customers.findIndex((c: any) => c.phone === customer.phone);
        if (cIdx > -1) {
          shopData.customers[cIdx].loyaltyPoints = (shopData.customers[cIdx].loyaltyPoints || 0) + (sale.loyaltyPointsEarned || 0);
        } else {
          shopData.customers.push({
            ...customer,
            loyaltyPoints: sale.loyaltyPointsEarned || 0
          });
        }
      }

      // Add sale to shop's sales list
      if (!shopData.sales) shopData.sales = [];
      shopData.sales.unshift(sale);

      shopData.lastUpdated = Date.now();
      const updatedBody = JSON.stringify(shopData);

      // Save back to storage
      if (env.SYNC_KV) {
        await env.SYNC_KV.put(`shop_${shopId}`, updatedBody);

        // Update central registry counts
        const registryData = await env.SYNC_KV.get('saas_shops_registry');
        let registry: any[] = registryData ? JSON.parse(registryData) : [];
        const rIdx = registry.findIndex((item: any) => item.shopId === shopId);
        if (rIdx > -1) {
          registry[rIdx].salesCount = shopData.sales.length;
          registry[rIdx].productsCount = shopData.products.length;
          registry[rIdx].lastSynced = Date.now();
          await env.SYNC_KV.put('saas_shops_registry', JSON.stringify(registry));
        }
      } else {
        const updateRes = await fetch(`https://extendsclass.com/api/json-storage/bin/${shopId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: updatedBody
        });
        if (!updateRes.ok) {
          throw new Error('Failed to update ExtendsClass storage');
        }
      }

      return new Response(JSON.stringify({ success: true, saleId: sale.id }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }

  try {
    const body = await request.text();
    // Validate JSON structure
    const parsedData = JSON.parse(body);

    let isPrivate = false;
    let finalShopId = shopId;

    if (env.SYNC_KV) {
      isPrivate = true;
      if (createBin || !finalShopId || finalShopId === 'undefined' || finalShopId === 'null') {
        // For private KV, we generate a simple random ID if creating new
        finalShopId = 'ksc-' + Math.floor(1000 + Math.random() * 9000);
      }

      // Check if subscription has expired
      const expiryStr = await env.SYNC_KV.get(`expiry_${finalShopId}`);
      let isExpired = false;
      if (expiryStr) {
        const expiry = Number(expiryStr);
        if (expiry - Date.now() <= 0) {
          isExpired = true;
        }
      }

      // Check if the shop is deactivated or expired
      const status = await env.SYNC_KV.get(`status_${finalShopId}`) || 'active';
      if (status === 'deactivated' || isExpired) {
        return new Response(JSON.stringify({ 
          error: isExpired ? 'Subscription Expired. Sync Blocked.' : 'Account Suspended. Sync Blocked.', 
          suspended: true, 
          reason: isExpired ? 'Expired' : 'Suspended' 
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      // Verify Password if set (skip for createBin)
      if (!createBin && finalShopId && finalShopId !== 'undefined' && finalShopId !== 'null') {
        const password = request.headers.get('X-Shop-Password') || '';
        const expectedPassword = await env.SYNC_KV.get(`password_${finalShopId}`);
        if (expectedPassword && password !== expectedPassword) {
          return new Response(JSON.stringify({ error: 'Invalid Shop Password', authorized: false, isPrivate }), {
            status: 401,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
      }

      await env.SYNC_KV.put(`shop_${finalShopId}`, body);

      // --- AUTO REGISTRATION / METADATA UPDATE IN MASTER REGISTRY ---
      try {
        const registryData = await env.SYNC_KV.get('saas_shops_registry');
        let registry: any[] = registryData ? JSON.parse(registryData) : [];
        
        // Extract stats from payload
        const shopName = parsedData.settings?.shopName || 'Unnamed Shop';
        const productsCount = parsedData.products?.length || 0;
        const salesCount = parsedData.sales?.length || 0;
        const lastUpdated = parsedData.lastUpdated || Date.now();
        const adminPin = parsedData.settings?.adminPin;

        // If client uploaded a new passcode, synchronize it with the KV password key
        // We block downgrading a custom password to default values (8892 or 1234) from client pushes
        if (adminPin && adminPin.trim() !== '' && adminPin.trim() !== '8892' && adminPin.trim() !== '1234') {
          const currentExpected = await env.SYNC_KV.get(`password_${finalShopId}`);
          if (adminPin.trim() !== currentExpected) {
            await env.SYNC_KV.put(`password_${finalShopId}`, adminPin.trim());
          }
        }

        const existingIndex = registry.findIndex((item: any) => item.shopId === finalShopId);
        if (existingIndex > -1) {
          registry[existingIndex] = {
            ...registry[existingIndex],
            shopName,
            productsCount,
            salesCount,
            lastSynced: lastUpdated,
            password: adminPin ? adminPin.trim() : registry[existingIndex].password
          };
        } else {
          registry.push({
            shopId: finalShopId,
            shopName,
            createdAt: Date.now(),
            lastSynced: lastUpdated,
            productsCount,
            salesCount,
            status: 'active',
            password: adminPin ? adminPin.trim() : '8892'
          });
        }
        await env.SYNC_KV.put('saas_shops_registry', JSON.stringify(registry));
      } catch (regErr) {
        console.error('Error updating saas_shops_registry:', regErr);
      }

    } else {
      // Use ExtendsClass API
      if (finalShopId && finalShopId.startsWith('suspended-')) {
        return new Response(JSON.stringify({ error: 'Account Suspended. Sync Blocked.', suspended: true }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      if (createBin || !finalShopId || finalShopId === 'undefined' || finalShopId === 'null') {
        // Create new bin
        const res = await fetch('https://extendsclass.com/api/json-storage/bin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body
        });
        if (!res.ok) {
          throw new Error(`ExtendsClass create failed: ${res.statusText}`);
        }
        const resData = await res.json() as { id: string };
        finalShopId = resData.id;
      } else {
        // Update existing bin
        const res = await fetch(`https://extendsclass.com/api/json-storage/bin/${finalShopId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: body
        });
        if (!res.ok) {
          throw new Error(`ExtendsClass update failed: ${res.statusText}`);
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      shopId: finalShopId, 
      isPrivate,
      updatedPassword: parsedData.settings?.adminPin 
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
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
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
};
