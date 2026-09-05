export type Currency = 'DZD' | 'USD';

export type PartnerName = 'Adem' | 'Abdou';

export type PaymentMethod = 'baridimob' | 'ccp' | 'paysera' | 'wise' | 'cash';

export interface PartnerUser {
  id: string;
  name: PartnerName;
  avatarColor: string;
}

export interface Sale {
  id: string;
  saleNumber: string; // e.g. #1042
  productName: string;
  productId?: string;
  sellingPriceDzd: number; // Customer price in DA
  productCostUsd: number; // Purchase / sourcing cost in USD
  metaAdCostUsd: number; // Ad spend / lead cost for this sale in USD
  netProfitDzd: number; // Real profit: sellingPriceDzd - (productCostUsd * rate) - (metaAdCostUsd * rate)
  soldBy: PartnerName; // 'Adem' or 'Abdou'
  paymentMethod: PaymentMethod;
  customerName?: string; // Optional
  customerPhone?: string; // Optional
  deliveredKey?: string; // Optional license key or credentials
  notes?: string; // Optional
  exchangeRateUsed: number;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  defaultCostUsd: number; // Default purchase cost
  defaultSellingDzd: number; // Default selling price
  stockKeys: string[]; // Unused keys ready to deliver
  description?: string;
  createdAt: string;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface FinancialSummary {
  totalRevenueDzd: number;
  totalRevenueUsd: number;
  totalProductCostDzd: number;
  totalProductCostUsd: number;
  totalMetaAdSpendDzd: number;
  totalMetaAdSpendUsd: number;
  netProfitDzd: number;
  netProfitUsd: number;
  profitMarginPercent: number;
  salesCount: number;
  ademSalesCount: number;
  abdouSalesCount: number;
  ademProfitDzd: number;
  abdouProfitDzd: number;
  averageSaleProfitDzd: number;
}
