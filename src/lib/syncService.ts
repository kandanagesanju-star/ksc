import { db, isFirebaseEnabled } from './firebase';
import { 
  doc, setDoc, deleteDoc, writeBatch, collection, onSnapshot
} from 'firebase/firestore';

// Helper to write a single document
export const saveCloudDoc = async (collectionName: string, docId: string, data: any) => {
  if (!isFirebaseEnabled || !db) return;
  try {
    const cleanData = JSON.parse(JSON.stringify(data)); // Remove any undefined fields for Firestore
    await setDoc(doc(db, collectionName, docId), cleanData);
  } catch (e) {
    console.error(`Error saving doc to ${collectionName}/${docId}:`, e);
  }
};

// Helper to delete a single document
export const deleteCloudDoc = async (collectionName: string, docId: string) => {
  if (!isFirebaseEnabled || !db) return;
  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch (e) {
    console.error(`Error deleting doc ${collectionName}/${docId}:`, e);
  }
};

// Helper to subscribe to real-time updates for a collection
export const subscribeToCollection = (
  collectionName: string, 
  onUpdate: (data: any[]) => void
) => {
  if (!isFirebaseEnabled || !db) return () => {};
  
  const q = collection(db, collectionName);
  return onSnapshot(q, (snapshot) => {
    const items: any[] = [];
    snapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    onUpdate(items);
  }, (error) => {
    console.error(`Error in snapshot listener for ${collectionName}:`, error);
  });
};

// Helper to subscribe to a single settings document
export const subscribeToSettingsDoc = (onUpdate: (settings: any) => void) => {
  if (!isFirebaseEnabled || !db) return () => {};
  
  const docRef = doc(db, 'settings', 'shop_settings');
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data());
    }
  }, (error) => {
    console.error('Error listening to shop settings:', error);
  });
};

// Bulk upload local state to Firebase
export const bulkUploadToCloud = async (state: {
  products: any[];
  customers: any[];
  suppliers: any[];
  repairs: any[];
  sales: any[];
  employees: any[];
  attendance: any[];
  commissions: any[];
  specialOrders: any[];
  expenses: any[];
  stockAdjustments: any[];
  stockReturns: any[];
  quotations: any[];
  settings: any;
}, onProgress?: (msg: string) => void) => {
  if (!isFirebaseEnabled || !db) {
    throw new Error('Firebase is not enabled/configured.');
  }

  const clean = (data: any) => JSON.parse(JSON.stringify(data));

  const uploadBatch = async (collectionName: string, items: any[], idField = 'id') => {
    if (items.length === 0) return;
    
    // Firestore batch supports up to 500 writes
    const chunkSize = 400;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      
      chunk.forEach((item) => {
        const docRef = doc(db, collectionName, String(item[idField]));
        batch.set(docRef, clean(item));
      });
      
      await batch.commit();
      if (onProgress) {
        onProgress(`Uploaded ${Math.min(i + chunkSize, items.length)} of ${items.length} to ${collectionName}...`);
      }
    }
  };

  if (onProgress) onProgress('Starting cloud upload...');

  // 1. Upload settings doc
  await setDoc(doc(db, 'settings', 'shop_settings'), clean(state.settings));
  if (onProgress) onProgress('Uploaded settings.');

  // 2. Upload collections
  await uploadBatch('products', state.products);
  await uploadBatch('customers', state.customers);
  await uploadBatch('suppliers', state.suppliers);
  await uploadBatch('repairs', state.repairs);
  await uploadBatch('sales', state.sales);
  await uploadBatch('employees', state.employees);
  await uploadBatch('attendance', state.attendance);
  await uploadBatch('commissions', state.commissions);
  await uploadBatch('special_orders', state.specialOrders);
  await uploadBatch('expenses', state.expenses);
  await uploadBatch('stock_adjustments', state.stockAdjustments);
  await uploadBatch('stock_returns', state.stockReturns);
  await uploadBatch('quotations', state.quotations);

  if (onProgress) onProgress('Cloud Database Migration Completed Successfully!');
};
