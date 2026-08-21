import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useMatch } from 'react-router-dom';
import { billingApi } from '../../api/distribution';
import PolicyPaymentsPage from './PolicyPayments';
import MakePaymentPage from './MakePayment';

interface RecentActivityItem {
  id: number;
  record_id: number;
  activity_description: string;
  created_date_time: string;
  activity_type: string;
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: 'transform 0.15s', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function AlignJustifyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M8 6h12M8 12h12M8 18h12M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

export default function BillingManagementModule() {
  const [paymentsOpen, setPaymentsOpen] = useState(true);
  const [activity, setActivity] = useState<RecentActivityItem[]>([]);
  const isMakePayment = !!useMatch('/billing/make-payment/:id');

  const loadActivity = useCallback(() => {
    billingApi.getRecentActivity()
      .then(rows => setActivity(rows))
      .catch(() => {});
  }, []);

  useEffect(() => { loadActivity(); }, [loadActivity]);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* ── Inner white sidebar — hidden on Make Payment screen ── */}
      {!isMakePayment && (
        <aside style={{
          display: 'flex', flexDirection: 'column',
          background: '#fff', borderRight: '1px solid #e5e7eb',
          overflowY: 'auto', flexShrink: 0, width: 230, minWidth: 230,
        }}>
          {/* Module header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderBottom: '1px solid #e5e7eb', flexShrink: 0,
          }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#1e3a5f' }}>Billing Management</span>
            <button style={{ padding: 4, borderRadius: 4, background: 'none', color: '#9ca3af' }}>
              <AlignJustifyIcon />
            </button>
          </div>

          {/* Payments nav section */}
          <div style={{ flexShrink: 0 }}>
            <button
              onClick={() => setPaymentsOpen(o => !o)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 16px', fontSize: 13, color: '#2563eb',
                fontWeight: 500, background: 'none', textAlign: 'left',
                transition: 'background 0.15s',
              }}
            >
              <ChevronDownIcon open={paymentsOpen} />
              Payments
            </button>

            {paymentsOpen && (
              <div style={{ paddingBottom: 4, paddingLeft: 16, paddingRight: 16 }}>
                <div style={{
                  padding: '8px 12px', fontSize: 13, color: '#2563eb',
                  fontWeight: 500, background: '#eff6ff', borderRadius: 4, cursor: 'default',
                }}>
                  Policy Payments
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', marginTop: 4 }}>
            <div style={{
              padding: '10px 16px', fontSize: 13, fontWeight: 600, color: '#374151',
              borderTop: '1px solid #f3f4f6',
            }}>
              Recent Activity
            </div>

            {activity.length === 0 && (
              <p style={{ padding: '4px 16px', fontSize: 12, color: '#9ca3af' }}>No recent activity</p>
            )}

            {activity.map(item => (
              <div
                key={item.id}
                style={{
                  margin: '0 12px 8px', padding: '12px', border: '1px solid #e5e7eb',
                  borderRadius: 4, background: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#2563eb', marginBottom: 2 }}>
                    {item.activity_type}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4, wordBreak: 'break-word' }}>
                    {item.activity_description}
                  </div>
                </div>
                <span style={{ color: '#9ca3af', marginTop: 2, flexShrink: 0 }}><ChevronRightIcon /></span>
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* ── Main content area ── */}
      <div style={{ flex: 1, overflowY: 'auto', minWidth: 0, background: '#eef0f5' }}>
        <Routes>
          <Route index element={<PolicyPaymentsPage onPolicyViewed={loadActivity} />} />
          <Route path="make-payment/:id" element={<MakePaymentPage />} />
        </Routes>
      </div>
    </div>
  );
}
