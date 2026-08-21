const DRAFT_ID_KEY = 'shift_draft_id';
const ITEMS_KEY    = 'shift_intermediaries';
const NEXT_ID_KEY  = 'shift_next_id';

function getNextId(): number {
  try {
    const n = parseInt(localStorage.getItem(NEXT_ID_KEY) || '1', 10);
    localStorage.setItem(NEXT_ID_KEY, String(n + 1));
    return n;
  } catch { return Date.now(); }
}

export function getCurrentDraftId(): number | null {
  try {
    const raw = localStorage.getItem(DRAFT_ID_KEY);
    return raw ? parseInt(raw, 10) : null;
  } catch { return null; }
}

export function setCurrentDraftId(id: number): void {
  try { localStorage.setItem(DRAFT_ID_KEY, String(id)); } catch { /* ignore */ }
}

export function clearCurrentDraftId(): void {
  try { localStorage.removeItem(DRAFT_ID_KEY); } catch { /* ignore */ }
}

function loadItems(): any[] {
  try { return JSON.parse(localStorage.getItem(ITEMS_KEY) || '[]'); } catch { return []; }
}

function saveItems(items: any[]): void {
  try { localStorage.setItem(ITEMS_KEY, JSON.stringify(items)); } catch { /* ignore */ }
}

export function upsertDraftStep(
  stepNum: number,
  stepKey: 'step1' | 'step2' | 'step3' | 'step4',
  stepData: any,
  basicInfo?: {
    name: string;
    intermediaryType: string;
    federalTaxId: string;
    primaryContactName: string | null;
    primaryContactTitle: string | null;
    residentState: string;
  }
): void {
  const items = loadItems();
  let id = getCurrentDraftId();

  if (id === null) {
    id = getNextId();
    setCurrentDraftId(id);
  }

  const now = new Date().toISOString();
  const idx = items.findIndex((i: any) => i.id === id);

  if (idx === -1) {
    const newItem: any = {
      id,
      status: 'Draft',
      draftStep: stepNum,
      name:                basicInfo?.name                ?? 'Unnamed Intermediary',
      intermediaryType:    basicInfo?.intermediaryType    ?? '',
      federalTaxId:        basicInfo?.federalTaxId        ?? '',
      primaryContactName:  basicInfo?.primaryContactName  ?? null,
      primaryContactTitle: basicInfo?.primaryContactTitle ?? null,
      residentState:       basicInfo?.residentState       ?? '',
      createdAt: now,
      updatedAt: now,
      [stepKey]: stepData,
    };
    items.push(newItem);
  } else {
    items[idx] = {
      ...items[idx],
      draftStep: Math.max(items[idx].draftStep ?? 0, stepNum),
      updatedAt: now,
      [stepKey]: stepData,
      ...(basicInfo && {
        name:                basicInfo.name                || items[idx].name,
        intermediaryType:    basicInfo.intermediaryType    || items[idx].intermediaryType,
        federalTaxId:        basicInfo.federalTaxId        || items[idx].federalTaxId,
        primaryContactName:  basicInfo.primaryContactName  ?? items[idx].primaryContactName,
        primaryContactTitle: basicInfo.primaryContactTitle ?? items[idx].primaryContactTitle,
        residentState:       basicInfo.residentState       || items[idx].residentState,
      }),
    };
  }

  saveItems(items);
}

export function finalizeDraft(
  status: 'Active' | 'Inactive',
  basicInfo: {
    name: string;
    intermediaryType: string;
    federalTaxId: string;
    primaryContactName: string | null;
    primaryContactTitle: string | null;
    residentState: string;
  },
  steps: {
    step1?: any;
    step2?: any;
    step3?: any;
    step4?: any;
  }
): void {
  const items = loadItems();
  const id    = getCurrentDraftId();
  const now   = new Date().toISOString();

  if (id !== null) {
    const idx = items.findIndex((i: any) => i.id === id);
    if (idx !== -1) {
      items[idx] = {
        ...items[idx],
        status,
        draftStep: undefined,
        updatedAt: now,
        ...basicInfo,
        ...steps,
      };
    } else {
      items.push({ id, status, updatedAt: now, createdAt: now, ...basicInfo, ...steps });
    }
  } else {
    const newId = getNextId();
    items.push({ id: newId, status, updatedAt: now, createdAt: now, ...basicInfo, ...steps });
  }

  saveItems(items);
  clearCurrentDraftId();
  ['shift_step1','shift_step2','shift_step3','shift_step4'].forEach(k => {
    try { sessionStorage.removeItem(k); } catch { /* ignore */ }
  });
}
