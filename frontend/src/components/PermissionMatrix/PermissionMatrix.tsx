import React, { useState, useMemo } from 'react';
import type { ScreenPermissionDto, ScreenPermissionSaveDto } from '../../types/Group';

interface Props {
  permissions: ScreenPermissionDto[];
  readOnly?: boolean;
  onChange?: (updated: ScreenPermissionSaveDto[]) => void;
}

const PERMISSION_COLS: { key: keyof ScreenPermissionSaveDto; label: string }[] = [
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

function makeReadOnly(screenId: number): ScreenPermissionSaveDto {
  return {
    screenId,
    isViewPermission: true, isCreatePermission: false, isEditPermission: false,
    isDuplicatePermission: false, isUploadPermission: false, isDownloadPermission: false,
    isViewSensitiveInfo: false, isAccessSensitiveDoc: false, isApproveReject: false,
  };
}

function makeAllAccess(screenId: number): ScreenPermissionSaveDto {
  return {
    screenId,
    isViewPermission: true, isCreatePermission: true, isEditPermission: true,
    isDuplicatePermission: true, isUploadPermission: true, isDownloadPermission: true,
    isViewSensitiveInfo: true, isAccessSensitiveDoc: true, isApproveReject: true,
  };
}

export default function PermissionMatrix({ permissions, readOnly, onChange }: Props) {
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<Record<number, ScreenPermissionSaveDto>>(() => {
    const map: Record<number, ScreenPermissionSaveDto> = {};
    for (const p of permissions) map[p.screenId] = { ...p };
    return map;
  });

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

  const updateOne = (screenId: number, field: keyof ScreenPermissionSaveDto, value: boolean) => {
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
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search screens or modules..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 320, fontSize: 13 }}
        />
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={thStyle('left', 200)}>Screen</th>
              {PERMISSION_COLS.map(c => (
                <th key={c.key} style={thStyle('center', 75)}>{c.label}</th>
              ))}
              {!readOnly && <th style={thStyle('center', 180)} />}
            </tr>
          </thead>
          <tbody>
            {Array.from(modules.entries()).map(([moduleName, screens]) => (
              <ModuleSection
                key={moduleName}
                moduleName={moduleName}
                screens={screens}
                draft={draft}
                readOnly={!!readOnly}
                onUpdate={updateOne}
                onApplyToModule={builder => applyToScreens(screens.map(s => s.screenId), builder)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ModuleSection({
  moduleName, screens, draft, readOnly, onUpdate, onApplyToModule,
}: {
  moduleName: string;
  screens: ScreenPermissionDto[];
  draft: Record<number, ScreenPermissionSaveDto>;
  readOnly: boolean;
  onUpdate: (id: number, field: keyof ScreenPermissionSaveDto, value: boolean) => void;
  onApplyToModule: (builder: (id: number) => ScreenPermissionSaveDto) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <>
      <tr style={{ background: '#eff6ff' }}>
        <td
          colSpan={readOnly ? 10 : 9}
          style={{ padding: '9px 12px', fontWeight: 700, color: '#1d4ed8', cursor: 'pointer', userSelect: 'none' }}
          onClick={() => setOpen(o => !o)}
        >
          <span style={{ marginRight: 8, fontSize: 11 }}>{open ? '▼' : '▶'}</span>
          {moduleName}
        </td>
        {!readOnly && (
          <td style={{ padding: '6px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onApplyToModule(makeReadOnly); }}
              style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 4, cursor: 'pointer',
                border: '1px solid #d1d5db', background: '#fff', color: '#374151',
                marginRight: 6, fontWeight: 500,
              }}
            >
              Read Only
            </button>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onApplyToModule(makeAllAccess); }}
              style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 4, cursor: 'pointer',
                border: '1px solid #0B5AA0', background: '#0B5AA0', color: '#fff',
                fontWeight: 500,
              }}
            >
              All Access
            </button>
          </td>
        )}
      </tr>

      {open && screens.map(screen => (
        <tr key={screen.screenId} style={{ borderBottom: '1px solid #f3f4f6' }}>
          <td style={{ padding: '7px 12px', color: '#374151', paddingLeft: 28 }}>{screen.screenName}</td>
          {PERMISSION_COLS.map(col => {
            const val = (draft[screen.screenId]?.[col.key] ?? false) as boolean;
            return (
              <td key={col.key} style={{ textAlign: 'center', padding: '7px 4px' }}>
                <input
                  type="checkbox"
                  checked={val}
                  disabled={readOnly}
                  onChange={e => onUpdate(screen.screenId, col.key, e.target.checked)}
                  style={{ width: 15, height: 15, cursor: readOnly ? 'default' : 'pointer', accentColor: '#0B5AA0' }}
                />
              </td>
            );
          })}
          {!readOnly && <td />}
        </tr>
      ))}
    </>
  );
}

function thStyle(align: 'left' | 'center', minWidth: number): React.CSSProperties {
  return {
    textAlign: align, padding: '8px 12px', fontWeight: 600, fontSize: 12,
    color: '#6b7280', borderBottom: '2px solid #e5e7eb',
    minWidth, whiteSpace: 'nowrap',
  };
}
