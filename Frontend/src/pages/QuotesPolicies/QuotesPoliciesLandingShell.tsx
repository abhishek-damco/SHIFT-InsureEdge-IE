// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Layout wrapper for the Quotes & Policies landing pages (register grids) plus the
// WizardSidebar used by the New Submission wizard. Ported from the prototype's
// components/QuotesPoliciesLandingShell.tsx + WizardSidebar (originally in App.tsx).
import { ChevronRight, FileCheck2, FileClock, FilePlus2, FileText, PanelLeftClose, type LucideIcon } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import './QuotesPolicies.css';

type ActionItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  match?: string[];
};

const sections: Array<{ title: string; items: ActionItem[] }> = [
  {
    title: 'Individual',
    items: [
      { label: 'New Business Quote', to: '/quotes-policies/individual/nb-quotes', icon: FilePlus2 },
      { label: 'Endorsement Quote', to: '/quotes-policies/individual/endorsements', icon: FileText },
      { label: 'Renewal Quote', to: '/quotes-policies/individual/renewals', icon: FileClock },
      { label: 'Policies', to: '/quotes-policies/individual/policies', icon: FileCheck2 },
    ],
  },
  {
    title: 'Business',
    items: [
      { label: 'New Business Quote', to: '/quotes-policies/business/nb-quotes', icon: FilePlus2 },
      { label: 'Endorsement Quote', to: '/quotes-policies/business/endorsements', icon: FileText },
      { label: 'Renewal Quote', to: '/quotes-policies/business/renewals', icon: FileClock },
      { label: 'Policies', to: '/quotes-policies/business/policies', icon: FileCheck2 },
    ],
  },
];

const recentActivity = [
  'Submission viewed for Quote ID 0000003752',
  'Submission viewed for Quote ID 0000003753',
  'Submission viewed for Quote ID 0000003750',
  'Submission viewed for Quote ID 0000000059',
  'Policy viewed for Policy ID 0000000728',
];

function isActivePath(pathname: string, to: string, matches: string[] = []) {
  return [to, ...matches].some(path => pathname === path || pathname.startsWith(`${path}/`));
}

