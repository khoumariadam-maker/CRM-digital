'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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
  PARTNERS,
} from '@/lib/mockData';
import { calculateSummary, calculateSaleNetProfit, convertUsdToDzd } from '@/lib/calculations';
import { useCurrency } from './CurrencyContext';
import { getFirebaseDb, saveFirebaseConfig, getFirebaseConfig } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

interface CRMDataContextType {
  sales: Sale[];
  products: Product[];
  activePartner: PartnerName;
  setActivePartner: (p: PartnerName) => void;
  financials: FinancialSummary;
  isFirebaseConnected: boolean;
  firebaseConfig: FirebaseConfig | null;
  saveConfig: (cfg: FirebaseConfig) => void;
  // Sales
  addSale: (saleData: Omit<Sale, 'id' | 'saleNumber' | 'netProfitDzd' | 'createdAt' | 'exchangeRateUsed'>) => void;
  deleteSale: (saleId: string) => void;
  // Products
  addProduct: (productData: Omit<Product, 'id' | 'createdAt'>) => void;
  deleteProduct: (productId: string) => void;
  addStockKeys: (productId: string, keys: string[]) => void;
  // Backup
  resetToDefault: () => void;
}

const CRMDataContext = createContext<CRMDataContextType | undefined>(undefined);

export function CRMDataProvider({ children }: { children: React.ReactNode }) {
  const { exchangeRate } = useCurrency();

  const [sales, setSales] = useState<Sale[]>(INITIAL_SALES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [activePartner, setActivePartnerState] = useState<PartnerName>('Adem');
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [firebaseConfig, setFirebaseConfigState] = useState<FirebaseConfig | null>(null);
  const [initialized, setInitialized] = useState(false);

  // 1. Load LocalStorage on mount
  useEffect(() => {
    try {
      const savedSales = localStorage.getItem('crm_sales_v2');
      if (savedSales) setSales(JSON.parse(savedSales));

      const savedProducts = localStorage.getItem('crm_products_v2');
      if (savedProducts) setProducts(JSON.parse(savedProducts));

      const savedPartner = localStorage.getItem('crm_active_partner_v2') as PartnerName;
      if (savedPartner === 'Adem' || savedPartner === 'Abdou') {
        setActivePartnerState(savedPartner);
      }

      const cfg = getFirebaseConfig();
      if (cfg) setFirebaseConfigState(cfg);
    } catch (e) {
      console.warn('LocalStorage load error:', e);
    } finally {
      setInitialized(true);
    }
  }, []);

  // 2. Persist to LocalStorage
  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem('crm_sales_v2', JSON.stringify(sales));
    localStorage.setItem('crm_products_v2', JSON.stringify(products));
    localStorage.setItem('crm_active_partner_v2', activePartner);
  }, [sales, products, activePartner, initialized]);

  // 3. Connect to Firebase Firestore if configured
  useEffect(() => {
    const db = getFirebaseDb();
    if (!db) {
      setIsFirebaseConnected(false);
      return;
    }

    setIsFirebaseConnected(true);

    // Sync sales from Firestore
    const unsubSales = onSnapshot(collection(db, 'sales'), (snapshot) => {
      if (!snapshot.empty) {
        const firestoreSales = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as Sale[];
        setSales(firestoreSales);
      }
    });

    // Sync products from Firestore
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      if (!snapshot.empty) {
        const firestoreProducts = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as Product[];
        setProducts(firestoreProducts);
      }
    });

    return () => {
      unsubSales();
      unsubProducts();
    };
  }, [firebaseConfig]);

  const setActivePartner = (p: PartnerName) => {
    setActivePartnerState(p);
  };

  const saveConfig = (cfg: FirebaseConfig) => {
    saveFirebaseConfig(cfg);
    setFirebaseConfigState(cfg);
  };

  // Add Sale
  const addSale = (
    data: Omit<Sale, 'id' | 'saleNumber' | 'netProfitDzd' | 'createdAt' | 'exchangeRateUsed'>
  ) => {
    const { netProfitDzd } = calculateSaleNetProfit(
      data.sellingPriceDzd,
      data.productCostUsd,
      data.metaAdCostUsd,
      exchangeRate
    );

    const saleNumber = `#${Math.floor(100 + Math.random() * 900)}`;
    const newSale: Sale = {
      ...data,
      id: `sale-${Date.now()}`,
      saleNumber,
      netProfitDzd,
      exchangeRateUsed: exchangeRate,
      createdAt: new Date().toISOString(),
    };

    setSales((prev) => [newSale, ...prev]);

    // Save to Firestore if connected
    const db = getFirebaseDb();
    if (db) {
      try {
        setDoc(doc(db, 'sales', newSale.id), newSale);
      } catch (err) {
        console.warn('Firestore write error:', err);
      }
    }

    // If a key was delivered, remove from product vault
    if (data.productId && data.deliveredKey) {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== data.productId) return p;
          return {
            ...p,
            stockKeys: p.stockKeys.filter((k) => k !== data.deliveredKey),
          };
        })
      );
    }
  };

  const deleteSale = (saleId: string) => {
    setSales((prev) => prev.filter((s) => s.id !== saleId));
    const db = getFirebaseDb();
    if (db) {
      try {
        deleteDoc(doc(db, 'sales', saleId));
      } catch (e) {
        console.warn('Firestore delete error:', e);
      }
    }
  };

  // Products
  const addProduct = (productData: Omit<Product, 'id' | 'createdAt'>) => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setProducts((prev) => [newProduct, ...prev]);

    const db = getFirebaseDb();
    if (db) {
      try {
        setDoc(doc(db, 'products', newProduct.id), newProduct);
      } catch (err) {
        console.warn('Firestore write product error:', err);
      }
    }
  };

  const deleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    const db = getFirebaseDb();
    if (db) {
      try {
        deleteDoc(doc(db, 'products', productId));
      } catch (err) {
        console.warn('Firestore delete product error:', err);
      }
    }
  };

  const addStockKeys = (productId: string, keys: string[]) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const clean = keys.map((k) => k.trim()).filter(Boolean);
        return {
          ...p,
          stockKeys: [...p.stockKeys, ...clean],
        };
      })
    );
  };

  const resetToDefault = () => {
    setSales(INITIAL_SALES);
    setProducts(INITIAL_PRODUCTS);
    localStorage.removeItem('crm_sales_v2');
    localStorage.removeItem('crm_products_v2');
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
        firebaseConfig,
        saveConfig,
        addSale,
        deleteSale,
        addProduct,
        deleteProduct,
        addStockKeys,
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
