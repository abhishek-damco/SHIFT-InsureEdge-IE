import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { quotesPoliciesApi } from '../api/quotesPolicies';
import { authApi } from '../api/auth';
import type { PolicySummaryDto, PolicyTransactionDto, PolicyPendingTransactionDto, PolicyContactDto, PolicyBillingDetailDto, PolicyClaimRowDto, PolicyTimelineEntryDto, PolicyCancellationPreview, CancelRewritePreview, CancelRewriteResult, NoticeOfNonRenewalInfo, NoteDto, NoteFileDto } from '../types/Policy';
import { FilterPopup, FunnelIcon, evalOp, type AppliedFilters, type ColFilter, type SortState } from './QuotesPolicies/GridHelpers';

type MenuKey = 'summary' | 'contacts' | 'billing' | 'pending' | 'history' | 'claims' | 'notes' | 'timeline';

const menuItems: { key: MenuKey; label: string }[] = [
  { key: 'summary', label: 'Summary' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'billing', label: 'Billing' },
  { key: 'pending', label: 'Pending Transactions' },
  { key: 'history', label: 'Policy History' },
  { key: 'claims', label: 'Claims' },
  { key: 'notes', label: 'Notes' },
  { key: 'timeline', label: 'Timeline' },
];

const titleByKey: Record<MenuKey, string> = {
  summary: 'Summary',
  contacts: 'Contacts',
  billing: 'Billing',
  pending: 'Pending Transactions',
  history: 'Policy History',
  claims: 'Claims',
  notes: 'Notes',
  timeline: 'Timeline',
};

const fmtCurrency = (value: number | null | undefined) => (value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type BillingSeriesItem = { key: string; label: string; value: number; color: string };

function EyeIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
}

function CollapseIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
}

function TrashIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" /></svg>;
}

function PencilIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>;
}

function PaperclipIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a5 5 0 0 1-7.07-7.07l9.19-9.19a3 3 0 1 1 4.24 4.24l-8.49 8.49a1 1 0 0 1-1.41-1.41l7.78-7.78" /></svg>;
}

function DocEditIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0B5AA0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9l-6-6z" /><path d="M13 3v6h6" /><path d="M9 17l1.5-4.5L15 8l1.5 1.5-4.5 4.5z" /></svg>;
}

function NoRenewIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0B5AA0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12a8 8 0 0 1 13.66-5.66" /><path d="M20 12a8 8 0 0 1-13.66 5.66" /><path d="M17 3v4h-4" /><path d="M7 21v-4h4" /><path d="M3 3l18 18" /></svg>;
}

const TOOLS_MENU_ITEMS: { label: string; icon: () => JSX.Element }[] = [
  { label: 'Endorse Policy', icon: DocEditIcon },
  { label: 'Cancel Policy', icon: DocEditIcon },
  { label: 'Cancel / Rewrite Policy', icon: DocEditIcon },
  { label: 'Do Not Renew', icon: NoRenewIcon },
];

// ─── Do Not Renew (frontend-only for now — no backend wired yet) ────────────

const OUR_NONRENEWAL_REASONS: { num: string; text: string; indent: number; checkbox: boolean }[] = [
  { num: '1', text: 'Breach of underwriting warranty:', indent: 0, checkbox: true },
  { num: '1.1', text: 'A breach of underwriting warranty by a covered person(s) and organization(s), including your broker of record and your other representatives, indemnitees, or assigns.', indent: 1, checkbox: true },
  { num: '2', text: 'Change in ownership:', indent: 0, checkbox: true },
  { num: '2.1', text: 'You no longer have a financial or insurable interest in the covered assets that is the purpose of this insurance.', indent: 1, checkbox: true },
  { num: '3', text: 'Dwelling asset conditions:', indent: 0, checkbox: true },
  { num: '3.1', text: 'A failure of the first-named insured to maintain the covered dwelling asset in accordance with applicable law;', indent: 1, checkbox: true },
  { num: '3.2', text: 'A covered dwelling asset is in danger of collapse because of serious structural conditions or the covered dwelling asset is subject to extremely hazardous conditions such as the covered dwelling asset that is in such a state of disrepair as to be considered dilapidated;', indent: 1, checkbox: true },
  { num: '3.3', text: 'A covered dwelling asset on which, because of their physical condition, there is an outstanding order to vacate or an outstanding demolition order, or the covered dwelling asset have been declared unsafe in accordance with applicable law;', indent: 1, checkbox: true },
  { num: '3.4', text: 'A covered dwelling asset on which there is reasonable knowledge and belief that the covered dwelling asset is endangered and is not reasonably protected from possible arson for the purpose of defrauding us;', indent: 1, checkbox: true },
  { num: '3.5', text: 'A covered dwelling asset possesses characteristics of ownership condition, occupancy, or maintenance that violate law or public policy.', indent: 1, checkbox: true },
  { num: '3.6', text: 'A violation of a local fire, health, safety, building, or construction regulation or ordinance, with respect to the covered dwelling asset or the occupancy of a covered dwelling asset that substantially increases any hazard insured against under the policy.', indent: 1, checkbox: true },
  { num: '3.7', text: 'Real property taxes owing on the covered dwelling asset have been delinquent for 2 or more years and continue delinquent at the time notice of nonrenewal is issued (other than a bona fide dispute with the taxing authority regarding payment of such taxes).', indent: 1, checkbox: true },
  { num: '3.8', text: 'The sale or other change or transfer of ownership of the covered dwelling asset.', indent: 1, checkbox: true },
  { num: '3.9', text: 'After damage by a covered peril, permanent repairs to the covered dwelling asset have not been contracted for or have not fully commenced within 120 days of payment of loss or 180 days if delayed by governmental permitting.', indent: 1, checkbox: true },
  { num: '3.10', text: 'The covered dwelling asset has an outstanding order to vacate, demolish, or otherwise been declared unsafe by governmental authority.', indent: 1, checkbox: true },
  { num: '4', text: 'Existence of a moral hazard:', indent: 0, checkbox: true },
  { num: '4.1', text: 'The risk, danger or probability that a covered person(s) and organization(s) will destroy, or permit to be destroyed, the covered assets for the purpose of collecting the insurance proceeds; and', indent: 1, checkbox: true },
  { num: '4.2', text: 'Any change in the circumstances of a covered person(s) and organization(s) that will increase the probability of such a destruction; and', indent: 1, checkbox: true },
  { num: '4.3', text: 'The substantial risk, danger or probability that the character, circumstances or personal habits of a covered person(s) and organization(s) may increase the possibility of loss or liability for which we will be held responsible; and', indent: 1, checkbox: true },
  { num: '4.4', text: 'Any change in the character or circumstances of a covered person(s) and organization(s) that will increase the probability of such a loss or liability.', indent: 1, checkbox: true },
  { num: '5', text: 'Failure to conduct risk inspections:', indent: 0, checkbox: true },
  { num: '5.1', text: 'We are unable to conduct risk inspections of each covered location and covered asset to which this insurance applies, due to the failure of covered person(s) and organization(s), including their representatives, indemnitees, and assigns to cooperate with us.', indent: 1, checkbox: true },
  { num: '6', text: 'Failure to cooperate with audit:', indent: 0, checkbox: true },
  { num: '6.1', text: "We are unable to conduct an audit of the first-named insured's pertinent records due to the failure of covered person(s) and organization(s), including their representatives, indemnitees, and assigns, to cooperate with us.", indent: 1, checkbox: true },
  { num: '7', text: "First named-insured's decisions, actions or inactions:", indent: 0, checkbox: true },
  { num: '7.1', text: 'Your failure to make premium payment when due:', indent: 1, checkbox: false },
  { num: '7.1.2', text: 'Concerning your failure to make first renewal payment when due:', indent: 2, checkbox: false },
  { num: '7.1.2.1', text: 'Will result in automatic nullification of the policy effective back to renewal date;', indent: 3, checkbox: true },
  { num: '7.1.2.2', text: 'Unless the required payment is received by us within 14 days of renewal date.', indent: 3, checkbox: true },
  { num: '7.2', text: "The first-named insured's material violation of a material duties, conditions, warranties, or provision of the policy.", indent: 1, checkbox: true },
  { num: '7.3', text: 'A failure of the first-named insured to comply or cooperate within 61 days of the effective date of coverage, with loss control recommendations or underwriting requirements established by us before the effective date of coverage.', indent: 1, checkbox: true },
  { num: '7.4', text: 'A covered person(s) and organization(s) has acted in a manner which the first-named insured knew or should have known was in violation or breach of a term or condition of this insurance policy.', indent: 1, checkbox: true },
  { num: '7.5', text: 'Evidence of arson by a covered person(s) and organization(s).', indent: 1, checkbox: true },
  { num: '8', text: 'Fraud or material misrepresentation:', indent: 0, checkbox: true },
  { num: '8.1', text: 'Discovery of fraud or material misrepresentation or nondisclosure made by or with the knowledge of:', indent: 1, checkbox: false },
  { num: '8.1.1', text: 'You or your broker of record or other representative;', indent: 2, checkbox: true },
  { num: '8.1.2', text: 'Concerning obtaining or continuing this insurance policy or a claim(s) under the policy.', indent: 2, checkbox: true },
  { num: '9', text: 'Governmental actions or inactions:', indent: 0, checkbox: true },
  { num: '9.1', text: 'A determination of the Insurance Commissioner that the continuation of the policy would place us in violation of the insurance laws.', indent: 1, checkbox: true },
  { num: '9.2', text: 'The nonrenewal is for all insureds under such policies for a given class of insureds.', indent: 1, checkbox: true },
  { num: '10', text: 'Increase in hazard outside of your control:', indent: 0, checkbox: true },
  { num: '10.1', text: 'Increased hazard or material change in the risk we assumed that could not have been reasonably contemplated by the parties at the time of assumption of the risk.', indent: 1, checkbox: true },
  { num: '10.2', text: 'Material increase in exposure arising out of changes in statutory or case law subsequent to the issuance of this insurance policy or any subsequent renewal thereof.', indent: 1, checkbox: true },
  { num: '11', text: 'Increase in hazard within your control:', indent: 0, checkbox: true },
  { num: '11.1', text: 'An increase in a hazard within your control that would produce a rate increase or underwriting rule disqualification.', indent: 1, checkbox: true },
  { num: '11.2', text: 'Discovery of a willful or reckless acts, or omissions or a grossly negligent act of omission by a covered person(s) and organization(s) that noticeably increases the risks underwritten.', indent: 1, checkbox: true },
  { num: '11.3', text: 'We have identified a condition as one that created an increased risk of hazard that was not disclosed in the application process for coverage; and was not the subject of a prior claim.', indent: 1, checkbox: true },
  { num: '11.4', text: 'Conviction of a covered person(s) and organization(s) of a crime that is generally involving an act that materially increases the risks underwritten.', indent: 1, checkbox: true },
  { num: '12', text: 'Line of insurance cancellation:', indent: 0, checkbox: true },
  { num: '12.1', text: 'We have ceased writing the particular type or line of insurance coverage contained in said policy throughout the state or should we discontinue operations within the state.', indent: 1, checkbox: true },
  { num: '13', text: 'Loss of reinsurance:', indent: 0, checkbox: true },
  { num: '13.1', text: 'Our inability to secure adequate reinsurance at terms or substantial changes in conditions that are financially affordable or are otherwise inadequate to mitigate the risks to a retention level that does not threaten our insolvency that provided coverage to us for all or a substantial part of the underlying risk insured.', indent: 1, checkbox: true },
  { num: '14', text: 'Natural disasters:', indent: 0, checkbox: true },
  { num: '14.1', text: 'We have determined that concerning naturally occurring disasters, the first-named insured has failed to take reasonable action necessary as requested by us to prevent:', indent: 1, checkbox: false },
  { num: '14.1.1', text: 'Recurrence of damage to the covered assets.', indent: 2, checkbox: true },
  { num: '14.1.2', text: 'A future similar occurrence of damage to the covered asset.', indent: 2, checkbox: true },
  { num: '15', text: 'Nonpayment of premiums:', indent: 0, checkbox: true },
  { num: '15.1', text: 'Nonpayment of the total premium or periodic installment when due.', indent: 1, checkbox: true },
  { num: '16', text: 'Physical asset hazards:', indent: 0, checkbox: true },
  { num: '16.1', text: 'Fixed and salvageable items have been or are being removed from the building and are not being replaced (other than removal that is necessary or incidental to any renovation or remodeling).', indent: 1, checkbox: true },
  { num: '16.2', text: 'Physical changes in covered assets that result in covered assets becoming uninsurable under our underwriting guidelines.', indent: 1, checkbox: true },
  { num: '17', text: 'Supervision, conservatorship, or receivership:', indent: 0, checkbox: true },
  { num: '17.1', text: 'We have been placed in supervision, conservatorship, or receivership, and the nonrenewal is approved or directed by the supervisor, conservator, or receiver.', indent: 1, checkbox: true },
  { num: '18', text: 'Violation of code:', indent: 0, checkbox: true },
  { num: '18.1', text: 'The state insurance department has determined that the continuation of the policy would violate the insurance code or any other law governing the business of insurance in the applicable state.', indent: 1, checkbox: true },
];

