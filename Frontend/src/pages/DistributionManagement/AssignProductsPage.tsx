import React, { useState, useRef, useMemo, useEffect } from 'react';
import { distributionApi as api } from '../../api/distribution';

// ── Constants ─────────────────────────────────────────────────────────────────

const WIZARD_STEPS = [
  { n: 1, l1: 'Add',    l2: 'Intermediary Details' },
  { n: 2, l1: 'Assign', l2: 'Rights'               },
  { n: 3, l1: 'Assign', l2: 'Products'             },
  { n: 4, l1: 'Add',    l2: 'Producers'            },
  { n: 5, l1: 'Review', l2: 'and Submit'           },
];

const INSURANCE_TYPES = ['Specialty Lines', 'Admitted Lines', 'Non-Admitted Lines'];

const LOB_BY_TYPE: Record<string, string[]> = {
  'Specialty Lines':    ['E&S Homeowners', 'E&S Commercial', 'E&S Auto', 'E&S Marine'],
  'Admitted Lines':     ['Homeowners', 'Auto', 'Commercial Property', 'General Liability'],
  'Non-Admitted Lines': ['Excess Liability', 'Umbrella', 'Surplus Lines'],
};

const SUB_BY_LOB: Record<string, string[]> = {
  'E&S Homeowners':        ['SuperPerils', 'HomePlus', 'BasicCover'],
  'E&S Commercial':        ['CommercialPlus', 'BizCover'],
  'E&S Auto':              ['AutoPremium', 'FleetCover'],
  'E&S Marine':            ['MarinePlus'],
  'Homeowners':            ['Standard', 'Premier'],
  'Auto':                  ['Personal Auto', 'Commercial Auto'],
  'Commercial Property':   ['Building', 'Contents', 'Business Interruption'],
  'General Liability':     ['Occurrence', 'Claims-Made'],
  'Excess Liability':      ['Follow Form', 'Standalone'],
  'Umbrella':              ['Personal', 'Commercial'],
  'Surplus Lines':         ['Specialty Risk'],
};

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware',
  'Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky',
  'Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi',
  'Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico',
  'New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania',
  'Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
];

const COND_OPS = [
  { value: '',             label: '(not set)'        },
  { value: 'is',           label: 'is'               },
  { value: 'is_not',       label: 'is not'           },
  { value: 'contains',     label: 'contains'         },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'starts_with',  label: 'starts with'      },
  { value: 'ends_with',    label: 'ends with'        },
  { value: 'is_blank',     label: 'is blank'         },
  { value: 'not_blank',    label: 'is not blank'     },
];

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProductRow {
  id: string;
  effectiveDate: string;
  lineOfBusiness: string;
  subProduct: string;
  insuranceType: string;
  newBusinessPct: string;
  renewalPct: string;
  states: string[];
}

interface ModalForm {
  insuranceType: string;
  lineOfBusiness: string;
  subProduct: string;
  states: string[];
  newBusinessPct: string;
  renewalPct: string;
  effectiveDate: string;
}

interface ModalErrors {
  insuranceType?: boolean;
  lineOfBusiness?: boolean;
  subProduct?: boolean;
  states?: boolean;
  newBusinessPct?: boolean;
  renewalPct?: boolean;
  effectiveDate?: boolean;
}

interface CondState {
  op1: string; val1: string;
  logic: 'and' | 'or';
  op2: string; val2: string;
}

type ColFilter =
  | { type: 'value'; vals: string[] }
  | { type: 'condition'; op1: string; val1: string; logic: 'and' | 'or'; op2: string; val2: string };

type ProdColKey = 'effectiveDate' | 'lineOfBusiness' | 'subProduct' | 'insuranceType' | 'newBusinessPct' | 'renewalPct' | 'states';

const ALL_COLUMNS: { key: ProdColKey; label: string; filterable: boolean; sortable: boolean }[] = [
  { key: 'effectiveDate',  label: 'Effective Date',   filterable: true,  sortable: true  },
  { key: 'lineOfBusiness', label: 'Line of Business', filterable: true,  sortable: true  },
  { key: 'subProduct',     label: 'Sub-Product',      filterable: true,  sortable: true  },
  { key: 'insuranceType',  label: 'Insurance Type',   filterable: true,  sortable: true  },
  { key: 'newBusinessPct', label: 'New Business %',   filterable: true,  sortable: true  },
  { key: 'renewalPct',     label: 'Renewal %',        filterable: false, sortable: false },
  { key: 'states',         label: 'State',            filterable: true,  sortable: false },
];

const EMPTY_COND: CondState = { op1: '', val1: '', logic: 'and', op2: '', val2: '' };
const EMPTY_FORM: ModalForm = {
  insuranceType: '', lineOfBusiness: '', subProduct: '',
  states: [], newBusinessPct: '', renewalPct: '', effectiveDate: '',
};

let _nextId = 1;

// ── Helpers ───────────────────────────────────────────────────────────────────

