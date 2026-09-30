import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './motion.css';
import WorkspaceBackground from './WorkspaceBackground';
import { saveVendor, saveBusinessUnit, saveDepartment, saveBusinessCategory } from './vendor-api';
import ProfileMenu from './ProfileMenu';

const moduleInfo = {
  'Business Categories': { short: 'BC', singular: 'Business category', description: 'Create and manage categories for organizing procurement.' },
  'Subcategories': { short: 'SC', singular: 'Subcategory', description: 'Organize detailed subcategories under each category.' },
  'Departments': { short: 'DP', singular: 'Department', description: 'Define and manage departments across the organization.' },
  'Subdepartments': { short: 'SD', singular: 'Subdepartment', description: 'Manage internal subdepartments and operational teams.' },
  'Business Units': { short: 'BU', singular: 'Business Unit', description: 'Manage the legal and operating units of your organization.' },
  'Vendors': { short: 'VN', singular: 'Vendor', description: 'Add and maintain vendor details for procurement.' },
};

const initialData = {
  'Business Categories': [
    { id: 1, name: 'Office Supplies', status: 'Active' },
    { id: 2, name: 'IT Infrastructure', status: 'Active' },
    { id: 3, name: 'Marketing Services', status: 'Inactive' },
    { id: 4, name: 'Human Resources', status: 'Active' },
  ],
  Subcategories: [
    { id: 11, name: 'Laptops and Devices', parent: 'IT Infrastructure', status: 'Active' },
    { id: 12, name: 'Stationery', parent: 'Office Supplies', status: 'Active' },
    { id: 13, name: 'Recruitment Services', parent: 'Human Resources', status: 'Active' },
  ],
  Departments: [
    { id: 21, name: 'Finance', status: 'Active' },
    { id: 22, name: 'Information Technology', status: 'Active' },
    { id: 23, name: 'Operations', status: 'Active' },
    { id: 24, name: 'Marketing', status: 'Inactive' },
  ],
  Subdepartments: [
    { id: 31, name: 'Accounts Payable', parent: 'Finance', status: 'Active' },
    { id: 32, name: 'Infrastructure', parent: 'Information Technology', status: 'Active' },
    { id: 33, name: 'Talent Acquisition', parent: 'Human Resources', status: 'Active' },
  ],
  'Business Units': [
    { id: 41, name: 'NSGAI', status: 'Active' },
    { id: 42, name: 'NSPL', status: 'Active' },
  ],
  Vendors: [
    { id: 51, name: 'TechSource Solutions', category: 'IT Infrastructure', email: 'orders@techsource.in', status: 'Active' },
    { id: 52, name: 'OfficeMart India', category: 'Office Supplies', email: 'sales@officemart.in', status: 'Active' },
    { id: 53, name: 'Creative Studio', category: 'Marketing Services', email: 'hello@creative.in', status: 'Inactive' },
  ],
};

const navItems = [['Admin Panel', 'AD'], ['Overview', 'OV'], ['Requests', 'RQ'], ['Approvals', 'AP'], ['Purchase orders', 'PO'], ['Vendors', 'VN'], ['Reports', 'RP']];
const modules = Object.keys(moduleInfo);
const moduleCards = ['Business Units', 'Departments', 'Subdepartments', 'Business Categories', 'Subcategories', 'Vendors'];
function Logo() { return <div className="logo"><span>P</span></div>; }

