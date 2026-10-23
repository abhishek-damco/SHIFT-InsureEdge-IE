import { useState, useRef, useEffect, useMemo } from 'react';
import { renderAsync } from 'docx-preview';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { letterTemplatesApi } from '../api/letterTemplates';

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '-';
  const [y, m, d] = iso.split('-');
  return `${m}-${d}-${y}`;
}

function base64ToFile(base64: string, fileName: string): File {
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mime = ext === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  return new File([arr], fileName, { type: mime });
}

export default function ClaimsLetterTemplateViewPage() {
  const navigate   = useNavigate();
  const { id }     = useParams<{ id: string }>();
  const templateId = Number(id);

  const { data: template, isLoading } = useQuery({
    queryKey: ['letter-template', templateId],
    queryFn: () => letterTemplatesApi.getById(templateId),
    staleTime: 0,
  });

  const doc     = template?.documents[0] ?? null;
  const docFile = useMemo(() => {
    if (!doc?.documentContent || !doc.documentName) return null;
    return base64ToFile(doc.documentContent, doc.documentName);
  }, [doc?.documentContent, doc?.documentName]);

  const isPdf   = docFile?.name.toLowerCase().endsWith('.pdf') ?? false;
  const docContainerRef = useRef<HTMLDivElement>(null);
  const [renderStatus, setRenderStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [blobUrl, setBlobUrl]           = useState('');

  useEffect(() => {
    if (!docFile) { setRenderStatus('idle'); return; }

    if (isPdf) {
      const url = URL.createObjectURL(docFile);
      setBlobUrl(url);
      setRenderStatus('done');
      return () => URL.revokeObjectURL(url);
    }

    setRenderStatus('loading');
    let cancelled = false;

    (async () => {
      await new Promise(r => setTimeout(r, 80));
      if (!docContainerRef.current || cancelled) return;

      const header = await docFile.slice(0, 4).arrayBuffer();
      const b = new Uint8Array(header);
      const isZip = b[0] === 0x50 && b[1] === 0x4B && b[2] === 0x03 && b[3] === 0x04;
      if (!isZip) { if (!cancelled) setRenderStatus('error'); return; }

      try {
        await renderAsync(docFile, docContainerRef.current!, undefined, {
          className: 'docx-pg',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
          renderHeaders: true,
          renderFooters: true,
        });
        if (!cancelled) setRenderStatus('done');
      } catch {
        if (!cancelled) setRenderStatus('error');
      }
    })();

    return () => { cancelled = true; };
  }, [docFile, isPdf]);

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
      <style>{`
        @keyframes _dspin { to { transform: rotate(360deg); } }
        .docx-pg section.docx { background:#fff; margin:24px auto; box-shadow:0 2px 8px rgba(0,0,0,.15); }
      `}</style>

      {/* Header */}
      <div style={{ padding: '20px 24px 0' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '600', color: '#1a1a2e' }}>View Template</h2>
        <div style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>
          <span style={{ color: '#1565c0', cursor: 'pointer' }} onClick={() => navigate('/claims/letter-template')}>Claim Letter Template</span>
          <span> / View Template</span>
        </div>
      </div>

      {/* Two panels */}
      <div style={{ flex: 1, display: 'flex', gap: '16px', padding: '0 24px', overflow: 'hidden' }}>

        {/* Left: Template Identification */}
        <div style={{ flex: '0 0 430px', border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <div style={{ padding: '16px 20px', fontWeight: '600', fontSize: '15px', color: '#1a1a2e', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
            Template Identification
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>

            <div style={{ background: '#e0f2f1', border: '1px solid #b2dfdb', borderRadius: '4px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ color: '#00695c', fontWeight: '500', fontSize: '13px' }}>Template ID - {template.templateCode}</span>
              <span style={{ color: '#00897b', fontSize: '12px' }}>Auto Generated</span>
            </div>

            <Row><FieldView label="Status" value={template.active ? 'Active' : 'Inactive'} /><FieldView label="Version no" value={doc?.version ?? template.currentVersion ?? '-'} /></Row>
            <Row><FieldView label="Template Name" value={template.templateName || '-'} /><FieldView label="Template Category" value={template.templateCategory || '-'} /></Row>
            <Row><FieldView label="Insurance Type" value={template.insuranceType || 'Speciality Lines'} /><FieldView label="Line of Business" value={template.lineOfBusiness || 'E&S Homeowners'} /></Row>
            <Row><FieldView label="State Applicability" value={template.states.length > 0 ? template.states.join(', ') : '-'} /></Row>
            <Row><FieldView label="Subject Line" value={template.subjectLine || '-'} /></Row>
            <Row><FieldView label="Description" value={template.description || '-'} /></Row>
            <div style={{ display: 'flex', gap: '40px', paddingTop: '14px' }}>
              <FieldView label="Effective Date From" value={fmtDate(doc?.effectiveStartDate)} />
              <FieldView label="Effective Date To" value={fmtDate(doc?.effectiveEndDate)} />
            </div>
          </div>
        </div>

        {/* Right: Template Preview — inline rendering */}
        <div style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', fontWeight: '600', fontSize: '15px', color: '#1a1a2e', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
            Template Preview
          </div>

          {/* Preview area */}
          <div style={{ flex: 1, background: '#e8e8e8', position: 'relative', overflow: 'auto' }}>

            {/* No doc at all */}
            {!doc && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '15px', fontWeight: '500' }}>
                No document attached.
              </div>
            )}

            {/* Doc exists but no stored content */}
            {doc && !docFile && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '20px' }}>
                <div style={{ background: '#fff', borderRadius: '8px', padding: '32px 40px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.12)', maxWidth: '400px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>&#128196;</div>
                  <div style={{ fontWeight: '600', fontSize: '15px', color: '#222', marginBottom: '6px' }}>{doc.documentName ?? 'Document'}</div>
                  <div style={{ fontSize: '13px', color: '#999', lineHeight: '1.6' }}>
                    Document content not available for preview.
                  </div>
                </div>
              </div>
            )}

            {/* Rendering spinner */}
            {docFile && renderStatus === 'loading' && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', background: '#e8e8e8', zIndex: 2 }}>
                <div style={{ width: 36, height: 36, border: '3px solid #ddd', borderTop: '3px solid #1565c0', borderRadius: '50%', animation: '_dspin 0.9s linear infinite' }} />
                <span style={{ color: '#555', fontSize: '14px' }}>Loading document...</span>
              </div>
            )}

            {/* Render error */}
            {docFile && renderStatus === 'error' && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 2 }}>
                <div style={{ background: '#fff', borderRadius: '8px', padding: '32px 40px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.12)', maxWidth: '440px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>&#128196;</div>
                  <div style={{ fontWeight: '600', fontSize: '15px', color: '#222', marginBottom: '6px' }}>{docFile.name}</div>
                  <div style={{ fontSize: '13px', color: '#555', lineHeight: '1.6' }}>
                    This document cannot be previewed in the browser.<br />
                    Please open it in Microsoft Word to view its contents.
                  </div>
                </div>
              </div>
            )}

            {/* PDF — inline iframe */}
            {docFile && isPdf && renderStatus === 'done' && blobUrl && (
              <iframe
                src={blobUrl}
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                title={docFile.name}
              />
            )}

            {/* DOCX — docx-preview rendered inline */}
            {docFile && !isPdf && (
              <div
                ref={docContainerRef}
                style={{ minHeight: '100%', display: renderStatus === 'done' ? 'block' : 'none' }}
              />
            )}

          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid #e5e7eb', background: '#fff', marginTop: '16px', flexShrink: 0 }}>
        <button onClick={() => navigate('/claims/letter-template')}
          style={{ padding: '7px 28px', border: '1px solid #1565c0', borderRadius: '4px', background: '#fff', color: '#1565c0', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
          Back
        </button>
      </div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '16px', padding: '14px 0', borderBottom: '1px solid #f0f0f0' }}>
      {children}
    </div>
  );
}

function FieldView({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '12px', color: '#888', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '13px', color: '#222', fontWeight: '500' }}>{value}</div>
    </div>
  );
}
