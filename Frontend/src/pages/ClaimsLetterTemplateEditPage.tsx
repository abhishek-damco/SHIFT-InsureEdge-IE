import { useState, useRef, useEffect } from 'react';
import { renderAsync } from 'docx-preview';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { letterTemplatesApi, CreateDocumentPayload, LetterTemplateDocumentDetail } from '../api/letterTemplates';

const TEMPLATE_CATEGORIES = [
  { value: 'Claim Acknowledgment Letter',                         subject: 'Claims Acknowledgment Letter' },
  { value: 'Reservation of Rights',                              subject: 'Reservation of Rights — Policy No. {{PolicyNumber}} / Claim No. {{ClaimNumber}}' },
  { value: 'Adjuster Inspection',                                subject: 'Property Inspection Notification — Claim No. {{ClaimNumber}}' },
  { value: 'Coverage Determination Approved',                    subject: 'Coverage Determination — Claim No. {{ClaimNumber}}' },
  { value: 'Denial of Coverage',                                 subject: 'Notice of Claim Denial — Claim No. {{ClaimNumber}}' },
  { value: 'Settlement Offer',                                   subject: 'Settlement Offer and Payment Summary — Claim No. {{ClaimNumber}}' },
  { value: 'Claim Closure',                                      subject: 'Notification of Claim Closure — Claim No. {{ClaimNumber}}' },
  { value: 'Covered Liabilities Claim(s) Report and Assignment', subject: '' },
  { value: 'Physical Damage Claim(s) Report and Assignment',     subject: '' },
];

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire',
  'New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio',
  'Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota',
  'Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia',
  'Wisconsin','Wyoming',
];

interface DocEntry {
  file: File;
  fileName: string;
  version: string;
  effectiveStartDate: string;
  effectiveEndDate: string;
}

function todayISO() { return new Date().toISOString().split('T')[0]; }
function fmtDate(iso: string | null | undefined) {
  if (!iso) return '-';
  const [y, m, d] = iso.split('-');
  return `${m}-${d}-${y}`;
}
function isValidDocFile(f: File) {
  const ext = f.name.split('.').pop()?.toLowerCase();
  return ext === 'doc' || ext === 'docx' || ext === 'pdf';
}

