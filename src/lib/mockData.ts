import { Product, Sale, PartnerUser } from '@/types/crm';

export const INITIAL_EXCHANGE_RATE = 242; // 1 USD = 242 DZD (Square Market Parallel Rate)

export const PARTNERS: PartnerUser[] = [
  { id: 'partner-1', name: 'Adem', avatarColor: 'bg-blue-600 text-white' },
  { id: 'partner-2', name: 'Abdou', avatarColor: 'bg-emerald-600 text-white' },
];

// Clean product catalog ready for real inventory
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Canva Pro 1 Year',
    category: 'Software',
    defaultCostUsd: 4.0,
    defaultSellingDzd: 1800,
    stockKeys: [],
    description: 'Team invite activation link for Canva Pro.',
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'prod-2',
    name: 'Windows 11 Pro Key',
    category: 'OS Keys',
    defaultCostUsd: 2.2,
    defaultSellingDzd: 1400,
    stockKeys: [],
    description: 'Permanent activation retail key.',
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'prod-3',
    name: 'ChatGPT Plus Account',
    category: 'AI Tools',
    defaultCostUsd: 4.8,
    defaultSellingDzd: 2200,
    stockKeys: [],
    description: '1 month shared profile with GPT-4o.',
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'prod-4',
    name: 'IPTV 4K 12 Months',
    category: 'Streaming',
    defaultCostUsd: 8.5,
    defaultSellingDzd: 3800,
    stockKeys: [],
    description: 'Full sports & movies package.',
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'prod-5',
    name: 'CapCut Pro 1 Year',
    category: 'Software',
    defaultCostUsd: 5.5,
    defaultSellingDzd: 2500,
    stockKeys: [],
    description: 'Full pro filters & desktop auto-captions.',
    createdAt: '2026-09-01T10:00:00Z',
  },
];

// Fresh start: Zero dummy/showcase sales
export const INITIAL_SALES: Sale[] = [];
