'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Sale,
  Product,
  PartnerName,
  FinancialSummary,
  FirebaseConfig,
} from '@/types/crm';
import {
  INITIAL_SALES,
  INITIAL_PRODUCTS,
  INITIAL_EXCHANGE_RATE,
} from '@/lib/mockData';
import { calculateSummary, calculateSaleNetProfit } from '@/lib/calculations';
import { useCurrency } from './CurrencyContext';
import { useAuth } from './AuthContext';
import { getFirebaseDb } from '@/lib/firebase';
import { SHARED_FIREBASE_CONFIG } from '@/lib/firebaseConfig';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

export type CloudSyncStatus = 'connected' | 'offline' | 'error' | 'syncing';

interface CRMDataContextType {
  sales: Sale[];
  products: Product[];
  activePartner: PartnerName;
  setActivePartner: (p: PartnerName) => void;
  financials: FinancialSummary;
  isFirebaseConnected: boolean;
  cloudSyncStatus: CloudSyncStatus;
  cloudSyncError: string | null;
  lastSyncedAt: string | null;
  firebaseConfig: FirebaseConfig;
  // Modals state
  isSaleModalOpen: boolean;
  openSaleModal: () => void;
  closeSaleModal: () => void;
  isProductModalOpen: boolean;
  openProductModal: () => void;
  closeProductModal: () => void;
  // Feedback
  toastMessage: string | null;
  showToast: (msg: string) => void;
  // Sales operations
  addSale: (saleData: Omit<Sale, 'id' | 'saleNumber' | 'netProfitDzd' | 'createdAt' | 'exchangeRateUsed'>) => Promise<Sale>;
  deleteSale: (saleId: string) => Promise<void>;
  // Products operations
  addProduct: (productData: Omit<Product, 'id' | 'createdAt'>) => Promise<Product>;
  deleteProduct: (productId: string) => Promise<void>;
  addStockKeys: (productId: string, keys: string[]) => Promise<void>;
  // Cloud and Settings
  updateExchangeRate: (rate: number) => Promise<void>;
  syncAllDataToCloud: () => Promise<void>;
  resetToDefault: () => void;
}

const CRMDataContext = createContext<CRMDataContextType | undefined>(undefined);

// Helper to remove any undefined or null keys so Firestore never errors
function cleanForFirestore<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined && val !== null) {
      result[key] = val;
    }
  }
  return result;
}