function blockNonDigit(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const allowed = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'];
  if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) e.preventDefault();
}

function matchCond(raw: string, op: string, target: string): boolean {
  const v = raw.toLowerCase();
  const t = target.toLowerCase().trim();
  switch (op) {
    case 'is':           return v === t;
    case 'is_not':       return v !== t;
    case 'contains':     return v.includes(t);
    case 'not_contains': return !v.includes(t);
    case 'starts_with':  return v.startsWith(t);
    case 'ends_with':    return v.endsWith(t);
    case 'is_blank':     return raw === '';
    case 'not_blank':    return raw !== '';
    default:             return true;
  }
}

function getColVal(row: ProductRow, key: ProdColKey): string {
  if (key === 'states') return row.states.join(', ');
  return String(row[key] ?? '');
}

// ── Calendar Picker ───────────────────────────────────────────────────────────

function CalendarPicker({ value, onChange, onClose }: {
  value: string; onChange: (v: string) => void; onClose: () => void;
}) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const todayStr = `${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}-${today.getFullYear()}`;

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }
  function selectDay(d: number) {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    onChange(`${mm}-${dd}-${viewYear}`);
    onClose();
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 699 }} onClick={onClose} />
      <div className="ap-cal" onClick={e => e.stopPropagation()}>
        <div className="ap-cal__hdr">
          <span className="ap-cal__year">{viewYear}</span>
          <span className="ap-cal__month">{MONTH_NAMES[viewMonth]}</span>
          <div style={{ flex: 1 }} />
          <button className="ap-cal__nav" type="button" onClick={prevMonth}>‹</button>
          <button className="ap-cal__nav" type="button" onClick={nextMonth}>›</button>
        </div>
        <table className="ap-cal__table">
          <thead>
            <tr>{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <th key={d} className="ap-cal__dow">{d}</th>)}</tr>
          </thead>
          <tbody>
            {weeks.map((week, wi) => (
              <tr key={wi}>
                {week.map((d, di) => {
                  if (!d) return <td key={di} className="ap-cal__cell ap-cal__cell--empty" />;
                  const mm  = String(viewMonth + 1).padStart(2, '0');
                  const dd  = String(d).padStart(2, '0');
                  const str = `${mm}-${dd}-${viewYear}`;
                  return (
                    <td key={di}
                      className={`ap-cal__cell${str === todayStr ? ' ap-cal__cell--today' : ''}${str === value ? ' ap-cal__cell--sel' : ''}`}
                      onClick={() => selectDay(d)}>
                      {d}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="ap-cal__footer">
          <input className="ap-cal__inp" value={value} readOnly placeholder="MM-DD-YYYY" />
          <span className="ap-cal__ico">📅</span>
        </div>
      </div>
    </>
  );
}

// ── Searchable single-select ──────────────────────────────────────────────────

function SearchableSelect({ value, options, placeholder, onChange, disabled, hasError }: {
  value: string; options: string[]; placeholder: string;
  onChange: (v: string) => void; disabled?: boolean; hasError?: boolean;
}) {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState('');
  const filtered = search.trim() ? options.filter(o => o.toLowerCase().includes(search.toLowerCase())) : options;
  function close() { setOpen(false); setSearch(''); }

  return (
    <div className="ap-ss" style={{ position: 'relative' }}>
      {open && <div style={{ position: 'fixed', inset: 0, zIndex: 699 }} onClick={close} />}
      <div
        className={`ap-ss__display${open ? ' ap-ss__display--open' : ''}${hasError ? ' ap-ss__display--err' : ''}${disabled ? ' ap-ss__display--disabled' : ''}`}
        onClick={() => { if (!disabled) setOpen(o => !o); }}>
        <div className="ap-ss__left">
          {value ? <span className="ap-ss__val">{value}</span> : <span className="ap-ss__ph">{placeholder}</span>}
        </div>
        <div className="ap-ss__right">
          {value && !disabled && (
            <button type="button" className="ap-ss__clear" onClick={e => { e.stopPropagation(); onChange(''); close(); }}>×</button>
          )}
          <span className="ap-ss__arrow">{open ? '▴' : '▾'}</span>
        </div>
      </div>
      {open && (
        <div className="ap-ss__dropdown" style={{ zIndex: 700 }}>
          <input className="ap-ss__search" placeholder="Search..." value={search}
            autoFocus onChange={e => setSearch(e.target.value)} onClick={e => e.stopPropagation()} />
          {filtered.map(o => (
            <div key={o} className={`ap-ss__opt${value === o ? ' ap-ss__opt--sel' : ''}`}
              onClick={() => { onChange(o); close(); }}>{o}</div>
          ))}
          {filtered.length === 0 && <div className="ap-ss__empty">No options</div>}
        </div>
      )}
    </div>
  );
}

// ── Multi-select ──────────────────────────────────────────────────────────────

function MultiSelect({ values, options, onChange, hasError }: {
  values: string[]; options: string[]; onChange: (v: string[]) => void; hasError?: boolean;
}) {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState('');
  const filtered   = search.trim() ? options.filter(o => o.toLowerCase().includes(search.toLowerCase())) : options;
  const allChecked = filtered.length > 0 && filtered.every(o => values.includes(o));

  function toggleAll() {
    if (allChecked) onChange(values.filter(v => !filtered.includes(v)));
    else            onChange([...new Set([...values, ...filtered])]);
  }
  function toggle(o: string) {
    if (values.includes(o)) onChange(values.filter(v => v !== o));
    else                    onChange([...values, o]);
  }
  function close() { setOpen(false); setSearch(''); }

  return (
    <div className="ap-ms" style={{ position: 'relative' }}>
      {open && <div style={{ position: 'fixed', inset: 0, zIndex: 699 }} onClick={close} />}
      <div className={`ap-ms__display${open ? ' ap-ms__display--open' : ''}${hasError ? ' ap-ms__display--err' : ''}`}
        onClick={() => setOpen(o => !o)}>
        <div className="ap-ms__tags">
          {values.length === 0 ? <span className="ap-ms__ph">Select...</span>
            : values.map(v => (
              <span key={v} className="ap-ms__tag">
                {v}
                <button type="button" className="ap-ms__tag-x"
                  onClick={e => { e.stopPropagation(); onChange(values.filter(x => x !== v)); }}>×</button>
              </span>
            ))
          }
        </div>
        <span className="ap-ms__arrow">{open ? '▴' : '▾'}</span>
      </div>
      {open && (
        <div className="ap-ms__dropdown" style={{ zIndex: 700 }}>
          <input className="ap-ms__search" placeholder="Search..." value={search}
            autoFocus onChange={e => setSearch(e.target.value)} onClick={e => e.stopPropagation()} />
          <label className={`ap-ms__opt ap-ms__opt--all${allChecked ? ' ap-ms__opt--on' : ''}`}>
            <input type="checkbox" checked={allChecked} onChange={toggleAll} />
            <span>Select All</span>
          </label>
          {filtered.map(o => (
            <label key={o} className={`ap-ms__opt${values.includes(o) ? ' ap-ms__opt--on' : ''}`}>
              <input type="checkbox" checked={values.includes(o)} onChange={() => toggle(o)} />
              <span>{o}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Delete modal ──────────────────────────────────────────────────────────────

function DeleteModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="ap-backdrop">
      <div className="ap-del">
        <div className="ap-del__icon-wrap"><span className="ap-del__icon">🗑</span></div>
        <p className="ap-del__title">Are you sure you want to delete this?</p>
        <p className="ap-del__sub">This Action cannot be undone. Please confirm if you want to proceed</p>
        <div className="ap-del__btns">
          <button className="btn btn--outline" onClick={onCancel}>No, Keep It</button>
          <button className="btn btn--danger"  onClick={onConfirm}>Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Column filter dropdown ────────────────────────────────────────────────────

interface FilterDropdownProps {
  pos: { top: number; left: number };
  activeTab: 'condition' | 'value'; onTabChange: (t: 'condition' | 'value') => void;
  cond: CondState; onCondChange: (u: Partial<CondState>) => void;
  allVals: string[]; vPending: string[]; vSearch: string;
  onSetVPending: (v: string[]) => void; onSetVSearch: (s: string) => void;
  onApply: () => void; onCancel: () => void; onClear: () => void;
}

function FilterDropdown({
  pos, activeTab, onTabChange, cond, onCondChange,
  allVals, vPending, vSearch, onSetVPending, onSetVSearch,
  onApply, onCancel, onClear,
}: FilterDropdownProps) {
  const visible  = vSearch.trim() ? allVals.filter(v => v.toLowerCase().includes(vSearch.toLowerCase())) : allVals;
  const allVis   = visible.length > 0 && visible.every(v => vPending.includes(v));
  const safeLeft = Math.min(pos.left, window.innerWidth - 314);
  const noBlank  = (op: string) => op !== 'is_blank' && op !== 'not_blank';

  function toggleAll() {
    if (allVis) onSetVPending(vPending.filter(v => !visible.includes(v)));
    else        onSetVPending([...new Set([...vPending, ...visible])]);
  }
  function toggleOne(v: string) {
    if (vPending.includes(v)) onSetVPending(vPending.filter(x => x !== v));
    else                      onSetVPending([...vPending, v]);
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 499 }} onClick={onCancel} />
      <div className="col-filter" style={{ top: pos.top, left: safeLeft }}>
        <div className="col-filter__tabs">
          <span className={`col-filter__tab${activeTab === 'condition' ? ' col-filter__tab--on' : ''}`}
            onClick={() => onTabChange('condition')}>Filter by Condition</span>
          <span className={`col-filter__tab${activeTab === 'value' ? ' col-filter__tab--on' : ''}`}
            onClick={() => onTabChange('value')}>Filter by Value</span>
        </div>
        {activeTab === 'condition' && (
          <div className="col-filter__cond">
            <p className="col-filter__cond-lbl">Show items where the value</p>
            <select className="col-filter__cond-op" value={cond.op1}
              onChange={e => onCondChange({ op1: e.target.value, val1: '' })}>
              {COND_OPS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {noBlank(cond.op1) && (
              <input className="col-filter__cond-val" value={cond.val1} disabled={!cond.op1} autoFocus
                onChange={e => onCondChange({ val1: e.target.value })} />
            )}
            <div className="col-filter__logic">
              <label className="col-filter__logic-opt">
                <input type="radio" checked={cond.logic === 'and'} onChange={() => onCondChange({ logic: 'and' })} />
                <span>And</span>
              </label>
              <label className="col-filter__logic-opt">
                <input type="radio" checked={cond.logic === 'or'} onChange={() => onCondChange({ logic: 'or' })} />
                <span>Or</span>
              </label>
            </div>
            <select className="col-filter__cond-op" value={cond.op2}
              onChange={e => onCondChange({ op2: e.target.value, val2: '' })}>
              {COND_OPS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {noBlank(cond.op2) && (
              <input className="col-filter__cond-val" value={cond.val2} disabled={!cond.op2}
                onChange={e => onCondChange({ val2: e.target.value })} />
            )}
          </div>
        )}
        {activeTab === 'value' && (
          <>
            <input className="col-filter__search" placeholder="Search" value={vSearch}
              autoFocus onChange={e => onSetVSearch(e.target.value)} />
            <div className="col-filter__list">
              <label className="col-filter__item col-filter__item--all">
                <input type="checkbox" className="col-filter__cb" checked={allVis} onChange={toggleAll} />
                <span>Select All</span>
              </label>
              {visible.length === 0
                ? <div className="col-filter__empty">No matches.</div>
                : visible.map(v => (
                    <label key={v} className="col-filter__item">
                      <input type="checkbox" className="col-filter__cb"
                        checked={vPending.includes(v)} onChange={() => toggleOne(v)} />
                      <span className="col-filter__val">{v}</span>
                    </label>
                  ))
              }
            </div>
          </>
        )}
        <div className="col-filter__foot">
          <button type="button" className="col-filter__btn col-filter__btn--apply"  onClick={onApply}>Apply</button>
          <button type="button" className="col-filter__btn col-filter__btn--cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className="col-filter__btn col-filter__btn--clear"  onClick={onClear}>Clear</button>
        </div>
      </div>
    </>
  );
}

// ── Column chooser ────────────────────────────────────────────────────────────

function ColChooser({ pos, visibleCols, onToggle, onClose }: {
  pos: { top: number; left: number }; visibleCols: Set<string>;
  onToggle: (key: string) => void; onClose: () => void;
}) {
  const safeLeft = Math.min(pos.left, window.innerWidth - 250);
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 399 }} onClick={onClose} />
      <div className="col-chooser" style={{ top: pos.top, left: safeLeft }}>
        <div className="col-chooser__head">Modify Columns Display</div>
        <label className="col-chooser__item col-chooser__item--fixed">
          <input type="checkbox" className="col-chooser__cb" checked readOnly />
          <span>Actions</span>
        </label>
        {ALL_COLUMNS.map(col => {
          const on = visibleCols.has(col.key);
          return (
            <label key={col.key} className={`col-chooser__item${on ? ' col-chooser__item--on' : ''}`}>
              <input type="checkbox" className="col-chooser__cb" checked={on} onChange={() => onToggle(col.key)} />
              <span>{col.label}</span>
            </label>
          );
        })}
      </div>
    </>
  );
}

// ── Add / Edit Product Modal ──────────────────────────────────────────────────

function ProductModal({ initial, onSave, onClose, products = [] }: {
  initial: ModalForm | null; onSave: (f: ModalForm) => void; onClose: () => void; products?: any[];
}) {
  const [form,    setForm]    = useState<ModalForm>(initial ?? EMPTY_FORM);
  const [errors,  setErrors]  = useState<ModalErrors>({});
  const [showCal, setShowCal] = useState(false);

  const parentProds = products.filter(p => !p.is_sub_product && p.is_active !== false);
  const subProds    = products.filter(p =>  p.is_sub_product && p.is_active !== false);
  const apiInsuranceTypes = [...new Set(parentProds.map((p: any) => p.product_type).filter(Boolean))] as string[];
  const insuranceTypeOpts = apiInsuranceTypes.length > 0 ? apiInsuranceTypes : INSURANCE_TYPES;

  function sf(field: keyof ModalForm, value: string | string[]) {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'insuranceType')  { next.lineOfBusiness = ''; next.subProduct = ''; }
      if (field === 'lineOfBusiness') { next.subProduct = ''; }
      return next;
    });
    setErrors(e => ({ ...e, [field]: false }));
  }

  function validate(): boolean {
    const e: ModalErrors = {};
    if (!form.insuranceType)      e.insuranceType  = true;
    if (!form.lineOfBusiness)     e.lineOfBusiness = true;
    if (!form.subProduct)         e.subProduct     = true;
    if (form.states.length === 0) e.states         = true;
    if (!form.newBusinessPct)     e.newBusinessPct = true;
    if (!form.renewalPct)         e.renewalPct     = true;
    if (!form.effectiveDate)      e.effectiveDate  = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const lobOptions = form.insuranceType
    ? (parentProds.length > 0
        ? parentProds.filter((p: any) => p.product_type === form.insuranceType).map((p: any) => p.product_name as string)
        : (LOB_BY_TYPE[form.insuranceType] ?? []))
    : [];
  const subOptions = form.lineOfBusiness
    ? (subProds.length > 0
        ? (() => {
            const parent = parentProds.find((p: any) => p.product_name === form.lineOfBusiness);
            return parent ? subProds.filter((s: any) => s.parent_product_id === parent.id).map((s: any) => s.product_name as string) : [];
          })()
        : (SUB_BY_LOB[form.lineOfBusiness] ?? []))
    : [];

  return (
    <div className="ap-backdrop">
      <div className="ap-modal">
        <div className="ap-modal__hdr">
          <span className="ap-modal__title">Add Product</span>
          <button type="button" className="ap-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="ap-modal__body">
          <div className="ap-modal__grid">
            <div className="ap-modal__field">
              <label className="ap-modal__lbl"><span className="ap-modal__req">*</span> Insurance Type</label>
              <select className={`ap-modal__sel${errors.insuranceType ? ' ap-modal__sel--err' : ''}`}
                value={form.insuranceType} onChange={e => sf('insuranceType', e.target.value)}>
                <option value="">Select...</option>
                {insuranceTypeOpts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              {errors.insuranceType && <span className="ap-modal__err-msg">Provide Insurance Type to continue</span>}
            </div>
            <div className="ap-modal__field">
              <label className="ap-modal__lbl"><span className="ap-modal__req">*</span> Line of Business</label>
              <SearchableSelect value={form.lineOfBusiness} options={lobOptions} placeholder="Select..."
                onChange={v => sf('lineOfBusiness', v)} disabled={!form.insuranceType} hasError={errors.lineOfBusiness} />
              {errors.lineOfBusiness && <span className="ap-modal__err-msg">Provide Product to continue</span>}
            </div>
            <div className="ap-modal__field">
              <label className="ap-modal__lbl"><span className="ap-modal__req">*</span> Sub-Product</label>
              <select className={`ap-modal__sel${errors.subProduct ? ' ap-modal__sel--err' : ''}`}
                value={form.subProduct} onChange={e => sf('subProduct', e.target.value)} disabled={!form.lineOfBusiness}>
                <option value="">Select...</option>
                {subOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              {errors.subProduct && <span className="ap-modal__err-msg">Provide Sub-Product to continue</span>}
            </div>
            <div className="ap-modal__field">
              <label className="ap-modal__lbl"><span className="ap-modal__req">*</span> State</label>
              <MultiSelect values={form.states} options={US_STATES}
                onChange={v => { setForm(p => ({ ...p, states: v })); setErrors(e => ({ ...e, states: false })); }}
                hasError={errors.states} />
              {errors.states && <span className="ap-modal__err-msg">Provide Province to continue</span>}
            </div>
            <div className="ap-modal__field">
              <label className="ap-modal__lbl"><span className="ap-modal__req">*</span> New Business Commission (%)</label>
              <input className={`ap-modal__inp${errors.newBusinessPct ? ' ap-modal__inp--err' : ''}`}
                value={form.newBusinessPct}
                onChange={e => sf('newBusinessPct', e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={blockNonDigit} maxLength={6} />
              {errors.newBusinessPct && <span className="ap-modal__err-msg">Provide New Business Commission to continue</span>}
            </div>
            <div className="ap-modal__field">
              <label className="ap-modal__lbl"><span className="ap-modal__req">*</span> Renewal Commission (%)</label>
              <input className={`ap-modal__inp${errors.renewalPct ? ' ap-modal__inp--err' : ''}`}
                value={form.renewalPct}
                onChange={e => sf('renewalPct', e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={blockNonDigit} maxLength={6} />
              {errors.renewalPct && <span className="ap-modal__err-msg">Provide Renewal Commission to continue</span>}
            </div>
            <div className="ap-modal__field">
              <label className="ap-modal__lbl"><span className="ap-modal__req">*</span> Effective Date</label>
              <div className="ap-modal__datewrap">
                <input className={`ap-modal__inp ap-modal__inp--date${errors.effectiveDate ? ' ap-modal__inp--err' : ''}`}
                  value={form.effectiveDate} readOnly placeholder="MM-DD-YYYY"
                  onClick={() => setShowCal(c => !c)} />
                <button type="button" className="ap-modal__cal-btn" onClick={() => setShowCal(c => !c)}>📅</button>
                {showCal && (
                  <CalendarPicker value={form.effectiveDate}
                    onChange={v => { sf('effectiveDate', v); setShowCal(false); }}
                    onClose={() => setShowCal(false)} />
                )}
              </div>
              {errors.effectiveDate && <span className="ap-modal__err-msg">Provide Effective Date to continue</span>}
            </div>
            <div className="ap-modal__field" />
          </div>
        </div>
        <div className="ap-modal__footer">
          <button className="btn btn--outline" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" onClick={() => { if (validate()) onSave(form); }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AssignProductsPage({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const [rows, setRows] = useState<ProductRow[]>(() => {
    try {
      const saved = sessionStorage.getItem('shift_step3');
      if (saved) { const r = JSON.parse(saved); if (Array.isArray(r)) return r; }
    } catch { /* ignore */ }
    return [];
  });
  const [allProducts,      setAllProducts]      = useState<any[]>([]);
  const [clientCompanies,  setClientCompanies]  = useState<string[]>([]);
  const [selectedCompany,  setSelectedCompany]  = useState('');
  const [sidebarCollapsed, setSidebarCollapsed]  = useState(false);
  const [keyword,          setKeyword]           = useState('');
  const [modalMode,        setModalMode]         = useState<'add' | 'edit' | null>(null);
  const [editId,           setEditId]            = useState<string | null>(null);
  const [deleteId,         setDeleteId]          = useState<string | null>(null);
  const [visibleCols,      setVisibleCols]       = useState<Set<string>>(new Set(ALL_COLUMNS.map(c => c.key)));
  const [showColChooser,   setShowColChooser]    = useState(false);
  const [chooserPos,       setChooserPos]        = useState<{ top: number; left: number } | null>(null);
  const colChooserRef = useRef<HTMLButtonElement>(null);
  const [filterCol,        setFilterCol]         = useState<string | null>(null);
  const [filterPos,        setFilterPos]         = useState<{ top: number; left: number } | null>(null);
  const [filterTab,        setFilterTab]         = useState<'condition' | 'value'>('value');
  const [cond,             setCond]              = useState<CondState>(EMPTY_COND);
  const [vPending,         setVPending]          = useState<string[]>([]);
  const [vSearch,          setVSearch]           = useState('');
  const [appliedFilters,   setAppliedFilters]    = useState<Record<string, ColFilter>>({});
  const [sortCol,          setSortCol]           = useState('');
  const [sortDir,          setSortDir]           = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    api.products.list().then(setAllProducts).catch(() => {});
  }, []);

  useEffect(() => {
    api.clients.getMe()
      .then((detail: any) => {
        const names: string[] = (detail?.companies ?? [])
          .filter((c: any) => (c.status ?? 'Active') !== 'Inactive')
          .map((c: any) => (c.companyName ?? c.company_name ?? '') as string)
          .filter(Boolean);
        setClientCompanies(names);
        if (names.length > 0) setSelectedCompany(prev => prev || names[0]);
      })
      .catch(() => {});
  }, []);

  function getUniqueColVals(col: string): string[] {
    const s = new Set<string>();
    rows.forEach(r => {
      if (col === 'states') r.states.forEach(st => s.add(st));
      else { const v = getColVal(r, col as ProdColKey); if (v) s.add(v); }
    });
    return Array.from(s).sort();
  }

  function openAdd() { setModalMode('add'); setEditId(null); }
  function openEdit(id: string) { setEditId(id); setModalMode('edit'); }
  function closeModal() { setModalMode(null); setEditId(null); }

  function getEditInitial(): ModalForm | null {
    if (!editId) return null;
    const row = rows.find(r => r.id === editId);
    if (!row) return null;
    return {
      insuranceType: row.insuranceType, lineOfBusiness: row.lineOfBusiness, subProduct: row.subProduct,
      states: [...row.states], newBusinessPct: row.newBusinessPct.replace('%', ''),
      renewalPct: row.renewalPct.replace('%', ''), effectiveDate: row.effectiveDate,
    };
  }

  function handleSave(f: ModalForm) {
    if (modalMode === 'add') {
      const nr: ProductRow = {
        id: String(_nextId++), effectiveDate: f.effectiveDate, lineOfBusiness: f.lineOfBusiness,
        subProduct: f.subProduct, insuranceType: f.insuranceType,
        newBusinessPct: f.newBusinessPct ? f.newBusinessPct + '%' : '',
        renewalPct: f.renewalPct ? f.renewalPct + '%' : '', states: f.states,
      };
      setRows(prev => [...prev, nr]);
    } else if (editId) {
      setRows(prev => prev.map(r => r.id !== editId ? r : {
        ...r, effectiveDate: f.effectiveDate, lineOfBusiness: f.lineOfBusiness, subProduct: f.subProduct,
        insuranceType: f.insuranceType,
        newBusinessPct: f.newBusinessPct ? f.newBusinessPct + '%' : '',
        renewalPct: f.renewalPct ? f.renewalPct + '%' : '', states: f.states,
      }));
    }
    closeModal();
  }

  function handleDelete(id: string) { setRows(prev => prev.filter(r => r.id !== id)); setDeleteId(null); }

  function openColChooser() {
    const btn = colChooserRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    setChooserPos({ top: r.bottom + 4, left: r.left });
    setShowColChooser(true);
  }
  function toggleColVisible(key: string) {
    setVisibleCols(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }

  function openFilter(col: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (filterCol === col) { setFilterCol(null); setFilterPos(null); return; }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setFilterCol(col); setFilterPos({ top: rect.bottom + 4, left: rect.left });
    setFilterTab('value'); setCond(EMPTY_COND);
    const existing = appliedFilters[col];
    setVPending(existing?.type === 'value' ? [...existing.vals] : getUniqueColVals(col));
    setVSearch('');
  }
  function closeFilter() { setFilterCol(null); setFilterPos(null); }

  function applyFilter() {
    if (!filterCol) return;
    const newF = { ...appliedFilters };
    if (filterTab === 'condition') {
      if (!cond.op1 && !cond.op2) delete newF[filterCol];
      else newF[filterCol] = { type: 'condition', ...cond };
    } else {
      const all = getUniqueColVals(filterCol);
      if (vPending.length === 0 || vPending.length >= all.length) delete newF[filterCol];
      else newF[filterCol] = { type: 'value', vals: [...vPending] };
    }
    setAppliedFilters(newF);
    closeFilter();
  }

  function handleSort(col: string) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  }

  const displayRows = useMemo(() => {
    let result = [...rows];
    if (keyword.trim()) {
      const q = keyword.toLowerCase();
      result = result.filter(r =>
        r.lineOfBusiness.toLowerCase().includes(q) || r.subProduct.toLowerCase().includes(q) ||
        r.insuranceType.toLowerCase().includes(q) || r.effectiveDate.includes(q) ||
        r.states.some(s => s.toLowerCase().includes(q))
      );
    }
    Object.entries(appliedFilters).forEach(([col, f]) => {
      result = result.filter(r => {
        const val = getColVal(r, col as ProdColKey);
        if (f.type === 'value') return col === 'states' ? r.states.some(s => f.vals.includes(s)) : f.vals.includes(val);
        const hasC1 = !!f.op1, hasC2 = !!f.op2;
        if (!hasC1 && !hasC2) return true;
        const c1 = hasC1 ? matchCond(val, f.op1, f.val1) : true;
        const c2 = hasC2 ? matchCond(val, f.op2, f.val2) : true;
        if (!hasC1) return c2; if (!hasC2) return c1;
        return f.logic === 'and' ? c1 && c2 : c1 || c2;
      });
    });
    if (sortCol) {
      result.sort((a, b) => {
        const av = getColVal(a, sortCol as ProdColKey);
        const bv = getColVal(b, sortCol as ProdColKey);
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return result;
  }, [rows, keyword, appliedFilters, sortCol, sortDir]);

  const displayCols = ALL_COLUMNS.filter(c => visibleCols.has(c.key));

  return (
    <>
      {/* Wizard bar */}
      <div className="rgt-wiz-bar" style={{ padding: '20px 28px 0' }}>
        {WIZARD_STEPS.map((step, i) => (
          <React.Fragment key={step.n}>
            {i > 0 && <div className={`rgt-wiz-connector${step.n <= 3 ? ' rgt-wiz-connector--done' : ''}`} />}
            <div className="rgt-wiz-step">
              <div className={`rgt-wiz-circle${step.n < 3 ? ' rgt-wiz-circle--done' : step.n === 3 ? ' rgt-wiz-circle--active' : ''}`}>
                {step.n < 3 ? '✓' : step.n}
              </div>
              <div className={`rgt-wiz-lbl${step.n === 3 ? ' rgt-wiz-lbl--active' : ''}`}>
                <span>{step.l1}</span><span>{step.l2}</span>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Page heading */}
      <div className="ap-heading">
        <h1 className="ap-title">Add Intermediary / Pragya Jha</h1>
        <p className="ap-breadcrumb">
          <span className="ap-breadcrumb__link">Distribution Management</span>
          {' / '}
          <span className="ap-breadcrumb__cur">Add Intermediary</span>
        </p>
      </div>

      {/* Content card: sidebar + panel */}
      <div className="ap-content">
        {/* Client companies sidebar */}
        <div className={`ap-csidebar${sidebarCollapsed ? ' ap-csidebar--collapsed' : ''}`}>
          <div className="ap-csidebar__hdr">
            {!sidebarCollapsed && <span className="ap-csidebar__title">List of Client Companies</span>}
            <button className="ap-csidebar__toggle" onClick={() => setSidebarCollapsed(c => !c)}>
              {sidebarCollapsed ? '≡' : '≡<'}
            </button>
          </div>
          {sidebarCollapsed ? (
            <div className="ap-csidebar__vert" onClick={() => setSidebarCollapsed(false)}>List of Client Companies</div>
          ) : (
            <div className="ap-csidebar__list">
              {clientCompanies.length === 0
                ? <div className="ap-csidebar__item" style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: 12 }}>No companies found</div>
                : clientCompanies.map(c => (
                    <div key={c} className={`ap-csidebar__item${c === selectedCompany ? ' ap-csidebar__item--active' : ''}`}
                      onClick={() => setSelectedCompany(c)} style={{ cursor: 'pointer' }}>
                      {c === selectedCompany && <span className="ap-csidebar__check">✓</span>}
                      <span>{c}</span>
                    </div>
                  ))
              }
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="ap-panel">
          <div className="ap-panel__hdr">
            <div className="ap-panel__info">
              <div className="ap-panel__company">{selectedCompany}</div>
              <div className="ap-panel__sub">Add Default Commission for LOB &amp; Province</div>
            </div>
            <div className="ap-panel__actions">
              <div className="ap-search-wrap">
                <span className="ap-search-icon">🔍</span>
                <input className="ap-search" placeholder="Search by Keyword"
                  value={keyword} onChange={e => setKeyword(e.target.value)} />
              </div>
              <button className="btn btn--primary" onClick={openAdd}>+ Add Product</button>
            </div>
          </div>

          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr className="ap-thead-row">
                  <th className="ap-th ap-th--chooser">
                    <button ref={colChooserRef} className="ap-chooser-btn" title="Modify Columns" onClick={openColChooser}>≡</button>
                  </th>
                  <th className="ap-th ap-th--actions">Actions</th>
                  {displayCols.map(col => {
                    const isSorted   = sortCol === col.key;
                    const isFiltered = !!appliedFilters[col.key];
                    return (
                      <th key={col.key} className="ap-th">
                        <div className="ap-th-inner">
                          {col.sortable
                            ? <button className={`ap-th-lbl${isSorted ? ' ap-th-lbl--sorted' : ''}`} onClick={() => handleSort(col.key)}>
                                {col.label}{isSorted ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                              </button>
                            : <span className="ap-th-lbl">{col.label}</span>
                          }
                          {col.filterable && (
                            <button className={`ap-filter-btn${isFiltered ? ' ap-filter-btn--active' : ''}`}
                              title="Filter" onClick={e => openFilter(col.key, e)}>⊽</button>
                          )}
                        </div>
                      </th>
                    );
                  })}
                  <th className="ap-th ap-th--trail">
                    <button className={`ap-filter-btn${!!appliedFilters['states_trail'] ? ' ap-filter-btn--active' : ''}`}
                      title="Filter" onClick={e => openFilter('states', e)}>⊽</button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayRows.length === 0 ? (
                  <tr><td colSpan={displayCols.length + 3} className="ap-empty">No Data Available</td></tr>
                ) : displayRows.map((row, idx) => (
                  <tr key={row.id} className="ap-row">
                    <td className="ap-td ap-td--num">{idx + 1}</td>
                    <td className="ap-td ap-td--actions">
                      <button className="ap-action-btn" title="Edit"   onClick={() => openEdit(row.id)}>✏</button>
                      <button className="ap-action-btn ap-action-btn--del" title="Delete" onClick={() => setDeleteId(row.id)}>🗑</button>
                    </td>
                    {displayCols.map(col => (
                      <td key={col.key} className="ap-td">
                        {col.key === 'states' ? row.states.join(', ') : getColVal(row, col.key)}
                      </td>
                    ))}
                    <td className="ap-td" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Fixed footer */}
      <div className="rgt-footer">
        <button type="button" className="btn btn--outline" onClick={onBack}>‹ Previous</button>
        <button type="button" className="btn btn--primary" onClick={() => {
          try { sessionStorage.setItem('shift_step3', JSON.stringify(rows)); } catch { /* ignore */ }
          onNext();
        }}>Save &amp; Next ›</button>
      </div>

      {(modalMode === 'add' || modalMode === 'edit') && (
        <ProductModal initial={modalMode === 'edit' ? getEditInitial() : null}
          onSave={handleSave} onClose={closeModal} products={allProducts} />
      )}
      {deleteId && <DeleteModal onConfirm={() => handleDelete(deleteId)} onCancel={() => setDeleteId(null)} />}
      {showColChooser && chooserPos && (
        <ColChooser pos={chooserPos} visibleCols={visibleCols}
          onToggle={toggleColVisible} onClose={() => setShowColChooser(false)} />
      )}
      {filterCol && filterPos && (
        <FilterDropdown pos={filterPos} activeTab={filterTab} onTabChange={setFilterTab}
          cond={cond} onCondChange={u => setCond(p => ({ ...p, ...u }))}
          allVals={getUniqueColVals(filterCol)}
          vPending={vPending} vSearch={vSearch}
          onSetVPending={setVPending} onSetVSearch={setVSearch}
          onApply={applyFilter} onCancel={closeFilter}
          onClear={() => filterTab === 'condition' ? setCond(EMPTY_COND) : setVPending([])} />
      )}
    </>
  );
}
