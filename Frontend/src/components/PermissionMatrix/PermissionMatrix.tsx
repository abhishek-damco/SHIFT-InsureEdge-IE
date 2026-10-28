// US-006/US-012: Permission matrix — one expandable card per module, 9 permission columns.
// BR-009: "Read Only" per module sets View=true, all others=false for that module's screens.
// BR-010: "All Access" per module sets all 9=true for that module's screens.
// US-013: Search filter narrows visible screens.
// QA UGM-09: card per module with its own header row; Read Only / All Access are toggle
// switches; modules keep the API order (module.sort_order), not alphabetical.
import { useState, useMemo } from 'react';
import type { ScreenPermissionDto, ScreenPermissionSaveDto } from '../../types/Group';

interface Props {
  permissions: ScreenPermissionDto[];
  readOnly?: boolean;
  onChange?: (updated: ScreenPermissionSaveDto[]) => void;
}

type PermissionKey = Exclude<keyof ScreenPermissionSaveDto, 'screenId'>;

const PERMISSION_COLS: { key: PermissionKey; label: string }[] = [
  { key: 'isViewPermission',      label: 'View' },
  { key: 'isCreatePermission',    label: 'Add' },
  { key: 'isEditPermission',      label: 'Edit' },
  { key: 'isDuplicatePermission', label: 'Clone' },
  { key: 'isUploadPermission',    label: 'Upload' },
  { key: 'isDownloadPermission',  label: 'Download' },
  { key: 'isViewSensitiveInfo',   label: 'Sensitive Data' },
  { key: 'isAccessSensitiveDoc',  label: 'Sensitive Docs' },
  { key: 'isApproveReject',       label: 'Approve/Reject' },
];

export const PERMISSION_KEYS: PermissionKey[] = PERMISSION_COLS.map(c => c.key);

function build(screenId: number, on: (key: PermissionKey) => boolean): ScreenPermissionSaveDto {
  const p = { screenId } as ScreenPermissionSaveDto;
  for (const key of PERMISSION_KEYS) p[key] = on(key);
  return p;
}
const makeReadOnly = (screenId: number) => build(screenId, key => key === 'isViewPermission');
const makeAllAccess = (screenId: number) => build(screenId, () => true);
const makeNoAccess = (screenId: number) => build(screenId, () => false);

export default function PermissionMatrix({ permissions, readOnly, onChange }: Props) {
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<Record<number, ScreenPermissionSaveDto>>(() => {
    const map: Record<number, ScreenPermissionSaveDto> = {};
    for (const p of permissions) map[p.screenId] = { ...p };
    return map;
  });

  // Sync draft when permissions list changes (e.g. first load of screens)
  const permKey = permissions.map(p => p.screenId).join(',');
  const [lastKey, setLastKey] = useState(permKey);
  if (permKey !== lastKey) {
    const map: Record<number, ScreenPermissionSaveDto> = {};
    for (const p of permissions) map[p.screenId] = { ...p };
    setDraft(map);
    setLastKey(permKey);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return permissions;
    const q = search.toLowerCase();
    return permissions.filter(p =>
      p.screenName.toLowerCase().includes(q) || p.moduleName.toLowerCase().includes(q));
  }, [permissions, search]);

  // Map keeps insertion order, i.e. the API's module order.
  const modules = useMemo(() => {
    const map = new Map<string, ScreenPermissionDto[]>();
    for (const p of filtered) {
      if (!map.has(p.moduleName)) map.set(p.moduleName, []);
      map.get(p.moduleName)!.push(p);
    }
    return map;
  }, [filtered]);

  const applyToScreens = (screenIds: number[], builder: (id: number) => ScreenPermissionSaveDto) => {
    if (readOnly) return;
    const updated = { ...draft };
    for (const id of screenIds) updated[id] = builder(id);
    setDraft(updated);
    onChange?.(Object.values(updated));
  };

  const updateOne = (screenId: number, field: PermissionKey, value: boolean) => {
    if (readOnly) return;
    const updated = { ...draft, [screenId]: { ...draft[screenId], [field]: value } };
    setDraft(updated);
    onChange?.(Object.values(updated));
  };

  if (permissions.length === 0) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
        Loading screens…
      </div>
    );
  }

  return (
    <div>
      {/* Search */}
      <div className="rgt-search-row" style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div className="rgt-search-wrap" style={{ width: 'min(100%, 574px)', maxWidth: 'none' }}>
          <span className="rgt-search-icon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            className="rgt-search-input"
            type="search"
            aria-label="Search modules or features"
            placeholder="Enter module or feature name"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {modules.size === 0 && (
        <div style={{ padding: '24px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No Data Available</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from(modules.entries()).map(([moduleName, screens]) => (
          <ModuleCard
            key={moduleName}
            moduleName={moduleName}
            screens={screens}
            draft={draft}
            readOnly={!!readOnly}
            onUpdate={updateOne}
            onApplyToModule={builder => applyToScreens(screens.map(s => s.screenId), builder)}
          />
        ))}
      </div>
    </div>
  );
}

