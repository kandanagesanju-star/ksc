interface Env {
  SYNC_KV?: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const shopId = url.searchParams.get('shopId');
  const timestampOnly = url.searchParams.get('timestampOnly') === 'true';

  if (!shopId || shopId === 'undefined' || shopId === 'null') {
    return new Response(JSON.stringify({ found: false, error: 'Missing shopId', isPrivate: !!env.SYNC_KV }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  let data: string | null = null;
  let isPrivate = false;

  if (env.SYNC_KV) {
    data = await env.SYNC_KV.get(`shop_${shopId}`);
    isPrivate = true;
  } else {
    // Fetch from ExtendsClass JSON storage
    try {
      const res = await fetch(`https://extendsclass.com/api/json-storage/bin/${shopId}`);
      if (res.ok) {
        data = await res.text();
      }
    } catch (err) {
      console.error('ExtendsClass GET error:', err);
    }
  }

  if (!data) {
    return new Response(JSON.stringify({ found: false, isPrivate }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const parsed = JSON.parse(data);
    if (timestampOnly) {
      return new Response(JSON.stringify({ found: true, lastUpdated: parsed.lastUpdated || 0, isPrivate }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    if (typeof parsed === 'object' && parsed !== null) {
      parsed.isPrivate = isPrivate;
      parsed.found = true;
    }
    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON stored', isPrivate }), {
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

  try {
    const body = await request.text();
    // Validate JSON structure
    JSON.parse(body);

    let isPrivate = false;
    let finalShopId = shopId;

    if (env.SYNC_KV) {
      isPrivate = true;
      if (createBin || !finalShopId || finalShopId === 'undefined' || finalShopId === 'null') {
        // For private KV, we generate a simple random ID if creating new
        finalShopId = 'ksc-' + Math.floor(1000 + Math.random() * 9000);
      }
      await env.SYNC_KV.put(`shop_${finalShopId}`, body);
    } else {
      // Use ExtendsClass API
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

    return new Response(JSON.stringify({ success: true, shopId: finalShopId, isPrivate }), {
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