export default function ClaimsLetterTemplateEditPage() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const { id }      = useParams<{ id: string }>();
  const templateId  = Number(id);

  const [active, setActive]             = useState(true);
  const [templateName, setTemplateName] = useState('');
  const [category, setCategory]         = useState('');
  const [subjectLine, setSubjectLine]   = useState('');
  const [description, setDescription]  = useState('');
  const [states, setStates]             = useState<string[]>([]);
  const [errors, setErrors]             = useState<Record<string, string>>({});
  const [initialized, setInitialized]   = useState(false);

  const [stateDropOpen, setStateDropOpen] = useState(false);
  const [stateSearch, setStateSearch]     = useState('');
  const stateRef = useRef<HTMLDivElement>(null);

  const [existingDoc, setExistingDoc] = useState<LetterTemplateDocumentDetail | null>(null);
  const [newDoc, setNewDoc]           = useState<DocEntry | null>(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [viewModal, setViewModal]       = useState(false);

  const { data: template, isLoading } = useQuery({
    queryKey: ['letter-template', templateId],
    queryFn: () => letterTemplatesApi.getById(templateId),
    staleTime: 0,
  });

  useEffect(() => {
    if (template && !initialized) {
      setActive(template.active);
      setTemplateName(template.templateName);
      setCategory(template.templateCategory ?? '');
      setSubjectLine(template.subjectLine ?? '');
      setDescription(template.description ?? '');
      setStates(template.states);
      setExistingDoc(template.documents[0] ?? null);
      setInitialized(true);
    }
  }, [template, initialized]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (stateRef.current && !stateRef.current.contains(e.target as Node)) setStateDropOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  function handleCategoryChange(val: string) {
    setCategory(val);
    const found = TEMPLATE_CATEGORIES.find(c => c.value === val);
    setSubjectLine(found?.subject ?? '');
    setErrors(e => ({ ...e, category: '' }));
  }

  function toggleState(s: string) {
    setStates(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    setErrors(e => ({ ...e, states: '' }));
  }

  function toggleAllStates(shown: string[]) {
    const allOn = shown.every(s => states.includes(s));
    if (allOn) setStates(prev => prev.filter(s => !shown.includes(s)));
    else setStates(prev => [...new Set([...prev, ...shown])]);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!templateName.trim()) e.templateName = 'Provide Template Name to continue';
    if (!category)            e.category     = 'Provide Template Category to continue';
    if (states.length === 0)  e.states       = 'Provide State Applicability to continue';
    if (!subjectLine.trim())  e.subjectLine  = 'Provide Subject Line to continue';
    if (!description.trim())  e.description  = 'Provide Description to continue';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const mutation = useMutation({
    mutationFn: async () => {
      let docContent: string | null = null;
      if (newDoc) {
        docContent = await new Promise<string>((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res((reader.result as string).split(',')[1]);
          reader.onerror = rej;
          reader.readAsDataURL(newDoc.file);
        });
      }
      return letterTemplatesApi.update(templateId, {
        templateName: templateName.trim(),
        active,
        templateCategory: category,
        subjectLine: subjectLine.trim(),
        description: description.trim(),
        states,
        keepDocumentIds: existingDoc ? [existingDoc.id] : [],
        newDocuments: newDoc
          ? [{ documentName: newDoc.fileName, documentFile: newDoc.fileName, documentContent: docContent, version: newDoc.version, effectiveStartDate: newDoc.effectiveStartDate || null, effectiveEndDate: newDoc.effectiveEndDate || null } as CreateDocumentPayload]
          : [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letter-templates'] });
      navigate('/claims/letter-template');
    },
    onError: (err) => {
      console.error('[LetterTemplate] Update failed:', err);
    },
  });

  function handleSave() {
    if (!validate()) return;
    mutation.mutate();
  }

  const hasDoc       = existingDoc !== null || newDoc !== null;
  const currentVersion = existingDoc?.version ?? newDoc?.version ?? template?.currentVersion ?? '0.0';
  const shownStates  = stateSearch ? US_STATES.filter(s => s.toLowerCase().includes(stateSearch.toLowerCase())) : US_STATES;
  const allShownSel  = shownStates.length > 0 && shownStates.every(s => states.includes(s));
  const stateDisplay = states.length === 0 ? 'Select...' : states.length <= 2 ? states.join(', ') : `${states[0]}, ${states[1]} +${states.length - 2} more`;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#888' }}>
        Loading template...
      </div>
    );
  }

  if (!template) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#e53935' }}>
        Template not found.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#333' }}>

      {/* Header */}
      <div style={{ padding: '20px 24px 0' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '600', color: '#1a1a2e' }}>Edit Template</h2>
        <div style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>
          <span style={{ color: '#1565c0', cursor: 'pointer' }} onClick={() => navigate('/claims/letter-template')}>Claim Letter Template</span>
          <span> / Edit Template</span>
        </div>
      </div>

      {/* Two panels */}
      <div style={{ flex: 1, display: 'flex', gap: '16px', padding: '0 24px', overflow: 'auto' }}>

        {/* Left: Template Identification */}
        <div style={{ flex: '0 0 430px', border: '1px solid #d1d5db', borderRadius: '6px', padding: '20px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontWeight: '600', fontSize: '15px', color: '#1a1a2e' }}>Template Identification</div>

          {/* ID banner */}
          <div style={{ background: '#e0f2f1', border: '1px solid #b2dfdb', borderRadius: '4px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#00695c', fontWeight: '500', fontSize: '13px' }}>Template ID - {template.templateCode}</span>
            <span style={{ color: '#00897b', fontSize: '12px' }}>Read Only</span>
          </div>

          {/* Status + Version */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', color: '#555' }}>Status :</span>
              <div onClick={() => setActive(p => !p)}
                style={{ width: 44, height: 24, borderRadius: 12, background: active ? '#1565c0' : '#ccc', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                <div style={{ position: 'absolute', top: 3, left: active ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#555' }}>Version No</div>
              <div style={{ fontSize: '13px', fontWeight: '500' }}>{currentVersion}</div>
            </div>
          </div>

          {/* Template Name */}
          <div>
            <label style={LBL}><span style={RED}>*</span> Template Name</label>
            <input value={templateName} onChange={e => { setTemplateName(e.target.value); setErrors(x => ({ ...x, templateName: '' })); }}
              style={{ ...INP, borderColor: errors.templateName ? '#e53935' : '#ccc' }} />
            {errors.templateName && <ErrMsg msg={errors.templateName} />}
          </div>

          {/* LOB + Insurance Type (read-only) */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <div><div style={SUBLBL}>Line of Business</div><div style={ROVAL}>{template.lineOfBusiness ?? 'E&S Homeowners'}</div></div>
            <div><div style={SUBLBL}>Insurance Type</div><div style={ROVAL}>{template.insuranceType ?? 'Speciality Lines'}</div></div>
          </div>

          {/* Category + State */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={LBL}><span style={RED}>*</span> Template Category</label>
              <select value={category} onChange={e => handleCategoryChange(e.target.value)}
                style={{ ...INP, borderColor: errors.category ? '#e53935' : '#ccc', appearance: 'auto' }}>
                <option value="">Select...</option>
                {TEMPLATE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
              </select>
              {errors.category && <ErrMsg msg={errors.category} />}
            </div>

            <div style={{ flex: 1, position: 'relative' }} ref={stateRef}>
              <label style={LBL}><span style={RED}>*</span> State Applicability</label>
              <div onClick={() => setStateDropOpen(p => !p)}
                style={{ ...INP, borderColor: errors.states ? '#e53935' : '#ccc', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: states.length === 0 ? '#aaa' : '#333', fontSize: '13px' }}>{stateDisplay}</span>
                <span style={{ flexShrink: 0, fontSize: '11px', color: '#666' }}>&#9660;</span>
              </div>
              {errors.states && <ErrMsg msg={errors.states} />}
              {stateDropOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, minWidth: '260px', zIndex: 600, background: '#fff', border: '1px solid #d1d5db', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '8px 0' }}>
                  <div style={{ padding: '0 8px 6px' }}>
                    <input type="text" placeholder="Search states..." value={stateSearch} onChange={e => setStateSearch(e.target.value)}
                      style={{ width: '100%', padding: '5px 8px', border: '1px solid #ccc', borderRadius: '3px', fontSize: '12px', boxSizing: 'border-box', outline: 'none' }}
                      onClick={e => e.stopPropagation()} />
                  </div>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', overflowX: 'hidden' }}>
                    <label style={SROW}>
                      <input type="checkbox" checked={allShownSel} onChange={() => toggleAllStates(shownStates)} style={{ flexShrink: 0, width: 14, height: 14, accentColor: '#1565c0', cursor: 'pointer' }} />
                      <span style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' }}>Select All</span>
                    </label>
                    {shownStates.map(s => (
                      <label key={s} style={{ ...SROW, backgroundColor: states.includes(s) ? '#e8f0fe' : 'transparent' }}>
                        <input type="checkbox" checked={states.includes(s)} onChange={() => toggleState(s)} style={{ flexShrink: 0, width: 14, height: 14, accentColor: '#1565c0', cursor: 'pointer' }} />
                        <span style={{ fontSize: '13px', whiteSpace: 'nowrap', color: states.includes(s) ? '#1565c0' : '#333' }}>{s}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Subject Line */}
          <div>
            <label style={LBL}><span style={RED}>*</span> Subject Line</label>
            <input value={subjectLine} onChange={e => { setSubjectLine(e.target.value); setErrors(x => ({ ...x, subjectLine: '' })); }}
              style={{ ...INP, borderColor: errors.subjectLine ? '#e53935' : '#ccc' }} />
            {errors.subjectLine && <ErrMsg msg={errors.subjectLine} />}
          </div>

          {/* Description */}
          <div>
            <label style={LBL}><span style={RED}>*</span> Description</label>
            <textarea value={description} onChange={e => { setDescription(e.target.value); setErrors(x => ({ ...x, description: '' })); }}
              rows={4} style={{ ...INP, borderColor: errors.description ? '#e53935' : '#ccc', resize: 'vertical', fontFamily: 'Arial, sans-serif' }} />
            {errors.description && <ErrMsg msg={errors.description} />}
          </div>
        </div>

        {/* Right: Upload Document */}
        <div style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '6px', padding: '20px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: '600', fontSize: '15px', color: '#1a1a2e' }}>Upload Document</span>
            <button
              onClick={() => setShowDocModal(true)}
              disabled={hasDoc}
              style={{ backgroundColor: hasDoc ? '#b0bec5' : '#1565c0', color: '#fff', border: 'none', borderRadius: '4px', padding: '7px 14px', cursor: hasDoc ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '500' }}>
              + Add Document
            </button>
          </div>

          {!hasDoc ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '15px', fontWeight: '500' }}>
              No Data Available
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={DTH}>Action</th>
                  <th style={DTH}>Document Name</th>
                  <th style={{ ...DTH, cursor: 'pointer' }}>Version <span style={{ color: '#aaa' }}>&#8597;</span></th>
                  <th style={{ ...DTH, cursor: 'pointer' }}>Effective Date From <span style={{ color: '#aaa' }}>&#8597;</span></th>
                  <th style={{ ...DTH, cursor: 'pointer' }}>Effective Date To <span style={{ color: '#aaa' }}>&#8597;</span></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ ...DTC, textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', gap: '10px', alignItems: 'center' }}>
                      {newDoc && (
                        <span title="View" onClick={() => setViewModal(true)} style={{ cursor: 'pointer', color: '#555', fontSize: '16px' }}>&#128065;</span>
                      )}
                      <span title="Remove"
                        onClick={() => { setExistingDoc(null); setNewDoc(null); }}
                        style={{ cursor: 'pointer', color: '#555', fontSize: '18px', lineHeight: 1 }}>&#x2297;</span>
                    </span>
                  </td>
                  <td style={DTC}>{existingDoc?.documentName ?? newDoc?.fileName ?? '-'}</td>
                  <td style={DTC}>{existingDoc?.version ?? newDoc?.version ?? '-'}</td>
                  <td style={DTC}>{fmtDate(existingDoc?.effectiveStartDate ?? newDoc?.effectiveStartDate)}</td>
                  <td style={DTC}>{fmtDate(existingDoc?.effectiveEndDate ?? newDoc?.effectiveEndDate)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', padding: '16px 24px', borderTop: '1px solid #e5e7eb', background: '#fff', marginTop: '16px' }}>
        {mutation.isError && (
          <span style={{ color: '#e53935', fontSize: '13px', marginRight: 'auto' }}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            Failed to save. {(mutation.error as any)?.response?.data?.message || (mutation.error as any)?.response?.data || 'Please check your connection and try again.'}
          </span>
        )}
        <button onClick={() => navigate('/claims/letter-template')}
          style={{ padding: '8px 24px', border: '1px solid #ccc', borderRadius: '4px', background: '#fff', cursor: 'pointer', fontSize: '14px', color: '#555' }}>
          Cancel
        </button>
        <button onClick={handleSave} disabled={mutation.isPending}
          style={{ padding: '8px 32px', border: 'none', borderRadius: '4px', background: '#1565c0', color: '#fff', cursor: mutation.isPending ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600', opacity: mutation.isPending ? 0.7 : 1 }}>
          {mutation.isPending ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Add Document Modal */}
      {showDocModal && (
        <AddDocumentModal
          onAdd={(entry) => { setNewDoc(entry); setShowDocModal(false); }}
          onClose={() => setShowDocModal(false)}
        />
      )}

      {/* View Document Modal */}
      {viewModal && newDoc && (
        <DocViewerModal file={newDoc.file} onClose={() => setViewModal(false)} />
      )}
    </div>
  );
}

/* ── Add Document Modal ──────────────────────────────────── */
function AddDocumentModal({ onAdd, onClose }: { onAdd: (d: DocEntry) => void; onClose: () => void }) {
  const [file, setFile]           = useState<File | null>(null);
  const [dragOver, setDragOver]   = useState(false);
  const [fileError, setFileError] = useState('');
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate]     = useState('2999-12-31');
  const fileInputRef              = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    if (!isValidDocFile(f)) { setFileError('Only DOC and DOCX files are supported.'); setFile(null); return; }
    if (f.size < 10240)     { setFileError('File size must be at least 10 KB.'); setFile(null); return; }
    if (f.size > 10485760)  { setFileError('File size must not exceed 10 MB.'); setFile(null); return; }
    setFileError('');
    setFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }

  function handleAdd() {
    if (!file) { setFileError('Please select a file.'); return; }
    onAdd({ file, fileName: file.name, version: '1.0', effectiveStartDate: startDate, effectiveEndDate: endDate });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '8px', width: 460, boxShadow: '0 8px 32px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
          <span style={{ fontWeight: '600', fontSize: '16px', color: '#1a1a2e' }}>Add Document</span>
          <span onClick={onClose} style={{ cursor: 'pointer', fontSize: '20px', color: '#666', lineHeight: 1 }}>&#10005;</span>
        </div>

        <div style={{ padding: '20px' }}>
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{ border: `2px dashed ${dragOver ? '#1565c0' : '#d1d5db'}`, borderRadius: '6px', padding: '30px 20px', textAlign: 'center', background: dragOver ? '#e8f0fe' : '#fafafa', marginBottom: '20px', transition: 'all 0.2s' }}>
            <div style={{ fontWeight: '600', fontSize: '14px', color: '#333', marginBottom: '6px' }}>
              Drag and Drop File Here or Select a File
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '2px' }}>Supported formats are DOC, DOCX, PDF</div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>File size : 10 KB-10 MB</div>
            <input ref={fileInputRef} type="file" accept=".doc,.docx,.pdf" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <button onClick={() => fileInputRef.current?.click()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '7px 18px', border: '1px solid #ccc', borderRadius: '4px', background: '#fff', cursor: 'pointer', fontSize: '13px', color: '#333' }}>
              <span style={{ fontSize: '16px' }}>&#128193;</span> Browse File
            </button>
            {file && <div style={{ marginTop: '10px', fontSize: '12px', color: '#1565c0', fontWeight: '500' }}>&#128196; {file.name}</div>}
            {fileError && <div style={{ marginTop: '8px', fontSize: '12px', color: '#e53935' }}>{fileError}</div>}
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#555', marginBottom: '5px' }}><span style={RED}>*</span> Effective Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#555', marginBottom: '5px' }}><span style={RED}>*</span> Effective End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button onClick={onClose}
              style={{ padding: '8px 24px', border: '1px solid #ccc', borderRadius: '4px', background: '#fff', cursor: 'pointer', fontSize: '14px', color: '#555' }}>
              Cancel
            </button>
            <button onClick={handleAdd}
              style={{ padding: '8px 32px', border: 'none', borderRadius: '4px', background: '#1565c0', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Doc Viewer Modal ──────────────────────────────────── */
function DocViewerModal({ file, onClose }: { file: File; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'pdf') {
      if (!cancelled) setStatus('done');
      return () => { cancelled = true; };
    }

    (async () => {
      await new Promise(r => setTimeout(r, 80));
      if (!containerRef.current || cancelled) return;
      const header = await file.slice(0, 4).arrayBuffer();
      const b = new Uint8Array(header);
      const isZip = b[0] === 0x50 && b[1] === 0x4B && b[2] === 0x03 && b[3] === 0x04;
      if (!isZip) { if (!cancelled) setStatus('error'); return; }
      try {
        await renderAsync(file, containerRef.current, undefined, {
          className: 'docx-pg',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
          renderHeaders: true,
          renderFooters: true,
        });
        if (!cancelled) setStatus('done');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [file]);

  const isPdf   = file.name.toLowerCase().endsWith('.pdf');
  const blobUrl = status === 'done' && isPdf ? URL.createObjectURL(file) : '';
  const sizeMB  = (file.size / 1048576).toFixed(2);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`
        @keyframes _dspin { to { transform: rotate(360deg); } }
        .docx-pg section.docx { background:#fff; margin:24px auto; box-shadow:0 2px 8px rgba(0,0,0,.15); }
      `}</style>
      <div style={{ background: '#fff', borderRadius: '8px', width: '880px', maxWidth: '95vw', height: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
          <span style={{ fontWeight: '600', fontSize: '16px', color: '#1a1a2e' }}>Documents</span>
          <span onClick={onClose} style={{ cursor: 'pointer', fontSize: '20px', color: '#666', lineHeight: 1 }}>&#10005;</span>
        </div>

        <div style={{ flex: 1, overflow: 'auto', background: '#e8e8e8', position: 'relative' }}>
          {status === 'loading' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', background: '#e8e8e8', zIndex: 2 }}>
              <div style={{ width: 36, height: 36, border: '3px solid #ddd', borderTop: '3px solid #1565c0', borderRadius: '50%', animation: '_dspin 0.9s linear infinite' }} />
              <span style={{ color: '#555', fontSize: '14px' }}>Your file is being loaded.</span>
            </div>
          )}
          {status === 'error' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', background: '#e8e8e8', zIndex: 2, padding: '20px' }}>
              <div style={{ background: '#fff', borderRadius: '8px', padding: '32px 40px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.12)', maxWidth: '440px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>&#128196;</div>
                <div style={{ fontWeight: '600', fontSize: '15px', color: '#222', marginBottom: '6px' }}>{file.name}</div>
                <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '16px' }}>{sizeMB} MB · {file.name.split('.').pop()?.toUpperCase()}</div>
                <div style={{ fontSize: '13px', color: '#555', lineHeight: '1.6' }}>
                  Sorry, this document cannot be previewed in the browser.<br />
                  Please open it in Microsoft Word to view the contents.
                </div>
              </div>
            </div>
          )}
          {status === 'done' && isPdf && blobUrl && (
            <iframe src={blobUrl} style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} title={file.name} />
          )}
          {!isPdf && (
            <div ref={containerRef} style={{ minHeight: '100%', display: status === 'done' ? 'block' : 'none' }} />
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 20px', borderTop: '1px solid #e5e7eb', flexShrink: 0 }}>
          <button onClick={onClose}
            style={{ padding: '7px 28px', border: '1px solid #1565c0', borderRadius: '4px', background: '#fff', color: '#1565c0', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ──────────────────────────────────── */
function ErrMsg({ msg }: { msg: string }) {
  return (
    <div style={{ color: '#e53935', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ fontSize: '14px' }}>&#9432;</span> {msg}
    </div>
  );
}

const RED: React.CSSProperties    = { color: '#e53935' };
const LBL: React.CSSProperties    = { display: 'block', fontSize: '13px', color: '#555', marginBottom: '5px' };
const SUBLBL: React.CSSProperties = { fontSize: '12px', color: '#888', marginBottom: '4px' };
const ROVAL: React.CSSProperties  = { fontSize: '13px', fontWeight: '500', color: '#333' };
const INP: React.CSSProperties    = { width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' };
const SROW: React.CSSProperties   = { display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px', cursor: 'pointer' };
const DTH: React.CSSProperties    = { padding: '9px 12px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#374151', border: '1px solid #d1d5db', whiteSpace: 'nowrap' };
const DTC: React.CSSProperties    = { padding: '8px 12px', border: '1px solid #e9ecef', fontSize: '13px' };
