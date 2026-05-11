/**
 * Centralized demo-mode configuration.
 * Every reference to the demo company UUID must come from here.
 */

export const DEMO_COMPANY_ID = '50707999-f033-41c4-91c9-989966311972';
export const DEMO_USER_ID = '4bb8066b-0807-4eb7-81a8-29436b6875ea';

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

/** Resolve the effective company id for data fetching. */
export function resolveCompanyId(authCompanyId: string | null | undefined): string | null {
  if (DEMO_MODE) return DEMO_COMPANY_ID;
  return authCompanyId ?? null;
}

/**
 * Runtime guard: refuse to enable demo mode on the real production host.
 * Called from main.tsx at boot so a misconfigured deploy throws loudly rather
 * than silently serving demo to real customers.
 */
export function assertDemoModeNotInProduction(): void {
  if (!DEMO_MODE) return;
  if (typeof window === 'undefined') return;
  if (!import.meta.env.PROD) return;

  const host = window.location.hostname;
  if (host === 'app.enregla.ec' || host === 'app.enregla.se') {
    throw new Error(
      `Refusing to boot: VITE_DEMO_MODE=true on production host ${host}. ` +
      `Demo mode must run on a separate subdomain.`
    );
  }
}
