/**
 * Zero-Setup Cloud Sync Service
 * Connects directly to Cloudflare Pages serverless API (/api/sync)
 */

export interface SyncResponse {
  found: boolean;
  lastUpdated: number;
  isPrivate: boolean;
}

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

// Download the full cloud database state
export const getCloudSyncState = async (shopId: string): Promise<any> => {
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

// Upload local database state to the cloud
export const pushLocalStateToCloud = async (shopId: string, state: any): Promise<{ success: boolean; isPrivate: boolean }> => {
  try {
    const cleanState = JSON.parse(JSON.stringify(state)); // Remove undefined or non-JSON fields
    const res = await fetch(`/api/sync?shopId=${encodeURIComponent(shopId)}`, {
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