function Login({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  return <main className="login-page">
    <section className="login-panel"><div className="brand"><Logo /><strong>Procure<span>Flow</span></strong></div><div className="login-copy"><span className="eyebrow">PROCUREMENT MANAGEMENT</span><h1>Purchasing, perfectly in flow.</h1><p>Manage requests, approvals and vendors from one secure workspace.</p></div><div className="feature-list"><div><b>OK</b><span>Streamlined procurement workflows</span></div><div><b>OK</b><span>Full visibility and control</span></div><div><b>OK</b><span>Built for growing teams</span></div></div><div className="orb orb-one" /><div className="orb orb-two" /></section>
    <section className="login-form-area"><div className="form-card"><div className="mobile-brand"><Logo /><strong>Procure<span>Flow</span></strong></div><span className="eyebrow blue">WELCOME BACK</span><h2>Sign in to your account</h2><p className="muted">Enter your details to access your workspace.</p><form onSubmit={(event) => { event.preventDefault(); onLogin(); }}><label>Work email<input required type="email" defaultValue="admin@procureflow.com" /></label><label>Password<div className="password-wrap"><input required type={showPassword ? 'text' : 'password'} defaultValue="admin123" /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button></div></label><div className="form-options"><label className="checkbox"><input type="checkbox" defaultChecked /> Remember me</label><a href="#forgot">Forgot password?</a></div><button className="primary-btn login-btn" type="submit">Sign in <span>-&gt;</span></button></form><p className="support">Need help? <a href="#support">Contact support</a></p></div><p className="copyright">(c) 2026 ProcureFlow. All rights reserved.</p></section>
  </main>;
}

function MasterModal({ tab, record, data, onClose, onSave }) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const pending = useRef(false);
  const info = moduleInfo[tab];
  const isVendor = tab === 'Vendors';
  const nameLabel = tab === 'Business Units' ? 'Business Unit' : info.singular + ' name';
  const hasParent = tab === 'Subcategories' || tab === 'Subdepartments';
  const parentLabel = tab === 'Subcategories' ? 'Business category' : 'Department';
  const parentValues = tab === 'Subcategories' ? data['Business Categories'] : data.Departments;
  const save = async (event) => {
    event.preventDefault();
    if (pending.current || uncertain) return;
    const fields = Object.fromEntries(new FormData(event.currentTarget).entries());
    pending.current = true;
    setSaving(true);
    setSaveError('');
    try { await onSave(fields); }
    catch (error) { setSaveError(error.message); setUncertain(Boolean(error.uncertain)); }
    finally { pending.current = false; setSaving(false); }
  };
  return <div className="modal-backdrop"><div className={`modal ${isVendor ? 'vendor-modal' : ''}`}><button className="close" disabled={saving} aria-label="Close form" onClick={onClose}>x</button><span className="eyebrow blue">{record ? 'UPDATE' : 'CREATE'} MASTER DATA</span><h2>{record ? `Edit ${info.singular}` : `Add ${info.singular}`}</h2><p>{record ? 'Update the information below and save your changes.' : info.description}</p><form onSubmit={save} aria-busy={saving} className={isVendor ? 'vendor-form' : ''}><fieldset className="vendor-fields" disabled={saving || uncertain}>{isVendor ? <><label>Vendor name<input name="name" required defaultValue={record?.name || ''} placeholder="Enter vendor name" /></label><label>Vendor type<select name="vendorType" defaultValue={record?.vendorType || ''}><option value="">Select type</option><option>Supplier</option><option>Service provider</option><option>Consultant</option></select></label><label>Business category<select name="category" defaultValue={record?.category || ''}><option value="">Select category</option>{data['Business Categories'].map(item => <option key={item.id}>{item.name}</option>)}</select></label><label>Subcategory<select name="subcategory" defaultValue={record?.subcategory || ''}><option value="">Select subcategory</option>{data.Subcategories.map(item => <option key={item.id}>{item.name}</option>)}</select></label><label>Contact person<input name="contact" defaultValue={record?.contact || ''} placeholder="Enter contact name" /></label><label>Phone number<input name="phone" defaultValue={record?.phone || ''} placeholder="+91 00000 00000" /></label><label>Email<input name="email" type="email" defaultValue={record?.email || ''} placeholder="name@company.com" /></label><label>PAN number<input name="pan" defaultValue={record?.pan || ''} placeholder="Enter PAN number" /></label><label>GST number<input name="gst" defaultValue={record?.gst || ''} placeholder="Enter GST number" /></label><label>Address<input name="address" defaultValue={record?.address || ''} placeholder="Enter address" /></label></> : <>{hasParent && <label>{parentLabel}<select name="parent" required defaultValue={record?.parent || ''}><option value="">Select {parentLabel.toLowerCase()}</option>{parentValues.map(item => <option key={item.id}>{item.name}</option>)}</select></label>}<label>{nameLabel}<input name="name" required defaultValue={record?.name || ''} placeholder={`Enter ${nameLabel.toLowerCase()}`} autoFocus /></label></>}</fieldset>{saveError && <p className="save-error" role="alert">{saveError}</p>}<div className="modal-actions"><button type="button" className="cancel" disabled={saving} onClick={onClose}>Cancel</button><button className="primary-btn" type="submit" disabled={saving || uncertain}>{saving ? 'Saving?' : record ? 'Save changes' : `Save ${info.singular}`}</button></div></form></div></div>;
}

