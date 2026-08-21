import { type CSSProperties, type MouseEvent as ReactMouseEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import PaginationBar from '../components/PaginationBar';
import { claimsApi } from '../api/claims';
import { payeeApi } from '../api/payee';
import { insuredPolicyApi } from '../api/insuredPolicy';
import type { InsuredPolicyViewDto } from '../api/insuredPolicy';
import { taskApi } from '../api/task';
import type { TaskListItemDto, TaskTypeCountDto, TaskAssigneeDto, TaskTimelineDto, CreateOrUpdateTaskRequest } from '../api/task';
import type { PayeeListItemDto, CreatePayeeRequest as PayeeCreateReq } from '../api/payee';
import { claimLetterApi } from '../api/claimLetter';
import type { ClaimLetterListItemDto, ClaimLetterDetailDto, SaveClaimLetterRequest } from '../api/claimLetter';
import { authApi } from '../api/auth';
import type { ClaimDetailDto, ClaimDocumentDto, TempClaimReportDto, TempClaimPartyDto, TempClaimWitnessDto, UpsertTempClaimReportRequest, UpsertTempClaimPartyRequest, UpsertTempClaimWitnessRequest, CoverageOptionDto, AssignableUserDto, LossExposureDto, CreateLossExposureRequest, LossExposureFormData, LossExposureDamage } from '../types/Claim';

type WorkflowKey = 'review' | 'summary' | 'loss' | 'documents' | 'worksheet' | 'payee' | 'policy' | 'escalation' | 'recovery' | 'referred' | 'litigation' | 'task' | 'timeline' | 'letters';

type ClaimAssignee = {
  initials: string;
  name: string;
  userId: string;
  paymentLimit: string;
  reserveLimit: string;
};

type ClaimDocument = {
  id: number;
  name: string;
  uploadedOn: string;
  notifyTo: string;
  comment: string;
  dataUrl?: string;
  mimeType?: string;
};


const claimAssignees: ClaimAssignee[] = [
  { initials: 'HC', name: 'Hudson Client Admin Admin', userId: 'IE0001', paymentLimit: '$0', reserveLimit: '$0' },
  { initials: 'MD', name: 'Mani Da ClaimsAdj', userId: 'IE0003', paymentLimit: '$0', reserveLimit: '$0' },
];

const emptyText = (value: unknown) => String(value ?? '').trim() || '-';
const nullableText = (value: string) => value.trim() ? value.trim() : null;
const initialsFrom = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || '-';

function mapDocumentDto(claimId: number, doc: ClaimDocumentDto): ClaimDocument {
  return {
    id: doc.id,
    name: doc.fileName,
    uploadedOn: doc.createdOn,
    notifyTo: doc.notifyToName ?? '-',
    comment: doc.comment ?? '-',
    dataUrl: claimsApi.getDocumentFileUrl(claimId, doc.id),
    mimeType: doc.contentType ?? undefined,
  };
}

function assigneeFromName(name: string | null | undefined): ClaimAssignee | null {
  if (!name || name === '-') return null;
  return claimAssignees.find(user => user.name === name) ?? { initials: initialsFrom(name), name, userId: '-', paymentLimit: '$0', reserveLimit: '$0' };
}

const workflowItems: { key: WorkflowKey; label: string }[] = [
  { key: 'summary', label: 'Claims Summary' },
  { key: 'loss', label: 'Loss Information' },
  { key: 'review', label: 'Claims Review' },
  { key: 'documents', label: 'Documents' },
  { key: 'worksheet', label: 'Financials - Worksheet' },
  { key: 'payee', label: 'Financials - Claims Payee' },
  { key: 'policy', label: 'Insured & Policy' },
  { key: 'escalation', label: 'Claims Escalation' },
  { key: 'recovery', label: 'Recovery' },
  { key: 'referred', label: 'Claim Referred' },
  { key: 'litigation', label: 'Under Litigation' },
  { key: 'task', label: 'Task' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'letters', label: 'Claim Letters' },
];

const titleByKey: Record<WorkflowKey, string> = {
  review: 'Claims Review',
  summary: 'Claims Summary',
  loss: 'Loss Information',
  documents: 'Claim Document',
  worksheet: 'Financials - Worksheet',
  payee: 'Financials - Claims Payee',
  policy: 'Insured & Policy',
  escalation: 'Claims Escalation',
  recovery: 'Recovery',
  referred: 'Claim Referred',
  litigation: 'Under Litigation',
  task: 'Task',
  timeline: 'Timeline',
  letters: 'Claim Letters',
};


const reinsuranceInfo = [
  { label: 'Treaty ID', value: '-' },
  { label: 'Type of Reinsurance', value: '-' },
  { label: 'Ceded Percentage (%)', value: '-' },
];

function CollapseIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h11M4 12h11M4 18h11" /><path d="m20 8-4 4 4 4" /></svg>;
}

function FilterIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16l-6 7v5l-4 2v-7L4 5z" /></svg>;
}

function MenuIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 6h10M8 12h10M8 18h10" /><path d="M5 6h.01M5 12h.01M5 18h.01" /></svg>;
}

function HeaderIcon({ type }: { type: 'policy' | 'claim' | 'date' | 'home' | 'user' }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (type === 'policy') return <svg {...common}><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v5h5" /><circle cx="17" cy="17" r="4" /></svg>;
  if (type === 'claim') return <svg {...common}><path d="M7 3v18" /><path d="M17 3v18" /><path d="M7 8h10M7 16h10" /><path d="M13 6c-2 0-3 1-3 2.5s1 2.5 3 2.5 3 1 3 2.5-1 2.5-3 2.5" /></svg>;
  if (type === 'date') return <svg {...common}><path d="M4 5h16v16H4z" /><path d="M8 3v4M16 3v4M4 10h16" /></svg>;
  if (type === 'home') return <svg {...common}><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /></svg>;
  return <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" /></svg>;
}

function SearchIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
}

function TopButton() {
  return <button onClick={() => document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })} style={{ position: 'fixed', right: 28, bottom: 72, width: 58, height: 58, borderRadius: '50%', background: '#0B5AA0', color: '#fff', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(11,90,160,0.28)', zIndex: 40, fontSize: 11, fontWeight: 700 }}><svg width="24" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 15 7-7 7 7" /><path d="m5 21 7-7 7 7" /></svg>Top</button>;
}

function WorkflowMenu({ claimData, routeClaimId, active }: { claimData: ClaimDetailDto | null; routeClaimId: number; active: WorkflowKey }) {
  const claimLabel = claimData?.claimNumber ?? '—';
  const status = claimData?.status ?? 'Open';
  const isOpen = status.toUpperCase() !== 'CLOSED';
  return <aside style={{ width: 236, flexShrink: 0, background: '#fff', borderRight: '1px solid #e5e7eb', boxShadow: '2px 0 6px rgba(15,23,42,0.06)', padding: '12px 14px', overflowY: 'auto' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}><h2 style={{ fontSize: 16, fontWeight: 800 }}>Claim Workflow Menu</h2><button style={{ background: 'transparent', color: '#111827', padding: 0 }}><CollapseIcon /></button></div><div style={{ background: '#e6fff3', color: '#007244', padding: '13px 12px', borderRadius: 4, fontSize: 14, marginBottom: 12 }}>{claimLabel}</div><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13 }}><strong>Status :</strong><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 22, padding: '0 12px', borderRadius: 999, border: isOpen ? '1px solid #008c55' : '1px solid #9ca3af', background: isOpen ? '#d7f7e4' : '#f3f4f6', color: isOpen ? '#006b3c' : '#374151', fontSize: 12, fontWeight: 700 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: isOpen ? '#008c55' : '#9ca3af' }} />{status}</span></div><nav style={{ display: 'grid', gap: 5 }}>{workflowItems.map(item => <Link key={item.key} to={`/claims/workflow/${routeClaimId}?screen=${item.key}`} style={{ minHeight: 34, display: 'flex', alignItems: 'center', padding: '0 14px', borderRadius: 4, background: active === item.key ? '#d5effb' : '#e9eef3', color: active === item.key ? '#0065a8' : '#000', fontSize: 13, fontWeight: active === item.key ? 700 : 500, textDecoration: 'none' }}>{item.label}</Link>)}</nav></aside>;
}

function MetaStrip({ claimData, assigneeName }: { claimData: ClaimDetailDto | null; assigneeName: string | null }) {
  const d = claimData;
  const items = [
    { icon: 'policy' as const, label: 'Policy ID:', value: d?.policyNumber ?? '—' },
    { icon: 'claim' as const, label: 'Claim ID:', value: d?.claimNumber ?? '—' },
    { icon: 'date' as const, label: 'DOL:', value: d?.dateOfLoss ?? '—' },
    { icon: 'home' as const, label: 'LOB:', value: d?.policyDetails?.lob ?? '—' },
    { icon: 'user' as const, label: 'Assignee:', value: assigneeName ?? '—' },
  ];
  return <div style={{ height: 44, background: '#f7f8fb', border: '1px solid #e5e9ef', borderRadius: 4, display: 'grid', gridTemplateColumns: '1.4fr 1.4fr 1fr 1.1fr 1fr', alignItems: 'center', padding: '0 12px', marginBottom: 14 }}>{items.map(item => <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, minWidth: 0 }}><HeaderIcon type={item.icon} /><span>{item.label}</span><strong style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</strong></div>)}</div>;
}

function Card({ title, children, style }: { title: string; children: ReactNode; style?: CSSProperties }) {
  return <section style={{ border: '1px solid #d8e1ea', borderRadius: 6, background: '#fff', padding: '14px 16px', ...style }}><h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>{title}</h2>{children}</section>;
}

function ReadGrid({ items, columns = 4 }: { items: { label: string; value: string }[]; columns?: number }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '18px 16px' }}>{items.map(item => <div key={item.label} style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: 8 }}><div style={{ fontSize: 12, color: '#334155', marginBottom: 5 }}>{item.label}</div><div style={{ fontSize: 14, fontWeight: 500 }}>{item.value}</div></div>)}</div>;
}

function StatusAvatar({ assignee }: { assignee: ClaimAssignee }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 24, height: 24, borderRadius: '50%', background: '#cfedff', color: '#0B5AA0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{assignee.initials}</span>{assignee.name}</span>;
}

function Donut() {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 36, minHeight: 270 }}><div style={{ width: 240, height: 240, borderRadius: '50%', background: 'conic-gradient(#0c8796 0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 152, height: 152, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>0%</div></div><div style={{ display: 'grid', gap: 14, fontSize: 13 }}><div><span style={{ display: 'inline-block', width: 18, height: 18, background: '#0c8796', marginRight: 10, verticalAlign: 'middle' }} />Premium Paid <strong style={{ marginLeft: 24 }}>USD 987.48</strong></div><div><span style={{ display: 'inline-block', width: 18, height: 18, background: '#61b80f', marginRight: 10, verticalAlign: 'middle' }} />Paid Amount Indemnity <strong style={{ marginLeft: 24 }}>USD 0.00</strong></div><div><span style={{ display: 'inline-block', width: 18, height: 18, background: '#4b65f1', marginRight: 10, verticalAlign: 'middle' }} />Paid Amount Expense <strong style={{ marginLeft: 24 }}>USD 0.00</strong></div></div></div>;
}

function daysOpen(createdOn: string): string {
  const created = new Date(createdOn);
  if (isNaN(created.getTime())) return '-';
  const diff = Math.floor((Date.now() - created.getTime()) / 86400000);
  return String(diff);
}

function buildLossAddress(d: ClaimDetailDto | null): string {
  return [d?.lossAddressLine1, d?.lossAddressLine2, d?.lossCity, d?.lossCounty, d?.lossState, d?.lossCountry, d?.lossZipCode]
    .filter(Boolean).join(', ') || '-';
}

function SummaryContent({ claimData }: { claimData: ClaimDetailDto | null }) {
  const d = claimData;
  const reporterName = [d?.reporterFirstName, d?.reporterLastName].filter(Boolean).join(' ') || '-';
  const liveInfo = [
    { label: 'Claim ID', value: d?.claimNumber ?? '-' },
    { label: 'DOL', value: d?.dateOfLoss ?? '-' },
    { label: 'Policy ID', value: d?.policyNumber ?? '-' },
    { label: 'Insured Name', value: d?.policyDetails?.insuredName ?? '-' },
    { label: 'Line of Business (LOB)', value: d?.policyDetails?.lob ?? '-' },
    { label: 'Sub-Product', value: d?.policyDetails?.subProduct ?? '-' },
    { label: 'Claim Type', value: d?.claimType ?? '-' },
    { label: 'Loss Location', value: buildLossAddress(d) },
    { label: 'Status', value: d?.status ?? '-' },
    { label: 'Claim Flag', value: '-' },
    { label: 'Claim Created Date', value: d?.createdOn ?? '-' },
    { label: 'Claim Closure Date', value: '-' },
    { label: 'No. of Days Open', value: d?.createdOn ? daysOpen(d.createdOn) : '-' },
    { label: 'Cause of Loss', value: d?.mainCauseOfLoss ?? '-' },
    { label: 'Loss Consequences', value: d?.consequencesOfLoss ?? '-' },
  ];
  const coverages = d?.coverages ?? [];
  return <><Card title="Claim Reporter" style={{ marginBottom: 16 }}><ReadGrid items={[{ label: 'Claim Reported By', value: reporterName }, { label: 'Relationship With Insured', value: d?.reporterRelationship ?? '-' }, { label: 'Claim Reported Date', value: d?.createdOn ?? '-' }]} /></Card><Card title="Claim Information" style={{ marginBottom: 16 }}><ReadGrid items={liveInfo} /></Card><Card title="Policy Coverages" style={{ marginBottom: 16 }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr><th style={{ background: '#e6f0f6', padding: 12, textAlign: 'left', border: '1px solid #d7dee6' }}>Coverage Name</th><th style={{ background: '#e6f0f6', padding: 12, textAlign: 'left', border: '1px solid #d7dee6' }}>Cause of Loss</th></tr></thead><tbody>{coverages.length === 0 ? <tr><td colSpan={2} style={{ padding: 18, textAlign: 'center', fontWeight: 700 }}>No Data Available</td></tr> : coverages.map(cov => <tr key={cov.id}><td style={{ padding: 10, border: '1px solid #d7dee6' }}>{cov.coverageName ?? '-'}</td><td style={{ padding: 10, border: '1px solid #d7dee6' }}>{cov.causeOfLossName ?? '-'}</td></tr>)}</tbody></table></Card><Card title="Loss Exposures" style={{ minHeight: 430, marginBottom: 16 }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr><th style={{ width: 80, padding: 12 }}><MenuIcon /></th>{['Action', 'Claimant Name', 'Loss Party', 'Loss Exposure Type', 'Loss Estimate'].map(label => <th key={label} style={{ padding: 12, textAlign: 'left' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{label}{label !== 'Action' && <FilterIcon />}</span></th>)}</tr></thead></table><div style={{ minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800 }}>No Data Available</div></Card><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}><Card title="Loss Ratio"><Donut /></Card><Card title="Claim Amount"><div style={{ minHeight: 270, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800 }}>No Data Available</div></Card></div><Card title="Settlement & Payee Details" style={{ marginBottom: 16 }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr>{['Payee Name', 'Payee Type', 'Payment Method', 'Gross Settlement Amount ($)', 'Deductible Amount ($)', 'Net Settled Amount ($)'].map(h => <th key={h} style={{ background: '#e6f0f6', padding: 12, border: '1px solid #d7dee6', textAlign: 'left' }}>{h}</th>)}</tr></thead></table><div style={{ padding: 22, textAlign: 'center', fontSize: 21, fontWeight: 800 }}>No Data Available</div></Card><Card title="Deductions & Recoveries" style={{ marginBottom: 16 }}><ReadGrid items={[{ label: 'Salvage Value', value: '-' }, { label: 'Subrogation Recovery', value: '-' }, { label: 'Lein-holder Payment Amount', value: '-' }, { label: 'Other Adjustments', value: '-' }]} /></Card><Card title="Approvals & Audits" style={{ marginBottom: 16 }}><ReadGrid items={[{ label: 'Decision', value: 'Approved' }, { label: 'Decision By', value: '-' }, { label: 'Decision Date', value: '-' }, { label: 'Approval Remarks', value: '-' }]} /></Card><Card title="Claim Letters"><div style={{ minHeight: 58, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, fontWeight: 800 }}>No Data Available</div></Card></>;
}

function ReviewContent({ claimData, assignee, onOpenAssignment }: { claimData: ClaimDetailDto | null; assignee: ClaimAssignee | null; onOpenAssignment: () => void }) {
  const d = claimData;
  const claimantName = d?.claimants?.[0]
    ? [d.claimants[0].firstName, d.claimants[0].lastName].filter(Boolean).join(' ')
    : '-';
  const lossAddress = buildLossAddress(d);
  const liveClaimInfo = [
    { label: 'Policy ID', value: d?.policyNumber ?? '-' },
    { label: 'Date of Loss', value: d?.dateOfLoss ?? '-' },
    { label: 'Coverage Level', value: d?.policyDetails?.subProduct ?? '-' },
    { label: 'Claim Type', value: d?.claimType ?? '-' },
    { label: 'Loss Location', value: lossAddress },
    { label: 'Claim Submitted Date', value: d?.createdOn ?? '-' },
    { label: 'Insured Name', value: d?.policyDetails?.insuredName ?? '-' },
    { label: 'Claimant Name', value: claimantName },
    { label: 'LOB', value: d?.policyDetails?.lob ?? '-' },
    { label: 'Product Name', value: d?.policyDetails?.subProduct ?? '-' },
    { label: 'Policy Status', value: d?.policyDetails?.status ?? '-' },
    { label: 'Producer Name', value: '-' },
    { label: 'Producer ID', value: '-' },
  ];
  const inspectionRequired = d?.inspectionRequired ?? false;
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.95fr', border: '1px solid #d8e1ea', borderRadius: 4, minHeight: 635 }}><section style={{ padding: '16px 16px 20px' }}><h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 18 }}>Claim Information</h2><ReadGrid items={liveClaimInfo} columns={2} /><h2 style={{ fontSize: 18, fontWeight: 800, margin: '18px 0' }}>Reinsurance</h2><ReadGrid items={reinsuranceInfo} columns={2} /></section><section style={{ borderLeft: '1px solid #d8e1ea' }}><div style={{ padding: '16px 16px 20px', borderBottom: '1px solid #d8e1ea' }}><h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 18 }}>Claim Assignment</h2><label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}><span style={{ color: '#c62828' }}>* </span>Assigned To</label><button onClick={onOpenAssignment} style={{ width: 366, height: 34, border: '1px solid #b6c0cc', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', color: assignee ? '#111827' : '#6b7280', background: '#f7f9fc', cursor: 'pointer' }}>{assignee ? <StatusAvatar assignee={assignee} /> : <span>-Select-</span>}<SearchIcon /></button></div><div style={{ padding: '16px 16px 20px' }}><h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 18 }}>Adjuster Assignment</h2><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}><span style={{ color: '#c62828' }}>* </span>Inspection Required</div><div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 14 }}><label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 18, height: 18, borderRadius: '50%', border: inspectionRequired ? '1px solid #0B5AA0' : '1px solid #cbd5e1', boxShadow: inspectionRequired ? 'inset 0 0 0 4px #fff' : 'none', background: inspectionRequired ? '#0B5AA0' : 'transparent', display: 'inline-block' }} />Yes</label><label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 18, height: 18, borderRadius: '50%', border: !inspectionRequired ? '1px solid #0B5AA0' : '1px solid #cbd5e1', boxShadow: !inspectionRequired ? 'inset 0 0 0 4px #fff' : 'none', background: !inspectionRequired ? '#0B5AA0' : 'transparent', display: 'inline-block' }} />No</label></div></div></section></div>;
}

type AssignmentSortKey = 'name' | 'userId' | 'paymentLimit' | 'reserveLimit';

function SortArrowIcon({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#0B5AA0' : '#475569'} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M8 7h8" /><path d="M10 12h6" /><path d="M12 17h4" /><path d={active && direction === 'desc' ? 'm5 15 3 3 3-3' : 'm5 9 3-3 3 3'} /><path d="M8 6v12" /></svg>;
}

function AssignmentModal({ selected, onCancel, onAssign }: { selected: ClaimAssignee | null; onCancel: () => void; onAssign: (assignee: ClaimAssignee) => void }) {
  const [choice, setChoice] = useState<ClaimAssignee | null>(selected ?? claimAssignees[0]);
  const [sortKey, setSortKey] = useState<AssignmentSortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const columns: { label: string; key?: AssignmentSortKey }[] = [
    { label: 'Select' },
    { label: 'User Name', key: 'name' },
    { label: 'User ID', key: 'userId' },
    { label: 'Payment Approval Limit', key: 'paymentLimit' },
    { label: 'Reserve Approval Limit', key: 'reserveLimit' },
  ];
  const sortedAssignees = useMemo(() => [...claimAssignees].sort((left, right) => {
    const leftValue = left[sortKey].toLowerCase();
    const rightValue = right[sortKey].toLowerCase();
    return sortDir === 'asc' ? leftValue.localeCompare(rightValue) : rightValue.localeCompare(leftValue);
  }), [sortDir, sortKey]);
  const toggleSort = (key: AssignmentSortKey) => {
    if (sortKey === key) {
      setSortDir(current => current === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortKey(key);
    setSortDir('asc');
  };

  return <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.42)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}><div style={{ width: 966, background: '#fff', borderRadius: 6, boxShadow: '0 12px 34px rgba(15,23,42,0.24)', overflow: 'hidden' }}><div style={{ height: 56, padding: '0 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Claim Assignment</h2><button onClick={onCancel} aria-label="Close" style={{ background: 'transparent', border: 'none', color: '#111827', padding: 4, cursor: 'pointer' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg></button></div><div style={{ padding: '16px 16px 0' }}><div style={{ height: 34, border: '1px solid #b9c2cf', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', color: '#6b7280', marginBottom: 10 }}><SearchIcon /><span>Search by Keyword</span></div><div style={{ fontSize: 14, fontWeight: 700, marginBottom: 24 }}>Search Result</div><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr>{columns.map(column => <th key={column.label} style={{ padding: '12px 10px', textAlign: 'left', fontWeight: 700, color: '#334155' }}>{column.key ? <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%' }}><span>{column.label}</span><button onClick={() => toggleSort(column.key!)} title={`Sort by ${column.label}`} aria-label={`Sort by ${column.label}`} style={{ background: 'transparent', border: 'none', padding: 0, display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}><SortArrowIcon active={sortKey === column.key} direction={sortDir} /></button></span> : column.label}</th>)}</tr></thead><tbody>{sortedAssignees.map(assignee => <tr key={assignee.userId} style={{ borderBottom: '1px solid #e5e7eb' }}><td style={{ padding: '12px 10px', textAlign: 'center' }}><input type="radio" name="claim-assignee" checked={choice?.userId === assignee.userId} onChange={() => setChoice(assignee)} style={{ width: 20, height: 20, accentColor: '#0B5AA0', cursor: 'pointer' }} /></td><td style={{ padding: '12px 10px' }}>{assignee.name}</td><td style={{ padding: '12px 10px' }}>{assignee.userId}</td><td style={{ padding: '12px 10px' }}>{assignee.paymentLimit}</td><td style={{ padding: '12px 10px' }}>{assignee.reserveLimit}</td></tr>)}</tbody></table></div><div style={{ height: 50, borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, padding: '0 16px', marginTop: 30 }}><button onClick={onCancel} style={{ height: 34, minWidth: 132, border: '1px solid #d1d5db', background: '#fff', color: '#0B5AA0', borderRadius: 4, fontWeight: 600 }}>Cancel</button><button onClick={() => choice && onAssign(choice)} disabled={!choice} style={{ height: 34, minWidth: 132, border: 'none', background: choice ? '#0B5AA0' : '#cbd5e1', color: '#fff', borderRadius: 4, fontWeight: 700 }}>Assign</button></div></div></div>;
}
const DOCUMENT_CONDITION_OPS = ['Contains', 'Does not contain', 'Equals', 'Starts with', 'Ends with'];

type DocumentColumn = 'name' | 'uploadedOn' | 'notifyTo' | 'comment';
type DocumentColDef = { key: DocumentColumn; label: string; width: number; sortable: boolean };
type DocumentValueFilters = Partial<Record<DocumentColumn, string[]>>;
type DocumentCondFilters = Partial<Record<DocumentColumn, { op: string; value: string }>>;

const DOCUMENT_COLS: DocumentColDef[] = [
  { key: 'name', label: 'Document Name', width: 260, sortable: true },
  { key: 'uploadedOn', label: 'Uploaded On', width: 150, sortable: true },
  { key: 'notifyTo', label: 'Notify To', width: 220, sortable: true },
  { key: 'comment', label: 'Comment', width: 220, sortable: true },
];

function documentCell(doc: ClaimDocument, key: DocumentColumn) {
  const value = doc[key];
  return value == null || value === '' ? '-' : String(value);
}

function useWorkflowOutsideClick(ref: { current: HTMLElement | null }, cb: () => void) {
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) cb();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, cb]);
}

function DocumentColumnFilterPopup({ col, allRows, valueFilter, condFilter, onApplyValue, onApplyCondition, onClear, onClose, anchorRect }: {
  col: DocumentColDef;
  allRows: ClaimDocument[];
  valueFilter: string[];
  condFilter: { op: string; value: string } | undefined;
  onApplyValue: (vals: string[]) => void;
  onApplyCondition: (filter: { op: string; value: string } | undefined) => void;
  onClear: () => void;
  onClose: () => void;
  anchorRect: DOMRect;
}) {
  const [tab, setTab] = useState<'condition' | 'value'>('condition');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>(valueFilter);
  const [condOp, setCondOp] = useState(condFilter?.op ?? 'Contains');
  const [condVal, setCondVal] = useState(condFilter?.value ?? '');
  const ref = useRef<HTMLDivElement>(null);
  useWorkflowOutsideClick(ref, onClose);

  const uniqueVals = Array.from(new Set(allRows.map(row => documentCell(row, col.key)).filter(value => value !== '-'))).sort();
  const visibleVals = uniqueVals.filter(value => value.toLowerCase().includes(search.toLowerCase()));
  const allChecked = visibleVals.length > 0 && visibleVals.every(value => selected.includes(value));
  const toggleValue = (value: string) => setSelected(prev => prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]);
  const toggleAll = () => setSelected(allChecked ? selected.filter(item => !visibleVals.includes(item)) : [...new Set([...selected, ...visibleVals])]);

  return <div ref={ref} style={{ position: 'fixed', top: anchorRect.bottom + 4, left: anchorRect.left, zIndex: 9999, background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.14)', minWidth: 280, maxWidth: 340 }} onClick={event => event.stopPropagation()}><div style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6', fontWeight: 600, fontSize: 13, color: '#111827' }}>{col.label}</div><div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>{(['condition', 'value'] as const).map(item => <button key={item} onClick={() => setTab(item)} style={{ flex: 1, padding: '9px 0', border: 'none', background: 'none', fontSize: 13, fontWeight: tab === item ? 600 : 400, color: tab === item ? '#0B5AA0' : '#6b7280', borderBottom: tab === item ? '2px solid #0B5AA0' : '2px solid transparent', cursor: 'pointer' }}>{item === 'condition' ? 'Filter by Condition' : 'Filter by Value'}</button>)}</div>{tab === 'value' ? <><div style={{ padding: '10px 14px 6px' }}><input autoFocus placeholder='Search' value={search} onChange={event => setSearch(event.target.value)} style={{ fontSize: 13, padding: '7px 10px', width: '100%' }} /></div><div style={{ maxHeight: 200, overflowY: 'auto', padding: '4px 0' }}><label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: allChecked ? '#eff6ff' : 'transparent' }}><input type='checkbox' checked={allChecked} onChange={toggleAll} style={{ width: 15, height: 15, accentColor: '#0B5AA0' }} />Select All</label>{visibleVals.map(value => <label key={value} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, background: selected.includes(value) ? '#eff6ff' : 'transparent' }}><input type='checkbox' checked={selected.includes(value)} onChange={() => toggleValue(value)} style={{ width: 15, height: 15, accentColor: '#0B5AA0' }} />{value}</label>)}{visibleVals.length === 0 && <div style={{ padding: '12px 14px', color: '#9ca3af', fontSize: 13 }}>No values found</div>}</div><div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderTop: '1px solid #f3f4f6' }}><button className='btn-primary' style={{ flex: 1, padding: '8px 0', fontSize: 13 }} onClick={() => { onApplyValue(selected); onClose(); }}>Apply</button><button className='btn-secondary' style={{ padding: '8px 14px', fontSize: 13 }} onClick={onClose}>Cancel</button><button className='btn-secondary' style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => { setSelected([]); onClear(); onClose(); }}>Clear</button></div></> : <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}><select value={condOp} onChange={event => setCondOp(event.target.value)} style={{ fontSize: 13, width: '100%' }}>{DOCUMENT_CONDITION_OPS.map(op => <option key={op}>{op}</option>)}</select><input autoFocus placeholder='Value...' value={condVal} onChange={event => setCondVal(event.target.value)} style={{ fontSize: 13, width: '100%' }} /><div style={{ display: 'flex', gap: 8 }}><button className='btn-primary' style={{ flex: 1, fontSize: 13, padding: '8px 0' }} onClick={() => { onApplyCondition(condVal ? { op: condOp, value: condVal } : undefined); onClose(); }}>Apply</button><button className='btn-secondary' style={{ fontSize: 13, padding: '8px 14px' }} onClick={() => { setCondVal(''); onApplyCondition(undefined); onClose(); }}>Clear</button></div></div>}</div>;
}

function DocumentModifyColumnsPanel({ visibleCols, onToggle, onClose, anchorRect }: { visibleCols: Set<DocumentColumn>; onToggle: (key: DocumentColumn) => void; onClose: () => void; anchorRect: DOMRect }) {
  const ref = useRef<HTMLDivElement>(null);
  useWorkflowOutsideClick(ref, onClose);
  return <div ref={ref} style={{ position: 'fixed', top: anchorRect.bottom + 4, left: anchorRect.left, zIndex: 9999, background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.14)', width: 290 }}><div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: 700, fontSize: 14, color: '#111827' }}>Modify Columns Display</div><div style={{ padding: '8px 0', maxHeight: 420, overflowY: 'auto' }}>{DOCUMENT_COLS.map(col => { const checked = visibleCols.has(col.key); return <label key={col.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', cursor: 'pointer', background: checked ? '#eff6ff' : 'transparent' }}><input type='checkbox' checked={checked} onChange={() => onToggle(col.key)} style={{ width: 15, height: 15, accentColor: '#0B5AA0' }} /><span style={{ fontSize: 13, color: '#374151' }}>{col.label}</span></label>; })}</div></div>;
}

function DocumentsContent({ documents, onAdd, onDelete }: { documents: ClaimDocument[]; onAdd: () => void; onDelete: (id: number) => void }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortCol, setSortCol] = useState<DocumentColumn>('uploadedOn');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [visibleCols, setVisibleCols] = useState<Set<DocumentColumn>>(new Set(DOCUMENT_COLS.map(col => col.key)));
  const [showModifyCols, setShowModifyCols] = useState(false);
  const [modifyColsRect, setModifyColsRect] = useState<DOMRect | null>(null);
  const [openFilterCol, setOpenFilterCol] = useState<DocumentColumn | null>(null);
  const [filterAnchorRects, setFilterAnchorRects] = useState<Partial<Record<DocumentColumn, DOMRect>>>({});
  const [valueFilters, setValueFilters] = useState<DocumentValueFilters>({});
  const [condFilters, setCondFilters] = useState<DocumentCondFilters>({});
  const [previewDoc, setPreviewDoc] = useState<ClaimDocument | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<ClaimDocument | null>(null);

  const renderedCols = DOCUMENT_COLS.filter(col => visibleCols.has(col.key));
  const filtered = useMemo(() => documents.filter(doc => {
    const keyword = search.trim().toLowerCase();
    const values = DOCUMENT_COLS.map(col => documentCell(doc, col.key));
    if (keyword && !values.some(value => value.toLowerCase().includes(keyword))) return false;
    for (const col of DOCUMENT_COLS) {
      const cell = documentCell(doc, col.key).toLowerCase();
      const valueFilter = valueFilters[col.key];
      const conditionFilter = condFilters[col.key];
      if (valueFilter?.length && !valueFilter.some(value => value.toLowerCase() === cell)) return false;
      if (conditionFilter?.value) {
        const target = conditionFilter.value.toLowerCase();
        if (conditionFilter.op === 'Contains' && !cell.includes(target)) return false;
        if (conditionFilter.op === 'Does not contain' && cell.includes(target)) return false;
        if (conditionFilter.op === 'Equals' && cell !== target) return false;
        if (conditionFilter.op === 'Starts with' && !cell.startsWith(target)) return false;
        if (conditionFilter.op === 'Ends with' && !cell.endsWith(target)) return false;
      }
    }
    return true;
  }), [documents, search, valueFilters, condFilters]);
  const sorted = useMemo(() => [...filtered].sort((left, right) => {
    const comparison = documentCell(left, sortCol).localeCompare(documentCell(right, sortCol), undefined, { numeric: true });
    return sortDir === 'asc' ? comparison : -comparison;
  }), [filtered, sortCol, sortDir]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hasFilter = (key: DocumentColumn) => (valueFilters[key]?.length ?? 0) > 0 || !!condFilters[key]?.value;
  const toggleColumn = (key: DocumentColumn) => setVisibleCols(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });
  const handleSort = (key: DocumentColumn) => { if (sortCol === key) setSortDir(dir => dir === 'asc' ? 'desc' : 'asc'); else { setSortCol(key); setSortDir('asc'); } setPage(1); };
  const toggleSelect = (id: number) => setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  const toggleAll = () => setSelectedIds(prev => pageItems.every(doc => prev.includes(doc.id)) ? prev.filter(id => !pageItems.some(doc => doc.id === id)) : [...new Set([...prev, ...pageItems.map(doc => doc.id)])]);
  const SortIcon = ({ field }: { field: DocumentColumn }) => <button title='Sort' aria-label='Sort' style={{ background: 'transparent', border: 'none', padding: 0, display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}><SortArrowIcon active={sortCol === field} direction={sortDir} /></button>;

  useEffect(() => {
    if (page !== currentPage) setPage(currentPage);
  }, [currentPage, page]);

  return <div><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid #d8e1ea', borderBottom: '1px solid #e5e7eb' }}><label style={{ width: 326, height: 38, border: '1px solid #b6c0cc', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', color: '#6b7280', background: '#f7f9fc', fontSize: 13 }}><SearchIcon /><input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder='Search by Keyword' style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 13 }} /></label><button onClick={onAdd} style={{ height: 39, minWidth: 144, border: 'none', background: '#0B5AA0', color: '#fff', borderRadius: 4, fontSize: 13, fontWeight: 700 }}>+ Add Document</button></div><div style={{ position: 'relative', overflowX: 'auto', overflowY: 'visible' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr style={{ background: '#fff' }}><th style={{ width: 42, padding: '10px 10px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}><button onClick={event => { setModifyColsRect((event.currentTarget as HTMLElement).getBoundingClientRect()); setShowModifyCols(open => !open); }} title='Modify Columns' style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#6b7280', width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, borderRadius: 4 }}><MenuIcon /></button>{showModifyCols && modifyColsRect && <DocumentModifyColumnsPanel visibleCols={visibleCols} onToggle={toggleColumn} onClose={() => setShowModifyCols(false)} anchorRect={modifyColsRect} />}</th><th style={{ width: 38, padding: '10px 8px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb', textAlign: 'center' }}><input type='checkbox' checked={pageItems.length > 0 && pageItems.every(doc => selectedIds.includes(doc.id))} onChange={toggleAll} style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#0B5AA0' }} /></th><th style={{ width: 96, padding: '10px 12px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb', fontWeight: 600, fontSize: 12, color: '#374151' }}>Action</th>{renderedCols.map(col => <th key={col.key} style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb', fontWeight: 600, fontSize: 12, color: '#374151', whiteSpace: 'nowrap', width: col.width, cursor: col.sortable ? 'pointer' : 'default', userSelect: 'none' }} onClick={() => col.sortable && handleSort(col.key)}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>{col.label}{col.sortable && <SortIcon field={col.key} />}<span onClick={event => { event.stopPropagation(); const rect = (event.currentTarget as HTMLElement).getBoundingClientRect(); setFilterAnchorRects(prev => ({ ...prev, [col.key]: rect })); setOpenFilterCol(openFilterCol === col.key ? null : col.key); }} style={{ marginLeft: 4, cursor: 'pointer', color: hasFilter(col.key) ? '#0B5AA0' : '#9ca3af', display: 'inline-flex', alignItems: 'center' }} title='Filter'><FilterIcon /></span></span>{openFilterCol === col.key && filterAnchorRects[col.key] && <DocumentColumnFilterPopup col={col} allRows={documents} valueFilter={valueFilters[col.key] ?? []} condFilter={condFilters[col.key]} onApplyValue={values => { setValueFilters(prev => ({ ...prev, [col.key]: values })); setPage(1); }} onApplyCondition={filter => { setCondFilters(prev => ({ ...prev, [col.key]: filter })); setPage(1); }} onClear={() => { setValueFilters(prev => { const next = { ...prev }; delete next[col.key]; return next; }); setCondFilters(prev => { const next = { ...prev }; delete next[col.key]; return next; }); setPage(1); }} onClose={() => setOpenFilterCol(null)} anchorRect={filterAnchorRects[col.key]!} />}</th>)}</tr></thead><tbody>{pageItems.length === 0 ? <tr><td colSpan={3 + renderedCols.length} style={{ height: 430, textAlign: 'center', fontSize: 22, fontWeight: 800 }}>No Data Available</td></tr> : pageItems.map((doc, index) => <tr key={doc.id} style={{ borderBottom: '1px solid #f3f4f6', background: selectedIds.includes(doc.id) ? '#eff6ff' : index % 2 === 1 ? '#fafafa' : '#fff' }}><td style={{ padding: '10px 10px', textAlign: 'center', color: '#9ca3af', fontSize: 12, borderRight: '1px solid #f3f4f6' }}>{(currentPage - 1) * pageSize + index + 1}</td><td style={{ padding: '10px 8px', textAlign: 'center', borderRight: '1px solid #f3f4f6' }}><input type='checkbox' checked={selectedIds.includes(doc.id)} onChange={() => toggleSelect(doc.id)} style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#0B5AA0' }} /></td><td style={{ padding: '10px 12px', width: 96, textAlign: 'center', borderRight: '1px solid #f3f4f6' }}><button onClick={() => setPreviewDoc(doc)} title='View' style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: '#111827' }}><svg width='17' height='17' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' /><circle cx='12' cy='12' r='3' /></svg></button><button onClick={() => setDeleteDoc(doc)} title='Delete' style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', marginLeft: 10, color: '#111827' }}><svg width='17' height='17' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M3 6h18' /><path d='M8 6V4h8v2' /><path d='M19 6l-1 14H6L5 6' /></svg></button></td>{renderedCols.map(col => <td key={col.key} style={{ padding: '10px 12px', borderRight: '1px solid #f3f4f6' }}>{documentCell(doc, col.key)}</td>)}</tr>)}</tbody></table><PaginationBar page={currentPage} pageSize={pageSize} total={sorted.length} onPageChange={setPage} onPageSizeChange={next => { setPageSize(next); setPage(1); }} /></div>{previewDoc && <DocumentPreviewModal document={previewDoc} onClose={() => setPreviewDoc(null)} />}{deleteDoc && <DeleteDocumentModal document={deleteDoc} onCancel={() => setDeleteDoc(null)} onDelete={() => { onDelete(deleteDoc.id); setDeleteDoc(null); }} />}</div>;
}
type ClaimDocumentPreviewKind = 'image' | 'frame' | 'video' | 'html' | 'excel' | 'unsupported';
type ClaimExcelSheetPreview = { name: string; html: string; truncated: boolean; activeCell: string; activeValue: string };

function escapePreviewHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character] ?? character);
}

function DocumentPreviewModal({ document, onClose }: { document: ClaimDocument; onClose: () => void }) {
  const [kind, setKind] = useState<ClaimDocumentPreviewKind>('unsupported');
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [excelSheets, setExcelSheets] = useState<ClaimExcelSheetPreview[]>([]);
  const [selectedSheet, setSelectedSheet] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';
    async function preparePreview() {
      setLoading(true);
      setError('');
      setPreviewUrl('');
      setPreviewHtml('');
      setExcelSheets([]);
      setSelectedSheet(0);
      if (!document.dataUrl) throw new Error('The document file is unavailable.');
      const response = await fetch(document.dataUrl, { credentials: 'include' });
      if (!response.ok) throw new Error(`Unable to load the document (HTTP ${response.status}).`);
      const blob = await response.blob();
      const extension = document.name.split('.').pop()?.toLowerCase() ?? '';
      const contentType = (document.mimeType || blob.type || '').toLowerCase();

      if (['xlsx', 'xls'].includes(extension) || contentType.includes('spreadsheet') || contentType.includes('excel')) {
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(await blob.arrayBuffer(), { type: 'array', cellStyles: true, cellDates: true });
        const sheets = workbook.SheetNames.flatMap((sheetName, sheetIndex): ClaimExcelSheetPreview[] => {
          if (workbook.Workbook?.Sheets?.[sheetIndex]?.Hidden) return [];
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) return [];
          let lastPopulatedRow = 0;
          let lastPopulatedColumn = 0;
          for (const reference of Object.keys(worksheet)) {
            if (reference.startsWith('!')) continue;
            const value = worksheet[reference]?.v;
            if (value == null || String(value).trim() === '') continue;
            const cell = XLSX.utils.decode_cell(reference);
            if (cell.r > lastPopulatedRow) lastPopulatedRow = cell.r;
            if (cell.c > lastPopulatedColumn) lastPopulatedColumn = cell.c;
          }
          const populatedColumnCount = lastPopulatedColumn + 1;
          const populatedRowCount = lastPopulatedRow + 1;
          const previewColumnCount = Math.min(populatedColumnCount, 200);
          const previewRowCount = Math.min(populatedRowCount, 500, Math.max(1, Math.floor(20_000 / previewColumnCount)));
          const previewRange = { s: { r: 0, c: 0 }, e: { r: previewRowCount - 1, c: previewColumnCount - 1 } };
          const isTruncated = previewRange.e.r < lastPopulatedRow || previewRange.e.c < lastPopulatedColumn;
          const mergeStarts = new Map<string, { rowSpan: number; columnSpan: number }>();
          const mergedCells = new Set<string>();
          for (const merge of worksheet['!merges'] ?? []) {
            if (merge.s.r > previewRange.e.r || merge.s.c > previewRange.e.c) continue;
            const endRow = Math.min(merge.e.r, previewRange.e.r);
            const endColumn = Math.min(merge.e.c, previewRange.e.c);
            const startAddress = XLSX.utils.encode_cell(merge.s);
            mergeStarts.set(startAddress, { rowSpan: endRow - merge.s.r + 1, columnSpan: endColumn - merge.s.c + 1 });
            for (let row = merge.s.r; row <= endRow; row += 1) for (let column = merge.s.c; column <= endColumn; column += 1) {
              const address = XLSX.utils.encode_cell({ r: row, c: column });
              if (address !== startAddress) mergedCells.add(address);
            }
          }
          const activeCell = sheetName === 'Import Data' && worksheet.C4 ? 'C4' : Object.keys(worksheet).find(reference => !reference.startsWith('!') && worksheet[reference]?.v != null) ?? 'A1';
          const activeValue = String(worksheet[activeCell]?.w ?? worksheet[activeCell]?.v ?? '');
          const columns = Array.from({ length: previewColumnCount }, (_, column) => {
            const width = Math.min(220, Math.max(72, Number(worksheet['!cols']?.[column]?.wpx ?? 105)));
            return `<col style="width:${width}px;min-width:${width}px">`;
          }).join('');
          const columnHeaders = Array.from({ length: previewColumnCount }, (_, column) => {
            const name = XLSX.utils.encode_col(column);
            const selected = activeCell.replace(/\d+/g, '') === name ? ' selected-column' : '';
            return `<th class="column-header${selected}">${name}</th>`;
          }).join('');
          const rows = Array.from({ length: previewRowCount }, (_, row) => {
            const height = Math.max(22, Number(worksheet['!rows']?.[row]?.hpx ?? 22));
            const selectedRow = Number(activeCell.replace(/\D+/g, '')) === row + 1 ? ' selected-row' : '';
            const cells = Array.from({ length: previewColumnCount }, (_, column) => {
              const address = XLSX.utils.encode_cell({ r: row, c: column });
              if (mergedCells.has(address)) return '';
              const cell = worksheet[address];
              const merge = mergeStarts.get(address);
              const value = escapePreviewHtml(String(cell?.w ?? cell?.v ?? '')).replace(/\r?\n/g, '<br>');
              const rgb = cell?.s?.fgColor?.rgb;
              const background = rgb ? `#${String(rgb).slice(-6)}` : '#fff';
              const isConditional = row === 0 && /^conditional$/i.test(String(cell?.v ?? ''));
              const isAlert = /are you 65 or older/i.test(String(cell?.v ?? ''));
              const selected = address === activeCell ? ' active-cell' : '';
              const headerCell = row <= 2 ? ' workbook-header-cell' : '';
              const color = isConditional ? '#7030a0' : isAlert ? '#ff0000' : '#000';
              return `<td class="sheet-cell${selected}${headerCell}"${merge ? ` rowspan="${merge.rowSpan}" colspan="${merge.columnSpan}"` : ''} style="background:${background};color:${color}">${value}</td>`;
            }).join('');
            return `<tr style="height:${height}px"><th class="row-header${selectedRow}">${row + 1}</th>${cells}</tr>`;
          }).join('');
          const html = `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}html,body{margin:0;height:100%;font-family:Calibri,Arial,sans-serif;color:#000;background:#fff}body{overflow:auto}table{border-collapse:separate;border-spacing:0;table-layout:fixed;font-size:12px;background:#fff}col.row-numbers{width:32px;min-width:32px}.corner,.column-header,.row-header{position:sticky;background:#f3f4f6;color:#475569;font-weight:400;text-align:center;border-right:1px solid #d1d5db;border-bottom:1px solid #d1d5db;z-index:3}.corner{top:0;left:0;z-index:5;width:32px;min-width:32px}.column-header{top:0;height:24px}.row-header{left:0;width:32px;min-width:32px}.selected-column,.selected-row{background:#d1fae5;color:#166534}.sheet-cell{border-right:1px solid #d1d5db;border-bottom:1px solid #d1d5db;padding:3px 5px;vertical-align:middle;overflow:hidden;white-space:nowrap}.workbook-header-cell{border-right:2px solid #111;border-bottom:2px solid #111;font-weight:600;white-space:normal;line-height:1.15}.active-cell{outline:2px solid #16803a;outline-offset:-2px;position:relative;z-index:2}</style></head><body><table><colgroup><col class="row-numbers">${columns}</colgroup><thead><tr><th class="corner"></th>${columnHeaders}</tr></thead><tbody>${rows}</tbody></table></body></html>`;
          return [{ name: sheetName, truncated: isTruncated, html, activeCell, activeValue }];
        });
        if (!cancelled) {
          setExcelSheets(sheets);
          setKind(sheets.length ? 'excel' : 'unsupported');
        }
        return;
      }
      if (extension === 'docx' || contentType.includes('wordprocessingml')) {
        const mammoth = await import('mammoth');
        const converted = await mammoth.convertToHtml({ arrayBuffer: await blob.arrayBuffer() });
        if (!cancelled) {
          setKind('html');
          setPreviewHtml(`<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;line-height:1.5;margin:28px;color:#111827}img{max-width:100%}table{border-collapse:collapse}td,th{border:1px solid #cbd5e1;padding:6px}</style></head><body>${converted.value}</body></html>`);
        }
        return;
      }
      if (contentType.startsWith('text/') || ['txt', 'csv'].includes(extension)) {
        const textContent = await blob.text();
        if (!cancelled) {
          setKind('html');
          setPreviewHtml(`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:20px}pre{white-space:pre-wrap;font:13px/1.5 Consolas,monospace;color:#111827}</style></head><body><pre>${escapePreviewHtml(textContent)}</pre></body></html>`);
        }
        return;
      }
      if (contentType === 'application/pdf' || extension === 'pdf' || contentType.startsWith('image/') || /^(png|jpe?g|gif|webp|svg)$/.test(extension) || contentType.startsWith('video/')) {
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) {
          setPreviewUrl(objectUrl);
          setKind(contentType.startsWith('image/') || /^(png|jpe?g|gif|webp|svg)$/.test(extension) ? 'image' : contentType.startsWith('video/') ? 'video' : 'frame');
        }
        return;
      }
      if (!cancelled) setKind('unsupported');
    }
    preparePreview().catch(reason => { if (!cancelled) setError(reason instanceof Error ? reason.message : 'Unable to preview this document.'); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [document]);

  const preview = loading ? <div role='status'>Loading document preview...</div>
    : error ? <div role='alert' style={{ color: '#b42318', textAlign: 'center' }}>{error}</div>
      : kind === 'image' ? <img src={previewUrl} alt={document.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        : kind === 'video' ? <video src={previewUrl} controls style={{ maxWidth: '100%', maxHeight: '100%' }} />
          : kind === 'frame' ? <iframe src={previewUrl} title={document.name} style={{ width: '100%', height: '100%', border: 0, background: '#fff' }} />
            : kind === 'html' ? <iframe srcDoc={previewHtml} sandbox='' title={document.name} style={{ width: '100%', height: '100%', border: 0, background: '#fff' }} />
              : kind === 'excel' ? <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, background: '#343a40', paddingBottom: 18 }}><div style={{ height: 32, flexShrink: 0, padding: '3px 6px', display: 'grid', gridTemplateColumns: '94px 64px 1fr', gap: 4, alignItems: 'center', background: '#f3f4f6', border: '1px solid #d1d5db', borderBottom: 0 }}><div style={{ height: 24, border: '1px solid #cbd5e1', background: '#fff', color: '#64748b', padding: '4px 7px', fontSize: 11 }}>{excelSheets[selectedSheet]?.activeCell ?? 'A1'}</div><div aria-hidden='true' style={{ display: 'flex', justifyContent: 'space-around', color: '#94a3b8', fontSize: 14 }}><span>×</span><span>✓</span><span>ƒₓ</span></div><div style={{ height: 24, border: '1px solid #cbd5e1', background: '#fff', color: '#111827', padding: '4px 7px', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{excelSheets[selectedSheet]?.activeValue ?? ''}</div></div><div style={{ flex: 1, minHeight: 0, border: '1px solid #cbd5e1', background: '#fff' }}><iframe key={excelSheets[selectedSheet]?.name} srcDoc={excelSheets[selectedSheet]?.html ?? ''} sandbox='' title={`${document.name} - ${excelSheets[selectedSheet]?.name ?? 'Sheet'}`} style={{ width: '100%', height: '100%', border: 0, background: '#fff' }} /></div>{excelSheets[selectedSheet]?.truncated && <div style={{ padding: '5px 10px', color: '#475569', background: '#f8fafc', fontSize: 10, borderLeft: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1' }}>This large sheet is limited in the preview for performance. Download to view every cell.</div>}<div role='tablist' aria-label='Workbook sheets' style={{ display: 'flex', alignItems: 'stretch', overflowX: 'auto', minHeight: 32, border: '1px solid #cbd5e1', background: '#f3f4f6' }}><span aria-hidden='true' style={{ padding: '7px 10px', color: '#64748b', borderRight: '1px solid #d1d5db' }}>‹　›　☰</span>{excelSheets.map((sheet, index) => <button key={sheet.name} type='button' role='tab' aria-selected={selectedSheet === index} onClick={() => setSelectedSheet(index)} style={{ minWidth: 86, padding: '6px 12px', border: 0, borderRight: '1px solid #d1d5db', borderBottom: selectedSheet === index ? '3px solid #217346' : '3px solid transparent', background: selectedSheet === index ? '#fff' : '#f3f4f6', color: '#111827', fontSize: 11, fontWeight: selectedSheet === index ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>{sheet.name}</button>)}</div></div>
                : <div style={{ textAlign: 'center' }}><strong style={{ display: 'block', marginBottom: 8 }}>{document.name}</strong><span>Preview is not supported for this file type. Download remains available.</span></div>;

  return <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.32)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}><div role='dialog' aria-modal='true' aria-labelledby='claim-document-preview-title' style={{ width: '90vw', maxWidth: 900, height: '88vh', maxHeight: 610, background: '#fff', borderRadius: 6, boxShadow: '0 12px 30px rgba(15,23,42,0.28)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={event => event.stopPropagation()}><div style={{ height: 46, padding: '0 12px', borderBottom: '1px solid #d8dee6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}><h2 id='claim-document-preview-title' title={document.name} style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Documents</h2><button type='button' onClick={onClose} aria-label='Close document preview' style={{ background: 'transparent', border: 'none', color: '#111827', padding: 4, cursor: 'pointer' }}><svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8'><path d='M18 6 6 18M6 6l12 12' /></svg></button></div><div style={{ flex: 1, minHeight: 0, padding: kind === 'excel' ? '14px 48px 16px' : 16, background: kind === 'image' || kind === 'video' ? '#2f2f2f' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{preview}</div><div style={{ height: 56, borderTop: '1px solid #d8dee6', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 12px', flexShrink: 0 }}><button type='button' onClick={onClose} style={{ height: 28, minWidth: 108, border: '1px solid #d1d5db', background: '#fff', color: '#0B5AA0', borderRadius: 3, fontSize: 11, fontWeight: 600 }}>Cancel</button></div></div></div>;
}

function DeleteDocumentModal({ document, onCancel, onDelete }: { document: ClaimDocument; onCancel: () => void; onDelete: () => void }) {
  return <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.42)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}><div style={{ width: 314, background: '#fff', borderRadius: 6, boxShadow: '0 12px 34px rgba(15,23,42,0.24)', overflow: 'hidden', textAlign: 'center' }}><div style={{ padding: '16px 16px 12px' }}><div style={{ width: 74, height: 74, borderRadius: '50%', background: '#ffe1e8', color: '#e43f58', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}><svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /></svg></div><h2 style={{ fontSize: 16, margin: '0 0 10px', fontWeight: 800 }}>Are you sure you want to delete this?</h2><p style={{ margin: 0, color: '#5f6470', fontSize: 13, lineHeight: 1.45 }}>This action cannot be undone. Please confirm if you want to proceed.</p><div style={{ marginTop: 8, color: '#111827', fontSize: 12, fontWeight: 700 }}>{document.name}</div></div><div style={{ borderTop: '1px solid #e5e7eb', padding: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}><button onClick={onCancel} style={{ height: 34, border: '1px solid #d1d5db', background: '#fff', color: '#0B5AA0', borderRadius: 4, fontWeight: 700 }}>No, Keep It</button><button onClick={onDelete} style={{ height: 34, border: 'none', background: '#df4159', color: '#fff', borderRadius: 4, fontWeight: 700 }}>Yes, Delete</button></div></div></div>;
}

function AddDocumentModal({ onCancel, onSave }: { onCancel: () => void; onSave: (document: ClaimDocument) => void }) {
  const [notify, setNotify] = useState(false);
  const [notifyTo, setNotifyTo] = useState('');
  const [comment, setComment] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileDataUrl, setFileDataUrl] = useState<string | undefined>();
  const [mimeType, setMimeType] = useState<string | undefined>();
  const canSave = Boolean(fileName) && (!notify || notifyTo.trim().length > 0);
  const handleFileChange = (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => setFileDataUrl(typeof reader.result === 'string' ? reader.result : undefined);
    reader.readAsDataURL(file);
  };
  return <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.42)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}><div style={{ width: 638, background: '#fff', borderRadius: 6, boxShadow: '0 12px 34px rgba(15,23,42,0.24)', overflow: 'hidden' }}><div style={{ height: 56, padding: '0 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Add Document</h2><button onClick={onCancel} aria-label="Close" style={{ background: 'transparent', border: 'none', color: '#111827', padding: 4, cursor: 'pointer' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg></button></div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 16 }}><div style={{ border: '1px dashed #d1d5db', background: '#f7f9fc', minHeight: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 10 }}><strong>Drag and Drop File Here or Select a File</strong><span style={{ color: '#64748b', fontSize: 12, lineHeight: 1.5 }}>Supported formats are PDF, DOC, DOCS, XLS,<br />XLSX, PNG, JPG, JPEG<br />File size : 10 KB-10 MB</span><label style={{ height: 34, minWidth: 168, border: '1px solid #0B5AA0', borderRadius: 4, color: '#0B5AA0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}><input type="file" style={{ display: 'none' }} onChange={event => handleFileChange(event.target.files?.[0])} />Browse File</label>{fileName && <span style={{ color: '#0B5AA0', fontSize: 12 }}>{fileName}</span>}</div><div style={{ borderLeft: '1px solid #d8e1ea', paddingLeft: 16 }}><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}><span style={{ color: '#c62828' }}>* </span>Notify users about document upload?</div><div style={{ display: 'flex', gap: 18, marginBottom: 18 }}><label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><input type="radio" checked={notify} onChange={() => setNotify(true)} />Yes</label><label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><input type="radio" checked={!notify} onChange={() => setNotify(false)} />No</label></div>{notify && <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 14 }}><span style={{ color: '#c62828' }}>* </span>Notify To<select value={notifyTo} onChange={event => setNotifyTo(event.target.value)} style={{ width: '100%', height: 34, marginTop: 8, border: '1px solid #aeb8c5', borderRadius: 3, padding: '0 10px' }}><option value="">Select...</option><option>Hudson Client Admin Admin</option><option>Manideep Da Underwriter</option><option>Mani Da ClaimsAdj</option></select></label>}<label style={{ display: 'block', fontSize: 13 }}>Comment<textarea value={comment} onChange={event => setComment(event.target.value)} style={{ width: '100%', height: 66, marginTop: 8, border: '1px solid #aeb8c5', borderRadius: 3, resize: 'none', padding: 8 }} /></label></div></div><div style={{ height: 50, borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, padding: '0 16px' }}><button onClick={onCancel} style={{ height: 34, minWidth: 132, border: '1px solid #d1d5db', background: '#fff', color: '#0B5AA0', borderRadius: 4, fontWeight: 600 }}>Cancel</button><button onClick={() => canSave && onSave({ id: Date.now(), name: fileName, uploadedOn: '06-25-2026', notifyTo: notify ? notifyTo : '-', comment, dataUrl: fileDataUrl, mimeType })} disabled={!canSave} style={{ height: 34, minWidth: 132, border: 'none', background: canSave ? '#0B5AA0' : '#cbd5e1', color: '#fff', borderRadius: 4, fontWeight: 700 }}>Save</button></div></div></div>;
}
type LossTab = 'info' | 'parties' | 'exposure';
type LossAddMode = 'report' | 'party' | 'witness' | null;
type LossViewMode = 'report' | 'party' | 'witness' | null;
type SimpleSortKey = string;


const insuredPartyDetails = [
  { label: 'Customer ID', value: '-' },
  { label: 'First Name', value: 'Mark' },
  { label: 'Middle Name / Initial', value: 'Mid' },
  { label: 'Last Name', value: 'Last' },
  { label: 'Address Line 1', value: '10111 Morgan Lane' },
  { label: 'Address Line 2', value: 'Suite # 205' },
  { label: 'Country', value: 'United States' },
  { label: 'State', value: 'California' },
  { label: 'City', value: 'Plainsboro' },
  { label: 'County', value: 'Middlesex County' },
  { label: 'Zip Code', value: '85364' },
  { label: 'Telephone Number', value: '+1 (216) 555-1111' },
  { label: 'Extension', value: '-' },
  { label: 'Alternate Telephone No', value: '-' },
  { label: 'Email ID', value: 'Chandrashekharm1@yopmail.com' },
];

const partyRows = [
  { id: 1, initials: 'BA', name: 'Boeing Aviation Co.', relationship: '-', telephone: '+1 (212) 555-1111', email: 'boeingavi1@test.com', city: '-', state: '-' },
  { id: 2, initials: 'AM', name: 'Anthoney Mac', relationship: 'Spouse', telephone: '+1 (212) 555-1234', email: 'ana@test.com', city: '-', state: '-' },
];

const reportRows = [
  { id: 1, reportType: 'Police Report', reportNumber: 'RPT-2026-0001', filingDate: '06-25-2026', caseStatus: 'Open', contactName: 'Mark Last', telephone: '+1 (216) 555-1111', email: 'Chandrashekharm1@yopmail.com' },
];

const witnessRows = [
  { id: 1, initials: 'ML', name: 'Mark Last', relationship: 'Witness', telephone: '+1 (216) 555-1111', email: 'Chandrashekharm1@yopmail.com', city: 'Plainsboro', state: 'California' },
];
const fieldStyle: CSSProperties = { width: '100%', height: 34, border: '1px solid #aeb8c5', borderRadius: 3, background: '#f7f9fc', padding: '0 10px', fontSize: 13 };
const textareaStyle: CSSProperties = { width: '100%', minHeight: 66, border: '1px solid #aeb8c5', borderRadius: 3, background: '#f7f9fc', padding: 10, fontSize: 13, resize: 'vertical' };

function EditIcon() {
  return <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'><path d='M12 20h9' /><path d='M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z' /></svg>;
}

function EyeIcon() {
  return <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' /><circle cx='12' cy='12' r='3' /></svg>;
}

function TrashIcon() {
  return <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M3 6h18' /><path d='M8 6V4h8v2' /><path d='M19 6l-1 14H6L5 6' /></svg>;
}

function Section({ title, children, onEdit, actions, style }: { title: string; children: ReactNode; onEdit?: () => void; actions?: ReactNode; style?: CSSProperties }) {
  return <section style={{ border: '1px solid #d8e1ea', borderRadius: 6, background: '#fff', padding: '16px 16px 18px', marginBottom: 16, ...style }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}><h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{title}</h2>{actions ?? (onEdit && <button onClick={onEdit} title='Edit' style={{ background: 'transparent', border: 'none', color: '#111827', cursor: 'pointer', padding: 4 }}><EditIcon /></button>)}</div>{children}</section>;
}

function LossTabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} style={{ height: 54, border: 'none', borderBottom: active ? '2px solid #0B5AA0' : '2px solid transparent', background: 'transparent', color: active ? '#0B5AA0' : '#374151', fontWeight: active ? 700 : 500, fontSize: 14, padding: '0 0', marginRight: 22, cursor: 'pointer' }}>{label}</button>;
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <label style={{ display: 'block', fontSize: 13, color: '#111827', fontWeight: 600 }}>{required && <span style={{ color: '#c62828' }}>* </span>}{label}{children}</label>;
}

function InputField({ label, value, required, disabled }: { label: string; value?: string; required?: boolean; disabled?: boolean }) {
  return <FormField label={label} required={required}><input defaultValue={value ?? ''} disabled={disabled} style={{ ...fieldStyle, marginTop: 7, background: disabled ? '#e5e7eb' : '#f7f9fc' }} /></FormField>;
}

function SelectField({ label, value, required, disabled, options = ['Select...', 'Active', 'Settlements or Judgments', 'No fraud deducted'] }: { label: string; value?: string; required?: boolean; disabled?: boolean; options?: string[] }) {
  return <FormField label={label} required={required}><select defaultValue={value ?? options[0]} disabled={disabled} style={{ ...fieldStyle, marginTop: 7, background: disabled ? '#e5e7eb' : '#f7f9fc' }}>{options.map(option => <option key={option}>{option}</option>)}</select></FormField>;
}

function UploadBox({ title = 'Drag and Drop File Here or Select a File', formats = 'Supported formats are PNG, JPEG & GIF.' }: { title?: string; formats?: string }) {
  return <div style={{ border: '1px dashed #d1d5db', background: '#f7f9fc', minHeight: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 10 }}><strong>{title}</strong><span style={{ color: '#64748b', fontSize: 12, lineHeight: 1.5 }}>{formats}<br />File size : 10 KB-10 MB</span><button style={{ height: 34, minWidth: 170, border: '1px solid #0B5AA0', borderRadius: 4, color: '#0B5AA0', background: '#fff', fontWeight: 600 }}>Browse File</button></div>;
}

function LossInformationTab({ claimData }: { claimData: ClaimDetailDto | null }) {
  const [editing, setEditing] = useState(false);
  const d = claimData;
  const liveLossDetails = [
    { label: 'Date of Loss', value: d?.dateOfLoss ?? '-' },
    { label: 'Time of Loss', value: d?.timeOfLoss ?? '-' },
    { label: 'Claim Created Date', value: d?.createdOn ?? '-' },
    { label: 'Claim Type', value: d?.claimType ?? '-' },
    { label: 'Main Cause of Loss', value: d?.mainCauseOfLoss ?? '-' },
    { label: 'Consequences of Loss', value: d?.consequencesOfLoss ?? '-' },
    { label: 'Catastrophic Event', value: d?.catastrophicEvent ?? '-' },
    { label: 'Claim Reimbursement Type', value: d?.claimReimbursementType ?? '-' },
    { label: 'Incident Severity', value: '-' },
    { label: 'Recovery', value: '-' },
  ];
  const coverages = d?.coverages ?? [];
  if (editing) return <><Section title='Loss Information' actions={<div style={{ display: 'flex', gap: 14 }}><button onClick={() => setEditing(false)} style={{ height: 34, minWidth: 84, border: '1px solid #d1d5db', background: '#fff', color: '#0B5AA0', borderRadius: 4, fontWeight: 600 }}>Cancel</button><button onClick={() => setEditing(false)} style={{ height: 34, minWidth: 84, border: 'none', background: '#0B5AA0', color: '#fff', borderRadius: 4, fontWeight: 700 }}>Save</button></div>}><div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 14px', marginBottom: 16 }}><InputField label='Date of Loss' value={d?.dateOfLoss ?? ''} required /><InputField label='Time of Loss' value={d?.timeOfLoss ?? ''} required /><InputField label='Claim Created Date' value={d?.createdOn ?? ''} required disabled /><SelectField label='Claim Type' value={d?.claimType ?? ''} required disabled options={[d?.claimType ?? 'Select...']} /><SelectField label='Main Cause of Loss' value={d?.mainCauseOfLoss ?? ''} required disabled options={[d?.mainCauseOfLoss ?? 'Select...']} /><SelectField label='Consequences of Loss' value={d?.consequencesOfLoss ?? ''} required options={[d?.consequencesOfLoss ?? 'Select...']} /><SelectField label='Catastrophic Event' value={d?.catastrophicEvent ?? ''} options={['Select...', d?.catastrophicEvent ?? ''].filter(Boolean)} /><SelectField label='Claim Reimbursement Type' value={d?.claimReimbursementType ?? ''} options={['Select...', d?.claimReimbursementType ?? ''].filter(Boolean)} /><SelectField label='Incident Severity' required options={['Select...', 'Low', 'Medium', 'High']} /><SelectField label='Recovery' required options={['Select...', 'Yes', 'No']} /></div><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, margin: '12px 0 16px' }}><thead><tr>{['Coverage', 'Cause of Loss', 'Assets', ''].map(label => <th key={label} style={{ background: '#e6f0f6', border: '1px solid #d7dee6', textAlign: 'left', padding: 10 }}>{label}</th>)}</tr></thead><tbody>{coverages.length === 0 ? <tr><td colSpan={4} style={{ padding: 10, textAlign: 'center' }}>No coverages recorded</td></tr> : coverages.map(cov => <tr key={cov.id}><td style={{ border: '1px solid #d7dee6', padding: 8 }}>{cov.coverageName ?? '-'}</td><td style={{ border: '1px solid #d7dee6', padding: 8 }}>{cov.causeOfLossName ?? '-'}</td><td style={{ border: '1px solid #d7dee6', padding: 8 }}>{cov.assetType ?? '-'}</td><td style={{ border: '1px solid #d7dee6', padding: 4, width: 72 }}><button title='Delete' style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><TrashIcon /></button></td></tr>)}</tbody></table><div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}><button style={{ height: 34, minWidth: 132, border: '1px solid #0B5AA0', background: '#fff', color: '#0B5AA0', borderRadius: 4, fontWeight: 700 }}>+ Add</button></div><FormField label='Incident Description' required><textarea defaultValue={d?.lossDescription ?? ''} style={{ ...textareaStyle, marginTop: 7 }} /></FormField></Section><LossReadOnlySections claimData={d} /> </>;
  return <><Section title='Loss Information' onEdit={() => setEditing(true)}><ReadGrid items={liveLossDetails} /><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, margin: '16px 0' }}><thead><tr>{['Coverage', 'Cause of Loss', 'Assets'].map(label => <th key={label} style={{ background: '#e6f0f6', border: '1px solid #d7dee6', textAlign: 'left', padding: 11 }}>{label}</th>)}</tr></thead><tbody>{coverages.length === 0 ? <tr><td colSpan={3} style={{ padding: 10, textAlign: 'center', fontWeight: 700 }}>No Data Available</td></tr> : coverages.map(cov => <tr key={cov.id}><td style={{ border: '1px solid #d7dee6', padding: 8 }}>{cov.coverageName ?? '-'}</td><td style={{ border: '1px solid #d7dee6', padding: 8 }}>{cov.causeOfLossName ?? '-'}</td><td style={{ border: '1px solid #d7dee6', padding: 8 }}>{cov.assetType ?? '-'}</td></tr>)}</tbody></table><ReadGrid columns={1} items={[{ label: 'Incident Description', value: d?.lossDescription ?? '-' }]} /></Section><LossReadOnlySections claimData={d} /></>;
}

function LossReadOnlySections({ claimData }: { claimData: ClaimDetailDto | null }) {
  const d = claimData;
  const liveLossLocation = [
    { label: 'Address Line 1', value: d?.lossAddressLine1 ?? '-' },
    { label: 'Address Line 2', value: d?.lossAddressLine2 ?? '-' },
    { label: 'Country', value: d?.lossCountry ?? '-' },
    { label: 'State', value: d?.lossState ?? '-' },
    { label: 'City', value: d?.lossCity ?? '-' },
    { label: 'County', value: d?.lossCounty ?? '-' },
    { label: 'Zip Code', value: d?.lossZipCode ?? '-' },
    { label: 'Latitude', value: d?.lossLatitude ?? '-' },
    { label: 'Longitude', value: d?.lossLongitude ?? '-' },
  ];
  const liveReporter = [
    { label: 'First Name', value: d?.reporterFirstName ?? '-' },
    { label: 'Last Name', value: d?.reporterLastName ?? '-' },
    { label: 'Relationship with Insured', value: d?.reporterRelationship ?? '-' },
    { label: 'Telephone Number', value: d?.reporterTelephone ?? '-' },
    { label: 'Email ID', value: d?.reporterEmail ?? '-' },
  ];
  return <><Section title='Claim Flag' onEdit={() => undefined}><ReadGrid items={[{ label: 'Fraud Indicator', value: 'No fraud deducted' }]} /></Section><Section title='Loss Location Details' onEdit={() => undefined}><ReadGrid items={liveLossLocation} /></Section><Section title='Claim Financials'><ReadGrid items={[{ label: 'Existing Reserves', value: '-' }, { label: 'Paid Amount - Indemnity', value: '-' }, { label: 'Paid Amount - Expense', value: '-' }, { label: 'Deductible', value: '-' }]} /></Section><Section title='Claim Reporter Details' onEdit={() => undefined}><ReadGrid items={liveReporter} /></Section></>;
}

type GenericCondFilters = Record<string, { op: string; value: string } | undefined>;
type GenericValueFilters = Record<string, string[] | undefined>;

function HeaderSortIcon({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) {
  return <svg width='17' height='17' viewBox='0 0 24 24' fill='none' stroke={active ? '#0B5AA0' : '#475569'} strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'><path d='M8 7 12 3l4 4' opacity={active && direction === 'desc' ? 0.35 : 1} /><path d='M12 3v18' opacity={active && direction === 'desc' ? 0.35 : 1} /><path d='m8 17 4 4 4-4' opacity={active && direction === 'asc' ? 0.35 : 1} /></svg>;
}

function GenericColumnFilterPopup({ label, values, valueFilter, condFilter, onApplyValue, onApplyCondition, onClear, onClose, anchorRect }: { label: string; values: string[]; valueFilter: string[]; condFilter: { op: string; value: string } | undefined; onApplyValue: (values: string[]) => void; onApplyCondition: (filter: { op: string; value: string } | undefined) => void; onClear: () => void; onClose: () => void; anchorRect: DOMRect }) {
  const [tab, setTab] = useState<'condition' | 'value'>('condition');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>(valueFilter);
  const [condOp, setCondOp] = useState(condFilter?.op ?? 'Contains');
  const [condVal, setCondVal] = useState(condFilter?.value ?? '');
  const ref = useRef<HTMLDivElement>(null);
  useWorkflowOutsideClick(ref, onClose);
  const uniqueValues = [...new Set(values.filter(value => value && value !== '-'))].sort();
  const visibleValues = uniqueValues.filter(value => value.toLowerCase().includes(search.toLowerCase()));
  const allChecked = visibleValues.length > 0 && visibleValues.every(value => selected.includes(value));
  const toggleValue = (value: string) => setSelected(prev => prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]);
  const toggleAll = () => setSelected(allChecked ? selected.filter(item => !visibleValues.includes(item)) : [...new Set([...selected, ...visibleValues])]);
  return <div ref={ref} style={{ position: 'fixed', top: anchorRect.bottom + 4, left: anchorRect.left, zIndex: 9999, background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.14)', minWidth: 280, maxWidth: 340 }} onClick={event => event.stopPropagation()}><div style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6', fontWeight: 600, fontSize: 13, color: '#111827' }}>{label}</div><div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>{(['condition', 'value'] as const).map(item => <button key={item} onClick={() => setTab(item)} style={{ flex: 1, padding: '9px 0', border: 'none', background: 'none', fontSize: 13, fontWeight: tab === item ? 600 : 400, color: tab === item ? '#0B5AA0' : '#6b7280', borderBottom: tab === item ? '2px solid #0B5AA0' : '2px solid transparent', cursor: 'pointer' }}>{item === 'condition' ? 'Filter by Condition' : 'Filter by Value'}</button>)}</div>{tab === 'value' ? <><div style={{ padding: '10px 14px 6px' }}><input autoFocus placeholder='Search' value={search} onChange={event => setSearch(event.target.value)} style={{ fontSize: 13, padding: '7px 10px', width: '100%' }} /></div><div style={{ maxHeight: 200, overflowY: 'auto', padding: '4px 0' }}><label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: allChecked ? '#eff6ff' : 'transparent' }}><input type='checkbox' checked={allChecked} onChange={toggleAll} style={{ width: 15, height: 15, accentColor: '#0B5AA0' }} />Select All</label>{visibleValues.map(value => <label key={value} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, background: selected.includes(value) ? '#eff6ff' : 'transparent' }}><input type='checkbox' checked={selected.includes(value)} onChange={() => toggleValue(value)} style={{ width: 15, height: 15, accentColor: '#0B5AA0' }} />{value}</label>)}{visibleValues.length === 0 && <div style={{ padding: '12px 14px', color: '#9ca3af', fontSize: 13 }}>No values found</div>}</div><div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderTop: '1px solid #f3f4f6' }}><button className='btn-primary' style={{ flex: 1, padding: '8px 0', fontSize: 13 }} onClick={() => { onApplyValue(selected); onClose(); }}>Apply</button><button className='btn-secondary' style={{ padding: '8px 14px', fontSize: 13 }} onClick={onClose}>Cancel</button><button className='btn-secondary' style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => { setSelected([]); onClear(); onClose(); }}>Clear</button></div></> : <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}><select value={condOp} onChange={event => setCondOp(event.target.value)} style={{ fontSize: 13, width: '100%' }}>{DOCUMENT_CONDITION_OPS.map(op => <option key={op}>{op}</option>)}</select><input autoFocus placeholder='Value...' value={condVal} onChange={event => setCondVal(event.target.value)} style={{ fontSize: 13, width: '100%' }} /><div style={{ display: 'flex', gap: 8 }}><button className='btn-primary' style={{ flex: 1, fontSize: 13, padding: '8px 0' }} onClick={() => { onApplyCondition(condVal ? { op: condOp, value: condVal } : undefined); onClose(); }}>Apply</button><button className='btn-secondary' style={{ fontSize: 13, padding: '8px 14px' }} onClick={() => { setCondVal(''); onApplyCondition(undefined); onClose(); }}>Clear</button></div></div>}</div>;
}

function applyGenericFilters<Row extends object>(rows: Row[], cols: { key: string }[], valueFilters: GenericValueFilters, condFilters: GenericCondFilters) {
  return rows.filter(row => cols.every(col => {
    const cell = String((row as Record<string, unknown>)[col.key] ?? '').toLowerCase();
    const valueFilter = valueFilters[col.key];
    const conditionFilter = condFilters[col.key];
    if (valueFilter?.length && !valueFilter.some(value => value.toLowerCase() === cell)) return false;
    if (conditionFilter?.value) {
      const target = conditionFilter.value.toLowerCase();
      if (conditionFilter.op === 'Contains' && !cell.includes(target)) return false;
      if (conditionFilter.op === 'Does not contain' && cell.includes(target)) return false;
      if (conditionFilter.op === 'Equals' && cell !== target) return false;
      if (conditionFilter.op === 'Starts with' && !cell.startsWith(target)) return false;
      if (conditionFilter.op === 'Ends with' && !cell.endsWith(target)) return false;
    }
    return true;
  }));
}

function ReportsList({ onAdd, onView }: { onAdd: () => void; onView: () => void }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<keyof typeof reportRows[number]>('reportNumber');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [valueFilters, setValueFilters] = useState<GenericValueFilters>({});
  const [condFilters, setCondFilters] = useState<GenericCondFilters>({});
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [filterRect, setFilterRect] = useState<DOMRect | null>(null);
  const cols: { key: keyof typeof reportRows[number]; label: string }[] = [{ key: 'reportType', label: 'Report Type' }, { key: 'reportNumber', label: 'Report Number' }, { key: 'filingDate', label: 'Report Filing Date' }, { key: 'caseStatus', label: 'Case Status' }, { key: 'contactName', label: 'Contact Person' }];
  const searched = reportRows.filter(row => !search.trim() || Object.values(row).join(' ').toLowerCase().includes(search.toLowerCase()));
  const filtered = applyGenericFilters(searched, cols, valueFilters, condFilters);
  const sorted = [...filtered].sort((a, b) => sortDir === 'asc' ? String(a[sortKey]).localeCompare(String(b[sortKey]), undefined, { numeric: true }) : String(b[sortKey]).localeCompare(String(a[sortKey]), undefined, { numeric: true }));
  const pageRows = sorted.slice((page - 1) * pageSize, page * pageSize);
  const sort = (key: keyof typeof reportRows[number]) => { setSortKey(key); setSortDir(prev => sortKey === key && prev === 'asc' ? 'desc' : 'asc'); setPage(1); };
  const hasFilter = (key: string) => (valueFilters[key]?.length ?? 0) > 0 || !!condFilters[key]?.value;
  const openFilterFor = (event: ReactMouseEvent<HTMLElement>, key: string) => { event.stopPropagation(); setOpenFilter(openFilter === key ? null : key); setFilterRect((event.currentTarget as HTMLElement).getBoundingClientRect()); };
  return <Section title='Reports' actions={<button onClick={onAdd} style={{ height: 34, minWidth: 132, border: 'none', background: '#0B5AA0', color: '#fff', borderRadius: 4, fontWeight: 700 }}>+ Add Report</button>}><label style={{ width: 292, height: 34, border: '1px solid #b6c0cc', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', color: '#6b7280', background: '#f7f9fc', fontSize: 13, marginBottom: 14 }}><SearchIcon /><input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder='Search by Keyword' style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1 }} /></label><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr style={{ background: '#fff' }}><th style={{ width: 42, padding: '10px 10px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb', textAlign: 'center' }}><MenuIcon /></th><th style={{ width: 110, padding: '10px 12px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb', textAlign: 'left' }}>Actions</th>{cols.map(col => <th key={String(col.key)} onClick={() => sort(col.key)} style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb', textAlign: 'left', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{col.label}<HeaderSortIcon active={sortKey === col.key} direction={sortDir} /><span onClick={event => openFilterFor(event, String(col.key))} style={{ marginLeft: 4, cursor: 'pointer', color: hasFilter(String(col.key)) ? '#0B5AA0' : '#9ca3af', display: 'inline-flex' }} title='Filter'><FilterIcon /></span></span>{openFilter === col.key && filterRect && <GenericColumnFilterPopup label={col.label} values={reportRows.map(row => String(row[col.key] ?? '-'))} valueFilter={valueFilters[String(col.key)] ?? []} condFilter={condFilters[String(col.key)]} onApplyValue={values => { setValueFilters(prev => ({ ...prev, [String(col.key)]: values })); setPage(1); }} onApplyCondition={filter => { setCondFilters(prev => ({ ...prev, [String(col.key)]: filter })); setPage(1); }} onClear={() => { setValueFilters(prev => { const next = { ...prev }; delete next[String(col.key)]; return next; }); setCondFilters(prev => { const next = { ...prev }; delete next[String(col.key)]; return next; }); setPage(1); }} onClose={() => setOpenFilter(null)} anchorRect={filterRect} />}</th>)}</tr></thead><tbody>{pageRows.length === 0 ? <tr><td colSpan={7} style={{ height: 120, textAlign: 'center', fontSize: 21, fontWeight: 800 }}>No Data Available</td></tr> : pageRows.map((row, index) => <tr key={row.id} style={{ borderBottom: '1px solid #e5e7eb' }}><td style={{ padding: '10px 12px', color: '#64748b', textAlign: 'center' }}>{(page - 1) * pageSize + index + 1}</td><td style={{ padding: '10px 12px' }}><button onClick={onView} title='View' style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer' }}><EyeIcon /></button><button title='Delete' style={{ background: 'transparent', border: 'none', padding: 4, marginLeft: 16, cursor: 'pointer' }}><TrashIcon /></button></td>{cols.map(col => <td key={String(col.key)} style={{ padding: '10px 12px' }}>{String(row[col.key])}</td>)}</tr>)}</tbody></table><PaginationBar page={page} pageSize={pageSize} total={sorted.length} onPageChange={setPage} onPageSizeChange={next => { setPageSize(next); setPage(1); }} /></Section>;
}

function PartyList({ title, buttonLabel, rows, onAdd, onView }: { title: string; buttonLabel: string; rows: typeof partyRows; onAdd: () => void; onView: () => void }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<SimpleSortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [valueFilters, setValueFilters] = useState<GenericValueFilters>({});
  const [condFilters, setCondFilters] = useState<GenericCondFilters>({});
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [filterRect, setFilterRect] = useState<DOMRect | null>(null);
  const cols = [{ key: 'name', label: title === 'Witness Details' ? 'Witness Name' : 'Party Name' }, { key: 'relationship', label: 'Relationship with the Insured' }, { key: 'telephone', label: 'Telephone Number' }, { key: 'email', label: 'Email' }, { key: 'city', label: 'City' }, { key: 'state', label: 'State' }];
  const searched = rows.filter(row => !search.trim() || Object.values(row).join(' ').toLowerCase().includes(search.toLowerCase()));
  const filtered = applyGenericFilters(searched, cols, valueFilters, condFilters);
  const sorted = [...filtered].sort((a, b) => sortDir === 'asc' ? String(a[sortKey as keyof typeof a]).localeCompare(String(b[sortKey as keyof typeof b]), undefined, { numeric: true }) : String(b[sortKey as keyof typeof b]).localeCompare(String(a[sortKey as keyof typeof a]), undefined, { numeric: true }));
  const pageRows = sorted.slice((page - 1) * pageSize, page * pageSize);
  const sort = (key: string) => { setSortKey(key); setSortDir(prev => sortKey === key && prev === 'asc' ? 'desc' : 'asc'); setPage(1); };
  const hasFilter = (key: string) => (valueFilters[key]?.length ?? 0) > 0 || !!condFilters[key]?.value;
  const openFilterFor = (event: ReactMouseEvent<HTMLElement>, key: string) => { event.stopPropagation(); setOpenFilter(openFilter === key ? null : key); setFilterRect((event.currentTarget as HTMLElement).getBoundingClientRect()); };
  return <Section title={title} actions={<button onClick={onAdd} style={{ height: 34, minWidth: 132, border: 'none', background: '#0B5AA0', color: '#fff', borderRadius: 4, fontWeight: 700 }}>{buttonLabel}</button>}><label style={{ width: 292, height: 34, border: '1px solid #b6c0cc', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', color: '#6b7280', background: '#f7f9fc', fontSize: 13, marginBottom: 14 }}><SearchIcon /><input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder='Search by Keyword' style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1 }} /></label><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr style={{ background: '#fff' }}><th style={{ width: 42, padding: '10px 10px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb', textAlign: 'center' }}><MenuIcon /></th><th style={{ width: 120, padding: '10px 12px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb', textAlign: 'left' }}>Actions</th>{cols.map(col => <th key={col.key} onClick={() => sort(col.key)} style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb', textAlign: 'left', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{col.label}<HeaderSortIcon active={sortKey === col.key} direction={sortDir} /><span onClick={event => openFilterFor(event, col.key)} style={{ marginLeft: 4, cursor: 'pointer', color: hasFilter(col.key) ? '#0B5AA0' : '#9ca3af', display: 'inline-flex' }} title='Filter'><FilterIcon /></span></span>{openFilter === col.key && filterRect && <GenericColumnFilterPopup label={col.label} values={rows.map(row => String(row[col.key as keyof typeof row] ?? '-'))} valueFilter={valueFilters[col.key] ?? []} condFilter={condFilters[col.key]} onApplyValue={values => { setValueFilters(prev => ({ ...prev, [col.key]: values })); setPage(1); }} onApplyCondition={filter => { setCondFilters(prev => ({ ...prev, [col.key]: filter })); setPage(1); }} onClear={() => { setValueFilters(prev => { const next = { ...prev }; delete next[col.key]; return next; }); setCondFilters(prev => { const next = { ...prev }; delete next[col.key]; return next; }); setPage(1); }} onClose={() => setOpenFilter(null)} anchorRect={filterRect} />}</th>)}</tr></thead><tbody>{pageRows.length === 0 ? <tr><td colSpan={8} style={{ height: 120, textAlign: 'center', fontSize: 21, fontWeight: 800 }}>No Data Available</td></tr> : pageRows.map((row, index) => <tr key={row.id} style={{ borderBottom: '1px solid #e5e7eb' }}><td style={{ padding: '10px 12px', color: '#64748b', textAlign: 'center' }}>{(page - 1) * pageSize + index + 1}</td><td style={{ padding: '10px 12px' }}><button onClick={onView} title='View' style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer' }}><EyeIcon /></button><button title='Delete' style={{ background: 'transparent', border: 'none', padding: 4, marginLeft: 16, cursor: 'pointer' }}><TrashIcon /></button></td><td style={{ padding: '10px 12px' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 28, height: 28, borderRadius: '50%', background: '#cfedff', color: '#0B5AA0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>{row.initials}</span>{row.name}</span></td><td style={{ padding: '10px 12px' }}>{row.relationship}</td><td style={{ padding: '10px 12px' }}>{row.telephone}</td><td style={{ padding: '10px 12px' }}>{row.email}</td><td style={{ padding: '10px 12px' }}>{row.city}</td><td style={{ padding: '10px 12px' }}>{row.state}</td></tr>)}</tbody></table><PaginationBar page={page} pageSize={pageSize} total={sorted.length} onPageChange={setPage} onPageSizeChange={next => { setPageSize(next); setPage(1); }} /></Section>;
}

function PartiesTab({ onAdd, onView }: { onAdd: (mode: LossAddMode) => void; onView: (mode: LossViewMode) => void }) {
  return <><ReportsList onAdd={() => onAdd('report')} onView={() => onView('report')} /><Section title='Insured Details'><ReadGrid items={insuredPartyDetails} /></Section><PartyList title='Party Details' buttonLabel='+ Add Party' rows={partyRows} onAdd={() => onAdd('party')} onView={() => onView('party')} /><PartyList title='Witness Details' buttonLabel='+ Add Witness' rows={witnessRows} onAdd={() => onAdd('witness')} onView={() => onView('witness')} /></>;
}
const lossExposureFieldStyle: CSSProperties = { ...fieldStyle, height: 32, marginTop: 6, background: '#f7f8fb', fontSize: 12 };

function YesNoField({ label, value, onChange, required = false }: { label: string; value: boolean; onChange: (value: boolean) => void; required?: boolean }) {
  const name = `loss-exposure-${label.replace(/\W+/g, '-').toLowerCase()}`;
  return <fieldset style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}><legend style={{ fontSize: 12, fontWeight: 600, marginBottom: 9 }}>{required && <span style={{ color: '#d32727' }}>* </span>}{label}</legend><div style={{ display: 'flex', alignItems: 'center', gap: 14 }}><label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 400 }}><input type='radio' name={name} checked={value} onChange={() => onChange(true)} style={{ width: 17, height: 17, accentColor: '#0868b2' }} />Yes</label><label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 400 }}><input type='radio' name={name} checked={!value} onChange={() => onChange(false)} style={{ width: 17, height: 17, accentColor: '#0868b2' }} />No</label></div></fieldset>;
}

function LossExposureSelect({ label, required, value, onChange, children }: { label: string; required?: boolean; value: string | number; onChange: (value: string) => void; children: ReactNode }) {
  return <FormField label={label} required={required}><select value={value} onChange={event => onChange(event.target.value)} style={lossExposureFieldStyle}><option value=''>Select...</option>{children}</select></FormField>;
}

function DamageAccordion({ damage, materials, expanded, onToggle, onChange }: { damage: LossExposureDamage; materials: string[]; expanded: boolean; onToggle: () => void; onChange: (next: LossExposureDamage) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const addImages = (files: FileList | null) => {
    if (!files) return;
    [...files].filter(file => file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => { if (typeof reader.result === 'string') onChange({ ...damage, images: [...damage.images, { fileName: file.name, contentType: file.type || null, contentBase64: reader.result }] }); };
      reader.readAsDataURL(file);
    });
  };
  return <div style={{ border: '1px solid #d8dee6', borderRadius: 3, marginBottom: 12, background: '#fff' }}><button type='button' onClick={onToggle} aria-expanded={expanded} style={{ width: '100%', height: 45, border: 0, background: '#fff', display: 'flex', alignItems: 'center', gap: 8, padding: '0 13px', fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}><span style={{ width: 16, height: 16, border: '1px solid #111827', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, lineHeight: 1 }}>{expanded ? '−' : '+'}</span>{damage.section}</button>{expanded && <div style={{ borderTop: '1px solid #d8dee6', padding: '14px 12px 12px' }}><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, maxWidth: 1030 }}><LossExposureSelect label='Material Type' required value={damage.materialType ?? ''} onChange={value => onChange({ ...damage, materialType: value || null })}>{materials.map(item => <option key={item} value={item}>{item}</option>)}</LossExposureSelect><FormField label='Percentage of Damage (%)' required><input type='number' min='0' max='100' step='0.01' value={damage.percentageOfDamage ?? ''} onChange={event => onChange({ ...damage, percentageOfDamage: event.target.value === '' ? null : Number(event.target.value) })} style={lossExposureFieldStyle} /></FormField></div><div style={{ borderTop: '1px solid #e5e7eb', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><strong style={{ fontSize: 12 }}>Attached Image</strong><div><input ref={fileRef} type='file' accept='image/*' multiple hidden onChange={event => { addImages(event.target.files); event.target.value = ''; }} /><button type='button' onClick={() => fileRef.current?.click()} style={{ height: 30, minWidth: 108, border: '1px solid #0B5AA0', color: '#0B5AA0', background: '#fff', borderRadius: 3, fontSize: 12, cursor: 'pointer' }}>＋ Add Image</button></div></div>{damage.images.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>{damage.images.map((image, index) => <span key={`${image.fileName}-${index}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid #d8dee6', borderRadius: 3, padding: '5px 8px', fontSize: 11 }}>{image.fileName}<button type='button' aria-label={`Remove ${image.fileName}`} onClick={() => onChange({ ...damage, images: damage.images.filter((_, itemIndex) => itemIndex !== index) })} style={{ border: 0, background: 'transparent', color: '#b42318', cursor: 'pointer', padding: 0 }}>×</button></span>)}</div>}</div>}</div>;
}

function AddLossExposureForm({ claimId, onCancel, onSave }: { claimId: number; onCancel: () => void; onSave: (draft: CreateLossExposureRequest) => Promise<void> }) {
  const [formData, setFormData] = useState<LossExposureFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expandedDamage, setExpandedDamage] = useState<string | null>(null);
  const [estimateText, setEstimateText] = useState('');
  const [allocationText, setAllocationText] = useState('');
  const [draft, setDraft] = useState<CreateLossExposureRequest>({ lossParty: '', claimantReference: null, claimantName: '', lossExposureTypeId: 0, lossType: '', coverageLimit: null, severity: '', causeOfLossId: null, causeOfLoss: '', percentageAllocation: null, propertyUsable: false, contractorsInvolved: false, moldSuspected: false, additionalLivingExpenseRequired: false, contentDamage: false, sprinklerAlarmInstalled: false, lienholderInvolved: false, attorneyInvolved: false, descriptionOfLoss: null, damageDetails: [], additionalServicesRequired: false, lossEstimate: 0, currency: 'USD', notes: null });
  const update = <K extends keyof CreateLossExposureRequest>(key: K, value: CreateLossExposureRequest[K]) => setDraft(current => ({ ...current, [key]: value }));
  useEffect(() => { let cancelled = false; setLoading(true); claimsApi.getLossExposureFormData(claimId).then(data => { if (cancelled) return; setFormData(data); setDraft(current => ({ ...current, damageDetails: data.damageSections.map(section => ({ section: section.name, materialType: null, percentageOfDamage: null, images: [] })) })); setError(''); }).catch(reason => { if (!cancelled) setError(reason instanceof Error ? reason.message : 'Unable to load loss exposure dropdown values.'); }).finally(() => { if (!cancelled) setLoading(false); }); return () => { cancelled = true; }; }, [claimId]);
  const claimantOptions = formData?.claimants.filter(item => item.lossParty === draft.lossParty) ?? [];
  const exposureOptions = formData?.exposureTypes.filter(item => item.lossParty === draft.lossParty) ?? [];
  const risk = formData?.riskDetails;
  const chooseClaimant = (reference: string) => { const selected = claimantOptions.find(item => item.reference === reference); setDraft(current => ({ ...current, claimantReference: reference || null, claimantName: selected?.name ?? '' })); };
  const chooseExposure = (idText: string) => { const selected = exposureOptions.find(item => item.id === Number(idText)); setDraft(current => ({ ...current, lossExposureTypeId: selected?.id ?? 0, lossType: selected?.name ?? '', coverageLimit: selected?.limit ?? null })); };
  const chooseCause = (idText: string) => { const selected = formData?.causesOfLoss.find(item => item.id === Number(idText)); setDraft(current => ({ ...current, causeOfLossId: selected?.id ?? null, causeOfLoss: selected?.name ?? '' })); };
  const updateDamage = (index: number, next: LossExposureDamage) => setDraft(current => ({ ...current, damageDetails: current.damageDetails.map((item, itemIndex) => itemIndex === index ? next : item) }));
  const submit = async () => {
    const allocation = allocationText.trim() === '' ? null : Number(allocationText);
    const estimate = estimateText.trim() === '' ? NaN : Number(estimateText);
    if (!draft.lossParty || !draft.claimantReference || !draft.claimantName || !draft.lossExposureTypeId || !draft.severity || !draft.causeOfLoss) { setError('Complete all required claimant and exposure fields before submitting.'); return; }
    if (allocation != null && (!Number.isFinite(allocation) || allocation < 0 || allocation > 100)) { setError('Percentage allocation must be between 0 and 100.'); return; }
    if (!Number.isFinite(estimate) || estimate < 0) { setError('Loss estimate amount is required and must be zero or greater.'); return; }
    const invalidDamage = draft.damageDetails.find(item => (item.materialType && item.percentageOfDamage == null) || (item.percentageOfDamage != null && (!item.materialType || item.percentageOfDamage < 0 || item.percentageOfDamage > 100)));
    if (invalidDamage) { setError(`Complete valid material and damage percentage values for ${invalidDamage.section}.`); setExpandedDamage(invalidDamage.section); return; }
    setSaving(true); setError('');
    try { await onSave({ ...draft, percentageAllocation: allocation, lossEstimate: estimate }); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save the loss exposure.'); setSaving(false); }
  };
  if (loading) return <div style={{ minHeight: 520, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading loss exposure form...</div>;
  if (!formData) return <div><div role='alert' style={{ color: '#b42318', padding: 16 }}>{error || 'Loss exposure form data is unavailable.'}</div><button onClick={onCancel} className='btn-secondary'>Cancel</button></div>;
  const riskItems = [{ label: 'Occupancy Type', value: risk?.occupancyType }, { label: 'Construction Type', value: risk?.constructionType }, { label: 'Age of Property', value: risk?.ageOfProperty }, { label: 'Length of Occupancy', value: risk?.lengthOfOccupancy }, { label: 'Roof Type', value: risk?.roofType }, { label: 'Fire Protection Class', value: risk?.fireProtectionClass }];
  return <div style={{ fontSize: 12 }}><div style={{ border: '1px solid #d8e1ea', borderRadius: 6, background: '#fff', padding: '12px 14px 70px' }}><section style={{ border: '1px solid #d8e1ea', borderRadius: 5, padding: '14px 12px', marginBottom: 14 }}><h2 style={{ fontSize: 14, margin: '0 0 16px' }}>Risk Details</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px 18px' }}>{riskItems.map(item => <div key={item.label} style={{ borderBottom: '1px solid #e5e7eb', minHeight: 36 }}><div style={{ fontSize: 11, marginBottom: 5 }}>{item.label}</div><div>{item.value || '-'}</div></div>)}</div></section><section style={{ borderTop: '1px solid #d8e1ea', paddingTop: 13, marginBottom: 16 }}><h2 style={{ fontSize: 14, margin: '0 0 14px' }}>Claimant Details</h2><div style={{ display: 'grid', gridTemplateColumns: '385px 385px', gap: 14 }}><LossExposureSelect label='Loss Party' required value={draft.lossParty} onChange={value => setDraft(current => ({ ...current, lossParty: value, claimantReference: null, claimantName: '', lossExposureTypeId: 0, lossType: '', coverageLimit: null }))}>{formData.lossParties.map(item => <option key={item} value={item}>{item}</option>)}</LossExposureSelect><LossExposureSelect label='Claimant Name' required value={draft.claimantReference ?? ''} onChange={chooseClaimant}>{claimantOptions.map(item => <option key={item.reference} value={item.reference}>{item.name}</option>)}</LossExposureSelect></div></section><section style={{ borderTop: '1px solid #d8e1ea', paddingTop: 13 }}><h2 style={{ fontSize: 14, margin: '0 0 14px' }}>Exposure Details</h2><div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.1fr 1.1fr 1.1fr 1.1fr', gap: 12, alignItems: 'end' }}><LossExposureSelect label='Loss Exposure Type' required value={draft.lossExposureTypeId || ''} onChange={chooseExposure}>{exposureOptions.map(item => <option key={`${item.id}-${item.name}`} value={item.id}>{item.name}</option>)}</LossExposureSelect><div style={{ alignSelf: 'stretch' }}><div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Limit</div><div style={{ borderBottom: '1px solid #e5e7eb', minHeight: 27 }}>{draft.coverageLimit || '-'}</div></div><LossExposureSelect label='Severity' required value={draft.severity} onChange={value => update('severity', value)}>{formData.severities.map(item => <option key={item} value={item}>{item}</option>)}</LossExposureSelect><LossExposureSelect label='Cause of Loss' value={draft.causeOfLossId ?? ''} onChange={chooseCause}>{formData.causesOfLoss.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</LossExposureSelect><FormField label='Percentage Allocation (%)'><input type='number' min='0' max='100' step='0.01' value={allocationText} onChange={event => setAllocationText(event.target.value)} style={lossExposureFieldStyle} /></FormField></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '18px 26px', marginTop: 14 }}><YesNoField label='Is the property currently usable?' required value={draft.propertyUsable} onChange={value => update('propertyUsable', value)} /><YesNoField label='Contractors Involved?' required value={draft.contractorsInvolved} onChange={value => update('contractorsInvolved', value)} /><YesNoField label='Is Mold Suspected?' required value={draft.moldSuspected} onChange={value => update('moldSuspected', value)} /><YesNoField label='Is Additional Living Expense Required?' required value={draft.additionalLivingExpenseRequired} onChange={value => update('additionalLivingExpenseRequired', value)} /><YesNoField label='Content Damage?' required value={draft.contentDamage} onChange={value => update('contentDamage', value)} /><YesNoField label='Sprinkler/Alarm System Installed?' required value={draft.sprinklerAlarmInstalled} onChange={value => update('sprinklerAlarmInstalled', value)} /><YesNoField label='Lienholder Involved?' required value={draft.lienholderInvolved} onChange={value => update('lienholderInvolved', value)} /><YesNoField label='Attorney Involved?' value={draft.attorneyInvolved} onChange={value => update('attorneyInvolved', value)} /></div><div style={{ marginTop: 16 }}><FormField label='Description of Loss'><textarea value={draft.descriptionOfLoss ?? ''} onChange={event => update('descriptionOfLoss', event.target.value || null)} placeholder='Type Your Message Here' style={{ ...textareaStyle, minHeight: 54, marginTop: 6, background: '#f7f8fb', fontSize: 12 }} /></FormField></div></section><section style={{ borderTop: '1px solid #d8e1ea', marginTop: 12, paddingTop: 14 }}><h2 style={{ fontSize: 14, margin: '0 0 14px' }}>Percentage of Damage</h2>{draft.damageDetails.map((damage, index) => <DamageAccordion key={damage.section} damage={damage} materials={formData.damageSections.find(item => item.name === damage.section)?.materials ?? []} expanded={expandedDamage === damage.section} onToggle={() => setExpandedDamage(current => current === damage.section ? null : damage.section)} onChange={next => updateDamage(index, next)} />)}</section><section style={{ borderTop: '1px solid #d8e1ea', marginTop: 18, padding: '14px 0' }}><label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>Additional Services Required?<span onClick={() => update('additionalServicesRequired', !draft.additionalServicesRequired)} role='switch' aria-checked={draft.additionalServicesRequired} tabIndex={0} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') update('additionalServicesRequired', !draft.additionalServicesRequired); }} style={{ width: 35, height: 19, borderRadius: 999, background: draft.additionalServicesRequired ? '#0B5AA0' : '#d1d5db', display: 'inline-flex', alignItems: 'center', justifyContent: draft.additionalServicesRequired ? 'flex-end' : 'flex-start', padding: 2 }}><span style={{ width: 15, height: 15, background: '#fff', borderRadius: '50%' }} /></span></label></section><section style={{ borderTop: '1px solid #d8e1ea', paddingTop: 14 }}><h2 style={{ fontSize: 14, margin: '0 0 12px' }}>Loss Estimate</h2><div style={{ width: 385 }}><FormField label='Loss Estimate Amount ($)' required><input type='number' min='0' step='0.01' value={estimateText} onChange={event => setEstimateText(event.target.value)} style={lossExposureFieldStyle} /></FormField></div></section>{error && <div role='alert' style={{ marginTop: 16, color: '#b42318', background: '#fef3f2', border: '1px solid #fecdca', borderRadius: 4, padding: '10px 12px' }}>{error}</div>}</div><div style={{ position: 'sticky', bottom: 0, zIndex: 25, height: 54, background: '#fff', borderTop: '1px solid #d8e1ea', boxShadow: '0 -3px 9px rgba(15,23,42,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14, padding: '0 14px' }}><button type='button' onClick={onCancel} disabled={saving} style={{ height: 32, minWidth: 108, border: '1px solid #d1d5db', background: '#fff', color: '#0B5AA0', borderRadius: 3, fontSize: 12 }}>Cancel</button><button type='button' onClick={submit} disabled={saving} style={{ height: 32, minWidth: 108, border: 0, background: saving ? '#94a3b8' : '#0B5AA0', color: '#fff', borderRadius: 3, fontSize: 12, fontWeight: 700 }}>{saving ? 'Submitting...' : 'Submit'}</button></div></div>;
}

function LossExposureReadValue({ label, value }: { label: string; value: ReactNode }) {
  return <div style={{ borderBottom: '1px solid #e5e7eb', minHeight: 46, paddingBottom: 7 }}><div style={{ color: '#475569', fontSize: 11, marginBottom: 6 }}>{label}</div><div style={{ color: '#111827', fontSize: 13, fontWeight: 600 }}>{value ?? '-'}</div></div>;
}

function ViewLossExposureForm({ row, onBack }: { row: LossExposureDto; onBack: () => void }) {
  const yesNo = (value: boolean) => value ? 'Yes' : 'No';
  const exposureItems = [
    ['Loss Party', row.lossParty], ['Claimant Name', row.claimantName], ['Loss Exposure Type', row.lossType], ['Limit', row.coverageLimit || '-'],
    ['Severity', row.severity], ['Cause of Loss', row.causeOfLoss], ['Percentage Allocation (%)', row.percentageAllocation == null ? '-' : `${row.percentageAllocation}%`],
  ];
  const conditionItems = [
    ['Is the property currently usable?', yesNo(row.propertyUsable)], ['Contractors Involved?', yesNo(row.contractorsInvolved)],
    ['Is Mold Suspected?', yesNo(row.moldSuspected)], ['Is Additional Living Expense Required?', yesNo(row.additionalLivingExpenseRequired)],
    ['Content Damage?', yesNo(row.contentDamage)], ['Sprinkler/Alarm System Installed?', yesNo(row.sprinklerAlarmInstalled)],
    ['Lienholder Involved?', yesNo(row.lienholderInvolved)], ['Attorney Involved?', yesNo(row.attorneyInvolved)],
  ];
  return <div style={{ fontSize: 12 }}><div style={{ border: '1px solid #d8e1ea', borderRadius: 6, background: '#fff', padding: '14px 14px 70px' }}><div style={{ marginBottom: 18 }}><h2 style={{ margin: 0, fontSize: 18 }}>View Loss Exposure</h2><div style={{ marginTop: 5, color: '#64748b' }}>Loss Information / Loss Exposure Details</div></div><section style={{ borderTop: '1px solid #d8e1ea', paddingTop: 14 }}><h3 style={{ fontSize: 14, margin: '0 0 14px' }}>Exposure Details</h3><div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '18px 20px' }}>{exposureItems.map(([label, value]) => <LossExposureReadValue key={String(label)} label={String(label)} value={value} />)}</div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '18px 20px', marginTop: 20 }}>{conditionItems.map(([label, value]) => <LossExposureReadValue key={String(label)} label={String(label)} value={value} />)}</div><div style={{ marginTop: 20 }}><LossExposureReadValue label='Description of Loss' value={row.descriptionOfLoss || '-'} /></div></section><section style={{ borderTop: '1px solid #d8e1ea', marginTop: 18, paddingTop: 14 }}><h3 style={{ fontSize: 14, margin: '0 0 14px' }}>Percentage of Damage</h3>{row.damageDetails.length === 0 ? <div style={{ color: '#64748b' }}>No damage details recorded.</div> : row.damageDetails.map(damage => <div key={damage.section} style={{ border: '1px solid #d8dee6', borderRadius: 4, padding: 13, marginBottom: 12 }}><strong style={{ fontSize: 13 }}>{damage.section}</strong><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 900, marginTop: 12 }}><LossExposureReadValue label='Material Type' value={damage.materialType || '-'} /><LossExposureReadValue label='Percentage of Damage (%)' value={damage.percentageOfDamage == null ? '-' : `${damage.percentageOfDamage}%`} /></div>{damage.images.length > 0 && <div style={{ marginTop: 12 }}><div style={{ fontWeight: 600, marginBottom: 8 }}>Attached Images</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>{damage.images.map((image, index) => <a key={`${image.fileName}-${index}`} href={image.contentBase64} download={image.fileName} title={`Download ${image.fileName}`} style={{ display: 'inline-flex', flexDirection: 'column', gap: 5, color: '#0B5AA0', textDecoration: 'none' }}><img src={image.contentBase64} alt={image.fileName} style={{ width: 92, height: 68, objectFit: 'cover', border: '1px solid #d8dee6', borderRadius: 3 }} /><span style={{ maxWidth: 92, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{image.fileName}</span></a>)}</div></div>}</div>)}</section><section style={{ borderTop: '1px solid #d8e1ea', marginTop: 18, paddingTop: 14 }}><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 900 }}><LossExposureReadValue label='Additional Services Required?' value={yesNo(row.additionalServicesRequired)} /><LossExposureReadValue label='Loss Estimate Amount ($)' value={`${row.currency} ${Number(row.lossEstimate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} /></div></section></div><div style={{ position: 'sticky', bottom: 0, zIndex: 25, height: 54, background: '#fff', borderTop: '1px solid #d8e1ea', boxShadow: '0 -3px 9px rgba(15,23,42,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 14px' }}><button type='button' onClick={onBack} style={{ height: 32, minWidth: 108, border: '1px solid #d1d5db', background: '#fff', color: '#0B5AA0', borderRadius: 3, fontSize: 12, fontWeight: 600 }}>Back</button></div></div>;
}

function LossExposureTab({ claimId, claimData }: { claimId: number; claimData: ClaimDetailDto | null }) {
  const [rows, setRows] = useState<LossExposureDto[]>([]);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<LossExposureDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  useEffect(() => { let cancelled = false; setLoading(true); claimsApi.getLossExposures(claimId).then(items => { if (!cancelled) { setRows(items); setLoadError(''); } }).catch(reason => { if (!cancelled) setLoadError(reason instanceof Error ? reason.message : 'Unable to load loss exposures.'); }).finally(() => { if (!cancelled) setLoading(false); }); return () => { cancelled = true; }; }, [claimId]);
  const save = async (draft: CreateLossExposureRequest) => { const saved = await claimsApi.createLossExposure(claimId, draft); setRows(current => [saved, ...current]); setCreating(false); };
  const remove = async (row: LossExposureDto) => { if (!window.confirm(`Delete the loss exposure for ${row.claimantName}?`)) return; await claimsApi.deleteLossExposure(claimId, row.id); setRows(current => current.filter(item => item.id !== row.id)); };
  if (creating) return <AddLossExposureForm claimId={claimId} onCancel={() => setCreating(false)} onSave={save} />;
  if (viewing) return <ViewLossExposureForm row={viewing} onBack={() => setViewing(null)} />;
  const filtered = rows.filter(row => !search.trim() || [row.claimantName, row.lossParty, row.lossType, row.causeOfLoss, row.lossEstimate, row.currency].join(' ').toLowerCase().includes(search.trim().toLowerCase()));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const cols = ['Claimant Name', 'Claimant Type', 'Loss Type', 'Loss Consequences', 'Loss Estimate'];
  return <Section title='Loss Exposures' actions={<button type='button' onClick={() => setCreating(true)} style={{ height: 34, minWidth: 162, border: 'none', background: '#0B5AA0', color: '#fff', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}>+ Add Loss Exposure</button>} style={{ minHeight: 640 }}><label style={{ width: 292, height: 34, border: '1px solid #b6c0cc', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', color: '#6b7280', background: '#f7f9fc', fontSize: 13, marginBottom: 14 }}><SearchIcon /><input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder='Search By Keyword' style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1 }} /></label>{loadError && <div role='alert' style={{ color: '#b42318', marginBottom: 12 }}>{loadError}</div>}<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr><th style={{ width: 56, padding: 12, textAlign: 'center' }}><MenuIcon /></th><th style={{ width: 120, padding: 12, textAlign: 'left' }}>Action</th>{cols.map(col => <th key={col} style={{ padding: 12, textAlign: 'left' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{col}<FilterIcon /></span></th>)}</tr></thead><tbody>{loading ? <tr><td colSpan={7} style={{ height: 240, textAlign: 'center', fontSize: 16 }}>Loading...</td></tr> : pageRows.length === 0 ? <tr><td colSpan={7} style={{ height: 360, textAlign: 'center', fontSize: 22, fontWeight: 800 }}>No Data Available</td></tr> : pageRows.map((row, index) => <tr key={row.id} style={{ borderBottom: '1px solid #e5e7eb' }}><td style={{ padding: 12, textAlign: 'center', color: '#64748b' }}>{(page - 1) * pageSize + index + 1}</td><td style={{ padding: 12 }}><button type='button' onClick={() => setViewing(row)} title='View loss exposure' aria-label={`View loss exposure for ${row.claimantName}`} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}><EyeIcon /></button><button type='button' onClick={() => remove(row)} title='Delete loss exposure' aria-label={`Delete loss exposure for ${row.claimantName}`} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, marginLeft: 12 }}><TrashIcon /></button></td><td style={{ padding: 12 }}>{row.claimantName}</td><td style={{ padding: 12 }}>{row.lossParty}</td><td style={{ padding: 12 }}>{row.lossType}</td><td style={{ padding: 12 }}>{row.causeOfLoss}</td><td style={{ padding: 12 }}>{row.currency} {Number(row.lossEstimate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>)}</tbody></table><PaginationBar page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={next => { setPageSize(next); setPage(1); }} /></Section>;
}

function ProfilePlaceholder() {
  return <div style={{ height: 168, background: '#f6f8fb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}><div style={{ width: 145, height: 145, background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b8b8b8' }}><svg width='90' height='90' viewBox='0 0 24 24' fill='currentColor'><circle cx='12' cy='8' r='4' /><path d='M4 21c.8-4.4 4-7 8-7s7.2 2.6 8 7z' /></svg></div></div>;
}

function EditSectionActions({ editing, onEdit, onCancel, onSave }: { editing: boolean; onEdit: () => void; onCancel: () => void; onSave: () => void }) {
  if (!editing) return <button onClick={onEdit} title='Edit' style={{ background: 'transparent', border: 'none', color: '#111827', cursor: 'pointer', padding: 4 }}><EditIcon /></button>;
  return <div style={{ display: 'flex', gap: 12 }}><button onClick={onCancel} style={{ height: 32, minWidth: 76, border: '1px solid #d1d5db', background: '#fff', color: '#0B5AA0', borderRadius: 4, fontWeight: 600 }}>Cancel</button><button onClick={onSave} style={{ height: 32, minWidth: 76, border: 'none', background: '#0B5AA0', color: '#fff', borderRadius: 4, fontWeight: 700 }}>Save</button></div>;
}

function EditableReadGrid({ items, editing, columns = 3 }: { items: { label: string; value: string }[]; editing: boolean; columns?: number }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '18px 16px' }}>{items.map(item => <div key={item.label} style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: 8 }}><div style={{ fontSize: 12, color: '#334155', marginBottom: 5 }}>{item.label}</div>{editing ? <input defaultValue={item.value === '-' ? '' : item.value} style={{ ...fieldStyle, height: 30 }} /> : <div style={{ fontSize: 14, fontWeight: 500 }}>{item.value}</div>}</div>)}</div>;
}

function ViewReportForm({ onBack }: { onBack: () => void }) {
  type ReportEditSection = 'details' | 'reference' | 'contact';
  const [editingSection, setEditingSection] = useState<ReportEditSection | null>(null);
  const reportItems = [{ label: 'Report Type', value: 'Police Report' }, { label: 'Report Number', value: 'RPT-2026-0001' }, { label: 'Report Filing Date', value: '06-25-2026' }, { label: 'Precinct Name', value: '-' }, { label: 'Case Status', value: 'Open' }, { label: 'Number of Witness', value: '1' }, { label: 'Description', value: '-' }, { label: 'Comment', value: '-' }];
  const contactItems = [{ label: 'First Name', value: 'Mark' }, { label: 'Last Name', value: 'Last' }, { label: 'Identity Document (ID)', value: '-' }, { label: 'Telephone Number', value: '+1 (216) 555-1111' }, { label: 'Extension', value: '-' }, { label: 'Alternate Telephone Number', value: '-' }, { label: 'Email ID', value: 'Chandrashekharm1@yopmail.com' }];
  const sectionActions = (section: ReportEditSection) => <EditSectionActions editing={editingSection === section} onEdit={() => setEditingSection(section)} onCancel={() => setEditingSection(null)} onSave={() => setEditingSection(null)} />;
  return <div><div style={{ marginBottom: 14 }}><h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>View Report</h1><div style={{ fontSize: 12, marginTop: 6 }}>Loss Information / View Report</div></div><section style={{ border: '1px solid #d8e1ea', borderRadius: 6, background: '#fff', minHeight: 570, display: 'grid', gridTemplateColumns: '0.52fr 1fr' }}><div style={{ padding: 16, borderRight: '1px solid #d8e1ea' }}><Section title='Report Details' actions={sectionActions('details')} style={{ border: 'none', padding: 0, marginBottom: 0 }}><EditableReadGrid columns={2} items={reportItems} editing={editingSection === 'details'} /></Section><div style={{ borderTop: '1px solid #d8e1ea', marginTop: 18, paddingTop: 16 }}><Section title='Uploaded Reference Document' actions={sectionActions('reference')} style={{ border: 'none', padding: 0, marginBottom: 0 }}><div style={{ height: 86, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, fontWeight: 800 }}>No Data Available</div></Section></div></div><div style={{ padding: 16 }}><Section title='Contact Person' actions={sectionActions('contact')} style={{ border: 'none', padding: 0, marginBottom: 0 }}><EditableReadGrid columns={3} items={contactItems} editing={editingSection === 'contact'} /></Section></div></section><BackFooter onBack={onBack} /></div>;
}
function ViewPersonForm({ mode, onBack }: { mode: 'party' | 'witness'; onBack: () => void }) {
  type PersonEditSection = 'primary' | 'idProof' | 'address' | 'contact' | 'comments';
  const [editingSection, setEditingSection] = useState<PersonEditSection | null>(null);
  const isWitness = mode === 'witness';
  const title = isWitness ? 'View Witness' : 'View Party';
  const primaryTitle = isWitness ? 'Witness Primary Information' : 'Party Primary Information';
  const addressTitle = isWitness ? 'Witness Address' : 'Party Address';
  const contactTitle = isWitness ? 'Witness Contact Details' : 'Party Contact Details';
  const primaryItems = isWitness ? [
    { label: 'First Name', value: 'Mark' }, { label: 'Middle Name/Initial', value: 'Mid' }, { label: 'Last Name', value: 'Last' }, { label: 'Date of Birth', value: '-' }, { label: 'Gender', value: '-' }, { label: 'Social Security Number', value: '-' }, { label: 'Relationship with Insured', value: 'Witness' },
  ] : [
    { label: 'Party Type', value: 'Business' }, { label: 'Party Category', value: 'Additional Organization' }, { label: 'Business Name', value: 'Boeing Aviation Co.' }, { label: 'TIN ID', value: '-' }, { label: 'Relationship with Insured', value: '-' },
  ];
  const addressItems = [{ label: 'Address Line 1', value: isWitness ? '10111 Morgan Lane' : '-' }, { label: 'Address Line 2', value: isWitness ? 'Suite # 205' : '-' }, { label: 'Country', value: isWitness ? 'United States' : '-' }, { label: 'State', value: isWitness ? 'California' : '-' }, { label: 'City', value: isWitness ? 'Plainsboro' : '-' }, { label: 'Zip Code', value: isWitness ? '85364' : '-' }, { label: 'Latitude', value: '-' }, { label: 'Longitude', value: '-' }];
  const contactItems = [{ label: 'Telephone Number', value: isWitness ? '+1 (216) 555-1111' : '+1 (212) 555-1111' }, { label: 'Extension', value: '-' }, { label: 'Alternative Telephone Number', value: '-' }, { label: 'Email ID', value: isWitness ? 'Chandrashekharm1@yopmail.com' : 'boeingavi1@test.com' }];
  const sectionActions = (section: PersonEditSection) => <EditSectionActions editing={editingSection === section} onEdit={() => setEditingSection(section)} onCancel={() => setEditingSection(null)} onSave={() => setEditingSection(null)} />;
  return <div><div style={{ marginBottom: 14 }}><h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{title}</h1><div style={{ fontSize: 12, marginTop: 6 }}>Loss Information / {title}</div></div><section style={{ border: '1px solid #d8e1ea', borderRadius: 6, background: '#fff', minHeight: 560, display: 'grid', gridTemplateColumns: '0.52fr 1fr' }}><div style={{ padding: 16, borderRight: '1px solid #d8e1ea' }}><Section title={primaryTitle} actions={sectionActions('primary')} style={{ border: 'none', padding: 0, marginBottom: 0 }}><ProfilePlaceholder /><EditableReadGrid columns={2} items={primaryItems} editing={editingSection === 'primary'} /></Section><div style={{ borderTop: '1px solid #d8e1ea', marginTop: 16, paddingTop: 16 }}><Section title='Uploaded ID proof' actions={sectionActions('idProof')} style={{ border: 'none', padding: 0, marginBottom: 0 }}><div style={{ height: 86, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, fontWeight: 800 }}>No Data Available</div></Section></div></div><div style={{ padding: 16 }}><Section title={addressTitle} actions={sectionActions('address')} style={{ border: 'none', padding: 0, marginBottom: 0 }}><EditableReadGrid columns={3} items={addressItems} editing={editingSection === 'address'} /></Section><div style={{ borderTop: '1px solid #d8e1ea', marginTop: 16, paddingTop: 16 }}><Section title={contactTitle} actions={sectionActions('contact')} style={{ border: 'none', padding: 0, marginBottom: 0 }}><EditableReadGrid columns={2} items={contactItems} editing={editingSection === 'contact'} /></Section></div><div style={{ borderTop: '1px solid #d8e1ea', marginTop: 16, paddingTop: 16 }}><Section title='Additional Comments' actions={sectionActions('comments')} style={{ border: 'none', padding: 0, marginBottom: 0 }}><EditableReadGrid columns={1} items={[{ label: 'Description', value: '-' }]} editing={editingSection === 'comments'} /></Section></div></div></section><BackFooter onBack={onBack} /></div>;
}
function BackFooter({ onBack }: { onBack: () => void }) {
  return <div style={{ position: 'sticky', bottom: 0, height: 58, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', padding: '0 12px', marginTop: 10 }}><button onClick={onBack} style={{ height: 34, minWidth: 132, border: '1px solid #d1d5db', background: '#fff', color: '#0B5AA0', borderRadius: 4, fontWeight: 600 }}>Back</button></div>;
}
function AddReportForm({ onBack }: { onBack: () => void }) {
  return <div><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 14 }}><div><h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>New Report</h1><div style={{ fontSize: 12, marginTop: 6 }}>Loss Information / New Report</div></div></div><section style={{ border: '1px solid #d8e1ea', borderRadius: 6, background: '#fff', minHeight: 560, display: 'grid', gridTemplateColumns: '0.52fr 1fr' }}><div style={{ padding: 16, borderRight: '1px solid #d8e1ea' }}><h2 style={{ fontSize: 18, margin: '0 0 18px' }}>Report Details</h2><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}><SelectField label='Report Type' required /><InputField label='Report Number' required /><InputField label='Report Filing Date' required /><InputField label='Precinct Name' required /><SelectField label='Case Status' required /><InputField label='Number of Witness' required /></div><div style={{ marginTop: 16 }}><FormField label='Description' required><textarea style={{ ...textareaStyle, marginTop: 7 }} /></FormField></div><div style={{ marginTop: 24, fontSize: 13, fontWeight: 700 }}><span style={{ color: '#c62828' }}>* </span>Notify users about document upload?</div><div style={{ display: 'flex', gap: 18, margin: '12px 0 18px' }}><label><input type='radio' name='report-notify' /> Yes</label><label><input type='radio' name='report-notify' defaultChecked /> No</label></div><FormField label='Comment'><textarea style={{ ...textareaStyle, marginTop: 7 }} /></FormField></div><div style={{ padding: 16 }}><h2 style={{ fontSize: 18, margin: '0 0 18px' }}>Contact Person</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}><InputField label='First Name' required /><InputField label='Last Name' required /><InputField label='Identity Document (ID)' required /><InputField label='Telephone Number' required /><InputField label='Extension' /><InputField label='Alternate Telephone Number' /><InputField label='Email ID' required /></div><div style={{ borderTop: '1px solid #d8e1ea', marginTop: 16, paddingTop: 16 }}><h2 style={{ fontSize: 18, margin: '0 0 12px' }}>Upload Reference Document</h2><UploadBox formats='Supported formats are JPG, PNG, DOCS, XLSX, XLS, TXT, PDF, DOC, CSV, and JPEG' /></div></div></section><FormFooter onCancel={onBack} primary='Submit' /></div>;
}

function AddPersonForm({ mode, onBack }: { mode: 'party' | 'witness'; onBack: () => void }) {
  const isWitness = mode === 'witness';
  return <div><div style={{ marginBottom: 14 }}><h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{isWitness ? 'Add Witness' : 'Add Party'}</h1><div style={{ fontSize: 12, marginTop: 6 }}>Loss Information / {isWitness ? 'Add Witness' : 'Add Party'}</div></div><section style={{ border: '1px solid #d8e1ea', borderRadius: 6, background: '#fff', minHeight: 640, display: 'grid', gridTemplateColumns: '0.52fr 1fr' }}><div style={{ padding: 16, borderRight: '1px solid #d8e1ea' }}><h2 style={{ fontSize: 18, margin: '0 0 18px' }}>{isWitness ? 'Witness Primary Information' : 'Party Primary Information'}</h2><div style={{ marginBottom: 18 }}><div style={{ marginBottom: 10 }}>{isWitness ? 'Upload Witness Profile image' : 'Upload Claimant Profile image'}</div><UploadBox /></div>{isWitness ? <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}><InputField label='First Name' required /><InputField label='Middle Name/Initial' /><InputField label='Last Name' required /><InputField label='Date of Birth' required /><SelectField label='Gender' required /><InputField label='Social Security Number' /></div> : <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}><SelectField label='Party Type' required /><SelectField label='Party Category' required /></div>}<div style={{ borderTop: '1px solid #d8e1ea', marginTop: 20, paddingTop: 16 }}><h2 style={{ fontSize: 18, margin: '0 0 12px' }}>Upload ID proof</h2><UploadBox formats='Supported formats are JPG, PNG, DOCS, XLSX, XLS, TXT, PDF, DOC, CSV, and JPEG' /></div></div><div style={{ padding: 16 }}><h2 style={{ fontSize: 18, margin: '0 0 18px' }}>{isWitness ? 'Witness Address' : 'Party Address'}</h2><InputField label='Google Address Search' /><label style={{ display: 'inline-flex', gap: 8, alignItems: 'center', margin: '14px 0' }}><input type='checkbox' />Enter Address Manually</label><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}><InputField label='Address Line 1' required disabled /><InputField label='Address Line 2' disabled /><SelectField label='Country' required disabled options={['United States']} /><SelectField label='State' required disabled /><InputField label='City' required disabled /><InputField label='County' required disabled /><InputField label='Zip Code' required disabled /><InputField label='Latitude' disabled /><InputField label='Longitude' disabled /></div><div style={{ borderTop: '1px solid #d8e1ea', marginTop: 16, paddingTop: 16 }}><h2 style={{ fontSize: 18, margin: '0 0 12px' }}>{isWitness ? 'Witness Contact Details' : 'Party Contact Details'}</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}><InputField label='Telephone Number' required /><InputField label='Extension' /><InputField label='Alternate Telephone Number' /><InputField label='Email ID' required /></div></div><div style={{ borderTop: '1px solid #d8e1ea', marginTop: 16, paddingTop: 16 }}><h2 style={{ fontSize: 18, margin: '0 0 12px' }}>Additional Comments</h2><FormField label='Description'><textarea style={{ ...textareaStyle, marginTop: 7 }} /></FormField></div></div></section><FormFooter onCancel={onBack} primary='Save' /></div>;
}

function FormFooter({ onCancel, primary }: { onCancel: () => void; primary: string }) {
  return <div style={{ position: 'sticky', bottom: 0, height: 58, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, borderTop: '1px solid #e5e7eb', padding: '0 12px', marginTop: 10 }}><button onClick={onCancel} style={{ height: 34, minWidth: 132, border: '1px solid #d1d5db', background: '#fff', color: '#0B5AA0', borderRadius: 4, fontWeight: 600 }}>Cancel</button><button onClick={onCancel} style={{ height: 34, minWidth: 132, border: 'none', background: '#0B5AA0', color: '#fff', borderRadius: 4, fontWeight: 700 }}>{primary}</button></div>;
}

void PartiesTab;
void ViewReportForm;
void ViewPersonForm;
void AddReportForm;
void AddPersonForm;

type WorkflowPersonDto = TempClaimPartyDto | TempClaimWitnessDto;
type WorkflowGridColumn<Row> = { key: string; label: string; value: (row: Row) => string; render?: (row: Row) => ReactNode };

function WorkflowDataList<Row extends { id: number }>({ title, buttonLabel, rows, cols, onAdd, onView, onDelete }: { title: string; buttonLabel: string; rows: Row[]; cols: WorkflowGridColumn<Row>[]; onAdd: () => void; onView: (row: Row) => void; onDelete: (row: Row) => void }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState(cols[0]?.key ?? '');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [valueFilters, setValueFilters] = useState<GenericValueFilters>({});
  const [condFilters, setCondFilters] = useState<GenericCondFilters>({});
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [filterRect, setFilterRect] = useState<DOMRect | null>(null);
  const valueFor = (row: Row, key: string) => cols.find(col => col.key === key)?.value(row) ?? '';
  const searched = rows.filter(row => !search.trim() || cols.some(col => col.value(row).toLowerCase().includes(search.toLowerCase())));
  const filtered = searched.filter(row => cols.every(col => {
    const cell = valueFor(row, col.key).toLowerCase();
    const valueFilter = valueFilters[col.key];
    const conditionFilter = condFilters[col.key];
    if (valueFilter?.length && !valueFilter.some(value => value.toLowerCase() === cell)) return false;
    if (conditionFilter?.value) {
      const target = conditionFilter.value.toLowerCase();
      if (conditionFilter.op === 'Contains' && !cell.includes(target)) return false;
      if (conditionFilter.op === 'Does not contain' && cell.includes(target)) return false;
      if (conditionFilter.op === 'Equals' && cell !== target) return false;
      if (conditionFilter.op === 'Starts with' && !cell.startsWith(target)) return false;
      if (conditionFilter.op === 'Ends with' && !cell.endsWith(target)) return false;
    }
    return true;
  }));
  const sorted = [...filtered].sort((a, b) => sortDir === 'asc' ? valueFor(a, sortKey).localeCompare(valueFor(b, sortKey), undefined, { numeric: true }) : valueFor(b, sortKey).localeCompare(valueFor(a, sortKey), undefined, { numeric: true }));
  const pageRows = sorted.slice((page - 1) * pageSize, page * pageSize);
  const sort = (key: string) => { setSortKey(key); setSortDir(prev => sortKey === key && prev === 'asc' ? 'desc' : 'asc'); setPage(1); };
  const hasFilter = (key: string) => (valueFilters[key]?.length ?? 0) > 0 || !!condFilters[key]?.value;
  const openFilterFor = (event: ReactMouseEvent<HTMLElement>, key: string) => { event.stopPropagation(); setOpenFilter(openFilter === key ? null : key); setFilterRect((event.currentTarget as HTMLElement).getBoundingClientRect()); };
  return <Section title={title} actions={<button onClick={onAdd} style={{ height: 34, minWidth: 132, border: 'none', background: '#0B5AA0', color: '#fff', borderRadius: 4, fontWeight: 700 }}>{buttonLabel}</button>}><label style={{ width: 292, height: 34, border: '1px solid #b6c0cc', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', color: '#6b7280', background: '#f7f9fc', fontSize: 13, marginBottom: 14 }}><SearchIcon /><input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder='Search by Keyword' style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1 }} /></label><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr style={{ background: '#fff' }}><th style={{ width: 42, padding: '10px 10px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb', textAlign: 'center' }}><MenuIcon /></th><th style={{ width: 110, padding: '10px 12px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb', textAlign: 'left' }}>Actions</th>{cols.map(col => <th key={col.key} style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb', textAlign: 'left', whiteSpace: 'nowrap' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{col.label}<button onClick={() => sort(col.key)} title='Sort' style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', display: 'inline-flex' }}><HeaderSortIcon active={sortKey === col.key} direction={sortDir} /></button><button onClick={event => openFilterFor(event, col.key)} title='Filter' style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', color: hasFilter(col.key) ? '#0B5AA0' : '#111827', display: 'inline-flex' }}><FilterIcon /></button></span>{openFilter === col.key && filterRect && <GenericColumnFilterPopup label={col.label} values={rows.map(row => valueFor(row, col.key))} valueFilter={valueFilters[col.key] ?? []} condFilter={condFilters[col.key]} onApplyValue={values => { setValueFilters(prev => ({ ...prev, [col.key]: values })); setPage(1); }} onApplyCondition={filter => { setCondFilters(prev => ({ ...prev, [col.key]: filter })); setPage(1); }} onClear={() => { setValueFilters(prev => { const next = { ...prev }; delete next[col.key]; return next; }); setCondFilters(prev => { const next = { ...prev }; delete next[col.key]; return next; }); setPage(1); }} onClose={() => setOpenFilter(null)} anchorRect={filterRect} />}</th>)}</tr></thead><tbody>{pageRows.length === 0 ? <tr><td colSpan={cols.length + 2} style={{ height: 120, textAlign: 'center', fontSize: 21, fontWeight: 800 }}>No Data Available</td></tr> : pageRows.map((row, index) => <tr key={row.id} style={{ borderBottom: '1px solid #e5e7eb' }}><td style={{ padding: '10px 12px', color: '#64748b', textAlign: 'center' }}>{(page - 1) * pageSize + index + 1}</td><td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}><button onClick={() => onView(row)} title='View' style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer' }}><EyeIcon /></button><button onClick={() => onDelete(row)} title='Delete' style={{ background: 'transparent', border: 'none', padding: 4, marginLeft: 16, cursor: 'pointer' }}><TrashIcon /></button></td>{cols.map(col => <td key={col.key} style={{ padding: '10px 12px' }}>{col.render ? col.render(row) : col.value(row)}</td>)}</tr>)}</tbody></table><PaginationBar page={page} pageSize={pageSize} total={sorted.length} onPageChange={setPage} onPageSizeChange={next => { setPageSize(next); setPage(1); }} /></Section>;
}

function personName(row: WorkflowPersonDto) {
  return emptyText(row.businessName || [row.firstName, row.lastName].filter(Boolean).join(' '));
}

function personColumns(label: string): WorkflowGridColumn<WorkflowPersonDto>[] {
  return [
    { key: 'name', label, value: personName, render: row => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 28, height: 28, borderRadius: '50%', background: '#cfedff', color: '#0B5AA0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>{initialsFrom(personName(row))}</span>{personName(row)}</span> },
    { key: 'relationship', label: 'Relationship with the Insured', value: row => emptyText(row.relationshipWithInsured) },
    { key: 'telephone', label: 'Telephone Number', value: row => emptyText(row.telephoneNumber) },
    { key: 'email', label: 'Email', value: row => emptyText(row.emailId) },
    { key: 'city', label: 'City', value: row => emptyText(row.city) },
    { key: 'state', label: 'State', value: row => emptyText(row.state) },
  ];
}

function FormInput({ label, value, onChange, required }: { label: string; value: string | null | undefined; onChange: (value: string) => void; required?: boolean }) {
  return <FormField label={label} required={required}><input value={value ?? ''} onChange={event => onChange(event.target.value)} style={{ ...fieldStyle, marginTop: 7 }} /></FormField>;
}

function FormSelect({ label, value, onChange, required, options = ['Select...', 'Active', 'Open', 'Closed', 'Pending'] }: { label: string; value: string | null | undefined; onChange: (value: string) => void; required?: boolean; options?: string[] }) {
  return <FormField label={label} required={required}><select value={value ?? ''} onChange={event => onChange(event.target.value)} style={{ ...fieldStyle, marginTop: 7 }}><option value=''>Select...</option>{options.filter(option => option !== 'Select...').map(option => <option key={option} value={option}>{option}</option>)}</select></FormField>;
}

function FormArea({ label, value, onChange, required }: { label: string; value: string | null | undefined; onChange: (value: string) => void; required?: boolean }) {
  return <FormField label={label} required={required}><textarea value={value ?? ''} onChange={event => onChange(event.target.value)} style={{ ...textareaStyle, marginTop: 7 }} /></FormField>;
}

function DbFormFooter({ onCancel, onSave, primary = 'Save' }: { onCancel: () => void; onSave: () => void; primary?: string }) {
  return <div style={{ position: 'sticky', bottom: 0, height: 58, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, borderTop: '1px solid #e5e7eb', padding: '0 12px', marginTop: 10 }}><button onClick={onCancel} style={{ height: 34, minWidth: 132, border: '1px solid #d1d5db', background: '#fff', color: '#0B5AA0', borderRadius: 4, fontWeight: 600 }}>Cancel</button><button onClick={onSave} style={{ height: 34, minWidth: 132, border: 'none', background: '#0B5AA0', color: '#fff', borderRadius: 4, fontWeight: 700 }}>{primary}</button></div>;
}

const emptyReportDraft: UpsertTempClaimReportRequest = { id: null, reportType: null, reportNumber: null, reportFilingDate: null, precinctName: null, caseStatus: null, numberOfWitness: null, description: null, notifyDocumentUpload: false, notifyToName: null, comment: null, contactFirstName: null, contactLastName: null, identityDocument: null, telephoneNumber: null, extension: null, alternateTelephoneNumber: null, emailId: null, referenceDocumentName: null };

function DbAddReportForm({ onBack, onSave }: { onBack: () => void; onSave: (draft: UpsertTempClaimReportRequest) => void }) {
  const [draft, setDraft] = useState<UpsertTempClaimReportRequest>(emptyReportDraft);
  const update = (key: keyof UpsertTempClaimReportRequest, value: string | boolean) => setDraft(prev => ({ ...prev, [key]: typeof value === 'string' ? nullableText(value) : value }));
  return <div><div style={{ marginBottom: 14 }}><h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>New Report</h1><div style={{ fontSize: 12, marginTop: 6 }}>Loss Information / New Report</div></div><section style={{ border: '1px solid #d8e1ea', borderRadius: 6, background: '#fff', minHeight: 560, display: 'grid', gridTemplateColumns: '0.52fr 1fr' }}><div style={{ padding: 16, borderRight: '1px solid #d8e1ea' }}><h2 style={{ fontSize: 18, margin: '0 0 18px' }}>Report Details</h2><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}><FormSelect label='Report Type' value={draft.reportType} onChange={value => update('reportType', value)} required options={['Police Report', 'Inspection Report', 'Incident Report']} /><FormInput label='Report Number' value={draft.reportNumber} onChange={value => update('reportNumber', value)} required /><FormInput label='Report Filing Date' value={draft.reportFilingDate} onChange={value => update('reportFilingDate', value)} required /><FormInput label='Precinct Name' value={draft.precinctName} onChange={value => update('precinctName', value)} required /><FormSelect label='Case Status' value={draft.caseStatus} onChange={value => update('caseStatus', value)} required /><FormInput label='Number of Witness' value={draft.numberOfWitness} onChange={value => update('numberOfWitness', value)} required /></div><div style={{ marginTop: 16 }}><FormArea label='Description' value={draft.description} onChange={value => update('description', value)} required /></div><div style={{ marginTop: 24, fontSize: 13, fontWeight: 700 }}><span style={{ color: '#c62828' }}>* </span>Notify users about document upload?</div><div style={{ display: 'flex', gap: 18, margin: '12px 0 18px' }}><label><input type='radio' checked={draft.notifyDocumentUpload} onChange={() => update('notifyDocumentUpload', true)} /> Yes</label><label><input type='radio' checked={!draft.notifyDocumentUpload} onChange={() => update('notifyDocumentUpload', false)} /> No</label></div><FormInput label='Notify To' value={draft.notifyToName} onChange={value => update('notifyToName', value)} /><FormArea label='Comment' value={draft.comment} onChange={value => update('comment', value)} /></div><div style={{ padding: 16 }}><h2 style={{ fontSize: 18, margin: '0 0 18px' }}>Contact Person</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}><FormInput label='First Name' value={draft.contactFirstName} onChange={value => update('contactFirstName', value)} required /><FormInput label='Last Name' value={draft.contactLastName} onChange={value => update('contactLastName', value)} required /><FormInput label='Identity Document (ID)' value={draft.identityDocument} onChange={value => update('identityDocument', value)} required /><FormInput label='Telephone Number' value={draft.telephoneNumber} onChange={value => update('telephoneNumber', value)} required /><FormInput label='Extension' value={draft.extension} onChange={value => update('extension', value)} /><FormInput label='Alternate Telephone Number' value={draft.alternateTelephoneNumber} onChange={value => update('alternateTelephoneNumber', value)} /><FormInput label='Email ID' value={draft.emailId} onChange={value => update('emailId', value)} required /></div><div style={{ borderTop: '1px solid #d8e1ea', marginTop: 16, paddingTop: 16 }}><h2 style={{ fontSize: 18, margin: '0 0 12px' }}>Upload Reference Document</h2><UploadBox formats='Supported formats are JPG, PNG, DOCS, XLSX, XLS, TXT, PDF, DOC, CSV, and JPEG' /><FormInput label='Reference Document Name' value={draft.referenceDocumentName} onChange={value => update('referenceDocumentName', value)} /></div></div></section><DbFormFooter onCancel={onBack} onSave={() => onSave(draft)} primary='Submit' /></div>;
}

function editableFields<T extends Record<string, unknown>>(draft: T, setDraft: (next: T) => void, keys: { key: keyof T; label: string }[], editing: boolean) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px 16px' }}>{keys.map(item => <div key={String(item.key)} style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: 8 }}><div style={{ fontSize: 12, color: '#334155', marginBottom: 5 }}>{item.label}</div>{editing ? <input value={String(draft[item.key] ?? '')} onChange={event => setDraft({ ...draft, [item.key]: nullableText(event.target.value) })} style={{ ...fieldStyle, height: 30 }} /> : <div style={{ fontSize: 14, fontWeight: 500 }}>{emptyText(draft[item.key])}</div>}</div>)}</div>;
}

function DbViewReportForm({ report, onBack, onSave }: { report: TempClaimReportDto; onBack: () => void; onSave: (draft: UpsertTempClaimReportRequest) => Promise<TempClaimReportDto> }) {
  type ReportEditSection = 'details' | 'reference' | 'contact';
  const [editingSection, setEditingSection] = useState<ReportEditSection | null>(null);
  const [draft, setDraft] = useState<UpsertTempClaimReportRequest>({ ...report });
  const saveSection = async () => { const saved = await onSave(draft); setDraft({ ...saved }); setEditingSection(null); };
  const sectionActions = (section: ReportEditSection) => <EditSectionActions editing={editingSection === section} onEdit={() => setEditingSection(section)} onCancel={() => { setDraft({ ...report }); setEditingSection(null); }} onSave={saveSection} />;
  return <div><div style={{ marginBottom: 14 }}><h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>View Report</h1><div style={{ fontSize: 12, marginTop: 6 }}>Loss Information / View Report</div></div><section style={{ border: '1px solid #d8e1ea', borderRadius: 6, background: '#fff', minHeight: 570, display: 'grid', gridTemplateColumns: '0.52fr 1fr' }}><div style={{ padding: 16, borderRight: '1px solid #d8e1ea' }}><Section title='Report Details' actions={sectionActions('details')} style={{ border: 'none', padding: 0, marginBottom: 0 }}>{editableFields(draft as Record<string, unknown>, next => setDraft(next as UpsertTempClaimReportRequest), [{ key: 'reportType', label: 'Report Type' }, { key: 'reportNumber', label: 'Report Number' }, { key: 'reportFilingDate', label: 'Report Filing Date' }, { key: 'precinctName', label: 'Precinct Name' }, { key: 'caseStatus', label: 'Case Status' }, { key: 'numberOfWitness', label: 'Number of Witness' }, { key: 'description', label: 'Description' }, { key: 'comment', label: 'Comment' }], editingSection === 'details')}</Section><div style={{ borderTop: '1px solid #d8e1ea', marginTop: 18, paddingTop: 16 }}><Section title='Uploaded Reference Document' actions={sectionActions('reference')} style={{ border: 'none', padding: 0, marginBottom: 0 }}>{editableFields(draft as Record<string, unknown>, next => setDraft(next as UpsertTempClaimReportRequest), [{ key: 'referenceDocumentName', label: 'Reference Document Name' }], editingSection === 'reference')}</Section></div></div><div style={{ padding: 16 }}><Section title='Contact Person' actions={sectionActions('contact')} style={{ border: 'none', padding: 0, marginBottom: 0 }}>{editableFields(draft as Record<string, unknown>, next => setDraft(next as UpsertTempClaimReportRequest), [{ key: 'contactFirstName', label: 'First Name' }, { key: 'contactLastName', label: 'Last Name' }, { key: 'identityDocument', label: 'Identity Document (ID)' }, { key: 'telephoneNumber', label: 'Telephone Number' }, { key: 'extension', label: 'Extension' }, { key: 'alternateTelephoneNumber', label: 'Alternate Telephone Number' }, { key: 'emailId', label: 'Email ID' }], editingSection === 'contact')}</Section></div></section><BackFooter onBack={onBack} /></div>;
}

function emptyPersonDraft(isWitness: boolean): Record<string, string | number | null> {
  const common = { id: null, firstName: null, middleName: null, lastName: null, dateOfBirth: null, gender: null, socialSecurityNumber: null, relationshipWithInsured: null, addressLine1: null, addressLine2: null, country: null, state: null, city: null, county: null, zipCode: null, latitude: null, longitude: null, telephoneNumber: null, extension: null, alternateTelephoneNumber: null, emailId: null, description: null, profileImageName: null, idProofName: null };
  return isWitness ? common : { ...common, partyType: null, partyCategory: null, businessName: null, tinId: null };
}

function DbAddPersonForm({ mode, onBack, onSave }: { mode: 'party' | 'witness'; onBack: () => void; onSave: (draft: Record<string, string | number | null>) => void }) {
  const isWitness = mode === 'witness';
  const [draft, setDraft] = useState<Record<string, string | number | null>>(() => emptyPersonDraft(isWitness));
  const update = (key: string, value: string) => setDraft(prev => ({ ...prev, [key]: nullableText(value) }));
  return <div><div style={{ marginBottom: 14 }}><h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{isWitness ? 'Add Witness' : 'Add Party'}</h1><div style={{ fontSize: 12, marginTop: 6 }}>Loss Information / {isWitness ? 'Add Witness' : 'Add Party'}</div></div><section style={{ border: '1px solid #d8e1ea', borderRadius: 6, background: '#fff', minHeight: 640, display: 'grid', gridTemplateColumns: '0.52fr 1fr' }}><div style={{ padding: 16, borderRight: '1px solid #d8e1ea' }}><h2 style={{ fontSize: 18, margin: '0 0 18px' }}>{isWitness ? 'Witness Primary Information' : 'Party Primary Information'}</h2><UploadBox />{isWitness ? <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}><FormInput label='First Name' value={draft.firstName as string | null} onChange={value => update('firstName', value)} required /><FormInput label='Middle Name/Initial' value={draft.middleName as string | null} onChange={value => update('middleName', value)} /><FormInput label='Last Name' value={draft.lastName as string | null} onChange={value => update('lastName', value)} required /><FormInput label='Date of Birth' value={draft.dateOfBirth as string | null} onChange={value => update('dateOfBirth', value)} required /><FormSelect label='Gender' value={draft.gender as string | null} onChange={value => update('gender', value)} required options={['Male', 'Female', 'Other']} /><FormInput label='Social Security Number' value={draft.socialSecurityNumber as string | null} onChange={value => update('socialSecurityNumber', value)} /></div> : <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}><FormSelect label='Party Type' value={draft.partyType as string | null} onChange={value => update('partyType', value)} required options={['Business', 'Individual']} /><FormSelect label='Party Category' value={draft.partyCategory as string | null} onChange={value => update('partyCategory', value)} required options={['Additional Organization', 'Claimant', 'Vendor']} /><FormInput label='Business Name' value={draft.businessName as string | null} onChange={value => update('businessName', value)} /><FormInput label='TIN ID' value={draft.tinId as string | null} onChange={value => update('tinId', value)} /><FormInput label='Relationship with Insured' value={draft.relationshipWithInsured as string | null} onChange={value => update('relationshipWithInsured', value)} /></div>}<div style={{ borderTop: '1px solid #d8e1ea', marginTop: 20, paddingTop: 16 }}><h2 style={{ fontSize: 18, margin: '0 0 12px' }}>Upload ID proof</h2><UploadBox formats='Supported formats are JPG, PNG, DOCS, XLSX, XLS, TXT, PDF, DOC, CSV, and JPEG' /><FormInput label='ID Proof Name' value={draft.idProofName as string | null} onChange={value => update('idProofName', value)} /></div></div><div style={{ padding: 16 }}><h2 style={{ fontSize: 18, margin: '0 0 18px' }}>{isWitness ? 'Witness Address' : 'Party Address'}</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}><FormInput label='Address Line 1' value={draft.addressLine1 as string | null} onChange={value => update('addressLine1', value)} required /><FormInput label='Address Line 2' value={draft.addressLine2 as string | null} onChange={value => update('addressLine2', value)} /><FormInput label='Country' value={draft.country as string | null} onChange={value => update('country', value)} required /><FormInput label='State' value={draft.state as string | null} onChange={value => update('state', value)} required /><FormInput label='City' value={draft.city as string | null} onChange={value => update('city', value)} required /><FormInput label='County' value={draft.county as string | null} onChange={value => update('county', value)} /><FormInput label='Zip Code' value={draft.zipCode as string | null} onChange={value => update('zipCode', value)} required /><FormInput label='Latitude' value={draft.latitude as string | null} onChange={value => update('latitude', value)} /><FormInput label='Longitude' value={draft.longitude as string | null} onChange={value => update('longitude', value)} /></div><div style={{ borderTop: '1px solid #d8e1ea', marginTop: 16, paddingTop: 16 }}><h2 style={{ fontSize: 18, margin: '0 0 12px' }}>{isWitness ? 'Witness Contact Details' : 'Party Contact Details'}</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}><FormInput label='Telephone Number' value={draft.telephoneNumber as string | null} onChange={value => update('telephoneNumber', value)} required /><FormInput label='Extension' value={draft.extension as string | null} onChange={value => update('extension', value)} /><FormInput label='Alternate Telephone Number' value={draft.alternateTelephoneNumber as string | null} onChange={value => update('alternateTelephoneNumber', value)} /><FormInput label='Email ID' value={draft.emailId as string | null} onChange={value => update('emailId', value)} required /></div></div><div style={{ borderTop: '1px solid #d8e1ea', marginTop: 16, paddingTop: 16 }}><FormArea label='Description' value={draft.description as string | null} onChange={value => update('description', value)} /></div></div></section><DbFormFooter onCancel={onBack} onSave={() => onSave(draft)} /></div>;
}

function DbViewPersonForm({ mode, record, onBack, onSave }: { mode: 'party' | 'witness'; record: WorkflowPersonDto; onBack: () => void; onSave: (draft: Record<string, string | number | null>) => Promise<WorkflowPersonDto> }) {
  type PersonEditSection = 'primary' | 'idProof' | 'address' | 'contact' | 'comments';
  const [editingSection, setEditingSection] = useState<PersonEditSection | null>(null);
  const [draft, setDraft] = useState<Record<string, string | number | null>>({ ...record } as Record<string, string | number | null>);
  const isWitness = mode === 'witness';
  const saveSection = async () => { const saved = await onSave(draft); setDraft({ ...saved } as Record<string, string | number | null>); setEditingSection(null); };
  const sectionActions = (section: PersonEditSection) => <EditSectionActions editing={editingSection === section} onEdit={() => setEditingSection(section)} onCancel={() => { setDraft({ ...record } as Record<string, string | number | null>); setEditingSection(null); }} onSave={saveSection} />;
  const primaryFields = isWitness ? [{ key: 'firstName', label: 'First Name' }, { key: 'middleName', label: 'Middle Name/Initial' }, { key: 'lastName', label: 'Last Name' }, { key: 'dateOfBirth', label: 'Date of Birth' }, { key: 'gender', label: 'Gender' }, { key: 'socialSecurityNumber', label: 'Social Security Number' }, { key: 'relationshipWithInsured', label: 'Relationship with Insured' }] : [{ key: 'partyType', label: 'Party Type' }, { key: 'partyCategory', label: 'Party Category' }, { key: 'businessName', label: 'Business Name' }, { key: 'tinId', label: 'TIN ID' }, { key: 'relationshipWithInsured', label: 'Relationship with Insured' }];
  const addressFields = [{ key: 'addressLine1', label: 'Address Line 1' }, { key: 'addressLine2', label: 'Address Line 2' }, { key: 'country', label: 'Country' }, { key: 'state', label: 'State' }, { key: 'city', label: 'City' }, { key: 'county', label: 'County' }, { key: 'zipCode', label: 'Zip Code' }, { key: 'latitude', label: 'Latitude' }, { key: 'longitude', label: 'Longitude' }];
  const contactFields = [{ key: 'telephoneNumber', label: 'Telephone Number' }, { key: 'extension', label: 'Extension' }, { key: 'alternateTelephoneNumber', label: 'Alternative Telephone Number' }, { key: 'emailId', label: 'Email ID' }];
  return <div><div style={{ marginBottom: 14 }}><h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{isWitness ? 'View Witness' : 'View Party'}</h1><div style={{ fontSize: 12, marginTop: 6 }}>Loss Information / {isWitness ? 'View Witness' : 'View Party'}</div></div><section style={{ border: '1px solid #d8e1ea', borderRadius: 6, background: '#fff', minHeight: 560, display: 'grid', gridTemplateColumns: '0.52fr 1fr' }}><div style={{ padding: 16, borderRight: '1px solid #d8e1ea' }}><Section title={isWitness ? 'Witness Primary Information' : 'Party Primary Information'} actions={sectionActions('primary')} style={{ border: 'none', padding: 0, marginBottom: 0 }}><ProfilePlaceholder />{editableFields(draft, setDraft, primaryFields as { key: keyof typeof draft; label: string }[], editingSection === 'primary')}</Section><div style={{ borderTop: '1px solid #d8e1ea', marginTop: 16, paddingTop: 16 }}><Section title='Uploaded ID proof' actions={sectionActions('idProof')} style={{ border: 'none', padding: 0, marginBottom: 0 }}>{editableFields(draft, setDraft, [{ key: 'idProofName', label: 'ID Proof Name' }] as { key: keyof typeof draft; label: string }[], editingSection === 'idProof')}</Section></div></div><div style={{ padding: 16 }}><Section title={isWitness ? 'Witness Address' : 'Party Address'} actions={sectionActions('address')} style={{ border: 'none', padding: 0, marginBottom: 0 }}>{editableFields(draft, setDraft, addressFields as { key: keyof typeof draft; label: string }[], editingSection === 'address')}</Section><div style={{ borderTop: '1px solid #d8e1ea', marginTop: 16, paddingTop: 16 }}><Section title={isWitness ? 'Witness Contact Details' : 'Party Contact Details'} actions={sectionActions('contact')} style={{ border: 'none', padding: 0, marginBottom: 0 }}>{editableFields(draft, setDraft, contactFields as { key: keyof typeof draft; label: string }[], editingSection === 'contact')}</Section></div><div style={{ borderTop: '1px solid #d8e1ea', marginTop: 16, paddingTop: 16 }}><Section title='Additional Comments' actions={sectionActions('comments')} style={{ border: 'none', padding: 0, marginBottom: 0 }}>{editableFields(draft, setDraft, [{ key: 'description', label: 'Description' }] as { key: keyof typeof draft; label: string }[], editingSection === 'comments')}</Section></div></div></section><BackFooter onBack={onBack} /></div>;
}

function DbPartiesTab({ reports, parties, witnesses, onAdd, onViewReport, onViewParty, onViewWitness, onDeleteReport, onDeleteParty, onDeleteWitness }: { reports: TempClaimReportDto[]; parties: TempClaimPartyDto[]; witnesses: TempClaimWitnessDto[]; onAdd: (mode: LossAddMode) => void; onViewReport: (row: TempClaimReportDto) => void; onViewParty: (row: TempClaimPartyDto) => void; onViewWitness: (row: TempClaimWitnessDto) => void; onDeleteReport: (row: TempClaimReportDto) => void; onDeleteParty: (row: TempClaimPartyDto) => void; onDeleteWitness: (row: TempClaimWitnessDto) => void }) {
  const reportCols: WorkflowGridColumn<TempClaimReportDto>[] = [
    { key: 'reportType', label: 'Report Type', value: row => emptyText(row.reportType) },
    { key: 'reportNumber', label: 'Report Number', value: row => emptyText(row.reportNumber) },
    { key: 'reportFilingDate', label: 'Report Filing Date', value: row => emptyText(row.reportFilingDate) },
    { key: 'caseStatus', label: 'Case Status', value: row => emptyText(row.caseStatus) },
    { key: 'contactName', label: 'Contact Person', value: row => emptyText([row.contactFirstName, row.contactLastName].filter(Boolean).join(' ')) },
  ];
  return <><WorkflowDataList title='Reports' buttonLabel='+ Add Report' rows={reports} cols={reportCols} onAdd={() => onAdd('report')} onView={onViewReport} onDelete={onDeleteReport} /><Section title='Insured Details'><ReadGrid items={insuredPartyDetails} /></Section><WorkflowDataList title='Party Details' buttonLabel='+ Add Party' rows={parties} cols={personColumns('Party Name') as WorkflowGridColumn<TempClaimPartyDto>[]} onAdd={() => onAdd('party')} onView={onViewParty} onDelete={onDeleteParty} /><WorkflowDataList title='Witness Details' buttonLabel='+ Add Witness' rows={witnesses} cols={personColumns('Witness Name') as WorkflowGridColumn<TempClaimWitnessDto>[]} onAdd={() => onAdd('witness')} onView={onViewWitness} onDelete={onDeleteWitness} /></>;
}
function LossInformationContent({ claimId, claimData }: { claimId: number; claimData: ClaimDetailDto | null }) {
  const [params, setParams] = useSearchParams();
  const [addMode, setAddMode] = useState<LossAddMode>(null);
  const [viewReport, setViewReport] = useState<TempClaimReportDto | null>(null);
  const [viewParty, setViewParty] = useState<TempClaimPartyDto | null>(null);
  const [viewWitness, setViewWitness] = useState<TempClaimWitnessDto | null>(null);
  const [reports, setReports] = useState<TempClaimReportDto[]>([]);
  const [parties, setParties] = useState<TempClaimPartyDto[]>([]);
  const [witnesses, setWitnesses] = useState<TempClaimWitnessDto[]>([]);
  const activeTab = ((params.get('lossTab') as LossTab | null) ?? 'info');
  const setTab = (next: LossTab) => { const nextParams = new URLSearchParams(params); nextParams.set('screen', 'loss'); nextParams.set('lossTab', next); setParams(nextParams); setAddMode(null); setViewReport(null); setViewParty(null); setViewWitness(null); };
  const backToParties = () => { setAddMode(null); setViewReport(null); setViewParty(null); setViewWitness(null); };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [nextReports, nextParties, nextWitnesses] = await Promise.all([
        claimsApi.getTempReports(claimId) as Promise<TempClaimReportDto[]>,
        claimsApi.getTempParties(claimId) as Promise<TempClaimPartyDto[]>,
        claimsApi.getTempWitnesses(claimId) as Promise<TempClaimWitnessDto[]>,
      ]);
      if (!cancelled) { setReports(nextReports); setParties(nextParties); setWitnesses(nextWitnesses); }
    }
    load().catch(console.error);
    return () => { cancelled = true; };
  }, [claimId]);

  const upsertReport = async (draft: UpsertTempClaimReportRequest) => {
    const saved = await claimsApi.saveTempReport(claimId, draft) as TempClaimReportDto;
    setReports(current => [saved, ...current.filter(row => row.id !== saved.id)]);
    setAddMode(null);
    setViewReport(saved);
    return saved;
  };
  const upsertParty = async (draft: Record<string, string | number | null>) => {
    const saved = await claimsApi.saveTempParty(claimId, draft as UpsertTempClaimPartyRequest) as TempClaimPartyDto;
    setParties(current => [saved, ...current.filter(row => row.id !== saved.id)]);
    setAddMode(null);
    setViewParty(saved);
    return saved;
  };
  const upsertWitness = async (draft: Record<string, string | number | null>) => {
    const saved = await claimsApi.saveTempWitness(claimId, draft as UpsertTempClaimWitnessRequest) as TempClaimWitnessDto;
    setWitnesses(current => [saved, ...current.filter(row => row.id !== saved.id)]);
    setAddMode(null);
    setViewWitness(saved);
    return saved;
  };

  if (viewReport) return <DbViewReportForm report={viewReport} onBack={backToParties} onSave={upsertReport} />;
  if (viewParty) return <DbViewPersonForm mode='party' record={viewParty} onBack={backToParties} onSave={upsertParty} />;
  if (viewWitness) return <DbViewPersonForm mode='witness' record={viewWitness} onBack={backToParties} onSave={upsertWitness} />;
  if (addMode === 'report') return <DbAddReportForm onBack={backToParties} onSave={upsertReport} />;
  if (addMode === 'party') return <DbAddPersonForm mode='party' onBack={backToParties} onSave={upsertParty} />;
  if (addMode === 'witness') return <DbAddPersonForm mode='witness' onBack={backToParties} onSave={upsertWitness} />;

  return <div><div style={{ height: 54, borderBottom: '1px solid #d8e1ea', marginBottom: 16 }}><LossTabButton label='Loss Information' active={activeTab === 'info'} onClick={() => setTab('info')} /><LossTabButton label='Parties Involved' active={activeTab === 'parties'} onClick={() => setTab('parties')} /><LossTabButton label='Loss Exposure' active={activeTab === 'exposure'} onClick={() => setTab('exposure')} /></div>{activeTab === 'parties' ? <DbPartiesTab reports={reports} parties={parties} witnesses={witnesses} onAdd={setAddMode} onViewReport={setViewReport} onViewParty={setViewParty} onViewWitness={setViewWitness} onDeleteReport={async row => { await claimsApi.deleteTempReport(claimId, row.id); setReports(current => current.filter(item => item.id !== row.id)); }} onDeleteParty={async row => { await claimsApi.deleteTempParty(claimId, row.id); setParties(current => current.filter(item => item.id !== row.id)); }} onDeleteWitness={async row => { await claimsApi.deleteTempWitness(claimId, row.id); setWitnesses(current => current.filter(item => item.id !== row.id)); }} /> : activeTab === 'exposure' ? <LossExposureTab claimId={claimId} claimData={claimData} /> : <LossInformationTab claimData={claimData} />}</div>;
}
// ─── Financial Worksheet ──────────────────────────────────────────────────────

type WsReserve = { id?: number; coverageId?: number; coverage: string; coverageLimit: string; colId?: number; causeOfLossDescription: string; causeOfLossCode: string; causeOfLossLimit: string; liabilityClaimDescription: string; liabilityClaimCode: string; liabilityLimit: string; supersedingLimit: string; reserveAmount: string };
type WsPayment = { id?: number; coverage: string; causeOfLossDescription: string; payeeType: string; payeeName: string; liabilityClaim: string; paymentAmount: string };
type Worksheet = { id: number; wsNumber: string; status: string; closeManually: boolean; comments: string; incurred: number; reserve: number; personalLiabilities: number; payment: number; approvedByName: string | null; escalatedToName: string | null; createdByName: string; createdOn: string; updatedByName: string | null; updatedOn: string | null; reserves: WsReserve[]; payments: WsPayment[] };

const PAYEE_TYPE_OPTIONS = ['Insured', 'Claimant', 'Vendor', 'Attorney'];

const fmtAmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function WsStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    Draft:     { bg: '#fff4d6', color: '#9a6400', border: '#d89000' },
    Open:      { bg: '#d7f7e4', color: '#006b3c', border: '#008c55' },
    Approved:  { bg: '#dbeafe', color: '#1e40af', border: '#3b82f6' },
    Escalated: { bg: '#fef3c7', color: '#92400e', border: '#f59e0b' },
    Closed:    { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' },
    Denied:    { bg: '#fee2e2', color: '#991b1b', border: '#ef4444' },
  };
  const c = map[status] ?? { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' };
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 22, padding: '0 10px', borderRadius: 999, border: `1px solid ${c.border}`, background: c.bg, color: c.color, fontSize: 11, fontWeight: 700 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: c.color }} />{status}</span>;
}

function WsPaidBadge() {
  return <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 22, padding: '0 14px', borderRadius: 999, background: '#008c55', color: '#fff', fontSize: 11, fontWeight: 700 }}>Paid</span>;
}


function emptyReserve(): WsReserve { return { coverageId: undefined, coverage: '', coverageLimit: '0.00', colId: undefined, causeOfLossDescription: '', causeOfLossCode: '', causeOfLossLimit: '0.00', liabilityClaimDescription: '', liabilityClaimCode: '', liabilityLimit: '0.00', supersedingLimit: '0.00', reserveAmount: '0.00' }; }
function calcSuperseding(cl: string, cll: string, ll: string): string {
  const vals = [parseFloat(cl), parseFloat(cll), parseFloat(ll)].filter(v => !isNaN(v) && v > 0);
  if (vals.length === 0) return '0.00';
  return Math.min(...vals).toFixed(2);
}
function emptyPayment(): WsPayment { return { coverage: '', causeOfLossDescription: '', payeeType: '', payeeName: '', liabilityClaim: '', paymentAmount: '0.00' }; }

function WsFormContent({ ws, claimId, onDone }: { ws: Worksheet | null; claimId: number; onDone: (saved: Worksheet) => void }) {
  const [tab, setTab] = useState<'reserve' | 'payment'>('reserve');
  const [reserves, setReserves] = useState<WsReserve[]>(ws?.reserves?.map(r => ({ ...r, coverageLimit: String(r.coverageLimit ?? '0.00'), causeOfLossLimit: String(r.causeOfLossLimit ?? '0.00'), liabilityLimit: String(r.liabilityLimit ?? '0.00'), supersedingLimit: String(r.supersedingLimit ?? '0.00'), reserveAmount: String(r.reserveAmount ?? '0.00') })) ?? []);
  const [payments, setPayments] = useState<WsPayment[]>(ws?.payments?.map(p => ({ ...p, paymentAmount: String(p.paymentAmount ?? '0.00') })) ?? []);
  const [closeManually, setCloseManually] = useState(ws?.closeManually ?? false);
  const [comments, setComments] = useState(ws?.comments ?? '');
  const [saving, setSaving] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [worksheetCoverageOptions, setWorksheetCoverageOptions] = useState<CoverageOptionDto[]>([]);
  const [wsColOptions, setWsColOptions] = useState<CoverageOptionDto[]>([]);
  const [rowAssets, setRowAssets] = useState<Record<number, string[]>>({});
  useEffect(() => {
    let cancelled = false;
    claimsApi.getReferenceData().then(rd => {
      if (cancelled) return;
      setWorksheetCoverageOptions(rd.personalLiabilityCoverageTypes);
      setWsColOptions(rd.causesOfLoss);
    }).catch(console.error);
    return () => { cancelled = true; };
  }, []);

  // Pre-populate rowAssets and coverageId for saved worksheet rows on resume.
  // The original entity stores coverage as a name string (no CoverageId column),
  // so we reverse-lookup by name against the already-loaded options list.
  useEffect(() => {
    if (!worksheetCoverageOptions.length || !ws?.reserves?.length) return;
    let cancelled = false;
    (async () => {
      const assetUpdates: Record<number, string[]> = {};
      const coverageIdUpdates: Record<number, number> = {};
      await Promise.all(ws.reserves.map(async (r, i) => {
        if (!r.coverage) return;
        const opt = worksheetCoverageOptions.find(c => c.name === r.coverage);
        if (!opt) return;
        coverageIdUpdates[i] = opt.id;
        try {
          const assets = await claimsApi.getImpactedAssetsForCoverage(opt.id);
          if (!cancelled) assetUpdates[i] = assets;
        } catch { /* ignore, dropdown will just be empty for this row */ }
      }));
      if (cancelled) return;
      if (Object.keys(assetUpdates).length) setRowAssets(prev => ({ ...prev, ...assetUpdates }));
      if (Object.keys(coverageIdUpdates).length) {
        setReserves(prev => prev.map((r, i) =>
          coverageIdUpdates[i] !== undefined ? { ...r, coverageId: coverageIdUpdates[i] } : r
        ));
      }
    })();
    return () => { cancelled = true; };
  }, [worksheetCoverageOptions]);

  const currencyRef = useRef<HTMLDivElement>(null);
  useWorkflowOutsideClick(currencyRef, () => setCurrencyOpen(false));

  const reserveTotal = reserves.reduce((s, r) => s + (parseFloat(r.reserveAmount) || 0), 0);
  const paymentTotal = payments.reduce((s, p) => s + (parseFloat(p.paymentAmount) || 0), 0);

  const updateReserve = (i: number, patch: Partial<WsReserve>) =>
    setReserves(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));

  const handleReserveCoverageChange = async (i: number, opt: CoverageOptionDto) => {
    updateReserve(i, { coverageId: opt.id, coverage: opt.name, coverageLimit: '0.00', liabilityClaimDescription: '', liabilityClaimCode: '', liabilityLimit: '0.00', supersedingLimit: '0.00' });
    setRowAssets(prev => ({ ...prev, [i]: [] }));
    try {
      const [limitRes, assets] = await Promise.all([
        claimsApi.getCoverageLimit(opt.id),
        claimsApi.getImpactedAssetsForCoverage(opt.id),
      ]);
      const cl = limitRes.limit ?? '0.00';
      setRowAssets(prev => ({ ...prev, [i]: assets }));
      setReserves(prev => prev.map((r, idx) => {
        if (idx !== i) return r;
        return { ...r, coverageLimit: cl, supersedingLimit: calcSuperseding(cl, r.causeOfLossLimit, r.liabilityLimit) };
      }));
    } catch { /* leave as 0.00 */ }
  };

  const handleReserveColChange = async (i: number, opt: CoverageOptionDto) => {
    updateReserve(i, { colId: opt.id, causeOfLossDescription: opt.name, causeOfLossCode: '', causeOfLossLimit: '0.00' });
    try {
      const res = await claimsApi.getColLossLimit(opt.id);
      const cll = res.limit != null ? res.limit.toFixed(2) : '0.00';
      const code = res.code ?? '';
      setReserves(prev => prev.map((r, idx) => {
        if (idx !== i) return r;
        return { ...r, causeOfLossCode: code, causeOfLossLimit: cll, supersedingLimit: calcSuperseding(r.coverageLimit, cll, r.liabilityLimit) };
      }));
    } catch { /* leave as 0.00 */ }
  };

  const handleReserveAssetChange = async (i: number, assetType: string) => {
    const coverageId = reserves[i]?.coverageId;
    updateReserve(i, { liabilityClaimDescription: assetType, liabilityClaimCode: '', liabilityLimit: '0.00' });
    if (!coverageId) return;
    try {
      const res = await claimsApi.getAssetDetail(coverageId, assetType);
      const ll = res.limit != null ? res.limit.toFixed(2) : '0.00';
      setReserves(prev => prev.map((r, idx) => {
        if (idx !== i) return r;
        return { ...r, liabilityClaimCode: res.code ?? '', liabilityLimit: ll, supersedingLimit: calcSuperseding(r.coverageLimit, r.causeOfLossLimit, ll) };
      }));
    } catch { /* leave as 0.00 */ }
  };

  const updatePayment = (i: number, field: keyof WsPayment, val: string) => setPayments(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p));

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await claimsApi.saveWorksheet(claimId, {
        id: ws?.id ?? null,
        closeManually,
        comments,
        reserves: reserves.map(r => ({ id: r.id ?? null, coverage: r.coverage || null, coverageLimit: parseFloat(r.coverageLimit) || null, causeOfLossDescription: r.causeOfLossDescription || null, causeOfLossCode: r.causeOfLossCode || null, causeOfLossLimit: parseFloat(r.causeOfLossLimit) || null, liabilityClaimDescription: r.liabilityClaimDescription || null, liabilityClaimCode: r.liabilityClaimCode || null, liabilityLimit: parseFloat(r.liabilityLimit) || null, supersedingLimit: parseFloat(r.supersedingLimit) || null, reserveAmount: parseFloat(r.reserveAmount) || 0 })),
        payments: payments.map(p => ({ id: p.id ?? null, coverage: p.coverage || null, causeOfLossDescription: p.causeOfLossDescription || null, payeeType: p.payeeType || null, payeeName: p.payeeName || null, liabilityClaim: p.liabilityClaim || null, paymentAmount: parseFloat(p.paymentAmount) || 0 })),
      }) as Worksheet;
      onDone(saved);
    } catch (e: any) {
      const detail = e?.response?.data?.error ?? e?.message ?? 'Unknown error';
      alert(`Failed to save worksheet: ${detail}`);
    } finally {
      setSaving(false);
    }
  };

  const thStyle: React.CSSProperties = {
    padding: '10px 12px',
    background: '#f0f4f8',
    border: '1px solid #d7dee6',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 600,
    color: '#374151',
    whiteSpace: 'nowrap',
  };
  const tdStyle: React.CSSProperties = { padding: '6px 8px', border: '1px solid #e5e7eb', fontSize: 12 };
  const inputStyle: React.CSSProperties = { width: '100%', height: 30, border: '1px solid #b6c0cc', borderRadius: 3, padding: '0 7px', fontSize: 12, boxSizing: 'border-box' };
  const selectStyle: React.CSSProperties = { ...inputStyle };

  // Reserve column widths (11 cols): add up to 100%
  const reserveColWidths = ['11%', '8%', '12%', '8%', '7%', '12%', '8%', '8%', '9%', '9%', '5%'];
  // Payment column widths (7 cols)
  const paymentColWidths = ['14%', '18%', '13%', '18%', '18%', '12%', '5%'];

  return (
    <div>
      {/* Reserve / Payment tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e5e7eb', marginBottom: 20 }}>
        {(['reserve', 'payment'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '10px 24px',
              border: 'none',
              background: 'none',
              fontSize: 13,
              fontWeight: tab === t ? 700 : 500,
              color: tab === t ? '#0B5AA0' : '#6b7280',
              borderBottom: tab === t ? '2px solid #0B5AA0' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            {t === 'reserve' ? 'Reserve' : 'Payment'}
          </button>
        ))}
      </div>

      {/* ─── RESERVE TAB ─── */}
      {tab === 'reserve' && (
        <div style={{ border: '1px solid #e0e6ee', borderRadius: 6, padding: '16px 16px 0 16px', marginBottom: 0 }}>
          {/* Section header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <strong style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Reserve</strong>
            <div ref={currencyRef} style={{ position: 'relative' }}>
              <button onClick={() => setCurrencyOpen(v => !v)} style={{ height: 30, padding: '0 12px', border: '1px solid #b6c0cc', borderRadius: 4, background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {currency}
                <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5'><path d='M6 9l6 6 6-6' /></svg>
              </button>
              {currencyOpen && (
                <div style={{ position: 'absolute', right: 0, top: 34, background: '#fff', border: '1px solid #d1d5db', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.12)', zIndex: 50, minWidth: 80 }}>
                  {['CAD', 'USD'].map(c => (
                    <button key={c} onClick={() => { setCurrency(c); setCurrencyOpen(false); }} style={{ display: 'block', width: '100%', padding: '8px 16px', border: 'none', background: currency === c ? '#f0f4f8' : 'none', textAlign: 'left', fontSize: 13, cursor: 'pointer', color: '#111827', fontWeight: currency === c ? 600 : 400 }}>{c}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Reserve table — full width */}
          <div style={{ overflowX: 'auto', marginBottom: 12 }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%', minWidth: 900, tableLayout: 'fixed' }}>
              <colgroup>
                {reserveColWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
              </colgroup>
              <thead>
                <tr>
                  {['Coverage', 'Coverage Limit', 'Cause of Loss Description', 'Cause of Loss Code', 'Loss Limit', 'Impacted Asset Description', 'Impacted Asset Code', 'Impacted Asset Limit', 'Superseding Limit', 'Reserve Amount', 'Action'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reserves.map((r, i) => (
                  <tr key={i}>
                    <td style={tdStyle}><select style={selectStyle} value={r.coverage} onChange={e => { const opt = worksheetCoverageOptions.find(o => o.name === e.target.value); if (opt) handleReserveCoverageChange(i, opt); }}><option value=''>Select...</option>{worksheetCoverageOptions.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}</select></td>
                    <td style={tdStyle}><input style={{ ...inputStyle, background: '#f5f7fa', color: '#6b7280' }} value={r.coverageLimit} readOnly /></td>
                    <td style={tdStyle}><select style={selectStyle} value={r.causeOfLossDescription} onChange={e => { const opt = wsColOptions.find(o => o.name === e.target.value); if (opt) handleReserveColChange(i, opt); }}><option value=''>Select...</option>{wsColOptions.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}</select></td>
                    <td style={tdStyle}><input style={{ ...inputStyle, background: '#f5f7fa', color: '#6b7280' }} value={r.causeOfLossCode} readOnly /></td>
                    <td style={tdStyle}><input style={{ ...inputStyle, background: '#f5f7fa', color: '#6b7280' }} value={r.causeOfLossLimit} readOnly /></td>
                    <td style={tdStyle}><select style={selectStyle} value={r.liabilityClaimDescription} onChange={e => handleReserveAssetChange(i, e.target.value)}><option value=''>Select...</option>{(rowAssets[i] ?? []).map(a => <option key={a} value={a}>{a}</option>)}</select></td>
                    <td style={tdStyle}><input style={{ ...inputStyle, background: '#f5f7fa', color: '#6b7280' }} value={r.liabilityClaimCode} readOnly /></td>
                    <td style={tdStyle}><input style={{ ...inputStyle, background: '#f5f7fa', color: '#6b7280' }} value={r.liabilityLimit} readOnly /></td>
                    <td style={tdStyle}><input style={{ ...inputStyle, background: '#f5f7fa', color: '#6b7280' }} value={r.supersedingLimit} readOnly /></td>
                    <td style={tdStyle}><input style={inputStyle} value={r.reserveAmount} onChange={e => updateReserve(i, { reserveAmount: e.target.value })} /></td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button onClick={() => setReserves(prev => prev.filter((_, j) => j !== i))} title='Remove' style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }}>
                        <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6' /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
                <tr style={{ background: '#f8fafc' }}>
                  <td colSpan={9} style={{ ...tdStyle, fontWeight: 700, color: '#111827' }}>Total</td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: '#111827' }}>{fmtAmt(reserveTotal)}</td>
                  <td style={tdStyle} />
                </tr>
              </tbody>
            </table>
          </div>

          {/* Add Reserve */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 14 }}>
            <button
              onClick={() => setReserves(prev => [...prev, emptyReserve()])}
              style={{ height: 32, padding: '0 14px', border: '1px solid #0B5AA0', borderRadius: 4, color: '#0B5AA0', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              + Add Reserve
            </button>
          </div>
        </div>
      )}

      {/* ─── PAYMENT TAB ─── */}
      {tab === 'payment' && (
        <div style={{ border: '1px solid #e0e6ee', borderRadius: 6, padding: '16px 16px 0 16px', marginBottom: 0 }}>
          {/* Section header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <strong style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Payment</strong>
            <div ref={currencyRef} style={{ position: 'relative' }}>
              <button onClick={() => setCurrencyOpen(v => !v)} style={{ height: 30, padding: '0 12px', border: '1px solid #b6c0cc', borderRadius: 4, background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {currency}
                <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5'><path d='M6 9l6 6 6-6' /></svg>
              </button>
              {currencyOpen && (
                <div style={{ position: 'absolute', right: 0, top: 34, background: '#fff', border: '1px solid #d1d5db', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.12)', zIndex: 50, minWidth: 80 }}>
                  {['CAD', 'USD'].map(c => (
                    <button key={c} onClick={() => { setCurrency(c); setCurrencyOpen(false); }} style={{ display: 'block', width: '100%', padding: '8px 16px', border: 'none', background: currency === c ? '#f0f4f8' : 'none', textAlign: 'left', fontSize: 13, cursor: 'pointer', color: '#111827', fontWeight: currency === c ? 600 : 400 }}>{c}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Payment table — full width */}
          <div style={{ overflowX: 'auto', marginBottom: 12 }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%', minWidth: 700, tableLayout: 'fixed' }}>
              <colgroup>
                {paymentColWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
              </colgroup>
              <thead>
                <tr>
                  {['Coverage', 'Cause of Loss Description', 'Payee Type', 'Payee Name', 'Liability Claim', 'Payment Amount', 'Action'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={i}>
                    <td style={tdStyle}><select style={selectStyle} value={p.coverage} onChange={e => updatePayment(i, 'coverage', e.target.value)}><option value=''>Select...</option>{worksheetCoverageOptions.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}</select></td>
                    <td style={tdStyle}><select style={selectStyle} value={p.causeOfLossDescription} onChange={e => updatePayment(i, 'causeOfLossDescription', e.target.value)}><option value=''>Select...</option>{wsColOptions.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}</select></td>
                    <td style={tdStyle}><select style={selectStyle} value={p.payeeType} onChange={e => updatePayment(i, 'payeeType', e.target.value)}><option value=''>Select...</option>{PAYEE_TYPE_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></td>
                    <td style={tdStyle}><input style={inputStyle} value={p.payeeName} onChange={e => updatePayment(i, 'payeeName', e.target.value)} /></td>
                    <td style={tdStyle}><select style={selectStyle} value={p.liabilityClaim} onChange={e => updatePayment(i, 'liabilityClaim', e.target.value)}><option value=''>Select...</option>{worksheetCoverageOptions.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}</select></td>
                    <td style={tdStyle}><input style={inputStyle} value={p.paymentAmount} onChange={e => updatePayment(i, 'paymentAmount', e.target.value)} /></td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button onClick={() => setPayments(prev => prev.filter((_, j) => j !== i))} title='Remove' style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }}>
                        <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6' /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
                <tr style={{ background: '#f8fafc' }}>
                  <td style={tdStyle}>Deductible</td>
                  <td colSpan={4} style={tdStyle} />
                  <td style={tdStyle}><input style={inputStyle} defaultValue='0.00' /></td>
                  <td style={tdStyle} />
                </tr>
                <tr style={{ background: '#f8fafc' }}>
                  <td colSpan={5} style={{ ...tdStyle, fontWeight: 700, color: '#111827' }}>Total</td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: '#111827' }}>{fmtAmt(paymentTotal)}</td>
                  <td style={tdStyle} />
                </tr>
              </tbody>
            </table>
          </div>

          {/* Add Payment */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 14 }}>
            <button
              onClick={() => setPayments(prev => [...prev, emptyPayment()])}
              style={{ height: 32, padding: '0 14px', border: '1px solid #0B5AA0', borderRadius: 4, color: '#0B5AA0', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              + Add Payment
            </button>
          </div>
        </div>
      )}

      {/* Close Manually */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20, marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Close Manually</span>
        <button
          onClick={() => setCloseManually(v => !v)}
          style={{ width: 44, height: 24, borderRadius: 12, background: closeManually ? '#0B5AA0' : '#d1d5db', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
        >
          <span style={{ position: 'absolute', top: 3, left: closeManually ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
        </button>
      </div>

      {/* Comments */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6, color: '#374151' }}>Comments</label>
        <textarea
          value={comments}
          onChange={e => setComments(e.target.value)}
          placeholder='Type your message here'
          style={{ width: '100%', minHeight: 80, border: '1px solid #b6c0cc', borderRadius: 4, padding: '10px 12px', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
        />
      </div>

      {/* Worksheet metadata */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24, fontSize: 12, borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
        {[
          ['Worksheet Created by', ws?.createdByName ?? '-'],
          ['Worksheet Created on', ws?.createdOn ?? '-'],
          ['Worksheet Updated by', ws?.updatedByName ?? '-'],
          ['Worksheet Updated On', ws?.updatedOn ?? '-'],
        ].map(([label, val]) => (
          <div key={label}>
            <div style={{ color: '#6b7280', marginBottom: 4 }}>{label}</div>
            <div style={{ fontWeight: 500, color: '#111827' }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Footer actions */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: 14, paddingBottom: 4 }}>
        <button onClick={() => onDone(ws!)} style={{ height: 36, minWidth: 100, border: '1px solid #d1d5db', background: '#fff', color: '#374151', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
        <button onClick={() => handleSave()} disabled={saving} style={{ height: 36, minWidth: 100, border: '1px solid #0B5AA0', background: '#fff', color: '#0B5AA0', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Save</button>
        <button onClick={() => handleSave()} disabled={saving} style={{ height: 36, minWidth: 100, border: 'none', background: '#0B5AA0', color: '#fff', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Book</button>
      </div>
    </div>
  );
}

function EscalateModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: (userId: number, userName: string) => void }) {
  const [users, setUsers] = useState<AssignableUserDto[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AssignableUserDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    claimsApi.getAssignableUsers().then(u => { setUsers(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = users.filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.userCode.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 8, width: 480, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
        {/* Header */}
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Escalate Worksheet</div>
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder='Search by name or user code…'
            style={{ width: '100%', height: 36, border: '1px solid #d1d5db', borderRadius: 5, padding: '0 12px', fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
          />
        </div>
        {/* User list */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
          {loading && <div style={{ padding: 24, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>Loading users…</div>}
          {!loading && filtered.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>No users found</div>}
          {filtered.map(u => (
            <div
              key={u.id}
              onClick={() => setSelected(u)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 22px', cursor: 'pointer',
                background: selected?.id === u.id ? '#eff6ff' : 'transparent',
                borderLeft: selected?.id === u.id ? '3px solid #0B5AA0' : '3px solid transparent',
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0B5AA0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                {u.name.split(' ').slice(0, 2).map(p => p[0]?.toUpperCase()).join('')}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{u.name}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{u.userCode}</div>
              </div>
            </div>
          ))}
        </div>
        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onCancel} style={{ height: 34, minWidth: 90, border: '1px solid #d1d5db', background: '#fff', color: '#374151', borderRadius: 5, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button
            onClick={() => { if (selected) onConfirm(selected.id, selected.name); }}
            disabled={!selected}
            style={{ height: 34, minWidth: 90, border: 'none', background: selected ? '#0B5AA0' : '#e2e8f0', color: selected ? '#fff' : '#9ca3af', borderRadius: 5, fontWeight: 700, fontSize: 13, cursor: selected ? 'pointer' : 'default' }}
          >
            Escalate
          </button>
        </div>
      </div>
    </div>
  );
}

function WorksheetContent({ claimId }: { claimId: number }) {
  const [viewMode, setViewMode] = useState<'accumulated' | 'movement'>('accumulated');
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editing, setEditing] = useState<Worksheet | null | 'new'>(null);
  const [escalateOpen, setEscalateOpen] = useState(false);

  useEffect(() => {
    claimsApi.getWorksheets(claimId).then((data: { worksheets: Worksheet[] }) => setWorksheets(data.worksheets ?? [])).catch(console.error);
  }, [claimId]);

  const toggleSelect = (id: number) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleAction = async (action: 'approve' | 'deny') => {
    const ids = Array.from(selected);
    const results: Worksheet[] = [];
    for (const id of ids) {
      const saved = await (action === 'approve' ? claimsApi.approveWorksheet(claimId, id) : claimsApi.denyWorksheet(claimId, id)) as Worksheet;
      results.push(saved);
    }
    setWorksheets(prev => prev.map(w => results.find(r => r.id === w.id) ?? w));
    setSelected(new Set());
  };

  const handleEscalate = async (escalateTo: number) => {
    const ids = Array.from(selected);
    const results: Worksheet[] = [];
    for (const id of ids) {
      const saved = await claimsApi.escalateWorksheet(claimId, id, escalateTo) as Worksheet;
      results.push(saved);
    }
    setWorksheets(prev => prev.map(w => results.find(r => r.id === w.id) ?? w));
    setSelected(new Set());
    setEscalateOpen(false);
  };

  const rows = [
    { key: 'incurred',           label: 'Incurred' },
    { key: 'reserve',            label: 'Reserve' },
    { key: 'personalLiabilities',label: 'Personal liabilities' },
    { key: 'payment',            label: 'Payment' },
    { key: 'approvedByName',     label: 'WS Approved By', text: true },
    { key: 'escalatedToName',    label: 'WS Escalated To', text: true },
  ] as const;

  if (editing !== null) {
    return (
      <div>
        <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0B5AA0', fontSize: 13, padding: 0 }}>← Back</button>
          <span style={{ fontSize: 13, color: '#6b7280' }}>/ {editing === 'new' ? 'Add Worksheet' : `WS ID ${(editing as Worksheet).wsNumber}`}</span>
        </div>
        <WsFormContent
          ws={editing === 'new' ? null : editing as Worksheet}
          claimId={claimId}
          onDone={saved => {
            if (editing === 'new') setWorksheets(prev => [...prev, saved]);
            else setWorksheets(prev => prev.map(w => w.id === saved.id ? saved : w));
            setEditing(null);
          }}
        />
      </div>
    );
  }

  const canAct = selected.size > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        {/* Accumulated / Movement toggle — pill style */}
        <div style={{ display: 'inline-flex', background: '#f1f5f9', borderRadius: 999, padding: 3, gap: 2 }}>
          {(['accumulated', 'movement'] as const).map(m => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              style={{
                padding: '7px 22px',
                borderRadius: 999,
                border: 'none',
                background: viewMode === m ? '#0B5AA0' : 'transparent',
                color: viewMode === m ? '#fff' : '#374151',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Currency: USD</span>
          <button
            onClick={() => setEditing('new')}
            style={{ height: 36, padding: '0 18px', background: '#0B5AA0', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            + Add Worksheet
          </button>
        </div>
      </div>

      {/* Matrix table — outer div provides gray right-hand background */}
      <div style={{ overflowX: 'auto', border: '1px solid #d8e1ea', borderRadius: 6, background: '#f0f2f5' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 13, width: 'auto' }}>
          <thead>
            <tr style={{ background: '#fafbfc' }}>
              {/* Empty label cell */}
              <th style={{ width: 240, minWidth: 240, padding: '14px 16px', background: '#fff', borderBottom: '2px solid #d7dee6', borderRight: '1px solid #d7dee6', textAlign: 'left' }} />
              {worksheets.map(ws => {
                const isDraft = ws.status === 'Draft';
                const isPaid  = (ws.payment ?? 0) > 0;
                const dateLabel = ws.updatedOn ?? ws.createdOn ?? '-';
                return (
                  <th
                    key={ws.id}
                    onClick={() => toggleSelect(ws.id)}
                    style={{
                      width: 190,
                      minWidth: 190,
                      padding: '14px 16px',
                      background: selected.has(ws.id) ? '#eff6ff' : '#fafbfc',
                      borderBottom: '2px solid #d7dee6',
                      borderRight: '1px solid #d7dee6',
                      textAlign: 'center',
                      verticalAlign: 'top',
                      cursor: 'pointer',
                      transition: 'background 0.12s',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0B5AA0', marginBottom: 4 }}>WS ID {ws.wsNumber}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>{isDraft ? '-' : dateLabel}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                      <WsStatusBadge status={ws.status} />
                      {isPaid && <WsPaidBadge />}
                    </div>
                    {isDraft && (
                      <div style={{ marginTop: 8 }}>
                        <button
                          onClick={e => { e.stopPropagation(); setEditing(ws); }}
                          title='Edit'
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151', padding: 3 }}
                        >
                          <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                            <path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' />
                            <path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' />
                          </svg>
                        </button>
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={row.key}>
                <td style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #d7dee6', fontWeight: 600, fontSize: 13, color: row.key === 'personalLiabilities' ? '#0B5AA0' : '#111827', background: '#fff', whiteSpace: 'nowrap' }}>
                  {row.label}
                </td>
                {worksheets.length === 0 && ri === 0 && (
                  <td rowSpan={rows.length} style={{ padding: '60px 0', textAlign: 'center', color: '#9ca3af', fontSize: 15, fontWeight: 500, background: '#fff' }}>
                    No worksheets found
                  </td>
                )}
                {worksheets.map(ws => {
                  const val = ws[row.key];
                  const isText = (row as { text?: boolean }).text;
                  return (
                    <td
                      key={ws.id}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #e5e7eb',
                        borderRight: '1px solid #d7dee6',
                        textAlign: isText ? 'center' : 'right',
                        fontSize: 13,
                        color: '#111827',
                        background: selected.has(ws.id) ? '#eff6ff' : '#fff',
                      }}
                    >
                      {isText ? (val ?? '-') : fmtAmt(typeof val === 'number' ? val : 0)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
        <button
          onClick={() => handleAction('deny')}
          disabled={!canAct}
          style={{ height: 36, minWidth: 80, border: '1px solid #d1d5db', background: '#fff', color: canAct ? '#374151' : '#9ca3af', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: canAct ? 'pointer' : 'default' }}
        >
          Deny
        </button>
        <button
          onClick={() => setEscalateOpen(true)}
          disabled={!canAct}
          style={{ height: 36, minWidth: 80, border: '1px solid #d1d5db', background: '#fff', color: canAct ? '#374151' : '#9ca3af', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: canAct ? 'pointer' : 'default' }}
        >
          Escalate
        </button>
        <button
          onClick={() => handleAction('approve')}
          disabled={!canAct}
          style={{ height: 36, minWidth: 80, border: 'none', background: canAct ? '#0B5AA0' : '#e2e8f0', color: canAct ? '#fff' : '#9ca3af', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: canAct ? 'pointer' : 'default' }}
        >
          Approve
        </button>
      </div>
      {escalateOpen && (
        <EscalateModal
          onCancel={() => setEscalateOpen(false)}
          onConfirm={(userId) => handleEscalate(userId)}
        />
      )}
    </div>
  );
}

// ─── Financials - Claims Payee ────────────────────────────────────────────────
type PayeeRow = {
  id:                   number;
  initials:             string;
  avatarColor:          string;
  payeeName:            string;
  payeeType:            string;
  paymentMethod:        string;
  complianceCheckStatus:string;
  status:               string;
};

function dtoToRow(dto: PayeeListItemDto): PayeeRow {
  return {
    id:                    dto.id,
    initials:              dto.initials,
    avatarColor:           dto.avatarColor,
    payeeName:             dto.payeeName,
    payeeType:             dto.payeeType,
    paymentMethod:         dto.paymentMethod,
    complianceCheckStatus: dto.complianceCheck,
    status:                dto.status,
  };
}

type PayeeColKey = 'payeeName' | 'payeeType' | 'paymentMethod' | 'complianceCheckStatus' | 'status';

const PAYEE_COLS: { key: PayeeColKey; label: string }[] = [
  { key: 'payeeName',            label: 'Payee Name' },
  { key: 'payeeType',            label: 'Payee Type' },
  { key: 'paymentMethod',        label: 'Payment Method' },
  { key: 'complianceCheckStatus',label: 'Compliance Check Status' },
  { key: 'status',               label: 'Status' },
];

function PayeeKpiCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div style={{ flex: 1, minWidth: 0, background: '#fff', border: '1px solid #e4eaf0', borderRadius: 6, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: 13, color: '#555', marginBottom: 6, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      </div>
      <div style={{ opacity: 0.85 }}>{icon}</div>
    </div>
  );
}

function HandIcon({ color, variant }: { color: string; variant: 'dollar' | 'pen' | 'info' | 'check' | 'x' }) {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 30c0 0 2-4 8-4h8c2 0 3-1 3-3s-1-3-3-3h-4" />
      <path d="M10 30l2 8h20l2-4 6-8c1-2 0-4-2-4h-6l-2-8c-1-2-3-3-5-2l-4 2c-2 1-3 3-2 5l1 3h-4c-4 0-6 4-6 8z" />
      {variant === 'dollar' && <><path d="M24 18v-2M24 26v-2" /><path d="M21 20c0-1 1.3-2 3-2s3 1 3 2-1.3 2-3 2-3 1-3 2 1.3 2 3 2 3-1 3-2" /></>}
      {variant === 'pen' && <path d="M21 20l2-2 4 4-2 2z" />}
      {variant === 'info' && <><circle cx="24" cy="21" r="1" fill={color} /><path d="M24 23v4" /></>}
      {variant === 'check' && <path d="M20 22l3 3 5-5" />}
      {variant === 'x' && <><path d="M21 20l6 6" /><path d="M27 20l-6 6" /></>}
    </svg>
  );
}

function PayeeStatusPill({ value }: { value: string }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    Approved: { bg: '#d7f7e4', color: '#006b3c', border: '#008c55' },
    Draft:    { bg: '#fff4d6', color: '#9a6400', border: '#d89000' },
    Pending:  { bg: '#fff0e0', color: '#b45309', border: '#f59e0b' },
    Rejected: { bg: '#fee2e2', color: '#991b1b', border: '#ef4444' },
  };
  const s = map[value];
  if (!s) return <span style={{ fontSize: 12 }}>{value}</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 12px', borderRadius: 999, border: `1px solid ${s.border}`, background: s.bg, color: s.color, fontSize: 12, fontWeight: 700 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.border }} />
      {value}
    </span>
  );
}

// ─── Add Payee Form ───────────────────────────────────────────────────────────
const CLAIM_PAYEE_TYPE_OPTS = ['Individual', 'Company', 'Trust', 'Estate'];
const PAYEE_TYPE_OPTS = [
  'Insured', 'Beneficiary', 'Adjuster - External', 'Third-Party Claimant',
  'Employer', 'Service Provider', 'Contractor', 'Vendor', 'Attorney or law firm',
  'Lienholder', 'Court', 'Government Authority', 'Co-Insurer', 'Reinsurer',
];
const RELATIONSHIP_OPTS = ['Provider', 'Beneficiary', 'Contractor'];

function fmtNationalId(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 9);
  if (!d) return '';
  const last4 = d.slice(-Math.min(4, d.length));
  const xCount = Math.max(0, d.length - 4);
  const display = 'X'.repeat(xCount) + last4;
  if (display.length <= 3) return display;
  if (display.length <= 5) return `${display.slice(0, 3)}-${display.slice(3)}`;
  return `${display.slice(0, 3)}-${display.slice(3, 5)}-${display.slice(5)}`;
}

function fmtPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 10);
  if (!d) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
const US_STATES_LIST = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware',
  'Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky',
  'Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi',
  'Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico',
  'New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania',
  'Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
];

function PField({ label, required, info, error, children }: { label: string; required?: boolean; info?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
        {required && <span style={{ color: '#dc2626', fontSize: 13 }}>*</span>}
        <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{label}</span>
        {info && <span title="Optional field" style={{ width: 15, height: 15, borderRadius: '50%', border: '1px solid #9ca3af', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#9ca3af', cursor: 'help', flexShrink: 0 }}>i</span>}
      </div>
      {children}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#dc2626"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" stroke="#fff" strokeWidth="2" /><circle cx="12" cy="16" r="1" fill="#fff" /></svg>
          <span style={{ fontSize: 11, color: '#dc2626' }}>{error}</span>
        </div>
      )}
    </div>
  );
}

function pinput(hasErr: boolean, disabled?: boolean): CSSProperties {
  return { width: '100%', padding: '7px 10px', fontSize: 13, border: `1px solid ${hasErr ? '#dc2626' : '#d1d5db'}`, borderRadius: 4, outline: 'none', boxSizing: 'border-box', background: disabled ? '#f3f4f6' : '#fff', color: disabled ? '#9ca3af' : '#111827', cursor: disabled ? 'not-allowed' : 'text' };
}
function pselect(hasErr: boolean, disabled?: boolean): CSSProperties {
  return { width: '100%', padding: '7px 10px', fontSize: 13, border: `1px solid ${hasErr ? '#dc2626' : '#d1d5db'}`, borderRadius: 4, outline: 'none', background: disabled ? '#f3f4f6' : '#fff', color: disabled ? '#9ca3af' : '#111827', cursor: disabled ? 'not-allowed' : 'pointer', appearance: 'auto' as CSSProperties['appearance'] };
}

const PAYMENT_METHOD_OPTS = ['Check', 'EFT/ACH', 'Wire Transfer'];
const ACCOUNT_TYPE_OPTS   = ['Checking', 'Savings', 'Money Market', 'CD'];
const FORM_1099_OPTS      = ['MISC', 'NEC', 'INT', 'DIV', 'R', 'S', 'B', 'C'];
const FED_TAX_CLASS_OPTS  = [
  'Individual/sole proprietor or single-member LLC',
  'C Corporation', 'S Corporation', 'Partnership',
  'Trust/Estate', 'Limited Liability Company', 'Other',
];

function PayeeAddForm({ claimId, onCancel, onSaved, editingPayeeId }: { claimId: number; onCancel: () => void; onSaved: () => void; editingPayeeId?: number }) {
  const [step, setStep] = useState(editingPayeeId ? 2 : 1);
  // tracks the DB id of the payee created at Step 1 so Step 2 can update it
  const [currentPayeeId, setCurrentPayeeId] = useState<number | null>(editingPayeeId || null);

  // ── Step 1: Payee Details ──────────────────────────────────────────────────
  const [claimPayeeType, setClaimPayeeType] = useState('Individual');
  const [firstName,  setFirstName]  = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName,   setLastName]   = useState('');
  const [nationalIdRaw, setNationalIdRaw] = useState('');
  const [nationalId,    setNationalId]    = useState('');
  const [ssn,        setSsn]        = useState('');
  const [tinIdRaw, setTinIdRaw] = useState('');
  const [tinId,    setTinId]    = useState('');
  const [payeeType,  setPayeeType]  = useState('');
  const [relationship, setRelationship] = useState('');
  const [phoneRaw, setPhoneRaw] = useState('');
  const [phone,    setPhone]    = useState('');
  const [email, setEmail] = useState('');
  // Step 1 Address
  const [googleSearch,  setGoogleSearch]  = useState('');
  const [enterManually, setEnterManually] = useState(false);
  const [addrLine1, setAddrLine1] = useState('');
  const [addrLine2, setAddrLine2] = useState('');
  const [addrState, setAddrState] = useState('');
  const [city,      setCity]      = useState('');
  const [county,    setCounty]    = useState('');
  const [zipCode,   setZipCode]   = useState('');
  const [latitude,  setLatitude]  = useState('');
  const [longitude, setLongitude] = useState('');

  // ── Step 2: Payment & Banking ──────────────────────────────────────────────
  const [paymentMethod,  setPaymentMethod]  = useState('');
  const [bankName,       setBankName]       = useState('');
  const [accountHolder,  setAccountHolder]  = useState('');
  const [accountNo,      setAccountNo]      = useState('');
  const [accountType,    setAccountType]    = useState('');
  const [abaRouting,     setAbaRouting]     = useState('');
  const [w9Business,     setW9Business]     = useState('');
  const [fedTaxClass,    setFedTaxClass]    = useState('');
  const [employerIdNum,  setEmployerIdNum]  = useState('');
  const [form1099,       setForm1099]       = useState('MISC');
  const [w9OnFile,       setW9OnFile]       = useState<'yes' | 'no' | ''>('');
  const [s2GoogleSearch,  setS2GoogleSearch]  = useState('');
  const [s2EnterManually, setS2EnterManually] = useState(false);
  const [s2AddrLine1, setS2AddrLine1] = useState('');
  const [s2AddrLine2, setS2AddrLine2] = useState('');
  const [s2AddrState, setS2AddrState] = useState('');
  const [s2City,      setS2City]      = useState('');
  const [s2County,    setS2County]    = useState('');
  const [s2ZipCode,   setS2ZipCode]   = useState('');
  const [bankingDocName, setBankingDocName] = useState('');
  const [showSuccess,   setShowSuccess]   = useState(false);
  const [newPayeeId,    setNewPayeeId]    = useState('');
  const [newPayeeDbId,  setNewPayeeDbId]  = useState(0);
  const [approving,     setApproving]     = useState(false);
  const [saving,        setSaving]        = useState(false);
  const bankingFileRef = useRef<HTMLInputElement>(null);
  const formScrollRef  = useRef<HTMLDivElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  function clearErr(key: string) { setErrors(p => { const n = { ...p }; delete n[key]; return n; }); }

  function validateStep1() {
    const e: Record<string, string> = {};
    if (!firstName.trim())    e.firstName    = 'Provide First Name to continue';
    if (!lastName.trim())     e.lastName     = 'Provide Last Name to Continue';
    if (nationalIdRaw.length < 9) e.nationalId = 'Provide National ID to continue';
    if (tinIdRaw.length < 9)      e.tinId      = 'Provide Valid TIN to continue';
    if (!payeeType)           e.payeeType    = 'Provide Payee Type to continue';
    if (!relationship)        e.relationship = 'Provide Relationship to Insured to continue';
    if (phoneRaw.length < 10) e.phone        = 'Provide Telephone Number to continue';
    if (!email.trim())        e.email        = 'Provide Email ID to continue';
    if (enterManually) {
      if (!addrLine1.trim()) e.addrLine1 = 'Provide Address Line 1 to continue';
      if (!addrState)        e.addrState = 'Provide State to continue';
      if (!city.trim())      e.city      = 'Provide City to continue';
      if (!county.trim())    e.county    = 'Provide County to continue';
      if (!zipCode.trim())   e.zipCode   = 'Provide Zip Code to continue';
    }
    return e;
  }

  function validateStep2() {
    const e: Record<string, string> = {};
    if (!paymentMethod) e.paymentMethod = 'Provide Payment Method to continue';
    if (paymentMethod && paymentMethod !== 'Check') {
      if (!bankName.trim())         e.bankName      = 'Provide Bank Name to continue';
      if (!accountHolder.trim())    e.accountHolder = 'Provide Account Holder Name to continue';
      if (!accountNo.trim())        e.accountNo     = 'Provide Account No to continue';
      if (!accountType)             e.accountType   = 'Provide Account Type to continue';
      if (!w9Business.trim())       e.w9Business    = 'Provide Name or Business Name to continue';
      if (!fedTaxClass)             e.fedTaxClass   = 'Provide Federal Tax Classification to continue';
      if (!employerIdNum.trim())    e.employerIdNum = 'Provide Employer Identification Number to continue';
      if (!w9OnFile)                e.w9OnFile      = 'Provide W-9 Form on File to continue';
      if (s2EnterManually) {
        if (!s2AddrLine1.trim()) e.s2AddrLine1 = 'Provide Address Line 1 to continue';
        if (!s2AddrState)        e.s2AddrState = 'Provide State to continue';
        if (!s2City.trim())      e.s2City      = 'Provide City to continue';
        if (!s2County.trim())    e.s2County    = 'Provide County to continue';
        if (!s2ZipCode.trim())   e.s2ZipCode   = 'Provide valid Zip Code to continue';
      }
    }
    return e;
  }

  // ── shared helpers ─────────────────────────────────────────────────────────
  function buildStep1Req(): PayeeCreateReq {
    const hasAddress = enterManually || !!googleSearch.trim();
    return {
      claimId:              claimId    || null,
      claimPayeeType:       claimPayeeType || null,
      firstName:            firstName   || null,
      middleName:           middleName  || null,
      lastName:             lastName    || null,
      businessName:         null,
      nationalId:           nationalIdRaw || null,
      socialSecurityNumber: ssn         || null,
      tinId:                tinIdRaw    || null,
      payeeType:            payeeType   || null,
      relationship:         relationship || null,
      telephoneNumberCC:    null,
      telephoneNumber:      phoneRaw    || null,
      email:                email       || null,
      bankDetail:           null,
      address: hasAddress ? {
        googleAddress: googleSearch.trim() || null,
        isManual:      enterManually,
        addressLine1:  addrLine1  || null,
        addressLine2:  addrLine2  || null,
        country:       'United States',
        state:         addrState  || null,
        city:          city       || null,
        county:        county     || null,
        zipCode:       zipCode    || null,
        latitude:      latitude   || null,
        longitude:     longitude  || null,
      } : null,
    };
  }

  function buildBankingReq() {
    const isCheck = paymentMethod === 'Check';
    return {
      paymentMethod:               paymentMethod  || null,
      bankName:                    isCheck ? null : (bankName       || null),
      accountHolderName:           isCheck ? null : (accountHolder  || null),
      accountNumber:               isCheck ? null : (accountNo      || null),
      accountType:                 isCheck ? null : (accountType    || null),
      abaRoutingNumber:            isCheck ? null : (abaRouting     || null),
      businessName:                isCheck ? null : (w9Business     || null),
      federalTaxClassification:    isCheck ? null : (fedTaxClass    || null),
      employerIdentificationNumber:isCheck ? null : (employerIdNum  || null),
      type1099:                    isCheck ? null : (form1099       || null),
      w9FormOnFile:                !isCheck && w9OnFile === 'yes',
    };
  }

  // ── Step 1 → Next: persist profile, then advance to Step 2 ─────────────────
  function handleNext() {
    const e = validateStep1();
    if (Object.keys(e).length > 0) {
      e._form = 'Please fill all required fields highlighted above.';
      setErrors(e);
      return;
    }
    setErrors({});
    setSaving(true);
    payeeApi.create(buildStep1Req())
      .then(result => {
        setCurrentPayeeId(result.id);
        setStep(2);
        setTimeout(() => formScrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      })
      .catch(() => setErrors({ _api: 'Failed to save profile. Please try again.' }))
      .finally(() => setSaving(false));
  }

  // ── Step 2 → Save: persist banking, return to list ─────────────────────────
  function handleSaveStep2() {
    const e = validateStep2();
    if (Object.keys(e).length > 0) {
      e._form = 'Please fill all required fields highlighted above.';
      setErrors(e);
      formScrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setErrors({});
    if (!currentPayeeId) { setErrors({ _api: 'No payee record found. Go back to Step 1.' }); return; }
    setSaving(true);
    payeeApi.updateBanking(currentPayeeId, buildBankingReq())
      .then(() => onSaved())
      .catch(() => setErrors({ _api: 'Failed to save banking details. Please try again.' }))
      .finally(() => setSaving(false));
  }

  // ── Step 2 → Create: persist banking, show success modal ───────────────────
  function handleCreate() {
    const e = validateStep2();
    if (Object.keys(e).length > 0) {
      e._form = 'Please fill all required fields highlighted above.';
      setErrors(e);
      formScrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setErrors({});

    const finalize = (id: number) => {
      setNewPayeeDbId(id);
      setNewPayeeId(`CP-${String(id).padStart(5, '0')}`);
      setShowSuccess(true);
    };

    if (currentPayeeId) {
      payeeApi.updateBanking(currentPayeeId, buildBankingReq())
        .then(() => finalize(currentPayeeId))
        .catch(() => setErrors({ _api: 'Failed to save banking details. Please try again.' }));
    } else {
      // fallback: full create in one shot (e.g. direct Step 2 navigation)
      const req: PayeeCreateReq = { ...buildStep1Req(), bankDetail: buildBankingReq() };
      payeeApi.create(req)
        .then(result => finalize(result.id))
        .catch(() => setErrors({ _api: 'Failed to save payee. Please try again.' }));
    }
  }

  function handleSaveStep1() {
    const e = validateStep1();
    if (Object.keys(e).length > 0) {
      e._form = 'Please fill all required fields highlighted above.';
      setErrors(e);
      return;
    }
    setErrors({});
    setSaving(true);

    const hasAddress = enterManually || !!googleSearch.trim();
    const req: PayeeCreateReq = {
      claimId:              claimId || null,
      claimPayeeType:       claimPayeeType || null,
      firstName:            firstName    || null,
      middleName:           middleName   || null,
      lastName:             lastName     || null,
      businessName:         null,
      nationalId:           nationalIdRaw || null,
      socialSecurityNumber: ssn          || null,
      tinId:                tinIdRaw     || null,
      payeeType:            payeeType    || null,
      relationship:         relationship || null,
      telephoneNumberCC:    null,
      telephoneNumber:      phoneRaw     || null,
      email:                email        || null,
      bankDetail: null,
      address: hasAddress ? {
        googleAddress: googleSearch.trim() || null,
        isManual:      enterManually,
        addressLine1:  addrLine1  || null,
        addressLine2:  addrLine2  || null,
        country:       'United States',
        state:         addrState  || null,
        city:          city       || null,
        county:        county     || null,
        zipCode:       zipCode    || null,
        latitude:      latitude   || null,
        longitude:     longitude  || null,
      } : null,
    };

    payeeApi.create(req)
      .then(() => { onSaved(); })
      .catch(err => {
        console.error('Failed to save payee:', err);
        setErrors({ _api: 'Failed to save payee. Please try again.' });
      })
      .finally(() => setSaving(false));
  }

  // ── Stepper ────────────────────────────────────────────────────────────────
  const stepItems = [
    { num: 1, top: 'Payee',        sub: 'Profile creation' },
    { num: 2, top: 'Payment &',    sub: 'Banking Details' },
    { num: 3, top: 'Compliance &', sub: 'Approval' },
  ];

  function StepperBar() {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', padding: '8px 40px 0', marginBottom: 16 }}>
        {stepItems.map((s, i) => {
          const done   = step > s.num;
          const active = step === s.num;
          const lineColor = step > i + 1 ? '#15803d' : '#d1d5db';
          const lineDash  = step > i + 1 ? 'none' : 'dashed';
          return (
            <div key={s.num} style={{ display: 'flex', alignItems: 'flex-start', flex: i < stepItems.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 90 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', border: `2px solid ${done || active ? '#15803d' : '#d1d5db'}`, background: done ? '#15803d' : '#fff', color: done ? '#fff' : (active ? '#15803d' : '#9ca3af'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                  {done ? '✓' : s.num}
                </div>
                <div style={{ textAlign: 'center', marginTop: 5 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: active ? '#15803d' : (done ? '#15803d' : '#9ca3af') }}>{s.top}</div>
                  <div style={{ fontSize: 11, color: active ? '#15803d' : (done ? '#15803d' : '#9ca3af') }}>{s.sub}</div>
                </div>
              </div>
              {i < stepItems.length - 1 && (
                <div style={{ flex: 1, marginTop: 14, borderTop: `2px ${lineDash} ${lineColor}` }} />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  const addrDisabled = !enterManually;
  const s2AddrDisabled = !s2EnterManually;

  // ── Step 1 render ──────────────────────────────────────────────────────────
  if (step === 1) return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <StepperBar />
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 5, background: '#0B5AA0' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          {/* Left: Payee Details */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Payee Details</div>
            <PField label="Claim Payee Type" required>
              <select style={pselect(false)} value={claimPayeeType} onChange={e => setClaimPayeeType(e.target.value)}>
                {CLAIM_PAYEE_TYPE_OPTS.map(o => <option key={o}>{o}</option>)}
              </select>
            </PField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <PField label="First Name" required error={errors.firstName}>
                <input style={pinput(!!errors.firstName)} value={firstName} onChange={e => { setFirstName(e.target.value); clearErr('firstName'); }} />
              </PField>
              <PField label="Middle Name">
                <input style={pinput(false)} value={middleName} onChange={e => setMiddleName(e.target.value)} />
              </PField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <PField label="Last Name" required error={errors.lastName}>
                <input style={pinput(!!errors.lastName)} value={lastName} onChange={e => { setLastName(e.target.value); clearErr('lastName'); }} />
              </PField>
              <PField label="National ID" required error={errors.nationalId}>
                <input
                  style={pinput(!!errors.nationalId)} value={nationalId} placeholder="XXX-XX-XXXX"
                  onChange={() => {}}
                  onKeyDown={e => {
                    if (e.key === 'Backspace') { e.preventDefault(); const r = nationalIdRaw.slice(0,-1); setNationalIdRaw(r); setNationalId(fmtNationalId(r)); }
                    else if (/^\d$/.test(e.key) && nationalIdRaw.length < 9) { e.preventDefault(); const r = nationalIdRaw + e.key; setNationalIdRaw(r); setNationalId(fmtNationalId(r)); clearErr('nationalId'); }
                    else if (!/^(Tab|Arrow|Home|End|Delete|F)/.test(e.key)) e.preventDefault();
                  }}
                  onPaste={e => { e.preventDefault(); const p = e.clipboardData.getData('text').replace(/\D/g,''); const r = (nationalIdRaw+p).slice(0,9); setNationalIdRaw(r); setNationalId(fmtNationalId(r)); clearErr('nationalId'); }}
                />
              </PField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <PField label="SSN">
                <input style={pinput(false)} value={ssn} onChange={e => setSsn(e.target.value)} />
              </PField>
              <PField label="TIN ID" required error={errors.tinId}>
                <input
                  style={pinput(!!errors.tinId)} value={tinId} placeholder="XXX-XX-XXXX"
                  onChange={() => {}}
                  onKeyDown={e => {
                    if (e.key === 'Backspace') { e.preventDefault(); const r = tinIdRaw.slice(0,-1); setTinIdRaw(r); setTinId(fmtNationalId(r)); }
                    else if (/^\d$/.test(e.key) && tinIdRaw.length < 9) { e.preventDefault(); const r = tinIdRaw + e.key; setTinIdRaw(r); setTinId(fmtNationalId(r)); clearErr('tinId'); }
                    else if (!/^(Tab|Arrow|Home|End|Delete|F)/.test(e.key)) e.preventDefault();
                  }}
                  onPaste={e => { e.preventDefault(); const p = e.clipboardData.getData('text').replace(/\D/g,''); const r = (tinIdRaw+p).slice(0,9); setTinIdRaw(r); setTinId(fmtNationalId(r)); clearErr('tinId'); }}
                />
              </PField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <PField label="Payee Type" required error={errors.payeeType}>
                <select style={pselect(!!errors.payeeType)} value={payeeType} onChange={e => { setPayeeType(e.target.value); clearErr('payeeType'); }}>
                  <option value="">Select...</option>
                  {PAYEE_TYPE_OPTS.map(o => <option key={o}>{o}</option>)}
                </select>
              </PField>
              <PField label="Relationship to Insured" required error={errors.relationship}>
                <select style={pselect(!!errors.relationship)} value={relationship} onChange={e => { setRelationship(e.target.value); clearErr('relationship'); }}>
                  <option value="">Select...</option>
                  {RELATIONSHIP_OPTS.map(o => <option key={o}>{o}</option>)}
                </select>
              </PField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <PField label="Telephone Number" required error={errors.phone}>
                <div style={{ display: 'flex', border: `1px solid ${errors.phone ? '#dc2626' : '#d1d5db'}`, borderRadius: 4, overflow: 'hidden', background: '#fff' }}>
                  <span style={{ padding: '7px 8px', background: '#f9fafb', fontSize: 12, borderRight: '1px solid #d1d5db', display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap', color: '#374151' }}>🇺🇸 ▾</span>
                  <input placeholder="(###) ###-####" style={{ flex: 1, padding: '7px 8px', fontSize: 13, border: 'none', outline: 'none', minWidth: 0 }} value={phone} onChange={e => { const raw = e.target.value.replace(/\D/g, '').slice(0, 10); setPhoneRaw(raw); setPhone(fmtPhone(raw)); clearErr('phone'); }} />
                </div>
              </PField>
              <PField label="Email ID" required error={errors.email}>
                <input style={pinput(!!errors.email)} value={email} onChange={e => { setEmail(e.target.value); clearErr('email'); }} />
              </PField>
            </div>
          </div>
          {/* Right: Payee Address */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Payee Address</div>
            <PField label="Google Address Search">
              <input style={pinput(false)} value={googleSearch} onChange={e => setGoogleSearch(e.target.value)} />
            </PField>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <input type="checkbox" id="enterManually" checked={enterManually} onChange={e => setEnterManually(e.target.checked)} style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#0B5AA0' }} />
              <label htmlFor="enterManually" style={{ fontSize: 13, cursor: 'pointer', color: '#374151' }}>Enter Address Manually</label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <PField label="Address Line 1" required error={errors.addrLine1}>
                <input disabled={addrDisabled} style={pinput(!!errors.addrLine1, addrDisabled)} value={addrLine1} onChange={e => { setAddrLine1(e.target.value); clearErr('addrLine1'); }} />
              </PField>
              <PField label="Address Line 2" info>
                <input disabled={addrDisabled} style={pinput(false, addrDisabled)} value={addrLine2} onChange={e => setAddrLine2(e.target.value)} />
              </PField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <PField label="Country" required>
                <div style={{ display: 'flex', border: '1px solid #d1d5db', borderRadius: 4, background: '#f3f4f6', alignItems: 'center', padding: '7px 10px', gap: 6, color: '#9ca3af', fontSize: 13 }}>
                  <span style={{ flex: 1 }}>United States</span>
                  <span style={{ cursor: 'pointer', fontSize: 12, color: '#6b7280' }}>×</span>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>∨</span>
                </div>
              </PField>
              <PField label="State" required error={errors.addrState}>
                <select disabled={addrDisabled} style={pselect(!!errors.addrState, addrDisabled)} value={addrState} onChange={e => { setAddrState(e.target.value); clearErr('addrState'); }}>
                  <option value="">Select...</option>
                  {US_STATES_LIST.map(s => <option key={s}>{s}</option>)}
                </select>
              </PField>
              <PField label="City" required error={errors.city}>
                <input disabled={addrDisabled} style={pinput(!!errors.city, addrDisabled)} value={city} onChange={e => { setCity(e.target.value); clearErr('city'); }} />
              </PField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <PField label="County" required error={errors.county}>
                <input disabled={addrDisabled} style={pinput(!!errors.county, addrDisabled)} value={county} onChange={e => { setCounty(e.target.value); clearErr('county'); }} />
              </PField>
              <PField label="Zip Code" required error={errors.zipCode}>
                <input disabled={addrDisabled} style={pinput(!!errors.zipCode, addrDisabled)} value={zipCode} onChange={e => { setZipCode(e.target.value); clearErr('zipCode'); }} />
              </PField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <PField label="Latitude">
                <input disabled={addrDisabled} style={pinput(false, addrDisabled)} value={latitude} onChange={e => setLatitude(e.target.value)} />
              </PField>
              <PField label="Longitude">
                <input disabled={addrDisabled} style={pinput(false, addrDisabled)} value={longitude} onChange={e => setLongitude(e.target.value)} />
              </PField>
            </div>
          </div>
        </div>
      </div>
      {(errors._form || errors._api) && (
        <div style={{ margin: '8px 0 0', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 4, fontSize: 13, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12" y2="16"/></svg>
          {errors._form || errors._api}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 0 4px' }}>
        <button onClick={onCancel} style={{ height: 36, padding: '0 22px', border: 'none', background: 'none', color: '#0B5AA0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
        <button disabled={saving} onClick={handleSaveStep1} style={{ height: 36, padding: '0 22px', border: '1px solid #0B5AA0', background: saving ? '#e5e7eb' : '#fff', color: saving ? '#9ca3af' : '#0B5AA0', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>{saving ? 'Saving…' : 'Save'}</button>
        <button onClick={handleNext} style={{ height: 36, padding: '0 28px', border: 'none', background: '#0B5AA0', color: '#fff', borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Next</button>
      </div>
    </div>
  );

  // ── Step 2 render ──────────────────────────────────────────────────────────
  return (
    <div ref={formScrollRef} style={{ fontFamily: 'Arial, sans-serif' }}>
      <StepperBar />
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 5, background: '#0B5AA0' }} />

        {/* Payment Method */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Payment Method</div>
          <div style={{ maxWidth: 460 }}>
            <PField label="Payment Method" required error={errors.paymentMethod}>
              <select style={pselect(!!errors.paymentMethod)} value={paymentMethod} onChange={e => { setPaymentMethod(e.target.value); clearErr('paymentMethod'); }}>
                <option value="">Select</option>
                {PAYMENT_METHOD_OPTS.map(o => <option key={o}>{o}</option>)}
              </select>
            </PField>
          </div>
        </div>

        {paymentMethod && paymentMethod !== 'Check' && <>
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '0 0 20px' }} />

        {/* Banking Information */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Banking Information</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 0 }}>
            <PField label="Bank Name" required error={errors.bankName}>
              <input style={pinput(!!errors.bankName)} value={bankName} onChange={e => { setBankName(e.target.value); clearErr('bankName'); }} />
            </PField>
            <PField label="Account Holder Name" required error={errors.accountHolder}>
              <input style={pinput(!!errors.accountHolder)} value={accountHolder} onChange={e => { setAccountHolder(e.target.value); clearErr('accountHolder'); }} />
            </PField>
            <PField label="Account No" required error={errors.accountNo}>
              <input style={pinput(!!errors.accountNo)} value={accountNo} onChange={e => { setAccountNo(e.target.value); clearErr('accountNo'); }} />
            </PField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <PField label="Account Type" required error={errors.accountType}>
              <select style={pselect(!!errors.accountType)} value={accountType} onChange={e => { setAccountType(e.target.value); clearErr('accountType'); }}>
                <option value="">Select</option>
                {ACCOUNT_TYPE_OPTS.map(o => <option key={o}>{o}</option>)}
              </select>
            </PField>
            <PField label="ABA Routing No">
              <input style={pinput(false)} value={abaRouting} onChange={e => setAbaRouting(e.target.value)} />
            </PField>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '0 0 20px' }} />

        {/* W-9 Information */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 14 }}>W-9 Information</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 0 }}>
            <PField label="Name or Business Name" required error={errors.w9Business}>
              <input style={pinput(!!errors.w9Business)} value={w9Business} onChange={e => { setW9Business(e.target.value); clearErr('w9Business'); }} />
            </PField>
            <PField label="Federal Tax Classification" required error={errors.fedTaxClass}>
              <select style={pselect(!!errors.fedTaxClass)} value={fedTaxClass} onChange={e => { setFedTaxClass(e.target.value); clearErr('fedTaxClass'); }}>
                <option value="">Select</option>
                {FED_TAX_CLASS_OPTS.map(o => <option key={o}>{o}</option>)}
              </select>
            </PField>
          </div>
          <PField label="Employer Identification Number" required error={errors.employerIdNum}>
            <input style={{ ...pinput(!!errors.employerIdNum), maxWidth: 580 }} value={employerIdNum} onChange={e => { setEmployerIdNum(e.target.value); clearErr('employerIdNum'); }} />
          </PField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <PField label="1099 Type" required>
              <select style={pselect(false)} value={form1099} onChange={e => setForm1099(e.target.value)}>
                {FORM_1099_OPTS.map(o => <option key={o}>{o}</option>)}
              </select>
            </PField>
            <PField label="W-9 Form on File?" required error={errors.w9OnFile}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, paddingTop: 4 }}>
                {(['yes', 'no'] as const).map(v => (
                  <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                    <input type="radio" name="w9OnFile" checked={w9OnFile === v} onChange={() => { setW9OnFile(v); clearErr('w9OnFile'); }} style={{ width: 15, height: 15, accentColor: '#0B5AA0', cursor: 'pointer' }} />
                    {v === 'yes' ? 'Yes' : 'No'}
                  </label>
                ))}
              </div>
            </PField>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '0 0 20px' }} />

        {/* Address */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Address</div>
          <PField label="Google Address Search">
            <input style={{ ...pinput(false), background: '#f3f4f6' }} value={s2GoogleSearch} onChange={e => setS2GoogleSearch(e.target.value)} />
          </PField>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <input type="checkbox" id="s2Manual" checked={s2EnterManually} onChange={e => setS2EnterManually(e.target.checked)} style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#0B5AA0' }} />
            <label htmlFor="s2Manual" style={{ fontSize: 13, cursor: 'pointer', color: '#374151' }}>Enter Address Manually</label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <PField label="Address Line 1" required error={errors.s2AddrLine1}>
              <input disabled={s2AddrDisabled} style={pinput(!!errors.s2AddrLine1, s2AddrDisabled)} value={s2AddrLine1} onChange={e => { setS2AddrLine1(e.target.value); clearErr('s2AddrLine1'); }} />
            </PField>
            <PField label="Address Line 2" info>
              <input disabled={s2AddrDisabled} style={pinput(false, s2AddrDisabled)} value={s2AddrLine2} onChange={e => setS2AddrLine2(e.target.value)} />
            </PField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <PField label="Country" required>
              <div style={{ display: 'flex', border: '1px solid #d1d5db', borderRadius: 4, background: '#f3f4f6', alignItems: 'center', padding: '7px 10px', gap: 6, color: '#9ca3af', fontSize: 13 }}>
                <span style={{ flex: 1 }}>United States</span>
                <span style={{ cursor: 'pointer', fontSize: 12, color: '#6b7280' }}>×</span>
                <span style={{ fontSize: 11, color: '#6b7280' }}>∨</span>
              </div>
            </PField>
            <PField label="State" required error={errors.s2AddrState}>
              <select disabled={s2AddrDisabled} style={pselect(!!errors.s2AddrState, s2AddrDisabled)} value={s2AddrState} onChange={e => { setS2AddrState(e.target.value); clearErr('s2AddrState'); }}>
                <option value="">Select...</option>
                {US_STATES_LIST.map(s => <option key={s}>{s}</option>)}
              </select>
            </PField>
            <PField label="City" required error={errors.s2City}>
              <input disabled={s2AddrDisabled} style={pinput(!!errors.s2City, s2AddrDisabled)} value={s2City} onChange={e => { setS2City(e.target.value); clearErr('s2City'); }} />
            </PField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <PField label="County" required error={errors.s2County}>
              <input disabled={s2AddrDisabled} style={pinput(!!errors.s2County, s2AddrDisabled)} value={s2County} onChange={e => { setS2County(e.target.value); clearErr('s2County'); }} />
            </PField>
            <PField label="Zip Code" required error={errors.s2ZipCode}>
              <input disabled={s2AddrDisabled} style={pinput(!!errors.s2ZipCode, s2AddrDisabled)} value={s2ZipCode} onChange={e => { setS2ZipCode(e.target.value); clearErr('s2ZipCode'); }} />
            </PField>
          </div>
        </div>

        </>}

        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '0 0 20px' }} />

        {/* Upload Banking Documents */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Upload Banking Documents</div>
          <div
            style={{ border: '1.5px dashed #d1d5db', borderRadius: 6, padding: '32px 20px', textAlign: 'center', background: '#fafafa', cursor: 'pointer' }}
            onClick={() => bankingFileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setBankingDocName(f.name); }}
          >
            {bankingDocName ? (
              <div style={{ fontSize: 13, color: '#15803d', fontWeight: 600 }}>📎 {bankingDocName}</div>
            ) : (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Drag and Drop File Here or Select a File</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 12 }}>Supported formats are Xls, Doc, PNG, JPEG, JPG<br />Files size: 10 KB - 10 MB</div>
                <button type="button" style={{ padding: '7px 20px', border: '1px solid #0B5AA0', background: '#fff', color: '#0B5AA0', borderRadius: 4, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                  Browse File
                </button>
              </>
            )}
            <input ref={bankingFileRef} type="file" accept=".xls,.xlsx,.doc,.docx,.png,.jpg,.jpeg" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) setBankingDocName(e.target.files[0].name); }} />
          </div>
        </div>
      </div>

      {errors._form && (
        <div style={{ margin: '8px 0 0', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 4, fontSize: 13, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12" y2="16"/></svg>
          {errors._form}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 0 4px' }}>
        <button onClick={() => { setErrors({}); setStep(1); }} style={{ height: 36, padding: '0 22px', border: 'none', background: 'none', color: '#0B5AA0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Previous</button>
        <button disabled={saving} onClick={handleSaveStep2} style={{ height: 36, padding: '0 22px', border: '1px solid #0B5AA0', background: saving ? '#e5e7eb' : '#fff', color: saving ? '#9ca3af' : '#0B5AA0', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>{saving ? 'Saving…' : 'Save'}</button>
        <button onClick={handleCreate} style={{ height: 36, padding: '0 28px', border: 'none', background: '#0B5AA0', color: '#fff', borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Create</button>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: '40px 48px 36px', width: 520, textAlign: 'center', position: 'relative', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            {/* Close — dismisses only, does NOT send for approval */}
            <button onClick={() => { setShowSuccess(false); onSaved(); }} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 20, lineHeight: 1, padding: 4 }}>✕</button>

            {/* Green circle checkmark */}
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(21,128,61,0.08)', border: '2px solid #15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 0 0 8px rgba(21,128,61,0.06)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            {/* Messages */}
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
              Payee has been created successfully with ID {newPayeeId}
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 28 }}>
              Click Send for Approval button to send it for Compliance and Approval
            </div>

            {/* Send For Approval — calls API to set status Pending, then returns to list */}
            <button
              disabled={approving}
              onClick={() => {
                setApproving(true);
                payeeApi.sendForApproval(newPayeeDbId)
                  .finally(() => {
                    setApproving(false);
                    setShowSuccess(false);
                    onSaved();
                  });
              }}
              style={{ padding: '8px 28px', border: '1px solid #0B5AA0', background: approving ? '#e5e7eb' : '#fff', color: approving ? '#9ca3af' : '#0B5AA0', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: approving ? 'not-allowed' : 'pointer' }}
            >
              {approving ? 'Sending…' : 'Send For Approval'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PayeeContent({ claimId }: { claimId: number }) {
  const [search,          setSearch]          = useState('');
  const [rows,            setRows]            = useState<PayeeRow[]>([]);
  const [kpi,             setKpi]             = useState({ total: 0, draft: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading,         setLoading]         = useState(true);
  const [refresh,         setRefresh]         = useState(0);
  const [view,            setView]            = useState<'list' | 'add'>('list');
  const [editingPayeeId,  setEditingPayeeId]  = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!claimId) return;
    setLoading(true);
    Promise.all([
      payeeApi.getListByClaim(claimId),
      payeeApi.getKpiByClaim(claimId),
    ]).then(([list, k]) => {
      setRows(list.map(dtoToRow));
      setKpi({ total: k.total, draft: k.draft, pending: k.pending, approved: k.approved, rejected: k.rejected });
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [claimId, refresh]);

  const filtered = rows.filter(r => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [r.payeeName, r.payeeType, r.paymentMethod, r.complianceCheckStatus, r.status].some(v => v.toLowerCase().includes(q));
  });

  const TH: CSSProperties = { padding: '10px 12px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#374151', background: '#fff', whiteSpace: 'nowrap' };
  const TD: CSSProperties = { padding: '10px 12px', borderRight: '1px solid #edf1f5', fontSize: 13, color: '#111827' };

  function openEdit(payeeId: number) { setEditingPayeeId(payeeId); setView('add'); }
  function closeForm() { setView('list'); setEditingPayeeId(undefined); }

  if (view === 'add') return <PayeeAddForm
    claimId={claimId}
    editingPayeeId={editingPayeeId}
    onCancel={closeForm}
    onSaved={() => { closeForm(); setRefresh(r => r + 1); }}
  />;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <PayeeKpiCard label="Total"    value={kpi.total}    color="#0B5AA0" icon={<HandIcon color="#0B5AA0" variant="dollar" />} />
        <PayeeKpiCard label="Draft"    value={kpi.draft}    color="#d89000" icon={<HandIcon color="#d89000" variant="pen" />} />
        <PayeeKpiCard label="Pending"  value={kpi.pending}  color="#f59e0b" icon={<HandIcon color="#f59e0b" variant="info" />} />
        <PayeeKpiCard label="Approved" value={kpi.approved} color="#15803d" icon={<HandIcon color="#15803d" variant="check" />} />
        <PayeeKpiCard label="Rejected" value={kpi.rejected} color="#dc2626" icon={<HandIcon color="#dc2626" variant="x" />} />
      </div>

      {/* Search + Add */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ position: 'relative' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by Keyword"
            style={{ paddingLeft: 34, fontSize: 13, width: 260, height: 34, border: '1px solid #aeb7c2', borderRadius: 3, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <button onClick={() => setView('add')} style={{ height: 36, padding: '0 18px', background: '#0B5AA0', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          + Add Payee
        </button>
      </div>

      {/* Table */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ ...TH, width: 40, textAlign: 'center' }}>
                <span style={{ fontSize: 16, color: '#4b5563' }}>≡</span>
              </th>
              <th style={{ ...TH }}>Action</th>
              {PAYEE_COLS.map(col => (
                <th key={col.key} style={{ ...TH }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {col.label}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 5h16l-6 7v5l-4 2v-7L4 5z" />
                    </svg>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={PAYEE_COLS.length + 2} style={{ padding: 60, textAlign: 'center', fontSize: 14, color: '#6b7280' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={PAYEE_COLS.length + 2} style={{ padding: 60, textAlign: 'center', fontWeight: 800, fontSize: 18, color: '#374151' }}>
                  No Data Available
                </td>
              </tr>
            ) : filtered.map((row, idx) => (
              <tr key={row.id} style={{ borderBottom: '1px solid #edf1f5' }}>
                <td style={{ ...TD, textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                <td style={{ ...TD }}>
                  <span style={{ display: 'inline-flex', gap: 8 }}>
                    <button title="View" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151', padding: 2 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    <button title="Edit" onClick={() => openEdit(row.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151', padding: 2 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </button>
                  </span>
                </td>
                <td style={{ ...TD }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 28, height: 28, borderRadius: '50%', background: row.avatarColor, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{row.initials}</span>
                    <span style={{ color: '#005da8', fontWeight: 600 }}>{row.payeeName}</span>
                  </span>
                </td>
                <td style={{ ...TD }}>{row.payeeType}</td>
                <td style={{ ...TD }}>{row.paymentMethod}</td>
                <td style={{ ...TD }}>{row.complianceCheckStatus}</td>
                <td style={{ ...TD }}><PayeeStatusPill value={row.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InsuredPolicyContent({ claimId }: { claimId: number }) {
  const [open, setOpen] = useState<'insured' | 'policy' | 'risk' | null>(null);
  const [data, setData] = useState<InsuredPolicyViewDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    insuredPolicyApi.get(claimId)
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [claimId]);

  function toggle(section: 'insured' | 'policy' | 'risk') {
    setOpen(prev => (prev === section ? null : section));
  }

  function AccordionHeader({ section, label }: { section: 'insured' | 'policy' | 'risk'; label: string }) {
    const isOpen = open === section;
    return (
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => toggle(section)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0B5AA0" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            {isOpen ? <path d="M8 12h8" /> : <><path d="M12 8v8" /><path d="M8 12h8" /></>}
          </svg>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#1a1a2e' }}>{label}</span>
        </div>
        <button
          onClick={e => e.stopPropagation()}
          style={{ padding: '5px 16px', border: '1px solid #0B5AA0', borderRadius: 4, background: '#fff', color: '#0B5AA0', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
        >
          View Details
        </button>
      </div>
    );
  }

  function IPField({ label, value }: { label: string; value: string | null | undefined }) {
    return (
      <div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{value || '-'}</div>
      </div>
    );
  }

  function IPGrid({ items, cols = 4 }: { items: { label: string; value: string | null | undefined }[]; cols?: number }) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '16px 24px', padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
        {items.map(it => <IPField key={it.label} label={it.label} value={it.value} />)}
      </div>
    );
  }

  const sectionStyle: CSSProperties = { border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', marginBottom: 12, overflow: 'hidden' };
  const ins = data?.insured;
  const pol = data?.policy;
  const risk = pol?.riskLocation;

  const propertyLocationWithGeo = risk
    ? [risk.propertyLocation, risk.latitude && risk.longitude ? `(GEO: ${risk.latitude}, ${risk.longitude})` : null]
        .filter(Boolean).join(' ')
    : null;

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading...</div>;
  }

  return (
    <div>
      {/* Insured Details */}
      <div style={sectionStyle}>
        <AccordionHeader section="insured" label="Insured Details" />
        {open === 'insured' && (
          <div style={{ padding: '0 20px 20px', borderTop: '1px solid #e5e7eb' }}>
            <IPGrid items={[
              { label: 'Customer ID', value: ins?.customerId },
              { label: 'First Name', value: ins?.firstName },
              { label: 'Middle Name / Initial', value: '-' },
              { label: 'Last Name', value: ins?.lastName },
            ]} />
            <IPGrid items={[
              { label: 'Address Line 1', value: ins?.addressLine1 },
              { label: 'Address Line 2', value: ins?.addressLine2 },
              { label: 'Country', value: ins?.country },
              { label: 'State', value: ins?.state },
            ]} />
            <IPGrid items={[
              { label: 'City', value: ins?.city },
              { label: 'County', value: ins?.county },
              { label: 'Zip Code', value: ins?.zipCode },
              { label: 'Telephone Number', value: ins?.telephone },
            ]} />
            <IPGrid cols={3} items={[
              { label: 'Extension', value: ins?.telephoneExt },
              { label: 'Alternate Telephone No', value: ins?.alternateTelephone },
              { label: 'Email ID', value: ins?.email },
            ]} />

            {/* Additional Named Insureds */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 10 }}>Additional Named Insured(s)</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['#', 'Name', 'Relationship', 'Telephone Number', 'Alternative Telephone Num...', 'Email ID', 'Insured Type', 'DBA Name'].map(h => (
                      <th key={h} style={{ padding: '9px 10px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.namedInsureds ?? []).length === 0 ? (
                    <tr><td colSpan={8} style={{ padding: '12px 10px', color: '#9ca3af', textAlign: 'center' }}>No data available</td></tr>
                  ) : (data?.namedInsureds ?? []).map((row, idx) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '9px 10px', color: '#0B5AA0', fontWeight: 500 }}>{idx + 1}</td>
                      <td style={{ padding: '9px 10px' }}>{row.name || '-'}</td>
                      <td style={{ padding: '9px 10px' }}>{row.relationship || '-'}</td>
                      <td style={{ padding: '9px 10px' }}>{row.telephoneNumber || '-'}</td>
                      <td style={{ padding: '9px 10px' }}>{row.alternateTelephoneNumber || '-'}</td>
                      <td style={{ padding: '9px 10px' }}>{row.emailId || '-'}</td>
                      <td style={{ padding: '9px 10px' }}>{row.insuredType || '-'}</td>
                      <td style={{ padding: '9px 10px' }}>{row.dbaName || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Additional Organizations */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 10 }}>Additional Organizations</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['#', 'Org Name', 'Org Type', 'Telephone Number', 'Extension', 'Alternative Telephone Num...', 'Email ID', 'Contact Name'].map(h => (
                      <th key={h} style={{ padding: '9px 10px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.organizations ?? []).length === 0 ? (
                    <tr><td colSpan={8} style={{ padding: '12px 10px', color: '#9ca3af', textAlign: 'center' }}>No data available</td></tr>
                  ) : (data?.organizations ?? []).map((row, idx) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '9px 10px', color: '#0B5AA0', fontWeight: 500 }}>{idx + 1}</td>
                      <td style={{ padding: '9px 10px' }}>{row.orgName || '-'}</td>
                      <td style={{ padding: '9px 10px' }}>{row.orgType || '-'}</td>
                      <td style={{ padding: '9px 10px' }}>{row.telephoneNumber || '-'}</td>
                      <td style={{ padding: '9px 10px' }}>{row.extension || '-'}</td>
                      <td style={{ padding: '9px 10px' }}>{row.alternateTelephoneNumber || '-'}</td>
                      <td style={{ padding: '9px 10px' }}>{row.emailId || '-'}</td>
                      <td style={{ padding: '9px 10px' }}>{row.contactName || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Policy Details */}
      <div style={sectionStyle}>
        <AccordionHeader section="policy" label="Policy Details" />
        {open === 'policy' && (
          <div style={{ padding: '0 20px 20px', borderTop: '1px solid #e5e7eb' }}>
            <IPGrid items={[
              { label: 'Policy No', value: pol?.policyNumber },
              { label: 'Line of Business (LOB)', value: pol?.lob },
              { label: 'Sub-Product', value: pol?.subProduct },
              { label: 'Insurance Type', value: null },
            ]} />
            <IPGrid items={[
              { label: 'Coverage Level', value: null },
              { label: 'Policy Period From', value: pol?.effectiveDate },
              { label: 'Policy Period To', value: null },
              { label: 'Policy Status', value: pol?.status },
            ]} />
          </div>
        )}
      </div>

      {/* Risk Details */}
      <div style={sectionStyle}>
        <AccordionHeader section="risk" label="Risk Details" />
        {open === 'risk' && (
          <div style={{ padding: '0 20px 20px', borderTop: '1px solid #e5e7eb' }}>
            <IPGrid items={[
              { label: 'Property Location With GEO', value: propertyLocationWithGeo },
              { label: 'Occupancy Type', value: risk?.occupancyType },
              { label: 'Construction Type', value: risk?.constructionType },
              { label: 'Age of Property', value: risk?.ageOfProperty },
            ]} />
            <IPGrid cols={3} items={[
              { label: 'Length of Occupancy', value: risk?.lengthOfOccupancy },
              { label: 'Roof Type', value: risk?.roofType },
              { label: 'Fire Protection Class', value: risk?.fireProtectionClass },
            ]} />
            <div style={{ padding: '14px 0' }}>
              <IPField label="Loss Location" value={data?.lossLocation} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type EscCol = 'escalatedBy' | 'escalatedDateTime' | 'worksheetId' | 'escalatedTo' | 'escalationReason' | 'priority' | 'comments';

const ESC_COLS: { key: EscCol; label: string; filterable: boolean }[] = [
  { key: 'escalatedBy',      label: 'Escalated By',          filterable: false },
  { key: 'escalatedDateTime',label: 'Escalated Date & Time', filterable: true  },
  { key: 'worksheetId',      label: 'Worksheet ID',          filterable: true  },
  { key: 'escalatedTo',      label: 'Escalated To',          filterable: true  },
  { key: 'escalationReason', label: 'Escalation Reason',     filterable: true  },
  { key: 'priority',         label: 'Priority',              filterable: true  },
  { key: 'comments',         label: 'Comments',              filterable: false },
];

function EscFilterPopup({ condFilter, onApplyCondition, onClear, onClose, anchorRect }: {
  condFilter: { op: string; value: string } | undefined;
  onApplyCondition: (f: { op: string; value: string } | undefined) => void;
  onClear: () => void;
  onClose: () => void;
  anchorRect: DOMRect;
}) {
  const [tab, setTab] = useState<'condition' | 'value'>('condition');
  const [condOp, setCondOp] = useState(condFilter?.op ?? 'Contains');
  const [condVal, setCondVal] = useState(condFilter?.value ?? '');
  const ref = useRef<HTMLDivElement>(null);
  useWorkflowOutsideClick(ref, onClose);

  return (
    <div ref={ref} onClick={e => e.stopPropagation()} style={{ position: 'fixed', top: anchorRect.bottom + 4, left: anchorRect.left, zIndex: 9999, background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.14)', minWidth: 280, maxWidth: 340 }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
        {(['condition', 'value'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '9px 0', border: 'none', background: 'none', fontSize: 13, fontWeight: tab === t ? 600 : 400, color: tab === t ? '#0B5AA0' : '#6b7280', borderBottom: tab === t ? '2px solid #0B5AA0' : '2px solid transparent', cursor: 'pointer' }}>
            {t === 'condition' ? 'Filter by Condition' : 'Filter by Value'}
          </button>
        ))}
      </div>
      {tab === 'value' ? (
        <>
          <div style={{ padding: '10px 14px 6px' }}>
            <input autoFocus placeholder="Search" style={{ fontSize: 13, padding: '7px 10px', width: '100%', border: '1px solid #d1d5db', borderRadius: 4, outline: 'none', boxSizing: 'border-box' as CSSProperties['boxSizing'] }} />
          </div>
          <div style={{ padding: '4px 14px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
              <input type="checkbox" style={{ width: 15, height: 15, accentColor: '#0B5AA0' }} />
              Select All
            </label>
          </div>
          <div style={{ minHeight: 80 }} />
          <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderTop: '1px solid #f3f4f6' }}>
            <button style={{ flex: 1, padding: '8px 0', fontSize: 13, background: '#0B5AA0', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, cursor: 'pointer' }}>Apply</button>
            <button onClick={onClose} style={{ padding: '8px 14px', fontSize: 13, background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
            <button onClick={() => { onClear(); onClose(); }} style={{ padding: '8px 14px', fontSize: 13, background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer' }}>Clear</button>
          </div>
        </>
      ) : (
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <select value={condOp} onChange={e => setCondOp(e.target.value)} style={{ fontSize: 13, width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 4 }}>
            {DOCUMENT_CONDITION_OPS.map(op => <option key={op}>{op}</option>)}
          </select>
          <input autoFocus placeholder="Value..." value={condVal} onChange={e => setCondVal(e.target.value)} style={{ fontSize: 13, width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 4 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { onApplyCondition(condVal ? { op: condOp, value: condVal } : undefined); onClose(); }} style={{ flex: 1, padding: '8px 0', background: '#0B5AA0', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Apply</button>
            <button onClick={() => { setCondVal(''); onClear(); onClose(); }} style={{ padding: '8px 14px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, cursor: 'pointer' }}>Clear</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Multi-chip email input ──────────────────────────────────────────────────
function EmailChipInput({ chips, onChange, placeholder, hasError }: {
  chips: string[]; onChange: (c: string[]) => void; placeholder?: string; hasError?: boolean;
}) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  function addChip(raw: string) {
    const val = raw.trim().toLowerCase();
    if (val && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) && !chips.includes(val)) {
      onChange([...chips, val]);
    }
    setInput('');
  }
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      addChip(input);
    } else if (e.key === 'Backspace' && !input && chips.length > 0) {
      onChange(chips.slice(0, -1));
    }
  }
  function onBlur() { if (input.trim()) addChip(input); }
  return (
    <div onClick={() => inputRef.current?.focus()} style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '6px 10px', border: `1px solid ${hasError ? '#dc2626' : '#d1d5db'}`, borderRadius: 4, minHeight: 38, background: '#fff', cursor: 'text', alignItems: 'center' }}>
      {chips.map(c => (
        <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#e0eaf8', color: '#1e3a5f', borderRadius: 3, padding: '2px 8px', fontSize: 12, fontWeight: 500 }}>
          {c}
          <button type="button" onClick={() => onChange(chips.filter(x => x !== c))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 0, lineHeight: 1, fontSize: 13 }}>×</button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        placeholder={chips.length === 0 ? placeholder : ''}
        style={{ border: 'none', outline: 'none', fontSize: 13, flex: 1, minWidth: 120, background: 'transparent', color: '#374151' }}
      />
    </div>
  );
}

// ─── Query Email Modal ────────────────────────────────────────────────────────
function QueryEmailModal({ onClose }: { claimId: number; onClose: () => void }) {
  const TEAM_MAIL = 'claims@insurance.com';

  const INTERNAL_ROLES = ['Underwriter', 'Claim Supervisor', 'Claim Manager', 'Legal', 'SIU / Fraud Team', 'Finance Team', 'Adjuster'];
  const EXTERNAL_ROLES = ['Claimant', 'Adjuster', 'Insured'];

  const [category,    setCategory]    = useState<'Internal' | 'External' | ''>('');
  const [department,  setDepartment]  = useState('');
  const [sendFrom,    setSendFrom]    = useState<'team' | 'user'>('team');
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [to,          setTo]          = useState<string[]>([]);
  const [cc,          setCc]          = useState<string[]>([]);
  const [bcc,         setBcc]         = useState<string[]>([]);
  const [subject,     setSubject]     = useState('');
  const [body,        setBody]        = useState('');
  const [file,        setFile]        = useState<File | null>(null);
  const [dragging,    setDragging]    = useState(false);
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const fileInputRef  = useRef<HTMLInputElement>(null);

  // load current user email once (for "Current User" option)
  useEffect(() => {
    authApi.getMe().then(u => setCurrentUserEmail(u.email)).catch(() => {});
  }, []);

  // reset department when category changes
  useEffect(() => { setDepartment(''); }, [category]);

  const fromEmail = sendFrom === 'team' ? TEAM_MAIL : currentUserEmail;
  const roleOptions = category === 'Internal' ? INTERNAL_ROLES : category === 'External' ? EXTERNAL_ROLES : [];

  function clearErr(k: string) { setErrors(p => { const n = { ...p }; delete n[k]; return n; }); }

  function handleSend() {
    onClose();
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }

  const ErrMsg = ({ k }: { k: string }) => errors[k]
    ? <div style={{ fontSize: 11, color: '#dc2626', marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="#dc2626"><circle cx="12" cy="12" r="10"/><text x="12" y="16.5" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold">!</text></svg>
        {errors[k]}
      </div>
    : null;

  const inp = (hasErr: boolean): CSSProperties => ({ width: '100%', padding: '8px 10px', fontSize: 13, border: `1px solid ${hasErr ? '#dc2626' : '#d1d5db'}`, borderRadius: 4, outline: 'none', boxSizing: 'border-box', background: '#fff' });
  const sel = (hasErr: boolean): CSSProperties => ({ ...inp(hasErr), cursor: 'pointer', appearance: 'auto' as CSSProperties['appearance'] });
  const lbl: CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 };
  const req = <span style={{ color: '#dc2626' }}>* </span>;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 10, width: '100%', maxWidth: 1100, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px', borderBottom: '1px solid #e5e7eb' }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>New Email</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Body — 3 columns */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '300px 1fr 260px', gap: 0 }}>

          {/* Left — sender config */}
          <div style={{ padding: '24px 24px', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div>
              <div style={lbl}>{req}Email Category</div>
              <select value={category} onChange={e => { setCategory(e.target.value as 'Internal' | 'External' | ''); clearErr('category'); }} style={sel(!!errors.category)}>
                <option value="">Select...</option>
                <option>Internal</option>
                <option>External</option>
              </select>
              <ErrMsg k="category" />
            </div>

            <div>
              <div style={lbl}>{req}Select Department / Role</div>
              <select value={department} onChange={e => { setDepartment(e.target.value); clearErr('department'); }} disabled={!category} style={sel(!!errors.department)}>
                <option value="">Select...</option>
                {roleOptions.map(r => <option key={r}>{r}</option>)}
              </select>
              <ErrMsg k="department" />
            </div>

            <div>
              <div style={lbl}>{req}Send From</div>
              <div style={{ display: 'flex', gap: 20 }}>
                {(['team', 'user'] as const).map(v => (
                  <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                    <input type="radio" checked={sendFrom === v} onChange={() => setSendFrom(v)} style={{ accentColor: '#0B5AA0', width: 15, height: 15 }} />
                    {v === 'team' ? 'Team Mail ID' : 'Current User'}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div style={lbl}>{req}From</div>
              <input readOnly value={fromEmail} style={{ ...inp(!!errors.from), background: '#f9fafb', color: '#6b7280' }} />
              <ErrMsg k="from" />
            </div>

            <div>
              <div style={lbl}>{req}To</div>
              <EmailChipInput chips={to} onChange={v => { setTo(v); clearErr('to'); }} placeholder="Enter email & press Enter" hasError={!!errors.to} />
              <ErrMsg k="to" />
            </div>

            <div>
              <div style={lbl}>CC</div>
              <EmailChipInput chips={cc} onChange={setCc} placeholder="Enter email & press Enter" />
            </div>

            <div>
              <div style={lbl}>BCC</div>
              <EmailChipInput chips={bcc} onChange={setBcc} placeholder="Enter email & press Enter" />
            </div>
          </div>

          {/* Middle — email content */}
          <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Email Content</div>

            <div>
              <div style={lbl}>{req}Email Subject</div>
              <input value={subject} onChange={e => { setSubject(e.target.value); clearErr('subject'); }} style={inp(!!errors.subject)} />
              <ErrMsg k="subject" />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={lbl}>{req}Email Body</div>
              <textarea
                value={body}
                onChange={e => { setBody(e.target.value); clearErr('body'); }}
                placeholder="Type Your Message Here"
                style={{ ...inp(!!errors.body), flex: 1, resize: 'none', minHeight: 260, fontFamily: 'inherit', lineHeight: 1.6 }}
              />
              <ErrMsg k="body" />
            </div>
          </div>

          {/* Right — file upload */}
          <div style={{ padding: '24px 20px', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Upload Document</div>

            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleFileDrop}
              style={{ border: `2px dashed ${dragging ? '#0B5AA0' : '#d1d5db'}`, borderRadius: 6, padding: '24px 16px', textAlign: 'center', background: dragging ? '#eff6ff' : '#fafafa', transition: 'all 0.15s' }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                {file ? file.name : 'Drag and Drop File Here or Select a File'}
              </div>
              {!file && (
                <>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 12, lineHeight: 1.5 }}>
                    Supported formats are Excel, JPEG, PNG, PDF, Doc and Pages<br />Files size: 10 KB - 10 MB
                  </div>
                  <button type="button" onClick={() => fileInputRef.current?.click()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #d1d5db', background: '#fff', borderRadius: 4, padding: '7px 16px', fontSize: 12, cursor: 'pointer', color: '#374151' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Browse File
                  </button>
                </>
              )}
              {file && (
                <button type="button" onClick={() => setFile(null)} style={{ marginTop: 8, fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
              )}
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.jpg,.jpeg,.png,.pdf,.doc,.docx,.pages" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); e.target.value = ''; }} />
            </div>
          </div>
        </div>

        {/* Footer */}
<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 28px', borderTop: '1px solid #e5e7eb' }}>
          <button onClick={onClose} style={{ padding: '9px 28px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', borderRadius: 4, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSend} style={{ padding: '9px 32px', background: '#0B5AA0', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tools Dropdown ───────────────────────────────────────────────────────────
const SEND_BACK_REASONS = [
  'Policy details mismatch',
  'Coverage applicability unclear',
  'Missing proof of loss',
  'Incorrect Claim details',
  'Mismatched insured property',
  'Additional inspection report needed',
  'Inconsistent statements between insured and documents',
  'Fraud indicators flagged – need recheck',
  'Third-party liability assessment pending',
  'Payee mismatch',
  'Reserve setup discrepancy',
  'Payment calculation mismatch',
  'Incorrect routing',
  'Authorization limit exceeded – needs higher approval',
  'Pending internal approval from another function',
  'Rework required as per audit/QA feedback',
];

function MarkClaimOpenModal({ onClose }: { onClose: () => void }) {
  const [comments, setComments] = useState('');
  const [error,    setError]    = useState('');

  function handleSave() {
    if (!comments.trim()) { setError('Comments are required.'); return; }
    onClose();
  }

  const overlayStyle: CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
  };
  const cardStyle: CSSProperties = {
    background: '#fff', borderRadius: 10, width: 480, maxWidth: '95vw',
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)', padding: '28px 32px 24px',
    display: 'flex', flexDirection: 'column', gap: 20,
  };

  return (
    <div style={overlayStyle} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>Mark Claim Open</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 6, display: 'block' }}>
            <span style={{ color: '#dc2626', marginRight: 3 }}>*</span>Comments
          </label>
          <textarea
            value={comments}
            onChange={e => { setComments(e.target.value); setError(''); }}
            placeholder="Type Your Message Here"
            rows={5}
            style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: 6, padding: '9px 12px', fontSize: 13, color: '#111827', background: '#f9fafb', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
          />
          {error && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>{error}</div>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 4 }}>
          <button onClick={onClose} style={{ padding: '9px 24px', borderRadius: 6, border: '1.5px solid #0B5AA0', background: '#fff', color: '#0B5AA0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSave} style={{ padding: '9px 24px', borderRadius: 6, border: 'none', background: '#0B5AA0', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function CloseClaimModal({ onClose }: { onClose: () => void }) {
  const [comments, setComments] = useState('');
  const [error,    setError]    = useState('');

  function handleSave() {
    if (!comments.trim()) { setError('Comments are required.'); return; }
    onClose();
  }

  const overlayStyle: CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
  };
  const cardStyle: CSSProperties = {
    background: '#fff', borderRadius: 10, width: 480, maxWidth: '95vw',
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)', padding: '28px 32px 24px',
    display: 'flex', flexDirection: 'column', gap: 20,
  };

  return (
    <div style={overlayStyle} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={cardStyle}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>Close Claim</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* Info banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 6, padding: '10px 14px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          <span style={{ fontSize: 13, color: '#92400e', fontWeight: 500 }}>Claim Reserve Should be Zero</span>
        </div>

        {/* Comments */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 6, display: 'block' }}>
            <span style={{ color: '#dc2626', marginRight: 3 }}>*</span>Comments
          </label>
          <textarea
            value={comments}
            onChange={e => { setComments(e.target.value); setError(''); }}
            placeholder="Type Your Message Here"
            rows={5}
            style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: 6, padding: '9px 12px', fontSize: 13, color: '#111827', background: '#f9fafb', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
          />
          {error && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>{error}</div>}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 4 }}>
          <button onClick={onClose} style={{ padding: '9px 24px', borderRadius: 6, border: '1.5px solid #0B5AA0', background: '#fff', color: '#0B5AA0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSave} style={{ padding: '9px 24px', borderRadius: 6, border: 'none', background: '#0B5AA0', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function SendBackModal({ onClose }: { onClose: () => void }) {
  const [reason,   setReason]   = useState('');
  const [comments, setComments] = useState('');
  const [errors,   setErrors]   = useState<{ reason?: string; comments?: string }>({});

  function handleSend() {
    const errs: { reason?: string; comments?: string } = {};
    if (!reason)          errs.reason   = 'Please select a reason.';
    if (!comments.trim()) errs.comments = 'Comments are required.';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onClose();
  }

  const overlayStyle: CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
  };
  const cardStyle: CSSProperties = {
    background: '#fff', borderRadius: 10, width: 480, maxWidth: '95vw',
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)', padding: '28px 32px 24px',
    display: 'flex', flexDirection: 'column', gap: 20,
  };
  const labelStyle: CSSProperties = { fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 6, display: 'block' };
  const reqStar: CSSProperties = { color: '#dc2626', marginRight: 3 };
  const fieldStyle: CSSProperties = {
    width: '100%', boxSizing: 'border-box', border: '1px solid #d1d5db',
    borderRadius: 6, padding: '9px 12px', fontSize: 13, color: '#111827',
    background: '#f9fafb', outline: 'none', appearance: 'none' as CSSProperties['appearance'],
  };
  const errStyle: CSSProperties = { fontSize: 11, color: '#dc2626', marginTop: 4 };

  return (
    <div style={overlayStyle} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={cardStyle}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>Reason for Send Back</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* Reason dropdown */}
        <div>
          <label style={labelStyle}>
            <span style={reqStar}>*</span>Reason for Send Back
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={reason}
              onChange={e => { setReason(e.target.value); setErrors(p => ({ ...p, reason: undefined })); }}
              style={{ ...fieldStyle, paddingRight: 36, cursor: 'pointer' }}
            >
              <option value="">Select...</option>
              {SEND_BACK_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <svg style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.2" strokeLinecap="round"><path d="m6 9 6 6 6-6" /></svg>
          </div>
          {errors.reason && <div style={errStyle}>{errors.reason}</div>}
        </div>

        {/* Comments textarea */}
        <div>
          <label style={labelStyle}>
            <span style={reqStar}>*</span>Comments
          </label>
          <textarea
            value={comments}
            onChange={e => { setComments(e.target.value); setErrors(p => ({ ...p, comments: undefined })); }}
            placeholder="Type Your Message Here"
            rows={5}
            style={{ ...fieldStyle, resize: 'vertical', fontFamily: 'inherit' }}
          />
          {errors.comments && <div style={errStyle}>{errors.comments}</div>}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 4 }}>
          <button onClick={onClose} style={{ padding: '9px 24px', borderRadius: 6, border: '1.5px solid #0B5AA0', background: '#fff', color: '#0B5AA0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSend} style={{ padding: '9px 24px', borderRadius: 6, border: 'none', background: '#0B5AA0', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function ToolsDropdown({ claimId }: { claimId: number }) {
  const [open,              setOpen]              = useState(false);
  const [queryOpen,         setQueryOpen]         = useState(false);
  const [sendBackOpen,      setSendBackOpen]      = useState(false);
  const [closeClaimOpen,    setCloseClaimOpen]    = useState(false);
  const [markClaimOpenOpen, setMarkClaimOpenOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useWorkflowOutsideClick(ref, () => setOpen(false));

  const toolItems = ['Query', 'Refer', 'Send Back', 'Close Claim', 'Mark Claim Open'];

  function handleItem(label: string) {
    setOpen(false);
    if (label === 'Query')           setQueryOpen(true);
    if (label === 'Send Back')       setSendBackOpen(true);
    if (label === 'Close Claim')     setCloseClaimOpen(true);
    if (label === 'Mark Claim Open') setMarkClaimOpenOpen(true);
  }

  return (
    <>
      <div ref={ref} style={{ position: 'relative' }}>
        <button onClick={() => setOpen(o => !o)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0B5AA0', color: '#fff', borderRadius: 4, padding: '9px 18px', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
          Tools
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 9 6 6 6-6" /></svg>
        </button>
        {open && (
          <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.14)', zIndex: 9999, minWidth: 210 }}>
            <div style={{ padding: '12px 16px', fontWeight: 700, fontSize: 14, color: '#111827', borderBottom: '1px solid #e5e7eb' }}>Options</div>
            {toolItems.map(label => (
              <button key={label} onClick={() => handleItem(label)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#374151', textAlign: 'left' as CSSProperties['textAlign'] }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.8" strokeLinecap="round"><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v5h5" /></svg>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
      {queryOpen         && <QueryEmailModal claimId={claimId} onClose={() => setQueryOpen(false)} />}
      {sendBackOpen      && <SendBackModal onClose={() => setSendBackOpen(false)} />}
      {closeClaimOpen    && <CloseClaimModal onClose={() => setCloseClaimOpen(false)} />}
      {markClaimOpenOpen && <MarkClaimOpenModal onClose={() => setMarkClaimOpenOpen(false)} />}
    </>
  );
}

function EscalationContent() {
  const [visibleCols, setVisibleCols] = useState<Set<EscCol>>(new Set(ESC_COLS.map(c => c.key)));
  const [showModifyCols, setShowModifyCols] = useState(false);
  const [modifyColsRect, setModifyColsRect] = useState<DOMRect | null>(null);
  const [openFilterCol, setOpenFilterCol] = useState<EscCol | null>(null);
  const [filterRects, setFilterRects] = useState<Partial<Record<EscCol, DOMRect>>>({});
  const [condFilters, setCondFilters] = useState<Partial<Record<EscCol, { op: string; value: string }>>>({});
  const modifyRef = useRef<HTMLDivElement>(null);
  useWorkflowOutsideClick(modifyRef, () => setShowModifyCols(false));

  const visibleDefs = ESC_COLS.filter(c => visibleCols.has(c.key));

  function CIField({ label, value, children }: { label: string; value?: string; children?: ReactNode }) {
    return (
      <div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>{label}</div>
        {children ?? <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{value}</div>}
      </div>
    );
  }

  function NameBadge({ initials, name, bg }: { initials: string; name: string; bg: string }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: '#111827' }}>
        <span style={{ width: 28, height: 28, borderRadius: '50%', background: bg, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{initials}</span>
        {name}
      </div>
    );
  }

  return (
    <div>
      {/* Claim Information */}
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: '#1a1a2e' }}>Claim Information</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px 16px', paddingBottom: 14, borderBottom: '1px solid #f3f4f6' }}>
          <CIField label="Claim ID" value="001-CL-0000001-0001" />
          <CIField label="Policy ID" value="001-00051-0000194-00" />
          <CIField label="Insured Name"><NameBadge initials="ML" name="Mark Last" bg="#94a3b8" /></CIField>
          <CIField label="LOB" value="E&S Homeowners" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px 16px', padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
          <CIField label="Sub Product" value="SuperPerils" />
          <CIField label="Claim Type" value="HO - Personal Liability" />
          <CIField label="Date of Loss" value="06-24-2026" />
          <CIField label="Loss of Location" value="10111 Morgan Lane, Suite # 205, Plainsboro, California, Middlesex County, United States, 85364" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px 16px', padding: '14px 0' }}>
          <CIField label="Claimant Name"><NameBadge initials="AM" name="Anthoney Mac" bg="#60a5fa" /></CIField>
          <CIField label="Relationship with Insured" value="Spouse" />
        </div>
      </div>

      {/* Escalation Parameters */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: '#1a1a2e' }}>Escalation Parameters</h2>
        <div style={{ position: 'relative', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ width: 42, padding: '10px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <button onClick={e => { setModifyColsRect(e.currentTarget.getBoundingClientRect()); setShowModifyCols(o => !o); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'inline-flex', alignItems: 'center' }}>
                    <MenuIcon />
                  </button>
                </th>
                {visibleDefs.map(col => (
                  <th key={col.key} style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb', fontWeight: 600, fontSize: 12, color: '#374151', whiteSpace: 'nowrap', textAlign: 'left' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {col.label}
                      {col.filterable && (
                        <span onClick={e => { e.stopPropagation(); const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); setFilterRects(prev => ({ ...prev, [col.key]: rect })); setOpenFilterCol(openFilterCol === col.key ? null : col.key); }} style={{ cursor: 'pointer', color: condFilters[col.key]?.value ? '#0B5AA0' : '#9ca3af', display: 'inline-flex', alignItems: 'center', marginLeft: 2 }}>
                          <FilterIcon />
                        </span>
                      )}
                    </span>
                    {openFilterCol === col.key && filterRects[col.key] && (
                      <EscFilterPopup
                        condFilter={condFilters[col.key]}
                        onApplyCondition={f => setCondFilters(prev => ({ ...prev, [col.key]: f }))}
                        onClear={() => setCondFilters(prev => { const next = { ...prev }; delete next[col.key]; return next; })}
                        onClose={() => setOpenFilterCol(null)}
                        anchorRect={filterRects[col.key]!}
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={1 + visibleDefs.length} style={{ height: 260, textAlign: 'center', fontSize: 20, fontWeight: 700, color: '#111827' }}>
                  No Data Available
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {showModifyCols && modifyColsRect && (
          <div ref={modifyRef} style={{ position: 'fixed', top: modifyColsRect.bottom + 4, left: modifyColsRect.left, zIndex: 9999, background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.14)', width: 260 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: 700, fontSize: 14, color: '#111827' }}>Modify Columns Display</div>
            <div style={{ padding: '8px 0' }}>
              {ESC_COLS.map(col => {
                const checked = visibleCols.has(col.key);
                return (
                  <label key={col.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', cursor: 'pointer', background: checked ? '#eff6ff' : 'transparent' }}>
                    <input type="checkbox" checked={checked} onChange={() => setVisibleCols(prev => { const next = new Set(prev); next.has(col.key) ? next.delete(col.key) : next.add(col.key); return next; })} style={{ width: 15, height: 15, accentColor: '#0B5AA0' }} />
                    <span style={{ fontSize: 13, color: checked ? '#0B5AA0' : '#374151' }}>{col.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function WorkflowComingSoon() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 500 }}>
      <div style={{ position: 'relative', width: 340, height: 260, userSelect: 'none' }}>
        {/* Radiating lines */}
        {[[-60, -30], [60, -30], [-80, 10], [80, 10], [-55, 55], [55, 55], [-30, 80], [30, 80]].map(([dx, dy], i) => (
          <div key={i} style={{ position: 'absolute', left: '50%', top: '50%', width: 2, height: 36, background: '#1a2e44', borderRadius: 1, transform: `translate(${dx * 1.5}px, ${dy * 1.5}px) rotate(${Math.atan2(dy, dx) * 180 / Math.PI + 90}deg)`, transformOrigin: 'top center', opacity: 0.5 }} />
        ))}

        {/* Main card */}
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', width: 260 }}>
          {/* Under Construction banner */}
          <div style={{ background: '#1a2e44', color: '#fff', fontSize: 13, fontWeight: 700, fontStyle: 'italic', letterSpacing: 2, padding: '5px 20px', borderRadius: 2, display: 'inline-block', marginBottom: 10, textTransform: 'uppercase' }}>
            Under Construction
          </div>

          {/* COMING SOON text */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div style={{ fontSize: 62, fontWeight: 900, lineHeight: 0.9, color: '#1a2e44', textTransform: 'uppercase', letterSpacing: -1 }}>
              COMING<br />SOON
            </div>
            {/* STAY TUNED circle */}
            <div style={{ position: 'absolute', right: -44, bottom: -8, width: 72, height: 72, borderRadius: '50%', background: '#00b4a0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', boxShadow: '0 2px 8px rgba(0,180,160,0.4)' }}>
              <span style={{ color: '#fff', fontSize: 11, fontWeight: 800, lineHeight: 1.1, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 }}>STAY<br />TUNED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GenerateLetterForm({ claimId, editLetter, onCancel, onSaved }: { claimId: number; editLetter?: ClaimLetterDetailDto | null; onCancel: () => void; onSaved: () => void }) {
  const [recipientRole,    setRecipientRole]    = useState(editLetter?.recipientRole    ?? '');
  const [recipientName,    setRecipientName]    = useState(editLetter?.recipientName    ?? '');
  const [deliveryMethod,   setDeliveryMethod]   = useState(editLetter?.deliveryMethod   ?? '');
  const [recipientEmail,   setRecipientEmail]   = useState(editLetter?.recipientEmail   ?? '');
  const [recipientAddress, setRecipientAddress] = useState(editLetter?.recipientAddress ?? '');
  const [letterDate,       setLetterDate]       = useState(editLetter?.letterDate       ?? '');
  const [priority,         setPriority]         = useState(editLetter?.priority         ?? '');
  const [letterType,       setLetterType]       = useState(editLetter?.letterType       ?? '');
  const [subject,          setSubject]          = useState(editLetter?.subject          ?? '');
  const [followUp,         setFollowUp]         = useState(editLetter?.followUp         ?? false);
  const [errors,           setErrors]           = useState<Record<string, string>>({});
  const [saving,           setSaving]           = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const letterCode = editLetter?.letterCode ?? 'Auto Generated';
  const auditCreatedBy   = editLetter?.createdByName ?? '-';
  const auditCreatedOn   = editLetter?.createdOn     ?? '-';
  const auditUpdatedBy   = editLetter?.updatedByName ?? '-';
  const auditUpdatedOn   = editLetter?.updatedOn     ?? '-';

  const RECIPIENT_ROLES  = ['Insured', 'Third-Party Claimant', 'Payee', 'Leinholder / Mortgage', 'Adjuster', 'Vendor', 'Others'];
  const DELIVERY_METHODS = ['Postal mail', 'Email'];
  const PRIORITIES       = ['Normal', 'High', 'Regulatory', 'Deadline'];
  const LETTER_TYPES     = ['Claim Acknowledgment Letter', 'Covered Liabilities Claim(s) Report and Assignment', 'Physical Damage Claim(s) Report and Assignment', 'Reservation of Rights', 'Settlement Offer'];

  function clearErr(key: string) { setErrors(prev => { const n = { ...prev }; delete n[key]; return n; }); }

  function validate() {
    const e: Record<string, string> = {};
    if (!recipientName.trim())    e.recipientName    = 'Provide Recipient Name to continue';
    if (!deliveryMethod)          e.deliveryMethod   = 'Provide Delivery Method to continue';
    if (!recipientEmail.trim())   e.recipientEmail   = 'Provide Recipient Email to continue';
    if (!recipientAddress.trim()) e.recipientAddress = 'Provide Recipient Address to continue';
    if (!letterDate.trim())       e.letterDate       = 'Provide Letter Date to continue';
    if (!priority)                e.priority         = 'Provide Priority to continue';
    if (!letterType)              e.letterType       = 'Provide Letter Type to continue';
    if (!subject.trim())          e.subject          = 'Provide Subject / Letter Title to continue';
    if (!bodyRef.current?.innerHTML?.trim()) e.letterBody = 'Provide Email / Letter body to continue';
    return e;
  }

  function buildRequest(): SaveClaimLetterRequest {
    return {
      id:               editLetter?.id ?? null,
      claimId,
      letterType,
      letterDate,
      subject,
      letterBody:       bodyRef.current?.innerHTML ?? '',
      recipientRole,
      recipientName,
      deliveryMethod,
      recipientEmail,
      recipientAddress,
      priority,
      followUp,
    };
  }

  async function handleSave() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setSaving(true);
    try {
      await claimLetterApi.save(claimId, buildRequest());
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  async function handleSend() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setSaving(true);
    try {
      const req = buildRequest();
      const saved = await claimLetterApi.save(claimId, req);
      await claimLetterApi.send(claimId, saved.id);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  function GLLabel({ label, required }: { label: string; required?: boolean }) {
    return <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{required && <span style={{ color: '#dc2626' }}>* </span>}{label}</div>;
  }
  function GLErr({ error }: { error?: string }) {
    if (!error) return null;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#dc2626"><circle cx="12" cy="12" r="10"/><text x="12" y="16.5" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold">!</text></svg>
        <span style={{ fontSize: 11, color: '#dc2626' }}>{error}</span>
      </div>
    );
  }
  function gfi(hasErr: boolean): CSSProperties { return { width: '100%', padding: '8px 12px', fontSize: 13, border: `1px solid ${hasErr ? '#dc2626' : '#d1d5db'}`, borderRadius: 4, outline: 'none', boxSizing: 'border-box' as CSSProperties['boxSizing'], background: '#fff' }; }
  function gfs(hasErr: boolean): CSSProperties { return { ...gfi(hasErr), cursor: 'pointer', appearance: 'auto' as CSSProperties['appearance'] }; }

  const TB1_ITEMS = ['Source','|','💾','📄','🔎','🖨','|','✂','📋','📄','📋','|','↩','↪','|','🔍','→','B','🧹','|','⊞','☑','□','▶','📦','🖼','🔗','⚓','✂🔗'];
  const TB2_ITEMS = ['B','I','U','S','X₂','X²','|','✂','ƒₓ','Iₓ','|','1.','•','⇤','⇥','❝','</>','|','≡←','⟤','⟥','⟦⟧','⁋','¶','|','🔗','🔗✕','⚓','🖼','⊞','⎯','☺','Ω','¶⊕','?'];
  const TB3_ITEMS = ['Styles ▾','Format ▾','Font ▾','Size ▾','|','A▾','A▾','|','⤢','⊞','?'];

  function TBRow({ items, small }: { items: string[]; small?: boolean }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, padding: '3px 4px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
        {items.map((item, i) => item === '|'
          ? <div key={i} style={{ width: 1, height: 14, background: '#d1d5db', margin: '0 2px' }} />
          : item.includes('▾') || item.includes('▼')
            ? <button key={i} style={{ padding: '2px 7px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 10, color: '#374151', borderRadius: 2, lineHeight: 1.5 }}>{item}</button>
            : <button key={i} style={{ padding: '2px 4px', border: '1px solid transparent', background: 'none', cursor: 'pointer', fontSize: small ? 10 : 12, color: '#374151', borderRadius: 2, lineHeight: 1 }}>{item}</button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Left: Correspondence Details */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '20px 22px' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 20 }}>Correspondence Details</div>

          <div style={{ marginBottom: 14 }}>
            <GLLabel label="Recipient Role" required />
            <select value={recipientRole} onChange={e => setRecipientRole(e.target.value)} style={gfs(false)}>
              <option value="">Select...</option>
              {RECIPIENT_ROLES.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <GLLabel label="Recipient Name" required />
            <input value={recipientName} onChange={e => { setRecipientName(e.target.value); clearErr('recipientName'); }} placeholder="Enter recipient name" style={gfi(!!errors.recipientName)} />
            <GLErr error={errors.recipientName} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <GLLabel label="Delivery Method" required />
            <select value={deliveryMethod} onChange={e => { setDeliveryMethod(e.target.value); clearErr('deliveryMethod'); }} style={gfs(!!errors.deliveryMethod)}>
              <option value="">Select...</option>
              {DELIVERY_METHODS.map(o => <option key={o}>{o}</option>)}
            </select>
            <GLErr error={errors.deliveryMethod} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <GLLabel label="Recipient Email" required />
            <input value={recipientEmail} onChange={e => { setRecipientEmail(e.target.value); clearErr('recipientEmail'); }} placeholder="Enter Email ID" style={gfi(!!errors.recipientEmail)} />
            <GLErr error={errors.recipientEmail} />
          </div>

          <div style={{ marginBottom: 6 }}>
            <GLLabel label="Recipient Address" required />
            <textarea value={recipientAddress} onChange={e => { setRecipientAddress(e.target.value); clearErr('recipientAddress'); }} placeholder="Enter complete address here" rows={4} style={{ ...gfi(!!errors.recipientAddress), resize: 'none', fontFamily: 'inherit' }} />
            <GLErr error={errors.recipientAddress} />
          </div>
        </div>

        {/* Right: Letter Identification */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '20px 22px' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 20 }}>Letter Identification</div>

          <div style={{ background: '#e0f7f4', border: '1px solid #b2dfdb', borderRadius: 4, padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <span style={{ color: '#00695c', fontWeight: 600, fontSize: 13 }}>{letterCode}</span>
            <span style={{ color: '#00897b', fontSize: 12 }}>Auto Generated</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <GLLabel label="Letter Date" required />
              <div style={{ position: 'relative' }}>
                <input value={letterDate} onChange={e => { setLetterDate(e.target.value); clearErr('letterDate'); }} placeholder="MM-DD-YYYY" style={{ ...gfi(!!errors.letterDate), paddingRight: 34 }} />
                <span style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none', display: 'flex' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                </span>
              </div>
              <GLErr error={errors.letterDate} />
            </div>
            <div>
              <GLLabel label="Priority" required />
              <select value={priority} onChange={e => { setPriority(e.target.value); clearErr('priority'); }} style={gfs(!!errors.priority)}>
                <option value="">Select...</option>
                {PRIORITIES.map(o => <option key={o}>{o}</option>)}
              </select>
              <GLErr error={errors.priority} />
            </div>
            <div>
              <GLLabel label="Letter Type" required />
              <select value={letterType} onChange={e => { setLetterType(e.target.value); clearErr('letterType'); }} style={gfs(!!errors.letterType)}>
                <option value="">Select...</option>
                {LETTER_TYPES.map(o => <option key={o}>{o}</option>)}
              </select>
              <GLErr error={errors.letterType} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <GLLabel label="Subject / Letter Title" required />
              <input value={subject} onChange={e => { setSubject(e.target.value); clearErr('subject'); }} style={gfi(!!errors.subject)} />
              <GLErr error={errors.subject} />
            </div>
            <div style={{ paddingTop: 20, display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Follow-Up Required</span>
              <div onClick={() => setFollowUp(o => !o)} style={{ width: 38, height: 22, borderRadius: 11, background: followUp ? '#0B5AA0' : '#d1d5db', position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 3, left: followUp ? 19 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
            </div>
          </div>

          <div>
            <GLLabel label="Email / Letter body" required />
            <div style={{ border: `1px solid ${errors.letterBody ? '#dc2626' : '#d1d5db'}`, borderRadius: 4, overflow: 'hidden' }}>
              <TBRow items={TB1_ITEMS} small />
              <TBRow items={TB2_ITEMS} />
              <TBRow items={TB3_ITEMS} />
              <div
                ref={bodyRef}
                contentEditable
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: editLetter?.letterBody ?? '' }}
                onInput={() => clearErr('letterBody')}
                style={{ minHeight: 180, padding: '10px 12px', fontSize: 13, outline: 'none', color: '#374151', lineHeight: 1.6 }}
              />
            </div>
            <GLErr error={errors.letterBody} />
          </div>
        </div>
      </div>

      {/* Audit & Compliance */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '16px 22px', marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 14 }}>Audit & Compliance</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px 16px' }}>
          {[['Created By', auditCreatedBy], ['Date Created', auditCreatedOn], ['Last Modified By', auditUpdatedBy], ['Last Modified Date', auditUpdatedOn]].map(([lbl, val]) => (
            <div key={lbl}>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 3 }}>{lbl}</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '10px 0 4px', borderTop: '1px solid #e5e7eb' }}>
        <button onClick={onCancel} disabled={saving} style={{ padding: '8px 28px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', borderRadius: 4, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{ padding: '8px 28px', border: '1px solid #0B5AA0', background: '#fff', color: '#0B5AA0', borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={handleSend} disabled={saving} style={{ padding: '8px 28px', border: 'none', background: '#0B5AA0', color: '#fff', borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

type ClLetterCol = 'action' | 'letterType' | 'letterDate' | 'sendDate' | 'recipientName' | 'recipientRole' | 'recipientEmail';

const CL_COLS: { key: ClLetterCol; label: string; filterable: boolean; alwaysOn: boolean }[] = [
  { key: 'action',         label: 'Action',          filterable: false, alwaysOn: true  },
  { key: 'letterType',     label: 'Letter Type',     filterable: true,  alwaysOn: false },
  { key: 'letterDate',     label: 'Letter Date',     filterable: true,  alwaysOn: false },
  { key: 'sendDate',       label: 'Send Date',       filterable: true,  alwaysOn: false },
  { key: 'recipientName',  label: 'Recipient Name',  filterable: true,  alwaysOn: false },
  { key: 'recipientRole',  label: 'Recipient Role',  filterable: true,  alwaysOn: false },
  { key: 'recipientEmail', label: 'Recipient Email', filterable: true,  alwaysOn: false },
];

function ClaimLettersContent({ claimId, view, onViewChange }: { claimId: number; view: 'list' | 'generate'; onViewChange: (v: 'list' | 'generate') => void }) {
  const [search,         setSearch]         = useState('');
  const [letters,        setLetters]        = useState<ClaimLetterListItemDto[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [editLetter,     setEditLetter]     = useState<ClaimLetterDetailDto | null>(null);
  const [visibleCols,    setVisibleCols]    = useState<Set<ClLetterCol>>(new Set(CL_COLS.map(c => c.key)));
  const [showModifyCols, setShowModifyCols] = useState(false);
  const [modifyColsRect, setModifyColsRect] = useState<DOMRect | null>(null);
  const [openFilterCol,  setOpenFilterCol]  = useState<ClLetterCol | null>(null);
  const [filterRects,    setFilterRects]    = useState<Partial<Record<ClLetterCol, DOMRect>>>({});
  const [condFilters,    setCondFilters]    = useState<Partial<Record<ClLetterCol, { op: string; value: string }>>>({});
  const modifyRef = useRef<HTMLDivElement>(null);
  useWorkflowOutsideClick(modifyRef, () => setShowModifyCols(false));

  function loadList() {
    setLoading(true);
    claimLetterApi.getList(claimId)
      .then(data => setLetters(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadList(); }, [claimId]);

  function getVal(row: ClaimLetterListItemDto, key: ClLetterCol): string {
    if (key === 'action') return '';
    return String(row[key as keyof ClaimLetterListItemDto] ?? '');
  }

  const condMatches = (row: ClaimLetterListItemDto) =>
    Object.entries(condFilters).every(([col, f]) => {
      if (!f?.value) return true;
      const cell = getVal(row, col as ClLetterCol).toLowerCase();
      const v = f.value.toLowerCase();
      if (f.op === 'contains')          return cell.includes(v);
      if (f.op === 'does not contain')  return !cell.includes(v);
      if (f.op === 'equals')            return cell === v;
      if (f.op === 'does not equal')    return cell !== v;
      if (f.op === 'starts with')       return cell.startsWith(v);
      if (f.op === 'ends with')         return cell.endsWith(v);
      return true;
    });

  const keyword = search.toLowerCase();
  const filtered = letters.filter(row =>
    (!keyword || Object.values(row).some(v => String(v ?? '').toLowerCase().includes(keyword))) &&
    condMatches(row)
  );

  const visibleDefs = CL_COLS.filter(c => visibleCols.has(c.key));

  async function handleEdit(row: ClaimLetterListItemDto) {
    try {
      const detail = await claimLetterApi.getById(claimId, row.id);
      setEditLetter(detail);
      onViewChange('generate');
    } catch {}
  }

  async function handleSend(row: ClaimLetterListItemDto) {
    try {
      await claimLetterApi.send(claimId, row.id);
      loadList();
    } catch {}
  }

  async function handleDelete(row: ClaimLetterListItemDto) {
    if (!window.confirm('Delete this letter?')) return;
    try {
      await claimLetterApi.delete(claimId, row.id);
      loadList();
    } catch {}
  }

  if (view === 'generate') {
    return (
      <GenerateLetterForm
        claimId={claimId}
        editLetter={editLetter}
        onCancel={() => { setEditLetter(null); onViewChange('list'); }}
        onSaved={() => { setEditLetter(null); onViewChange('list'); loadList(); }}
      />
    );
  }

  const PRIORITY_COLORS: Record<string, string> = {
    High: '#dc2626', Regulatory: '#7c3aed', Deadline: '#ea580c', Normal: '#16a34a',
  };

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #d1d5db', borderRadius: 6, padding: '8px 14px', background: '#fff', flex: 1, maxWidth: 400 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by Keyword" style={{ border: 'none', outline: 'none', fontSize: 13, width: '100%', background: 'transparent', color: '#374151' }} />
        </div>
        <button onClick={() => { setEditLetter(null); onViewChange('generate'); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0B5AA0', color: '#fff', border: 'none', borderRadius: 4, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          + Generate Letter
        </button>
      </div>

      {/* Table */}
      <div style={{ position: 'relative', overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 6 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              <th style={{ width: 42, padding: '10px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb', textAlign: 'center' }}>
                <button onClick={e => { setModifyColsRect(e.currentTarget.getBoundingClientRect()); setShowModifyCols(o => !o); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'inline-flex', alignItems: 'center' }}>
                  <MenuIcon />
                </button>
              </th>
              {visibleDefs.map(col => (
                <th key={col.key} style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb', fontWeight: 600, fontSize: 12, color: '#374151', whiteSpace: 'nowrap', textAlign: 'left' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {col.label}
                    {col.filterable && (
                      <span onClick={e => { e.stopPropagation(); const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); setFilterRects(prev => ({ ...prev, [col.key]: rect })); setOpenFilterCol(openFilterCol === col.key ? null : col.key); }} style={{ cursor: 'pointer', color: condFilters[col.key]?.value ? '#0B5AA0' : '#9ca3af', display: 'inline-flex', alignItems: 'center', marginLeft: 2 }}>
                        <FilterIcon />
                      </span>
                    )}
                  </span>
                  {openFilterCol === col.key && filterRects[col.key] && (
                    <EscFilterPopup condFilter={condFilters[col.key]} onApplyCondition={f => setCondFilters(prev => ({ ...prev, [col.key]: f }))} onClear={() => setCondFilters(prev => { const next = { ...prev }; delete next[col.key]; return next; })} onClose={() => setOpenFilterCol(null)} anchorRect={filterRects[col.key]!} />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={1 + visibleDefs.length} style={{ height: 120, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={1 + visibleDefs.length} style={{ height: 280, textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#111827' }}>No Data Available</td></tr>
            ) : filtered.map((row, i) => (
              <tr key={row.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '8px 10px', borderRight: '1px solid #e5e7eb', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                    <button title="Edit" onClick={() => handleEdit(row)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0B5AA0', padding: '2px 4px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    {row.status !== 'Sent' && (
                      <button title="Send" onClick={() => handleSend(row)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', padding: '2px 4px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                      </button>
                    )}
                    <button title="Delete" onClick={() => handleDelete(row)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '2px 4px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </div>
                </td>
                {visibleDefs.map(col => {
                  let cell: React.ReactNode = '';
                  if (col.key === 'action') cell = '';
                  else if (col.key === 'letterType') cell = <span style={{ fontWeight: 500 }}>{row.letterType ?? '-'}</span>;
                  else if (col.key === 'letterDate') cell = row.letterDate ?? '-';
                  else if (col.key === 'sendDate') cell = row.sendDate
                    ? <span style={{ color: '#16a34a', fontWeight: 500 }}>{row.sendDate}</span>
                    : <span style={{ color: '#9ca3af', fontSize: 11 }}>{row.status === 'Sent' ? 'Sent' : 'Draft'}</span>;
                  else if (col.key === 'recipientName') cell = row.recipientName ?? '-';
                  else if (col.key === 'recipientRole') cell = row.recipientRole ?? '-';
                  else if (col.key === 'recipientEmail') cell = row.recipientEmail ?? '-';
                  const priorityColor = PRIORITY_COLORS[row.priority ?? ''];
                  return (
                    <td key={col.key} style={{ padding: '10px 14px', borderRight: '1px solid #f3f4f6', verticalAlign: 'middle' }}>
                      {col.key === 'letterType' && priorityColor
                        ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{cell}<span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: priorityColor, borderRadius: 3, padding: '1px 5px' }}>{row.priority}</span></div>
                        : cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modify Columns panel */}
      {showModifyCols && modifyColsRect && (
        <div ref={modifyRef} style={{ position: 'fixed', top: modifyColsRect.bottom + 4, left: modifyColsRect.left, zIndex: 9999, background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.14)', width: 260 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: 700, fontSize: 14, color: '#111827' }}>Modify Columns Display</div>
          <div style={{ padding: '8px 0' }}>
            {CL_COLS.map(col => {
              const checked = visibleCols.has(col.key);
              return (
                <label key={col.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', cursor: col.alwaysOn ? 'default' : 'pointer', background: checked ? '#eff6ff' : 'transparent' }}>
                  <input type="checkbox" checked={checked} disabled={col.alwaysOn} onChange={() => { if (!col.alwaysOn) setVisibleCols(prev => { const next = new Set(prev); next.has(col.key) ? next.delete(col.key) : next.add(col.key); return next; }); }} style={{ width: 15, height: 15, accentColor: '#0B5AA0' }} />
                  <span style={{ fontSize: 13, color: col.alwaysOn ? '#9ca3af' : checked ? '#0B5AA0' : '#374151' }}>{col.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

type TaskTab = 'escalation' | 'riskSurvey' | 'underwriting' | 'customerService' | 'legalCompliance' | 'fraudSiu';

const TASK_TABS: { key: TaskTab; label: string }[] = [
  { key: 'escalation',       label: 'Claim Escalation' },
  { key: 'riskSurvey',      label: 'Risk Survey' },
  { key: 'underwriting',    label: 'Underwriting' },
  { key: 'customerService', label: 'Customer Service' },
  { key: 'legalCompliance', label: 'Legal & Compliance' },
  { key: 'fraudSiu',        label: 'Fraud SIU' },
];

function AddTaskForm({ claimId, onCancel, onSaved }: { claimId: number; onCancel: () => void; onSaved?: () => void }) {
  const [taskType,       setTaskType]       = useState('');
  const [taskHeading,    setTaskHeading]    = useState('');
  const [taskDesc,       setTaskDesc]       = useState('');
  const [taskPriority,   setTaskPriority]   = useState('');
  const [taskDueDate,    setTaskDueDate]    = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [followUpDate,   setFollowUpDate]   = useState('');
  const [assignedTo,     setAssignedTo]     = useState<{ id: number; fullName: string } | null>(null);
  const [comments,       setComments]       = useState('');
  const [errors,         setErrors]         = useState<Record<string, string>>({});
  const [assignSearch,   setAssignSearch]   = useState('');
  const [showAssignDrop, setShowAssignDrop] = useState(false);
  const [docFileName,    setDocFileName]    = useState('');
  const [saving,         setSaving]         = useState(false);
  const [assignees,      setAssignees]      = useState<TaskAssigneeDto[]>([]);
  const docRef    = useRef<HTMLInputElement>(null);
  const assignRef = useRef<HTMLDivElement>(null);
  useWorkflowOutsideClick(assignRef, () => setShowAssignDrop(false));

  useEffect(() => {
    taskApi.getAssignees().then(setAssignees).catch(console.error);
  }, []);

  const TASK_TYPE_OPTS = ['Claim Escalation', 'Risk Survey', 'Underwriting', 'Customer Service', 'Legal & Compliance', 'Fraud SIU'];
  const PRIORITY_OPTS  = ['Low', 'Medium', 'High'];
  const filteredAssignees = assignees.filter(a => a.fullName.toLowerCase().includes(assignSearch.toLowerCase()));

  function clearErr(key: string) { setErrors(prev => { const n = { ...prev }; delete n[key]; return n; }); }

  function validate() {
    const e: Record<string, string> = {};
    if (!taskType)              e.taskType       = 'Provide Task Type to continue';
    if (!taskHeading.trim())    e.taskHeading    = 'Provide Task Heading to continue';
    if (!taskDesc.trim())       e.taskDesc       = 'Provide Task Description to continue';
    if (!taskPriority)          e.taskPriority   = 'Provide Task Priority to continue';
    if (!taskDueDate.trim())    e.taskDueDate    = 'Provide Task Due Date to continue';
    if (!completionDate.trim()) e.completionDate = 'Provide Completion Date to continue';
    if (!followUpDate.trim())   e.followUpDate   = 'Provide Follow-Up Date to continue';
    if (!assignedTo)            e.assignedTo     = 'Provide Assigned To to continue';
    return e;
  }

  async function handleSave() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setSaving(true);
    try {
      const req: CreateOrUpdateTaskRequest = {
        id: null, claimId,
        taskType: taskType || null,
        taskHeading: taskHeading || null,
        taskDescription: taskDesc || null,
        taskPriority: taskPriority || null,
        taskDueDate: taskDueDate || null,
        completionDate: completionDate || null,
        followUpDate: followUpDate || null,
        assignedTo: assignedTo?.id ?? null,
        comments: comments || null,
        status: null,
      };
      await taskApi.createOrUpdate(req);
      onSaved?.();
      onCancel();
    } catch {
      setSaving(false);
    }
  }

  function TLabel({ label, required }: { label: string; required?: boolean }) {
    return <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{required && <span style={{ color: '#dc2626' }}>* </span>}{label}</div>;
  }

  function TErr({ error }: { error?: string }) {
    if (!error) return null;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#dc2626"><circle cx="12" cy="12" r="10"/><text x="12" y="16.5" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold">!</text></svg>
        <span style={{ fontSize: 11, color: '#dc2626' }}>{error}</span>
      </div>
    );
  }

  function ti(hasErr: boolean): CSSProperties {
    return { width: '100%', padding: '8px 10px', fontSize: 13, border: `1px solid ${hasErr ? '#dc2626' : '#d1d5db'}`, borderRadius: 4, outline: 'none', boxSizing: 'border-box' as CSSProperties['boxSizing'] };
  }
  function ts(hasErr: boolean): CSSProperties {
    return { ...ti(hasErr), background: '#fff', cursor: 'pointer', appearance: 'auto' as CSSProperties['appearance'] };
  }

  function DateInput({ value, onChange, hasErr }: { value: string; onChange: (v: string) => void; hasErr: boolean }) {
    return (
      <div style={{ position: 'relative' }}>
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder="MM-DD-YYYY" style={{ ...ti(hasErr), paddingRight: 34 }} />
        <span style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none', display: 'flex' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '42% 1fr', border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden', minHeight: 580 }}>

        {/* Left panel */}
        <div style={{ padding: '20px 22px', borderRight: '3px solid #0B5AA0' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 14 }}>Claim Linkage</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px', marginBottom: 14 }}>
            {[['Claim No','001-CL-0000001-0001'],['Policy No','001-00051-0000194-00'],['Date of Loss','06-24-2026'],['Claim Type','HO - Personal Liability']].map(([lbl,val]) => (
              <div key={lbl}><div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 3 }}>{lbl}</div><div style={{ fontSize: 13, fontWeight: 500 }}>{val}</div></div>
            ))}
          </div>
          <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 5 }}>Insured Name</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500 }}>
              <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#94a3b8', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>ML</span>
              Mark Last
            </div>
          </div>

          <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 14 }}>Financials</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px', marginBottom: 10 }}>
            <div><div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 3 }}>Existing Reserves</div><div style={{ fontSize: 13, fontWeight: 500 }}>-</div></div>
            <div><div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 3 }}>Paid Amount - Indemnity</div><div style={{ fontSize: 13, fontWeight: 500 }}>-</div></div>
          </div>
          <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 3 }}>Paid Amount - Expense</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>-</div>
          </div>

          <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 14 }}>Reference Documents</div>
          <div style={{ border: '1px dashed #d1d5db', borderRadius: 6, background: '#fafafa', padding: '22px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Drag and Drop File Here or Select a File</div>
            <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.6, marginBottom: 14 }}>
              Supported formats are JPG, PNG, DOCS, XLSX, XLS, TXT, PDF, DOC, CSV, and JPEG<br />Files size: 10 KB - 10 MB
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', border: '1px solid #0B5AA0', borderRadius: 4, color: '#0B5AA0', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: '#fff' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Browse File
              <input ref={docRef} type="file" style={{ display: 'none' }} onChange={e => setDocFileName(e.target.files?.[0]?.name ?? '')} />
            </label>
            {docFileName && <div style={{ marginTop: 6, fontSize: 12, color: '#0B5AA0' }}>{docFileName}</div>}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 14 }}>Task Information</div>
          <div style={{ background: '#e0f7f4', border: '1px solid #b2dfdb', borderRadius: 4, padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ color: '#00695c', fontWeight: 600, fontSize: 13 }}>Task ID - 001</span>
            <span style={{ color: '#00897b', fontSize: 12 }}>Auto Generated</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <TLabel label="Task Type" required />
              <select value={taskType} onChange={e => { setTaskType(e.target.value); clearErr('taskType'); }} style={ts(!!errors.taskType)}>
                <option value="">Select...</option>
                {TASK_TYPE_OPTS.map(o => <option key={o}>{o}</option>)}
              </select>
              <TErr error={errors.taskType} />
            </div>
            <div>
              <TLabel label="Task Heading" required />
              <input value={taskHeading} onChange={e => { setTaskHeading(e.target.value); clearErr('taskHeading'); }} placeholder="Enter Heading" style={ti(!!errors.taskHeading)} />
              <TErr error={errors.taskHeading} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <TLabel label="Task Description" required />
            <textarea value={taskDesc} onChange={e => { setTaskDesc(e.target.value); clearErr('taskDesc'); }} placeholder="Type Your Message Here" rows={3} style={{ ...ti(!!errors.taskDesc), resize: 'none', fontFamily: 'inherit' }} />
            <TErr error={errors.taskDesc} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <TLabel label="Task Priority" required />
              <select value={taskPriority} onChange={e => { setTaskPriority(e.target.value); clearErr('taskPriority'); }} style={ts(!!errors.taskPriority)}>
                <option value="">Select...</option>
                {PRIORITY_OPTS.map(o => <option key={o}>{o}</option>)}
              </select>
              <TErr error={errors.taskPriority} />
            </div>
            <div>
              <TLabel label="Task Due Date" required />
              <DateInput value={taskDueDate} onChange={v => { setTaskDueDate(v); clearErr('taskDueDate'); }} hasErr={!!errors.taskDueDate} />
              <TErr error={errors.taskDueDate} />
            </div>
            <div>
              <TLabel label="Completion Date" required />
              <DateInput value={completionDate} onChange={v => { setCompletionDate(v); clearErr('completionDate'); }} hasErr={!!errors.completionDate} />
              <TErr error={errors.completionDate} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <TLabel label="Follow-Up Date" required />
              <DateInput value={followUpDate} onChange={v => { setFollowUpDate(v); clearErr('followUpDate'); }} hasErr={!!errors.followUpDate} />
              <TErr error={errors.followUpDate} />
            </div>
            <div>
              <TLabel label="Assigned To" required />
              <div ref={assignRef} style={{ position: 'relative' }}>
                <div onClick={() => setShowAssignDrop(o => !o)} style={{ ...ti(!!errors.assignedTo), display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <span style={{ color: assignedTo ? '#111827' : '#9ca3af', fontSize: 13 }}>{assignedTo?.fullName || 'Select...'}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"><path d={showAssignDrop ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'} /></svg>
                </div>
                {showAssignDrop && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999, background: '#fff', border: '1px solid #d1d5db', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.12)', marginTop: 2 }}>
                    <div style={{ padding: '7px 10px', borderBottom: '1px solid #f3f4f6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #d1d5db', borderRadius: 4, padding: '4px 8px' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
                        <input autoFocus value={assignSearch} onChange={e => setAssignSearch(e.target.value)} placeholder="Search..." style={{ border: 'none', outline: 'none', fontSize: 13, width: '100%' }} />
                      </div>
                    </div>
                    {filteredAssignees.map(a => (
                      <div key={a.id} onClick={() => { setAssignedTo(a); setShowAssignDrop(false); setAssignSearch(''); clearErr('assignedTo'); }}
                        style={{ padding: '9px 12px', fontSize: 13, cursor: 'pointer', color: '#374151' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}
                      >{a.fullName}</div>
                    ))}
                  </div>
                )}
              </div>
              <TErr error={errors.assignedTo} />
            </div>
          </div>

          <div>
            <TLabel label="Comments" />
            <textarea value={comments} onChange={e => setComments(e.target.value)} placeholder="Type Your Message Here" rows={3} style={{ ...ti(false), resize: 'none', fontFamily: 'inherit' }} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '14px 0 4px', borderTop: '1px solid #e5e7eb', marginTop: 14 }}>
        <button onClick={onCancel} style={{ padding: '8px 28px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', borderRadius: 4, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{ padding: '8px 28px', border: 'none', background: saving ? '#93c5fd' : '#0B5AA0', color: '#fff', borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </div>
  );
}

function TaskContent({ claimId, view, onViewChange }: { claimId: number; view: 'list' | 'add'; onViewChange: (v: 'list' | 'add') => void }) {
  const [activeTab, setActiveTab] = useState<TaskTab>('escalation');
  const [searches,  setSearches]  = useState<Record<string, string>>({});
  const [tasks,     setTasks]     = useState<TaskListItemDto[]>([]);
  const [counts,    setCounts]    = useState<TaskTypeCountDto | null>(null);
  const [loading,   setLoading]   = useState(false);

  const TAB_TYPE: Record<TaskTab, string> = {
    escalation:      'Claim Escalation',
    riskSurvey:      'Risk Survey',
    underwriting:    'Underwriting',
    customerService: 'Customer Service',
    legalCompliance: 'Legal & Compliance',
    fraudSiu:        'Fraud SIU',
  };

  const TAB_COUNT: Record<TaskTab, number> = {
    escalation:      counts?.claimEscalation ?? 0,
    riskSurvey:      counts?.riskSurvey ?? 0,
    underwriting:    counts?.underwriting ?? 0,
    customerService: counts?.customerService ?? 0,
    legalCompliance: counts?.legalCompliance ?? 0,
    fraudSiu:        counts?.fraudSiu ?? 0,
  };

  useEffect(() => {
    taskApi.getCounts(claimId).then(setCounts).catch(console.error);
  }, [claimId]);

  useEffect(() => {
    if (view !== 'list') return;
    let cancelled = false;
    setLoading(true);
    taskApi.getByType(claimId, TAB_TYPE[activeTab])
      .then(data => { if (!cancelled) { setTasks(data); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [claimId, activeTab, view]);

  function refreshAll() {
    taskApi.getCounts(claimId).then(setCounts).catch(console.error);
    taskApi.getByType(claimId, TAB_TYPE[activeTab]).then(setTasks).catch(console.error);
  }

  if (view === 'add') return <AddTaskForm claimId={claimId} onCancel={() => onViewChange('list')} onSaved={refreshAll} />;

  const STATUS_COLUMNS: { key: string; label: string; status: string }[] = [
    { key: 'new',       label: 'New',                status: 'New' },
    { key: 'inProgress',label: 'Open - In Progress', status: 'Open - In Progress' },
    { key: 'onHold',    label: 'Open - On Hold',     status: 'Open - On Hold' },
    { key: 'escalated', label: 'Open - Escalated',   status: 'Open - Escalated' },
    { key: 'closed',    label: 'Closed',              status: 'Closed' },
  ];

  const PRIORITY_COLOR: Record<string, string> = { High: '#dc2626', Medium: '#d97706', Low: '#16a34a' };

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: 16 }}>
        {TASK_TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === tab.key ? 600 : 400, color: activeTab === tab.key ? '#0B5AA0' : '#374151', borderBottom: activeTab === tab.key ? '2px solid #0B5AA0' : '2px solid transparent', marginBottom: -2, whiteSpace: 'nowrap' }}
          >
            {tab.label} ({TAB_COUNT[tab.key]})
          </button>
        ))}
      </div>

      {/* Kanban board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {STATUS_COLUMNS.map(col => {
          const filtered = searches[col.key]
            ? tasks.filter(t => t.status === col.status && ((t.taskHeading ?? '').toLowerCase().includes(searches[col.key].toLowerCase()) || t.taskCode.toLowerCase().includes(searches[col.key].toLowerCase())))
            : tasks.filter(t => t.status === col.status);

          return (
            <div key={col.key} style={{ border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', display: 'flex', flexDirection: 'column', minHeight: 480 }}>
              <div style={{ padding: '11px 14px', fontWeight: 600, fontSize: 13, color: '#111827', borderBottom: '1px solid #e5e7eb' }}>
                {col.label} ({filtered.length})
              </div>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #d1d5db', borderRadius: 4, padding: '6px 10px', background: '#fff', cursor: 'text' }}>
                  <SearchIcon />
                  <input placeholder="Search" value={searches[col.key] ?? ''} onChange={e => setSearches(prev => ({ ...prev, [col.key]: e.target.value }))} style={{ border: 'none', outline: 'none', fontSize: 13, width: '100%', background: 'transparent' }} />
                </label>
              </div>
              <div style={{ flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
                {loading ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#9ca3af' }}>Loading...</div>
                ) : filtered.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#111827' }}>No Data Available</div>
                ) : filtered.map(task => (
                  <div key={task.id} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '12px 14px', background: '#fafafa' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#0B5AA0' }}>{task.taskCode}</span>
                      {task.taskPriority && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: PRIORITY_COLOR[task.taskPriority] ?? '#374151', border: `1px solid ${PRIORITY_COLOR[task.taskPriority] ?? '#d1d5db'}`, borderRadius: 4, padding: '1px 7px' }}>
                          {task.taskPriority}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', marginBottom: 6 }}>{task.taskHeading || '-'}</div>
                    {task.taskDueDate && (
                      <div style={{ fontSize: 11, color: '#6b7280' }}>Due: {task.taskDueDate}</div>
                    )}
                    {task.assigneeUserName && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                        <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#94a3b8', color: '#fff', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          {task.assigneeUserName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                        <span style={{ fontSize: 11, color: '#374151' }}>{task.assigneeUserName}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


function TimelineContent({ claimId }: { claimId: number }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showTop,  setShowTop]  = useState(false);
  const [items,    setItems]    = useState<TaskTimelineDto[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    taskApi.getTimeline(claimId)
      .then(data => { if (!cancelled) { setItems(data); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [claimId]);

  function handleScroll() { setShowTop((scrollRef.current?.scrollTop ?? 0) > 120); }
  function scrollToTop() { scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }

  return (
    <div ref={scrollRef} onScroll={handleScroll} style={{ position: 'relative', maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', paddingRight: 4 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 24 }}>
        {loading ? 'Loading...' : `Total ${items.length} Service Request${items.length !== 1 ? 's' : ''} Raised`}
      </div>

      {!loading && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#6b7280', fontSize: 14 }}>No timeline activity yet.</div>
      )}

      <div style={{ position: 'relative', paddingLeft: 160 }}>
        {items.length > 0 && <div style={{ position: 'absolute', left: 140, top: 10, bottom: 10, width: 1, borderLeft: '2px dashed #cbd5e1' }} />}

        {items.map((item, i) => (
          <div key={i} style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', marginBottom: 28 }}>
            <div style={{ position: 'absolute', left: -160, top: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-block', padding: '4px 12px', border: '1.5px solid #1e3a5f', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#1e3a5f', background: '#fff', whiteSpace: 'nowrap' }}>
                {item.date}
              </span>
            </div>
            <div style={{ position: 'absolute', left: -22, top: 10, width: 14, height: 14, borderRadius: '50%', border: '2.5px solid #1e3a5f', background: '#fff', zIndex: 1 }} />
            <div style={{ flex: 1, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#0B5AA0', border: '1px solid #0B5AA0', borderRadius: 4, padding: '2px 10px' }}>
                  {item.activityType}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>Transaction ID</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{item.transactionId}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>Updated by</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.updatedBy}</div>
                </div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>Activity Description</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{item.description}</div>
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic' }}>Timestamp: {item.timestamp}</div>
            </div>
          </div>
        ))}
      </div>

      {showTop && (
        <button onClick={scrollToTop} style={{ position: 'fixed', bottom: 36, right: 60, width: 52, height: 52, borderRadius: '50%', background: '#0B5AA0', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.18)', zIndex: 100 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m18 15-6-6-6 6" /></svg>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, marginTop: 1 }}>Top</span>
        </button>
      )}
    </div>
  );
}

function PlaceholderContent({ title }: { title: string }) {
  return <Card title={title} style={{ minHeight: 620 }}><div style={{ minHeight: 470, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800 }}>No Data Available</div></Card>;
}

export default function ClaimWorkflowPage() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const numericClaimId = Number(id);
  const resolvedClaimDbId = Number.isFinite(numericClaimId) && numericClaimId > 0 ? numericClaimId : null;
  const claimDbId = resolvedClaimDbId ?? 0;
  const [claimData, setClaimData] = useState<ClaimDetailDto | null>(null);
  const [assignee, setAssignee] = useState<ClaimAssignee | null>(null);
  const [documents, setDocuments] = useState<ClaimDocument[]>([]);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [taskView,   setTaskView]   = useState<'list' | 'add'>('list');
  const [letterView, setLetterView] = useState<'list' | 'generate'>('list');
  const screen = (params.get('screen') as WorkflowKey | null) ?? 'review';
  const active = workflowItems.some(item => item.key === screen) ? screen : 'review';
  const title = titleByKey[active];

  useEffect(() => { if (active !== 'task')    setTaskView('list'); },   [active]);
  useEffect(() => { if (active !== 'letters') setLetterView('list'); }, [active]);

  // Fetch claim detail once on load — drives Summary, Review, Loss Info, MetaStrip
  useEffect(() => {
    if (!claimDbId) return;
    let cancelled = false;
    claimsApi.getById(claimDbId).then(data => {
      if (cancelled) return;
      setClaimData(data);
      if (data.assignedToName) {
        setAssignee(assigneeFromName(data.assignedToName));
      }
    }).catch(console.error);
    return () => { cancelled = true; };
  }, [claimDbId]);

  useEffect(() => {
    let cancelled = false;
    async function loadDocuments() {
      const docs = await claimsApi.getDocuments(claimDbId) as ClaimDocumentDto[];
      if (!cancelled) setDocuments(docs.map(doc => mapDocumentDto(claimDbId, doc)));
    }
    loadDocuments().catch(console.error);
    return () => { cancelled = true; };
  }, [claimDbId]);


  const saveAssignment = async (next: ClaimAssignee) => {
    const saved = await claimsApi.updateAssignment(claimDbId, { assignedTo: null, assignedToName: next.name }) as { assignedToName: string | null };
    setAssignee(assigneeFromName(saved.assignedToName) ?? next);
    setAssignmentOpen(false);
  };

  const saveDocument = async (next: ClaimDocument) => {
    const saved = await claimsApi.addDocument(claimDbId, {
      fileName: next.name,
      contentType: next.mimeType ?? null,
      fileSize: null,
      fileContentBase64: next.dataUrl ?? null,
      notifyToName: next.notifyTo === '-' ? null : next.notifyTo,
      comment: next.comment === '-' ? null : next.comment,
    }) as ClaimDocumentDto;
    setDocuments(current => [mapDocumentDto(claimDbId, saved), ...current.filter(doc => doc.id !== saved.id)]);
    setDocumentModalOpen(false);
  };

  const deleteDocument = async (docId: number) => {
    await claimsApi.deleteDocument(claimDbId, docId);
    setDocuments(current => current.filter(doc => doc.id !== docId));
  };

  const content = useMemo(() => {
    if (active === 'review') return <ReviewContent claimData={claimData} assignee={assignee} onOpenAssignment={() => setAssignmentOpen(true)} />;
    if (active === 'summary') return <SummaryContent claimData={claimData} />;
    if (active === 'loss') return <LossInformationContent claimId={claimDbId} claimData={claimData} />;
    if (active === 'documents') return <DocumentsContent documents={documents} onAdd={() => setDocumentModalOpen(true)} onDelete={deleteDocument} />;
    if (active === 'worksheet') return <WorksheetContent claimId={claimDbId} />;
    if (active === 'payee') return <PayeeContent claimId={claimDbId} />;
    if (active === 'policy') return <InsuredPolicyContent claimId={claimDbId} />;
    if (active === 'escalation') return <EscalationContent />;
    if (active === 'recovery') return <WorkflowComingSoon />;
    if (active === 'referred') return <WorkflowComingSoon />;
    if (active === 'litigation') return <WorkflowComingSoon />;
    if (active === 'task') return <TaskContent claimId={claimDbId} view={taskView} onViewChange={setTaskView} />;
    if (active === 'timeline') return <TimelineContent claimId={claimDbId} />;
    if (active === 'letters')  return <ClaimLettersContent claimId={claimDbId} view={letterView} onViewChange={setLetterView} />;
    return <PlaceholderContent title={title} />;
  }, [active, claimData, assignee, documents, title, claimDbId, taskView, letterView]);

  const displayTitle = active === 'task' && taskView === 'add' ? 'Add Task'
    : active === 'letters' && letterView === 'generate' ? 'Generate Letter'
    : title;
  const displayBreadcrumb = active === 'task' && taskView === 'add' ? 'Task / Add Task'
    : active === 'letters' && letterView === 'generate' ? 'Claims Letters / Generate Letter'
    : `Claims Inquiry / ${title}`;
  return <div style={{ display: 'flex', minHeight: '100%', background: '#fff' }}><WorkflowMenu claimData={claimData} routeClaimId={claimDbId} active={active} /><div style={{ flex: 1, padding: '16px 16px 28px', overflow: 'hidden' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}><div><h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{displayTitle}</h1><div style={{ fontSize: 12, marginTop: 6 }}>{displayBreadcrumb}</div></div><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{active === 'task' && taskView === 'list' && <button onClick={() => setTaskView('add')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: '#0B5AA0', border: '1px solid #0B5AA0', borderRadius: 4, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add Task</button>}<ToolsDropdown claimId={claimDbId} /></div></div><MetaStrip claimData={claimData} assigneeName={assignee?.name ?? claimData?.assignedToName ?? null} /><div style={{ maxHeight: 'calc(100vh - 190px)', overflowY: 'auto', paddingRight: 10 }}>{content}</div><TopButton /></div><aside style={{ width: 44, borderLeft: '1px solid #d8e1ea', display: 'flex', justifyContent: 'center', color: '#0B5AA0', fontSize: 13 }}><div style={{ writingMode: 'vertical-rl', paddingTop: 18 }}>Comments</div></aside>{assignmentOpen && <AssignmentModal selected={assignee} onCancel={() => setAssignmentOpen(false)} onAssign={saveAssignment} />}{documentModalOpen && <AddDocumentModal onCancel={() => setDocumentModalOpen(false)} onSave={saveDocument} />}<span style={{ display: 'none' }}>{id}</span></div>;
}






