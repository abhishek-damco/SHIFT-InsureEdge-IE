// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Producer logins may only use Dashboard, Quotes & Policies and Claims (QA D1-25).
// The backend enforces this too (ProducerModuleRestrictionFilter); this hook drives the UI.
import { useEffect, useState } from 'react';
import { authApi } from '../api/auth';

// Path prefixes a producer may open. My Profile is account self-service, not a module.
export const PRODUCER_PATHS = ['/dashboard', '/quotes-policies', '/claims', '/my-profile'];

export const isProducerPath = (pathname: string) =>
  pathname === '/' || PRODUCER_PATHS.some(p => pathname === p || pathname.startsWith(`${p}/`));

// One request per page load, shared by every caller.
let cached: Promise<boolean> | null = null;
const fetchIsProducer = () => (cached ??= authApi.getMyProducer().then(r => r.producer != null).catch(() => false));

/** null while loading, then true for a Producer login. */
export function useIsProducer(): boolean | null {
  const [isProducer, setIsProducer] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    fetchIsProducer().then(v => { if (alive) setIsProducer(v); });
    return () => { alive = false; };
  }, []);
  return isProducer;
}