function ModuleCard({
  moduleName, screens, draft, readOnly, onUpdate, onApplyToModule,
}: {
  moduleName: string;
  screens: ScreenPermissionDto[];
  draft: Record<number, ScreenPermissionSaveDto>;
  readOnly: boolean;
  onUpdate: (id: number, field: PermissionKey, value: boolean) => void;
  onApplyToModule: (builder: (id: number) => ScreenPermissionSaveDto) => void;
}) {
  const [open, setOpen] = useState(false);

  const matches = (builder: (id: number) => ScreenPermissionSaveDto) =>
    screens.every(s => {
      const expected = builder(s.screenId);
      return PERMISSION_KEYS.every(k => !!draft[s.screenId]?.[k] === expected[k]);
    });
  const isReadOnly = matches(makeReadOnly);
  const isAllAccess = matches(makeAllAccess);

  return (
    <div style={{ border: '1px solid #d9dde4', borderRadius: 6, overflow: 'hidden' }}>
      {/* Module header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        padding: '9px 12px', background: '#f5f8fc',
        borderBottom: open ? '1px solid #d9dde4' : 'none',
      }}>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: 0, width: 'auto',
            background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
            fontSize: 13, fontWeight: 700, color: '#1d4ed8',
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 10, display: 'inline-block', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>▶</span>
          {moduleName}
        </button>
        <Toggle
          label="Read Only"
          checked={isReadOnly}
          disabled={readOnly}
          onChange={on => onApplyToModule(on ? makeReadOnly : makeNoAccess)}
        />
        <Toggle
          label="All Access"
          checked={isAllAccess}
          disabled={readOnly}
          onChange={on => onApplyToModule(on ? makeAllAccess : makeNoAccess)}
        />
      </div>

      {open && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fff' }}>
                <th style={thStyle('left', 200)}>Screen</th>
                {PERMISSION_COLS.map(c => (
                  <th key={c.key} style={thStyle('center', 75)}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {screens.map(screen => (
                <tr key={screen.screenId} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '7px 12px', color: '#374151' }}>{screen.screenName}</td>
                  {PERMISSION_COLS.map(col => {
                    const val = !!draft[screen.screenId]?.[col.key];
                    return (
                      <td key={col.key} style={{ textAlign: 'center', padding: '7px 4px' }}>
                        <input
                          type="checkbox"
                          aria-label={`${screen.screenName} ${col.label}`}
                          checked={val}
                          disabled={readOnly}
                          onChange={e => onUpdate(screen.screenId, col.key, e.target.checked)}
                          style={{ width: 15, height: 15, cursor: readOnly ? 'default' : 'pointer', accentColor: '#0B5AA0' }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function Toggle({ label, checked, disabled, onChange }: {
  label: string; checked: boolean; disabled: boolean; onChange: (on: boolean) => void;
}) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 500, color: '#374151', cursor: disabled ? 'default' : 'pointer', margin: 0 }}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        style={{
          position: 'relative', display: 'inline-flex', width: 32, height: 17, flexShrink: 0,
          borderRadius: 999, border: 'none', padding: 0,
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: checked ? '#1769aa' : '#d1d5db', transition: 'background 0.2s',
        }}
      >
        <span style={{
          position: 'absolute', top: 2, left: checked ? 17 : 2, width: 13, height: 13,
          borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s',
        }} />
      </button>
      {label}
    </label>
  );
}

function thStyle(align: 'left' | 'center', minWidth: number): React.CSSProperties {
  return {
    textAlign: align, padding: '8px 12px', fontWeight: 600, fontSize: 12,
    color: '#6b7280', borderBottom: '1px solid #e5e7eb',
    minWidth, whiteSpace: 'nowrap',
  };
}
