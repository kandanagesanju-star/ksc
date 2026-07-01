/**
 * Zero-Setup Cloud Sync Service
 * Connects directly to Cloudflare Pages serverless API (/api/sync)
 * Uses Cloudflare Workers KV if bound, falls back to ExtendsClass API
 * Generic string slicer chunking ensures any size database works on public sandbox
 */

export interface SyncResponse {
  found: boolean;
  lastUpdated: number;
  isPrivate: boolean;
  dataSize?: number;
  productsCount?: number;
  salesCount?: number;
}

const CHUNK_CHAR_LIMIT = 50000; // 50KB string slice size to guarantee bypass of 413 Payload Too Large limits

// Get the latest cloud database update timestamp (reads main metadata bin)
export const getCloudSyncTimestamp = async (shopId: string): Promise<SyncResponse> => {
  if (!shopId || shopId === 'undefined' || shopId === 'null') {
    return { found: false, lastUpdated: 0, isPrivate: false };
  }
  try {
    const res = await fetch(`/api/sync?shopId=${encodeURIComponent(shopId)}&timestampOnly=true`);
    if (!res.ok) {
      throw new Error(`Cloud fetch error: ${res.statusText}`);
    }
    return await res.json();
  } catch (e) {
    console.error('Error fetching cloud timestamp:', e);
    return { found: false, lastUpdated: 0, isPrivate: false };
  }
};

// Download and assemble the full cloud database state (dechunking string slices)
export const getCloudSyncState = async (shopId: string): Promise<any> => {
  if (!shopId || shopId === 'undefined' || shopId === 'null') {
    return null;
  }
  try {
    const res = await fetch(`/api/sync?shopId=${encodeURIComponent(shopId)}`);
    if (!res.ok) {
      throw new Error(`Cloud download error: ${res.statusText}`);
    }
    const metaState = await res.json();
    if (metaState.found === false) {
      return null;
    }

    // If metadata indicates it is chunked, download all slices and assemble
    if (metaState.isChunked && metaState.chunks && Array.isArray(metaState.chunks)) {
      localStorage.setItem('shop_sync_chunks', JSON.stringify(metaState.chunks));

      const chunkPromises = metaState.chunks.map(async (chunkId: string) => {
        try {
          const chunkRes = await fetch(`/api/sync?shopId=${encodeURIComponent(chunkId)}`);
          if (chunkRes.ok) {
            const chunkData = await chunkRes.json();
            return chunkData.chunk || '';
          }
        } catch (err) {
          console.error(`Error downloading chunk ${chunkId}:`, err);
        }
        return '';
      });

      const slices = await Promise.all(chunkPromises);
      const fullJson = slices.join('');
      return JSON.parse(fullJson);
    }

    // Otherwise return non-chunked (private cloud KV state)
    return metaState;
  } catch (e) {
    console.error('Error downloading cloud state:', e);
    throw e;
  }
};

// Upload local database state to the cloud (with generic string chunking for ExtendsClass)
export const pushLocalStateToCloud = async (shopId: string, state: any): Promise<{ success: boolean; shopId: string; isPrivate: boolean }> => {
  try {
    const cleanState = JSON.parse(JSON.stringify(state)); // Remove undefined or non-JSON fields
    cleanState.lastUpdated = cleanState.lastUpdated || Date.now();
    const jsonString = JSON.stringify(cleanState);

    // Check if we are using Private Cloud (Cloudflare KV)
    const isPrivate = localStorage.getItem('shop_sync_private') === 'true';

    if (isPrivate) {
      // Private KV supports up to 25MB per value directly. No chunking needed.
      const isNew = !shopId || shopId === 'undefined' || shopId === 'null' || shopId.startsWith('ksc-');
      const url = isNew 
        ? '/api/sync?createBin=true' 
        : `/api/sync?shopId=${encodeURIComponent(shopId)}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: jsonString
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Upload failed: ${res.statusText}`);
      }

      return await res.json();
    }

    // --- PUBLIC SANDBOX CHUNKING (ExtendsClass String Slicing) ---
    const savedChunksStr = localStorage.getItem('shop_sync_chunks');
    const chunkIds: string[] = savedChunksStr ? JSON.parse(savedChunksStr) : [];

    const numChunks = Math.ceil(jsonString.length / CHUNK_CHAR_LIMIT);
    const newChunkIds: string[] = [];

    // Upload chunks sequentially to avoid concurrency limits
    for (let i = 0; i < numChunks; i++) {
      const slice = jsonString.substring(i * CHUNK_CHAR_LIMIT, (i + 1) * CHUNK_CHAR_LIMIT);
      const existingChunkId = chunkIds[i];

      const isChunkNew = !existingChunkId || existingChunkId.startsWith('ksc-') || existingChunkId === 'undefined';
      const chunkUrl = isChunkNew 
        ? '/api/sync?createBin=true' 
        : `/api/sync?shopId=${encodeURIComponent(existingChunkId)}`;

      const chunkRes = await fetch(chunkUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chunk: slice })
      });

      if (!chunkRes.ok) {
        const errData = await chunkRes.json().catch(() => ({}));
        throw new Error(errData.error || `Slice ${i} upload failed: ${chunkRes.statusText}`);
      }

      const chunkResData = await chunkRes.json();
      newChunkIds.push(chunkResData.shopId);
    }

    // Save chunk bin IDs locally
    localStorage.setItem('shop_sync_chunks', JSON.stringify(newChunkIds));

    // Upload metadata bin referencing all slices
    const metaData = {
      lastUpdated: cleanState.lastUpdated,
      chunks: newChunkIds,
      isChunked: true,
      dataSize: jsonString.length,
      productsCount: cleanState.products?.length || 0,
      salesCount: cleanState.sales?.length || 0
    };

    const isMainNew = !shopId || shopId === 'undefined' || shopId === 'null' || shopId.startsWith('ksc-');
    const mainUrl = isMainNew 
      ? '/api/sync?createBin=true' 
      : `/api/sync?shopId=${encodeURIComponent(shopId)}`;

    const mainRes = await fetch(mainUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metaData)
    });

    if (!mainRes.ok) {
      const errData = await mainRes.json().catch(() => ({}));
      throw new Error(errData.error || `Metadata upload failed: ${mainRes.statusText}`);
    }

    const mainResData = await mainRes.json();
    return {
      success: true,
      shopId: mainResData.shopId,
      isPrivate: false
    };
  } catch (e) {
    console.error('Error uploading to cloud:', e);
    throw e;
  }
};

// Backward-compatible mock functions for older Firebase hooks
export const saveCloudDoc = async (collectionName: string, docId: string, data: any) => {
  // Silent success: sync is handled via the background timestamp synchronizer
};

export const deleteCloudDoc = async (collectionName: string, docId: string) => {
  // Silent success: sync is handled via the background timestamp synchronizer
};

export const subscribeToCollection = (collectionName: string, callback: (data: any[]) => void) => {
  // Mock subscription: does nothing
  return () => {};
};

export const subscribeToSettingsDoc = (callback: (data: any) => void) => {
  // Mock subscription: does nothing
  return () => {};
};
