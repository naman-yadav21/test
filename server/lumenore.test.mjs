import test from 'node:test';
import assert from 'node:assert/strict';
import { BUSINESS_CATEGORY_WORKFLOW_URL, businessCategoryPayload, createBusinessCategory } from './lumenore.mjs';

test('Business Category sends exact multipart payload to its dedicated workflow', async () => {
  const result = await createBusinessCategory({ name: ' Office Supplies ', appId: 'ignored' }, { token: 'test' }, async (url, options) => {
    assert.equal(url, BUSINESS_CATEGORY_WORKFLOW_URL);
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['Application-Id'], APP_ID);
    assert.deepEqual(JSON.parse(options.body.get('data')), { data: { appId: APP_ID, business_category: 'Office Supplies' } });
    return Response.json({ status: { code: '200', value: 'success' }, error: false,
      data: { data: { notification: 'Category added successfully', type: 'success', eventType: 'close', eventValue: 'modalcontainer-0', eventParams: { reload: 1789638334354 } } } });
  });
  assert.deepEqual(result, { status: 201, body: { saved: true } });
});

test('Business Category rejects invalid input and missing credentials without writing', async () => {
  for (const fields of [null, {}, { name: ' ' }, { name: 5 }, { name: 'x'.repeat(5001) }]) assert.throws(() => businessCategoryPayload(fields));
  const result = await createBusinessCategory({ name: 'Office Supplies' }, {}, () => assert.fail('Must not send'));
  assert.equal(result.status, 503);
});

test('Business Category failures never report success or retry automatically', async () => {
  for (const response of [Response.json({ status: { code: '200', value: 'success' }, error: true }), new Response('', { status: 401 })]) {
    const result = await createBusinessCategory({ name: 'Office Supplies' }, { token: 'test' }, async () => response);
    assert.equal(result.status, 502);
    assert.notEqual(result.body.saved, true);
  }
  let calls = 0;
  const result = await createBusinessCategory({ name: 'Office Supplies' }, { token: 'test' }, async () => { calls++; throw new Error('timeout'); });
  assert.equal(calls, 1);
  assert.equal(result.body.uncertain, true);
});
import { DEPARTMENT_WORKFLOW_URL, departmentPayload, createDepartment } from './lumenore.mjs';

test('Department sends exact multipart payload to its dedicated workflow', async () => {
  const result = await createDepartment({ name: ' Finance ', appId: 'ignored' }, { token: 'test' }, async (url, options) => {
    assert.equal(url, DEPARTMENT_WORKFLOW_URL);
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['Application-Id'], APP_ID);
    assert.deepEqual(JSON.parse(options.body.get('data')), { data: { appId: APP_ID, department: 'Finance' } });
    return Response.json({ status: { code: '200', value: 'success' }, error: false,
      data: { data: { notification: 'Departments Added Successfully!', type: 'success', eventType: 'close', eventValue: 'modalcontainer-1', eventParams: { reload_2: 1789637555685 } } } });
  });
  assert.deepEqual(result, { status: 201, body: { saved: true } });
});

test('Department rejects invalid input and missing credentials without writing', async () => {
  for (const fields of [null, {}, { name: ' ' }, { name: 5 }, { name: 'x'.repeat(5001) }]) assert.throws(() => departmentPayload(fields));
  const result = await createDepartment({ name: 'Finance' }, {}, () => assert.fail('Must not send'));
  assert.equal(result.status, 503);
});

test('Department failures never report success or retry automatically', async () => {
  for (const response of [Response.json({ status: { code: '200', value: 'success' }, error: true }), new Response('', { status: 401 })]) {
    const result = await createDepartment({ name: 'Finance' }, { token: 'test' }, async () => response);
    assert.equal(result.status, 502);
    assert.notEqual(result.body.saved, true);
  }
  let calls = 0;
  const result = await createDepartment({ name: 'Finance' }, { token: 'test' }, async () => { calls++; throw new Error('timeout'); });
  assert.equal(calls, 1);
  assert.equal(result.body.uncertain, true);
});
import { APP_ID, WORKFLOW_URL, vendorPayload, createVendor } from './lumenore.mjs';
import { BUSINESS_UNIT_WORKFLOW_URL, businessUnitPayload, createBusinessUnit } from './lumenore.mjs';

