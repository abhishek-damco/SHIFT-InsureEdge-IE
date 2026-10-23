import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { claimsApi } from '../api/claims';

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ initials, color = '#0B5AA0', size = 30 }: { initials: string; color?: string; size?: number }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, borderRadius: '50%',
      background: color, color: '#fff',
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
      letterSpacing: 0.5,
    }}>
      {initials}
    </span>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, marginBottom: 16, overflow: 'hidden' }}>
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{title}</span>
      </div>
      <div style={{ padding: '20px', background: '#fff' }}>{children}</div>
    </div>
  );
}

// ─── Field (label + value) ────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#111827', fontWeight: 400, wordBreak: 'break-word' }}>
        {value ?? '-'}
      </span>
    </div>
  );
}

// ─── 4-column grid row ────────────────────────────────────────────────────────

function Row4({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px 24px', marginBottom: 20 }}>
      {children}
    </div>
  );
}

function Row3({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px 24px', marginBottom: 20 }}>
      {children}
    </div>
  );
}

function Row2({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px 24px', marginBottom: 20 }}>
      {children}
    </div>
  );
}

// ─── Actor field (avatar + name) ──────────────────────────────────────────────

function ActorField({ label, name, initials }: { label: string; name: string; initials: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>{label}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <Avatar initials={initials} color="#0B5AA0" size={28} />
        <span style={{ fontSize: 13, color: '#111827' }}>{name}</span>
      </span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ClaimsAuthorityViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['claims-authority-detail', id],
    queryFn: () => claimsApi.getAuthorityDetail(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#94a3b8', fontSize: 14 }}>
        Loading...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#ef4444', fontSize: 14 }}>
        Authority record not found.
      </div>
    );
  }

  const fmtLimit = (n: number) =>
    n === 0 ? '-' : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div style={{ padding: '16px 20px 80px', background: '#f8fafc', minHeight: '100%' }}>
      {/* Breadcrumb + Title */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Claims / Claims Authority</div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#111827' }}>Claim Authority</h1>
      </div>

      {/* ── UserDetails ── */}
      <Section title="UserDetails">
        {/* Row 1: User ID | First Name | Middle Name | Last Name */}
        <Row4>
          <Field label="User ID" value={data.userId} />
          <Field label="First Name" value={data.firstName} />
          <Field label="Middle Name / Initial" value={data.middleName || '-'} />
          <Field label="Last Name" value={data.lastName} />
        </Row4>

        {/* Row 2: Department | Designation | Authority Status */}
        <Row3>
          <Field label="Department" value={data.department} />
          <Field label="Designation" value={data.designation} />
          <Field
            label="Authority Status"
            value={
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                background: data.authorityStatus === 'Active' ? '#d7f7e4' : '#fde8e8',
                color: data.authorityStatus === 'Active' ? '#006b3c' : '#c62828',
                border: `1px solid ${data.authorityStatus === 'Active' ? '#008c55' : '#f87171'}`,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: data.authorityStatus === 'Active' ? '#009765' : '#c62828' }} />
                {data.authorityStatus}
              </span>
            }
          />
        </Row3>

        {/* Row 3: Insurance Type | Approved LOB | Currency | Reserve Limit */}
        <Row4>
          <Field label="Insurance Type" value={data.insuranceType} />
          <Field label="Approved LOB" value={data.approvedLob} />
          <Field label="Currency" value={data.currency} />
          <Field label="Reserve Limit" value={fmtLimit(data.reserveLimit)} />
        </Row4>

        {/* Row 4: Indemnity | Fee | Ex Gratia | Payment Method Restrictions */}
        <Row4>
          <Field label="Indemnity Payment Limit" value={fmtLimit(data.indemnityPaymentLimit)} />
          <Field label="Fee Payment Limit" value={fmtLimit(data.feePaymentLimit)} />
          <Field label="Ex Gratia Payment Limit" value={fmtLimit(data.exGratiaPaymentLimit)} />
          <Field label="Payment Method Restrictions" value={data.paymentMethodRestrictions} />
        </Row4>

        {/* Row 5: Date of Authority Assignment | Can Deny Worksheet */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px 24px' }}>
          <Field label="Date of Authority Assignment" value={data.dateOfAuthorityAssignment} />
          <Field label="Can Deny Worksheet" value={data.canDenyWorksheet ? 'Yes' : 'No'} />
        </div>
      </Section>

      {/* ── Jurisdiction ── */}
      <Section title="Jurisdiction">
        <Row2>
          <Field label="Country" value={data.jurisdictionCountry} />
          <Field label="State" value={data.jurisdictionStates} />
        </Row2>
      </Section>

      {/* ── Approver Details ── */}
      <Section title="Approver Details">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px 24px' }}>
          <ActorField
            label="Authority Updated By"
            name={data.updatedByName}
            initials={data.updatedByInitials}
          />
          <ActorField
            label="Authority Approved By"
            name={data.approvedByName}
            initials={data.approvedByInitials}
          />
        </div>
      </Section>

      {/* ── Audit & Compliance ── */}
      <Section title="Audit & Compliance">
        <Row4>
          <ActorField
            label="Created By"
            name={data.createdByName}
            initials={data.createdByInitials}
          />
          <ActorField
            label="Updated By"
            name={data.updatedByName}
            initials={data.updatedByInitials}
          />
          <Field label="Updated date" value={data.updatedDate} />
          <Field label="Action performed" value={data.actionPerformed} />
        </Row4>
      </Section>

      {/* ── Back button ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button
          onClick={() => navigate('/claims/authority')}
          style={{
            padding: '8px 24px', background: '#fff', color: '#0B5AA0',
            border: '1px solid #0B5AA0', borderRadius: 5,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Back
        </button>
      </div>
    </div>
  );
}
