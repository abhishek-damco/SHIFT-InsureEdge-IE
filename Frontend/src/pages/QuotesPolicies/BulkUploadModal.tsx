// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Bulk Upload modal for Quotes & Policies (New Business Quotes) — adapted from
// Frontend/src/pages/DistributionManagement/BulkUploadModal.tsx, reusing the same
// `.bu-*` CSS classes (drag-drop zone + history table), wired to the new
// /bulk-upload endpoints (module=QUOTES_POLICIES) and a submission-focused
// template (InsuredType/Name/EffectiveDate/LOB/SubProduct/Country/State/
// BrokerageFirm/ProducerName), instead of the Intermediary/Producer template.
import React, { useState, useRef, useEffect } from 'react';
import { bulkUploadApi as api } from '../../api/bulkUpload';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface UploadHistoryItem {
  id: string;
  uploadedOn: string;
  fileName: string;
  progress: string;
  totalCount: number;
  processedCount: number;
  status: 'Processing' | 'Completed' | 'Failed' | 'CompletedWithErrors';
  canDownload: boolean;
}

// ── DB → UI mapper ─────────────────────────────────────────────────────────────

function mapHistoryRow(row: any): UploadHistoryItem {
  const totalCount     = Number(row.totalRecords     ?? row.total_records     ?? 0);
  const processedCount = Number(row.processedRecords ?? row.processed_records ?? 0);
  const status: UploadHistoryItem['status'] = row.status ?? 'Processing';
  return {
    id:             String(row.id),
    uploadedOn:     row.createdOn ? formatDate(new Date(row.createdOn)) : (row.created_on ? formatDate(new Date(row.created_on)) : ''),
    fileName:       row.fileName ?? row.file_name ?? '',
    progress:       `${processedCount}/${totalCount} records processed`,
    totalCount,
    processedCount,
    status,
    canDownload:    Boolean(row.hasErrorFile ?? row.has_error_file) || status === 'Failed' || status === 'CompletedWithErrors',
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  const m   = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${m}-${day}-${d.getFullYear()}`;
}

function validateFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    return 'Only Excel (.xlsx) files are supported.';
  }
  if (file.size > 10 * 1024 * 1024) {
    return 'File size must not exceed 10 MB.';
  }
  return null;
}

function statusLabel(status: UploadHistoryItem['status']): string {
  switch (status) {
    case 'Processing':          return 'Processing';
    case 'Completed':           return 'Completed';
    case 'Failed':              return 'Failed';
    case 'CompletedWithErrors': return 'Completed with Errors';
    default:                    return status;
  }
}

function statusSlug(status: string): string {
  return status.toLowerCase().replace(/[\s/]+/g, '-');
}

function progressPct(item: UploadHistoryItem): number {
  if (item.status === 'Completed' || item.status === 'CompletedWithErrors' || item.status === 'Failed') return 100;
  if (item.totalCount > 0) return Math.round((item.processedCount / item.totalCount) * 100);
  return 0;
}

// ── Component ──────────────────────────────────────────────────────────────────

interface BulkUploadModalProps {
  onClose: () => void;
}

export default function BulkUploadModal({ onClose }: BulkUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver,     setDragOver]     = useState(false);
  const [fileError,    setFileError]    = useState<string | null>(null);
  const [processing,   setProcessing]   = useState(false);
  const [toast,        setToast]        = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [history, setHistory] = useState<UploadHistoryItem[]>([]);

  useEffect(() => {
    api.history().then(rows => setHistory(rows.map(mapHistoryRow))).catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function showToastMsg(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5500);
  }

  async function handleProceed() {
    if (!selectedFile || processing) return;
    setProcessing(true);
    try {
      await api.upload(selectedFile);
      const rows = await api.history();
      setHistory(rows.map(mapHistoryRow));
      setSelectedFile(null);
      setFileError(null);
      showToastMsg('File processed. Check the Previously Uploaded Files section for results.');
    } catch (err: any) {
      setFileError(err?.response?.data?.error ?? err?.message ?? 'Upload failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  async function handleDownloadErrorReport(item: UploadHistoryItem) {
    try {
      const blob = await api.errorReport(Number(item.id));
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${item.fileName.replace(/\.xlsx$/i, '')}_Error_Report.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToastMsg('Error report not available. Please try again.');
    }
  }

  function handleFileSelect(file: File) {
    const err = validateFile(file);
    if (err) { setFileError(err); setSelectedFile(null); }
    else      { setFileError(null); setSelectedFile(file); }
  }

  function handleBrowse(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFileSelect(f);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  }

  async function handleDownloadTemplate() {
    try {
      const blob = await api.template();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'E&S Homeowners Insurance Products Upload Template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToastMsg('Unable to download template. Please try again.');
    }
  }

  return (
    <>
      {toast && (
        <div className="bu-toast">
          <span className="bu-toast__icon">✓</span>
          <span className="bu-toast__text">{toast}</span>
          <button type="button" className="bu-toast__close" onClick={() => setToast(null)}>✕</button>
        </div>
      )}

      <div className="bu-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="bu-modal" role="dialog" aria-modal="true" aria-label="Bulk Upload">

          <div className="bu-modal__hdr">
            <span className="bu-modal__title">Bulk Upload</span>
            <button type="button" className="bu-modal__close" onClick={onClose} title="Close">✕</button>
          </div>

          <div className="bu-modal__body">

            <p className="bu-desc">
              To import <strong>Policy</strong> into the system, please download and use the Excel
              template provided below. After filling in the required information, upload the completed file.
              The highlighted columns in the template indicate mandatory fields.
            </p>

            <button type="button" className="bu-tpl-btn" onClick={handleDownloadTemplate}>
              ↓ Download Template
            </button>

            <div className="bu-upload-section">
              <label className="bu-upload-label">Upload File</label>
              <div
                className={`bu-dropzone${dragOver ? ' bu-dropzone--over' : ''}${selectedFile ? ' bu-dropzone--has-file' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={!selectedFile ? () => fileInputRef.current?.click() : undefined}
              >
                {selectedFile ? (
                  <div className="bu-file-info">
                    <span className="bu-file-ico">📄</span>
                    <span className="bu-file-name">{selectedFile.name}</span>
                    <button
                      type="button"
                      className="bu-file-remove"
                      onClick={e => { e.stopPropagation(); setSelectedFile(null); setFileError(null); }}
                      title="Remove file"
                    >✕</button>
                  </div>
                ) : (
                  <>
                    <div className="bu-drop-main">Drag and Drop File Here or Select a File</div>
                    <div className="bu-drop-hint">Supported format is Excel (.xlsx)</div>
                    <div className="bu-drop-hint">File size: 10 KB - 10 MB</div>
                    <button
                      type="button"
                      className="bu-browse-btn"
                      onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    >
                      📂 Browse File
                    </button>
                  </>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  style={{ display: 'none' }}
                  onChange={handleBrowse}
                />
              </div>
              {fileError && <p className="bu-file-error">{fileError}</p>}
            </div>

            <div className="bu-info-box">
              <p>
                Select the file and press the proceed button. It takes approximately 5 seconds to process and validate each record.<br />
                Feel free to X out of this window and come back later to check the status of your import.<br />
                To check the status of your import when you return, select the Bulk Upload button again and view the "Previously Uploaded Files" section within the window.
              </p>
            </div>

            <div className="bu-history">
              <div className="bu-history__hdr">
                <h3 className="bu-history__title">Previously Uploaded Files</h3>
              </div>
              <div className="bu-history-wrap">
                <table className="bu-history-table">
                  <thead>
                    <tr>
                      <th>Uploaded On</th>
                      <th>File Name</th>
                      <th>Progress</th>
                      <th>Status</th>
                      <th>Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="bu-history-empty">No previously uploaded files.</td>
                      </tr>
                    ) : history.map(item => (
                      <React.Fragment key={item.id}>
                        <tr className="bu-history-row">
                          <td className="bu-td-date">{item.uploadedOn}</td>
                          <td className="bu-td-fname">{item.fileName}</td>
                          <td className="bu-td-prog">{item.progress}</td>
                          <td className={`bu-td-status bu-status--${statusSlug(item.status)}`}>
                            {statusLabel(item.status)}
                          </td>
                          <td className="bu-td-dl">
                            {item.canDownload && (
                              <button
                                type="button"
                                className="bu-dl-btn"
                                title="Download error report"
                                onClick={() => handleDownloadErrorReport(item)}
                              >↓</button>
                            )}
                          </td>
                        </tr>
                        {item.status === 'Processing' && (
                          <tr className="bu-progress-row">
                            <td colSpan={5} className="bu-progress-cell">
                              <div className="bu-progress-track">
                                <div className="bu-progress-fill" style={{ width: `${progressPct(item)}%` }} />
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bu-footer-btns">
              <button type="button" className="bu-cancel-btn" onClick={onClose}>Cancel</button>
              <button
                type="button"
                className={`bu-proceed-btn${processing ? ' bu-proceed-btn--loading' : ''}`}
                disabled={!selectedFile || processing}
                onClick={handleProceed}
              >
                {processing ? <span className="bu-spinner" /> : 'Proceed'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
