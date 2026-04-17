import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, test } from 'node:test';

// Dynamic import so we can manipulate env before each load
async function freshLoad(args = []) {
  // bust module cache
  const url = `../build/config.js?t=${Date.now()}-${Math.random()}`;
  const mod = await import(url);
  return mod.loadWHMCSConfig(args);
}

describe('loadWHMCSConfig from env vars', () => {
  const saved = {};

  beforeEach(() => {
    for (const k of ['WHMCS_API_URL', 'WHMCS_IDENTIFIER', 'WHMCS_SECRET', 'WHMCS_USERNAME', 'WHMCS_PASSWORD']) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  test('loads API credentials from env vars', async () => {
    process.env.WHMCS_API_URL = 'https://whmcs.example.com/includes/api.php';
    process.env.WHMCS_IDENTIFIER = 'my-id';
    process.env.WHMCS_SECRET = 'my-secret';

    const config = await freshLoad();
    assert.equal(config.apiUrl, 'https://whmcs.example.com/includes/api.php');
    assert.equal(config.identifier, 'my-id');
    assert.equal(config.secret, 'my-secret');
    assert.equal(config.username, undefined);
  });

  test('loads admin credentials from env vars', async () => {
    process.env.WHMCS_API_URL = 'https://whmcs.example.com/includes/api.php';
    process.env.WHMCS_USERNAME = 'admin';
    process.env.WHMCS_PASSWORD = 'pass123';

    const config = await freshLoad();
    assert.equal(config.username, 'admin');
    assert.equal(config.password, 'pass123');
    assert.equal(config.identifier, undefined);
  });

  test('throws when only WHMCS_API_URL is set without credentials', async () => {
    process.env.WHMCS_API_URL = 'https://whmcs.example.com/includes/api.php';

    await assert.rejects(() => freshLoad(), /identifier\+secret|username\+password/);
  });

  test('throws when identifier is set without secret', async () => {
    process.env.WHMCS_API_URL = 'https://whmcs.example.com/includes/api.php';
    process.env.WHMCS_IDENTIFIER = 'my-id';

    await assert.rejects(() => freshLoad(), /identifier and secret must be provided together/);
  });

  test('throws when no env vars and no mcp.json', async () => {
    await assert.rejects(() => freshLoad(), /No WHMCS credentials found/);
  });
});
