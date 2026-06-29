/**
 * Zero-Setup Cloud Sync Service
 * Connects directly to Cloudflare Pages serverless API (/api/sync)
 * Uses Cloudflare Workers KV if bound, falls back to ExtendsClass API for unlimited size public sandbox
 */

export interface SyncResponse {
  found: boolean;
  lastUpdated: number;
  isPrivate: boolean;
}

// Get the latest cloud database update timestamp
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

// Download the full cloud database state
export const getCloudSyncState = async (shopId: string): Promise<any> => {
  if (!shopId || shopId === 'undefined' || shopId === 'null') {
    return null;
  }
  try {
    const res = await fetch(`/api/sync?shopId=${encodeURIComponent(shopId)}`);
    if (!res.ok) {
      throw new Error(`Cloud download error: ${res.statusText}`);
    }
    const data = await res.json();
    return data.found === false ? null : data;
  } catch (e) {
    console.error('Error downloading cloud state:', e);
    throw e;
  }
};

// Upload local database state to the cloud (creates new bin if no ID exists)
export const pushLocalStateToCloud = async (shopId: string, state: any): Promise<{ success: boolean; shopId: string; isPrivate: boolean }> => {
  try {
    const cleanState = JSON.parse(JSON.stringify(state)); // Remove undefined or non-JSON fields
    
    // Determine if we need to create a new bin (if no ID or if it is our temporary client placeholder)
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
