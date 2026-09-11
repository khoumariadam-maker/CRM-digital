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
import {
  INITIAL_SALES,
  INITIAL_PRODUCTS,
  INITIAL_EXCHANGE_RATE,
} from '@/lib/mockData';
import { calculateSummary, calculateSaleNetProfit, convertUsdToDzd } from '@/lib/calculations';
import { useCurrency } from './CurrencyContext';
import { useAuth } from './AuthContext';
import { getFirebaseDb } from '@/lib/firebase';
import { SHARED_FIREBASE_CONFIG } from '@/lib/firebaseConfig';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

export type CloudSyncStatus = 'connected' | 'offline' | 'error' | 'syncing';

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
}

const CRMDataContext = createContext<CRMDataContextType | undefined>(undefined);

// Sanitizer to remove any undefined or null keys so Firestore never errors (Zero-Crash Hygiene)
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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dailyAdSpends, setDailyAdSpends] = useState<DailyAdSpend[]>([]);
  const [dailyCaisses, setDailyCaisses] = useState<DailyCaisse[]>([]);
  
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

  // 1. Sync activePartner with authenticated partner
  useEffect(() => {
    if (authPartner === 'Adem' || authPartner === 'Abdou') {
      setActivePartnerState(authPartner);
    }
  }, [authPartner]);

  // 2. Load LocalStorage on mount
  useEffect(() => {
    try {
      const savedSales = localStorage.getItem('crm_sales_v3');
      if (savedSales) {
        const parsed = JSON.parse(savedSales);
        if (Array.isArray(parsed)) setSales(parsed);
      }

      const savedProducts = localStorage.getItem('crm_products_v3');
      if (savedProducts) {
        const parsed = JSON.parse(savedProducts);
        if (Array.isArray(parsed) && parsed.length > 0) setProducts(parsed);
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
        if (Array.isArray(parsed)) setDailyCaisses(parsed);
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

        setSales(firestoreSales);
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
        const firestoreProducts = snapshot.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        })) as Product[];

        if (firestoreProducts.length > 0) {
          setProducts(firestoreProducts);
        }
      },
      (error) => {
        console.warn('Firestore products sync error:', error.message);
      }
    );

    // Sync Expenses from Firestore
    const unsubExpenses = onSnapshot(
      collection(db, 'expenses'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ ...d.data(), id: d.id })) as Expense[];
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setExpenses(list);
      },
      (error) => console.warn('Firestore expenses sync error:', error.message)
    );

    // Sync Daily Ad Spends from Firestore
    const unsubAdSpends = onSnapshot(
      collection(db, 'daily_ad_spends'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ ...d.data(), id: d.id })) as DailyAdSpend[];
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setDailyAdSpends(list);
      },
      (error) => console.warn('Firestore ad spends sync error:', error.message)
    );

    // Sync Daily Caisses from Firestore
    const unsubCaisses = onSnapshot(
      collection(db, 'daily_caisses'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ ...d.data(), id: d.id })) as DailyCaisse[];
        list.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
        setDailyCaisses(list);
      },
      (error) => console.warn('Firestore caisses sync error:', error.message)
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
        }
      },
      (error) => console.warn('Firestore exchange rate error:', error.message)
    );

    return () => {
      unsubSales();
      unsubProducts();
      unsubExpenses();
      unsubAdSpends();
      unsubCaisses();
      unsubRate();
    };
  }, [setExchangeRate]);

  const setActivePartner = (p: PartnerName) => {
    setActivePartnerState(p);
  };

  // Active Open Caisse (if any)
  const activeCaisse = useMemo(() => {
    return dailyCaisses.find((c) => c.status === 'open');
  }, [dailyCaisses]);

  // Update Exchange Rate
  const updateExchangeRate = async (newRate: number): Promise<void> => {
    if (isNaN(newRate) || newRate <= 0) return;
    setExchangeRate(newRate);
    showToast(`Exchange rate: 1$ = ${newRate} DA`);

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

    const saleNumber = `#${Math.floor(100 + Math.random() * 900)}`;
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
        showToast(`Sale ${saleNumber} saved (${newSale.paymentStatus === 'pending' ? '⏳ Pending payment' : '✅ Paid'})!`);
      } catch (err: any) {
        console.warn('Firestore write sale error:', err);
        showToast(`Sale ${saleNumber} saved locally`);
      }
    } else {
      showToast(`Sale ${saleNumber} saved locally!`);
    }

    // Key delivery stock deduction (1 link = 1 item)
    if (data.productId && data.deliveredKey) {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== data.productId) return p;
          const updatedKeys = p.stockKeys.filter((k) => k !== data.deliveredKey);
          const updatedItems = (p.stockItems || []).filter((item) => item.keyOrLink !== data.deliveredKey);
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
    showToast('Payment received & marked as Paid! ✅');

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
    showToast('Sale removed');

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
      createdAt: new Date().toISOString(),
      ...(productData.description?.trim() ? { description: productData.description.trim() } : {}),
    };

    setProducts((prev) => [newProduct, ...prev]);

    const db = getFirebaseDb();
    if (db) {
      try {
        await setDoc(doc(db, 'products', newProduct.id), cleanForFirestore(newProduct));
        showToast(`Product "${newProduct.name}" added`);
      } catch (err: any) {
        console.warn('Firestore write product error:', err);
      }
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

    showToast(`Added ${clean.length} items to stock (${expiresAt ? 'with expiration' : 'permanent'})`);

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

  // Bulk Import Keys across multiple or single products
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

    showToast(`Successfully imported ${totalImported} items into stock! 🎉`);
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
    showToast(`Dépense "${newExpense.title}" (-${newExpense.amountDzd.toLocaleString()} DA) added`);

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
    showToast('Expense removed');

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
    const spendDzd = spendData.spendDzd > 0 ? spendData.spendDzd : convertUsdToDzd(spendData.spendUsd, exchangeRate);
    const spendUsd = spendData.spendUsd > 0 ? spendData.spendUsd : spendData.spendDzd / exchangeRate;
    
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

    showToast(`Ad spend for ${spendData.date} logged (${spendDzd.toLocaleString()} DA, CPM: ${cpmDzd} DA)`);

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
    showToast('Daily ad spend removed');

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
    showToast(`Caisse ouverte par ${activePartner} (+${initialBalanceDzd.toLocaleString()} DA float)`);

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

    // Calculate sales and expenses during this shift
    const shiftSales = sales.filter((s) => new Date(s.createdAt) >= new Date(caisse.openedAt));
    const totalSalesDzd = shiftSales.reduce((sum, s) => sum + s.sellingPriceDzd, 0);
    
    const shiftExpenses = expenses.filter((e) => new Date(e.createdAt) >= new Date(caisse.openedAt));
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
    showToast(`Caisse clôturée par ${activePartner}. Bilan enregistré.`);

    const db = getFirebaseDb();
    if (db) {
      try {
        await setDoc(doc(db, 'daily_caisses', caisseId), cleanForFirestore(updatedCaisse));
      } catch (err) {
        console.warn('Firestore close caisse error:', err);
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
      showToast('Cloud database synchronized successfully!');
    } catch (err: any) {
      console.error('Cloud sync error:', err);
      showToast(`Sync error: ${err.message || 'Check Firestore rules'}`);
    }
  };

  // Clean fresh start (wipes dummy sales and starts fresh)
  const resetToFresh = () => {
    setSales([]);
    setExpenses([]);
    setDailyAdSpends([]);
    setDailyCaisses([]);
    localStorage.removeItem('crm_sales_v3');
    localStorage.removeItem('crm_sales_v2');
    localStorage.removeItem('crm_expenses_v1');
    localStorage.removeItem('crm_ad_spends_v1');
    localStorage.removeItem('crm_caisses_v1');
    showToast('Started completely fresh with clean production records! ✨');
  };

  const resetToDefault = () => {
    setSales(INITIAL_SALES);
    setProducts(INITIAL_PRODUCTS);
    localStorage.removeItem('crm_sales_v3');
    localStorage.removeItem('crm_products_v3');
    showToast('Reset catalog to initial templates');
  };

  const financials = useMemo(() => {
    return calculateSummary(sales, exchangeRate, expenses, dailyAdSpends);
  }, [sales, exchangeRate, expenses, dailyAdSpends]);

  // Stock Alert: Products with low or zero stock (<= threshold or <= 2)
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => (p.stockKeys?.length || 0) <= (p.lowStockThreshold ?? 2));
  }, [products]);

  return (
    <CRMDataContext.Provider
      value={{
        sales,
        products,
        lowStockProducts,
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
