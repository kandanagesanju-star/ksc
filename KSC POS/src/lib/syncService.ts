/**
 * Zero-Setup Offline-Only Local Storage Sync Mock Service
 * Hand-tailored for KSC POS Offline edition
 */

import { Capacitor } from '@capacitor/core';

export interface SyncResponse {
  found: boolean;
  lastUpdated: number;
  isPrivate: boolean;
  dataSize?: number;
  productsCount?: number;
  salesCount?: number;
  suspended?: boolean;
  reason?: string;
  daysRemaining?: number;
  expiryDate?: number;
}

// Get the latest cloud database update timestamp (Always returns local only)
export const getCloudSyncTimestamp = async (shopId: string): Promise<SyncResponse> => {
  return { found: true, lastUpdated: Date.now(), isPrivate: false, suspended: false, daysRemaining: 9999 };
};

// Download and assemble the cloud database state (Always returns null for offline only)
export const getCloudSyncState = async (shopId: string): Promise<any> => {
  return null;
};

// Upload local database state to the cloud (Does nothing in offline mode)
export const pushLocalStateToCloud = async (shopId: string, state: any): Promise<{ success: boolean; shopId: string; isPrivate: boolean }> => {
  return {
    success: true,
    shopId: shopId || 'ksc-offline',
    isPrivate: false
  };
};

export const saveCloudDoc = async (collectionName: string, docId: string, data: any) => {
  // Offline: only save locally
};

export const deleteCloudDoc = async (collectionName: string, docId: string) => {
  // Offline: only delete locally
};

export const subscribeToCollection = (collectionName: string, callback: (data: any[]) => void) => {
  return () => {};
};

export const subscribeToSettingsDoc = (callback: (data: any) => void) => {
  return () => {};
};;
