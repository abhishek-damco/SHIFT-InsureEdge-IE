import React, { useState, useEffect } from 'react';
import { finalizeDraft } from './draftUtils';
import { distributionApi as api } from '../../api/distribution';

interface ReviewSubmitPageProps {
  onBack: () => void;
  onEditIntermediary: () => void;
  onEditRights: () => void;
  onEditProducts: () => void;
  onEditProducers: () => void;
  onSubmit: () => void;
}

const STEPS = [
  { n: 1, label: ['Add', 'Intermediary Details'] },
  { n: 2, label: ['Assign', 'Rights']            },
  { n: 3, label: ['Assign', 'Products']          },
  { n: 4, label: ['Add', 'Producers']            },
  { n: 5, label: ['Review', 'and Submit']        },
];

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function buildAddress(f: any): string {
  return [f.addrLine1, f.addrLine2, f.city, f.addrState, f.addrCountry, f.zipCode]
    .filter(Boolean).join(' ');
}

export default function ReviewSubmitPage({
  onBack, onEditIntermediary, onEditRights, onEditProducts, onEditProducers, onSubmit,
}: ReviewSubmitPageProps) {
  const [step1, setStep1]             = useState<any>(null);
  const [step2Modules, setStep2Mod]   = useState<any[]>([]);
  const [step3Rows, setStep3Rows]     = useState<any[]>([]);
  const [step4Producers, setStep4Pro] = useState<any[]>([]);

  useEffect(() => {
    try {
      const s1 = sessionStorage.getItem('shift_step1');
      if (s1) setStep1(JSON.parse(s1));
      const s2 = sessionStorage.getItem('shift_step2');
      if (s2) { const m = JSON.parse(s2); if (Array.isArray(m)) setStep2Mod(m); }
      const s3 = sessionStorage.getItem('shift_step3');
      if (s3) { const r = JSON.parse(s3); if (Array.isArray(r)) setStep3Rows(r); }
      const s4 = sessionStorage.getItem('shift_step4');
      if (s4) { const r = JSON.parse(s4); if (Array.isArray(r)) setStep4Pro(r); }
    } catch { /* ignore */ }
  }, []);

  const [openSections, setOpenSections] = useState<Set<number>>(() => new Set([0]));

  function toggleSection(idx: number) {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }

  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const s1 = sessionStorage.getItem('shift_step1');
      const s2 = sessionStorage.getItem('shift_step2');
      const s3 = sessionStorage.getItem('shift_step3');
      const s4 = sessionStorage.getItem('shift_step4');

      if (s1) {
        const step1Data  = JSON.parse(s1);
        const { form: f, contacts: c, nrStates: nrs } = step1Data;
        const status = f?.status ? 'Active' : 'Inactive';

        const created = await api.intermediaries.create({
          status, status_toggle: f?.status ?? true,
          intermediary_name: f?.name || 'Unnamed Intermediary',
          doing_business_as: f?.dba || null,
          legal_entity: f?.legalEntity || null,
          federal_tax_id: f?.federalTaxId || null,
          type_of_intermediary: f?.intermediaryType || null,
          country: f?.country || null,
          residential_state: f?.residentState || null,
          license: f?.licenseNumber || null,
          allow_full_producer_visibility: f?.fullProducerVisibility ?? false,
          commission_disburse_email: f?.commEmail || null,
          last_step: 5,
        });

        const iid = created.id;

        if (Array.isArray(c)) {
          for (const [idx, contact] of c.entries()) {
            await api.contacts.create(iid, {
              name: contact.name, title: contact.title,
              telephone_number: contact.phone, email_id: contact.email, is_primary: idx === 0,
            }).catch(() => {});
          }
        }

        if (Array.isArray(nrs)) {
          for (const s of nrs) {
            await api.nrStates.create(iid, { state: s.state, license: s.license || null }).catch(() => {});
          }
        }

        if (s3) {
          const step3 = JSON.parse(s3);
          const products: any[] = Array.isArray(step3) ? step3 : (step3?.rows ?? []);
          for (const p of products) {
            await api.commissions.create(iid, {
              company_id: 1, juridiction_state: p.state || null, insurance_type: p.insuranceType || null,
              effective_date: p.effectiveDate || new Date().toISOString().split('T')[0],
              new_business_commission: p.newBusinessPct || null, renewal_commission: p.renewalPct || null,
            }).catch(() => {});
          }
        }

        if (s4) {
          const step4 = JSON.parse(s4);
          const producers: any[] = Array.isArray(step4) ? step4 : (step4?.producers ?? []);
          for (const prod of producers) {
            const pf = prod.form ?? prod;
            await api.producers.create({
              intermediary_id: iid, status: 'Active', status_toggle: true,
              first_name: pf.firstName || 'Unknown', last_name: pf.lastName || 'Unknown',
              residential_state: pf.residentState || null,
              pc_licence_requirement: pf.pcLicenseRequirement || 'Combined',
              telephone_number_cc: pf.phoneCC || '1', telephone_number: pf.phone || '0000000000',
              email: pf.email || null, country: pf.country || 'United States',
            }).catch(() => {});
          }
        }

        finalizeDraft(status, {
          name: f?.name || 'Unnamed Intermediary',
          intermediaryType: f?.intermediaryType || '',
          federalTaxId: f?.federalTaxId || '',
          primaryContactName: c?.[0]?.name ?? null,
          primaryContactTitle: c?.[0]?.title ?? null,
          residentState: f?.residentState || '',
        }, {
          step1: step1Data,
          step2: s2 ? JSON.parse(s2) : undefined,
          step3: s3 ? JSON.parse(s3) : undefined,
          step4: s4 ? JSON.parse(s4) : undefined,
        });
      }

      ['shift_step1','shift_step2','shift_step3','shift_step4'].forEach(k => sessionStorage.removeItem(k));
    } catch (err) {
      console.error('Submit error:', err);
    }
    setTimeout(onSubmit, 700);
  }

  const form     = step1?.form ?? {};
  const contacts = step1?.contacts ?? [];
  const nrStates = step1?.nrStates ?? [];
  const primary   = contacts[0] ?? {};
  const secondary = contacts[1] ?? null;
  const intName   = form.name ? form.name : 'New Intermediary';

  const assignedModules = step2Modules.filter((m: any) =>
    m.subGroups?.some((sg: any) =>
      sg.features?.some((f: any) => Object.values(f.perms ?? {}).some(Boolean))
    )
  );

  const savedProducers = step4Producers.filter((p: any) => p.saved);

  return (
    <main className="main">
      {/* Page heading + breadcrumb */}
      <div className="rv-page-header">
        <h1 className="rv-page-title">Add Intermediary / {intName}</h1>
        <p className="rv-breadcrumb">Distribution Management / Add Intermediary</p>
      </div>

      {/* Wizard bar */}
      <div className="rgt-wiz-bar">
        {STEPS.map((step, idx) => {
          const done   = step.n < 5;
          const active = step.n === 5;
          return (
            <React.Fragment key={step.n}>
              {idx > 0 && <div className="rgt-wiz-connector rgt-wiz-connector--done" />}
              <div className="rgt-wiz-step">
                <div className={`rgt-wiz-circle${done ? ' rgt-wiz-circle--done' : active ? ' rgt-wiz-circle--active' : ''}`}>
                  {done ? '✓' : step.n}
                </div>
                <div className={`rgt-wiz-lbl${active ? ' rgt-wiz-lbl--active' : ''}`}>
                  {step.label.map((line, i) => <span key={i}>{line}</span>)}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div className="rv-content">

        {/* 1. Intermediary Details */}
        <div className="rv-card">
          <div className="rv-card__hdr" onClick={() => toggleSection(0)}>
            <div className="rv-card__hdr-left">
              <span className="rv-toggle">{openSections.has(0) ? '⊖' : '⊕'}</span>
              <span className="rv-card__title">Intermediary Details</span>
            </div>
            <button className="rv-icon-btn" type="button" title="Edit"
              onClick={e => { e.stopPropagation(); onEditIntermediary(); }}>
              <PencilIcon />
            </button>
          </div>
          {openSections.has(0) && (
            <div className="rv-card__body">
              <div className="rv-grid5">
                <div className="rv-field"><span className="rv-label">Intermediary Name</span><span className="rv-value">{form.name || '—'}</span></div>
                <div className="rv-field"><span className="rv-label">Legal Entity</span><span className="rv-value">{form.legalEntity || '—'}</span></div>
                <div className="rv-field"><span className="rv-label">Type of Intermediary</span><span className="rv-value">{form.intermediaryType || '—'}</span></div>
                <div className="rv-field"><span className="rv-label">Country</span><span className="rv-value">{form.country || '—'}</span></div>
                <div className="rv-field"><span className="rv-label">Resident State</span><span className="rv-value">{form.residentState || '—'}</span></div>
              </div>
              <div className="rv-grid5 rv-grid5--mt">
                <div className="rv-field"><span className="rv-label">Federal Tax ID</span><span className="rv-value rv-value--mono">{form.federalTaxId || '—'}</span></div>
                <div className="rv-field"><span className="rv-label">License Number</span><span className="rv-value rv-value--mono">{form.licenseNumber || '—'}</span></div>
                <div className="rv-field"><span className="rv-label">Home Office/Legal Address</span><span className="rv-value">{buildAddress(form) || '—'}</span></div>
                <div className="rv-field"><span className="rv-label">Primary Contact</span><span className="rv-value">{primary.name || '—'}</span></div>
                <div className="rv-field"><span className="rv-label">Secondary Contact</span><span className="rv-value">{secondary?.name || '—'}</span></div>
              </div>
              <div className="rv-sub-section">
                <span className="rv-sub-title">Non-Resident State(s)</span>
                {nrStates.length > 0 && (
                  <div className="rv-nr-list">
                    {nrStates.map((s: any) => (
                      <span key={s.id} className="rv-nr-tag">{s.state} — {s.license}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. Assigned Rights */}
        <div className="rv-card">
          <div className="rv-card__hdr" onClick={() => toggleSection(1)}>
            <div className="rv-card__hdr-left">
              <span className="rv-toggle">{openSections.has(1) ? '⊖' : '⊕'}</span>
              <span className="rv-card__title">Assigned Rights</span>
            </div>
            <button className="rv-icon-btn" type="button" title="Edit"
              onClick={e => { e.stopPropagation(); onEditRights(); }}>
              <PencilIcon />
            </button>
          </div>
          {openSections.has(1) && (
            <div className="rv-card__body rv-card__body--table">
              {assignedModules.length === 0 ? (
                <p className="rv-empty">No rights assigned.</p>
              ) : (
                <table className="rv-table">
                  <thead><tr><th>#</th><th>Module</th><th>Permissions</th></tr></thead>
                  <tbody>
                    {assignedModules.map((m: any, i: number) => {
                      const perms = new Set<string>();
                      m.subGroups?.forEach((sg: any) =>
                        sg.features?.forEach((f: any) =>
                          Object.entries(f.perms ?? {}).forEach(([k, v]) => { if (v) perms.add(k); })
                        )
                      );
                      const permLabels: Record<string, string> = {
                        view: 'View', add: 'Add', edit: 'Edit', clone: 'Clone',
                        upload: 'Upload', download: 'Download', sensitiveData: 'Sensitive Data',
                        sensitiveDocs: 'Sensitive Docs', approveReject: 'Approve/Reject',
                      };
                      return (
                        <tr key={m.id}>
                          <td className="rv-td-num">{i + 1}</td>
                          <td>{m.name}</td>
                          <td>
                            <div className="rv-perm-tags">
                              {[...perms].map(p => (
                                <span key={p} className="rv-perm-tag">{permLabels[p] ?? p}</span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* 3. Assigned Products */}
        <div className="rv-card">
          <div className="rv-card__hdr" onClick={() => toggleSection(2)}>
            <div className="rv-card__hdr-left">
              <span className="rv-toggle">{openSections.has(2) ? '⊖' : '⊕'}</span>
              <span className="rv-card__title">Assigned Products</span>
            </div>
            <button className="rv-icon-btn" type="button" title="Edit"
              onClick={e => { e.stopPropagation(); onEditProducts(); }}>
              <PencilIcon />
            </button>
          </div>
          {openSections.has(2) && (
            <div className="rv-card__body rv-card__body--table">
              {step3Rows.length === 0 ? (
                <p className="rv-empty">No products assigned.</p>
              ) : (
                <table className="rv-table">
                  <thead>
                    <tr>
                      <th>#</th><th>Insurance Type</th><th>Line of Business</th>
                      <th>Sub-Product</th><th>Effective Date</th>
                      <th>New Business %</th><th>Renewal %</th><th>States</th>
                    </tr>
                  </thead>
                  <tbody>
                    {step3Rows.map((r: any, i: number) => (
                      <tr key={r.id}>
                        <td className="rv-td-num">{i + 1}</td>
                        <td>{r.insuranceType || '—'}</td>
                        <td>{r.lineOfBusiness || '—'}</td>
                        <td>{r.subProduct || '—'}</td>
                        <td>{r.effectiveDate || '—'}</td>
                        <td>{r.newBusinessPct ? `${r.newBusinessPct}` : '—'}</td>
                        <td>{r.renewalPct ? `${r.renewalPct}` : '—'}</td>
                        <td>{Array.isArray(r.states) ? r.states.join(', ') || '—' : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* 4. Producers */}
        <div className="rv-card">
          <div className="rv-card__hdr" onClick={() => toggleSection(3)}>
            <div className="rv-card__hdr-left">
              <span className="rv-toggle">{openSections.has(3) ? '⊖' : '⊕'}</span>
              <span className="rv-card__title">Producers</span>
            </div>
            <button className="rv-icon-btn" type="button" title="Edit"
              onClick={e => { e.stopPropagation(); onEditProducers(); }}>
              <PencilIcon />
            </button>
          </div>
          {openSections.has(3) && (
            <div className="rv-card__body rv-card__body--table">
              {savedProducers.length === 0 ? (
                <p className="rv-empty">No producers added.</p>
              ) : (
                <table className="rv-table">
                  <thead>
                    <tr><th>#</th><th>Name</th><th>Country</th><th>Resident State</th><th>License</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {savedProducers.map((p: any, i: number) => {
                      const f = p.form;
                      const name = [f.firstName, f.middleName, f.lastName].filter(Boolean).join(' ') || '—';
                      const license = f.licReq === 'Combined'
                        ? f.combinedLicense
                        : [f.plLicense, f.clLicense].filter(Boolean).join(' / ') || '—';
                      return (
                        <tr key={p.id}>
                          <td className="rv-td-num">{i + 1}</td>
                          <td>{name}</td>
                          <td>{f.country || '—'}</td>
                          <td>{f.residentState || '—'}</td>
                          <td className="rv-td-mono">{license || '—'}</td>
                          <td>
                            <span className={`badge ${f.status ? 'badge--active' : 'badge--inactive'}`}>
                              • {f.status ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Fixed footer */}
      <div className="fixed-footer">
        <button className="prod-footer-prev" type="button" onClick={onBack}>Previous</button>
        <button className="rv-btn-submit" type="button" disabled={submitting} onClick={handleSubmit}>
          {submitting ? 'Submitting…' : 'Submit'}
        </button>
      </div>
    </main>
  );
}
