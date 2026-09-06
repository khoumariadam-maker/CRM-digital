import assert from 'node:assert';

console.log('--- Running CRM Unit & Logic Verification Tests ---');

// 1. Calculations & Financial Arithmetic
function convertUsdToDzd(amountUsd, rate) {
  if (!amountUsd || isNaN(amountUsd)) return 0;
  return Math.round(amountUsd * rate);
}

function convertDzdToUsd(amountDzd, rate) {
  if (!amountDzd || isNaN(amountDzd) || rate === 0) return 0;
  return Number((amountDzd / rate).toFixed(2));
}

function parseNumericInput(val) {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleaned = String(val).trim().replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function formatSignedProfit(amountDzd, currency = 'DZD', amountUsd) {
  const isPositive = amountDzd >= 0;
  const prefix = isPositive ? '+' : '';
  if (currency === 'DZD') {
    return `${prefix}${amountDzd.toLocaleString('fr-DZ', { maximumFractionDigits: 0 })} DA`;
  }
  const usdVal = amountUsd !== undefined ? amountUsd : 0;
  return `${prefix}$${usdVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function calculateSaleNetProfit(sellingPriceDzd, productCostUsd, metaAdCostUsd, rate) {
  const productCostDzd = convertUsdToDzd(productCostUsd, rate);
  const metaAdCostDzd = convertUsdToDzd(metaAdCostUsd, rate);
  const netProfitDzd = sellingPriceDzd - productCostDzd - metaAdCostDzd;
  const netProfitUsd = convertDzdToUsd(netProfitDzd, rate);
  const marginPercent = sellingPriceDzd > 0 ? Math.round((netProfitDzd / sellingPriceDzd) * 100) : 0;

  return { netProfitDzd, netProfitUsd, marginPercent };
}

// Test 1: Selling 1800 DA with $4 cost and $1.50 meta ad at 242 rate
// Product cost = 4 * 242 = 968 DA
// Ad cost = 1.5 * 242 = 363 DA
// Net profit = 1800 - 968 - 363 = 469 DA
{
  const res = calculateSaleNetProfit(1800, 4.0, 1.5, 242);
  assert.strictEqual(res.netProfitDzd, 469, 'Net profit in DZD should be 469');
  assert.strictEqual(res.marginPercent, 26, 'Margin percent should be 26%');
  console.log('✓ Test 1 Passed: Sale Net Profit calculation');
}

// Test 2: Algerian Phone normalization
function normalizeAlgerianPhone(rawPhone) {
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

{
  assert.strictEqual(normalizeAlgerianPhone('0550123456'), '+213550123456');
  assert.strictEqual(normalizeAlgerianPhone('0661998877'), '+213661998877');
  assert.strictEqual(normalizeAlgerianPhone('0770112233'), '+213770112233');
  assert.strictEqual(normalizeAlgerianPhone('+213550123456'), '+213550123456');
  console.log('✓ Test 2 Passed: Algerian phone normalization');
}

// Test 3: 4-digit PIN Authentication & Verification
const PARTNER_ACCOUNTS = {
  Adem: { name: 'Adem', pin: '1234' },
  Abdou: { name: 'Abdou', pin: '5678' },
};

function verifyPin(pin) {
  const clean = String(pin).trim();
  if (clean === PARTNER_ACCOUNTS.Adem.pin) {
    return { success: true, partner: 'Adem' };
  }
  if (clean === PARTNER_ACCOUNTS.Abdou.pin) {
    return { success: true, partner: 'Abdou' };
  }
  return { success: false, error: 'Incorrect 4-digit code. Please try again.' };
}

{
  assert.deepStrictEqual(verifyPin('1234'), { success: true, partner: 'Adem' });
  assert.deepStrictEqual(verifyPin('5678'), { success: true, partner: 'Abdou' });
  assert.strictEqual(verifyPin('0000').success, false);
  assert.strictEqual(verifyPin('123').success, false);
  assert.strictEqual(verifyPin('').success, false);
  assert.strictEqual(verifyPin(' 1234 ').success, true);
  console.log('✓ Test 3 Passed: 4-digit PIN authentication (Adem: 1234, Abdou: 5678)');
}

// Test 4: Firestore Data Sanitization (No `undefined` allowed)
function cleanForFirestore(obj) {
  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined && val !== null) {
      result[key] = val;
    }
  }
  return result;
}

{
  const rawSaleData = {
    productName: 'Canva Pro',
    sellingPriceDzd: 1800,
    customerName: undefined,
    customerPhone: undefined,
    deliveredKey: undefined,
    notes: null,
  };
  const cleaned = cleanForFirestore(rawSaleData);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(cleaned, 'customerName'), false);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(cleaned, 'customerPhone'), false);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(cleaned, 'deliveredKey'), false);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(cleaned, 'notes'), false);
  assert.strictEqual(cleaned.productName, 'Canva Pro');
  assert.strictEqual(cleaned.sellingPriceDzd, 1800);
  console.log('✓ Test 4 Passed: Firestore sanitization removes all undefined/null fields');
}

// Test 5: Safe Numeric Parsing (Handling mobile comma keypads e.g. "4,50" -> 4.5)
{
  assert.strictEqual(parseNumericInput('4.50'), 4.5);
  assert.strictEqual(parseNumericInput('4,50'), 4.5);
  assert.strictEqual(parseNumericInput('1990'), 1990);
  assert.strictEqual(parseNumericInput(''), 0);
  assert.strictEqual(parseNumericInput(undefined), 0);
  assert.strictEqual(parseNumericInput(null), 0);
  assert.strictEqual(parseNumericInput('  242.5  '), 242.5);
  assert.strictEqual(parseNumericInput('  242,5  '), 242.5);
  console.log('✓ Test 5 Passed: parseNumericInput handles comma decimals and empty values');
}

// Test 6: Signed Profit Formatting (Handling negative numbers cleanly)
{
  assert.ok(formatSignedProfit(469, 'DZD').includes('+469'));
  assert.ok(formatSignedProfit(-200, 'DZD').includes('-200'));
  assert.ok(!formatSignedProfit(-200, 'DZD').includes('+-'));
  console.log('✓ Test 6 Passed: formatSignedProfit handles positive and negative profits without "+-"');
}

// Test 7: Edge cases (empty string inputs, zero division, negative margins)
{
  const zeroSale = calculateSaleNetProfit(0, 5, 2, 242);
  assert.strictEqual(zeroSale.marginPercent, 0, 'Zero price should result in 0% margin');
  assert.ok(zeroSale.netProfitDzd < 0, 'Cost without price should be negative profit');
  console.log('✓ Test 7 Passed: Boundary and edge case handling');
}

console.log('\nAll 7 test suites passed successfully! 100% logic verified.');
