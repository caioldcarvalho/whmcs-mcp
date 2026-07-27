import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatProductPricing, slimProducts } from '../build/products.js';

function pricing(overrides = {}) {
  return {
    BRL: {
      prefix: 'R$ ',
      suffix: '',
      msetupfee: '0.00',
      qsetupfee: '0.00',
      ssetupfee: '0.00',
      asetupfee: '0.00',
      bsetupfee: '0.00',
      tsetupfee: '0.00',
      monthly: '-1.00',
      quarterly: '-1.00',
      semiannually: '-1.00',
      annually: '-1.00',
      biennially: '-1.00',
      triennially: '-1.00',
      ...overrides,
    },
  };
}

test('formatProductPricing lists only the enabled billing cycles', () => {
  const result = formatProductPricing(pricing({ monthly: '49.90', annually: '499.00' }));

  assert.equal(result, 'R$ 49.90/mo, R$ 499.00/yr');
});

test('formatProductPricing appends non-zero setup fees', () => {
  const result = formatProductPricing(pricing({ monthly: '49.90', msetupfee: '100.00' }));

  assert.equal(result, 'R$ 49.90/mo (+R$ 100.00 setup/mo)');
});

test('formatProductPricing reports a zero-priced product as free', () => {
  assert.equal(formatProductPricing(pricing({ monthly: '0.00' })), 'free');
});

test('formatProductPricing falls back when every cycle is disabled', () => {
  assert.equal(formatProductPricing(pricing()), '-');
  assert.equal(formatProductPricing(undefined), '-');
  assert.equal(formatProductPricing({}), '-');
});

test('formatProductPricing uses the first currency, which is the WHMCS default', () => {
  const result = formatProductPricing({
    USD: { prefix: 'US$ ', suffix: 'USD', monthly: '10.00' },
    BRL: { prefix: 'R$ ', suffix: '', monthly: '50.00' },
  });

  assert.equal(result, 'US$ 10.00/mo');
});

test('formatProductPricing labels the currency when there is no prefix', () => {
  assert.equal(
    formatProductPricing({ USD: { prefix: '', suffix: 'USD', monthly: '10.00' } }),
    'USD 10.00/mo'
  );
  assert.equal(formatProductPricing({ GBP: { monthly: '10.00' } }), 'GBP 10.00/mo');
});

test('slimProducts drops the bulky fields but keeps pricing', () => {
  const result = slimProducts(
    {
      result: 'success',
      products: {
        product: [
          {
            pid: 1,
            name: 'Hosting',
            description: '<p>very long html</p>',
            configoptions: [{ id: 1 }],
            customfields: [{ id: 2 }],
            paytype: 'recurring',
            pricing: pricing({ monthly: '10.00' }),
          },
        ],
      },
    },
    false
  );

  const product = result.products.product[0];
  assert.equal('description' in product, false);
  assert.equal('configoptions' in product, false);
  assert.equal('customfields' in product, false);
  assert.equal(product.paytype, 'recurring');
  assert.ok(product.pricing.BRL);
  assert.equal(result.result, 'success');
});

test('slimProducts returns the untouched payload when full details are requested', () => {
  const payload = {
    products: { product: [{ pid: 1, description: '<p>keep me</p>' }] },
  };

  assert.equal(slimProducts(payload, true), payload);
});

test('slimProducts leaves a payload with no product array alone', () => {
  const payload = { result: 'success', products: '' };

  assert.equal(slimProducts(payload, false), payload);
});
