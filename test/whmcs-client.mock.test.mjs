import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import axios from 'axios';
import { WHMCSClient } from '../build/whmcs-client.js';

const originalCreate = axios.create;

afterEach(() => {
  axios.create = originalCreate;
});

function mockAxiosPost(handler) {
  const calls = [];

  axios.create = (config) => ({
    post: async (url, body) => {
      calls.push({ config, url, body });
      return handler(url, body);
    },
  });

  return calls;
}

function createClient() {
  return new WHMCSClient({
    identifier: 'test-identifier',
    secret: 'test-secret',
    apiUrl: 'https://whmcs.example.com/includes/api.php',
  });
}

function createAdminClient() {
  return new WHMCSClient({
    username: 'admin-user',
    password: 'plain-password',
    apiUrl: 'https://whmcs.example.com/includes/api.php',
  });
}

test('WHMCSClient sends authenticated form requests and returns API data', async () => {
  const calls = mockAxiosPost(async () => ({
    data: {
      result: 'success',
      totalresults: 1,
      startnumber: 0,
      numreturned: 1,
      tickets: {
        ticket: [
          {
            id: '42',
            subject: 'Mocked ticket',
            status: 'Open',
            priority: 'Medium',
            lastreply: '2026-04-15 10:00:00',
          },
        ],
      },
    },
  }));

  const response = await createClient().getTickets({
    status: 'Open',
    limitstart: 0,
    limitnum: 10,
  });

  assert.equal(response.result, 'success');
  assert.equal(response.tickets.ticket[0].subject, 'Mocked ticket');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '');
  assert.equal(calls[0].config.baseURL, 'https://whmcs.example.com/includes/api.php');
  assert.deepEqual(calls[0].config.headers, {
    'Content-Type': 'application/x-www-form-urlencoded',
  });

  const params = new URLSearchParams(calls[0].body);
  assert.equal(params.get('action'), 'GetTickets');
  assert.equal(params.get('identifier'), 'test-identifier');
  assert.equal(params.get('secret'), 'test-secret');
  assert.equal(params.get('responsetype'), 'json');
  assert.equal(params.get('status'), 'Open');
  assert.equal(params.get('limitstart'), '0');
  assert.equal(params.get('limitnum'), '10');
});

test('WHMCSClient supports admin username and password authentication', async () => {
  const calls = mockAxiosPost(async () => ({
    data: {
      result: 'success',
      departments: {
        department: [],
      },
    },
  }));

  const response = await createAdminClient().getSupportDepartments();

  assert.equal(response.result, 'success');
  assert.equal(calls.length, 1);

  const params = new URLSearchParams(calls[0].body);
  assert.equal(params.get('action'), 'GetSupportDepartments');
  assert.equal(params.get('username'), 'admin-user');
  assert.equal(params.get('password'), '9a0ef3ecf101a8b0856f98eb6b2e2c24');
  assert.equal(params.get('identifier'), null);
  assert.equal(params.get('secret'), null);
  assert.equal(params.get('responsetype'), 'json');
});

test('WHMCSClient keeps pre-hashed admin passwords unchanged', async () => {
  const calls = mockAxiosPost(async () => ({
    data: {
      result: 'success',
      departments: {
        department: [],
      },
    },
  }));

  const client = new WHMCSClient({
    username: 'admin-user',
    password: '0123456789abcdef0123456789abcdef',
    apiUrl: 'https://whmcs.example.com/includes/api.php',
  });

  await client.getSupportDepartments();

  const params = new URLSearchParams(calls[0].body);
  assert.equal(params.get('password'), '0123456789abcdef0123456789abcdef');
});

test('WHMCSClient throws the WHMCS error message from mocked API responses', async () => {
  mockAxiosPost(async () => ({
    data: {
      result: 'error',
      message: 'Authentication failed',
    },
  }));

  await assert.rejects(
    () => createClient().getClients(),
    /Authentication failed/
  );
});
