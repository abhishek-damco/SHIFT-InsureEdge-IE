import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { distributionApi as api } from '../../api/distribution';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface UploadHistoryItem {
  id: string;
  uploadedOn: string;
  fileName: string;
  progress: string;
  totalCount: number;
  processedCount: number;
  status: 'Pending' | 'In-Progress' | 'Completed' | 'Failed due to errors' | 'Partially Successful';
  canDownload: boolean;
}

// ── DB → UI mapper ─────────────────────────────────────────────────────────────

function mapHistoryRow(row: any): UploadHistoryItem {
  const totalCount     = Number(row.total_rows     ?? row.total_records    ?? 0);
  const processedCount = Number(row.processed_rows ?? row.processed_records ?? 0);
  const dbStatus: string = row.status ?? 'Pending';
  const statusMap: Record<string, UploadHistoryItem['status']> = {
    'Pending':              'Pending',
    'In-Progress':          'In-Progress',
    'Completed':            'Completed',
    'Failed':               'Failed due to errors',
    'Failed due to errors': 'Failed due to errors',
    'Partial':              'Partially Successful',
    'Partially Successful': 'Partially Successful',
  };
  const status = (statusMap[dbStatus] ?? 'Pending') as UploadHistoryItem['status'];
  return {
    id:             String(row.id),
    uploadedOn:     row.uploaded_on ? formatDate(new Date(row.uploaded_on)) : '',
    fileName:       row.file_name ?? '',
    progress:       `${processedCount}/${totalCount}`,
    totalCount,
    processedCount,
    status,
    canDownload:    status === 'Failed due to errors' || status === 'Partially Successful',
  };
}

// ── Template Generator ─────────────────────────────────────────────────────────

const US_STATES: [string, string][] = [
  ['Alabama','AL'],['Alaska','AK'],['Arizona','AZ'],['Arkansas','AR'],
  ['California','CA'],['Colorado','CO'],['Connecticut','CT'],['Delaware','DE'],
  ['Florida','FL'],['Georgia','GA'],['Hawaii','HI'],['Idaho','ID'],
  ['Illinois','IL'],['Indiana','IN'],['Iowa','IA'],['Kansas','KS'],
  ['Kentucky','KY'],['Louisiana','LA'],['Maine','ME'],['Maryland','MD'],
  ['Massachusetts','MA'],['Michigan','MI'],['Minnesota','MN'],['Mississippi','MS'],
  ['Missouri','MO'],['Montana','MT'],['Nebraska','NE'],['Nevada','NV'],
  ['New Hampshire','NH'],['New Jersey','NJ'],['New Mexico','NM'],['New York','NY'],
  ['North Carolina','NC'],['North Dakota','ND'],['Ohio','OH'],['Oklahoma','OK'],
  ['Oregon','OR'],['Pennsylvania','PA'],['Rhode Island','RI'],['South Carolina','SC'],
  ['South Dakota','SD'],['Tennessee','TN'],['Texas','TX'],['Utah','UT'],
  ['Vermont','VT'],['Virginia','VA'],['Washington','WA'],['West Virginia','WV'],
  ['Wisconsin','WI'],['Wyoming','WY'],
];

