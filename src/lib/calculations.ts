import { Currency, Sale, FinancialSummary } from '@/types/crm';

export function convertUsdToDzd(amountUsd: number, rate: number): number {
  if (!amountUsd || isNaN(amountUsd)) return 0;
  return Math.round(amountUsd * rate);
}

export function convertDzdToUsd(amountDzd: number, rate: number): number {
  if (!amountDzd || isNaN(amountDzd) || rate === 0) return 0;
  return Number((amountDzd / rate).toFixed(2));
}

export function formatMoney(amount: number, currency: Currency): string {
  const safe = isNaN(amount) ? 0 : amount;
  if (currency === 'DZD') {
    return `${safe.toLocaleString('fr-DZ', { maximumFractionDigits: 0 })} DA`;
  }
  return `$${safe.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
  metaAdCostUsd: number,
  rate: number
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

export function calculateSummary(sales: Sale[], rate: number): FinancialSummary {
  const totalRevenueDzd = sales.reduce((sum, s) => sum + (s.sellingPriceDzd || 0), 0);
  const totalRevenueUsd = convertDzdToUsd(totalRevenueDzd, rate);

  const totalProductCostDzd = sales.reduce((sum, s) => sum + convertUsdToDzd(s.productCostUsd || 0, s.exchangeRateUsed || rate), 0);
  const totalProductCostUsd = convertDzdToUsd(totalProductCostDzd, rate);

  const totalMetaAdSpendDzd = sales.reduce((sum, s) => sum + convertUsdToDzd(s.metaAdCostUsd || 0, s.exchangeRateUsed || rate), 0);
  const totalMetaAdSpendUsd = convertDzdToUsd(totalMetaAdSpendDzd, rate);

  const netProfitDzd = totalRevenueDzd - totalProductCostDzd - totalMetaAdSpendDzd;
  const netProfitUsd = convertDzdToUsd(netProfitDzd, rate);

  const profitMarginPercent = totalRevenueDzd > 0 ? Math.round((netProfitDzd / totalRevenueDzd) * 100) : 0;

  // Breakdown by partner (Adem & Abdou)
  const ademSales = sales.filter((s) => s.soldBy === 'Adem');
  const abdouSales = sales.filter((s) => s.soldBy === 'Abdou');

  const ademProfitDzd = ademSales.reduce((sum, s) => sum + (s.netProfitDzd || 0), 0);
  const abdouProfitDzd = abdouSales.reduce((sum, s) => sum + (s.netProfitDzd || 0), 0);

  const averageSaleProfitDzd = sales.length > 0 ? Math.round(netProfitDzd / sales.length) : 0;

  return {
    totalRevenueDzd,
    totalRevenueUsd,
    totalProductCostDzd,
    totalProductCostUsd,
    totalMetaAdSpendDzd,
    totalMetaAdSpendUsd,
    netProfitDzd,
    netProfitUsd,
    profitMarginPercent,
    salesCount: sales.length,
    ademSalesCount: ademSales.length,
    abdouSalesCount: abdouSales.length,
    ademProfitDzd,
    abdouProfitDzd,
    averageSaleProfitDzd,
  };
}