export default function QuotesPoliciesLandingShell() {
  const location = useLocation();
  const hideLandingActions = location.pathname.startsWith('/quotes-policies/submissions');

  return (
    <div className="qp-scope" style={{ height: '100%' }}>
      <div className="app-body" style={{ height: '100%' }}>
        {!hideLandingActions && (
          <aside className="sidebar">
            <div className="sidebar-header">
              <span>Actions</span>
              <button className="sidebar-toggle" type="button" title="Collapse actions">
                <PanelLeftClose size={16} />
              </button>
            </div>

            {sections.map(section => (
              <div key={section.title}>
                <div className="nav-section-header">
                  <ChevronRight size={13} className="nav-section-chevron open" />
                  <span>{section.title}</span>
                </div>
                {section.items.map(({ label, to, icon: Icon, match }) => {
                  const moduleActive = isActivePath(location.pathname, to, match);

                  return (
                    <NavLink
                      key={`${section.title}-${label}`}
                      to={to}
                      className={({ isActive }) => `nav-item${isActive || moduleActive ? ' active' : ''}`}
                    >
                      <Icon size={14} className="nav-icon" />
                      <span>{label}</span>
                    </NavLink>
                  );
                })}
              </div>
            ))}

            <div className="recent-activity">
              <div className="recent-activity-title">Recent Activity</div>
              {recentActivity.map(item => (
                <div className="activity-item" key={item}>
                  <div>
                    <div className="act-label">View</div>
                    <div className="act-text">{item}</div>
                  </div>
                  <span className="act-arrow">&#8250;</span>
                </div>
              ))}
            </div>
          </aside>
        )}

        <main className={`main${hideLandingActions ? ' main-fullwidth' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ─── Avatar helpers (used by the register grids for the insured-name avatar chip) ──
const AVATAR_COLORS = ['#1a3b6b', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#dc2626'];

export function avatarColor(name: string) {
  const seed = name ? name.charCodeAt(0) : 0;
  return AVATAR_COLORS[seed % AVATAR_COLORS.length];
}

export function initials(name: string) {
  return name.split(' ').filter(Boolean).map(word => word[0]).join('').slice(0, 2).toUpperCase();
}

// ─── Wizard sidebar (used by NewSubmission) ──────────────────────────────────
type StepStatus = 'done' | 'active' | 'pending';

interface WizardSidebarProps {
  submissionId: string;
  status: string;
  currentStep: number;
  onStepClick: (n: number) => void;
  screenCode?: string;
  recordLabel?: string;
}

export function WizardSidebar({ submissionId, status, currentStep, onStepClick, screenCode = '', recordLabel = 'Submission' }: WizardSidebarProps) {
  const normalizedScreenCode = String(screenCode).toUpperCase();
  const isEndorsement = normalizedScreenCode.startsWith('ENDORSEMENT');
  const isRenewal = normalizedScreenCode.startsWith('RENEWAL');
  const isPolicy = normalizedScreenCode.startsWith('POLICY');
  const showLimits = !isEndorsement && !isRenewal;
  const showUWSpecificChange = isRenewal;
  const orderedSteps = [
    0,
    1,
    2,
    ...(showLimits ? [3] : []),
    4,
    ...(showUWSpecificChange ? [8] : []),
    5,
    6,
    7,
  ];
  const currentIndex = orderedSteps.indexOf(currentStep);
  const currentStatus = status || 'Draft';

  const stepStatus = (step: number): StepStatus => {
    if (step === currentStep) return 'active';
    const index = orderedSteps.indexOf(step);
    if (index === -1 || currentIndex === -1) return step < currentStep ? 'done' : 'pending';
    return index < currentIndex ? 'done' : 'pending';
  };

  function StepCircle({ state }: { state: StepStatus }) {
    return <div className={`step-circle ${state}`}>{state === 'done' && <span>&#10003;</span>}</div>;
  }

  const mainSteps = [{ n: 0, label: 'Policy Information' }];
  const riskSubSteps = [
    { n: 1, label: 'Location' },
    { n: 2, label: 'Risk Information' },
    ...(showLimits ? [{ n: 3, label: 'Limits & Coverages' }] : []),
    { n: 4, label: 'Plans Overview' },
    ...(showUWSpecificChange ? [{ n: 8, label: 'UW Specific Change' }] : []),
  ];
  const lateSteps = [
    { n: 5, label: 'Quote Review' },
    { n: 6, label: 'Finalize Quote' },
    { n: 7, label: 'Documents' },
  ];
  const riskState: StepStatus = riskSubSteps.some(step => step.n === currentStep)
    ? 'active'
    : riskSubSteps.every(step => stepStatus(step.n) === 'done')
      ? 'done'
      : 'pending';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        {recordLabel}
        <button className="sidebar-toggle" type="button">&#8801;</button>
      </div>
      <div className="submission-sidebar">
        <div className="submission-id-box">{isPolicy ? 'Policy ID' : 'ID'} - {submissionId}</div>
        <div className="submission-status">
          Status: <span className={`badge badge-${currentStatus.toLowerCase().replace(/\s+/g, '-')}`}><span className="badge-dot" />{currentStatus}</span>
        </div>

        <div className="step-list">
          {mainSteps.map(step => (
            <div key={step.n} onClick={() => onStepClick(step.n)}>
              <div className="step-item">
                <StepCircle state={stepStatus(step.n)} />
                <span className={`step-label ${stepStatus(step.n)}`}>{step.label}</span>
              </div>
              <div className="step-connector dashed" />
            </div>
          ))}

          <div className="step-item" style={{ cursor: 'default' }}>
            <StepCircle state={riskState} />
            <span className={`step-label ${riskState === 'active' ? 'active' : riskState === 'done' ? 'done' : ''}`}>Risk</span>
          </div>

          {riskSubSteps.map((step, index) => (
            <div key={step.n} onClick={() => onStepClick(step.n)}>
              <div className="step-item" style={{ paddingLeft: 32 }}>
                <StepCircle state={stepStatus(step.n)} />
                <span className={`step-label ${stepStatus(step.n)}`}>{step.label}</span>
              </div>
              {index < riskSubSteps.length - 1 && <div className="step-connector dashed" style={{ marginLeft: 40 }} />}
            </div>
          ))}
          <div className="step-connector dashed" />

          {lateSteps.map(step => (
            <div key={step.n} onClick={() => onStepClick(step.n)}>
              <div className="step-item">
                <StepCircle state={stepStatus(step.n)} />
                <span className={`step-label ${stepStatus(step.n)}`}>{step.label}</span>
              </div>
              {step.n < 7 && <div className="step-connector dashed" />}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
