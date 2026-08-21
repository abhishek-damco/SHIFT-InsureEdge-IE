import { useState, useEffect, useRef } from 'react';
import type { IntermediaryRecord } from '../../types/Distribution';
import { distributionApi as api } from '../../api/distribution';
import BulkUploadModal from './BulkUploadModal';

interface ViewIntermediaryPageProps {
  record: IntermediaryRecord;
  onBack: () => void;
  onEditStep: (step: 1 | 2 | 3 | 4) => void;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  );
}

// ── Custom hook: fetch dropdown options from common_master_type ────────────────

function useDropdown(type: string): string[] {
  const [opts, setOpts] = useState<string[]>([]);
  useEffect(() => {
    api.commonMaster.list(type)
      .then((rows: any[]) => setOpts(rows.map((r: any) => r.dropdown_value ?? r.label)))
      .catch(() => {});
  }, [type]);
  return opts;
}

// ── Custom hook: fetch products from DB ───────────────────────────────────────

function useProducts(isSubProduct?: boolean): any[] {
  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => {
    api.products.list(isSubProduct)
      .then((rows: any[]) => setProducts(rows))
      .catch(() => {});
  }, [isSubProduct]);
  return products;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CLS: Record<string, string> = {
  Active:   'badge badge--active',
  Inactive: 'badge badge--inactive',
  Draft:    'badge badge--draft',
};

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

type TabId = 'details' | 'rights' | 'products' | 'producers' | 'timeline';

// ══════════════════════════════════════════════════════════════════
// TAB 1 — INTERMEDIARY DETAILS
// ══════════════════════════════════════════════════════════════════

