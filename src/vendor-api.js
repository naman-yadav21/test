export async function saveVendor(fields) {
  return saveRecord('/api/vendors', fields);
}

export async function saveBusinessCategory(fields) {
  return saveRecord('/api/business-categories', fields);
}

export async function saveDepartment(fields) {
  return saveRecord('/api/departments', fields);
}

export async function saveBusinessUnit(fields) {
  return saveRecord('/api/business-units', fields);
}

async function saveRecord(url, fields) {
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
  } catch {
    throw Object.assign(new Error('Save could not be confirmed. Check the Lumenore table before trying again.'), { uncertain: true });
  }
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.saved !== true) {
    throw Object.assign(new Error(result?.message || 'No save confirmation received. Check the API connection and Lumenore table before retrying.'), { uncertain: result?.uncertain ?? true });
  }
}