export function CRMDataProvider({ children }: { children: React.ReactNode }) {
  const { exchangeRate, setExchangeRate } = useCurrency();
  const { partner: authPartner } = useAuth();

  const [sales, setSales] = useState<Sale[]>(INITIAL_SALES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [activePartner, setActivePartnerState] = useState<PartnerName>('Adem');
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('syncing');
  const [cloudSyncError, setCloudSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Modal states
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  }, []);

  const openSaleModal = () => setIsSaleModalOpen(true);
  const closeSaleModal = () => setIsSaleModalOpen(false);
  const openProductModal = () => setIsProductModalOpen(true);
  const closeProductModal = () => setIsProductModalOpen(false);

  // 1. Sync activePartner with authenticated partner
  useEffect(() => {
    if (authPartner === 'Adem' || authPartner === 'Abdou') {
      setActivePartnerState(authPartner);
    }
  }, [authPartner]);

  // 2. Load LocalStorage on mount
  useEffect(() => {
    try {
      const savedSales = localStorage.getItem('crm_sales_v2');
      if (savedSales) {
        const parsed = JSON.parse(savedSales);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSales(parsed);
        }
      }

      const savedProducts = localStorage.getItem('crm_products_v2');
      if (savedProducts) {
        const parsed = JSON.parse(savedProducts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProducts(parsed);
        }
      }

      const savedPartner = localStorage.getItem('crm_auth_partner') as PartnerName;
      if (savedPartner === 'Adem' || savedPartner === 'Abdou') {
        setActivePartnerState(savedPartner);
      }
    } catch (e) {
      console.warn('LocalStorage load error:', e);
    } finally {
      setInitialized(true);
    }
  }, []);

  // 3. Persist to LocalStorage whenever state changes
  useEffect(() => {
    if (!initialized) return;
    try {
      localStorage.setItem('crm_sales_v2', JSON.stringify(sales));
      localStorage.setItem('crm_products_v2', JSON.stringify(products));
      localStorage.setItem('crm_active_partner_v2', activePartner);
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [sales, products, activePartner, initialized]);

  // Helper to seed initial products if Firestore products collection is empty
  const seedFirestoreProducts = useCallback(async (db: any) => {
    try {
      for (const p of INITIAL_PRODUCTS) {
        await setDoc(doc(db, 'products', p.id), cleanForFirestore(p));
      }
    } catch (err) {
      console.warn('Could not auto-seed Firestore products:', err);
    }
  }, []);

  // Helper to seed initial sales if Firestore sales collection is empty
  const seedFirestoreSales = useCallback(async (db: any) => {
    try {
      for (const s of INITIAL_SALES) {
        await setDoc(doc(db, 'sales', s.id), cleanForFirestore(s));
      }
    } catch (err) {
      console.warn('Could not auto-seed Firestore sales:', err);
    }
  }, []);

  // 4. Connect to centralized Firebase Firestore
  useEffect(() => {
    const db = getFirebaseDb();
    if (!db) {
      setIsFirebaseConnected(false);
      setCloudSyncStatus('offline');
      return;
    }

    setCloudSyncStatus('syncing');

    // Sync Sales from Firestore in real-time
    const unsubSales = onSnapshot(
      collection(db, 'sales'),
      (snapshot) => {
        setIsFirebaseConnected(true);
        setCloudSyncStatus('connected');
        setCloudSyncError(null);
        setLastSyncedAt(new Date().toLocaleTimeString());

        const firestoreSales = snapshot.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        })) as Sale[];

        firestoreSales.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        if (firestoreSales.length > 0) {
          setSales(firestoreSales);
        } else if (!snapshot.metadata.hasPendingWrites && snapshot.empty) {
          // If Firestore is connected and truly empty on initial load, seed initial sales
          seedFirestoreSales(db);
        }
      },
      (error) => {
        console.warn('Firestore sales sync error:', error.message);
        setIsFirebaseConnected(false);
        setCloudSyncStatus('error');
        setCloudSyncError(error.message);
      }
    );

    // Sync Products from Firestore in real-time
    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        setIsFirebaseConnected(true);
        setCloudSyncStatus('connected');
        setCloudSyncError(null);

        const firestoreProducts = snapshot.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        })) as Product[];

        if (firestoreProducts.length > 0) {
          setProducts(firestoreProducts);
        } else if (!snapshot.metadata.hasPendingWrites && snapshot.empty) {
          // If Firestore products collection is empty on clean connect, seed initial products
          seedFirestoreProducts(db);
        }
      },
      (error) => {
        console.warn('Firestore products sync error:', error.message);
        setIsFirebaseConnected(false);
        setCloudSyncStatus('error');
        setCloudSyncError(error.message);
      }
    );

    // Sync Square exchange rate from Firestore
    const unsubRate = onSnapshot(
      doc(db, 'crm_settings', 'exchange_rate'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && typeof data.rate === 'number' && data.rate > 0) {
            setExchangeRate(data.rate);
          }
        } else if (!docSnap.metadata.hasPendingWrites && !docSnap.exists()) {
          // Seed default rate to Firestore if missing
          setDoc(doc(db, 'crm_settings', 'exchange_rate'), {
            rate: INITIAL_EXCHANGE_RATE,
            updatedAt: new Date().toISOString(),
          }).catch(() => {});
        }
      },
      (error) => {
        console.warn('Firestore exchange rate sync warning:', error.message);
      }
    );

    return () => {
      unsubSales();
      unsubProducts();
      unsubRate();
    };
  }, [setExchangeRate, seedFirestoreProducts, seedFirestoreSales]);

  const setActivePartner = (p: PartnerName) => {
    setActivePartnerState(p);
  };

  // Update Exchange Rate in both local state & shared Firestore
  const updateExchangeRate = async (newRate: number): Promise<void> => {
    if (isNaN(newRate) || newRate <= 0) return;
    setExchangeRate(newRate);
    showToast(`Exchange rate updated: 1$ = ${newRate} DA`);

    const db = getFirebaseDb();
    if (db) {
      try {
        await setDoc(doc(db, 'crm_settings', 'exchange_rate'), {
          rate: newRate,
          updatedAt: new Date().toISOString(),
        });
      } catch (err: any) {
        console.warn('Firestore write exchange rate error:', err);
      }
    }
  };

  // Push all local catalog & sales to Firestore
  const syncAllDataToCloud = async (): Promise<void> => {
    const db = getFirebaseDb();
    if (!db) {
      showToast('Firebase cloud sync is offline');
      return;
    }

    showToast('Pushing local data to Firebase cloud...');
    try {
      for (const p of products) {
        await setDoc(doc(db, 'products', p.id), cleanForFirestore(p));
      }
      for (const s of sales) {
        await setDoc(doc(db, 'sales', s.id), cleanForFirestore(s));
      }
      await setDoc(doc(db, 'crm_settings', 'exchange_rate'), {
        rate: exchangeRate,
        updatedAt: new Date().toISOString(),
      });
      showToast('Cloud database synchronized successfully!');
    } catch (err: any) {
      console.error('Cloud sync error:', err);
      showToast(`Sync error: ${err.message || 'Check Firestore rules'}`);
    }
  };

  // Add Sale
  const addSale = async (
    data: Omit<Sale, 'id' | 'saleNumber' | 'netProfitDzd' | 'createdAt' | 'exchangeRateUsed'>
  ): Promise<Sale> => {
    const { netProfitDzd } = calculateSaleNetProfit(
      data.sellingPriceDzd,
      data.productCostUsd,
      data.metaAdCostUsd,
      exchangeRate
    );

    const saleNumber = `#${Math.floor(100 + Math.random() * 900)}`;
    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      saleNumber,
      productName: data.productName,
      sellingPriceDzd: data.sellingPriceDzd,
      productCostUsd: data.productCostUsd,
      metaAdCostUsd: data.metaAdCostUsd,
      soldBy: data.soldBy,
      paymentMethod: data.paymentMethod,
      exchangeRateUsed: exchangeRate,
      createdAt: new Date().toISOString(),
      netProfitDzd,
      ...(data.productId ? { productId: data.productId } : {}),
      ...(data.customerName?.trim() ? { customerName: data.customerName.trim() } : {}),
      ...(data.customerPhone?.trim() ? { customerPhone: data.customerPhone.trim() } : {}),
      ...(data.deliveredKey?.trim() ? { deliveredKey: data.deliveredKey.trim() } : {}),
      ...(data.notes?.trim() ? { notes: data.notes.trim() } : {}),
    };

    // 1. Update local state immediately for zero latency
    setSales((prev) => [newSale, ...prev]);

    // 2. Persist to Firestore if connected
    const db = getFirebaseDb();
    if (db) {
      try {
        const cleaned = cleanForFirestore(newSale);
        await setDoc(doc(db, 'sales', newSale.id), cleaned);
        showToast(`Sale ${saleNumber} (+${netProfitDzd.toLocaleString()} DA) saved & shared!`);
      } catch (err: any) {
        console.warn('Firestore write sale error:', err);
        showToast(`Sale ${saleNumber} saved locally (Cloud sync offline: ${err.code || 'check rules'})`);
      }
    } else {
      showToast(`Sale ${saleNumber} (+${netProfitDzd.toLocaleString()} DA) saved locally!`);
    }

    // 3. If a key was delivered, remove it from product vault locally & in cloud
    if (data.productId && data.deliveredKey) {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== data.productId) return p;
          const updatedKeys = p.stockKeys.filter((k) => k !== data.deliveredKey);
          if (db) {
            try {
              setDoc(doc(db, 'products', p.id), { stockKeys: updatedKeys }, { merge: true });
            } catch (e) {
              console.warn('Firestore stock key update error:', e);
            }
          }
          return {
            ...p,
            stockKeys: updatedKeys,
          };
        })
      );
    }

    return newSale;
  };

  const deleteSale = async (saleId: string): Promise<void> => {
    setSales((prev) => prev.filter((s) => s.id !== saleId));
    showToast('Sale deleted');

    const db = getFirebaseDb();
    if (db) {
      try {
        await deleteDoc(doc(db, 'sales', saleId));
      } catch (e) {
        console.warn('Firestore delete sale error:', e);
      }
    }
  };

  // Products
  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt'>): Promise<Product> => {
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: productData.name,
      category: productData.category,
      defaultCostUsd: productData.defaultCostUsd,
      defaultSellingDzd: productData.defaultSellingDzd,
      stockKeys: productData.stockKeys || [],
      createdAt: new Date().toISOString(),
      ...(productData.description?.trim() ? { description: productData.description.trim() } : {}),
    };

    setProducts((prev) => [newProduct, ...prev]);

    const db = getFirebaseDb();
    if (db) {
      try {
        const cleaned = cleanForFirestore(newProduct);
        await setDoc(doc(db, 'products', newProduct.id), cleaned);
        showToast(`Product "${newProduct.name}" added & shared!`);
      } catch (err: any) {
        console.warn('Firestore write product error:', err);
        showToast(`Product "${newProduct.name}" saved locally`);
      }
    } else {
      showToast(`Product "${newProduct.name}" added`);
    }

    return newProduct;
  };

  const deleteProduct = async (productId: string): Promise<void> => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    showToast('Product removed');

    const db = getFirebaseDb();
    if (db) {
      try {
        await deleteDoc(doc(db, 'products', productId));
      } catch (err) {
        console.warn('Firestore delete product error:', err);
      }
    }
  };

  const addStockKeys = async (productId: string, keys: string[]): Promise<void> => {
    const clean = keys.map((k) => k.trim()).filter(Boolean);
    if (clean.length === 0) return;

    let updatedList: string[] = [];

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        updatedList = [...p.stockKeys, ...clean];
        return {
          ...p,
          stockKeys: updatedList,
        };
      })
    );

    showToast(`Added ${clean.length} keys to stock`);

    const db = getFirebaseDb();
    if (db) {
      try {
        await setDoc(doc(db, 'products', productId), { stockKeys: updatedList }, { merge: true });
      } catch (err) {
        console.warn('Firestore update stock keys error:', err);
      }
    }
  };

  const resetToDefault = () => {
    setSales(INITIAL_SALES);
    setProducts(INITIAL_PRODUCTS);
    localStorage.removeItem('crm_sales_v2');
    localStorage.removeItem('crm_products_v2');
    showToast('Reset data to initial demo');
  };

  const financials = calculateSummary(sales, exchangeRate);

  return (
    <CRMDataContext.Provider
      value={{
        sales,
        products,
        activePartner,
        setActivePartner,
        financials,
        isFirebaseConnected,
        cloudSyncStatus,
        cloudSyncError,
        lastSyncedAt,
        firebaseConfig: SHARED_FIREBASE_CONFIG,
        isSaleModalOpen,
        openSaleModal,
        closeSaleModal,
        isProductModalOpen,
        openProductModal,
        closeProductModal,
        toastMessage,
        showToast,
        addSale,
        deleteSale,
        addProduct,
        deleteProduct,
        addStockKeys,
        updateExchangeRate,
        syncAllDataToCloud,
        resetToDefault,
      }}
    >
      {children}
    </CRMDataContext.Provider>
  );
}

export function useCRMData() {
  const ctx = useContext(CRMDataContext);
  if (!ctx) throw new Error('useCRMData must be inside CRMDataProvider');
  return ctx;
}