function DetailsTab({ record, onRecordChange }: {
  record: IntermediaryRecord;
  onRecordChange: (r: IntermediaryRecord) => void;
}) {
  const legalEntityOpts     = useDropdown('LEGALENTITY');
  const intermediaryTypeOpts = useDropdown('INTERMEDIARYTYPE');

  const [editPrimary, setEditPrimary] = useState(false);
  const [primForm, setPrimForm] = useState<any>({ status: record.status !== 'Inactive' });
  const primFormRef = useRef<any>({ status: record.status !== 'Inactive' });

  const [editAddr, setEditAddr] = useState(false);
  const [addrForm, setAddrForm] = useState<any>({});
  const addrFormRef = useRef<any>({});

  const [editContact, setEditContact] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const contactsRef = useRef<any[]>([]);

  const [nrStates, setNrStates]     = useState<any[]>([]);
  const [nrSearch, setNrSearch]     = useState('');
  const [nrEditing, setNrEditing]   = useState<any>(null);
  const [nrEditVal, setNrEditVal]   = useState({ state: '', license: '' });
  const [showNrAdd, setShowNrAdd]   = useState(false);
  const [nrNewState, setNrNewState] = useState('');
  const [nrNewLic,   setNrNewLic]   = useState('');

  useEffect(() => {
    const iid = record.id as number;
    if (!iid) return;

    api.intermediaries.get(iid).then((data: any) => {
      const form = {
        name:                   data.intermediary_name            ?? '',
        dba:                    data.doing_business_as            ?? '',
        legalEntity:            data.legal_entity                 ?? '',
        federalTaxId:           data.federal_tax_id               ?? '',
        intermediaryType:       data.type_of_intermediary         ?? '',
        country:                data.country                      ?? '',
        residentState:          data.residential_state            ?? '',
        licenseNumber:          data.license                      ?? '',
        fullProducerVisibility: data.allow_full_producer_visibility ?? false,
        commEmail:              data.commission_disburse_email    ?? '',
        status:                 data.status !== 'Inactive',
      };
      setPrimForm(form);
      primFormRef.current = form;
    }).catch(() => {});

    api.contacts.list(iid).then((rows: any[]) => {
      const mapped = rows
        .sort((a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
        .map((c: any) => ({
          id:        c.id,
          name:      c.name               ?? '',
          title:     c.title              ?? '',
          email:     c.email_id           ?? '',
          phone:     c.telephone_number   ?? '',
          altPhone:  c.alt_telephone_no   ?? '',
          extension: c.extension          ?? '',
          isPrimary: c.is_primary         ?? false,
        }));
      setContacts(mapped);
      contactsRef.current = mapped;
    }).catch(() => {});

    api.nrStates.list(iid).then((rows: any[]) => {
      setNrStates(rows.map((nr: any) => ({ id: nr.id, state: nr.state ?? '', license: nr.license ?? '' })));
    }).catch(() => {});

    api.address.get(iid).then((addr: any) => {
      if (!addr) return;
      const form = {
        addrLine1:   addr.address_line1 ?? '',
        addrLine2:   addr.address_line2 ?? '',
        addrCountry: addr.country       ?? '',
        addrState:   addr.state         ?? '',
        city:        addr.city          ?? '',
        county:      addr.county        ?? '',
        zipCode:     addr.zip_code      ?? '',
        latitude:    addr.latitude      ?? '',
        longitude:   addr.longitude     ?? '',
        _addrId:     addr.id,
      };
      setAddrForm(form);
      addrFormRef.current = form;
    }).catch(() => {});
  }, [record.id]);

  async function savePrimary() {
    const iid = record.id as number;
    const newStatus: 'Active' | 'Inactive' = primForm.status ? 'Active' : 'Inactive';
    try {
      if (iid) {
        await api.intermediaries.update(iid, {
          intermediary_name:              primForm.name,
          doing_business_as:              primForm.dba,
          legal_entity:                   primForm.legalEntity,
          federal_tax_id:                 primForm.federalTaxId,
          type_of_intermediary:           primForm.intermediaryType,
          country:                        primForm.country,
          residential_state:              primForm.residentState,
          license:                        primForm.licenseNumber,
          allow_full_producer_visibility: primForm.fullProducerVisibility,
          commission_disburse_email:      primForm.commEmail,
          status:                         newStatus,
          status_toggle:                  primForm.status,
        });
      }
      primFormRef.current = { ...primForm };
      onRecordChange({ ...record, status: newStatus, name: primForm.name });
      setEditPrimary(false);
    } catch (e: any) {
      alert(e.message ?? 'Failed to save');
    }
  }
  function cancelPrimary() { setPrimForm({ ...primFormRef.current }); setEditPrimary(false); }

  async function saveAddr() {
    const iid = record.id as number;
    const payload = {
      address_line1: addrForm.addrLine1,
      address_line2: addrForm.addrLine2,
      country:       addrForm.addrCountry,
      state:         addrForm.addrState,
      city:          addrForm.city,
      county:        addrForm.county,
      zip_code:      addrForm.zipCode,
      latitude:      addrForm.latitude  || null,
      longitude:     addrForm.longitude || null,
    };
    try {
      if (iid) {
        if (addrForm._addrId) {
          await api.address.update(iid, addrForm._addrId, payload);
        } else {
          const created = await api.address.create(iid, payload);
          setAddrForm((prev: any) => ({ ...prev, _addrId: created.id }));
          addrFormRef.current = { ...addrForm, _addrId: created.id };
        }
      }
      addrFormRef.current = { ...addrForm };
      setEditAddr(false);
    } catch (e: any) {
      alert(e.message ?? 'Failed to save address');
    }
  }
  function cancelAddr() { setAddrForm({ ...addrFormRef.current }); setEditAddr(false); }

  async function saveContacts() {
    const iid = record.id as number;
    try {
      if (iid) {
        for (const c of contacts) {
          const payload = {
            name:               c.name,
            title:              c.title,
            telephone_number:   c.phone,
            alt_telephone_no:   c.altPhone,
            extension:          c.extension,
            email_id:           c.email,
            is_primary:         c.isPrimary,
          };
          if (c.id && typeof c.id === 'number') {
            await api.contacts.update(iid, c.id, payload);
          } else {
            await api.contacts.create(iid, payload);
          }
        }
      }
      contactsRef.current = contacts;
      setEditContact(false);
    } catch (e: any) {
      alert(e.message ?? 'Failed to save contacts');
    }
  }
  function cancelContacts() { setContacts([...contactsRef.current]); setEditContact(false); }

  async function addNrState() {
    if (!nrNewState) return;
    const iid = record.id as number;
    try {
      if (iid) {
        const created = await api.nrStates.create(iid, { state: nrNewState, license: nrNewLic, is_available_in_search: false });
        setNrStates(prev => [...prev, { id: created.id, state: created.state, license: created.license ?? '' }]);
      } else {
        setNrStates(prev => [...prev, { id: `nr${Date.now()}`, state: nrNewState, license: nrNewLic }]);
      }
      setNrNewState(''); setNrNewLic(''); setShowNrAdd(false);
    } catch (e: any) {
      alert(e.message ?? 'Failed to add state');
    }
  }

  async function deleteNrState(id: any) {
    const iid = record.id as number;
    try {
      if (iid && typeof id === 'number') {
        await api.nrStates.remove(iid, id);
      }
      setNrStates(prev => prev.filter(s => s.id !== id));
    } catch (e: any) {
      alert(e.message ?? 'Failed to delete state');
    }
  }

  function startEditNr(s: any) { setNrEditing(s.id); setNrEditVal({ state: s.state, license: s.license }); }

  async function saveEditNr(id: any) {
    const iid = record.id as number;
    try {
      if (iid && typeof id === 'number') {
        await api.nrStates.update(iid, id, { state: nrEditVal.state, license: nrEditVal.license, is_available_in_search: false });
      }
      setNrStates(prev => prev.map(s => s.id === id ? { ...s, ...nrEditVal } : s));
      setNrEditing(null);
    } catch (e: any) {
      alert(e.message ?? 'Failed to update state');
    }
  }

  const filteredNr = nrSearch.trim()
    ? nrStates.filter(s => s.state.toLowerCase().includes(nrSearch.toLowerCase()))
    : nrStates;

  const primary   = contacts[0] ?? {};
  const secondary = contacts[1] ?? null;

  function fp(k: string) { return (v: string) => setPrimForm((p: any) => ({ ...p, [k]: v })); }
  function fa(k: string) { return (v: string) => setAddrForm((p: any) => ({ ...p, [k]: v })); }

  return (
    <div>
      {/* Two-column top row */}
      <div className="vi-details-grid">
        {/* Left column */}
        <div className="vi-details-col">

          {/* Primary Information card */}
          <div className="vi-card">
            <div className="vi-card__hdr">
              <span className="vi-card__title">Primary Information</span>
              <div className="vi-card__hdr-actions">
                {!editPrimary && (
                  <button className="vi-icon-btn" title="Edit" onClick={() => { setPrimForm({ ...primFormRef.current }); setEditPrimary(true); }}>
                    <PencilIcon />
                  </button>
                )}
              </div>
            </div>
            <div className="vi-card__body">
              {!editPrimary ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 20px' }}>
                    <div className="vi-profile-large">
                      <svg viewBox="0 0 80 90" fill="none" width="72" height="80">
                        <circle cx="40" cy="26" r="20" fill="#b0b8c4"/>
                        <path d="M2 88 Q2 58 40 58 Q78 58 78 88Z" fill="#b0b8c4"/>
                      </svg>
                    </div>
                  </div>

                  <div className="vi-field-grid">
                    <div className="vi-field">
                      <span className="vi-label">Name</span>
                      <span className="vi-value">{primForm.name || '—'}</span>
                    </div>
                    <div className="vi-field">
                      <span className="vi-label">Doing Business As</span>
                      <span className="vi-value vi-value--muted">{primForm.dba || '—'}</span>
                    </div>
                    <div className="vi-field">
                      <span className="vi-label">Legal Entity</span>
                      <span className="vi-value">{primForm.legalEntity || '—'}</span>
                    </div>
                    <div className="vi-field">
                      <span className="vi-label">Federal Tax ID</span>
                      <span className="vi-value vi-value--mono">{primForm.federalTaxId || record.federalTaxId || '—'}</span>
                    </div>
                    <div className="vi-field">
                      <span className="vi-label">Intermediary ID</span>
                      <span className="vi-value vi-value--mono">{String(record.id).padStart(5, '0')}</span>
                    </div>
                    <div className="vi-field">
                      <span className="vi-label">Status</span>
                      <span className={STATUS_CLS[record.status] ?? 'badge badge--draft'}>• {record.status}</span>
                    </div>
                    <div className="vi-field">
                      <span className="vi-label">Type of Intermediary</span>
                      <span className="vi-value">{primForm.intermediaryType || record.intermediaryType || '—'}</span>
                    </div>
                    <div className="vi-field">
                      <span className="vi-label">Country</span>
                      <span className="vi-value">{primForm.country || '—'}</span>
                    </div>
                    <div className="vi-field">
                      <span className="vi-label">Resident State</span>
                      <span className="vi-value">{primForm.residentState || record.residentState || '—'}</span>
                    </div>
                    <div className="vi-field">
                      <span className="vi-label">License Number</span>
                      <span className="vi-value vi-value--mono">{primForm.licenseNumber || '—'}</span>
                    </div>
                    <div className="vi-field" style={{ gridColumn: '1 / -1' }}>
                      <span className="vi-label">Allow Full Producer Visibility</span>
                      <span className="vi-value">{primForm.fullProducerVisibility ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                  <div className="vi-sub-title">Commission Disbursement Credentials</div>
                  <div className="vi-field-grid">
                    <div className="vi-field">
                      <span className="vi-label">Business Name</span>
                      <span className="vi-value vi-value--muted">{primForm.commBusinessName || primForm.name || '—'}</span>
                    </div>
                    <div className="vi-field">
                      <span className="vi-label">Email</span>
                      <span className="vi-value vi-value--muted">{primForm.commEmail || '—'}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, padding: '8px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>
                      Intermediary ID - {String(record.id).padStart(5, '0')}
                    </span>
                    <span style={{ fontSize: 11, color: '#6b7280' }}>Auto Generated</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 16 }}>
                    <div className="vi-field">
                      <span className="vi-label">Status</span>
                      <label className="vi-toggle-wrap">
                        <label className="vi-toggle">
                          <input type="checkbox" checked={!!primForm.status}
                            onChange={e => fp('status')(e.target.checked as any)} />
                          <span className="vi-toggle-slider" />
                        </label>
                        <span className="vi-toggle-label">{primForm.status ? 'Active' : 'Inactive'}</span>
                      </label>
                    </div>
                    <div className="vi-field" style={{ alignItems: 'flex-end' }}>
                      <span className="vi-label">Allow Full Producer Visibility</span>
                      <label className="vi-toggle-wrap">
                        <label className="vi-toggle">
                          <input type="checkbox" checked={!!primForm.fullProducerVisibility}
                            onChange={e => fp('fullProducerVisibility')(e.target.checked as any)} />
                          <span className="vi-toggle-slider" />
                        </label>
                      </label>
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <span className="vi-label" style={{ display: 'block', marginBottom: 6 }}>Upload Logo</span>
                    <div style={{ border: '2px dashed #d1d5db', borderRadius: 6, padding: '16px', textAlign: 'center', background: '#fafafa' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Drag and Drop File Here or Select a File</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 10 }}>Supported formats are PNG, JPEG &amp; GIF. File size: 10 KB-10 MB</div>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #d1d5db', borderRadius: 4, padding: '6px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', color: '#374151' }}>
                        📎 Browse File
                        <input type="file" accept="image/png,image/jpeg,image/gif" style={{ display: 'none' }} onChange={() => {}} />
                      </label>
                    </div>
                  </div>

                  <div className="vi-field-grid">
                    <div className="vi-field">
                      <span className="vi-label">* Name</span>
                      <input className="vi-input" value={primForm.name || ''} onChange={e => fp('name')(e.target.value)} />
                    </div>
                    <div className="vi-field">
                      <span className="vi-label">Doing Business As</span>
                      <input className="vi-input" value={primForm.dba || ''} onChange={e => fp('dba')(e.target.value)} />
                    </div>
                    <div className="vi-field">
                      <span className="vi-label">* Legal Entity</span>
                      <select className="vi-select" value={primForm.legalEntity || ''} onChange={e => fp('legalEntity')(e.target.value)}>
                        <option value="">Select…</option>
                        {legalEntityOpts.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="vi-field">
                      <span className="vi-label">* Federal Tax ID</span>
                      <input className="vi-input" value={primForm.federalTaxId || ''} onChange={e => fp('federalTaxId')(e.target.value)} />
                    </div>
                    <div className="vi-field">
                      <span className="vi-label">* Type of Intermediary</span>
                      <select className="vi-select" value={primForm.intermediaryType || ''} onChange={e => fp('intermediaryType')(e.target.value)}>
                        <option value="">Select…</option>
                        {intermediaryTypeOpts.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="vi-field">
                      <span className="vi-label">* Country</span>
                      <input className="vi-input" value={primForm.country || ''} onChange={e => fp('country')(e.target.value)} />
                    </div>
                    <div className="vi-field">
                      <span className="vi-label">* Resident State</span>
                      <select className="vi-select" value={primForm.residentState || ''} onChange={e => fp('residentState')(e.target.value)}>
                        <option value="">Select…</option>
                        {US_STATES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="vi-field">
                      <span className="vi-label">* License</span>
                      <input className="vi-input" value={primForm.licenseNumber || ''} onChange={e => fp('licenseNumber')(e.target.value)} />
                    </div>
                  </div>

                  <div className="vi-sub-title">Commission Disbursement Credentials</div>
                  <p style={{ fontSize: 12, color: '#2563eb', margin: '0 0 12px', lineHeight: 1.5 }}>
                    An email address is required to create an account in DisburseCloud, which is our vendor to disburse monthly commissions.
                    Please enter the email address which you want to use to create an account in DisburseCloud.
                    This will be included in an email to the Intermediary once the record has been created.
                  </p>
                  <div className="vi-field-grid">
                    <div className="vi-field">
                      <span className="vi-label">Business Name</span>
                      <input className="vi-input" value={primForm.name || ''} disabled
                        style={{ background: '#f3f4f6', color: '#9ca3af', cursor: 'not-allowed' }} />
                    </div>
                    <div className="vi-field">
                      <span className="vi-label">* Email</span>
                      <input className="vi-input" value={primForm.commEmail || ''} onChange={e => fp('commEmail')(e.target.value)} />
                    </div>
                  </div>

                  <div className="vi-edit-actions">
                    <button className="vi-btn-cancel" onClick={cancelPrimary}>Cancel</button>
                    <button className="vi-btn-save"   onClick={savePrimary}>Save</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="vi-details-col">

          {/* Home Office / Legal Address */}
          <div className="vi-card">
            <div className="vi-card__hdr">
              <span className="vi-card__title">Home Office / Legal Address</span>
              <div className="vi-card__hdr-actions">
                {!editAddr && (
                  <button className="vi-icon-btn" title="Edit" onClick={() => { setAddrForm({ ...addrFormRef.current }); setEditAddr(true); }}>
                    <PencilIcon />
                  </button>
                )}
              </div>
            </div>
            <div className="vi-card__body">
              {!editAddr ? (
                <div className="vi-field-grid">
                  <div className="vi-field" style={{ gridColumn: '1 / -1' }}>
                    <span className="vi-label">Address Line 1</span>
                    <span className="vi-value">{addrForm.addrLine1 || '—'}</span>
                  </div>
                  <div className="vi-field" style={{ gridColumn: '1 / -1' }}>
                    <span className="vi-label">Address Line 2</span>
                    <span className="vi-value vi-value--muted">{addrForm.addrLine2 || '—'}</span>
                  </div>
                  <div className="vi-field">
                    <span className="vi-label">Country</span>
                    <span className="vi-value">{addrForm.addrCountry || '—'}</span>
                  </div>
                  <div className="vi-field">
                    <span className="vi-label">State</span>
                    <span className="vi-value">{addrForm.addrState || '—'}</span>
                  </div>
                  <div className="vi-field">
                    <span className="vi-label">City</span>
                    <span className="vi-value">{addrForm.city || '—'}</span>
                  </div>
                  <div className="vi-field">
                    <span className="vi-label">County</span>
                    <span className="vi-value vi-value--muted">{addrForm.county || '—'}</span>
                  </div>
                  <div className="vi-field">
                    <span className="vi-label">Zip Code</span>
                    <span className="vi-value vi-value--mono">{addrForm.zipCode || '—'}</span>
                  </div>
                  <div className="vi-field">
                    <span className="vi-label">Latitude</span>
                    <span className="vi-value vi-value--muted">{addrForm.latitude || '—'}</span>
                  </div>
                  <div className="vi-field">
                    <span className="vi-label">Longitude</span>
                    <span className="vi-value vi-value--muted">{addrForm.longitude || '—'}</span>
                  </div>
                </div>
              ) : (
                <div className="vi-field-grid">
                  <div className="vi-field" style={{ gridColumn: '1 / -1' }}>
                    <span className="vi-label">Address Line 1</span>
                    <input className="vi-input" value={addrForm.addrLine1 || ''} onChange={e => fa('addrLine1')(e.target.value)} />
                  </div>
                  <div className="vi-field" style={{ gridColumn: '1 / -1' }}>
                    <span className="vi-label">Address Line 2</span>
                    <input className="vi-input" value={addrForm.addrLine2 || ''} onChange={e => fa('addrLine2')(e.target.value)} />
                  </div>
                  <div className="vi-field">
                    <span className="vi-label">Country</span>
                    <input className="vi-input" value={addrForm.addrCountry || ''} onChange={e => fa('addrCountry')(e.target.value)} />
                  </div>
                  <div className="vi-field">
                    <span className="vi-label">State</span>
                    <select className="vi-select" value={addrForm.addrState || ''} onChange={e => fa('addrState')(e.target.value)}>
                      <option value="">Select…</option>
                      {US_STATES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="vi-field">
                    <span className="vi-label">City</span>
                    <input className="vi-input" value={addrForm.city || ''} onChange={e => fa('city')(e.target.value)} />
                  </div>
                  <div className="vi-field">
                    <span className="vi-label">County</span>
                    <input className="vi-input" value={addrForm.county || ''} onChange={e => fa('county')(e.target.value)} />
                  </div>
                  <div className="vi-field">
                    <span className="vi-label">Zip Code</span>
                    <input className="vi-input" value={addrForm.zipCode || ''} onChange={e => fa('zipCode')(e.target.value)} />
                  </div>
                  <div className="vi-field">
                    <span className="vi-label">Latitude</span>
                    <input className="vi-input" value={addrForm.latitude || ''} onChange={e => fa('latitude')(e.target.value)} />
                  </div>
                  <div className="vi-field">
                    <span className="vi-label">Longitude</span>
                    <input className="vi-input" value={addrForm.longitude || ''} onChange={e => fa('longitude')(e.target.value)} />
                  </div>
                  <div className="vi-edit-actions" style={{ gridColumn: '1 / -1' }}>
                    <button className="vi-btn-cancel" onClick={cancelAddr}>Cancel</button>
                    <button className="vi-btn-save"   onClick={saveAddr}>Save</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact Details */}
          <div className="vi-card">
            <div className="vi-card__hdr">
              <span className="vi-card__title">Contact Details</span>
              <div className="vi-card__hdr-actions">
                {!editContact && (
                  <button className="vi-icon-btn" title="Edit" onClick={() => setEditContact(true)}>
                    <PencilIcon />
                  </button>
                )}
              </div>
            </div>
            <div className="vi-card__body">
              {!editContact ? (
                <>
                  <div className="vi-sub-title" style={{ marginTop: 0 }}>Primary Contact</div>
                  <div className="vi-field-grid vi-field-grid--3">
                    <div className="vi-field">
                      <span className="vi-label">Name</span>
                      <span className="vi-value">{primary.name || '—'}</span>
                    </div>
                    <div className="vi-field">
                      <span className="vi-label">Title</span>
                      <span className="vi-value">{primary.title || '—'}</span>
                    </div>
                    <div className="vi-field">
                      <span className="vi-label">Email ID</span>
                      <span className="vi-value vi-value--muted">{primary.email || '—'}</span>
                    </div>
                    <div className="vi-field">
                      <span className="vi-label">Telephone Number</span>
                      <span className="vi-value vi-value--mono">{primary.phone || '—'}</span>
                    </div>
                    <div className="vi-field">
                      <span className="vi-label">Extension</span>
                      <span className="vi-value vi-value--muted">{primary.extension || '—'}</span>
                    </div>
                    <div className="vi-field">
                      <span className="vi-label">Alternative Telephone Number</span>
                      <span className="vi-value vi-value--muted">{primary.altPhone || '—'}</span>
                    </div>
                  </div>
                  {secondary && (
                    <>
                      <div className="vi-sub-title">Secondary Contact</div>
                      <div className="vi-field-grid">
                        <div className="vi-field">
                          <span className="vi-label">Name</span>
                          <span className="vi-value">{secondary.name || '—'}</span>
                        </div>
                        <div className="vi-field">
                          <span className="vi-label">Title</span>
                          <span className="vi-value">{secondary.title || '—'}</span>
                        </div>
                        <div className="vi-field">
                          <span className="vi-label">Email</span>
                          <span className="vi-value vi-value--muted">{secondary.email || '—'}</span>
                        </div>
                        <div className="vi-field">
                          <span className="vi-label">Phone</span>
                          <span className="vi-value vi-value--mono">{secondary.phone || '—'}</span>
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="vi-sub-title" style={{ marginTop: 0 }}>Primary Contact</div>
                  <div className="vi-field-grid">
                    <div className="vi-field">
                      <span className="vi-label">Name</span>
                      <input className="vi-input" value={contacts[0]?.name || ''}
                        onChange={e => setContacts(c => c.map((x, i) => i === 0 ? { ...x, name: e.target.value } : x))} />
                    </div>
                    <div className="vi-field">
                      <span className="vi-label">Title</span>
                      <input className="vi-input" value={contacts[0]?.title || ''}
                        onChange={e => setContacts(c => c.map((x, i) => i === 0 ? { ...x, title: e.target.value } : x))} />
                    </div>
                    <div className="vi-field">
                      <span className="vi-label">Email</span>
                      <input className="vi-input" value={contacts[0]?.email || ''}
                        onChange={e => setContacts(c => c.map((x, i) => i === 0 ? { ...x, email: e.target.value } : x))} />
                    </div>
                    <div className="vi-field">
                      <span className="vi-label">Phone</span>
                      <input className="vi-input" value={contacts[0]?.phone || ''}
                        onChange={e => setContacts(c => c.map((x, i) => i === 0 ? { ...x, phone: e.target.value } : x))} />
                    </div>
                  </div>
                  {contacts[1] !== undefined && (
                    <>
                      <div className="vi-sub-title">Secondary Contact</div>
                      <div className="vi-field-grid">
                        <div className="vi-field">
                          <span className="vi-label">Name</span>
                          <input className="vi-input" value={contacts[1]?.name || ''}
                            onChange={e => setContacts(c => c.map((x, i) => i === 1 ? { ...x, name: e.target.value } : x))} />
                        </div>
                        <div className="vi-field">
                          <span className="vi-label">Title</span>
                          <input className="vi-input" value={contacts[1]?.title || ''}
                            onChange={e => setContacts(c => c.map((x, i) => i === 1 ? { ...x, title: e.target.value } : x))} />
                        </div>
                        <div className="vi-field">
                          <span className="vi-label">Email</span>
                          <input className="vi-input" value={contacts[1]?.email || ''}
                            onChange={e => setContacts(c => c.map((x, i) => i === 1 ? { ...x, email: e.target.value } : x))} />
                        </div>
                        <div className="vi-field">
                          <span className="vi-label">Phone</span>
                          <input className="vi-input" value={contacts[1]?.phone || ''}
                            onChange={e => setContacts(c => c.map((x, i) => i === 1 ? { ...x, phone: e.target.value } : x))} />
                        </div>
                      </div>
                    </>
                  )}
                  <div className="vi-edit-actions">
                    <button className="vi-btn-cancel" onClick={cancelContacts}>Cancel</button>
                    <button className="vi-btn-save"   onClick={saveContacts}>Save</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Non-Resident States — full width */}
      <div className="vi-nr-section">
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1f2937', margin: '0 0 12px' }}>
          Non-Resident State(s)
        </h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <input className="vi-search-input" placeholder="Search by state or License…"
            value={nrSearch} onChange={e => setNrSearch(e.target.value)} style={{ width: 220 }} />
          <button className="vi-btn-primary" onClick={() => setShowNrAdd(true)}>+ Add State</button>
        </div>

        {showNrAdd && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-end' }}>
            <div className="vi-field">
              <span className="vi-label">State</span>
              <select className="vi-select" value={nrNewState} onChange={e => setNrNewState(e.target.value)} style={{ width: 120 }}>
                <option value="">Select…</option>
                {US_STATES.filter(s => !nrStates.find(n => n.state === s)).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="vi-field">
              <span className="vi-label">License Number</span>
              <input className="vi-input" value={nrNewLic} onChange={e => setNrNewLic(e.target.value)} style={{ width: 180 }} />
            </div>
            <button className="vi-btn-save" onClick={addNrState}>Add</button>
            <button className="vi-btn-cancel" onClick={() => { setShowNrAdd(false); setNrNewState(''); setNrNewLic(''); }}>Cancel</button>
          </div>
        )}

        <div className="vi-table-wrap">
          <table className="vi-table">
            <thead>
              <tr>
                <th className="vi-td-num">#</th>
                <th className="vi-td-action">Actions</th>
                <th>State Name</th>
                <th>License Number</th>
              </tr>
            </thead>
            <tbody>
              {filteredNr.length === 0
                ? <tr><td colSpan={4} className="vi-empty">No non-resident states added.</td></tr>
                : filteredNr.map((s, i) => (
                  <tr key={s.id}>
                    <td className="vi-td-num">{i + 1}</td>
                    <td className="vi-td-action">
                      <button className="vi-tbl-icon-btn" title="Edit" onClick={() => startEditNr(s)}><PencilIcon /></button>
                      <button className="vi-tbl-icon-btn vi-tbl-icon-btn--del" title="Delete" onClick={() => deleteNrState(s.id)}><TrashIcon /></button>
                    </td>
                    {nrEditing === s.id ? (
                      <>
                        <td>
                          <select className="vi-select" value={nrEditVal.state} onChange={e => setNrEditVal(v => ({ ...v, state: e.target.value }))}>
                            {US_STATES.map(st => <option key={st}>{st}</option>)}
                          </select>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <input className="vi-input" value={nrEditVal.license} onChange={e => setNrEditVal(v => ({ ...v, license: e.target.value }))} />
                            <button className="vi-btn-save" onClick={() => saveEditNr(s.id)}>Save</button>
                            <button className="vi-btn-cancel" onClick={() => setNrEditing(null)}>✕</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{s.state}</td>
                        <td className="vi-td-mono">{s.license || '—'}</td>
                      </>
                    )}
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB 2 — ASSIGNED RIGHTS
// ══════════════════════════════════════════════════════════════════

type AccessLevel = 'none' | 'readonly' | 'allaccess';

function accessFromPerms(p: any): AccessLevel {
  if (!p) return 'none';
  if (p.is_create_permission || p.is_edit_permission || p.is_approve_reject ||
      p.is_upload_permission || p.is_download_permission) return 'allaccess';
  if (p.is_view_permission) return 'readonly';
  return 'none';
}

function RightsTab({ record, onRecordChange: _onRecordChange }: {
  record: IntermediaryRecord;
  onRecordChange: (r: IntermediaryRecord) => void;
}) {
  const iid = record.id as number;

  const [screens,   setScreens]   = useState<any[]>([]);
  const [permMap,   setPermMap]   = useState<Record<number, any>>({});
  const [accessMap, setAccessMap] = useState<Record<number, AccessLevel>>({});
  const [editing,   setEditing]   = useState(false);
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    if (!iid) return;
    Promise.all([
      api.screens.listAll(),
      api.screenPermissions.listByIntermediary(iid),
    ]).then(([allScreens, existingPerms]) => {
      setScreens(allScreens);
      const pm: Record<number, any> = {};
      const am: Record<number, AccessLevel> = {};
      existingPerms.forEach((p: any) => { pm[p.screen_id] = p; });
      allScreens.forEach((s: any) => {
        am[s.id] = accessFromPerms(pm[s.id]);
      });
      setPermMap(pm);
      setAccessMap(am);
    }).catch(() => {});
  }, [iid]);

  async function saveRights() {
    setSaving(true);
    try {
      const permissions = screens.map(s => {
        const access = accessMap[s.id] ?? 'none';
        const rw     = access === 'allaccess';
        const ro     = access === 'readonly';
        return {
          screen_id:               s.id,
          is_view_permission:      rw || ro,
          is_create_permission:    rw,
          is_edit_permission:      rw,
          is_approve_reject:       rw,
          is_upload_permission:    rw,
          is_download_permission:  rw,
          is_duplicate_permission: false,
          is_view_sensitive_info:  false,
          is_access_sensitive_doc: false,
          visibility:              access !== 'none',
          all_access:              rw,
        };
      });
      await api.screenPermissions.saveByIntermediary(iid, permissions);
      setEditing(false);
    } catch (e: any) {
      alert(e.message ?? 'Failed to save rights');
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    const am: Record<number, AccessLevel> = {};
    screens.forEach(s => { am[s.id] = accessFromPerms(permMap[s.id]); });
    setAccessMap(am);
    setEditing(false);
  }

  const moduleMap = new Map<string, any[]>();
  screens.forEach(s => {
    const mod = s.module_name ?? s.module_code ?? 'Other';
    if (!moduleMap.has(mod)) moduleMap.set(mod, []);
    moduleMap.get(mod)!.push(s);
  });

  const hasAny = screens.some(s => (accessMap[s.id] ?? 'none') !== 'none');

  return (
    <div>
      <div className="vi-rights-hdr">
        {!editing && (
          <button className="vi-icon-btn" title="Edit Rights" onClick={() => setEditing(true)}>
            <PencilIcon />
          </button>
        )}
      </div>

      {!editing ? (
        <div className="vi-module-list">
          {!hasAny
            ? <p className="vi-empty">No rights assigned.</p>
            : Array.from(moduleMap.entries()).map(([modName, modScreens]) => (
                modScreens.some(s => (accessMap[s.id] ?? 'none') !== 'none') ? (
                  <div key={modName}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 0 4px' }}>{modName}</div>
                    {modScreens.filter(s => (accessMap[s.id] ?? 'none') !== 'none').map(s => (
                      <div key={s.id} className="vi-module-row">
                        <span className="vi-module-row__name">{s.screen_name}</span>
                        <span className={`vi-access-badge${accessMap[s.id] === 'allaccess' ? ' vi-access-badge--all' : ''}`}>
                          {accessMap[s.id] === 'allaccess' ? 'All Access' : 'Read Only'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null
              ))
          }
        </div>
      ) : (
        <>
          <div className="vi-module-list">
            {Array.from(moduleMap.entries()).map(([modName, modScreens]) => (
              <div key={modName}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 0 4px' }}>{modName}</div>
                {modScreens.map(s => (
                  <div key={s.id} className="vi-module-row">
                    <span className="vi-module-row__name">{s.screen_name}</span>
                    <div className="vi-module-row__access">
                      {(['none', 'readonly', 'allaccess'] as AccessLevel[]).map(level => (
                        <label key={level} className="vi-access-option">
                          <input type="radio" name={`screen_${s.id}`} value={level}
                            checked={(accessMap[s.id] ?? 'none') === level}
                            onChange={() => setAccessMap(p => ({ ...p, [s.id]: level }))} />
                          {level === 'none' ? 'None' : level === 'readonly' ? 'Read Only' : 'All Access'}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="vi-edit-actions">
            <button className="vi-btn-cancel" onClick={cancelEdit} disabled={saving}>Cancel</button>
            <button className="vi-btn-save" onClick={saveRights} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB 3 — ASSIGNED PRODUCTS
// ══════════════════════════════════════════════════════════════════

const FALLBACK_COMPANIES = ['Sierra Specialty Insurance Company'];

const EMPTY_PROD_FORM = {
  insuranceType: '', lineOfBusinessId: '' as string | number, subProductId: '' as string | number,
  state: '', newBusinessPct: '', renewalPct: '', effectiveDate: '',
};

function ProductsTab({ record, onRecordChange: _onRecordChange }: {
  record: IntermediaryRecord;
  onRecordChange: (r: IntermediaryRecord) => void;
}) {
  const lobs        = useProducts(false);
  const subProds    = useProducts(true);
  const insurTypes  = useDropdown('INSURANCETYPE');

  const [rows, setRows] = useState<any[]>([]);

  const companies: string[] = (() => {
    const s = new Set(rows.map((r: any) => r.company).filter(Boolean));
    return s.size > 0 ? [...s] : FALLBACK_COMPANIES.slice(0, 1);
  })();

  const [selectedCompany, setSelectedCompany] = useState<string>(FALLBACK_COMPANIES[0]);
  const [panelCollapsed,  setPanelCollapsed]  = useState(false);
  const [searchQuery,     setSearchQuery]     = useState('');
  const [showModal,       setShowModal]       = useState(false);
  const [editTarget,      setEditTarget]      = useState<any | null>(null);
  const [deleteTarget,    setDeleteTarget]    = useState<any | null>(null);
  const [form, setForm] = useState({ ...EMPTY_PROD_FORM });

  function lobName(id: any): string {
    if (!id) return '—';
    const p = lobs.find(l => l.id === Number(id)) ?? subProds.find(l => l.id === Number(id));
    return p?.product_name ?? String(id);
  }

  useEffect(() => {
    const iid = record.id as number;
    if (!iid) return;
    api.commissions.list(iid).then((dbRows: any[]) => {
      const mapped = dbRows.map((row: any) => ({
        id:               row.id,
        company:          row.company_id === 1 ? FALLBACK_COMPANIES[0] : String(row.company_id),
        insuranceType:    row.insurance_type       ?? '',
        lineOfBusinessId: row.product_id           ?? '',
        subProductId:     row.sub_product_id       ?? '',
        states:           row.juridiction_state ? [row.juridiction_state] : [],
        newBusinessPct:   row.new_business_commission ?? '',
        renewalPct:       row.renewal_commission      ?? '',
        effectiveDate:    row.effective_date ? String(row.effective_date).slice(0, 10) : '',
      }));
      setRows(mapped);
      if (mapped.length > 0) {
        const cos = [...new Set(mapped.map((r: any) => r.company))];
        setSelectedCompany(cos[0]);
      }
    }).catch(() => {});
  }, [record.id]);

  const displayedRows = rows.filter((r: any) => {
    if (r.company !== selectedCompany) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return lobName(r.lineOfBusinessId).toLowerCase().includes(q)
        || lobName(r.subProductId).toLowerCase().includes(q)
        || (r.insuranceType ?? '').toLowerCase().includes(q);
  });

  function openAdd() {
    setEditTarget(null);
    setForm({ ...EMPTY_PROD_FORM });
    setShowModal(true);
  }

  function openEdit(row: any) {
    setEditTarget(row);
    setForm({
      insuranceType:    row.insuranceType    ?? '',
      lineOfBusinessId: row.lineOfBusinessId ?? '',
      subProductId:     row.subProductId     ?? '',
      state:            Array.isArray(row.states) ? (row.states[0] ?? '') : '',
      newBusinessPct:   String(row.newBusinessPct ?? ''),
      renewalPct:       String(row.renewalPct     ?? ''),
      effectiveDate:    row.effectiveDate    ?? '',
    });
    setShowModal(true);
  }

  async function saveProduct() {
    const iid = record.id as number;
    const payload = {
      company_id:              1,
      product_id:              form.lineOfBusinessId !== '' ? Number(form.lineOfBusinessId) : null,
      sub_product_id:          form.subProductId     !== '' ? Number(form.subProductId)     : null,
      juridiction_state:       form.state            || null,
      insurance_type:          form.insuranceType    || null,
      effective_date:          form.effectiveDate    || null,
      new_business_commission: form.newBusinessPct   !== '' ? Number(form.newBusinessPct) : null,
      renewal_commission:      form.renewalPct       !== '' ? Number(form.renewalPct)     : null,
    };
    try {
      if (editTarget) {
        const updated = await api.commissions.update(iid, editTarget.id, payload);
        setRows(prev => prev.map((r: any) => r.id === editTarget.id ? {
          ...r,
          insuranceType:    updated.insurance_type,
          lineOfBusinessId: updated.product_id,
          subProductId:     updated.sub_product_id,
          states:           updated.juridiction_state ? [updated.juridiction_state] : [],
          newBusinessPct:   updated.new_business_commission,
          renewalPct:       updated.renewal_commission,
          effectiveDate:    updated.effective_date ? String(updated.effective_date).slice(0, 10) : '',
        } : r));
      } else {
        const created = await api.commissions.create(iid, payload);
        setRows(prev => [...prev, {
          id:               created.id,
          company:          FALLBACK_COMPANIES[0],
          insuranceType:    created.insurance_type,
          lineOfBusinessId: created.product_id,
          subProductId:     created.sub_product_id,
          states:           created.juridiction_state ? [created.juridiction_state] : [],
          newBusinessPct:   created.new_business_commission,
          renewalPct:       created.renewal_commission,
          effectiveDate:    created.effective_date ? String(created.effective_date).slice(0, 10) : '',
        }]);
      }
      setShowModal(false);
    } catch (e: any) {
      alert(e.message ?? 'Failed to save product');
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const iid = record.id as number;
    try {
      if (iid && typeof deleteTarget.id === 'number') {
        await api.commissions.remove(iid, deleteTarget.id);
      }
      setRows(prev => prev.filter((r: any) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e: any) {
      alert(e.message ?? 'Failed to delete');
    }
  }

  function ff(k: string) { return (v: string) => setForm(p => ({ ...p, [k]: v })); }

  return (
    <div className="vi-products-layout" style={{ gridTemplateColumns: panelCollapsed ? '1fr' : '220px 1fr' }}>

      {/* Left: company list */}
      {!panelCollapsed && (
        <div className="vi-company-panel">
          <div className="vi-company-panel__hdr">
            <span>List of Client Companies</span>
            <button className="vi-company-panel__collapse" title="Collapse"
              onClick={() => setPanelCollapsed(true)}>≡</button>
          </div>
          <div className="vi-company-list">
            {companies.map(co => (
              <div key={co}
                className={`vi-company-item${selectedCompany === co ? ' vi-company-item--active' : ''}`}
                onClick={() => { setSelectedCompany(co); setSearchQuery(''); }}>
                {selectedCompany === co && <span className="vi-company-item__check">✓</span>}
                <span>{co}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Right: products panel */}
      <div className="vi-products-panel">
        <div className="vi-products-panel__hdr">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {panelCollapsed && (
              <button className="vi-company-panel__collapse"
                title="Expand" onClick={() => setPanelCollapsed(false)}>≡</button>
            )}
            <div>
              <div className="vi-products-panel__title">{selectedCompany || 'Select a company'}</div>
              <div className="vi-products-panel__sub">Add Default Commission for LOB &amp; State</div>
            </div>
          </div>
          <div className="vi-products-panel__actions">
            <input className="vi-search-input" placeholder="Search by Keyword" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)} style={{ width: 200 }} />
            <button className="vi-btn-primary" onClick={openAdd}>+ Add Product</button>
          </div>
        </div>

        <div className="vi-products-panel__body">
          <table className="vi-prod-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>#</th>
                <th style={{ width: 80 }}>Actions</th>
                <th>Effective Date</th>
                <th><span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>Line of Business <span style={{ color:'#9ca3af', fontSize:10 }}>▽</span></span></th>
                <th><span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>Sub-Product <span style={{ color:'#9ca3af', fontSize:10 }}>▽</span></span></th>
                <th><span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>Insurance Type <span style={{ color:'#9ca3af', fontSize:10 }}>▽</span></span></th>
                <th><span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>New Business % <span style={{ color:'#9ca3af', fontSize:10 }}>▽</span></span></th>
                <th>Renewal %</th>
                <th><span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>State <span style={{ color:'#9ca3af', fontSize:10 }}>▽</span></span></th>
              </tr>
            </thead>
            <tbody>
              {displayedRows.length === 0
                ? <tr><td colSpan={9} className="vi-empty">No products for this company.</td></tr>
                : displayedRows.map((r: any, i: number) => (
                  <tr key={r.id}>
                    <td className="vi-td-num">{i + 1}</td>
                    <td className="vi-td-action">
                      <button className="vi-tbl-icon-btn" title="Edit"
                        onClick={() => openEdit(r)}><PencilIcon /></button>
                      <button className="vi-tbl-icon-btn vi-tbl-icon-btn--del" title="Delete"
                        onClick={() => setDeleteTarget(r)}><TrashIcon /></button>
                    </td>
                    <td>{r.effectiveDate          || '—'}</td>
                    <td>{lobName(r.lineOfBusinessId)}</td>
                    <td>{lobName(r.subProductId)}</td>
                    <td>{r.insuranceType         || '—'}</td>
                    <td>{r.newBusinessPct ? `${r.newBusinessPct}%` : '—'}</td>
                    <td>{r.renewalPct     ? `${r.renewalPct}%`    : '—'}</td>
                    <td>{Array.isArray(r.states) ? r.states.join(', ') || '—' : '—'}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="vi-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="vi-modal" onClick={e => e.stopPropagation()}>
            <div className="vi-modal__hdr">
              <h3 className="vi-modal__title">{editTarget ? 'Edit Product' : 'Add Product'}</h3>
              <button className="vi-modal__close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="vi-modal__body">
              <div className="vi-form-row">
                <div className="vi-form-field">
                  <span className="vi-form-label">Insurance Type</span>
                  <select className="vi-select" value={form.insuranceType}
                    onChange={e => ff('insuranceType')(e.target.value)}>
                    <option value="">Select…</option>
                    {insurTypes.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="vi-form-field">
                  <span className="vi-form-label">Line of Business</span>
                  <select className="vi-select" value={form.lineOfBusinessId}
                    onChange={e => ff('lineOfBusinessId')(e.target.value)}>
                    <option value="">Select…</option>
                    {lobs.map(l => <option key={l.id} value={l.id}>{l.product_name}</option>)}
                  </select>
                </div>
              </div>
              <div className="vi-form-row">
                <div className="vi-form-field">
                  <span className="vi-form-label">Sub-Product</span>
                  <select className="vi-select" value={form.subProductId}
                    onChange={e => ff('subProductId')(e.target.value)}>
                    <option value="">Select…</option>
                    {subProds.map(s => <option key={s.id} value={s.id}>{s.product_name}</option>)}
                  </select>
                </div>
                <div className="vi-form-field">
                  <span className="vi-form-label">State</span>
                  <select className="vi-select" value={form.state}
                    onChange={e => ff('state')(e.target.value)}>
                    <option value="">Select…</option>
                    {US_STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="vi-form-row">
                <div className="vi-form-field">
                  <span className="vi-form-label">New Business Commission %</span>
                  <input className="vi-input" type="number" min="0" max="100"
                    value={form.newBusinessPct}
                    onChange={e => ff('newBusinessPct')(e.target.value)}
                    placeholder="e.g. 15" />
                </div>
                <div className="vi-form-field">
                  <span className="vi-form-label">Renewal Commission %</span>
                  <input className="vi-input" type="number" min="0" max="100"
                    value={form.renewalPct}
                    onChange={e => ff('renewalPct')(e.target.value)}
                    placeholder="e.g. 20" />
                </div>
              </div>
              <div className="vi-form-row vi-form-row--1">
                <div className="vi-form-field">
                  <span className="vi-form-label">Effective Date</span>
                  <input className="vi-input" type="date" value={form.effectiveDate}
                    onChange={e => ff('effectiveDate')(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="vi-modal__foot">
              <button className="vi-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="vi-btn-save" onClick={saveProduct}>
                {editTarget ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="vi-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="vi-modal vi-modal--sm" onClick={e => e.stopPropagation()}>
            <div className="vi-modal__body">
              <div className="vi-delete-confirm">
                <div className="vi-delete-confirm__icon">🗑️</div>
                <p className="vi-delete-confirm__title">Are you sure?</p>
                <p className="vi-delete-confirm__sub">
                  This will permanently remove <strong>{lobName(deleteTarget.lineOfBusinessId) || 'this product'}</strong>.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button className="vi-btn-cancel" onClick={() => setDeleteTarget(null)}>No, Keep It</button>
                  <button className="vi-btn-danger" onClick={confirmDelete}>Yes, Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB 4 — PRODUCERS
// ══════════════════════════════════════════════════════════════════

const EMPTY_PRODUCER_FORM = {
  status: true, profilePicUrl: '',
  firstName: '', middleName: '', lastName: '', suffix: '',
  country: 'USA', residentState: '',
  licReq: 'Separate' as 'Separate' | 'Combined',
  combinedLicense: '', plLicense: '', clLicense: '',
  isManager: false, reportsTo: '',
  phone: '', extension: '', altPhone: '', email: '',
  addrLine1: '', addrLine2: '', addrCountry: 'USA',
  addrState: '', city: '', county: '',
  zipCode: '', latitude: '', longitude: '',
};

function producerDisplayName(form: any): string {
  return [form.firstName, form.middleName, form.lastName].filter(Boolean).join(' ') || 'Unnamed Producer';
}

function ProducerCard({ producer, allProducers, onUpdate }: {
  producer: any;
  allProducers: any[];
  onUpdate: (updated: any) => void;
}) {
  const pcLicOpts = useDropdown('PCLICENSETYPE');

  const [expanded,    setExpanded]    = useState(false);
  const [editPrim,    setEditPrim]    = useState(false);
  const [editContact, setEditContact] = useState(false);
  const [editAddr,    setEditAddr]    = useState(false);
  const [primForm,    setPrimForm]    = useState<any>({});
  const [contactForm, setContactForm] = useState<any>({});
  const [addrForm,    setAddrForm]    = useState<any>({});

  const f = producer.form ?? {};
  const name     = producerDisplayName(f);
  const initials = [f.firstName?.[0], f.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  function mergeAndSave(patch: any) {
    const updated = { ...producer, form: { ...f, ...patch } };
    onUpdate(updated);
  }

  function fp(k: string) { return (v: any) => setPrimForm((p: any) => ({ ...p, [k]: v })); }
  function fc(k: string) { return (v: string) => setContactForm((p: any) => ({ ...p, [k]: v })); }
  function fa(k: string) { return (v: string) => setAddrForm((p: any) => ({ ...p, [k]: v })); }

  const otherProducers = allProducers.filter(p => p.id !== producer.id && p.saved);

  return (
    <div className={`vi-producer-card${expanded ? ' vi-producer-card--open' : ''}`}>

      {/* Card header */}
      <div className="vi-producer-card__hdr" onClick={() => setExpanded(e => !e)}>
        <div className="vi-producer-card__hdr-left">
          <div className="vi-producer-card__expand">{expanded ? '−' : '+'}</div>
          <div className="vi-avatar-placeholder" style={{ width: 36, height: 36, fontSize: 13 }}>
            {f.profilePicUrl ? <img src={f.profilePicUrl} alt="profile" /> : initials}
          </div>
          <div>
            <div className="vi-producer-card__name">{name}</div>
            <div className="vi-producer-card__meta">
              ID: {String(producer.id).slice(-8).toUpperCase()} · {f.residentState || '—'}
            </div>
          </div>
        </div>
        <span className={`badge ${f.status ? 'badge--active' : 'badge--inactive'}`}>
          • {f.status ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="vi-producer-card__body">

          {/* Left: Primary Information */}
          <div className="vi-producer-section">
            <div className="vi-card__hdr" style={{ margin: '-14px -16px 12px', borderRadius: 0 }}>
              <span className="vi-card__title">Producer Primary Information</span>
              {!editPrim && (
                <button className="vi-icon-btn" onClick={e => { e.stopPropagation(); setPrimForm({ ...f }); setEditPrim(true); }}>
                  <PencilIcon />
                </button>
              )}
            </div>
            <div className="vi-prod-profile-row">
              <div className="vi-avatar-placeholder" style={{ width: 48, height: 48 }}>
                {f.profilePicUrl ? <img src={f.profilePicUrl} alt="" /> : initials}
              </div>
            </div>

            {!editPrim ? (
              <div className="vi-field-grid">
                <div className="vi-field"><span className="vi-label">First Name</span><span className="vi-value">{f.firstName || '—'}</span></div>
                <div className="vi-field"><span className="vi-label">Middle Name</span><span className="vi-value vi-value--muted">{f.middleName || '—'}</span></div>
                <div className="vi-field"><span className="vi-label">Last Name</span><span className="vi-value">{f.lastName || '—'}</span></div>
                <div className="vi-field"><span className="vi-label">Suffix</span><span className="vi-value vi-value--muted">{f.suffix || '—'}</span></div>
                <div className="vi-field"><span className="vi-label">Producer ID</span><span className="vi-value vi-value--mono">{String(producer.id).toUpperCase()}</span></div>
                <div className="vi-field">
                  <span className="vi-label">Status</span>
                  <span className={`badge ${f.status ? 'badge--active' : 'badge--inactive'}`}>• {f.status ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="vi-field"><span className="vi-label">Country</span><span className="vi-value">{f.country || '—'}</span></div>
                <div className="vi-field"><span className="vi-label">Resident State</span><span className="vi-value">{f.residentState || '—'}</span></div>
                <div className="vi-field"><span className="vi-label">P&amp;C Licensing Type</span><span className="vi-value">{f.licReq || '—'}</span></div>
                {f.licReq === 'Combined'
                  ? <div className="vi-field"><span className="vi-label">P&amp;C Combined License</span><span className="vi-value vi-value--mono">{f.combinedLicense || '—'}</span></div>
                  : <>
                      <div className="vi-field"><span className="vi-label">PL License</span><span className="vi-value vi-value--mono">{f.plLicense || '—'}</span></div>
                      <div className="vi-field"><span className="vi-label">CL License</span><span className="vi-value vi-value--mono">{f.clLicense || '—'}</span></div>
                    </>
                }
                <div className="vi-field"><span className="vi-label">Is Manager</span><span className="vi-value">{f.isManager ? 'Yes' : 'No'}</span></div>
                <div className="vi-field">
                  <span className="vi-label">Reports To</span>
                  <span className="vi-value vi-value--muted">
                    {f.reportsTo
                      ? producerDisplayName(allProducers.find(p => p.id === f.reportsTo)?.form ?? {}) || f.reportsTo
                      : '—'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="vi-field-grid">
                <div className="vi-field"><span className="vi-label">First Name</span><input className="vi-input" value={primForm.firstName || ''} onChange={e => fp('firstName')(e.target.value)} /></div>
                <div className="vi-field"><span className="vi-label">Middle Name</span><input className="vi-input" value={primForm.middleName || ''} onChange={e => fp('middleName')(e.target.value)} /></div>
                <div className="vi-field"><span className="vi-label">Last Name</span><input className="vi-input" value={primForm.lastName || ''} onChange={e => fp('lastName')(e.target.value)} /></div>
                <div className="vi-field"><span className="vi-label">Suffix</span><input className="vi-input" value={primForm.suffix || ''} onChange={e => fp('suffix')(e.target.value)} /></div>
                <div className="vi-field">
                  <span className="vi-label">Status</span>
                  <label className="vi-toggle-wrap">
                    <label className="vi-toggle">
                      <input type="checkbox" checked={!!primForm.status} onChange={e => fp('status')(e.target.checked)} />
                      <span className="vi-toggle-slider" />
                    </label>
                    <span className="vi-toggle-label">{primForm.status ? 'Active' : 'Inactive'}</span>
                  </label>
                </div>
                <div className="vi-field"><span className="vi-label">Country</span><input className="vi-input" value={primForm.country || ''} onChange={e => fp('country')(e.target.value)} /></div>
                <div className="vi-field">
                  <span className="vi-label">Resident State</span>
                  <select className="vi-select" value={primForm.residentState || ''} onChange={e => fp('residentState')(e.target.value)}>
                    <option value="">Select…</option>
                    {US_STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="vi-field">
                  <span className="vi-label">P&amp;C Licensing Type</span>
                  <select className="vi-select" value={primForm.licReq || 'Separate'} onChange={e => fp('licReq')(e.target.value)}>
                    {(pcLicOpts.length ? pcLicOpts : ['Separate', 'Combined']).map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                {primForm.licReq === 'Combined'
                  ? <div className="vi-field"><span className="vi-label">P&amp;C Combined License</span><input className="vi-input" value={primForm.combinedLicense || ''} onChange={e => fp('combinedLicense')(e.target.value)} /></div>
                  : <>
                      <div className="vi-field"><span className="vi-label">PL License</span><input className="vi-input" value={primForm.plLicense || ''} onChange={e => fp('plLicense')(e.target.value)} /></div>
                      <div className="vi-field"><span className="vi-label">CL License</span><input className="vi-input" value={primForm.clLicense || ''} onChange={e => fp('clLicense')(e.target.value)} /></div>
                    </>
                }
                <div className="vi-field">
                  <span className="vi-label">Is Manager</span>
                  <label className="vi-toggle-wrap">
                    <label className="vi-toggle">
                      <input type="checkbox" checked={!!primForm.isManager} onChange={e => fp('isManager')(e.target.checked)} />
                      <span className="vi-toggle-slider" />
                    </label>
                    <span className="vi-toggle-label">{primForm.isManager ? 'Yes' : 'No'}</span>
                  </label>
                </div>
                <div className="vi-field">
                  <span className="vi-label">Reports To</span>
                  <select className="vi-select" value={primForm.reportsTo || ''} onChange={e => fp('reportsTo')(e.target.value)}>
                    <option value="">—</option>
                    {otherProducers.map(p => <option key={p.id} value={p.id}>{producerDisplayName(p.form)}</option>)}
                  </select>
                </div>
                <div className="vi-edit-actions" style={{ gridColumn: '1 / -1' }}>
                  <button className="vi-btn-cancel" onClick={() => setEditPrim(false)}>Cancel</button>
                  <button className="vi-btn-save" onClick={() => { mergeAndSave(primForm); setEditPrim(false); }}>Save</button>
                </div>
              </div>
            )}
            <button className="vi-btn-reset" onClick={e => e.stopPropagation()}>🔒 Reset Producer Password</button>
          </div>

          {/* Right: Contact Details + Office Address */}
          <div className="vi-producer-section">
            <div className="vi-card__hdr" style={{ margin: '-14px -16px 12px', borderRadius: 0 }}>
              <span className="vi-card__title">Contact Details</span>
              {!editContact && (
                <button className="vi-icon-btn" onClick={e => { e.stopPropagation(); setContactForm({ ...f }); setEditContact(true); }}>
                  <PencilIcon />
                </button>
              )}
            </div>
            {!editContact ? (
              <div className="vi-field-grid">
                <div className="vi-field"><span className="vi-label">Phone</span><span className="vi-value vi-value--mono">{f.phone || '—'}</span></div>
                <div className="vi-field"><span className="vi-label">Extension</span><span className="vi-value">{f.extension || '—'}</span></div>
                <div className="vi-field"><span className="vi-label">Alt Phone</span><span className="vi-value vi-value--mono">{f.altPhone || '—'}</span></div>
                <div className="vi-field"><span className="vi-label">Email</span><span className="vi-value vi-value--muted">{f.email || '—'}</span></div>
              </div>
            ) : (
              <div className="vi-field-grid">
                <div className="vi-field"><span className="vi-label">Phone</span><input className="vi-input" value={contactForm.phone || ''} onChange={e => fc('phone')(e.target.value)} /></div>
                <div className="vi-field"><span className="vi-label">Extension</span><input className="vi-input" value={contactForm.extension || ''} onChange={e => fc('extension')(e.target.value)} /></div>
                <div className="vi-field"><span className="vi-label">Alt Phone</span><input className="vi-input" value={contactForm.altPhone || ''} onChange={e => fc('altPhone')(e.target.value)} /></div>
                <div className="vi-field"><span className="vi-label">Email</span><input className="vi-input" value={contactForm.email || ''} onChange={e => fc('email')(e.target.value)} /></div>
                <div className="vi-edit-actions" style={{ gridColumn: '1 / -1' }}>
                  <button className="vi-btn-cancel" onClick={() => setEditContact(false)}>Cancel</button>
                  <button className="vi-btn-save" onClick={() => { mergeAndSave(contactForm); setEditContact(false); }}>Save</button>
                </div>
              </div>
            )}

            <div className="vi-sub-title">Office Address</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              {!editAddr && (
                <button className="vi-icon-btn" onClick={e => { e.stopPropagation(); setAddrForm({ ...f }); setEditAddr(true); }}>
                  <PencilIcon />
                </button>
              )}
            </div>
            {!editAddr ? (
              <div className="vi-field-grid">
                <div className="vi-field" style={{ gridColumn: '1 / -1' }}><span className="vi-label">Address Line 1</span><span className="vi-value">{f.addrLine1 || '—'}</span></div>
                <div className="vi-field" style={{ gridColumn: '1 / -1' }}><span className="vi-label">Address Line 2</span><span className="vi-value vi-value--muted">{f.addrLine2 || '—'}</span></div>
                <div className="vi-field"><span className="vi-label">Country</span><span className="vi-value">{f.addrCountry || '—'}</span></div>
                <div className="vi-field"><span className="vi-label">State</span><span className="vi-value">{f.addrState || '—'}</span></div>
                <div className="vi-field"><span className="vi-label">City</span><span className="vi-value">{f.city || '—'}</span></div>
                <div className="vi-field"><span className="vi-label">County</span><span className="vi-value vi-value--muted">{f.county || '—'}</span></div>
                <div className="vi-field"><span className="vi-label">Zip</span><span className="vi-value vi-value--mono">{f.zipCode || '—'}</span></div>
                <div className="vi-field"><span className="vi-label">Latitude</span><span className="vi-value vi-value--muted">{f.latitude || '—'}</span></div>
                <div className="vi-field"><span className="vi-label">Longitude</span><span className="vi-value vi-value--muted">{f.longitude || '—'}</span></div>
              </div>
            ) : (
              <div className="vi-field-grid">
                <div className="vi-field" style={{ gridColumn: '1 / -1' }}><span className="vi-label">Address Line 1</span><input className="vi-input" value={addrForm.addrLine1 || ''} onChange={e => fa('addrLine1')(e.target.value)} /></div>
                <div className="vi-field" style={{ gridColumn: '1 / -1' }}><span className="vi-label">Address Line 2</span><input className="vi-input" value={addrForm.addrLine2 || ''} onChange={e => fa('addrLine2')(e.target.value)} /></div>
                <div className="vi-field"><span className="vi-label">Country</span><input className="vi-input" value={addrForm.addrCountry || ''} onChange={e => fa('addrCountry')(e.target.value)} /></div>
                <div className="vi-field">
                  <span className="vi-label">State</span>
                  <select className="vi-select" value={addrForm.addrState || ''} onChange={e => fa('addrState')(e.target.value)}>
                    <option value="">Select…</option>
                    {US_STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="vi-field"><span className="vi-label">City</span><input className="vi-input" value={addrForm.city || ''} onChange={e => fa('city')(e.target.value)} /></div>
                <div className="vi-field"><span className="vi-label">County</span><input className="vi-input" value={addrForm.county || ''} onChange={e => fa('county')(e.target.value)} /></div>
                <div className="vi-field"><span className="vi-label">Zip</span><input className="vi-input" value={addrForm.zipCode || ''} onChange={e => fa('zipCode')(e.target.value)} /></div>
                <div className="vi-field"><span className="vi-label">Latitude</span><input className="vi-input" value={addrForm.latitude || ''} onChange={e => fa('latitude')(e.target.value)} /></div>
                <div className="vi-field"><span className="vi-label">Longitude</span><input className="vi-input" value={addrForm.longitude || ''} onChange={e => fa('longitude')(e.target.value)} /></div>
                <div className="vi-edit-actions" style={{ gridColumn: '1 / -1' }}>
                  <button className="vi-btn-cancel" onClick={() => setEditAddr(false)}>Cancel</button>
                  <button className="vi-btn-save" onClick={() => { mergeAndSave(addrForm); setEditAddr(false); }}>Save</button>
                </div>
              </div>
            )}
          </div>

          {/* NR States — full width */}
          <div className="vi-producer-nrstates">
            <div className="vi-nr-title" style={{ marginBottom: 8 }}>Non-Resident State(s)</div>
            <table className="vi-table">
              <thead>
                <tr>
                  <th className="vi-td-num">#</th>
                  <th>State Name</th>
                  <th>P&amp;C Licensing Req</th>
                  <th>P&amp;C Combined License</th>
                  <th>PL License</th>
                  <th>CL License</th>
                </tr>
              </thead>
              <tbody>
                {(f.nrStates ?? []).length === 0
                  ? <tr><td colSpan={6} className="vi-empty">No non-resident states.</td></tr>
                  : (f.nrStates ?? []).map((s: any, i: number) => (
                    <tr key={s.id ?? i}>
                      <td className="vi-td-num">{i + 1}</td>
                      <td>{s.state}</td>
                      <td>{s.licReq || '—'}</td>
                      <td className="vi-td-mono">{s.combinedLicense || '—'}</td>
                      <td className="vi-td-mono">{s.plLicense || '—'}</td>
                      <td className="vi-td-mono">{s.clLicense || '—'}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ProducersTab({ record, onRecordChange: _onRecordChange }: {
  record: IntermediaryRecord;
  onRecordChange: (r: IntermediaryRecord) => void;
}) {
  const pcLicOpts = useDropdown('PCLICENSETYPE');

  const [producers,    setProducers]    = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [addForm,      setAddForm]      = useState<any>({ ...EMPTY_PRODUCER_FORM });

  useEffect(() => {
    const iid = record.id as number;
    if (!iid) return;
    api.producers.listByIntermediary(iid).then((rows: any[]) => {
      const mapped = rows.map((p: any) => ({
        id:      p.id,
        saved:   true,
        expanded: false,
        errors:  {},
        form: {
          status:          p.status_toggle ?? (p.status === 'Active'),
          profilePicUrl:   '',
          firstName:       p.first_name    ?? '',
          middleName:      p.middle_name   ?? '',
          lastName:        p.last_name     ?? '',
          suffix:          p.suffix        ?? '',
          country:         p.country       ?? 'USA',
          residentState:   p.residential_state ?? '',
          licReq:          p.pc_licence_requirement ?? 'Separate',
          combinedLicense: p.plcl_combined_license  ?? '',
          plLicense:       p.pl_license    ?? '',
          clLicense:       p.cl_license    ?? '',
          isManager:       p.is_manager    ?? false,
          reportsTo:       p.manager_id    ?? '',
          phone:           p.telephone_number      ?? '',
          extension:       p.extension             ?? '',
          altPhone:        p.alt_telephone_number  ?? '',
          email:           p.email                 ?? '',
          addrLine1: '', addrLine2: '', addrCountry: 'USA',
          addrState: '', city: '', county: '',
          zipCode: '', latitude: '', longitude: '',
          nrStates: [],
        },
      }));
      setProducers(mapped);
    }).catch(() => {});
  }, [record.id]);

  function updateProducer(updated: any) {
    setProducers(prev => prev.map(p => p.id === updated.id ? updated : p));
  }

  async function addProducer() {
    const iid = record.id as number;
    try {
      let os_user_id: number | null = null;
      if (addForm.email) {
        try {
          const user = await api.users.create({
            email:  addForm.email,
            name:   [addForm.firstName, addForm.lastName].filter(Boolean).join(' ') || null,
          });
          os_user_id = user.id;
        } catch { /* non-fatal */ }
      }

      const payload = {
        intermediary_db_id:        iid,
        status:                    addForm.status ? 'Active' : 'Inactive',
        status_toggle:             addForm.status ?? true,
        first_name:                addForm.firstName,
        middle_name:               addForm.middleName  || null,
        last_name:                 addForm.lastName,
        suffix:                    addForm.suffix       || null,
        pc_licence_requirement:    addForm.licReq,
        country:                   addForm.country      || null,
        residential_state:         addForm.residentState || null,
        pl_license:                addForm.licReq === 'Separate' ? (addForm.plLicense || null) : null,
        cl_license:                addForm.licReq === 'Separate' ? (addForm.clLicense || null) : null,
        plcl_combined_license:     addForm.licReq === 'Combined' ? (addForm.combinedLicense || null) : null,
        telephone_number_cc:       null,
        telephone_number:          addForm.phone        || null,
        alt_telephone_number_cc:   null,
        alt_telephone_number:      addForm.altPhone     || null,
        extension:                 addForm.extension    || null,
        email:                     addForm.email        || null,
        is_manager:                addForm.isManager    ?? false,
        manager_id:                addForm.reportsTo    || null,
        os_user_id,
      };
      const created = await api.producers.create(payload);
      const newProd = {
        id:      created.id,
        saved:   true,
        expanded: false,
        errors:  {},
        form: {
          ...addForm,
          status: created.status_toggle ?? (created.status === 'Active'),
          nrStates: [],
        },
      };
      setProducers(prev => [...prev, newProd]);
      setShowAddModal(false);
      setAddForm({ ...EMPTY_PRODUCER_FORM });
    } catch (e: any) {
      alert(e.message ?? 'Failed to add producer');
    }
  }

  function af(k: string) { return (v: any) => setAddForm((p: any) => ({ ...p, [k]: v })); }

  const savedProducers = producers.filter(p => p.saved);

  return (
    <div>
      <div className="vi-producers-hdr">
        <span style={{ fontSize: 13, color: '#6b7280' }}>{savedProducers.length} producer(s)</span>
        <div className="vi-producers-hdr__actions">
          <button className="vi-btn-outline" onClick={() => setShowBulkUpload(true)}>Producer Bulk Upload</button>
          <button className="vi-btn-primary" onClick={() => { setAddForm({ ...EMPTY_PRODUCER_FORM }); setShowAddModal(true); }}>
            + Add Producers
          </button>
        </div>
      </div>

      {savedProducers.length === 0
        ? <p className="vi-empty">No producers added.</p>
        : savedProducers.map(p => (
            <ProducerCard key={p.id} producer={p} allProducers={producers} onUpdate={updateProducer} />
          ))
      }

      {showBulkUpload && <BulkUploadModal onClose={() => setShowBulkUpload(false)} />}

      {/* Add Producer Modal */}
      {showAddModal && (
        <div className="vi-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="vi-modal" style={{ width: 620 }} onClick={e => e.stopPropagation()}>
            <div className="vi-modal__hdr">
              <h3 className="vi-modal__title">Add Producer</h3>
              <button className="vi-modal__close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="vi-modal__body">
              <div className="vi-form-row">
                <div className="vi-form-field"><span className="vi-form-label">First Name</span><input className="vi-input" value={addForm.firstName} onChange={e => af('firstName')(e.target.value)} /></div>
                <div className="vi-form-field"><span className="vi-form-label">Last Name</span><input className="vi-input" value={addForm.lastName} onChange={e => af('lastName')(e.target.value)} /></div>
              </div>
              <div className="vi-form-row">
                <div className="vi-form-field"><span className="vi-form-label">Middle Name</span><input className="vi-input" value={addForm.middleName} onChange={e => af('middleName')(e.target.value)} /></div>
                <div className="vi-form-field"><span className="vi-form-label">Suffix</span><input className="vi-input" value={addForm.suffix} onChange={e => af('suffix')(e.target.value)} /></div>
              </div>
              <div className="vi-form-row">
                <div className="vi-form-field"><span className="vi-form-label">Country</span><input className="vi-input" value={addForm.country} onChange={e => af('country')(e.target.value)} /></div>
                <div className="vi-form-field">
                  <span className="vi-form-label">Resident State</span>
                  <select className="vi-select" value={addForm.residentState} onChange={e => af('residentState')(e.target.value)}>
                    <option value="">Select…</option>
                    {US_STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="vi-form-row">
                <div className="vi-form-field"><span className="vi-form-label">Phone</span><input className="vi-input" value={addForm.phone} onChange={e => af('phone')(e.target.value)} /></div>
                <div className="vi-form-field"><span className="vi-form-label">Email</span><input className="vi-input" value={addForm.email} onChange={e => af('email')(e.target.value)} /></div>
              </div>
              <div className="vi-form-row">
                <div className="vi-form-field">
                  <span className="vi-form-label">P&amp;C Licensing Type</span>
                  <select className="vi-select" value={addForm.licReq} onChange={e => af('licReq')(e.target.value)}>
                    {(pcLicOpts.length ? pcLicOpts : ['Separate', 'Combined']).map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                {addForm.licReq === 'Combined'
                  ? <div className="vi-form-field"><span className="vi-form-label">Combined License</span><input className="vi-input" value={addForm.combinedLicense} onChange={e => af('combinedLicense')(e.target.value)} /></div>
                  : <div className="vi-form-field"><span className="vi-form-label">PL License</span><input className="vi-input" value={addForm.plLicense} onChange={e => af('plLicense')(e.target.value)} /></div>
                }
              </div>
              {addForm.licReq === 'Separate' && (
                <div className="vi-form-row vi-form-row--1">
                  <div className="vi-form-field"><span className="vi-form-label">CL License</span><input className="vi-input" value={addForm.clLicense} onChange={e => af('clLicense')(e.target.value)} /></div>
                </div>
              )}
              <div className="vi-form-row">
                <div className="vi-form-field">
                  <span className="vi-form-label">Is Manager</span>
                  <label className="vi-toggle-wrap">
                    <label className="vi-toggle">
                      <input type="checkbox" checked={addForm.isManager} onChange={e => af('isManager')(e.target.checked)} />
                      <span className="vi-toggle-slider" />
                    </label>
                    <span className="vi-toggle-label">{addForm.isManager ? 'Yes' : 'No'}</span>
                  </label>
                </div>
                {!addForm.isManager && (
                  <div className="vi-form-field">
                    <span className="vi-form-label">Reports To</span>
                    <select className="vi-select" value={addForm.reportsTo} onChange={e => af('reportsTo')(e.target.value)}>
                      <option value="">—</option>
                      {savedProducers.map(p => <option key={p.id} value={p.id}>{producerDisplayName(p.form)}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="vi-modal__foot">
              <button className="vi-btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="vi-btn-save" onClick={addProducer}>Add Producer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function ViewIntermediaryPage({ record: initialRecord, onBack }: ViewIntermediaryPageProps) {
  const [activeTab, setActiveTab] = useState<TabId>('details');
  const [record, setRecord] = useState<IntermediaryRecord>(initialRecord);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'details',   label: 'Intermediary Details' },
    { id: 'rights',    label: 'Assigned Rights'      },
    { id: 'products',  label: 'Assigned Products'    },
    { id: 'producers', label: 'Producers'            },
    { id: 'timeline',  label: 'Timeline'             },
  ];

  return (
    <>
      <main className="app-page distribution-detail-page">
        <div className="distribution-detail-header">
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
            <span style={{ cursor: 'pointer', color: '#0B5AA0' }} onClick={onBack}>Distribution Management</span>
            {' / '}Intermediary Details
          </div>
          <div className="distribution-detail-header__row">
            <div className="distribution-detail-title-wrap">
              <h1 className="distribution-detail-title">{record.name}</h1>
              <span className={STATUS_CLS[record.status] ?? 'badge badge--draft'}>• {record.status}</span>
            </div>
            <button className="btn-secondary" type="button" style={{ fontSize: 13, padding: '7px 16px' }} onClick={onBack}>Back</button>
          </div>
        </div>

        <div className="vi-tabs">
          {tabs.map(t => (
            <button key={t.id} type="button"
              className={`vi-tab${activeTab === t.id ? ' vi-tab--active' : ''}`}
              onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'details' && (
          <DetailsTab record={record} onRecordChange={setRecord} />
        )}

        {activeTab === 'rights' && (
          <RightsTab record={record} onRecordChange={setRecord} />
        )}

        {activeTab === 'products' && (
          <ProductsTab record={record} onRecordChange={setRecord} />
        )}

        {activeTab === 'producers' && (
          <ProducersTab record={record} onRecordChange={setRecord} />
        )}

        {activeTab === 'timeline' && (
          <div className="vi-coming-soon">
            <div className="vi-coming-soon__icon">🕐</div>
            <p className="vi-coming-soon__text">Coming Soon</p>
            <p className="vi-coming-soon__sub">Timeline view is under development.</p>
          </div>
        )}
      </main>
    </>
  );
}

