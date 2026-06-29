/**
 * Zero-Setup Cloud Sync Service
 * Connects directly to Cloudflare Pages serverless API (/api/sync)
 * Uses Cloudflare Workers KV if bound, falls back to ExtendsClass API
 * Auto-chunks products for public sandbox to stay under payload limits (Payload Too Large 413)
 */

export interface SyncResponse {
  found: boolean;
  lastUpdated: number;
  isPrivate: boolean;
}

const CHUNK_SIZE = 150; // Max products per ExtendsClass request to bypass 100KB limits

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

// Download and assemble the full cloud database state (dechunking)
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

    // If chunks are listed, download products chunks and assemble
    if (metaState.chunks && Array.isArray(metaState.chunks)) {
      // Save chunk bin IDs locally to reuse during next upload
      localStorage.setItem('shop_sync_chunks', JSON.stringify(metaState.chunks));

      const chunkPromises = metaState.chunks.map(async (chunkId: string) => {
        try {
          const chunkRes = await fetch(`/api/sync?shopId=${encodeURIComponent(chunkId)}`);
          if (chunkRes.ok) {
            const chunkData = await chunkRes.json();
            return Array.isArray(chunkData) ? chunkData : [];
          }
        } catch (err) {
          console.error(`Error downloading chunk ${chunkId}:`, err);
        }
        return [];
      });

      const productChunks = await Promise.all(chunkPromises);
      metaState.products = productChunks.flat();
    }

    return metaState;
  } catch (e) {
    console.error('Error downloading cloud state:', e);
    throw e;
  }
};

// Upload local database state to the cloud (with chunking for ExtendsClass)
export const pushLocalStateToCloud = async (shopId: string, state: any): Promise<{ success: boolean; shopId: string; isPrivate: boolean }> => {
  try {
    const cleanState = JSON.parse(JSON.stringify(state)); // Remove undefined or non-JSON fields
    const products = cleanState.products || [];

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
        body: JSON.stringify(cleanState)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Upload failed: ${res.statusText}`);
      }

      return await res.json();
    }

    // --- PUBLIC SANDBOX CHUNKING (ExtendsClass) ---
    const savedChunksStr = localStorage.getItem('shop_sync_chunks');
    const chunkIds: string[] = savedChunksStr ? JSON.parse(savedChunksStr) : [];

    const numChunks = Math.ceil(products.length / CHUNK_SIZE);
    const newChunkIds: string[] = [];

    // Upload chunks sequentially to avoid concurrency limits
    for (let i = 0; i < numChunks; i++) {
      const chunkData = products.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const existingChunkId = chunkIds[i];

      const isChunkNew = !existingChunkId || existingChunkId.startsWith('ksc-') || existingChunkId === 'undefined';
      const chunkUrl = isChunkNew 
        ? '/api/sync?createBin=true' 
        : `/api/sync?shopId=${encodeURIComponent(existingChunkId)}`;

      const chunkRes = await fetch(chunkUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chunkData)
      });

      if (!chunkRes.ok) {
        const errData = await chunkRes.json().catch(() => ({}));
        throw new Error(errData.error || `Chunk ${i} upload failed: ${chunkRes.statusText}`);
      }

      const chunkResData = await chunkRes.json();
      newChunkIds.push(chunkResData.shopId);
    }

    // Save chunk bin IDs locally
    localStorage.setItem('shop_sync_chunks', JSON.stringify(newChunkIds));

    // Upload metadata (products are empty, chunks referenced)
    cleanState.products = [];
    cleanState.chunks = newChunkIds;

    const isMainNew = !shopId || shopId === 'undefined' || shopId === 'null' || shopId.startsWith('ksc-');
    const mainUrl = isMainNew 
      ? '/api/sync?createBin=true' 
      : `/api/sync?shopId=${encodeURIComponent(shopId)}`;

    const mainRes = await fetch(mainUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cleanState)
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