function App() {
  const [signedIn, setSignedIn] = useState(() => localStorage.getItem('procureflow_demo_session') === 'active'); const [tab, setTab] = useState('Business Categories'); const [data, setData] = useState(initialData); const [query, setQuery] = useState(''); const [record, setRecord] = useState(null); const [modalOpen, setModalOpen] = useState(false);
  const rows = useMemo(() => data[tab].filter(row => Object.values(row).join(' ').toLowerCase().includes(query.toLowerCase())), [data, tab, query]);
  const signIn = () => { localStorage.setItem('procureflow_demo_session', 'active'); setSignedIn(true); };
  const sessionGeneration = useRef(0);
  const resetSession = () => {
    sessionGeneration.current += 1;
    setSignedIn(false);
    setModalOpen(false);
    setRecord(null);
    setQuery('');
    setTab('Business Categories');
    setData(initialData);
  };
  const signOut = () => {
    localStorage.removeItem('procureflow_demo_session');
    resetSession();
  };
  useEffect(() => {
    const syncLogout = (event) => {
      if ((event.key === 'procureflow_demo_session' && event.newValue !== 'active') || event.key === null) resetSession();
    };
    window.addEventListener('storage', syncLogout);
    return () => window.removeEventListener('storage', syncLogout);
  }, []);
  if (!signedIn) return <Login onLogin={signIn} />;
  const info = moduleInfo[tab];
  const changeTab = (value) => { setTab(value); setQuery(''); };
  const saveRecord = async (formData) => {
    const generation = sessionGeneration.current;
    if (tab === 'Business Categories') {
      if (record) throw new Error('Business Category update workflow is not connected yet. Edit this record in Lumenore.');
      await saveBusinessCategory(formData);
      if (generation !== sessionGeneration.current) return;
    }
    if (tab === 'Departments') {
      if (record) throw new Error('Department update workflow is not connected yet. Edit this record in Lumenore.');
      await saveDepartment(formData);
      if (generation !== sessionGeneration.current) return;
    }
    if (tab === 'Business Units') {
      if (record) throw new Error('Business Unit update workflow is not connected yet. Edit this record in Lumenore.');
      await saveBusinessUnit(formData);
      if (generation !== sessionGeneration.current) return;
    }
    if (tab === 'Vendors') {
      if (record) throw new Error('Vendor update workflow is not connected yet. Edit this vendor in Lumenore.');
      await saveVendor(formData);
      if (generation !== sessionGeneration.current) return;
    }
    setData(current => ({ ...current, [tab]: record ? current[tab].map(item => item.id === record.id ? { ...item, ...formData } : item) : [...current[tab], { id: Date.now(), ...formData, status: 'Active' }] })); setRecord(null); setModalOpen(false); };
  const changeStatus = (id) => setData(current => ({ ...current, [tab]: current[tab].map(item => item.id === id ? { ...item, status: item.status === 'Active' ? 'Inactive' : 'Active' } : item) }));
  const columns = tab === 'Vendors' ? ['Vendor name', 'Business category', 'Email', 'Status'] : tab === 'Subcategories' ? ['Business category', 'Subcategory', 'Status'] : tab === 'Subdepartments' ? ['Department', 'Subdepartment', 'Status'] : tab === 'Business Units' ? ['Business unit', 'Status'] : [`${info.singular} name`, 'Status'];
  return <div className="app-shell"><aside className="sidebar"><Logo /><div className="side-nav">{navItems.map(([name, icon]) => <button key={name} className={name === 'Admin Panel' ? 'active' : ''}><i>{icon}</i><span>{name}</span></button>)}</div><button className="side-bottom" onClick={signOut}>Exit <span>Sign out</span></button></aside><main className="workspace"><WorkspaceBackground /><header className="topbar"><div className="crumb">Administration <span>/</span> Admin Panel</div><div className="top-actions"><button className="icon-btn">?</button><button className="bell">N<b /></button><ProfileMenu onSignOut={signOut} /></div></header><div className="page-content"><div className="page-title"><div><span className="eyebrow blue">ADMINISTRATION</span><h1>Admin Panel</h1><p>Set up your organization, purchasing classifications and vendor directory.</p></div></div><section className="master-grid">{moduleCards.map(name => <article key={name} className={tab === name ? 'module-card focused' : 'module-card'}><div className="module-icon">{moduleInfo[name].short}</div><div><h2>{name}</h2><p>{moduleInfo[name].description}</p><button onClick={() => { changeTab(name); setRecord(null); setModalOpen(true); }}>Add {moduleInfo[name].singular}</button></div></article>)}</section><section className="data-card"><div className="card-head"><div><h2>Master data directory</h2><p>All records are retained for audit; change their status instead of deleting them.</p></div><button className="primary-btn" onClick={() => { setRecord(null); setModalOpen(true); }}>+ Add {info.singular}</button></div><div className="tabs">{modules.map(name => <button key={name} className={tab === name ? 'selected' : ''} onClick={() => changeTab(name)}>{name}</button>)}</div><div className="table-tools"><label className="search">Search:<input value={query} onChange={event => setQuery(event.target.value)} placeholder={`Search ${tab.toLowerCase()}...`} /></label><button className="filter">Filter</button></div><div className="table-wrap"><table><thead><tr>{columns.map(column => <th key={column}>{column}</th>)}<th className="action-column">Actions</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}>{tab === 'Vendors' ? <><td><strong>{row.name}</strong><small>Vendor ID: {row.id}</small></td><td>{row.category || '-'}</td><td>{row.email || '-'}</td></> : (tab === 'Subcategories' || tab === 'Subdepartments') ? <><td>{row.parent || '-'}</td><td><strong>{row.name}</strong></td></> : <td><strong>{row.name}</strong><small>ID: {String(row.id).padStart(5, '0')}</small></td>}<td><button className={`status ${row.status.toLowerCase()}`} onClick={() => changeStatus(row.id)}><i />{row.status}</button></td><td className="row-actions"><button onClick={() => { setRecord(row); setModalOpen(true); }}>Edit</button></td></tr>)}</tbody></table>{rows.length === 0 && <div className="empty">No {tab.toLowerCase()} found.</div>}</div><div className="table-footer"><span>Showing {rows.length} of {data[tab].length} records</span><div><button>Prev</button><button className="current">1</button><button>Next</button></div></div></section></div></main>{modalOpen && <MasterModal tab={tab} record={record} data={data} onClose={() => { setRecord(null); setModalOpen(false); }} onSave={saveRecord} />}</div>;
}

createRoot(document.getElementById('root')).render(<App />);
