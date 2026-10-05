// Supabase stand-ins for the guards (one place, used by every guard).
//
// Since 2026-10-02 every private page sits behind door.js: anyone not signed
// in as the owner is sent to the Masterboard front door. The guards' own
// throwaway browser is never signed in, so inside it the Supabase library
// (loaded from esm.sh) is swapped for one of these stand-ins:
//
//   signedOut()      nobody is signed in: the front door's own screens.
//   ownerFake(rows)  a pretend owner with pretend tables ({ table: rows } or
//                    { table: 'error' }); nothing leaves the browser.
// (ownerReal(), which read the REAL reports with the public key, was removed
// on 2026-10-05 when the reports were locked to the owner: the guards now use
// made-up sample reports, tools/fixtures/insider-edge-samples.mjs.)
//
// The owner check (is_email_report_viewer) always answers "yes, the owner"
// inside the stand-in. No real account and no password is involved.
export const SUPABASE_JS = /esm\.sh\/@supabase\/supabase-js/;

const OWNER = "{ user: { id: 'guard-owner', email: 'guard@example.com' } }";

export const signedOut = () => `
export const createClient = () => ({
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: (cb) => { setTimeout(() => cb('INITIAL_SESSION', null), 0); return { data: { subscription: { unsubscribe() {} } } }; },
    signInWithOtp: async () => ({ error: null }),
    signOut: async () => ({ error: null }),
  },
  rpc: async () => ({ data: false, error: null }),
  from: () => { throw new Error('guard: a signed-out page must not read any table'); },
});`;

export const ownerFake = (rows = {}) => `
const rows = ${JSON.stringify(rows)};
const session = ${OWNER};
const chain = (t) => {
  const answer = () => rows[t] === 'error' ? { data: null, error: { message: 'guard stand-in' } } : { data: rows[t] || [], error: null };
  const q = { select: () => q, eq: () => q, order: () => q, limit: () => q, abortSignal: () => q, single: async () => answer(),
    then: (ok, bad) => Promise.resolve(answer()).then(ok, bad) };
  return q;
};
export const createClient = () => ({
  auth: {
    getSession: async () => ({ data: { session } }),
    onAuthStateChange: (cb) => { setTimeout(() => cb('INITIAL_SESSION', session), 0); return { data: { subscription: { unsubscribe() {} } } }; },
    signOut: async () => ({ error: null }),
  },
  rpc: async (name) => (name === 'is_email_report_viewer' ? { data: true, error: null } : { data: null, error: { message: 'guard stand-in' } }),
  from: (t) => chain(t),
});`;

export async function useStandIn(page, body) {
  await page.route(SUPABASE_JS, (route) => route.fulfill({
    status: 200,
    contentType: 'application/javascript',
    headers: { 'Access-Control-Allow-Origin': '*' },
    body,
  }));
}
