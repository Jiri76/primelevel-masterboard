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
//   ownerReal()      a pretend owner ("pretend key"), but every table read
//                    goes to the REAL database with the public key -- so the
//                    Insider Edge layout guard still measures a real report.
//                    (Once the reports table is locked to the owner, this
//                    switches to a saved sample report: plan step "guards
//                    option A".)
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

// The real library comes from a different address (jsdelivr), so this
// stand-in's own import is not swapped for the stand-in again.
export const ownerReal = () => `
import { createClient as realCreateClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const session = ${OWNER}; // no access_token: table reads use the public key, exactly like a visitor
export const createClient = (url, key, options) => {
  const client = realCreateClient(url, key, options);
  client.auth.getSession = async () => ({ data: { session } });
  client.auth.onAuthStateChange = (cb) => { setTimeout(() => cb('INITIAL_SESSION', session), 0); return { data: { subscription: { unsubscribe() {} } } }; };
  client.auth.signOut = async () => ({ error: null });
  const realRpc = client.rpc.bind(client);
  client.rpc = (name, ...rest) => (name === 'is_email_report_viewer' ? Promise.resolve({ data: true, error: null }) : realRpc(name, ...rest));
  return client;
};`;

export async function useStandIn(page, body) {
  await page.route(SUPABASE_JS, (route) => route.fulfill({
    status: 200,
    contentType: 'application/javascript',
    headers: { 'Access-Control-Allow-Origin': '*' },
    body,
  }));
}
