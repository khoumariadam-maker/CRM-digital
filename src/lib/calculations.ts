import { Currency, Sale, Expense, DailyAdSpend, FinancialSummary } from '@/types/crm';

export function convertUsdToDzd(amountUsd: number, rate: number): number {
  if (!amountUsd || isNaN(amountUsd)) return 0;
  return Math.round(amountUsd * rate);
}

export function convertDzdToUsd(amountDzd: number, rate: number): number {
  if (!amountDzd || isNaN(amountDzd) || rate === 0) return 0;
  return Number((amountDzd / rate).toFixed(2));
}

export function parseNumericInput(val: string | number | undefined | null): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleaned = val.trim().replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatMoney(amount: number, currency: Currency): string {
  const safe = isNaN(amount) ? 0 : amount;
  if (currency === 'DZD') {
    return `${safe.toLocaleString('fr-DZ', { maximumFractionDigits: 0 })} DA`;
  }
  return `$${safe.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatSignedProfit(amountDzd: number, currency: Currency, amountUsd?: number): string {
  const isPositive = amountDzd >= 0;
  const prefix = isPositive ? '+' : '';
  if (currency === 'DZD') {
    return `${prefix}${amountDzd.toLocaleString('fr-DZ', { maximumFractionDigits: 0 })} DA`;
  }
  const usdVal = amountUsd !== undefined ? amountUsd : 0;
  return `${prefix}$${usdVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function normalizeAlgerianPhone(rawPhone?: string): string {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.startsWith('213')) return `+${digits}`;
  if (digits.startsWith('0') && (digits.startsWith('05') || digits.startsWith('06') || digits.startsWith('07'))) {
    return `+213${digits.substring(1)}`;
  }
  if (digits.length === 9 && (digits.startsWith('5') || digits.startsWith('6') || digits.startsWith('7'))) {
    return `+213${digits}`;
  }
  return rawPhone;
}

export function generateWhatsAppLink(phone?: string, message?: string): string {
  if (!phone) return '#';
  const clean = normalizeAlgerianPhone(phone).replace(/\+/g, '');
  if (!clean) return '#';
  const encoded = message ? encodeURIComponent(message) : '';
  return `https://wa.me/${clean}${encoded ? `?text=${encoded}` : ''}`;
}

export function calculateSaleNetProfit(
  sellingPriceDzd: number,
  productCostUsd: number,
  rate: number,
  metaAdCostUsd: number = 0
): { netProfitDzd: number; netProfitUsd: number; marginPercent: number } {
  const productCostDzd = convertUsdToDzd(productCostUsd, rate);
  const metaAdCostDzd = convertUsdToDzd(metaAdCostUsd, rate);
  const netProfitDzd = sellingPriceDzd - productCostDzd - metaAdCostDzd;
  const netProfitUsd = convertDzdToUsd(netProfitDzd, rate);
  const marginPercent = sellingPriceDzd > 0 ? Math.round((netProfitDzd / sellingPriceDzd) * 100) : 0;

  return {
    netProfitDzd,
    netProfitUsd,
    marginPercent,
  };
}

export function calculateSummary(
  sales: Sale[],
  rate: number,
  expenses: Expense[] = [],
  dailyAdSpends: DailyAdSpend[] = [],
  startingCapitalDzd: number = 0
): FinancialSummary {
  // Segregate paid sales (confirmed cash) from pending sales (crédit / pay later)
  const paidSales = sales.filter((s) => s.paymentStatus !== 'pending');
  const pendingSales = sales.filter((s) => s.paymentStatus === 'pending');

  const totalRevenueDzd = paidSales.reduce((sum, s) => sum + (s.sellingPriceDzd || 0), 0);
  const totalRevenueUsd = convertDzdToUsd(totalRevenueDzd, rate);

  const totalProductCostDzd = paidSales.reduce(
    (sum, s) => sum + convertUsdToDzd(s.productCostUsd || 0, s.exchangeRateUsed || rate),
    0
  );
  const totalProductCostUsd = convertDzdToUsd(totalProductCostDzd, rate);

  // If daily ad spends are logged, use daily total; otherwise fallback to per-sale sum for backwards compatibility
  let totalMetaAdSpendDzd = 0;
  if (dailyAdSpends.length > 0) {
    totalMetaAdSpendDzd = dailyAdSpends.reduce((sum, d) => sum + (d.spendDzd || 0), 0);
  } else {
    totalMetaAdSpendDzd = paidSales.reduce(
      (sum, s) => sum + convertUsdToDzd(s.metaAdCostUsd || 0, s.exchangeRateUsed || rate),
      0
    );
  }
  const totalMetaAdSpendUsd = convertDzdToUsd(totalMetaAdSpendDzd, rate);

  // Total Expenses (Dépenses)
  const totalExpensesDzd = expenses.reduce((sum, e) => {
    if (e.currency === 'USD') {
      return sum + convertUsdToDzd(e.amountUsd || 0, rate);
    }
    return sum + (e.amountDzd || 0);
  }, 0);
  const totalExpensesUsd = convertDzdToUsd(totalExpensesDzd, rate);

  // True Net Profit (Collected Cash Profit strictly from Confirmed Sales)
  const netProfitDzd = totalRevenueDzd - totalProductCostDzd - totalMetaAdSpendDzd - totalExpensesDzd;
  const netProfitUsd = convertDzdToUsd(netProfitDzd, rate);

  const profitMarginPercent = totalRevenueDzd > 0 ? Math.round((netProfitDzd / totalRevenueDzd) * 100) : 0;

  // Actual Current BaridiMob Capital
  const baridiMobCurrentBalanceDzd = startingCapitalDzd + netProfitDzd;

  // Today's isolated metrics
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayPaidSales = paidSales.filter((s) => s.createdAt.startsWith(todayDateStr));
  const todayRevenueDzd = todayPaidSales.reduce((sum, s) => sum + (s.sellingPriceDzd || 0), 0);
  const todayProductCostDzd = todayPaidSales.reduce(
    (sum, s) => sum + convertUsdToDzd(s.productCostUsd || 0, s.exchangeRateUsed || rate),
    0
  );
  const todayAdsDzd = dailyAdSpends
    .filter((a) => a.date === todayDateStr)
    .reduce((sum, a) => sum + (a.spendDzd || 0), 0);
  const todayExpensesDzd = expenses
    .filter((e) => (e.date || e.createdAt).startsWith(todayDateStr))
    .reduce(
      (sum, e) => sum + (e.currency === 'USD' ? convertUsdToDzd(e.amountUsd || 0, rate) : (e.amountDzd || 0)),
      0
    );
  const todayProfitDzd = todayRevenueDzd - todayProductCostDzd - todayAdsDzd - todayExpensesDzd;

  // Upcoming / Pending Payments (Accounts Receivable)
  const pendingPaymentsCount = pendingSales.length;
  const pendingPaymentsAmountDzd = pendingSales.reduce((sum, s) => sum + (s.sellingPriceDzd || 0), 0);

  // Breakdown by partner (Adem & Abdou) strictly from paid sales
  const ademSales = paidSales.filter((s) => s.soldBy === 'Adem');
  const abdouSales = paidSales.filter((s) => s.soldBy === 'Abdou');

  const ademGrossSalesProfit = ademSales.reduce(
    (sum, s) => sum + (s.sellingPriceDzd - convertUsdToDzd(s.productCostUsd || 0, s.exchangeRateUsed || rate)),
    0
  );
  const abdouGrossSalesProfit = abdouSales.reduce(
    (sum, s) => sum + (s.sellingPriceDzd - convertUsdToDzd(s.productCostUsd || 0, s.exchangeRateUsed || rate)),
    0
  );

  // Split shared overhead (ads + expenses) equally between partners
  const sharedOverheadDzd = totalMetaAdSpendDzd + totalExpensesDzd;
  const ademProfitDzd = Math.round(ademGrossSalesProfit - sharedOverheadDzd / 2);
  const abdouProfitDzd = Math.round(abdouGrossSalesProfit - sharedOverheadDzd / 2);

  const salesCount = paidSales.length;
  const averageSaleProfitDzd = salesCount > 0 ? Math.round(netProfitDzd / salesCount) : 0;

  // Message & Ad metrics
  const totalMessagesCount = dailyAdSpends.reduce((sum, d) => sum + (d.messagesCount || 0), 0);
  const averageCpmDzd = totalMessagesCount > 0 ? Math.round(totalMetaAdSpendDzd / totalMessagesCount) : 0;

  return {
    totalRevenueDzd,
    totalRevenueUsd,
    totalProductCostDzd,
    totalProductCostUsd,
    totalMetaAdSpendDzd,
    totalMetaAdSpendUsd,
    totalExpensesDzd,
    totalExpensesUsd,
    netProfitDzd,
    netProfitUsd,
    profitMarginPercent,
    salesCount,
    paidSalesCount: paidSales.length,
    pendingPaymentsCount,
    pendingPaymentsAmountDzd,
    ademSalesCount: ademSales.length,
    abdouSalesCount: abdouSales.length,
    ademProfitDzd,
    abdouProfitDzd,
    averageSaleProfitDzd,
    totalMessagesCount,
    averageCpmDzd,
    baridiMobCurrentBalanceDzd,
    todayProfitDzd,
  };
}

export interface ParsedStockItem {
  productName?: string;
  key: string;
}

/**
 * Parses raw text from CSV file or clipboard paste.
 * Supports:
 * 1. Comma / semicolon / tab separated: "Canva Pro, https://canva.com/brand/join?..."
 * 2. Raw list of keys/links (one per line) for a selected product.
 */
export function parseImportedStock(rawText: string, defaultProductName?: string): ParsedStockItem[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  const results: ParsedStockItem[] = [];

  for (const line of lines) {
    // Check if line contains a separator (comma, semicolon, or tab)
    let parts: string[] = [];
    if (line.includes('\t')) {
      parts = line.split('\t').map((p) => p.trim());
    } else if (line.includes(';')) {
      parts = line.split(';').map((p) => p.trim());
    } else if (line.includes(',')) {
      // Avoid splitting inside URLs if comma appears in URL query
      const firstCommaIdx = line.indexOf(',');
      parts = [line.slice(0, firstCommaIdx).trim(), line.slice(firstCommaIdx + 1).trim()];
    }

    if (parts.length >= 2 && parts[0].length > 0 && parts[1].length > 0) {
      // Ignore header row if present (e.g. "Product, Link" or "Name, Key")
      const lower0 = parts[0].toLowerCase();
      const lower1 = parts[1].toLowerCase();
      if ((lower0 === 'product' || lower0 === 'produit' || lower0 === 'name') &&
          (lower1 === 'key' || lower1 === 'link' || lower1 === 'activation' || lower1 === 'cle')) {
        continue;
      }
      results.push({
        productName: parts[0],
        key: parts[1],
      });
    } else {
      // Single key / link per line
      results.push({
        productName: defaultProductName,
        key: line,
      });
    }
  }

  return results;
}
