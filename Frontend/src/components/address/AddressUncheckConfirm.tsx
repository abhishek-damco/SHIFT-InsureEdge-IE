import { ADDRESS_UNCHECK_MSG } from '../../utils/fieldValidation';

// QA UM-13 / D1-02: confirmation before "Enter Address Manually" is unchecked.
export function AddressUncheckConfirm({ onCancel, onContinue }: { onCancel: () => void; onContinue: () => void }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-sm" role="alertdialog" aria-modal="true" aria-labelledby="address-uncheck-msg" onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <div id="address-uncheck-msg" style={{ fontWeight: 600, fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
            {ADDRESS_UNCHECK_MSG}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button type="button" className="btn btn-outline" autoFocus onClick={onCancel}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={onContinue}>Continue</button>
          </div>
        </div>
      </div>
    </div>
  );
}
