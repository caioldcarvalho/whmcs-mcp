/**
 * Presentation helpers for WHMCS product payloads.
 *
 * Kept out of index.ts so the pricing and slimming rules can be unit-tested
 * without booting the stdio server.
 */

// WHMCS bills a product on one of six cycles and reports a matching setup fee
// for each. A cycle priced at -1 is disabled for that product.
const BILLING_CYCLES: Array<{ price: string; setup: string; label: string }> = [
  { price: 'monthly', setup: 'msetupfee', label: 'mo' },
  { price: 'quarterly', setup: 'qsetupfee', label: 'qtr' },
  { price: 'semiannually', setup: 'ssetupfee', label: '6mo' },
  { price: 'annually', setup: 'asetupfee', label: 'yr' },
  { price: 'biennially', setup: 'bsetupfee', label: '2yr' },
  { price: 'triennially', setup: 'tsetupfee', label: '3yr' },
];

function isEnabledPrice(value: unknown): boolean {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0;
}

/**
 * Renders the pricing block WHMCS returns per currency into one compact cell,
 * e.g. `R$ 49.90/mo, R$ 499.00/yr (+R$ 100.00 setup/yr)`. Only enabled cycles
 * are listed; a product with no enabled cycle reads as `free` or `-`.
 */
export function formatProductPricing(pricing: unknown): string {
  if (!pricing || typeof pricing !== 'object') {
    return '-';
  }

  const currencies = Object.entries(pricing as Record<string, any>);
  if (!currencies.length) {
    return '-';
  }

  // The first currency WHMCS returns is the installation default.
  const [code, prices] = currencies[0];
  if (!prices || typeof prices !== 'object') {
    return '-';
  }

  // WHMCS ships the prefix with its trailing space ("R$ "), so keep it as-is.
  // The suffix repeats the currency code ("US$ 10.00 USD"), so it only earns
  // its place when there is no prefix to identify the currency.
  const prefix = String(prices.prefix ?? '');
  const suffix = String(prices.suffix ?? '').trim();
  const money = (value: unknown) =>
    prefix ? `${prefix}${String(value)}` : `${suffix || code} ${String(value)}`;

  const parts: string[] = [];
  const setups: string[] = [];
  let allZero = true;

  for (const cycle of BILLING_CYCLES) {
    const price = prices[cycle.price];
    if (!isEnabledPrice(price)) continue;
    parts.push(`${money(price)}/${cycle.label}`);
    if (Number(price) > 0) {
      allZero = false;
    }

    const setup = prices[cycle.setup];
    if (isEnabledPrice(setup) && Number(setup) > 0) {
      setups.push(`${money(setup)} setup/${cycle.label}`);
    }
  }

  if (!parts.length) {
    return '-';
  }

  const summary = allZero && !setups.length ? 'free' : parts.join(', ');
  return setups.length ? `${summary} (+${setups.join(', ')})` : summary;
}

/**
 * Product descriptions are store HTML and dominate the payload — the full
 * catalogue runs to hundreds of KB, most of it markup no caller asked for.
 * Config options and custom fields are similarly bulky. Strip them unless the
 * caller opted into the full record.
 */
export function slimProducts<T>(result: T, includeFullDetails: boolean): T {
  if (includeFullDetails) {
    return result;
  }

  const products = (result as any)?.products?.product;
  if (!Array.isArray(products)) {
    return result;
  }

  return {
    ...result,
    products: {
      product: products.map(({ description, configoptions, customfields, ...rest }: any) => rest),
    },
  };
}
