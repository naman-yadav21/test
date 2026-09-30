export const APP_ID = 'cd405ae3-229e-11f1-b2ea-8f47bffa358e';
export const BUSINESS_CATEGORY_WORKFLOW_URL = 'https://apphub.lumenore.com/appsapi/appbuilder/workflow/8a7b6b6e-28e2-11f1-affd-c3b807b8cb2d';

export function businessCategoryPayload(fields) {
  if (!fields || typeof fields.name !== 'string' || !fields.name.trim() || fields.name.length > 5000) {
    throw new Error('A valid Business Category name is required.');
  }
  return { data: { appId: APP_ID, business_category: fields.name.trim() } };
}

export function createBusinessCategory(fields, config, fetchImpl = fetch) {
  return submitWorkflow(BUSINESS_CATEGORY_WORKFLOW_URL, businessCategoryPayload(fields), config, fetchImpl);
}
export const DEPARTMENT_WORKFLOW_URL = 'https://apphub.lumenore.com/appsapi/appbuilder/workflow/9bcd29ca-28e2-11f1-9d55-df8d0006bbb9';

export function departmentPayload(fields) {
  if (!fields || typeof fields.name !== 'string' || !fields.name.trim() || fields.name.length > 5000) {
    throw new Error('A valid Department name is required.');
  }
  return { data: { appId: APP_ID, department: fields.name.trim() } };
}

export function createDepartment(fields, config, fetchImpl = fetch) {
  return submitWorkflow(DEPARTMENT_WORKFLOW_URL, departmentPayload(fields), config, fetchImpl);
}
export const WORKFLOW_URL = 'https://apphub.lumenore.com/appsapi/appbuilder/workflow/41fa44c1-283e-11f1-affd-19c6e515cfa7';
export const BUSINESS_UNIT_WORKFLOW_URL = 'https://apphub.lumenore.com/appsapi/appbuilder/workflow/7f5b84c1-28e2-11f1-a5f5-1315ec753140';

export function businessUnitPayload(fields) {
  if (!fields || typeof fields.name !== 'string' || !fields.name.trim() || fields.name.length > 5000) {
    throw new Error('A valid Business Unit name is required.');
  }
  return { data: { appId: APP_ID, business_unit: fields.name.trim() } };
}

export function createBusinessUnit(fields, config, fetchImpl = fetch) {
  return submitWorkflow(BUSINESS_UNIT_WORKFLOW_URL, businessUnitPayload(fields), config, fetchImpl);
}

export function vendorPayload(fields) {
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) throw new Error('Invalid vendor details.');
  const mapping = {
    name: 'vendor_name', vendorType: 'vendor_type', category: 'v_category',
    subcategory: 'v_subcategory', contact: 'contact_person', phone: 'phone_number',
    email: 'email', pan: 'pan_number', gst: 'gst_no', address: 'address',
  };
  const data = { appId: APP_ID };
  for (const [field, column] of Object.entries(mapping)) {
    const value = fields[field] ?? '';
    if (typeof value !== 'string' || value.length > 5000) throw new Error(`Invalid ${field}.`);
    data[column] = value.trim();
  }
  if (!data.vendor_name) throw new Error('Vendor name is required.');
  return { data };
}

export function workflowSucceeded(body) {
  return body?.status?.code === '200'
    && body?.status?.value === 'success'
    && body?.error === false;
}

export async function createVendor(fields, config, fetchImpl = fetch) {
  return submitWorkflow(WORKFLOW_URL, vendorPayload(fields), config, fetchImpl);
}

async function submitWorkflow(url, payload, config, fetchImpl) {
  let token;
  try {
    token = config.auth ? await config.auth.getToken() : config.token;
  } catch {
    return { status: 503, body: { uncertain: false, message: 'Lumenore login failed. Check server email, password, tenant and connection; retry after 30 seconds.' } };
  }
  if (!token) return { status: 503, body: { uncertain: false, message: 'Lumenore authentication is not configured on the server.' } };
  const form = new FormData();
  form.append('data', JSON.stringify(payload));
  let response;
  try {
    response = await fetchImpl(url, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(30000),
      headers: {
        Authorization: `Bearer ${token}`,
        'Application-Id': APP_ID,
        Accept: 'application/json',
        'X-Lumenore-Studio': 'true',
        'Time-Zone': 'Asia/Calcutta',
      },
      body: form,
    });
  } catch {
    return { status: 502, body: { uncertain: true, message: 'Could not confirm the save. Check the Lumenore table before submitting again to avoid a duplicate.' } };
  }
  if ([401, 403].includes(response.status)) {
    if (response.status === 401) config.auth?.invalidate(token);
    // Do not replay an insert automatically. Reauthenticate on the next submission.
    return { status: 502, body: { uncertain: true, message: 'Lumenore rejected authentication or access. Check the table before retrying; check server credentials and permissions.' } };
  }
  let body;
  try { body = await response.json(); } catch { /* Unknown response must never count as saved. */ }
  if (!response.ok || !workflowSucceeded(body)) {
    return { status: 502, body: { uncertain: true, message: 'Lumenore did not return the expected save confirmation. Check the database before retrying.' } };
  }
  return { status: 201, body: { saved: true } };
}
