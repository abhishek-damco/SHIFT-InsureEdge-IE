import React, { useState, useMemo, useEffect } from 'react';
import { distributionApi as api } from '../../api/distribution';

// ── Types ─────────────────────────────────────────────────────────────────────

type Perm = 'view' | 'add' | 'edit' | 'clone' | 'upload' | 'download' | 'sensitiveData' | 'sensitiveDocs' | 'approveReject';

interface FeatureState {
  id: string;
  name: string;
  perms: Record<Perm, boolean>;
}

interface SubGroupState {
  id: string;
  name: string;
  features: FeatureState[];
}

interface ModuleRow {
  id: string;
  name: string;
  expanded: boolean;
  subGroups: SubGroupState[];
  readOnly: boolean;
  allAccess: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PERM_COLS: { key: Perm; label: string }[] = [
  { key: 'view',          label: 'View'               },
  { key: 'add',           label: 'Add'                },
  { key: 'edit',          label: 'Edit'               },
  { key: 'clone',         label: 'Clone'              },
  { key: 'upload',        label: 'Upload'             },
  { key: 'download',      label: 'Download'           },
  { key: 'sensitiveData', label: 'Sensitive Data'     },
  { key: 'sensitiveDocs', label: 'Sensitive Documents'},
  { key: 'approveReject', label: 'Approve / Reject'  },
];

const MODIFICATION_PERMS: Perm[] = ['add', 'edit', 'clone', 'upload', 'download', 'approveReject'];

const ALL_PERMS: Perm[] = ['view', 'add', 'edit', 'clone', 'upload', 'download', 'sensitiveData', 'sensitiveDocs', 'approveReject'];

const DEFAULT_PERMS: Record<Perm, boolean> = {
  view: false, add: false, edit: false, clone: false,
  upload: false, download: false, sensitiveData: false,
  sensitiveDocs: false, approveReject: false,
};

// ── Module data ───────────────────────────────────────────────────────────────

const MODULE_DATA: { id: string; name: string; subGroups: { id: string; name: string; features: { id: string; name: string }[] }[] }[] = [
  {
    id: 'dashboard', name: 'Dashboard',
    subGroups: [{ id: 'sg-db', name: 'Dashboard', features: [{ id: 'f-db', name: 'Dashboard' }] }],
  },
  {
    id: 'quotes', name: 'Quotes & Policies',
    subGroups: [
      { id: 'sg-qi', name: 'Individual', features: [
        { id: 'f-i-nbq', name: 'New Business Quote' }, { id: 'f-i-eq', name: 'Endorsement Quote' },
        { id: 'f-i-rq',  name: 'Renewal Quote'      }, { id: 'f-i-pol', name: 'Policies'         },
        { id: 'f-i-ps',  name: 'Policy Summary'     },
      ]},
      { id: 'sg-qb', name: 'Business', features: [
        { id: 'f-b-nbq', name: 'New Business Quote'     }, { id: 'f-b-naf', name: 'New Application - Full' },
        { id: 'f-b-eq',  name: 'Endorsement Quote'      }, { id: 'f-b-rq',  name: 'Renewal Quote'          },
        { id: 'f-b-pol', name: 'Policies'               }, { id: 'f-b-ps',  name: 'Policy Summary'         },
      ]},
    ],
  },
  {
    id: 'claims', name: 'Claims',
    subGroups: [
      { id: 'sg-ci',   name: 'Claims Inquiry',              features: [{ id: 'f-ci',   name: 'Claims Inquiry'              }] },
      { id: 'sg-cd',   name: 'Claims Dashboard',            features: [{ id: 'f-cd',   name: 'Claims Dashboard'            }] },
      { id: 'sg-fnol', name: 'FNOL Registration',           features: [{ id: 'f-fnol', name: 'FNOL Registration'           }] },
      { id: 'sg-bcu',  name: 'Bulk Claim Upload',           features: [{ id: 'f-bcu',  name: 'Bulk Claim Upload'           }] },
      { id: 'sg-ca',   name: 'Claims Authority',            features: [{ id: 'f-ca',   name: 'Claims Authority'            }] },
      { id: 'sg-am',   name: 'Adjuster Management',         features: [{ id: 'f-am',   name: 'Adjuster Management'         }] },
      { id: 'sg-pl',   name: 'Payee List',                  features: [{ id: 'f-pl',   name: 'Payee List'                  }] },
      { id: 'sg-ce',   name: 'Catastrophic Events',         features: [{ id: 'f-ce',   name: 'Catastrophic Events'         }] },
      { id: 'sg-clt',  name: 'Claim Letter Template',       features: [{ id: 'f-clt',  name: 'Claim Letter Template'       }] },
      { id: 'sg-cmc',  name: 'Claims Master Configuration', features: [{ id: 'f-cmc',  name: 'Claims Master Configuration' }] },
      { id: 'sg-cwm',  name: 'Claim Workflow Menu', features: [
        { id: 'f-csum', name: 'Claims Summary'            }, { id: 'f-li',   name: 'Loss Information'           },
        { id: 'f-crev', name: 'Claims Review'             }, { id: 'f-docs', name: 'Documents'                  },
        { id: 'f-fw',   name: 'Financials - Worksheet'    }, { id: 'f-fcp',  name: 'Financials - Claims Payee'  },
        { id: 'f-ip',   name: 'Insured & Policy'          }, { id: 'f-cesc', name: 'Claims Escalation'          },
        { id: 'f-rec',  name: 'Recovery'                  }, { id: 'f-cref', name: 'Claim Referred'             },
        { id: 'f-ul',   name: 'Under Litigation'          }, { id: 'f-task', name: 'Task'                       },
        { id: 'f-tl',   name: 'Timeline'                  }, { id: 'f-cl',   name: 'Claim Letters'              },
      ]},
    ],
  },
  { id: 'user-mgmt',   name: 'User Management',       subGroups: [{ id: 'sg-um',  name: 'User Management',       features: [{ id: 'f-um-lp',  name: 'Landing Page' }] }] },
  { id: 'user-groups', name: 'User Groups Management', subGroups: [{ id: 'sg-ugm', name: 'User Groups Management', features: [{ id: 'f-ugm-lp', name: 'Landing Page' }] }] },
  { id: 'distribution',name: 'Distribution Management',subGroups: [{ id: 'sg-dm',  name: 'Distribution Management',features: [{ id: 'f-dm-lp',  name: 'Landing Page' }] }] },
  { id: 'billing',     name: 'Billing Management',     subGroups: [{ id: 'sg-pay', name: 'Payments',              features: [{ id: 'f-pp',     name: 'Policy Payments' }] }] },
  {
    id: 'reports', name: 'Report Management',
    subGroups: [
      { id: 'sg-bord', name: 'Bordereaux',  features: [{ id: 'f-mgai', name: 'MGA to Issuer' }] },
      { id: 'sg-crep', name: 'Claims',      features: [
        { id: 'f-cmr',  name: 'Claims Management Reports'         }, { id: 'f-cfr',  name: 'Claim Financial Reports'           },
        { id: 'f-ler',  name: 'Loss & Exposure Reports'           }, { id: 'f-crr',  name: 'Compliance / Regulatory Reports'   },
        { id: 'f-rcr',  name: 'Reinsurance / Catastrophe Reports' },
      ]},
      { id: 'sg-prep', name: 'Policy',      features: [
        { id: 'f-nbi',  name: 'New Business Issuance'              }, { id: 'f-nbp',  name: 'New Business Premium'               },
        { id: 'f-nptt', name: 'No. of Policies by Transaction Type' },
      ]},
      { id: 'sg-comm', name: 'Commissions', features: [{ id: 'f-comrep', name: 'Commissions Reports' }] },
    ],
  },
];

const WIZARD_STEPS = [
  { n: 1, l1: 'Add',    l2: 'Intermediary Details', done: true,  active: false },
  { n: 2, l1: 'Assign', l2: 'Rights',               done: false, active: true  },
  { n: 3, l1: 'Assign', l2: 'Products',             done: false, active: false },
  { n: 4, l1: 'Add',    l2: 'Producers',            done: false, active: false },
  { n: 5, l1: 'Review', l2: 'and Submit',           done: false, active: false },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeFeature(id: string, name: string): FeatureState {
  return { id, name, perms: { ...DEFAULT_PERMS } };
}

function initModules(): ModuleRow[] {
  return MODULE_DATA.map(m => ({
    id: m.id, name: m.name, expanded: false, readOnly: false, allAccess: false,
    subGroups: m.subGroups.map(sg => ({
      id: sg.id, name: sg.name, features: sg.features.map(f => makeFeature(f.id, f.name)),
    })),
  }));
}

function applyFeaturePerm(f: FeatureState, perm: Perm, checked: boolean): FeatureState {
  const newPerms = { ...f.perms, [perm]: checked };
  if (checked && MODIFICATION_PERMS.includes(perm)) newPerms.view = true;
  return { ...f, perms: newPerms };
}

function applyPermChange(mod: ModuleRow, sgId: string, fId: string, perm: Perm, checked: boolean): ModuleRow {
  const subGroups = mod.subGroups.map(sg =>
    sg.id !== sgId ? sg : { ...sg, features: sg.features.map(f => f.id !== fId ? f : applyFeaturePerm(f, perm, checked)) }
  );
  const allFeatures = subGroups.flatMap(sg => sg.features);
  const allOn = allFeatures.every(f => ALL_PERMS.every(p => f.perms[p]));
  const anyModPerm = allFeatures.some(f => MODIFICATION_PERMS.some(p => f.perms[p]));
  return { ...mod, subGroups, allAccess: allOn, readOnly: mod.readOnly && !anyModPerm };
}

function applyReadOnly(mod: ModuleRow, on: boolean): ModuleRow {
  const subGroups = mod.subGroups.map(sg => ({
    ...sg, features: sg.features.map(f => {
      const newPerms = Object.fromEntries(ALL_PERMS.map(k => [k, false])) as Record<Perm, boolean>;
      if (on) newPerms.view = true;
      return { ...f, perms: newPerms };
    }),
  }));
  if (!on) return { ...mod, subGroups, readOnly: false };
  return { ...mod, subGroups, readOnly: true, allAccess: false, expanded: true };
}

function applyAllAccess(mod: ModuleRow, on: boolean): ModuleRow {
  const subGroups = mod.subGroups.map(sg => ({
    ...sg, features: sg.features.map(f => ({
      ...f, perms: Object.fromEntries(ALL_PERMS.map(k => [k, on])) as Record<Perm, boolean>,
    })),
  }));
  if (!on) return { ...mod, subGroups, allAccess: false, readOnly: false };
  return { ...mod, subGroups, allAccess: true, readOnly: false, expanded: true };
}

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" className={`rgt-toggle${checked ? ' rgt-toggle--on' : ''}`}
      onClick={() => onChange(!checked)} aria-label={label} aria-pressed={checked}>
      <span className="rgt-toggle__thumb" />
    </button>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AssignRightsPage({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const [modules, setModules]         = useState<ModuleRow[]>(initModules);
  const [search, setSearch]           = useState('');
  const [noRightsWarning, setWarning] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('shift_step2');
    if (saved) {
      try {
        const m = JSON.parse(saved);
        if (Array.isArray(m) && m.length > 0) { setModules(m); return; }
      } catch { /* fall through to API */ }
    }
    api.modules.list()
      .then((mods: any[]) => {
        if (!mods.length) return;
        setModules(mods.map(m => ({
          id: String(m.id), name: m.module_name ?? 'Unknown', expanded: false, readOnly: false, allAccess: false,
          subGroups: [{ id: `sg-${m.id}`, name: m.module_name ?? 'Unknown',
            features: (m.screens ?? []).map((s: any) =>
              makeFeature(String(s.id), s.screen_name ?? s.screen_code ?? 'Unknown Screen')
            ),
          }],
        })));
      })
      .catch(() => { /* keep initModules() fallback */ });
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return modules;
    const q = search.toLowerCase();
    return modules.filter(m => m.name.toLowerCase().includes(q));
  }, [modules, search]);

  function update(id: string, fn: (r: ModuleRow) => ModuleRow) {
    setModules(prev => prev.map(m => m.id === id ? fn(m) : m));
  }

  function handleSaveNext() {
    const hasRights = modules.some(m =>
      m.subGroups.some(sg => sg.features.some(f => ALL_PERMS.some(p => f.perms[p])))
    );
    if (!hasRights && !noRightsWarning) { setWarning(true); return; }
    try { sessionStorage.setItem('shift_step2', JSON.stringify(modules)); } catch { /* ignore */ }
    onNext();
  }

  return (
    <>
      {/* Wizard bar */}
      <div className="rgt-wiz-bar">
        {WIZARD_STEPS.map((s, i) => (
          <React.Fragment key={s.n}>
            <div className="rgt-wiz-step">
              <div className={`rgt-wiz-circle${s.active ? ' rgt-wiz-circle--active' : s.done ? ' rgt-wiz-circle--done' : ''}`}>
                {s.done ? '✓' : s.n}
              </div>
              <div className={`rgt-wiz-lbl${s.active ? ' rgt-wiz-lbl--active' : ''}`}>
                <span>{s.l1}</span><span>{s.l2}</span>
              </div>
            </div>
            {i < WIZARD_STEPS.length - 1 && (
              <div className={`rgt-wiz-connector${s.done ? ' rgt-wiz-connector--done' : ''}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Page heading */}
      <div className="rgt-head">
        <h1 className="rgt-title">Add Intermediary / Pragya Jha</h1>
        <p className="rgt-breadcrumb">
          <span className="rgt-breadcrumb__link" onClick={onBack}>Distribution Management</span>
          {' / '}
          <span className="rgt-breadcrumb__cur">Add Intermediary</span>
        </p>
      </div>

      {/* No-rights advisory warning */}
      {noRightsWarning && (
        <div className="rgt-warning" role="alert">
          <span className="rgt-warning__icon">⚠</span>
          <span>No rights have been assigned. The intermediary will have no module access.</span>
          <button type="button" className="rgt-warning__cont" onClick={onNext}>Continue anyway</button>
          <button type="button" className="rgt-warning__close" onClick={() => setWarning(false)}>✕</button>
        </div>
      )}

      {/* Rights accordion card */}
      <div className="rgt-rights-card">
        <div className="rgt-rights-hdr">
          <div className="rgt-rights-hdr-text">
            <h2 className="rgt-rights-htitle">Intermediary-Rights</h2>
            <p className="rgt-rights-hsub">You can grant access to the system's module and their sub-modules for the chosen intermediary</p>
          </div>
          <div className="rgt-search-wrap">
            <span className="rgt-search-icon">⌕</span>
            <input className="rgt-search-input" placeholder="Enter module or feature name you are looking for"
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button type="button" className="rgt-search-clear" onClick={() => setSearch('')}>✕</button>}
          </div>
        </div>

        <div className="rgt-accordion">
          {filtered.length === 0 ? (
            <div className="rgt-empty">No modules match your search.</div>
          ) : filtered.map(mod => (
            <div key={mod.id} className="rgt-acc-item">
              <div className="rgt-acc-hdr" onClick={() => update(mod.id, r => ({ ...r, expanded: !r.expanded }))}>
                <div className="rgt-acc-left">
                  <button type="button" className="rgt-acc-icon-btn" aria-expanded={mod.expanded}>
                    {mod.expanded ? '⊖' : '⊕'}
                  </button>
                  <span className="rgt-acc-name">{mod.name}</span>
                </div>
                <div className="rgt-acc-right" onClick={e => e.stopPropagation()}>
                  <span className="rgt-acc-tlbl">Read Only</span>
                  <Toggle checked={mod.readOnly}  onChange={v => update(mod.id, r => applyReadOnly(r, v))}  label="Read Only"  />
                  <span className="rgt-acc-tlbl">All Access</span>
                  <Toggle checked={mod.allAccess} onChange={v => update(mod.id, r => applyAllAccess(r, v))} label="All Access" />
                </div>
              </div>

              {mod.expanded && (
                <div className="rgt-acc-body">
                  <table className="rgt-sub-table">
                    {mod.subGroups.map(sg => (
                      <React.Fragment key={sg.id}>
                        <thead>
                          <tr className="rgt-sub-grp-hdr">
                            <th className="rgt-sub-th rgt-sub-th--name">{sg.name}</th>
                            {PERM_COLS.map(c => <th key={c.key} className="rgt-sub-th">{c.label}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {sg.features.map(f => (
                            <tr key={f.id} className="rgt-sub-feat-row">
                              <td className="rgt-sub-td rgt-sub-td--name">{f.name}</td>
                              {PERM_COLS.map(c => (
                                <td key={c.key} className="rgt-sub-td">
                                  <input type="checkbox" className="rgt-checkbox"
                                    checked={f.perms[c.key]}
                                    onChange={e => update(mod.id, r => applyPermChange(r, sg.id, f.id, c.key, e.target.checked))} />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </React.Fragment>
                    ))}
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 80 }} />

      {/* Fixed footer */}
      <div className="rgt-footer">
        <button type="button" className="btn btn--outline" onClick={onBack}>‹ Previous</button>
        <button type="button" className="btn btn--primary" onClick={handleSaveNext}>Save &amp; Next ›</button>
      </div>
    </>
  );
}