function generateTemplate(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Add Intermediary ──────────────────────────────────────────────
  const intCols = [
    '#','Name','DBA','Legal Entity','Federal Tax ID',
    'Intermediary Type','Status','Country','Resident State','License Number',
    'Address Line 1','Address Line 2','City','County','State','Zip Code',
    'Primary Contact First Name','Primary Contact Last Name',
    'Primary Contact Title','Primary Contact Phone','Primary Contact Email',
  ];
  const intMandatory = new Set([
    'Name','Legal Entity','Federal Tax ID','Intermediary Type','Country','Resident State',
    'Address Line 1','City','State','Zip Code',
    'Primary Contact First Name','Primary Contact Last Name','Primary Contact Email',
  ]);
  const intConditional = new Set(['License Number']);
  const intDescMap: Record<string,string> = {
    'Name':'Legal name of the intermediary.',
    'DBA':'Doing Business As name (if applicable).',
    'Legal Entity':'Legal entity type (e.g., Corporation, LLC).',
    'Federal Tax ID':'Federal Tax ID — 9-digit EIN, no dashes.',
    'Intermediary Type':'Select: Brokerage.',
    'Status':'Select: Active, Inactive, or Draft.',
    'Country':'Select: United States.',
    'Resident State':'Select the resident state.',
    'License Number':'Broker license number (if applicable).',
    'Address Line 1':'Street address line 1.',
    'Address Line 2':'Street address line 2 (optional).',
    'City':'City name.',
    'County':'County name (optional).',
    'State':'Select the state.',
    'Zip Code':'ZIP code (5 digits).',
    'Primary Contact First Name':'Primary contact first name.',
    'Primary Contact Last Name':'Primary contact last name.',
    'Primary Contact Title':'Job title of primary contact (optional).',
    'Primary Contact Phone':'Phone number in XXX XXX-XXXX format.',
    'Primary Contact Email':'Email address.',
  };
  const intSheet: unknown[][] = [
    ['', ...intCols.slice(1).map(c => intMandatory.has(c) ? 'Mandatory' : intConditional.has(c) ? 'Conditional' : 'Optional')],
    ['', ...intCols.slice(1).map(c => intDescMap[c] ?? '')],
    ['', 'Intermediary Information', '', '', '', '', '', '', '', '', 'Home Office / Legal Address', '', '', '', '', '', 'Primary Contact', '', '', '', ''],
    intCols,
    [1, ...Array(intCols.length - 1).fill('')],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(intSheet), 'Add Intermediary');

  // ── Sheet 2: Add Producers ─────────────────────────────────────────────────
  const prodCols = [
    '#','First Name','Middle Initial/Name','Last Name','Suffix','Country',
    'Resident State','P&C Licensing Requirement','PL License','CL License',
    'P&C Combined License','Is a Manager','Reports To',
    'Telephone Number (XXX XXX-XXXX)','Extension','Alternative Telephone',
    'Email ID','Same as Intermediary Location',
    'Address Line 1','Address Line 2','City','County','State','Zip Code',
  ];
  const prodMandatory = new Set([
    'First Name','Last Name','Country','Resident State','P&C Licensing Requirement',
    'Is a Manager','Telephone Number (XXX XXX-XXXX)','Email ID','Same as Intermediary Location',
  ]);
  const prodConditional = new Set([
    'PL License','CL License','P&C Combined License','Reports To',
    'Address Line 1','City','State','Zip Code',
  ]);
  const prodDescMap: Record<string,string> = {
    'First Name':'Producer first name.',
    'Middle Initial/Name':'Middle initial or full middle name (optional).',
    'Last Name':'Producer last name.',
    'Suffix':'Suffix (e.g., Jr., Sr.) — optional.',
    'Country':'Select: United States.',
    'Resident State':'Select the resident state.',
    'P&C Licensing Requirement':'Select: Combined or Separate.',
    'PL License':'Personal Lines license # (required if P&C = Separate).',
    'CL License':'Commercial Lines license # (required if P&C = Separate).',
    'P&C Combined License':'Combined P&C license # (required if P&C = Combined).',
    'Is a Manager':'Select: YES or NO.',
    'Reports To':'Name of direct supervisor (if not top-level manager).',
    'Telephone Number (XXX XXX-XXXX)':'Phone in XXX XXX-XXXX format.',
    'Extension':'Phone extension (optional).',
    'Alternative Telephone':'Alternative phone number (optional).',
    'Email ID':'Email address.',
    'Same as Intermediary Location':'Select YES if producer address matches intermediary. If YES, address fields are not required.',
    'Address Line 1':'Street address (required if Same as Intermediary Location = NO).',
    'Address Line 2':'Address line 2 (optional).',
    'City':'City (required if Same as Intermediary Location = NO).',
    'County':'County (optional).',
    'State':'State (required if Same as Intermediary Location = NO).',
    'Zip Code':'ZIP code (required if Same as Intermediary Location = NO).',
  };
  const prodSheet: unknown[][] = [
    ['', ...prodCols.slice(1).map(c => prodMandatory.has(c) ? 'Mandatory' : prodConditional.has(c) ? 'Conditional' : 'Optional')],
    ['', ...prodCols.slice(1).map(c => prodDescMap[c] ?? '')],
    ['', 'Producer Information', '', '', '', '', '', '', '', '', '', '', '', 'Producer Contact Details', '', '', '', '', 'Producer Address', '', '', '', '', ''],
    prodCols,
    ...Array.from({ length: 20 }, (_, i) => [i + 1, ...Array(prodCols.length - 1).fill('')]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(prodSheet), 'Add Producers');

  // ── Sheet 3: Intermediary Rights ──────────────────────────────────────────
  const rightsModules: [string, string][] = [
    ['Dashboard','Dashboard'],
    ['Individual','Individual'],['Individual','Claims'],
    ['Business','Business'],['Business','Claims'],
    ['Distribution Management','Intermediary'],['Distribution Management','Producer'],
    ['Reports','Reports'],['Analytics','Analytics'],
    ['Settings','Settings'],['Users','Users'],['Groups','Groups'],
  ];
  const rightsSheet: unknown[][] = [
    ['DO NOT REVISE THIS SHEET'],
    [],
    ['Sub-Module','Tab','Read Only','All Access','View','Add','Edit','Clone','Upload','Download','Sensitive Data','Sensitive Documents','Approve/Reject'],
    ...rightsModules.map(([sub, tab]) => [sub, tab, 'NO','NO','NO','NO','NO','NO','NO','NO','NO','NO','NO']),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rightsSheet), 'Intermediary Rights');

  // ── Sheet 4: Instructions ──────────────────────────────────────────────────
  const instrSheet: unknown[][] = [
    ['FILE GUIDELINES'],
    [],
    ['1. The order of the tabs must remain as they are when the template is downloaded.'],
    ['2. Do not delete any columns in any of the tabs.'],
    ['3. Columns with yellow highlighting indicate fields with Data Validations (dropdown lists).'],
    ['4. Do not delete the "Data" tab.'],
    [],
    ['GENERAL FORMAT GUIDELINES'],
    [],
    ['Mandatory   — Bold red font. These fields MUST be populated.'],
    ['Conditional — Bold purple font. Required under specific conditions (see column instructions).'],
    ['Optional    — Bold black font. Not required.'],
    [],
    ['TAB-SPECIFIC GUIDELINES'],
    [],
    ['Add Intermediary:'],
    ['  - Only one row of data can be entered (row 5).'],
    ['  - Enter a license number for any state in which the intermediary holds a license.'],
    [],
    ['Add Producers:'],
    ['  - The sheet has rows for 20 producers. Add more rows as needed.'],
    ['  - Phone number must follow XXX XXX-XXXX format.'],
    ['  - If "Same as Intermediary Location" = YES, address fields are not required.'],
    ['  - P&C Licensing: select "Separate" to enter PL/CL numbers individually,'],
    ['    or "Combined" to enter a single combined license number.'],
    [],
    ['Intermediary Rights:'],
    ['  - DO NOT REVISE — automatically populated when template is downloaded.'],
    [],
    ['Data:'],
    ['  - DO NOT REVISE — reference data used by the application for validation.'],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(instrSheet), 'Instructions');

  // ── Sheet 5: Data ──────────────────────────────────────────────────────────
  const dataSheet: unknown[][] = [
    ['DO NOT REVISE THIS SHEET'],
    [],
    ['#','Type of Intermediary','Country','State','State Code','P&C Licensing Requirement','YES / NO'],
    ...US_STATES.map(([state, code], i) => [i + 1, 'Brokerage', 'United States', state, code, '']),
    [],
    ['P&C Licensing Options:', '', 'YES/NO Options:'],
    ['Separate', '', 'YES'],
    ['Combined', '', 'NO'],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dataSheet), 'Data');

  return wb;
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
  if (file.size < 10 * 1024) {
    return 'File size must be at least 10 KB.';
  }
  if (file.size > 10 * 1024 * 1024) {
    return 'File size must not exceed 10 MB.';
  }
  return null;
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

  // Load history from API on mount; fall back to localStorage if API is offline
  useEffect(() => {
    api.bulkUpload.history()
      .then(rows => setHistory(rows.map(mapHistoryRow)))
      .catch(() => {
        try {
          const saved = localStorage.getItem('shift_bulk_history');
          if (saved) setHistory(JSON.parse(saved) as UploadHistoryItem[]);
        } catch { /* ignore */ }
      });
  }, []);

  // Poll every 4 seconds while any item is still In-Progress or Pending
  useEffect(() => {
    const hasActive = history.some(h => h.status === 'In-Progress' || h.status === 'Pending');
    if (!hasActive) return;
    const timer = setInterval(() => {
      api.bulkUpload.history()
        .then(rows => setHistory(rows.map(mapHistoryRow)))
        .catch(() => {});
    }, 4000);
    return () => clearInterval(timer);
  }, [history]);

  // Cleanup timers on unmount
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
      await api.bulkUpload.upload(selectedFile);
      // Reload history so the new pending row appears
      const rows = await api.bulkUpload.history();
      setHistory(rows.map(mapHistoryRow));
      setSelectedFile(null);
      setFileError(null);
      showToastMsg(
        'The file is being processed in the background. You can check the progress in the Previously Uploaded Files section.'
      );
    } catch (err: any) {
      setFileError(err?.message ?? 'Upload failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  async function handleDownloadErrorReport(item: UploadHistoryItem) {
    try {
      const blob = await api.bulkUpload.errorReport(Number(item.id));
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${item.fileName.replace(/\.xlsx$/i, '')}_Error_Report.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToastMsg('Error report not available. Please try again.');
    }
  }

  function handleClearHistory() {
    setHistory([]);
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

  function handleDownloadTemplate() {
    XLSX.writeFile(generateTemplate(), 'Add_Intermediary_Bulk_Upload_Template.xlsx');
  }

  function progressPct(item: UploadHistoryItem): number {
    if (item.status === 'Completed') return 100;
    if (item.totalCount > 0) return Math.round((item.processedCount / item.totalCount) * 100);
    return 0;
  }

  function statusSlug(status: string): string {
    return status.toLowerCase().replace(/[\s/]+/g, '-');
  }

  return (
    <>
      {/* Full-screen green toast (above overlay) */}
      {toast && (
        <div className="bu-toast">
          <span className="bu-toast__icon">✓</span>
          <span className="bu-toast__text">{toast}</span>
          <button type="button" className="bu-toast__close" onClick={() => setToast(null)}>✕</button>
        </div>
      )}

      <div className="bu-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="bu-modal" role="dialog" aria-modal="true" aria-label="Bulk Upload">

          {/* Header */}
          <div className="bu-modal__hdr">
            <span className="bu-modal__title">Bulk Upload</span>
            <button type="button" className="bu-modal__close" onClick={onClose} title="Close">✕</button>
          </div>

          {/* Body */}
          <div className="bu-modal__body">

            <p className="bu-desc">
              To import <strong>Intermediary</strong> into the system, please download and use the Excel
              template provided below. After filling in the required information, upload the completed file.
              The highlighted columns in the template indicate mandatory fields.
            </p>

            <button type="button" className="bu-tpl-btn" onClick={handleDownloadTemplate}>
              ↓ Download Template
            </button>

            {/* Upload File */}
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

            {/* Action buttons */}
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

            {/* Info text */}
            <div className="bu-info-box">
              <p>
                Select the file and press the proceed button. It takes approximately 5 seconds to process
                and validate each record. Feel free to X out of this window and come back later to check
                the status of your import. To check the status of your import when you return, select the
                Bulk Upload button again and view the 'Previously Uploaded Files' section within the window.
              </p>
            </div>

            {/* Previously Uploaded Files */}
            <div className="bu-history">
              <div className="bu-history__hdr">
                <h3 className="bu-history__title">Previously Uploaded Files</h3>
                {history.length > 0 && (
                  <button type="button" className="bu-clear-btn" onClick={handleClearHistory}>
                    Clear All
                  </button>
                )}
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
                          <td>
                            <span className={`bu-status-badge bu-status--${statusSlug(item.status)}`}>
                              {item.status}
                            </span>
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
                        <tr className="bu-progress-row">
                          <td colSpan={5} className="bu-progress-cell">
                            <div className="bu-progress-track">
                              <div className="bu-progress-fill" style={{ width: `${progressPct(item)}%` }} />
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
