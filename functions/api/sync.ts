interface Env {
  SYNC_KV?: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const shopId = url.searchParams.get('shopId');
  const chunk = url.searchParams.get('chunk');
  const timestampOnly = url.searchParams.get('timestampOnly') === 'true';

  if (!shopId) {
    return new Response(JSON.stringify({ error: 'Missing shopId' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  let data: string | null = null;
  let isPrivate = false;

  const storageKey = chunk ? `shop_${shopId}_chunk_${chunk}` : `shop_${shopId}`;

  // Try Cloudflare KV first
  if (env.SYNC_KV) {
    data = await env.SYNC_KV.get(storageKey);
    isPrivate = true;
  } else {
    // Fallback to kvdb.io public sandbox
    try {
      const res = await fetch(`https://kvdb.io/ksc_pos_public_sync_v1/${storageKey}`);
      if (res.ok) {
        data = await res.text();
      }
    } catch (err) {
      console.error('Fallback read error:', err);
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
    if (timestampOnly && !chunk) {
      return new Response(JSON.stringify({ found: true, lastUpdated: parsed.lastUpdated || 0, isPrivate }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Add isPrivate flag to response
    if (typeof parsed === 'object' && parsed !== null) {
      parsed.isPrivate = isPrivate;
    }
    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON stored', isPrivate }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const shopId = url.searchParams.get('shopId');
  const chunk = url.searchParams.get('chunk');

  if (!shopId) {
    return new Response(JSON.stringify({ error: 'Missing shopId' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const body = await request.text();
    // Validate JSON structure
    JSON.parse(body);

    let isPrivate = false;
    const storageKey = chunk ? `shop_${shopId}_chunk_${chunk}` : `shop_${shopId}`;

    if (env.SYNC_KV) {
      await env.SYNC_KV.put(storageKey, body);
      isPrivate = true;
    } else {
      // Fallback to kvdb.io public sandbox
      const res = await fetch(`https://kvdb.io/ksc_pos_public_sync_v1/${storageKey}`, {
        method: 'POST',
        body: body
      });
      if (!res.ok) {
        throw new Error(`Fallback sync write failed: ${res.statusText}`);
      }
    }

    return new Response(JSON.stringify({ success: true, isPrivate }), {
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