function CollapsiblePanel({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 4, marginBottom: 14 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#111827' }}
      >
        <span style={{ width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #9ca3af', borderRadius: '50%', fontSize: 12, lineHeight: 1 }}>{open ? '−' : '+'}</span>
        {title}
      </button>
      {open && <div style={{ padding: '0 16px 16px', borderTop: '1px solid #e5e7eb' }}>{children}</div>}
    </div>
  );
}

// Direct-children index map for OUR_NONRENEWAL_REASONS (built once from the num strings) —
// a parent row's checkbox is never independently clickable: with exactly one child it
// mirrors that child; with multiple children it's the logical OR of all of them.
const NONRENEWAL_CHILDREN: number[][] = OUR_NONRENEWAL_REASONS.map((item, i) => {
  const itemDepth = item.num.split('.').length;
  return OUR_NONRENEWAL_REASONS
    .map((_, j) => j)
    .filter(j => j !== i
      && OUR_NONRENEWAL_REASONS[j].num.startsWith(item.num + '.')
      && OUR_NONRENEWAL_REASONS[j].num.split('.').length === itemDepth + 1);
});
const NONRENEWAL_IS_LEAF = NONRENEWAL_CHILDREN.map(kids => kids.length === 0);

function computeNonrenewalAttributes(leafValues: boolean[]): boolean[] {
  const result = [...leafValues];
  for (let i = OUR_NONRENEWAL_REASONS.length - 1; i >= 0; i--) {
    const kids = NONRENEWAL_CHILDREN[i];
    if (kids.length === 0) continue;
    result[i] = kids.length === 1 ? result[kids[0]] : kids.some(k => result[k]);
  }
  return result;
}

function DoNotRenewModal({ insuredType, policyNumber, onAbort, onSubmitted }: {
  insuredType: string;
  policyNumber: string;
  onAbort: () => void;
  onSubmitted: () => void;
}) {
  const [info, setInfo] = useState<NoticeOfNonRenewalInfo | null>(null);
  const [checkBoxYourNonRenewal, setCheckBoxYourNonRenewal] = useState(false);
  const [attrs, setAttrs] = useState<boolean[]>(() => Array(OUR_NONRENEWAL_REASONS.length).fill(false));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cellStyle: CSSProperties = { padding: '10px 8px', fontSize: 13, verticalAlign: 'top' };

  useEffect(() => {
    quotesPoliciesApi.getNoticeOfNonRenewalInfo(insuredType, policyNumber).then(setInfo).catch(() => setInfo(null));
  }, [insuredType, policyNumber]);

  const computed = useMemo(() => computeNonrenewalAttributes(attrs), [attrs]);
  const mutualExclusivityError = 'The policy can be non-renewed by either the insured or by the Underwriter.  Please correct your selections accordingly.';

  const handleYourNonRenewalChange = (checked: boolean) => {
    if (checked && computed.some(Boolean)) { setError(mutualExclusivityError); return; }
    setError(null);
    setCheckBoxYourNonRenewal(checked);
  };

  const handleLeafChange = (idx: number, checked: boolean) => {
    if (checked && checkBoxYourNonRenewal) { setError(mutualExclusivityError); return; }
    setError(null);
    const next = [...attrs];
    next[idx] = checked;
    setAttrs(next);
  };

  const handleSubmit = async () => {
    const anySelected = checkBoxYourNonRenewal || computed.some(Boolean);
    if (!anySelected) { setError('At least one reason is required to generate the Policy Nonrenewal Notice.'); return; }
    if (checkBoxYourNonRenewal && computed.some(Boolean)) { setError(mutualExclusivityError); return; }

    setSubmitting(true);
    setError(null);
    try {
      await quotesPoliciesApi.submitDoNotRenew(insuredType, policyNumber, {
        checkBoxYourNonRenewal,
        attributes: computed,
      });
      onSubmitted();
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to submit Do Not Renew.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const noticeItems: { label: string; value: string }[][] = [
    [
      { label: 'Name', value: na(info?.namedInsured) },
      { label: 'Mailing address', value: na(info?.namedInsuredAddressLine) },
      { label: 'City', value: na(info?.namedInsuredAddressCity) },
      { label: 'State', value: na(info?.namedInsuredAddressState) },
      { label: 'Postal code', value: na(info?.namedInsuredZip) },
      { label: 'Contact name', value: na(info?.primaryContactName) },
      { label: 'Email address', value: na(info?.primaryContactEmail) },
      { label: 'Phone', value: na(info?.primaryContactPhone) },
      { label: 'Policy number', value: na(info?.policyNo) },
      { label: 'Notice date', value: na(info?.systemDt) },
      { label: 'Notice effective date', value: na(info?.polEffDt) },
    ],
    [
      { label: 'Brokerage Firm Name', value: na(info?.brokerage) },
      { label: 'Mailing Address', value: na(info?.brokerAddressLine) },
      { label: 'City', value: na(info?.brokerAddressCity) },
      { label: 'State', value: na(info?.brokerAddressState) },
      { label: 'Postal code', value: na(info?.brokerAddressZip) },
      { label: 'Phone', value: na(info?.brokerAddressPhone) },
      { label: 'Brokerage Firm Code', value: na(info?.brokerId) },
      { label: 'Policy effective date', value: na(info?.polEffDt) },
      { label: 'Policy expiration date', value: na(info?.polExpDt) },
    ],
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 8, width: 860, maxWidth: '94vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Do Not Renew</h3>
          <button onClick={onAbort} style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}>×</button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          <CollapsiblePanel title="Policy Nonrenewal Notice" defaultOpen>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px', paddingTop: 14 }}>
              {noticeItems.map((col, ci) => (
                <div key={ci} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px', alignContent: 'start' }}>
                  {col.map(item => (
                    <div key={item.label}>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{item.label}:</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel title="Policy Refunds">
            <div style={{ fontSize: 13, paddingTop: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Nonrenewal</div>
              <p style={{ margin: '0 0 14px' }}>In the event of nonrenewal of the policy, no new premium will be due but any premium owed by you prior to nonrenewal of the policy will become due.</p>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Addition of optional coverage</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {[
                    'If a renewal policy includes the addition of optional coverage:',
                    'That increases the premium to the first-named insured;',
                    'The first-named insured may reject the addition of the optional coverage; and',
                    'Receive a full refund for such optional coverage;',
                    'If requested within 60 days.',
                  ].map((t, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td style={{ ...cellStyle, width: 28 }}>{i + 1}</td>
                      <td style={cellStyle}>{t}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel title="Your Nonrenewal">
            <div style={{ fontSize: 13, paddingTop: 14 }}>
              <p style={{ margin: '0 0 6px' }}>An "X" indicates each reason for nonrenewal:</p>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>Policy nonrenewal by the first-named insured</div>
              <p style={{ margin: '0 0 10px' }}>The first named-insured has requested nonrenewal of the entire policy via your broker of record in writing and delivered electronically pursuant to the policy provisions prior to nonrenewal taking effect.</p>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ ...cellStyle, width: 28 }} />
                    <td style={cellStyle} colSpan={3}>A policy nonrenewal</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ ...cellStyle, width: 28 }}>
                      <input type="checkbox" checked={checkBoxYourNonRenewal} onChange={e => handleYourNonRenewalChange(e.target.checked)} />
                    </td>
                    <td style={cellStyle}>Effective date/time</td>
                    <td style={cellStyle}>{checkBoxYourNonRenewal ? (info?.nonRenewEffDt || '-') : ''}</td>
                    <td style={cellStyle}>at 12:01 a.m. at the covered physical location stated on the policy declaration page.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel title="Our Policy Nonrenewal">
            <div style={{ fontSize: 13, paddingTop: 14 }}>
              <p style={{ margin: '0 0 6px' }}>An "X" indicates each reason for nonrenewal:</p>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>Policy nonrenewal by us</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 14 }}>
                <tbody>
                  <tr style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ ...cellStyle, width: 28 }} />
                    <td style={cellStyle}>Effective date/time</td>
                    <td style={cellStyle}>{!checkBoxYourNonRenewal && computed.some(Boolean) ? (info?.nonRenewEffDt || '-') : ''}</td>
                    <td style={cellStyle}>at 12:01 a.m. at the covered physical location stated on the policy declaration page.</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ ...cellStyle, width: 28 }}>1</td>
                    <td style={cellStyle} colSpan={3}>We may cancel for any reason if this policy has been in effect for less than 61 days and is not a renewal with us.</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ ...cellStyle, width: 28 }}>2</td>
                    <td style={cellStyle} colSpan={3}>We may cancel at any time if it is a renewal with us for:</td>
                  </tr>
                </tbody>
              </table>
              <p style={{ margin: '0 0 6px' }}>An "X" indicates each reason for nonrenewal:</p>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {OUR_NONRENEWAL_REASONS.map((item, idx) => (
                    <tr key={item.num} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td style={{ ...cellStyle, width: 28, paddingLeft: 8 + item.indent * 16 }}>
                        <input
                          type="checkbox"
                          checked={computed[idx]}
                          disabled={!NONRENEWAL_IS_LEAF[idx]}
                          onChange={e => handleLeafChange(idx, e.target.checked)}
                        />
                      </td>
                      <td style={{ ...cellStyle, width: 44, paddingLeft: item.indent * 16, fontWeight: item.indent === 0 ? 700 : 400 }}>{item.num}</td>
                      <td style={cellStyle}>{item.text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsiblePanel>
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#7a1620', color: '#fff', borderRadius: 4, padding: '12px 16px', marginTop: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>{error}</span>
              <button onClick={() => setError(null)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer' }}>×</button>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderTop: '1px solid #e5e7eb' }}>
          <button onClick={onAbort} disabled={submitting} style={{ padding: '9px 18px', borderRadius: 4, border: '1px solid #d1d5db', background: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Abort</button>
          <button onClick={handleSubmit} disabled={submitting} style={{ padding: '9px 18px', borderRadius: 4, border: 'none', background: '#0B5AA0', color: '#fff', fontSize: 13, fontWeight: 700, cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
            {submitting ? 'Please wait…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Converts our display format ("MM-dd-yyyy") to <input type="date">'s required "yyyy-MM-dd".
function toIsoDate(mmddyyyy: string | null | undefined): string | null {
  if (!mmddyyyy) return null;
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(mmddyyyy);
  if (!m) return null;
  const [, mm, dd, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

const RICH_TEXT_COMMANDS: { label: string; command: string; value?: string }[] = [
  { label: 'B', command: 'bold' },
  { label: 'I', command: 'italic' },
  { label: 'U', command: 'underline' },
  { label: 'S', command: 'strikeThrough' },
];

function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  const exec = (command: string, cmdValue?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, cmdValue);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  return (
    <div style={{ border: '1px solid #d1d5db', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 2, padding: '6px 8px', borderBottom: '1px solid #e5e7eb', background: '#f7f9fc' }}>
        {RICH_TEXT_COMMANDS.map(c => (
          <button
            key={c.command}
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={() => exec(c.command, c.value)}
            title={c.command}
            style={{ width: 26, height: 26, border: '1px solid #d1d5db', borderRadius: 3, background: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontStyle: c.command === 'italic' ? 'italic' : 'normal', textDecoration: c.command === 'underline' ? 'underline' : c.command === 'strikeThrough' ? 'line-through' : 'none' }}
          >
            {c.label}
          </button>
        ))}
        <span style={{ width: 1, background: '#d1d5db', margin: '2px 4px' }} />
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec('insertUnorderedList')} title="Bullet list" style={{ width: 26, height: 26, border: '1px solid #d1d5db', borderRadius: 3, background: '#fff', fontSize: 12, cursor: 'pointer' }}>•≡</button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec('insertOrderedList')} title="Numbered list" style={{ width: 26, height: 26, border: '1px solid #d1d5db', borderRadius: 3, background: '#fff', fontSize: 12, cursor: 'pointer' }}>1.≡</button>
        <span style={{ width: 1, background: '#d1d5db', margin: '2px 4px' }} />
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec('undo')} title="Undo" style={{ width: 26, height: 26, border: '1px solid #d1d5db', borderRadius: 3, background: '#fff', fontSize: 12, cursor: 'pointer' }}>↶</button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec('redo')} title="Redo" style={{ width: 26, height: 26, border: '1px solid #d1d5db', borderRadius: 3, background: '#fff', fontSize: 12, cursor: 'pointer' }}>↷</button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={e => onChange((e.target as HTMLDivElement).innerHTML)}
        dangerouslySetInnerHTML={{ __html: value }}
        style={{ minHeight: 120, padding: '10px 12px', fontSize: 13, outline: 'none', background: '#fff' }}
      />
    </div>
  );
}

function EndorsementDetailsModal({ policyEffectiveDate, onCancel, onContinue }: {
  policyEffectiveDate: string | null | undefined;
  onCancel: () => void;
  onContinue: (effectiveDate: string, summary: string) => Promise<void>;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const policyStart = toIsoDate(policyEffectiveDate);
  const [isProducer, setIsProducer] = useState(false);
  const [effectiveDate, setEffectiveDate] = useState(today);
  const [summary, setSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authApi.getMyProducer()
      .then(res => setIsProducer(!!res.producer))
      .catch(() => setIsProducer(false));
  }, []);

  useEffect(() => {
    if (isProducer) {
      setEffectiveDate(policyStart && policyStart > today ? policyStart : today);
    } else {
      setEffectiveDate(today);
    }
  }, [isProducer, policyStart, today]);

  const handleContinue = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onContinue(effectiveDate, summary);
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to create endorsement.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 8, width: 560, maxWidth: '92vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Endorsement Details</h3>
          <button onClick={onCancel} style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6b7280' }}>×</button>
        </div>
        <div style={{ padding: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>* Transaction Effective Date</label>
          <input
            type="date"
            value={effectiveDate}
            onChange={e => setEffectiveDate(e.target.value)}
            disabled={!isProducer}
            min={isProducer ? (policyStart ?? undefined) : undefined}
            max={isProducer ? today : undefined}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, marginBottom: 16, background: isProducer ? '#fff' : '#f3f4f6', color: isProducer ? '#111827' : '#6b7280' }}
          />
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>* Summary of Change(s)</label>
          <RichTextEditor value={summary} onChange={setSummary} />
          {error && <div style={{ marginTop: 12, color: '#b91c1c', fontSize: 13 }}>{error}</div>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderTop: '1px solid #e5e7eb' }}>
          <button onClick={onCancel} disabled={submitting} style={{ padding: '9px 18px', borderRadius: 4, border: '1px solid #d1d5db', background: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
          <button
            onClick={handleContinue}
            disabled={submitting || !effectiveDate || !summary.replace(/<[^>]*>/g, '').trim()}
            style={{ padding: '9px 18px', borderRadius: 4, border: 'none', background: '#0B5AA0', color: '#fff', fontSize: 13, fontWeight: 700, cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Please wait…' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CancelConfirmDialog({ policyNumber, onNo, onYes }: { policyNumber: string; onNo: () => void; onYes: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 8, width: 380, maxWidth: '92vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', padding: '28px 24px', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fde3e8', color: '#df4159', fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>!</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 22 }}>
          Are you sure you want to cancel this policy {policyNumber} ?
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onNo} style={{ flex: 1, padding: '10px 0', borderRadius: 4, border: '1px solid #d1d5db', background: '#fff', color: '#0B5AA0', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>No, keep it</button>
          <button onClick={onYes} style={{ flex: 1, padding: '10px 0', borderRadius: 4, border: 'none', background: '#df4159', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Yes, cancel</button>
        </div>
      </div>
    </div>
  );
}

function RemoveDoNotRenewConfirmDialog({ policyNumber, onNo, onYes }: { policyNumber: string; onNo: () => void; onYes: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 8, width: 380, maxWidth: '92vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', padding: '28px 24px', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fde3e8', color: '#df4159', fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>!</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 22 }}>
          Are you sure you want to remove the 'Do Not Renew' status for policy {policyNumber} ?
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onNo} style={{ flex: 1, padding: '10px 0', borderRadius: 4, border: '1px solid #d1d5db', background: '#fff', color: '#0B5AA0', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>No, keep it</button>
          <button onClick={onYes} style={{ flex: 1, padding: '10px 0', borderRadius: 4, border: 'none', background: '#df4159', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Yes, Remove Do Not Renew</button>
        </div>
      </div>
    </div>
  );
}

function ToolsMenu({ insuredType, policyNumber, policyStatus, policyEffectiveDate, onEndorseSubmit, onCancelPolicyConfirmed, onCancelRewrite, onDoNotRenewSubmitted, onRemoveDoNotRenewConfirmed }: {
  insuredType: string;
  policyNumber: string;
  policyStatus: string | null | undefined;
  policyEffectiveDate: string | null | undefined;
  onEndorseSubmit: (effectiveDate: string, summary: string) => Promise<void>;
  onCancelPolicyConfirmed: () => void;
  onCancelRewrite: () => void;
  onDoNotRenewSubmitted: () => void;
  onRemoveDoNotRenewConfirmed: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [showEndorseModal, setShowEndorseModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDoNotRenew, setShowDoNotRenew] = useState(false);
  const [showRemoveDoNotRenewConfirm, setShowRemoveDoNotRenewConfirm] = useState(false);
  const [isProducerLogin, setIsProducerLogin] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isDoNotRenew = policyStatus === 'DONOTRENEW';
  const canEndorse = policyStatus === 'Active' || policyStatus === 'Bound';
  const canCancel = policyStatus === 'Active';
  const canCancelRewrite = policyStatus === 'Active';
  const canDoNotRenew = policyStatus === 'Active';

  // All users (producers and staff) now have access to all Tools options
  useEffect(() => {
    let cancelled = false;
    authApi.getMyProducer()
      .then(result => { if (!cancelled) setIsProducerLogin(Boolean(result.producer)); })
      .catch(() => { if (!cancelled) setIsProducerLogin(false); });
    return () => { cancelled = true; };
  }, []);

  const items = TOOLS_MENU_ITEMS
    .map(item => item.label === 'Do Not Renew' && isDoNotRenew ? { ...item, label: 'Remove Do Not Renew' } : item);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const handleItemClick = (label: string) => {
    setOpen(false);
    if (label === 'Endorse Policy') setShowEndorseModal(true);
    if (label === 'Cancel Policy') setShowCancelConfirm(true);
    if (label === 'Cancel / Rewrite Policy') onCancelRewrite();
    if (label === 'Do Not Renew') setShowDoNotRenew(true);
    if (label === 'Remove Do Not Renew') setShowRemoveDoNotRenewConfirm(true);
  };

  const isDisabled = (label: string) =>
    (label === 'Endorse Policy' && !canEndorse) ||
    (label === 'Cancel Policy' && !canCancel) ||
    (label === 'Cancel / Rewrite Policy' && !canCancelRewrite) ||
    (label === 'Do Not Renew' && !canDoNotRenew);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0B5AA0', color: '#fff', border: 'none', borderRadius: 4, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
      >
        Tools ⌄
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '110%', right: 0, width: 240, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 8px 24px rgba(15,23,42,0.14)', zIndex: 100, padding: '14px 0' }}>
          <div style={{ padding: '0 16px 10px', fontSize: 15, fontWeight: 800, color: '#111827' }}>Transactions</div>
          {items.map(item => {
            const Icon = item.icon;
            const disabled = isDisabled(item.label);
            return (
              <button
                key={item.label}
                onClick={() => !disabled && handleItemClick(item.label)}
                disabled={disabled}
                title={disabled ? 'Policy must be Active to perform this action' : undefined}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '9px 16px', background: 'transparent', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 13, color: disabled ? '#9ca3af' : '#374151', opacity: disabled ? 0.6 : 1 }}
                onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = '#f5f9ff'; }}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Icon />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
      {showEndorseModal && (
        <EndorsementDetailsModal
          policyEffectiveDate={policyEffectiveDate}
          onCancel={() => setShowEndorseModal(false)}
          onContinue={async (effectiveDate, summary) => {
            await onEndorseSubmit(effectiveDate, summary);
            setShowEndorseModal(false);
          }}
        />
      )}
      {showCancelConfirm && (
        <CancelConfirmDialog
          policyNumber={policyNumber}
          onNo={() => setShowCancelConfirm(false)}
          onYes={() => { setShowCancelConfirm(false); onCancelPolicyConfirmed(); }}
        />
      )}
      {showDoNotRenew && (
        <DoNotRenewModal
          insuredType={insuredType}
          policyNumber={policyNumber}
          onAbort={() => setShowDoNotRenew(false)}
          onSubmitted={() => { setShowDoNotRenew(false); onDoNotRenewSubmitted(); }}
        />
      )}
      {showRemoveDoNotRenewConfirm && (
        <RemoveDoNotRenewConfirmDialog
          policyNumber={policyNumber}
          onNo={() => setShowRemoveDoNotRenewConfirm(false)}
          onYes={() => { setShowRemoveDoNotRenewConfirm(false); onRemoveDoNotRenewConfirmed(); }}
        />
      )}
    </div>
  );
}

function CancelPolicyContent({ insuredType, policyNumber, policyEffectiveDate, onAbort, onCancelled }: {
  insuredType: string;
  policyNumber: string;
  policyEffectiveDate: string | null | undefined;
  onAbort: () => void;
  onCancelled: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const policyStart = toIsoDate(policyEffectiveDate);
  const [cancellationEffectiveDate, setCancellationEffectiveDate] = useState(today);
  const [dateInitialized, setDateInitialized] = useState(false);
  const [requestedByOptions, setRequestedByOptions] = useState<{ code: string; label: string }[]>([]);
  const [requestedBy, setRequestedBy] = useState('');
  const [reasonOptions, setReasonOptions] = useState<string[]>([]);
  const [reasonOfCancellation, setReasonOfCancellation] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [comment, setComment] = useState('');
  const [preview, setPreview] = useState<PolicyCancellationPreview | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    quotesPoliciesApi.getRequestedByOptions(insuredType).then(setRequestedByOptions).catch(() => setRequestedByOptions([]));
  }, [insuredType]);

  useEffect(() => {
    if (!requestedBy) { setReasonOptions([]); setReasonOfCancellation(''); return; }
    quotesPoliciesApi.getReasonOfCancellationOptions(insuredType, requestedBy)
      .then(opts => { setReasonOptions(opts); setReasonOfCancellation(opts[0] ?? ''); })
      .catch(() => setReasonOptions([]));
  }, [insuredType, requestedBy]);

  useEffect(() => {
    if (!policyNumber || !cancellationEffectiveDate) return;
    quotesPoliciesApi.getCancellationPreview(insuredType, policyNumber, cancellationEffectiveDate)
      .then(setPreview)
      .catch(() => setPreview(null));
  }, [insuredType, policyNumber, cancellationEffectiveDate]);

  const canSubmit = !!cancellationEffectiveDate && !!requestedBy && !!reasonOfCancellation && !submitting;
  const isEffectiveDateEditable = !!preview?.isPolicyPaid;

  useEffect(() => {
    if (!preview || dateInitialized) return;
    if (!preview.isPolicyPaid && policyStart && cancellationEffectiveDate !== policyStart) {
      setCancellationEffectiveDate(policyStart);
    }
    setDateInitialized(true);
  }, [preview, dateInitialized, policyStart, cancellationEffectiveDate]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await quotesPoliciesApi.cancelPolicy(insuredType, policyNumber, {
        cancellationEffectiveDate,
        prorationBasis: 'Pro-rata',
        requestedBy,
        reasonOfCancellation,
        otherReason: otherReason || null,
        adjustCommissions: false,
        comments: comment || null,
      });
      onCancelled();
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to cancel policy.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const selectStyle: CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, background: '#f7f9fc' };
  const labelStyle: CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 };

  return (
    <>
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#7a1620', color: '#fff', borderRadius: 4, padding: '12px 16px', marginBottom: 16 }}>
          <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', color: '#7a1620', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</span>
          <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer' }}>×</button>
        </div>
      )}
      <Section title="Cancellation Details">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 14px', marginBottom: 18 }}>
          <div>
            <label style={labelStyle}>* Cancellation Effective Date</label>
            <input
              type="date"
              value={cancellationEffectiveDate}
              onChange={e => setCancellationEffectiveDate(e.target.value)}
              disabled={!isEffectiveDateEditable}
              min={isEffectiveDateEditable ? (policyStart ?? undefined) : undefined}
              max={today}
              title={!isEffectiveDateEditable ? 'Editable only when the policy is paid' : undefined}
              style={{ ...selectStyle, background: isEffectiveDateEditable ? '#f7f9fc' : '#f3f4f6', color: isEffectiveDateEditable ? '#111827' : '#9ca3af' }}
            />
          </div>
          <div>
            <label style={labelStyle}>* Proration Basis</label>
            <select value="Pro-rata" disabled style={selectStyle}><option>Pro-rata</option></select>
          </div>
          <div>
            <label style={labelStyle}>* Requested By</label>
            <select value={requestedBy} onChange={e => setRequestedBy(e.target.value)} style={selectStyle}>
              <option value="">Select...</option>
              {requestedByOptions.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>* Reason of Cancellation</label>
            <select value={reasonOfCancellation} onChange={e => setReasonOfCancellation(e.target.value)} disabled={!requestedBy} style={selectStyle}>
              {reasonOptions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>* Adjust Commission?</label>
          <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#9ca3af' }}>
            <label><input type="radio" disabled /> Yes</label>
            <label><input type="radio" disabled defaultChecked /> No</label>
          </div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Other Reason (optional)</label>
          <input value={otherReason} onChange={e => setOtherReason(e.target.value)} placeholder="Additional detail" style={{ ...selectStyle, background: '#fff' }} />
        </div>
        <div>
          <label style={labelStyle}>Comment</label>
          <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} placeholder="Type Your Message Here" style={{ ...selectStyle, background: '#fff', resize: 'vertical' }} />
        </div>
      </Section>

      <Section title="Breakdown of Refund / Additional Premium">
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: -10, marginBottom: 14 }}>It will be calculated proportionally based on the days your policy was in force</div>
        <DataTable columns={['Premium Breakdown', 'Paid Amount (USD)', 'Refund / Additional Amount (USD)']}>
          {(preview?.premiumBreakdown ?? []).map(row => (
            <tr key={row.label} style={{ borderTop: '1px solid #f3f4f6' }}>
              <td style={{ padding: '10px 12px' }}>{row.label}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right' }}>{fmtCurrency(row.paidAmount)}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right' }}>{fmtCurrency(row.refundAmount)}</td>
            </tr>
          ))}
          <tr style={{ borderTop: '2px solid #e5e7eb', fontWeight: 700, background: '#f7f9fc' }}>
            <td style={{ padding: '10px 12px' }}>Total (USD)</td>
            <td style={{ padding: '10px 12px', textAlign: 'right' }}>{fmtCurrency(preview?.totalPaidAmount)}</td>
            <td style={{ padding: '10px 12px', textAlign: 'right' }}>{fmtCurrency(preview?.totalRefundAmount)}</td>
          </tr>
        </DataTable>
      </Section>

      <Section title="Cancellation Effect On Commission">
        <DataTable columns={['Intermediary', 'Last Commission Amount Paid (USD)', 'Change in Commission (USD)']}>
          {(preview?.commissionEffect ?? []).map(row => (
            <tr key={row.intermediary} style={{ borderTop: '1px solid #f3f4f6' }}>
              <td style={{ padding: '10px 12px' }}>{row.intermediary}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right' }}>{fmtCurrency(row.lastCommissionPaid)}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right' }}>{fmtCurrency(row.changeInCommission)}</td>
            </tr>
          ))}
        </DataTable>
      </Section>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button onClick={onAbort} disabled={submitting} style={{ padding: '9px 18px', borderRadius: 4, border: '1px solid #d1d5db', background: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Abort</button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{ padding: '9px 18px', borderRadius: 4, border: 'none', background: canSubmit ? '#0B5AA0' : '#93c5fd', color: '#fff', fontSize: 13, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'default' }}
        >
          {submitting ? 'Please wait…' : 'Submit Cancellation'}
        </button>
      </div>
    </>
  );
}

function CancelRewriteContent({ insuredType, policyNumber, policyEffectiveDate, onAbort, onRewritten }: {
  insuredType: string;
  policyNumber: string;
  policyEffectiveDate: string | null | undefined;
  onAbort: () => void;
  onRewritten: (result: CancelRewriteResult) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const policyStart = toIsoDate(policyEffectiveDate);
  const [cancellationEffectiveDate, setCancellationEffectiveDate] = useState(today);
  const [rewriteEffectiveDate, setRewriteEffectiveDate] = useState(policyStart ?? today);
  const [reasonOptions, setReasonOptions] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [prorationBasis, setProrationBasis] = useState('Pro-rata');
  const [adjustCommissions, setAdjustCommissions] = useState(true);
  const [comment, setComment] = useState('');
  const [preview, setPreview] = useState<CancelRewritePreview | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    quotesPoliciesApi.getReasonForRewritingOptions(insuredType)
      .then(opts => { setReasonOptions(opts); setReason(opts[0] ?? ''); })
      .catch(() => setReasonOptions([]));
  }, [insuredType]);

  useEffect(() => {
    if (!policyNumber || !cancellationEffectiveDate) return;
    quotesPoliciesApi.getCancelRewritePreview(insuredType, policyNumber, cancellationEffectiveDate)
      .then(setPreview)
      .catch(() => setPreview(null));
  }, [insuredType, policyNumber, cancellationEffectiveDate]);

  const isEffectiveDateEditable = !!preview?.isPolicyPaid;
  const isCommentRequired = reason.trim().toUpperCase() === 'OTHER';
  const canSubmit = !!cancellationEffectiveDate && !!rewriteEffectiveDate && !!reason
    && (!isCommentRequired || !!comment.trim()) && !submitting;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await quotesPoliciesApi.cancelRewritePolicy(insuredType, policyNumber, {
        cancellationEffectiveDate,
        rewriteEffectiveDate,
        prorationBasis,
        reasonForRewritingPolicy: reason,
        otherReason: otherReason || null,
        adjustCommissions,
        comments: comment || null,
      });
      onRewritten(result);
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to cancel/rewrite policy.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const selectStyle: CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, background: '#f7f9fc' };
  const labelStyle: CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 };

  return (
    <>
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#7a1620', color: '#fff', borderRadius: 4, padding: '12px 16px', marginBottom: 16 }}>
          <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', color: '#7a1620', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</span>
          <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer' }}>×</button>
        </div>
      )}
      <Section title="Cancellation Details">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 14px', marginBottom: 18 }}>
          <div>
            <label style={labelStyle}>* Cancellation Effective Date</label>
            <input
              type="date"
              value={cancellationEffectiveDate}
              onChange={e => setCancellationEffectiveDate(e.target.value)}
              disabled={!isEffectiveDateEditable}
              min={policyStart ?? undefined}
              max={today}
              title={!isEffectiveDateEditable ? 'Editable only when the policy is paid' : undefined}
              style={{ ...selectStyle, background: isEffectiveDateEditable ? '#f7f9fc' : '#f3f4f6', color: isEffectiveDateEditable ? '#111827' : '#9ca3af' }}
            />
          </div>
          <div>
            <label style={labelStyle}>* Proration Basis</label>
            <select value={prorationBasis} onChange={e => setProrationBasis(e.target.value)} style={selectStyle}>
              <option value="Pro-rata">Pro-rata</option>
              <option value="Short Rate">Short Rate</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>* Rewrite Policy Effective Date</label>
            <input
              type="date"
              value={rewriteEffectiveDate}
              onChange={e => setRewriteEffectiveDate(e.target.value)}
              min={policyStart ?? undefined}
              max={today}
              style={selectStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>* Reason for Rewriting Policy</label>
            <select value={reason} onChange={e => setReason(e.target.value)} style={selectStyle}>
              <option value="">Select...</option>
              {reasonOptions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        {reason === 'Other' && (
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Other Reason</label>
            <input value={otherReason} onChange={e => setOtherReason(e.target.value)} placeholder="Additional detail" style={{ ...selectStyle, background: '#fff' }} />
          </div>
        )}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Adjust Commission?</label>
          <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#374151' }}>
            <label><input type="radio" checked={adjustCommissions} onChange={() => setAdjustCommissions(true)} /> Yes</label>
            <label><input type="radio" checked={!adjustCommissions} onChange={() => setAdjustCommissions(false)} /> No</label>
          </div>
        </div>
        <div>
          <label style={labelStyle}>{isCommentRequired ? '* Comment' : 'Comment'}</label>
          <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} placeholder="Type Your Message Here" style={{ ...selectStyle, background: '#fff', resize: 'vertical', border: isCommentRequired && !comment.trim() ? '1px solid #dc2626' : selectStyle.border }} />
          {isCommentRequired && !comment.trim() && (
            <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>Comment is required when reason is "Other".</div>
          )}
        </div>
      </Section>

      <Section title="Breakdown of Refund / Additional Premium">
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: -10, marginBottom: 14 }}>It will be calculated proportionally based on the days your policy was in force</div>
        <DataTable columns={['Premium Breakdown', 'Paid Amount (USD)', 'Refund / Additional Amount (USD)']}>
          {(preview?.premiumBreakdown ?? []).map((row, i) => {
            const isTotal = row.label === 'Total';
            return (
              <tr key={`${row.label}-${i}`} style={isTotal ? { borderTop: '2px solid #e5e7eb', fontWeight: 700, background: '#f7f9fc' } : { borderTop: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 12px' }}>{isTotal ? `${row.label} (USD)` : row.label}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right' }}>{fmtCurrency(row.paidAmount)}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right' }}>{fmtCurrency(row.refundAmount)}</td>
              </tr>
            );
          })}
        </DataTable>
      </Section>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button onClick={onAbort} disabled={submitting} style={{ padding: '9px 18px', borderRadius: 4, border: '1px solid #d1d5db', background: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Abort</button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{ padding: '9px 18px', borderRadius: 4, border: 'none', background: canSubmit ? '#0B5AA0' : '#93c5fd', color: '#fff', fontSize: 13, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'default' }}
        >
          {submitting ? 'Please wait…' : 'Proceed with Rewrite'}
        </button>
      </div>
    </>
  );
}

function Section({ title, actions, children, style }: { title: string; actions?: ReactNode; children: ReactNode; style?: CSSProperties }) {
  return (
    <section style={{ border: '1px solid #d8e1ea', borderRadius: 6, background: '#fff', padding: '16px 16px 18px', marginBottom: 16, ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

function ReadGrid({ items, columns = 4 }: { items: { label: string; value: string }[]; columns?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '16px 14px' }}>
      {items.map(item => (
        <div key={item.label}>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{item.label}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function DataTable({ columns, children }: { columns: string[]; children: ReactNode }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f7f9fc' }}>
            {columns.map(col => <th key={col} style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 700, color: '#374151' }}>{col}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function EmptyState({ message = 'No Data Available' }: { message?: string }) {
  return <div style={{ padding: '40px 0', textAlign: 'center', fontSize: 16, fontWeight: 700, color: '#111827' }}>{message}</div>;
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { border: string; bg: string; color: string }> = {
    Cancelled: { border: '#df4159', bg: '#ffe1e8', color: '#c62828' },
    'Non-Renewed': { border: '#9ca3af', bg: '#f3f4f6', color: '#4b5563' },
    Inactive: { border: '#9ca3af', bg: '#f3f4f6', color: '#4b5563' },
    Active: { border: '#008c55', bg: '#d7f7e4', color: '#006b3c' },
    DONOTRENEW: { border: '#9ca3af', bg: '#f3f4f6', color: '#4b5563' },
  };
  const labels: Record<string, string> = { DONOTRENEW: 'Do Not Renew' };
  const variant = variants[status] ?? variants['Non-Renewed'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 22, padding: '0 12px', borderRadius: 999, border: `1px solid ${variant.border}`, background: variant.bg, color: variant.color, fontSize: 12, fontWeight: 700 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: variant.border }} />
      {labels[status] ?? status}
    </span>
  );
}

function KpiTile({ label, value, valueColor = '#111827' }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 6, padding: '14px 16px', background: '#fafbfc' }}>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: valueColor }}>{value}</div>
    </div>
  );
}

function BillingDonutChart({ series }: { series: BillingSeriesItem[] }) {
  const total = series.reduce((sum, item) => sum + item.value, 0);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offsetAcc = 0;
  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      <g transform="rotate(-90 80 80)">
        {total === 0
          ? <circle cx="80" cy="80" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="24" />
          : series.filter(item => item.value > 0).map(item => {
            const fraction = item.value / total;
            const dash = fraction * circumference;
            const el = (
              <circle
                key={item.key}
                cx="80" cy="80" r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth="24"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offsetAcc}
              />
            );
            offsetAcc += dash;
            return el;
          })}
      </g>
    </svg>
  );
}

function BillingLegend({ series }: { series: BillingSeriesItem[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 32px' }}>
      {series.map(item => (
        <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: item.color, flexShrink: 0 }} />
          <span style={{ color: '#374151', minWidth: 150 }}>{item.label}</span>
          <strong style={{ color: '#111827' }}>USD {fmtCurrency(item.value)}</strong>
        </div>
      ))}
    </div>
  );
}

function PolicySummaryMenu({ policyNumber, status, active, routeId, insuredType }: { policyNumber: string; status: string; active: MenuKey; routeId: string; insuredType: string }) {
  return (
    <aside style={{ width: 236, flexShrink: 0, background: '#fff', borderRight: '1px solid #e5e7eb', boxShadow: '2px 0 6px rgba(15,23,42,0.06)', padding: '12px 14px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Menu</h2>
        <button style={{ background: 'transparent', border: 'none', color: '#111827', padding: 0, cursor: 'pointer' }}><CollapseIcon /></button>
      </div>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Policy No.</div>
      <div style={{ background: '#e6fff3', color: '#007244', padding: '13px 12px', borderRadius: 4, fontSize: 14, marginBottom: 12, wordBreak: 'break-word' }}>{policyNumber}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13 }}>
        <strong>Status :</strong>
        <StatusBadge status={status} />
      </div>
      <nav style={{ display: 'grid', gap: 5 }}>
        {menuItems.map(item => (
          <Link
            key={item.key}
            to={`/quotes-policies/policies/${routeId}?screen=${item.key}&insuredType=${insuredType}`}
            style={{ minHeight: 34, display: 'flex', alignItems: 'center', padding: '0 14px', borderRadius: 4, background: active === item.key ? '#d5effb' : '#e9eef3', color: active === item.key ? '#0065a8' : '#000', fontSize: 13, fontWeight: active === item.key ? 700 : 500, textDecoration: 'none' }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

function PlaceholderContent({ title }: { title: string }) {
  return <Section title={title}><EmptyState message="No Data Available" /></Section>;
}

const na = (value: string | null | undefined) => value ?? '-';

function PolicyInformationCard({ summary }: { summary: PolicySummaryDto | null }) {
  return (
    <Section title="Policy Information" actions={<button style={{ height: 34, minWidth: 110, border: '1px solid #0B5AA0', background: '#fff', color: '#0B5AA0', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}>View Policy</button>}>
      <ReadGrid items={[
        { label: 'Line of Business', value: na(summary?.lob) },
        { label: 'Sub-Product', value: na(summary?.subProduct) },
        { label: 'Effective Date', value: na(summary?.effectiveDate) },
        { label: 'Expiration Date', value: na(summary?.expirationDate) },
        { label: 'First Name', value: na(summary?.firstName) },
        { label: 'Middle / Initial Name', value: na(summary?.middleName) },
        { label: 'Last Name', value: na(summary?.lastName) },
        { label: 'Is Available for Renewal?', value: summary?.availableForRenewal ?? '-' },
      ]} />
    </Section>
  );
}

type ContactColKey = 'name' | 'phone' | 'email' | 'address';
const CONTACT_COLS: { key: ContactColKey; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'email', label: 'Email ID' },
  { key: 'address', label: 'Address' },
];

function contactCell(row: PolicyContactDto, key: ContactColKey): string {
  if (key === 'name') return row.name ?? '';
  if (key === 'phone') return row.phone ?? '';
  if (key === 'email') return row.email ?? '';
  return row.address ?? '';
}

function ContactsContent({ summary }: { summary: PolicySummaryDto | null }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState | null>(null);
  const [filters, setFilters] = useState<AppliedFilters>({});
  const [filterPopup, setFilterPopup] = useState<{ col: ContactColKey; anchor: { top: number; left: number } } | null>(null);

  const contacts = summary?.contacts ?? [];

  const filtered = useMemo(() => {
    let rows = contacts;
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      rows = rows.filter(row => CONTACT_COLS.some(col => contactCell(row, col.key).toLowerCase().includes(s)));
    }
    for (const [col, f] of Object.entries(filters)) {
      rows = rows.filter(row => {
        const cell = contactCell(row, col as ContactColKey);
        if (f.kind === 'value') return f.values.includes(cell);
        const p1 = evalOp(f.op1, cell, f.val1);
        const p2 = evalOp(f.op2, cell, f.val2);
        return f.logic === 'and' ? p1 && p2 : p1 || p2;
      });
    }
    return rows;
  }, [contacts, search, filters]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    return [...filtered].sort((a, b) => {
      const av = contactCell(a, sort.col as ContactColKey);
      const bv = contactCell(b, sort.col as ContactColKey);
      return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [filtered, sort]);

  function handleSort(col: ContactColKey) {
    setSort(s => (s?.col === col && s.dir === 'asc') ? { col, dir: 'desc' } : { col, dir: 'asc' });
  }
  function openFilter(col: ContactColKey, e: React.MouseEvent) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setFilterPopup(p => p?.col === col ? null : { col, anchor: { top: rect.bottom + 4, left: rect.left } });
  }
  function applyFilter(col: ContactColKey, f: ColFilter | null) {
    setFilters(prev => { const next = { ...prev }; if (f == null) delete next[col]; else next[col] = f; return next; });
  }
  function optionsFor(col: ContactColKey) {
    return Array.from(new Set(contacts.map(row => contactCell(row, col)).filter(Boolean))).sort();
  }

  return (
    <>
      <PolicyInformationCard summary={summary} />

      <Section title="Contacts">
        <div style={{ marginBottom: 14 }}>
          <label style={{ width: 320, height: 36, border: '1px solid #cbd5e1', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', color: '#6b7280', background: '#f7f9fc' }}>
            <span style={{ fontSize: 13 }}>&#128269;</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by keyword" style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 13 }} />
          </label>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f7f9fc' }}>
                <th style={{ width: 36, padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }} />
                {CONTACT_COLS.map(col => {
                  const hasFilter = !!filters[col.key];
                  const isSort = sort?.col === col.key;
                  return (
                    <th key={col.key} style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 700, color: hasFilter ? '#0B5AA0' : '#374151' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ cursor: 'pointer' }} onClick={() => handleSort(col.key)}>
                          {col.label}{isSort && (sort!.dir === 'asc' ? ' ↑' : ' ↓')}
                        </span>
                        <button
                          onClick={e => openFilter(col.key, e)}
                          title="Filter"
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: hasFilter ? '#0B5AA0' : '#9ca3af', display: 'inline-flex', padding: 2 }}
                        >
                          <FunnelIcon />
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && <tr><td colSpan={5} style={{ padding: '24px 12px', textAlign: 'center', color: '#6b7280' }}>No Data Available</td></tr>}
              {sorted.map((row, i) => (
                <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 12px', color: '#9ca3af' }}>{i + 1}</td>
                  <td style={{ padding: '10px 12px', color: '#0B5AA0' }}>{na(row.name)}</td>
                  <td style={{ padding: '10px 12px', color: '#0B5AA0' }}>{na(row.phone)}</td>
                  <td style={{ padding: '10px 12px', color: '#0B5AA0' }}>{na(row.email)}</td>
                  <td style={{ padding: '10px 12px' }}>{na(row.address)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filterPopup && (
          <FilterPopup
            colKey={filterPopup.col}
            colLabel={CONTACT_COLS.find(c => c.key === filterPopup.col)?.label ?? ''}
            options={optionsFor(filterPopup.col)}
            current={filters[filterPopup.col] ?? null}
            anchor={filterPopup.anchor}
            onApply={f => applyFilter(filterPopup.col, f)}
            onClose={() => setFilterPopup(null)}
          />
        )}
      </Section>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => navigate(-1)} style={{ height: 34, minWidth: 100, border: '1px solid #d1d5db', background: '#fff', color: '#0B5AA0', borderRadius: 4, fontWeight: 600, cursor: 'pointer' }}>Back</button>
      </div>
    </>
  );
}

type PendingColKey = 'policyNumber' | 'transactionType' | 'quoteNumber' | 'transactionEffectiveDate' | 'assignedUser' | 'status';
const PENDING_COLS: { key: PendingColKey; label: string }[] = [
  { key: 'policyNumber', label: 'Policy Number' },
  { key: 'transactionType', label: 'Transaction Type' },
  { key: 'quoteNumber', label: 'Quote Number' },
  { key: 'transactionEffectiveDate', label: 'Transaction Effective Date' },
  { key: 'assignedUser', label: 'Assigned User' },
  { key: 'status', label: 'Status' },
];

function pendingCell(row: PolicyPendingTransactionDto, key: PendingColKey): string {
  return row[key] ?? '';
}

function PendingTransactionsContent({ policyId, insuredType, summary }: { policyId: string; insuredType: string; summary: PolicySummaryDto | null }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState<PolicyPendingTransactionDto[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState | null>(null);
  const [filters, setFilters] = useState<AppliedFilters>({});
  const [filterPopup, setFilterPopup] = useState<{ col: PendingColKey; anchor: { top: number; left: number } } | null>(null);

  useEffect(() => {
    if (!policyId) return;
    quotesPoliciesApi.getPendingTransactions(insuredType, policyId)
      .then(setRows)
      .catch(() => setRows([]));
  }, [policyId, insuredType]);

  const filtered = useMemo(() => {
    let r = rows;
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      r = r.filter(row => PENDING_COLS.some(col => pendingCell(row, col.key).toLowerCase().includes(s)));
    }
    for (const [col, f] of Object.entries(filters)) {
      r = r.filter(row => {
        const cell = pendingCell(row, col as PendingColKey);
        if (f.kind === 'value') return f.values.includes(cell);
        const p1 = evalOp(f.op1, cell, f.val1);
        const p2 = evalOp(f.op2, cell, f.val2);
        return f.logic === 'and' ? p1 && p2 : p1 || p2;
      });
    }
    return r;
  }, [rows, search, filters]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    return [...filtered].sort((a, b) => {
      const av = pendingCell(a, sort.col as PendingColKey);
      const bv = pendingCell(b, sort.col as PendingColKey);
      return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [filtered, sort]);

  function handleSort(col: PendingColKey) {
    setSort(s => (s?.col === col && s.dir === 'asc') ? { col, dir: 'desc' } : { col, dir: 'asc' });
  }
  function openFilter(col: PendingColKey, e: React.MouseEvent) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setFilterPopup(p => p?.col === col ? null : { col, anchor: { top: rect.bottom + 4, left: rect.left } });
  }
  function applyFilter(col: PendingColKey, f: ColFilter | null) {
    setFilters(prev => { const next = { ...prev }; if (f == null) delete next[col]; else next[col] = f; return next; });
  }
  function optionsFor(col: PendingColKey) {
    return Array.from(new Set(rows.map(row => pendingCell(row, col)).filter(Boolean))).sort();
  }

  return (
    <>
      <PolicyInformationCard summary={summary} />

      <Section title="Pending Transactions">
        <div style={{ marginBottom: 14 }}>
          <label style={{ width: 320, height: 36, border: '1px solid #cbd5e1', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', color: '#6b7280', background: '#f7f9fc' }}>
            <span style={{ fontSize: 13 }}>&#128269;</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by keyword" style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 13 }} />
          </label>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f7f9fc' }}>
                <th style={{ width: 70, padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 700, color: '#374151' }}>Action</th>
                {PENDING_COLS.map(col => {
                  const hasFilter = !!filters[col.key];
                  const isSort = sort?.col === col.key;
                  return (
                    <th key={col.key} style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 700, color: hasFilter ? '#0B5AA0' : '#374151' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ cursor: 'pointer' }} onClick={() => handleSort(col.key)}>
                          {col.label}{isSort && (sort!.dir === 'asc' ? ' ↑' : ' ↓')}
                        </span>
                        <button
                          onClick={e => openFilter(col.key, e)}
                          title="Filter"
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: hasFilter ? '#0B5AA0' : '#9ca3af', display: 'inline-flex', padding: 2 }}
                        >
                          <FunnelIcon />
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && <tr><td colSpan={7} style={{ padding: '40px 12px', textAlign: 'center', fontWeight: 700, color: '#111827' }}>No Data Available</td></tr>}
              {sorted.map(row => (
                <tr key={row.policyId} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <button
                      title="View pending transaction"
                      aria-label="View pending transaction"
                      onClick={() => navigate(`/quotes-policies/submissions/${row.quoteNumber ?? row.policyNumber ?? row.policyId}?readOnly=1`)}
                      style={{ background: 'transparent', border: 'none', color: '#111827', cursor: 'pointer', padding: 4 }}
                    >
                      <EyeIcon />
                    </button>
                  </td>
                  <td style={{ padding: '10px 12px' }}>{row.policyNumber}</td>
                  <td style={{ padding: '10px 12px' }}>{na(row.transactionType)}</td>
                  <td style={{ padding: '10px 12px' }}>{na(row.quoteNumber)}</td>
                  <td style={{ padding: '10px 12px' }}>{na(row.transactionEffectiveDate)}</td>
                  <td style={{ padding: '10px 12px' }}>{row.assignedUser}</td>
                  <td style={{ padding: '10px 12px' }}>{row.status && <StatusBadge status={row.status} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filterPopup && (
          <FilterPopup
            colKey={filterPopup.col}
            colLabel={PENDING_COLS.find(c => c.key === filterPopup.col)?.label ?? ''}
            options={optionsFor(filterPopup.col)}
            current={filters[filterPopup.col] ?? null}
            anchor={filterPopup.anchor}
            onApply={f => applyFilter(filterPopup.col, f)}
            onClose={() => setFilterPopup(null)}
          />
        )}
      </Section>
    </>
  );
}

function BillingContent({ policyId, insuredType, summary }: { policyId: string; insuredType: string; summary: PolicySummaryDto | null }) {
  const navigate = useNavigate();
  const [detail, setDetail] = useState<PolicyBillingDetailDto | null>(null);

  useEffect(() => {
    if (!policyId) return;
    quotesPoliciesApi.getBillingDetail(insuredType, policyId)
      .then(setDetail)
      .catch(() => setDetail(null));
  }, [policyId, insuredType]);

  const fmt = (value: number) => fmtCurrency(value);

  return (
    <>
      <Section title="Summary">
        <div style={{ display: 'flex', gap: 16 }}>
          <KpiTile label="Coverage Premium" value={fmtCurrency(summary?.financials?.coveragePremium)} valueColor="#0B5AA0" />
          <KpiTile label="Taxes" value={fmtCurrency(summary?.financials?.taxes)} valueColor="#0B5AA0" />
          <KpiTile label="Fees" value={fmtCurrency(summary?.financials?.fees)} valueColor="#c26a1a" />
          <KpiTile label="Total Premium" value={fmtCurrency(summary?.financials?.totalPremium)} valueColor="#111827" />
        </div>
      </Section>

      <Section title="Premium Payment Details">
        <ReadGrid columns={5} items={[
          { label: 'Payment Frequency', value: na(detail?.paymentFrequency) },
          { label: 'Responsible Party', value: na(detail?.responsibleParty) },
          { label: 'Mode of Payment', value: na(detail?.modeOfPayment) },
          { label: 'Number of Installment', value: detail ? String(detail.numberOfInstallments).padStart(2, '0') : '-' },
          { label: 'Installment Fee', value: detail ? `USD ${fmt(detail.installmentFee)}` : '-' },
        ]} />
        <div style={{ marginTop: 16 }}>
          <ReadGrid columns={1} items={[
            { label: 'Are fees fully paid in first installment ?', value: detail?.isFullyPaid ?? '-' },
          ]} />
        </div>
      </Section>

      <Section title="Payment Schedule">
        <DataTable columns={['Installment Due Date', 'Installment Fee (USD)', 'Installment Premium Amount (USD)', 'Amount Due (USD)', 'Status']}>
          {(detail?.paymentSchedule ?? []).map((row, i) => (
            <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }}>
              <td style={{ padding: '10px 12px' }}>{na(row.installmentDueDate)}</td>
              <td style={{ padding: '10px 12px', textAlign: 'center' }}>{fmt(row.installmentFee)}</td>
              <td style={{ padding: '10px 12px', textAlign: 'center' }}>{fmt(row.installmentPremiumAmount)}</td>
              <td style={{ padding: '10px 12px', textAlign: 'center' }}>{fmt(row.amountDue)}</td>
              <td style={{ padding: '10px 12px' }}>{row.status}</td>
            </tr>
          ))}
          <tr style={{ borderTop: '1px solid #e5e7eb', background: '#f7f9fc', fontWeight: 700 }}>
            <td colSpan={3} />
            <td colSpan={2} style={{ padding: '10px 12px' }}>Total Pending Amount (USD) {fmt(detail?.totalPendingAmount ?? 0)}</td>
          </tr>
        </DataTable>
      </Section>

      {detail?.cancellationEffectiveDate && (
        <>
          <Section title="Cancellation Details">
            <div style={{ fontSize: 13, color: '#374151' }}>Cancellation Effective Date : {detail.cancellationEffectiveDate}</div>
          </Section>

          <Section title="">
            <div style={{ marginTop: -8, marginBottom: 12, fontWeight: 800, fontSize: 16 }}>Premium Breakdown</div>
            <DataTable columns={['Premium Breakdown (USD)', 'Written Premium (USD)', 'Earned Premium (USD)', 'Unearned Premium (USD)']}>
              {(detail.premiumBreakdown ?? []).map((row, i) => (
                <tr key={i} style={{ borderTop: '1px solid #f3f4f6', fontWeight: row.label === 'Total' ? 700 : 400 }}>
                  <td style={{ padding: '10px 12px' }}>{row.label}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>{fmt(row.written)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>{fmt(row.earned)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>{fmt(row.unearned)}</td>
                </tr>
              ))}
              <tr style={{ borderTop: '1px solid #e5e7eb', background: '#f7f9fc', fontWeight: 700 }}>
                <td style={{ padding: '10px 12px' }}>Total (USD)</td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>{fmt(detail.premiumBreakdown.reduce((sum, r) => sum + r.written, 0))}</td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>{fmt(detail.premiumBreakdown.reduce((sum, r) => sum + r.earned, 0))}</td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>{fmt(detail.premiumBreakdown.reduce((sum, r) => sum + r.unearned, 0))}</td>
              </tr>
            </DataTable>
          </Section>

          <Section title="Commission Details">
            <div style={{ marginTop: -10, marginBottom: 12, fontSize: 13, color: '#374151' }}>Cancellation Effective Date : {detail.cancellationEffectiveDate}</div>
            <DataTable columns={['Agency/Brokerage', 'Producer', 'Commission (%)', 'Coverage Premium (USD)', 'Annual Commission (USD)', 'Paid Commission (USD)', 'Earned Commission (USD)']}>
              {(detail.commissions ?? []).map((row, i) => (
                <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 12px' }}>{na(row.agency)}</td>
                  <td style={{ padding: '10px 12px' }}>{row.producer === '-' ? '' : row.producer}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>{row.commissionPercentage != null ? `${row.commissionPercentage}%` : '-'}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>{fmt(row.coveragePremium ?? 0)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>{fmt(row.totalCommission ?? 0)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>{fmt(row.commissionPaid)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>{fmt(row.earnedCommission)}</td>
                </tr>
              ))}
            </DataTable>
          </Section>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => navigate(-1)} style={{ height: 34, minWidth: 100, border: '1px solid #d1d5db', background: '#fff', color: '#0B5AA0', borderRadius: 4, fontWeight: 600, cursor: 'pointer' }}>Back</button>
      </div>
    </>
  );
}

type HistoryColKey = 'policyNumber' | 'transactionType' | 'transactionEffectiveDate' | 'expirationDate' | 'status';
const HISTORY_COLS: { key: HistoryColKey; label: string }[] = [
  { key: 'policyNumber', label: 'Policy Number' },
  { key: 'transactionType', label: 'Transaction Type' },
  { key: 'transactionEffectiveDate', label: 'Transaction Effective Date' },
  { key: 'expirationDate', label: 'Expiration Date' },
  { key: 'status', label: 'Status' },
];

function historyCell(row: PolicyTransactionDto, key: HistoryColKey): string {
  if (key === 'transactionType') return row.transactionTypeLabel ?? row.transactionType ?? '';
  return row[key] ?? '';
}

function PolicyHistoryContent({ policyId, insuredType, summary }: { policyId: string; insuredType: string; summary: PolicySummaryDto | null }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState<PolicyTransactionDto[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState | null>(null);
  const [filters, setFilters] = useState<AppliedFilters>({});
  const [filterPopup, setFilterPopup] = useState<{ col: HistoryColKey; anchor: { top: number; left: number } } | null>(null);

  useEffect(() => {
    if (!policyId) return;
    quotesPoliciesApi.getPolicyHistory(insuredType, policyId)
      .then(setRows)
      .catch(() => setRows([]));
  }, [policyId, insuredType]);

  const filtered = useMemo(() => {
    let r = rows;
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      r = r.filter(row => HISTORY_COLS.some(col => historyCell(row, col.key).toLowerCase().includes(s)));
    }
    for (const [col, f] of Object.entries(filters)) {
      r = r.filter(row => {
        const cell = historyCell(row, col as HistoryColKey);
        if (f.kind === 'value') return f.values.includes(cell);
        const p1 = evalOp(f.op1, cell, f.val1);
        const p2 = evalOp(f.op2, cell, f.val2);
        return f.logic === 'and' ? p1 && p2 : p1 || p2;
      });
    }
    return r;
  }, [rows, search, filters]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    return [...filtered].sort((a, b) => {
      const av = historyCell(a, sort.col as HistoryColKey);
      const bv = historyCell(b, sort.col as HistoryColKey);
      return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [filtered, sort]);

  function handleSort(col: HistoryColKey) {
    setSort(s => (s?.col === col && s.dir === 'asc') ? { col, dir: 'desc' } : { col, dir: 'asc' });
  }
  function openFilter(col: HistoryColKey, e: React.MouseEvent) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setFilterPopup(p => p?.col === col ? null : { col, anchor: { top: rect.bottom + 4, left: rect.left } });
  }
  function applyFilter(col: HistoryColKey, f: ColFilter | null) {
    setFilters(prev => { const next = { ...prev }; if (f == null) delete next[col]; else next[col] = f; return next; });
  }
  function optionsFor(col: HistoryColKey) {
    return Array.from(new Set(rows.map(row => historyCell(row, col)).filter(Boolean))).sort();
  }

  return (
    <>
      <PolicyInformationCard summary={summary} />

      <Section title="Policy History">
        <div style={{ marginBottom: 14 }}>
          <label style={{ width: 320, height: 36, border: '1px solid #cbd5e1', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', color: '#6b7280', background: '#f7f9fc' }}>
            <span style={{ fontSize: 13 }}>&#128269;</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by keyword" style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 13 }} />
          </label>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f7f9fc' }}>
                <th style={{ width: 70, padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 700, color: '#374151' }}>Action</th>
                {HISTORY_COLS.map(col => {
                  const hasFilter = !!filters[col.key];
                  const isSort = sort?.col === col.key;
                  return (
                    <th key={col.key} style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 700, color: hasFilter ? '#0B5AA0' : '#374151' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ cursor: 'pointer' }} onClick={() => handleSort(col.key)}>
                          {col.label}{isSort && (sort!.dir === 'asc' ? ' ↑' : ' ↓')}
                        </span>
                        <button
                          onClick={e => openFilter(col.key, e)}
                          title="Filter"
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: hasFilter ? '#0B5AA0' : '#9ca3af', display: 'inline-flex', padding: 2 }}
                        >
                          <FunnelIcon />
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && <tr><td colSpan={6} style={{ padding: '40px 12px', textAlign: 'center', fontWeight: 700, color: '#111827' }}>No Data Available</td></tr>}
              {sorted.map(row => (
                <tr key={row.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <button
                      title="View policy"
                      aria-label="View policy"
                      onClick={() => navigate(`/quotes-policies/submissions/${row.redirectionPolicyNumber ?? row.policyNumber}?readOnly=1`)}
                      style={{ background: 'transparent', border: 'none', color: '#111827', cursor: 'pointer', padding: 4 }}
                    >
                      <EyeIcon />
                    </button>
                  </td>
                  <td style={{ padding: '10px 12px' }}>{row.policyNumber}</td>
                  <td style={{ padding: '10px 12px' }}>{na(row.transactionTypeLabel ?? row.transactionType)}</td>
                  <td style={{ padding: '10px 12px' }}>{na(row.transactionEffectiveDate)}</td>
                  <td style={{ padding: '10px 12px' }}>{na(row.expirationDate)}</td>
                  <td style={{ padding: '10px 12px' }}>{row.status && <StatusBadge status={row.status} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filterPopup && (
          <FilterPopup
            colKey={filterPopup.col}
            colLabel={HISTORY_COLS.find(c => c.key === filterPopup.col)?.label ?? ''}
            options={optionsFor(filterPopup.col)}
            current={filters[filterPopup.col] ?? null}
            anchor={filterPopup.anchor}
            onApply={f => applyFilter(filterPopup.col, f)}
            onClose={() => setFilterPopup(null)}
          />
        )}
      </Section>
    </>
  );
}

type ClaimColKey = 'claimNumber' | 'claimantName' | 'dateOfLoss' | 'causeOfLoss' | 'status';
const CLAIM_COLS: { key: ClaimColKey; label: string }[] = [
  { key: 'claimNumber', label: 'Claim Number' },
  { key: 'claimantName', label: 'Claimant Name / Insured Name' },
  { key: 'dateOfLoss', label: 'Date of Loss' },
  { key: 'causeOfLoss', label: 'Cause of Loss' },
  { key: 'status', label: 'Claim Status' },
];

function claimCell(row: PolicyClaimRowDto, key: ClaimColKey): string {
  return row[key] ?? '';
}

function ClaimsContent({ policyId, insuredType, summary }: { policyId: string; insuredType: string; summary: PolicySummaryDto | null }) {
  const [rows, setRows] = useState<PolicyClaimRowDto[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState | null>(null);
  const [filters, setFilters] = useState<AppliedFilters>({});
  const [filterPopup, setFilterPopup] = useState<{ col: ClaimColKey; anchor: { top: number; left: number } } | null>(null);

  useEffect(() => {
    if (!policyId) return;
    quotesPoliciesApi.getClaims(insuredType, policyId)
      .then(setRows)
      .catch(() => setRows([]));
  }, [policyId, insuredType]);

  const filtered = useMemo(() => {
    let r = rows;
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      r = r.filter(row => CLAIM_COLS.some(col => claimCell(row, col.key).toLowerCase().includes(s)));
    }
    for (const [col, f] of Object.entries(filters)) {
      r = r.filter(row => {
        const cell = claimCell(row, col as ClaimColKey);
        if (f.kind === 'value') return f.values.includes(cell);
        const p1 = evalOp(f.op1, cell, f.val1);
        const p2 = evalOp(f.op2, cell, f.val2);
        return f.logic === 'and' ? p1 && p2 : p1 || p2;
      });
    }
    return r;
  }, [rows, search, filters]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    return [...filtered].sort((a, b) => {
      const av = claimCell(a, sort.col as ClaimColKey);
      const bv = claimCell(b, sort.col as ClaimColKey);
      return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [filtered, sort]);

  function handleSort(col: ClaimColKey) {
    setSort(s => (s?.col === col && s.dir === 'asc') ? { col, dir: 'desc' } : { col, dir: 'asc' });
  }
  function openFilter(col: ClaimColKey, e: React.MouseEvent) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setFilterPopup(p => p?.col === col ? null : { col, anchor: { top: rect.bottom + 4, left: rect.left } });
  }
  function applyFilter(col: ClaimColKey, f: ColFilter | null) {
    setFilters(prev => { const next = { ...prev }; if (f == null) delete next[col]; else next[col] = f; return next; });
  }
  function optionsFor(col: ClaimColKey) {
    return Array.from(new Set(rows.map(row => claimCell(row, col)).filter(Boolean))).sort();
  }

  return (
    <>
      <PolicyInformationCard summary={summary} />

      <Section title="Claims">
        <div style={{ marginBottom: 14 }}>
          <label style={{ width: 320, height: 36, border: '1px solid #cbd5e1', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', color: '#6b7280', background: '#f7f9fc' }}>
            <span style={{ fontSize: 13 }}>&#128269;</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by keyword" style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 13 }} />
          </label>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f7f9fc' }}>
                <th style={{ width: 70, padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 700, color: '#374151' }}>Action</th>
                {CLAIM_COLS.map(col => {
                  const hasFilter = !!filters[col.key];
                  const isSort = sort?.col === col.key;
                  return (
                    <th key={col.key} style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 700, color: hasFilter ? '#0B5AA0' : '#374151' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ cursor: 'pointer' }} onClick={() => handleSort(col.key)}>
                          {col.label}{isSort && (sort!.dir === 'asc' ? ' ↑' : ' ↓')}
                        </span>
                        <button
                          onClick={e => openFilter(col.key, e)}
                          title="Filter"
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: hasFilter ? '#0B5AA0' : '#9ca3af', display: 'inline-flex', padding: 2 }}
                        >
                          <FunnelIcon />
                        </button>
                      </div>
                    </th>
                  );
                })}
                <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 700, color: '#374151' }}>Incurred Amount (USD)</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 700, color: '#374151' }}>Paid Amount (USD)</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && <tr><td colSpan={8} style={{ padding: '40px 12px', textAlign: 'center', fontWeight: 700, color: '#111827' }}>No Data Available</td></tr>}
              {sorted.map(row => (
                <tr key={row.claimNumber} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <button
                      title="View claim"
                      aria-label="View claim"
                      onClick={() => { /* no-op for now */ }}
                      style={{ background: 'transparent', border: 'none', color: '#111827', cursor: 'pointer', padding: 4 }}
                    >
                      <EyeIcon />
                    </button>
                  </td>
                  <td style={{ padding: '10px 12px' }}>{row.claimNumber}</td>
                  <td style={{ padding: '10px 12px' }}>{na(row.claimantName)}</td>
                  <td style={{ padding: '10px 12px' }}>{na(row.dateOfLoss)}</td>
                  <td style={{ padding: '10px 12px' }}>{na(row.causeOfLoss)}</td>
                  <td style={{ padding: '10px 12px' }}>{row.status && <StatusBadge status={row.status} />}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{fmtCurrency(row.incurredAmount)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{fmtCurrency(row.paidAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filterPopup && (
          <FilterPopup
            colKey={filterPopup.col}
            colLabel={CLAIM_COLS.find(c => c.key === filterPopup.col)?.label ?? ''}
            options={optionsFor(filterPopup.col)}
            current={filters[filterPopup.col] ?? null}
            anchor={filterPopup.anchor}
            onApply={f => applyFilter(filterPopup.col, f)}
            onClose={() => setFilterPopup(null)}
          />
        )}
      </Section>
    </>
  );
}

const NOTE_TYPES = ['Diary', 'Internal', 'External'] as const;

function AddNoteModal({ insuredType, policyId, note, onClose, onSaved }: {
  insuredType: string;
  policyId: string;
  note: NoteDto | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [accessType, setAccessType] = useState<string>(note?.accessType ?? 'Internal');
  const [notesText, setNotesText] = useState(note?.notesText ?? '');
  const [existingFiles, setExistingFiles] = useState<NoteFileDto[]>(note?.files ?? []);
  const [removedFileIds, setRemovedFileIds] = useState<number[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!note;
  const plainText = notesText.replace(/<[^>]*>/g, '').trim();
  const canSubmit = !!accessType && !!plainText && !submitting;

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const accepted: File[] = [];
    for (const f of Array.from(fileList)) {
      if (f.size < 10 * 1024 || f.size > 10 * 1024 * 1024) {
        setError(`"${f.name}" must be between 10 KB and 10 MB.`);
        continue;
      }
      accepted.push(f);
    }
    if (accepted.length) setNewFiles(prev => [...prev, ...accepted]);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      if (isEditing) {
        await quotesPoliciesApi.updateNote(insuredType, policyId, note!.id, accessType, notesText, newFiles, removedFileIds);
      } else {
        await quotesPoliciesApi.addNote(insuredType, policyId, accessType, notesText, newFiles);
      }
      onSaved();
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to save note.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const labelStyle: CSSProperties = { display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 8, width: 820, maxWidth: '94vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{isEditing ? 'Edit Note' : 'Add Note'}</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6b7280' }}>×</button>
        </div>
        <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24 }}>
          <div>
            <label style={labelStyle}>* Notes Type</label>
            <div style={{ display: 'flex', gap: 24, marginBottom: 18, fontSize: 13 }}>
              {NOTE_TYPES.map(t => (
                <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="radio" checked={accessType === t} onChange={() => setAccessType(t)} /> {t}
                </label>
              ))}
            </div>
            <label style={labelStyle}>* Note</label>
            <RichTextEditor value={notesText} onChange={setNotesText} />
          </div>
          <div>
            <label style={labelStyle}>Upload Reference Documents</label>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
              style={{ border: `1.5px dashed ${dragOver ? '#0B5AA0' : '#cbd5e1'}`, borderRadius: 6, padding: '22px 14px', textAlign: 'center', background: dragOver ? '#eef6ff' : '#f9fafb' }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Drag and Drop File Here or Select a File</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 12 }}>Supported formats are Excel, JPEG, PNG, PDF, Doc and Pages<br />Files size: 10 KB - 10 MB</div>
              <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{ padding: '7px 14px', borderRadius: 4, border: '1px solid #0B5AA0', background: '#fff', color: '#0B5AA0', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                📂 Browse File
              </button>
            </div>

            {(existingFiles.length > 0 || newFiles.length > 0) && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Attached Documents List</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {existingFiles.map(f => (
                    <div key={`existing-${f.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, background: '#f7f9fc', border: '1px solid #e5e7eb', borderRadius: 4, padding: '6px 10px' }}>
                      <PaperclipIcon />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.fileName}</span>
                      <a href={quotesPoliciesApi.noteFileUrl(insuredType, policyId, f.id)} target="_blank" rel="noreferrer" style={{ color: '#111827', display: 'inline-flex' }} title="View"><EyeIcon /></a>
                      <button
                        type="button"
                        onClick={() => { setExistingFiles(prev => prev.filter(x => x.id !== f.id)); setRemovedFileIds(prev => [...prev, f.id]); }}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#df4159', display: 'inline-flex' }}
                        title="Remove"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  ))}
                  {newFiles.map((f, i) => (
                    <div key={`new-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, background: '#f7f9fc', border: '1px solid #e5e7eb', borderRadius: 4, padding: '6px 10px' }}>
                      <PaperclipIcon />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                      <button
                        type="button"
                        onClick={() => setNewFiles(prev => prev.filter((_, idx) => idx !== i))}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#df4159', display: 'inline-flex' }}
                        title="Remove"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {error && <div style={{ padding: '0 20px 12px', color: '#b91c1c', fontSize: 13 }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderTop: '1px solid #e5e7eb' }}>
          <button onClick={onClose} disabled={submitting} style={{ padding: '9px 18px', borderRadius: 4, border: '1px solid #d1d5db', background: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{ padding: '9px 18px', borderRadius: 4, border: 'none', background: canSubmit ? '#0B5AA0' : '#93c5fd', color: '#fff', fontSize: 13, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'default' }}
          >
            {submitting ? 'Please wait…' : isEditing ? 'Save' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}

function NoteCard({ note, insuredType, policyId, onEdit, onDeleted }: {
  note: NoteDto;
  insuredType: string;
  policyId: string;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Delete this note?')) return;
    setDeleting(true);
    try {
      await quotesPoliciesApi.deleteNote(insuredType, policyId, note.id);
      onDeleted();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ background: '#f7f9fc', border: '1px solid #e5e7eb', borderRadius: 6, padding: '14px 16px', marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: 12, color: '#374151' }}>
          <span style={{ fontWeight: 700 }}>Created By: {note.createdByName ?? 'System'}</span>
          <div style={{ color: '#6b7280', marginTop: 2 }}>On {note.createdOn}</div>
        </div>
        <span style={{ background: '#f3e8ff', color: '#7e22ce', borderRadius: 999, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>{note.module}</span>
      </div>
      <div style={{ fontSize: 13, color: '#111827', margin: '10px 0' }} dangerouslySetInnerHTML={{ __html: note.notesText }} />
      {note.files.length > 0 && (
        <div style={{ display: 'grid', gap: 6, marginBottom: 6 }}>
          {note.files.map(f => (
            <div key={f.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, padding: '5px 10px', width: 'fit-content' }}>
              <PaperclipIcon />
              <span>{f.fileName}</span>
              <a href={quotesPoliciesApi.noteFileUrl(insuredType, policyId, f.id)} target="_blank" rel="noreferrer" style={{ color: '#111827', display: 'inline-flex' }} title="View"><EyeIcon /></a>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, marginTop: 6 }}>
        <button onClick={onEdit} title="Edit" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#374151', display: 'inline-flex' }}><PencilIcon /></button>
        <button onClick={handleDelete} disabled={deleting} title="Delete" style={{ background: 'transparent', border: 'none', cursor: deleting ? 'default' : 'pointer', color: '#df4159', display: 'inline-flex' }}><TrashIcon /></button>
      </div>
    </div>
  );
}

function NotesSection({ policyId, insuredType }: { policyId: string; insuredType: string }) {
  const [notes, setNotes] = useState<NoteDto[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteDto | null>(null);

  const refetch = () => {
    if (!policyId) return;
    quotesPoliciesApi.getNotes(insuredType, policyId).then(setNotes).catch(() => setNotes([]));
  };

  useEffect(refetch, [policyId, insuredType]);

  return (
    <Section
      title="Notes"
      actions={
        <button
          onClick={() => { setEditingNote(null); setModalOpen(true); }}
          style={{ height: 34, minWidth: 84, border: 'none', background: '#0B5AA0', color: '#fff', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}
        >
          + Add
        </button>
      }
    >
      {notes.length === 0 ? <EmptyState /> : notes.map(n => (
        <NoteCard
          key={n.id}
          note={n}
          insuredType={insuredType}
          policyId={policyId}
          onEdit={() => { setEditingNote(n); setModalOpen(true); }}
          onDeleted={refetch}
        />
      ))}
      {modalOpen && (
        <AddNoteModal
          insuredType={insuredType}
          policyId={policyId}
          note={editingNote}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); refetch(); }}
        />
      )}
    </Section>
  );
}

function NotesContent({ policyId, insuredType, summary }: { policyId: string; insuredType: string; summary: PolicySummaryDto | null }) {
  return (
    <>
      <PolicyInformationCard summary={summary} />
      <NotesSection policyId={policyId} insuredType={insuredType} />
    </>
  );
}

function TimelineContent({ policyId, insuredType, summary }: { policyId: string; insuredType: string; summary: PolicySummaryDto | null }) {
  const [entries, setEntries] = useState<PolicyTimelineEntryDto[]>([]);

  useEffect(() => {
    if (!policyId) return;
    quotesPoliciesApi.getTimeline(insuredType, policyId)
      .then(setEntries)
      .catch(() => setEntries([]));
  }, [policyId, insuredType]);

  const groups = useMemo(() => {
    const byDate = new Map<string, PolicyTimelineEntryDto[]>();
    for (const e of entries) {
      const list = byDate.get(e.createdDate) ?? [];
      list.push(e);
      byDate.set(e.createdDate, list);
    }
    return Array.from(byDate.entries()).map(([date, items]) => ({ date, items }));
  }, [entries]);

  return (
    <>
      <PolicyInformationCard summary={summary} />

      <Section title={`Total Transactions – ${entries.length}`}>
        {groups.length === 0 ? <EmptyState /> : (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, overflowX: 'auto', paddingBottom: 8 }}>
            {groups.map((group, gi) => (
              <div key={group.date} style={{ display: 'flex', alignItems: 'flex-start', flexShrink: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 8 }}>
                  <span style={{ display: 'inline-block', border: '1px solid #0B5AA0', color: '#0B5AA0', borderRadius: 999, padding: '4px 14px', fontSize: 13, fontWeight: 600, background: '#fff', whiteSpace: 'nowrap' }}>
                    {group.date}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: 10, marginRight: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', border: '1px solid #94a3b8', background: '#fff', flexShrink: 0 }} />
                  {gi < groups.length - 1 && <span style={{ width: 40, height: 1, background: '#cbd5e1' }} />}
                </div>
                <div style={{ display: 'flex', gap: 12, marginRight: 24 }}>
                  {group.items.map((entry, ei) => (
                    <div key={ei} style={{ minWidth: 220, border: '1px solid #e5e7eb', borderRadius: 6, padding: 12, background: '#fafbfc' }}>
                      <span style={{ display: 'inline-block', border: '1px solid #0B5AA0', color: '#0B5AA0', borderRadius: 4, padding: '2px 10px', fontSize: 12, fontWeight: 600, marginBottom: 10 }}>
                        {entry.activityDescription}
                      </span>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Created By</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 6 }}>{entry.createdByName ?? 'System'}</div>
                      <div style={{ fontSize: 11, fontStyle: 'italic', color: '#9ca3af' }}>Timestamp: {entry.createdDate}, {entry.createdTime}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}

function billingSeriesFrom(billing: PolicySummaryDto['billing']): BillingSeriesItem[] {
  return [
    { key: 'writtenPremium', label: 'Written Premium', value: billing?.writtenPremium ?? 0, color: '#4A90D9' },
    { key: 'totalBilled', label: 'Total Billed', value: billing?.totalBilled ?? 0, color: '#9B59B6' },
    { key: 'amountPaid', label: 'Amount Paid', value: billing?.amountPaid ?? 0, color: '#1ABC9C' },
    { key: 'amountDue', label: 'Amount Due', value: billing?.amountDue ?? 0, color: '#E67E22' },
    { key: 'unbilledPremium', label: 'Unbilled Premium', value: billing?.unbilledPremium ?? 0, color: '#7FDBDA' },
  ];
}

function SummaryContent({ policyId, insuredType, summary }: { policyId: string; insuredType: string; summary: PolicySummaryDto | null }) {
  const navigate = useNavigate();
  const [history, setHistory] = useState<PolicyTransactionDto[]>([]);
  const [pending, setPending] = useState<PolicyPendingTransactionDto[]>([]);

  useEffect(() => {
    if (!policyId) return;
    quotesPoliciesApi.getPolicyHistory(insuredType, policyId)
      .then(setHistory)
      .catch(() => setHistory([]));
    quotesPoliciesApi.getPendingTransactions(insuredType, policyId)
      .then(setPending)
      .catch(() => setPending([]));
  }, [policyId, insuredType]);

  return (
    <>
      <PolicyInformationCard summary={summary} />

      <Section title="Producer Information">
        {summary && summary.producers.length > 0 ? (
          <DataTable columns={['Producer', 'Agency / Brokerage', 'Commission (%)', 'Total Commission (USD)', 'Commission Paid (USD)']}>
            {summary.producers.map((row, i) => (
              <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 12px' }}>{row.producer}</td>
                <td style={{ padding: '10px 12px' }}>{na(row.agency)}</td>
                <td style={{ padding: '10px 12px' }}>{row.commissionPercentage != null ? `${row.commissionPercentage}%` : '-'}</td>
                <td style={{ padding: '10px 12px' }}>{fmtCurrency(row.totalCommission)}</td>
                <td style={{ padding: '10px 12px' }}>{fmtCurrency(row.commissionPaid)}</td>
              </tr>
            ))}
          </DataTable>
        ) : <EmptyState />}
      </Section>

      <Section title="Financials">
        <div style={{ display: 'flex', gap: 16 }}>
          <KpiTile label="Coverage Premium" value={fmtCurrency(summary?.financials?.coveragePremium)} valueColor="#0B5AA0" />
          <KpiTile label="Taxes" value={fmtCurrency(summary?.financials?.taxes)} valueColor="#0B5AA0" />
          <KpiTile label="Fees" value={fmtCurrency(summary?.financials?.fees)} valueColor="#c26a1a" />
          <KpiTile label="Total Premium" value={fmtCurrency(summary?.financials?.totalPremium)} valueColor="#111827" />
        </div>
      </Section>

      <Section title="Billing">
        <div style={{ display: 'flex', gap: 40, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Payment Frequency</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{na(summary?.billing?.paymentFrequency)}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Responsible Party</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{na(summary?.billing?.responsibleParty)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
          <BillingDonutChart series={billingSeriesFrom(summary?.billing ?? null)} />
          <BillingLegend series={billingSeriesFrom(summary?.billing ?? null)} />
        </div>
      </Section>

      <Section title="Pending Transactions">
        {pending.length > 0 ? (
          <DataTable columns={['Policy Number', 'Transaction Type', 'Quote Number', 'Transaction Effective Date', 'Assigned User', 'Status', 'Action']}>
            {pending.map(row => (
              <tr key={row.policyId} style={{ borderTop: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 12px' }}>{row.policyNumber}</td>
                <td style={{ padding: '10px 12px' }}>{na(row.transactionType)}</td>
                <td style={{ padding: '10px 12px' }}>{na(row.quoteNumber)}</td>
                <td style={{ padding: '10px 12px' }}>{na(row.transactionEffectiveDate)}</td>
                <td style={{ padding: '10px 12px' }}>{row.assignedUser}</td>
                <td style={{ padding: '10px 12px' }}>{row.status && <StatusBadge status={row.status} />}</td>
                <td style={{ padding: '10px 12px' }}>
                  <button
                    title="View pending transaction"
                    aria-label="View pending transaction"
                    onClick={() => navigate(`/quotes-policies/submissions/${row.quoteNumber ?? row.policyNumber ?? row.policyId}?readOnly=1`)}
                    style={{ background: 'transparent', border: 'none', color: '#111827', cursor: 'pointer', padding: 4 }}
                  >
                    <EyeIcon />
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        ) : <EmptyState />}
      </Section>

      <Section
        title="Policy History"
        actions={history.length > 3 ? (
          <Link
            to={`/quotes-policies/policies/${policyId}?screen=history&insuredType=${insuredType}`}
            style={{ fontSize: 13, fontWeight: 700, color: '#0B5AA0', textDecoration: 'none' }}
          >
            View All
          </Link>
        ) : undefined}
      >
        <DataTable columns={['Policy Number', 'Effective Date', 'Expiration Date', 'Transaction Type', 'Transaction Effective Date', 'Status', 'Action']}>
          {history.slice(0, 3).map(row => (
            <tr key={row.id} style={{ borderTop: '1px solid #f3f4f6' }}>
              <td style={{ padding: '10px 12px' }}>{row.policyNumber}</td>
              <td style={{ padding: '10px 12px' }}>{row.effectiveDate}</td>
              <td style={{ padding: '10px 12px' }}>{row.expirationDate}</td>
              <td style={{ padding: '10px 12px' }}>{row.transactionTypeLabel ?? row.transactionType}</td>
              <td style={{ padding: '10px 12px' }}>{row.transactionEffectiveDate}</td>
              <td style={{ padding: '10px 12px' }}>{row.status && <StatusBadge status={row.status} />}</td>
              <td style={{ padding: '10px 12px' }}>
                <button
                  title="View policy"
                  aria-label="View policy"
                  onClick={() => navigate(`/quotes-policies/submissions/${row.redirectionPolicyNumber ?? row.policyNumber}?readOnly=1`)}
                  style={{ background: 'transparent', border: 'none', color: '#111827', cursor: 'pointer', padding: 4 }}
                >
                  <EyeIcon />
                </button>
              </td>
            </tr>
          ))}
        </DataTable>
      </Section>

      <Section title="Claims">
        {summary && summary.claims.length > 0 ? (
          <DataTable columns={['Claim Number', 'Status']}>
            {summary.claims.map((row, i) => (
              <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 12px' }}>{na(row.claimNumber)}</td>
                <td style={{ padding: '10px 12px' }}>{na(row.status)}</td>
              </tr>
            ))}
          </DataTable>
        ) : <EmptyState />}
      </Section>

      <Section title="Contacts">
        {summary && summary.contacts.length > 0 ? (
          <DataTable columns={['Name', 'Phone Number', 'Email ID', 'Address']}>
            {summary.contacts.map((row, i) => (
              <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 12px' }}>{na(row.name)}</td>
                <td style={{ padding: '10px 12px' }}>{na(row.phone)}</td>
                <td style={{ padding: '10px 12px' }}>{na(row.email)}</td>
                <td style={{ padding: '10px 12px' }}>{na(row.address)}</td>
              </tr>
            ))}
          </DataTable>
        ) : <EmptyState />}
      </Section>

      <NotesSection policyId={policyId} insuredType={insuredType} />
    </>
  );
}

export default function PolicySummaryPage() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const policyId = id ?? '';
  const insuredType = params.get('insuredType') ?? 'individual';
  const screen = (params.get('screen') as MenuKey | null) ?? 'summary';
  const active = menuItems.some(item => item.key === screen) ? screen : 'summary';
  const title = titleByKey[active];
  const [scrollRef, setScrollRef] = useState<HTMLDivElement | null>(null);
  const [summary, setSummary] = useState<PolicySummaryDto | null>(null);
  const [showCancelPage, setShowCancelPage] = useState(false);
  const [showCancelRewritePage, setShowCancelRewritePage] = useState(false);

  const refetchSummary = () => {
    if (!policyId) return;
    quotesPoliciesApi.getPolicySummary(insuredType, policyId)
      .then(setSummary)
      .catch(() => setSummary(null));
  };

  useEffect(refetchSummary, [policyId, insuredType]);

  return (
    <div style={{ display: 'flex', minHeight: '100%', background: '#fff' }}>
      <PolicySummaryMenu policyNumber={summary?.policyNumber ?? policyId} status={summary?.status ?? '-'} active={active} routeId={policyId} insuredType={insuredType} />
      <div style={{ flex: 1, padding: '16px 16px 28px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Policy Number {summary?.policyNumber ?? policyId}</h1>
            <div style={{ fontSize: 12, marginTop: 6, color: '#6b7280' }}>
              <Link to={`/quotes-policies/${insuredType}/policies`} style={{ color: '#0B5AA0', textDecoration: 'none' }}>Specialty- Policies</Link> / {showCancelPage ? 'Summary / Policy Cancellation' : showCancelRewritePage ? 'Summary / Cancel & Rewrite' : title}
            </div>
          </div>
          <ToolsMenu
            insuredType={insuredType}
            policyNumber={summary?.policyNumber ?? policyId}
            policyStatus={summary?.status}
            policyEffectiveDate={summary?.effectiveDate}
            onCancelPolicyConfirmed={() => setShowCancelPage(true)}
            onCancelRewrite={() => setShowCancelRewritePage(true)}
            onDoNotRenewSubmitted={refetchSummary}
            onRemoveDoNotRenewConfirmed={async () => {
              await quotesPoliciesApi.removeDoNotRenew(insuredType, summary?.policyNumber ?? policyId);
              refetchSummary();
            }}
            onEndorseSubmit={async (effectiveDate, summaryOfChanges) => {
              const policyNumber = summary?.policyNumber ?? policyId;
              await quotesPoliciesApi.endorsePolicy(insuredType, policyNumber, {
                transactionEffectiveDate: effectiveDate,
                summaryOfChanges,
              });
              // Hydrate the wizard's initial draft from the FULL cloned policy (risk
              // address, risk info, limits & coverages, additional insureds, mortgages) —
              // not just the handful of fields endorsePolicy's response carries — so
              // nothing the clone produced is invisible to the wizard from the start.
              const draftForm = await quotesPoliciesApi.getEndorsementDraftForm(insuredType, policyNumber);
              const submission = await quotesPoliciesApi.createSubmission({
                dataJson: JSON.stringify({
                  form: { ...draftForm.form, endorsementEffectiveDate: effectiveDate },
                  locations: draftForm.locations,
                  mortgages: draftForm.mortgages,
                  additionalInsureds: draftForm.additionalInsureds,
                  additionalOrgs: draftForm.additionalOrgs,
                }),
              });
              navigate(`/quotes-policies/submissions/${submission.id}`);
            }}
          />
        </div>
        <div ref={setScrollRef} style={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto', paddingRight: 10 }}>
          {showCancelPage ? (
            <CancelPolicyContent
              insuredType={insuredType}
              policyNumber={summary?.policyNumber ?? policyId}
              policyEffectiveDate={summary?.effectiveDate}
              onAbort={() => setShowCancelPage(false)}
              onCancelled={() => { setShowCancelPage(false); refetchSummary(); }}
            />
          ) : showCancelRewritePage ? (
            <CancelRewriteContent
              insuredType={insuredType}
              policyNumber={summary?.policyNumber ?? policyId}
              policyEffectiveDate={summary?.effectiveDate}
              onAbort={() => setShowCancelRewritePage(false)}
              onRewritten={async (result) => {
                const screenCode = insuredType === 'business' ? 'NEWBUSINESS' : 'NEWBUSINESSINDIVIDUAL';
                const submission = await quotesPoliciesApi.createSubmission({
                  dataJson: JSON.stringify({
                    form: {
                      screenCode,
                      policyType: screenCode,
                      policyNumber: result.newPolicyNumber,
                      quoteNumber: result.newQuoteNumber,
                      recordStatus: 'Draft',
                      lob: summary?.lob ?? '',
                      subProduct: summary?.subProduct ?? '',
                      firstName: summary?.firstName ?? '',
                      middleName: summary?.middleName ?? '',
                      lastName: summary?.lastName ?? '',
                    },
                  }),
                });
                navigate(`/quotes-policies/submissions/${submission.id}`);
              }}
            />
          ) : <>
          {active === 'summary' && <SummaryContent policyId={policyId} insuredType={insuredType} summary={summary} />}
          {active === 'contacts' && <ContactsContent summary={summary} />}
          {active === 'billing' && <BillingContent policyId={policyId} insuredType={insuredType} summary={summary} />}
          {active === 'pending' && <PendingTransactionsContent policyId={policyId} insuredType={insuredType} summary={summary} />}
          {active === 'history' && <PolicyHistoryContent policyId={policyId} insuredType={insuredType} summary={summary} />}
          {active === 'claims' && <ClaimsContent policyId={policyId} insuredType={insuredType} summary={summary} />}
          {active === 'notes' && <NotesContent policyId={policyId} insuredType={insuredType} summary={summary} />}
          {active === 'timeline' && <TimelineContent policyId={policyId} insuredType={insuredType} summary={summary} />}
          {active !== 'summary' && active !== 'contacts' && active !== 'billing' && active !== 'pending' && active !== 'history' && active !== 'claims' && active !== 'notes' && active !== 'timeline' && <PlaceholderContent title={title} />}
          </>}
        </div>
        <button
          onClick={() => scrollRef?.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ position: 'fixed', bottom: 24, right: 24, width: 40, height: 40, borderRadius: '50%', border: 'none', background: '#0B5AA0', color: '#fff', fontSize: 16, cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}
          title="Scroll to top"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