test('Business Unit uses its own workflow and exact multipart payload', async () => {
  const result = await createBusinessUnit({ name: '  NSPL  ', appId: 'ignored' }, { token: 'test-token' }, async (url, options) => {
    assert.equal(url, BUSINESS_UNIT_WORKFLOW_URL);
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['Application-Id'], APP_ID);
    assert.deepEqual(JSON.parse(options.body.get('data')), { data: { appId: APP_ID, business_unit: 'NSPL' } });
    return Response.json({ status: { code: '200', value: 'success' }, error: false,
      data: { data: { notification: ' Business Entities Added Successfully!', type: 'success', eventType: 'close', eventValue: 'modalcontainer-2', eventParams: { reload_4: 1789626993077 } } } });
  });
  assert.deepEqual(result, { status: 201, body: { saved: true } });
});

test('Business Unit rejects invalid names and blocks unconfigured authentication', async () => {
  for (const fields of [null, {}, { name: ' ' }, { name: 123 }, { name: 'a'.repeat(5001) }]) {
    assert.throws(() => businessUnitPayload(fields));
  }
  const result = await createBusinessUnit({ name: 'NSPL' }, {}, () => assert.fail('Must not send'));
  assert.equal(result.status, 503);
});

test('Business Unit never treats failed workflow or rejected authentication as saved', async () => {
  for (const response of [Response.json({ status: { code: '200', value: 'success' }, error: true }), new Response('', { status: 401 })]) {
    const result = await createBusinessUnit({ name: 'NSPL' }, { token: 'test' }, async () => response);
    assert.equal(result.status, 502);
    assert.notEqual(result.body.saved, true);
  }
});

const fields = { name: 'Example vendor', vendorType: 'Supplier', category: 'Human Resources', subcategory: 'Employee Training', contact: 'Person', phone: '0123456789', email: 'test@example.com', pan: 'ABCDE1234F', gst: '27ABCDE1234F2Z5', address: 'Example address' };
const config = { token: 'test-token' };
const success = {
  version: { name: 'vanilla', version: 'Lumenore Studio' },
  status: { code: '200', value: 'success' },
  data: { data: { eventType: 'goto', eventValue: 'Admin Panel' } },
  error: false,
};

test('maps every vendor field to the provided payload without accepting an appId override', () => {
  assert.deepEqual(vendorPayload({ ...fields, appId: 'other' }), { data: {
    appId: APP_ID, vendor_name: fields.name, vendor_type: fields.vendorType,
    v_category: fields.category, v_subcategory: fields.subcategory,
    contact_person: fields.contact, phone_number: fields.phone, email: fields.email,
    pan_number: fields.pan, gst_no: fields.gst, address: fields.address,
  } });
});
test('does not send data without credentials', async () => {
  const noFetch = () => assert.fail('Must not invoke workflow');
  assert.equal((await createVendor(fields, {}, noFetch)).status, 503);
});
test('sends the multipart data field and server headers to the fixed workflow', async () => {
  const result = await createVendor(fields, config, async (url, options) => {
    assert.equal(url, WORKFLOW_URL);
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    assert.equal(options.headers['Application-Id'], APP_ID);
    assert.equal(options.headers['Content-Type'], undefined);
    assert.deepEqual(JSON.parse(options.body.get('data')), vendorPayload(fields));
    return Response.json(success);
  });
  assert.deepEqual(result, { status: 201, body: { saved: true } });
});
test('HTTP 200 with failure or unexpected response never counts as saved', async () => {
  for (const response of [
    { ...success, error: true },
    { ...success, error: undefined },
    { ...success, status: { code: '500', value: 'success' } },
    { ...success, status: { code: '200', value: 'failure' } },
    { ...success, status: { code: 200, value: 'success' } },
    { unknown: true }, null,
  ]) {
    const result = await createVendor(fields, config, async () => Response.json(response));
    assert.equal(result.status, 502);
    assert.equal(result.body.uncertain, true);
  }
});
test('authentication failure and timeouts do not report success or retry the write', async () => {
  const unauthorized = await createVendor(fields, config, async () => new Response('', { status: 401 }));
  assert.equal(unauthorized.status, 502);
  let calls = 0;
  const timeout = await createVendor(fields, config, async () => { calls++; throw new Error('timeout'); });
  assert.equal(calls, 1);
  assert.equal(timeout.body.uncertain, true);
});
