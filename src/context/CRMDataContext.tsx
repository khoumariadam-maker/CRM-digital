'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Sale,
  Product,
  PartnerName,
  FinancialSummary,
  FirebaseConfig,
  Expense,
  DailyAdSpend,
  DailyCaisse,
  PaymentStatus,
  StockItem,
} from '@/types/crm';
import { INITIAL_EXCHANGE_RATE } from '@/lib/mockData';
import { calculateSummary, calculateSaleNetProfit, convertUsdToDzd } from '@/lib/calculations';
import { useCurrency } from './CurrencyContext';
import { useAuth } from './AuthContext';
import { getFirebaseDb } from '@/lib/firebase';
import { SHARED_FIREBASE_CONFIG } from '@/lib/firebaseConfig';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

export type CloudSyncStatus = 'connected' | 'offline' | 'error' | 'syncing';

/**
 * Known fake/demo document IDs seeded in previous CRM versions.
 * These are purged from Firestore once on first load via the migration flag.
 */
const LEGACY_FAKE_SALE_IDS = [
  'sale-jio-101', 'sale-jio-102', 'sale-jio-103', 'sale-jio-104', 'sale-jio-105',
  'sale-jio-106', 'sale-jio-107', 'sale-jio-108', 'sale-jio-109', 'sale-jio-110',
  'sale-jio-111', 'sale-jio-112', 'sale-jio-113', 'sale-jio-114', 'sale-jio-115',
  'sale-jio-116', 'sale-jio-117', 'sale-jio-118',
];
const LEGACY_FAKE_CAISSE_IDS = ['caisse-day-01', 'caisse-day-02'];
const LEGACY_FAKE_PRODUCT_IDS = ['prod-jio-ai-pro'];
const MIGRATION_FLAG = 'crm_migration_v4_purge_done';

interface CRMDataContextType {
  sales: Sale[];
  products: Product[];
  expenses: Expense[];
  dailyAdSpends: DailyAdSpend[];
  dailyCaisses: DailyCaisse[];
  activeCaisse: DailyCaisse | undefined;
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

  isExpenseModalOpen: boolean;
  openExpenseModal: () => void;
  closeExpenseModal: () => void;

  isAdSpendModalOpen: boolean;
  openAdSpendModal: () => void;
  closeAdSpendModal: () => void;

  isCaisseModalOpen: boolean;
  openCaisseModal: () => void;
  closeCaisseModal: () => void;

  isStockImportModalOpen: boolean;
  openStockImportModal: () => void;
  closeStockImportModal: () => void;

  // Feedback
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Sales operations
  addSale: (saleData: Omit<Sale, 'id' | 'saleNumber' | 'netProfitDzd' | 'createdAt' | 'exchangeRateUsed'>) => Promise<Sale>;
  markSaleAsPaid: (saleId: string) => Promise<void>;
  deleteSale: (saleId: string) => Promise<void>;

  // Products & Stock operations
  addProduct: (productData: Omit<Product, 'id' | 'createdAt'>) => Promise<Product>;
  deleteProduct: (productId: string) => Promise<void>;
  addStockKeys: (productId: string, keys: string[], expiresAt?: string) => Promise<void>;
  bulkImportKeys: (entries: { productId: string; keys: string[]; expiresAt?: string }[]) => Promise<number>;
  lowStockProducts: Product[];
  expiringStockItems: {
    id: string;
    keyOrLink: string;
    addedAt: string;
    expiresAt?: string;
    productName: string;
    productId: string;
    isExpired: boolean;
    isExpiringSoon: boolean;
  }[];
  removeExpiredStockKeys: (productId: string) => Promise<void>;
  removeStockKey: (productId: string, keyOrLink: string) => Promise<void>;

  // Expenses operations
  addExpense: (expenseData: Omit<Expense, 'id' | 'createdAt'>) => Promise<Expense>;
  deleteExpense: (expenseId: string) => Promise<void>;

  // Daily Ad Spend operations
  logDailyAdSpend: (spendData: Omit<DailyAdSpend, 'id' | 'createdAt' | 'cpmDzd' | 'cpaDzd' | 'salesCount'>) => Promise<DailyAdSpend>;
  deleteDailyAdSpend: (spendId: string) => Promise<void>;

  // Caisse operations
  openCaisse: (initialBalanceDzd: number, initialBalanceUsd: number) => Promise<DailyCaisse>;
  closeCaisse: (caisseId: string, closingBalanceDzd: number, closingBalanceUsd: number, notes?: string) => Promise<void>;

  // Cloud and Settings
  updateExchangeRate: (rate: number) => Promise<void>;
  syncAllDataToCloud: () => Promise<void>;
  resetToFresh: () => void;
  resetToDefault: () => void;

