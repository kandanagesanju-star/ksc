/**
 * Zero-Setup Cloud Sync Service with Chunking
 * Connects directly to Cloudflare Pages serverless API (/api/sync)
 * Chunks products to support large inventories on public sandbox limits
 */

export interface SyncResponse {
  found: boolean;
  lastUpdated: number;
  isPrivate: boolean;
}

const CHUNK_SIZE = 150; // Max products per API request to stay safe under 64KB limits

// Get the latest cloud database update timestamp
export const getCloudSyncTimestamp = async (shopId: string): Promise<SyncResponse> => {
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
      const chunkPromises = metaState.chunks.map(async (chunkId: string) => {
        try {
          const chunkRes = await fetch(`/api/sync?shopId=${encodeURIComponent(shopId)}&chunk=${chunkId}`);
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

// Chunk and upload local database state to the cloud
export const pushLocalStateToCloud = async (shopId: string, state: any): Promise<{ success: boolean; isPrivate: boolean }> => {
  try {
    const cleanState = JSON.parse(JSON.stringify(state)); // Remove undefined or non-JSON fields
    const products = cleanState.products || [];
    
    // 1. Chunk products
    const chunks: string[] = [];
    const chunkPromises = [];
    
    for (let i = 0; i < products.length; i += CHUNK_SIZE) {
      const chunkData = products.slice(i, i + CHUNK_SIZE);
      const chunkId = String(Math.floor(i / CHUNK_SIZE));
      chunks.push(chunkId);
      
      // Upload product chunk
      chunkPromises.push(
        fetch(`/api/sync?shopId=${encodeURIComponent(shopId)}&chunk=${chunkId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chunkData)
        }).then(res => {
          if (!res.ok) throw new Error(`Chunk ${chunkId} upload failed`);
          return res.json();
        })
      );
    }
    
    // Wait for all product chunks to upload successfully
    await Promise.all(chunkPromises);
    
    // 2. Upload metadata (all other tables + settings) with products removed but chunks referenced
    cleanState.products = [];
    cleanState.chunks = chunks;
    
    const res = await fetch(`/api/sync?shopId=${encodeURIComponent(shopId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cleanState)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Metadata upload failed: ${res.statusText}`);
    }

    return await res.json();
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
