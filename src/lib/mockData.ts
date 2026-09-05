import { Product, Sale, PartnerUser } from '@/types/crm';

export const INITIAL_EXCHANGE_RATE = 242; // 1 USD = 242 DZD

export const PARTNERS: PartnerUser[] = [
  { id: 'partner-1', name: 'Adem', avatarColor: 'bg-blue-600 text-white' },
  { id: 'partner-2', name: 'Abdou', avatarColor: 'bg-emerald-600 text-white' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Canva Pro 1 Year',
    category: 'Software',
    defaultCostUsd: 4.0,
    defaultSellingDzd: 1800,
    stockKeys: [
      'CANVA-PRO-9842-XLM9-DZ',
      'CANVA-PRO-3319-PLK8-DZ',
      'CANVA-PRO-8710-QQZ2-DZ',
    ],
    description: 'Lifetime team invite link for Canva Pro.',
    createdAt: '2026-08-20T10:00:00Z',
  },
  {
    id: 'prod-2',
    name: 'Windows 11 Pro Key',
    category: 'OS Keys',
    defaultCostUsd: 2.2,
    defaultSellingDzd: 1400,
    stockKeys: [
      'W11P-VK7JG-NPHTM-C97JM-9MPGT',
      'W11P-QN8TG-48JYY-RPH8M-B368P',
    ],
    description: 'Permanent activation retail key.',
    createdAt: '2026-08-22T14:30:00Z',
  },
  {
    id: 'prod-3',
    name: 'ChatGPT Plus Account',
    category: 'AI Tools',
    defaultCostUsd: 4.8,
    defaultSellingDzd: 2200,
    stockKeys: [
      'gpt_vip01@dzmail.com : ProDz2026!#',
    ],
    description: '1 month shared profile with GPT-4o.',
    createdAt: '2026-08-25T09:15:00Z',
  },
  {
    id: 'prod-4',
    name: 'IPTV 4K 12 Months',
    category: 'Streaming',
    defaultCostUsd: 8.5,
    defaultSellingDzd: 3800,
    stockKeys: [
      'user: dz4k_981 | pass: ultra26',
    ],
    description: 'Full sports & movies package.',
    createdAt: '2026-08-27T18:00:00Z',
  },
  {
    id: 'prod-5',
    name: 'CapCut Pro 1 Year',
    category: 'Software',
    defaultCostUsd: 5.5,
    defaultSellingDzd: 2500,
    stockKeys: [
      'capcut_pro_dz1@gmail.com : VideoEditor26',
    ],
    description: 'Full pro filters & desktop auto-captions.',
    createdAt: '2026-08-29T11:20:00Z',
  },
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 'sale-1',
    saleNumber: '#101',
    productName: 'Canva Pro 1 Year',
    productId: 'prod-1',
    sellingPriceDzd: 1800,
    productCostUsd: 4.0, // 968 DA
    metaAdCostUsd: 1.5, // 363 DA
    netProfitDzd: 469, // 1800 - 968 - 363
    soldBy: 'Adem',
    paymentMethod: 'baridimob',
    customerName: 'Karim',
    customerPhone: '0552431890',
    deliveredKey: 'CANVA-PRO-9842-XLM9-DZ',
    exchangeRateUsed: 242,
    createdAt: '2026-09-01T14:20:00Z',
  },
  {
    id: 'sale-2',
    saleNumber: '#102',
    productName: 'Windows 11 Pro Key',
    productId: 'prod-2',
    sellingPriceDzd: 1400,
    productCostUsd: 2.2, // 532 DA
    metaAdCostUsd: 0.8, // 194 DA
    netProfitDzd: 674, // 1400 - 532 - 194
    soldBy: 'Abdou',
    paymentMethod: 'baridimob',
    customerName: 'Amine',
    customerPhone: '0661908234',
    deliveredKey: 'W11P-VK7JG-NPHTM-C97JM-9MPGT',
    exchangeRateUsed: 242,
    createdAt: '2026-09-02T16:45:00Z',
  },
  {
    id: 'sale-3',
    saleNumber: '#103',
    productName: 'IPTV 4K 12 Months',
    productId: 'prod-4',
    sellingPriceDzd: 3800,
    productCostUsd: 8.5, // 2057 DA
    metaAdCostUsd: 2.0, // 484 DA
    netProfitDzd: 1259, // 3800 - 2057 - 484
    soldBy: 'Adem',
    paymentMethod: 'ccp',
    customerName: 'Sofiane',
    customerPhone: '0770341299',
    deliveredKey: 'user: dz4k_981 | pass: ultra26',
    exchangeRateUsed: 242,
    createdAt: '2026-09-03T18:10:00Z',
  },
  {
    id: 'sale-4',
    saleNumber: '#104',
    productName: 'ChatGPT Plus Account',
    productId: 'prod-3',
    sellingPriceDzd: 2200,
    productCostUsd: 4.8, // 1162 DA
    metaAdCostUsd: 1.2, // 290 DA
    netProfitDzd: 748, // 2200 - 1162 - 290
    soldBy: 'Abdou',
    paymentMethod: 'baridimob',
    customerName: 'Client IG',
    exchangeRateUsed: 242,
    createdAt: '2026-09-04T11:30:00Z',
  },
  {
    id: 'sale-5',
    saleNumber: '#105',
    productName: 'CapCut Pro 1 Year',
    productId: 'prod-5',
    sellingPriceDzd: 2500,
    productCostUsd: 5.5, // 1331 DA
    metaAdCostUsd: 1.8, // 436 DA
    netProfitDzd: 733, // 2500 - 1331 - 436
    soldBy: 'Adem',
    paymentMethod: 'baridimob',
    customerName: 'Nadia',
    customerPhone: '0560112233',
    exchangeRateUsed: 242,
    createdAt: '2026-09-05T13:15:00Z',
  },
];