  // Business Setup & Capital
  startingCapitalDzd: number;
  setStartingCapitalDzd: (val: number) => void;
  updateStartingCapital: (val: number) => Promise<void>;
  isConfigured: boolean;
  isInitialSetupOpen: boolean;
  openInitialSetup: () => void;
  closeInitialSetup: () => void;
  completeInitialSetup: (
    initialBalance: number,
    prodName: string,
    prodPrice: number,
    rawLinks?: string
  ) => Promise<void>;
  resetBusinessSetup: () => void;
}

const CRMDataContext = createContext<CRMDataContextType | undefined>(undefined);

// Zero-Crash Firestore serializer: strips undefined and null keys
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

  // All state defaults to EMPTY — no hardcoded demo values
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dailyAdSpends, setDailyAdSpends] = useState<DailyAdSpend[]>([]);
  const [dailyCaisses, setDailyCaisses] = useState<DailyCaisse[]>([]);

  // Starting capital defaults to 0 — set by setup wizard only
  const [startingCapitalDzd, setStartingCapitalDzd] = useState<number>(0);

  // isConfigured: false by default — relies on localStorage flag
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isInitialSetupOpen, setIsInitialSetupOpen] = useState<boolean>(false);

  const [activePartner, setActivePartnerState] = useState<PartnerName>('Adem');
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('syncing');
  const [cloudSyncError, setCloudSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Modals state
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isAdSpendModalOpen, setIsAdSpendModalOpen] = useState(false);
  const [isCaisseModalOpen, setIsCaisseModalOpen] = useState(false);
  const [isStockImportModalOpen, setIsStockImportModalOpen] = useState(false);

  const openInitialSetup = () => setIsInitialSetupOpen(true);
  const closeInitialSetup = () => setIsInitialSetupOpen(false);

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

  const openExpenseModal = () => setIsExpenseModalOpen(true);
  const closeExpenseModal = () => setIsExpenseModalOpen(false);

  const openAdSpendModal = () => setIsAdSpendModalOpen(true);
  const closeAdSpendModal = () => setIsAdSpendModalOpen(false);

  const openCaisseModal = () => setIsCaisseModalOpen(true);
  const closeCaisseModal = () => setIsCaisseModalOpen(false);

  const openStockImportModal = () => setIsStockImportModalOpen(true);
  const closeStockImportModal = () => setIsStockImportModalOpen(false);

  // Sync activePartner with authenticated partner
  useEffect(() => {
    if (authPartner === 'Adem' || authPartner === 'Abdou') {
      setActivePartnerState(authPartner);
    }
  }, [authPartner]);

  // 1. Load from LocalStorage on mount
  useEffect(() => {
    try {
      const configured = localStorage.getItem('crm_business_configured');
      const savedCap = localStorage.getItem('crm_starting_capital');

      if (savedCap !== null) {
        setStartingCapitalDzd(Number(savedCap));
      }

      if (configured === 'true') {
        setIsConfigured(true);
      } else {
        // Not yet configured — show setup wizard
        setIsConfigured(false);
        setIsInitialSetupOpen(true);
      }

      const savedSales = localStorage.getItem('crm_sales_v3');
      if (savedSales) {
        const parsed = JSON.parse(savedSales);
        if (Array.isArray(parsed)) setSales(parsed);
      }

      const savedProducts = localStorage.getItem('crm_products_v3');
      if (savedProducts) {
        const parsed = JSON.parse(savedProducts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const clean = parsed.filter(
            (p) => p && typeof p.name === 'string' && p.name.trim().length > 0
          );
          if (clean.length > 0) setProducts(clean);
        }
      }

      const savedExpenses = localStorage.getItem('crm_expenses_v1');
      if (savedExpenses) {
        const parsed = JSON.parse(savedExpenses);
        if (Array.isArray(parsed)) setExpenses(parsed);
      }

      const savedAdSpends = localStorage.getItem('crm_ad_spends_v1');
      if (savedAdSpends) {
        const parsed = JSON.parse(savedAdSpends);
        if (Array.isArray(parsed)) setDailyAdSpends(parsed);
      }

      const savedCaisses = localStorage.getItem('crm_caisses_v1');
      if (savedCaisses) {
        const parsed = JSON.parse(savedCaisses);
        if (Array.isArray(parsed) && parsed.length > 0) setDailyCaisses(parsed);
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

  // 2. Persist to LocalStorage whenever state changes
  useEffect(() => {
    if (!initialized) return;
    try {
      localStorage.setItem('crm_sales_v3', JSON.stringify(sales));
      localStorage.setItem('crm_products_v3', JSON.stringify(products));
      localStorage.setItem('crm_expenses_v1', JSON.stringify(expenses));
      localStorage.setItem('crm_ad_spends_v1', JSON.stringify(dailyAdSpends));
      localStorage.setItem('crm_caisses_v1', JSON.stringify(dailyCaisses));
      localStorage.setItem('crm_active_partner_v2', activePartner);
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [sales, products, expenses, dailyAdSpends, dailyCaisses, activePartner, initialized]);

  // 3. Connect to Firebase Firestore (real-time sync)
  //    IMPORTANT: No auto-seeding with demo data. Empty = empty.
  useEffect(() => {
    const db = getFirebaseDb();
    if (!db) {
      setIsFirebaseConnected(false);
      setCloudSyncStatus('offline');
      return;
    }

    setCloudSyncStatus('syncing');

    // One-time migration: purge known legacy fake document IDs from Firestore
    const runMigration = async () => {
      const migrationDone = localStorage.getItem(MIGRATION_FLAG);
      if (migrationDone === 'true') return;
      try {
        const purgePromises: Promise<void>[] = [];
        for (const id of LEGACY_FAKE_SALE_IDS) {
          purgePromises.push(deleteDoc(doc(db, 'sales', id)).catch(() => {}));
        }
        for (const id of LEGACY_FAKE_CAISSE_IDS) {
          purgePromises.push(deleteDoc(doc(db, 'daily_caisses', id)).catch(() => {}));
        }
        for (const id of LEGACY_FAKE_PRODUCT_IDS) {
          purgePromises.push(deleteDoc(doc(db, 'products', id)).catch(() => {}));
        }
        await Promise.all(purgePromises);
        localStorage.setItem(MIGRATION_FLAG, 'true');
        console.info('[CRM Migration v4] Purged legacy demo data from Firestore.');
      } catch (err) {
        console.warn('[CRM Migration v4] Purge error (non-blocking):', err);
      }
    };

    runMigration();

    // Sync Sales — NO auto-seed with demo data
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
        setSales(firestoreSales);
      },
      (error) => {
        console.warn('Firestore sales sync error:', error.message);
        setIsFirebaseConnected(false);
        setCloudSyncStatus('error');
        setCloudSyncError(error.message);
      }
    );

    // Sync Products — NO auto-seed
    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        const firestoreProducts = snapshot.docs
          .map((d) => ({ ...d.data(), id: d.id }))
          .filter(
            (p: any) => p && typeof p.name === 'string' && p.name.trim().length > 0
          ) as Product[];

        setProducts(firestoreProducts);
      },
      (error) => {
        console.warn('Firestore products sync error:', error.message);
      }
    );

    // Sync Expenses
    const unsubExpenses = onSnapshot(
      collection(db, 'expenses'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ ...d.data(), id: d.id })) as Expense[];
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setExpenses(list);
      },
      (error) => console.warn('Firestore expenses sync error:', error.message)
    );

    // Sync Daily Ad Spends
    const unsubAdSpends = onSnapshot(
      collection(db, 'daily_ad_spends'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ ...d.data(), id: d.id })) as DailyAdSpend[];
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setDailyAdSpends(list);
      },
      (error) => console.warn('Firestore ad spends sync error:', error.message)
    );

    // Sync Daily Caisses — NO auto-seed
    const unsubCaisses = onSnapshot(
      collection(db, 'daily_caisses'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ ...d.data(), id: d.id })) as DailyCaisse[];
        list.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
        setDailyCaisses(list);
      },
      (error) => console.warn('Firestore caisses sync error:', error.message)
    );

    // Sync Square exchange rate
    const unsubRate = onSnapshot(
      doc(db, 'crm_settings', 'exchange_rate'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && typeof data.rate === 'number' && data.rate > 0) {
            setExchangeRate(data.rate);
          }
        }
      },
      (error) => console.warn('Firestore exchange rate error:', error.message)
    );

    // Sync starting capital
    const unsubCapital = onSnapshot(
      doc(db, 'crm_settings', 'starting_capital'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && typeof data.value === 'number' && data.value >= 0) {
            setStartingCapitalDzd(data.value);
            localStorage.setItem('crm_starting_capital', String(data.value));
          }
        }
      },
      (error) => console.warn('Firestore capital sync error:', error.message)
    );

    // Sync business config (isConfigured state)
    const unsubConfig = onSnapshot(
      doc(db, 'crm_settings', 'business_config'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data?.isConfigured === true) {
            setIsConfigured(true);
            setIsInitialSetupOpen(false);
            localStorage.setItem('crm_business_configured', 'true');
          }
        }
      },
      (error) => console.warn('Firestore business config error:', error.message)
    );

    return () => {
      unsubSales();
      unsubProducts();
      unsubExpenses();
      unsubAdSpends();
      unsubCaisses();
      unsubRate();
      unsubCapital();
      unsubConfig();
    };
  }, [setExchangeRate]);

  const setActivePartner = (p: PartnerName) => setActivePartnerState(p);

  // Active Open Caisse (if any)
  const activeCaisse = useMemo(() => {
    return dailyCaisses.find((c) => c.status === 'open');
  }, [dailyCaisses]);

  // Update Exchange Rate
  const updateExchangeRate = async (newRate: number): Promise<void> => {
    if (isNaN(newRate) || newRate <= 0) return;
    setExchangeRate(newRate);
    showToast(`Taux Square mis à jour : 1$ = ${newRate} DA`);

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

  // Add Sale
  const addSale = async (
    data: Omit<Sale, 'id' | 'saleNumber' | 'netProfitDzd' | 'createdAt' | 'exchangeRateUsed'>
  ): Promise<Sale> => {
    const metaAd = data.metaAdCostUsd || 0;
    const { netProfitDzd } = calculateSaleNetProfit(
      data.sellingPriceDzd,
      data.productCostUsd,
      exchangeRate,
      metaAd
    );

    const saleNumber = `#${Math.floor(1000 + Math.random() * 9000)}`;
    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      saleNumber,
      productName: data.productName,
      sellingPriceDzd: data.sellingPriceDzd,
      productCostUsd: data.productCostUsd,
      metaAdCostUsd: metaAd,
      soldBy: data.soldBy,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus || 'paid',
      exchangeRateUsed: exchangeRate,
      createdAt: new Date().toISOString(),
      netProfitDzd,
      ...(data.productId ? { productId: data.productId } : {}),
      ...(data.pendingNote?.trim() ? { pendingNote: data.pendingNote.trim() } : {}),
      ...(data.customerName?.trim() ? { customerName: data.customerName.trim() } : {}),
      ...(data.customerPhone?.trim() ? { customerPhone: data.customerPhone.trim() } : {}),
      ...(data.deliveredKey?.trim() ? { deliveredKey: data.deliveredKey.trim() } : {}),
      ...(data.notes?.trim() ? { notes: data.notes.trim() } : {}),
    };

    setSales((prev) => [newSale, ...prev]);

    const db = getFirebaseDb();
    if (db) {
      try {
        await setDoc(doc(db, 'sales', newSale.id), cleanForFirestore(newSale));
        showToast(
          newSale.paymentStatus === 'pending'
            ? `Commande ${saleNumber} créée — Paiement en attente ⏳`
            : `Vente ${saleNumber} confirmée ✅ (+${newSale.netProfitDzd.toLocaleString()} DA)`
        );
      } catch (err: any) {
        console.warn('Firestore write sale error:', err);
        showToast(`Vente ${saleNumber} sauvegardée localement`);
      }
    } else {
      showToast(`Vente ${saleNumber} sauvegardée localement !`);
    }

    // Key delivery stock deduction (1 link = 1 item)
    if (data.productId && data.deliveredKey) {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== data.productId) return p;
          const updatedKeys = p.stockKeys.filter((k) => k !== data.deliveredKey);
          const updatedItems = (p.stockItems || []).filter(
            (item) => item.keyOrLink !== data.deliveredKey
          );
          if (db) {
            setDoc(
              doc(db, 'products', p.id),
              cleanForFirestore({ stockKeys: updatedKeys, stockItems: updatedItems }),
              { merge: true }
            ).catch(() => {});
          }
          return { ...p, stockKeys: updatedKeys, stockItems: updatedItems };
        })
      );
    }

    return newSale;
  };

  // Mark pending sale as paid
  const markSaleAsPaid = async (saleId: string): Promise<void> => {
    setSales((prev) =>
      prev.map((s) => (s.id === saleId ? { ...s, paymentStatus: 'paid' } : s))
    );
    showToast('Paiement confirmé et encaissé ✅');

    const db = getFirebaseDb();
    if (db) {
      try {
        await setDoc(doc(db, 'sales', saleId), { paymentStatus: 'paid' }, { merge: true });
      } catch (err) {
        console.warn('Firestore update sale status error:', err);
      }
    }
  };

  // Delete sale
  const deleteSale = async (saleId: string): Promise<void> => {
    setSales((prev) => prev.filter((s) => s.id !== saleId));
    showToast('Vente supprimée');

    const db = getFirebaseDb();
    if (db) {
      try {
        await deleteDoc(doc(db, 'sales', saleId));
      } catch (e) {
        console.warn('Firestore delete sale error:', e);
      }
    }
  };

  // Add Product
  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt'>): Promise<Product> => {
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: productData.name,
      category: productData.category,
      defaultCostUsd: productData.defaultCostUsd,
      defaultSellingDzd: productData.defaultSellingDzd,
      stockKeys: productData.stockKeys || [],
      stockItems: productData.stockItems || [],
      lowStockThreshold: productData.lowStockThreshold ?? 2,
      createdAt: new Date().toISOString(),
      ...(productData.description?.trim() ? { description: productData.description.trim() } : {}),
    };

    setProducts((prev) => [newProduct, ...prev]);

    const db = getFirebaseDb();
    if (db) {
      try {
        await setDoc(doc(db, 'products', newProduct.id), cleanForFirestore(newProduct));
        showToast(`Produit "${newProduct.name}" ajouté au catalogue`);
      } catch (err: any) {
        console.warn('Firestore write product error:', err);
      }
    } else {
      showToast(`Produit "${newProduct.name}" ajouté localement`);
    }

    return newProduct;
  };

  const deleteProduct = async (productId: string): Promise<void> => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    showToast('Produit supprimé du catalogue');

    const db = getFirebaseDb();
    if (db) {
      try {
        await deleteDoc(doc(db, 'products', productId));
      } catch (err) {
        console.warn('Firestore delete product error:', err);
      }
    }
  };

  const addStockKeys = async (productId: string, keys: string[], expiresAt?: string): Promise<void> => {
    const clean = keys.map((k) => k.trim()).filter(Boolean);
    if (clean.length === 0) return;

    const newItems: StockItem[] = clean.map((k, i) => ({
      id: `item-${Date.now()}-${i}`,
      keyOrLink: k,
      addedAt: new Date().toISOString(),
      ...(expiresAt ? { expiresAt } : {}),
    }));

    let updatedKeys: string[] = [];
    let updatedItems: StockItem[] = [];

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        updatedKeys = [...(p.stockKeys || []), ...clean];
        updatedItems = [...(p.stockItems || []), ...newItems];
        return { ...p, stockKeys: updatedKeys, stockItems: updatedItems };
      })
    );

    showToast(`${clean.length} lien(s) ajouté(s) au stock`);

    const db = getFirebaseDb();
    if (db) {
      try {
        await setDoc(
          doc(db, 'products', productId),
          cleanForFirestore({ stockKeys: updatedKeys, stockItems: updatedItems }),
          { merge: true }
        );
      } catch (err) {
        console.warn('Firestore update stock keys error:', err);
      }
    }
  };

  const bulkImportKeys = async (
    entries: { productId: string; keys: string[]; expiresAt?: string }[]
  ): Promise<number> => {
    let totalImported = 0;
    const db = getFirebaseDb();

    setProducts((prev) =>
      prev.map((p) => {
        const match = entries.find((e) => e.productId === p.id);
        if (!match || match.keys.length === 0) return p;
        const clean = match.keys.map((k) => k.trim()).filter(Boolean);
        totalImported += clean.length;

        const newItems: StockItem[] = clean.map((k, i) => ({
          id: `item-${Date.now()}-${i}`,
          keyOrLink: k,
          addedAt: new Date().toISOString(),
          ...(match.expiresAt ? { expiresAt: match.expiresAt } : {}),
        }));

        const updatedKeys = [...(p.stockKeys || []), ...clean];
        const updatedItems = [...(p.stockItems || []), ...newItems];

        if (db) {
          setDoc(
            doc(db, 'products', p.id),
            cleanForFirestore({ stockKeys: updatedKeys, stockItems: updatedItems }),
            { merge: true }
          ).catch(() => {});
        }
        return { ...p, stockKeys: updatedKeys, stockItems: updatedItems };
      })
    );

    showToast(`${totalImported} article(s) importés dans le stock !`);
    return totalImported;
  };

  // Expenses (Dépenses)
  const addExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> => {
    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      title: expenseData.title,
      amountDzd: expenseData.amountDzd,
      amountUsd: expenseData.amountUsd,
      currency: expenseData.currency,
      category: expenseData.category,
      paidBy: expenseData.paidBy,
      date: expenseData.date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      ...(expenseData.notes?.trim() ? { notes: expenseData.notes.trim() } : {}),
    };

    setExpenses((prev) => [newExpense, ...prev]);
    showToast(`Dépense "${newExpense.title}" enregistrée (-${newExpense.amountDzd.toLocaleString()} DA)`);

    const db = getFirebaseDb();
    if (db) {
      try {
        await setDoc(doc(db, 'expenses', newExpense.id), cleanForFirestore(newExpense));
      } catch (err) {
        console.warn('Firestore write expense error:', err);
      }
    }

    return newExpense;
  };

  const deleteExpense = async (expenseId: string): Promise<void> => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    showToast('Dépense supprimée');

    const db = getFirebaseDb();
    if (db) {
      try {
        await deleteDoc(doc(db, 'expenses', expenseId));
      } catch (e) {
        console.warn('Firestore delete expense error:', e);
      }
    }
  };

  // Daily Ad Spend
  const logDailyAdSpend = async (
    spendData: Omit<DailyAdSpend, 'id' | 'createdAt' | 'cpmDzd' | 'cpaDzd' | 'salesCount'>
  ): Promise<DailyAdSpend> => {
    const todaySales = sales.filter((s) => s.createdAt.startsWith(spendData.date));
    const salesCount = todaySales.length;
    const spendDzd =
      spendData.spendDzd > 0
        ? spendData.spendDzd
        : convertUsdToDzd(spendData.spendUsd, exchangeRate);
    const spendUsd =
      spendData.spendUsd > 0 ? spendData.spendUsd : spendData.spendDzd / exchangeRate;

    const cpmDzd = spendData.messagesCount > 0 ? Math.round(spendDzd / spendData.messagesCount) : 0;
    const cpaDzd = salesCount > 0 ? Math.round(spendDzd / salesCount) : 0;

    const newAdSpend: DailyAdSpend = {
      id: `adspend-${spendData.date}`,
      date: spendData.date,
      spendUsd,
      spendDzd,
      messagesCount: spendData.messagesCount,
      cpmDzd,
      cpaDzd,
      salesCount,
      loggedBy: spendData.loggedBy,
      createdAt: new Date().toISOString(),
      ...(spendData.notes?.trim() ? { notes: spendData.notes.trim() } : {}),
    };

    setDailyAdSpends((prev) => {
      const filtered = prev.filter((a) => a.date !== spendData.date);
      return [newAdSpend, ...filtered];
    });

    showToast(`Meta Ads du ${spendData.date} : ${spendDzd.toLocaleString()} DA (CPM: ${cpmDzd} DA)`);

    const db = getFirebaseDb();
    if (db) {
      try {
        await setDoc(doc(db, 'daily_ad_spends', newAdSpend.id), cleanForFirestore(newAdSpend));
      } catch (err) {
        console.warn('Firestore write ad spend error:', err);
      }
    }

    return newAdSpend;
  };

  const deleteDailyAdSpend = async (spendId: string): Promise<void> => {
    setDailyAdSpends((prev) => prev.filter((d) => d.id !== spendId));
    showToast('Dépense publicitaire supprimée');

    const db = getFirebaseDb();
    if (db) {
      try {
        await deleteDoc(doc(db, 'daily_ad_spends', spendId));
      } catch (e) {
        console.warn('Firestore delete ad spend error:', e);
      }
    }
  };

  // Caisse Operations (Ouverture / Clôture)
  const openCaisse = async (initialBalanceDzd: number, initialBalanceUsd: number): Promise<DailyCaisse> => {
    const today = new Date().toISOString().split('T')[0];
    const newCaisse: DailyCaisse = {
      id: `caisse-${Date.now()}`,
      date: today,
      status: 'open',
      openedAt: new Date().toISOString(),
      openedBy: activePartner,
      initialBalanceDzd,
      initialBalanceUsd,
    };

    setDailyCaisses((prev) => [newCaisse, ...prev]);
    showToast(`Caisse ouverte — Capital : ${initialBalanceDzd.toLocaleString()} DA`);

    const db = getFirebaseDb();
    if (db) {
      try {
        await setDoc(doc(db, 'daily_caisses', newCaisse.id), cleanForFirestore(newCaisse));
      } catch (err) {
        console.warn('Firestore open caisse error:', err);
      }
    }

    return newCaisse;
  };

  const closeCaisse = async (
    caisseId: string,
    closingBalanceDzd: number,
    closingBalanceUsd: number,
    notes?: string
  ): Promise<void> => {
    const caisse = dailyCaisses.find((c) => c.id === caisseId);
    if (!caisse) return;

    const shiftSales = sales.filter(
      (s) => new Date(s.createdAt) >= new Date(caisse.openedAt) && s.paymentStatus !== 'pending'
    );
    const totalSalesDzd = shiftSales.reduce((sum, s) => sum + s.sellingPriceDzd, 0);

    const shiftExpenses = expenses.filter(
      (e) => new Date(e.createdAt) >= new Date(caisse.openedAt)
    );
    const totalExpensesDzd = shiftExpenses.reduce((sum, e) => sum + e.amountDzd, 0);

    const expectedBalanceDzd = caisse.initialBalanceDzd + totalSalesDzd - totalExpensesDzd;

    const updatedCaisse: DailyCaisse = {
      ...caisse,
      status: 'closed',
      closedAt: new Date().toISOString(),
      closedBy: activePartner,
      closingBalanceDzd,
      closingBalanceUsd,
      expectedBalanceDzd,
      totalSalesDzd,
      totalExpensesDzd,
      ...(notes?.trim() ? { notes: notes.trim() } : {}),
    };

    setDailyCaisses((prev) => prev.map((c) => (c.id === caisseId ? updatedCaisse : c)));
    showToast('Caisse clôturée. Bilan enregistré.');

    const db = getFirebaseDb();
    if (db) {
      try {
        await setDoc(doc(db, 'daily_caisses', caisseId), cleanForFirestore(updatedCaisse));
      } catch (err) {
        console.warn('Firestore close caisse error:', err);
      }
    }
  };

  // Push all local data to Firestore
  const syncAllDataToCloud = async (): Promise<void> => {
    const db = getFirebaseDb();
    if (!db) {
      showToast('Firebase cloud sync est hors ligne');
      return;
    }

    showToast('Synchronisation en cours...');
    try {
      for (const p of products) {
        await setDoc(doc(db, 'products', p.id), cleanForFirestore(p));
      }
      for (const s of sales) {
        await setDoc(doc(db, 'sales', s.id), cleanForFirestore(s));
      }
      for (const e of expenses) {
        await setDoc(doc(db, 'expenses', e.id), cleanForFirestore(e));
      }
      for (const a of dailyAdSpends) {
        await setDoc(doc(db, 'daily_ad_spends', a.id), cleanForFirestore(a));
      }
      for (const c of dailyCaisses) {
        await setDoc(doc(db, 'daily_caisses', c.id), cleanForFirestore(c));
      }
      await setDoc(doc(db, 'crm_settings', 'exchange_rate'), {
        rate: exchangeRate,
        updatedAt: new Date().toISOString(),
      });
      showToast('Cloud synchronisé avec succès !');
    } catch (err: any) {
      console.error('Cloud sync error:', err);
      showToast(`Erreur de sync : ${err.message || 'Vérifiez les règles Firestore'}`);
    }
  };

  // resetToFresh — hard reset to totally empty state (no demo data injection)
  const resetToFresh = () => {
    setSales([]);
    setProducts([]);
    setExpenses([]);
    setDailyAdSpends([]);
    setDailyCaisses([]);
    setStartingCapitalDzd(0);
    setIsConfigured(false);
    setIsInitialSetupOpen(true);

    localStorage.removeItem('crm_business_configured');
    localStorage.removeItem('crm_starting_capital');
    localStorage.removeItem('crm_sales_v3');
    localStorage.removeItem('crm_products_v3');
    localStorage.removeItem('crm_expenses_v1');
    localStorage.removeItem('crm_ad_spends_v1');
    localStorage.removeItem('crm_caisses_v1');

    showToast('CRM réinitialisé à zéro. Configurez votre capital initial.');
  };

  // completeInitialSetup — called by wizard when user sets their real balance + product
  const completeInitialSetup = async (
    initialBalance: number,
    prodName: string,
    prodPrice: number,
    rawLinks?: string
  ) => {
    setStartingCapitalDzd(initialBalance);
    setIsConfigured(true);
    setIsInitialSetupOpen(false);

    try {
      localStorage.setItem('crm_business_configured', 'true');
      localStorage.setItem('crm_starting_capital', String(initialBalance));

      const initialKeys = rawLinks
        ? rawLinks
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean)
        : [];

      const cleanName = prodName.trim();
      if (cleanName) {
        const newProd: Product = {
          id: `prod-${Date.now()}`,
          name: cleanName,
          category: 'Digital',
          defaultCostUsd: 0,
          defaultSellingDzd: prodPrice,
          stockKeys: initialKeys,
          stockItems: initialKeys.map((k, i) => ({
            id: `stk-${Date.now()}-${i}`,
            keyOrLink: k,
            addedAt: new Date().toISOString(),
          })),
          lowStockThreshold: 2,
          createdAt: new Date().toISOString(),
        };

        setProducts([newProd]);
        localStorage.setItem('crm_products_v3', JSON.stringify([newProd]));

        const db = getFirebaseDb();
        if (db) {
          setDoc(doc(db, 'products', newProd.id), cleanForFirestore(newProd)).catch(() => {});
          setDoc(doc(db, 'crm_settings', 'starting_capital'), {
            value: initialBalance,
            updatedAt: new Date().toISOString(),
          }).catch(() => {});
          setDoc(doc(db, 'crm_settings', 'business_config'), cleanForFirestore({
            isConfigured: true,
            startingCapitalDzd: initialBalance,
            configuredAt: new Date().toISOString(),
          })).catch(() => {});
        }
      }

      // Start fresh with empty sales — user starts from today
      setSales([]);
      localStorage.setItem('crm_sales_v3', JSON.stringify([]));

    } catch (err) {
      console.error('Setup save error:', err);
    }

    showToast(`Configuration validée ! Capital initial : ${initialBalance.toLocaleString()} DA 🎉`);
  };

  const resetBusinessSetup = () => {
    resetToFresh();
  };

  const financials = useMemo(() => {
    return calculateSummary(sales, exchangeRate, expenses, dailyAdSpends, startingCapitalDzd);
  }, [sales, exchangeRate, expenses, dailyAdSpends, startingCapitalDzd]);

  // Stock Alert: Products with low or zero stock
  const lowStockProducts = useMemo(() => {
    return products
      .filter((p) => p && typeof p.name === 'string' && p.name.trim().length > 0)
      .filter((p) => (p.stockKeys?.length || 0) <= (p.lowStockThreshold ?? 2));
  }, [products]);

  // Stock items expiring within 24 hours or already expired
  const expiringStockItems = useMemo(() => {
    const in24h = new Date(Date.now() + 24 * 3600 * 1000);
    const now = new Date();
    return products
      .flatMap((p) =>
        (p.stockItems || [])
          .filter((item) => item.expiresAt)
          .map((item) => ({
            ...item,
            productName: p.name,
            productId: p.id,
            isExpired: new Date(item.expiresAt!) <= now,
            isExpiringSoon: new Date(item.expiresAt!) <= in24h && new Date(item.expiresAt!) > now,
          }))
      )
      .filter((item) => item.isExpired || item.isExpiringSoon);
  }, [products]);

  // Update starting capital
  const updateStartingCapital = async (val: number): Promise<void> => {
    if (isNaN(val) || val < 0) return;
    setStartingCapitalDzd(val);
    localStorage.setItem('crm_starting_capital', String(val));
    showToast(`Capital BaridiMob mis à jour : ${val.toLocaleString()} DA`);
    const db = getFirebaseDb();
    if (db) {
      try {
        await setDoc(doc(db, 'crm_settings', 'starting_capital'), {
          value: val,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Firestore capital save error:', err);
      }
    }
  };

  // Remove a single stock key/link from a product
  const removeStockKey = async (productId: string, keyOrLink: string): Promise<void> => {
    let updatedKeys: string[] = [];
    let updatedItems: StockItem[] = [];

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        updatedItems = (p.stockItems || []).filter((item) => item.keyOrLink !== keyOrLink);
        updatedKeys = updatedItems.map((item) => item.keyOrLink);
        if ((p.stockItems || []).length === 0) {
          updatedKeys = (p.stockKeys || []).filter((k) => k !== keyOrLink);
        }
        return { ...p, stockKeys: updatedKeys, stockItems: updatedItems };
      })
    );

    showToast('Lien supprimé du stock.');

    const db = getFirebaseDb();
    if (db) {
      setDoc(
        doc(db, 'products', productId),
        cleanForFirestore({ stockKeys: updatedKeys, stockItems: updatedItems }),
        { merge: true }
      ).catch(() => {});
    }
  };

  const removeExpiredStockKeys = async (productId: string): Promise<void> => {
    const now = new Date();
    let updatedKeys: string[] = [];
    let updatedItems: StockItem[] = [];

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        updatedItems = (p.stockItems || []).filter(
          (item) => !item.expiresAt || new Date(item.expiresAt) > now
        );
        updatedKeys = updatedItems.map((item) => item.keyOrLink);
        return { ...p, stockKeys: updatedKeys, stockItems: updatedItems };
      })
    );
    showToast('Liens expirés supprimés du stock.');

    const db = getFirebaseDb();
    if (db) {
      setDoc(
        doc(db, 'products', productId),
        cleanForFirestore({ stockKeys: updatedKeys, stockItems: updatedItems }),
        { merge: true }
      ).catch(() => {});
    }
  };

  return (
    <CRMDataContext.Provider
      value={{
        sales,
        products,
        lowStockProducts,
        expiringStockItems,
        removeExpiredStockKeys,
        removeStockKey,
        expenses,
        dailyAdSpends,
        dailyCaisses,
        activeCaisse,
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
        isExpenseModalOpen,
        openExpenseModal,
        closeExpenseModal,
        isAdSpendModalOpen,
        openAdSpendModal,
        closeAdSpendModal,
        isCaisseModalOpen,
        openCaisseModal,
        closeCaisseModal,
        isStockImportModalOpen,
        openStockImportModal,
        closeStockImportModal,
        toastMessage,
        showToast,
        addSale,
        markSaleAsPaid,
        deleteSale,
        addProduct,
        deleteProduct,
        addStockKeys,
        bulkImportKeys,
        addExpense,
        deleteExpense,
        logDailyAdSpend,
        deleteDailyAdSpend,
        openCaisse,
        closeCaisse,
        updateExchangeRate,
        syncAllDataToCloud,
        resetToFresh,
        resetToDefault: resetBusinessSetup,
        startingCapitalDzd,
        setStartingCapitalDzd,
        updateStartingCapital,
        isConfigured,
        isInitialSetupOpen,
        openInitialSetup,
        closeInitialSetup,
        completeInitialSetup,
        resetBusinessSetup,
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
