import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isJsonEncodingError, parseWhmcsXml } from '../build/xml.js';

test('parseWhmcsXml reads a WHMCS collection response', () => {
  const parsed = parseWhmcsXml(`<?xml version="1.0" encoding="utf-8"?>
<whmcsapi version="8.13.1">
<action>getclientsproducts</action>
<result>success</result>
<totalresults>2</totalresults>
<startnumber>0</startnumber>
<numreturned>2</numreturned>
<products>
<product>
<id>1</id>
<name>Plataforma E-commerce</name>
<billingcycle>One Time</billingcycle>
<recurringamount>0.00</recurringamount>
</product>
<product>
<id>3</id>
<name>Midia Performance</name>
<billingcycle>Monthly</billingcycle>
<recurringamount>802.10</recurringamount>
</product>
</products>
</whmcsapi>`);

  assert.equal(parsed.result, 'success');
  assert.equal(parsed.totalresults, '2');
  assert.equal(parsed.products.product.length, 2);
  assert.deepEqual(parsed.products.product[1], {
    id: '3',
    name: 'Midia Performance',
    billingcycle: 'Monthly',
    recurringamount: '802.10',
  });
});

test('parseWhmcsXml keeps a single-item collection as an array', () => {
  const parsed = parseWhmcsXml(
    '<whmcsapi><products><product><id>7</id></product></products></whmcsapi>'
  );

  assert.ok(Array.isArray(parsed.products.product));
  assert.equal(parsed.products.product.length, 1);
  assert.equal(parsed.products.product[0].id, '7');
});

test('parseWhmcsXml decodes entities and CDATA', () => {
  const parsed = parseWhmcsXml(
    '<whmcsapi><a>Ampers&amp;nd &lt;tag&gt; &#233;</a><b><![CDATA[<p>raw & html</p>]]></b></whmcsapi>'
  );

  assert.equal(parsed.a, 'Ampers&nd <tag> é');
  assert.equal(parsed.b, '<p>raw & html</p>');
});

test('parseWhmcsXml handles empty and self-closing elements', () => {
  const parsed = parseWhmcsXml('<whmcsapi><clientid></clientid><domain/><ok>1</ok></whmcsapi>');

  assert.equal(parsed.clientid, '');
  assert.equal(parsed.domain, '');
  assert.equal(parsed.ok, '1');
});

test('parseWhmcsXml keeps nested structures', () => {
  const parsed = parseWhmcsXml(
    '<whmcsapi><products><product><id>1</id><customfields><customfield><name>CPF</name></customfield></customfields></product></products></whmcsapi>'
  );

  assert.deepEqual(parsed.products.product[0].customfields.customfield, [{ name: 'CPF' }]);
});

test('parseWhmcsXml rejects a response that is not XML', () => {
  assert.throws(() => parseWhmcsXml('not xml at all'), /Unexpected WHMCS XML response/);
});

test('isJsonEncodingError only matches the WHMCS JSON encoder failure', () => {
  assert.equal(
    isJsonEncodingError('Error generating JSON encoded response: Malformed UTF-8 characters'),
    true
  );
  assert.equal(isJsonEncodingError('Malformed UTF-8 characters, possibly incorrectly encoded'), true);
  assert.equal(isJsonEncodingError('Invalid IP 1.2.3.4'), false);
  assert.equal(isJsonEncodingError(undefined), false);
});
