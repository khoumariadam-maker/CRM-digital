export type Currency = 'DZD' | 'USD';

export type PartnerName = 'Adem' | 'Abdou';

export type PaymentMethod = 
  | 'baridimob' 
  | 'ccp' 
  | 'banque' 
  | 'redotpay' 
  | 'binance' 
  | 'cash' 
  | 'paysera' 
  | 'wise';

export type PaymentStatus = 'paid' | 'pending';

export interface PartnerUser {
  id: string;
  name: PartnerName;
  avatarColor: string;
}

export interface BusinessConfig {
  isConfigured: boolean;
  startingCapitalDzd: number;
  businessName: string;
  defaultProductName: string;
  defaultProductPriceDzd: number;
  configuredAt?: string;
}

export interface Sale {
  id: string;
  saleNumber: string; // e.g. #1042
  productName: string;
  productId?: string;
  sellingPriceDzd: number; // Customer price in DA
  productCostUsd: number; // Purchase / sourcing cost in USD
  metaAdCostUsd?: number; // Legacy or per-sale ad cost (optional now)
  netProfitDzd: number; // Gross profit for this sale: sellingPriceDzd - (productCostUsd * rate)
  soldBy?: PartnerName | string; // Optional partner attribution
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus; // 'paid' | 'pending' (upcoming payment / crédit)
  pendingNote?: string; // e.g. "Will pay tonight via BaridiMob"
  customerName?: string; // Optional
  customerPhone?: string; // Optional
  deliveredKey?: string; // Optional license key or credentials
  notes?: string; // Optional
  exchangeRateUsed: number;
  createdAt: string;
}

export interface StockItem {
  id: string;
  keyOrLink: string;
  addedAt: string;
  expiresAt?: string; // Optional ISO expiration timestamp
}

export interface Product {
  id: string;
  name: string;
  category: string;
  defaultCostUsd: number; // Default purchase cost
  defaultSellingDzd: number; // Default selling price
  stockKeys: string[]; // Unused keys/links (1 link = 1 stock item)
  stockItems?: StockItem[]; // Detailed items with addedAt and optional expiration
  lowStockThreshold?: number; // Alert threshold (defaults to 2)
  description?: string;
  createdAt: string;
}

export type ExpenseCategory = 'ads' | 'proxy' | 'tools' | 'supplier' | 'cards' | 'other';

export interface Expense {
  id: string;
  title: string;
  amountDzd: number;
  amountUsd?: number;
  currency: Currency;
  category: ExpenseCategory;
  paidBy: PartnerName;
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
}

export interface DailyAdSpend {
  id: string;
  date: string; // YYYY-MM-DD
  spendUsd: number;
  spendDzd: number;
  messagesCount: number;
  cpmDzd: number; // Cost per message in DA
  cpaDzd: number; // Cost per acquired sale in DA
  salesCount: number; // Number of sales logged that day
  loggedBy: PartnerName;
  notes?: string;
  createdAt: string;
}

export interface DailyCaisse {
  id: string;
  date: string; // YYYY-MM-DD
  status: 'open' | 'closed';
  openedAt: string;
  openedBy: PartnerName;
  initialBalanceDzd: number; // Opening cash / BaridiMob float in DA
  initialBalanceUsd: number; // Opening card balance for ads / stock in USD
  closedAt?: string;
  closedBy?: PartnerName;
  closingBalanceDzd?: number;
  closingBalanceUsd?: number;
  expectedBalanceDzd?: number;
  totalSalesDzd?: number;
  totalExpensesDzd?: number;
  notes?: string;
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
  totalExpensesDzd: number;
  totalExpensesUsd: number;
  netProfitDzd: number;
  netProfitUsd: number;
  profitMarginPercent: number;
  salesCount: number;
  paidSalesCount: number;
  pendingPaymentsCount: number;
  pendingPaymentsAmountDzd: number;
  ademSalesCount: number;
  abdouSalesCount: number;
  ademProfitDzd: number;
  abdouProfitDzd: number;
  averageSaleProfitDzd: number;
  totalMessagesCount: number;
  averageCpmDzd: number;
  baridiMobCurrentBalanceDzd?: number;
  todayProfitDzd?: number;
}
