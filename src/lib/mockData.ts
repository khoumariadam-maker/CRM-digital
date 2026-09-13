import { Product } from '@/types/crm';

export const INITIAL_EXCHANGE_RATE = 242; // 1 USD = 242 DZD (Square Market Parallel Rate)

/**
 * INITIAL_PRODUCTS — used ONLY during completeInitialSetup() when the user
 * configures the CRM for the first time. Stock is intentionally empty.
 * Do NOT use this as a Firestore auto-seed.
 */
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: `prod-default-${Date.now()}`,
    name: '',
    category: 'Digital',
    defaultCostUsd: 0,
    defaultSellingDzd: 0,
    stockKeys: [],
    stockItems: [],
    lowStockThreshold: 2,
    description: '',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_SALES: any[] = [];
export const INITIAL_CAISSES: any[] = [];
