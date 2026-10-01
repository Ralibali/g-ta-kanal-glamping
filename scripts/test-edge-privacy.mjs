import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../package.json', import.meta.url));
const ts = require('typescript');
const root = new URL('../supabase/functions/', import.meta.url);
const environment = { SUPABASE_URL: 'https://example.test', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'secret' };
globalThis.Deno = { env: { get: key => environment[key] }, serve: fn => { globalThis.handler = fn; } };
let user = null, role = null, getUserCalls = 0;
globalThis.mockCreateClient = () => ({ auth: { getUser: async () => { getUserCalls++; return { data: { user }, error: null }; } }, from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: role, error: null }) }) }) }) }) });
async function load(path, transform = s => s) {
  let source = await readFile(new URL(path, root), 'utf8');
  source = transform(source);
  const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  return import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
}
const { requireAdminOrService } = await load('_shared/require-admin.ts', s => s.replace(/import \{ createClient \} from [^;]+;/, 'const createClient = globalThis.mockCreateClient;'));
const request = token => new Request('https://example.test', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {} });
assert.equal((await requireAdminOrService(request(), {})).status, 401);
assert.equal((await requireAdminOrService(request('anon'), {})).status, 401);
assert.equal((await requireAdminOrService(request('fake-service-jwt'), {})).status, 401);
user = { id: 'user', is_anonymous: true }; role = { role: 'admin' };
assert.equal((await requireAdminOrService(request('anonymous-user'), {})).status, 401);
user = { id: 'user', user_metadata: { role: 'admin' } }; role = null;
assert.equal((await requireAdminOrService(request('user-token'), {})).status, 403);
role = { role: 'admin' };
assert.equal(await requireAdminOrService(request('admin-token'), {}), null);
const previousCalls = getUserCalls;
assert.equal(await requireAdminOrService(request('secret'), {}), null);
assert.equal(getUserCalls, previousCalls);
environment.SUPABASE_SERVICE_ROLE_KEY = undefined;
assert.equal((await requireAdminOrService(request('secret'), {})).status, 503);
environment.SUPABASE_SERVICE_ROLE_KEY = 'secret';
for (const name of ['provision-team', 'provision-breakfast', 'send-payslip-melvin', 'test-sms-now', 'send-tent-ready-now', 'test-prearrival-sms']) {
  await load(`${name}/index.ts`);
  const response = await globalThis.handler(request('anon'));
  assert.equal(response.status, 410);
  assert.deepEqual(await response.json(), { error: 'endpoint_retired' });
  assert.equal((await globalThis.handler(new Request('https://example.test', { method: 'OPTIONS' }))).status, 200);
}
for (const name of ['preview-prearrival', 'send-prearrival-batch', 'swish-payment-reminders', 'send-transactional-email']) {
  const source = await readFile(new URL(`${name}/index.ts`, root), 'utf8');
  const guard = source.indexOf('await requireAdminOrService(req, corsHeaders)');
  assert.ok(guard > 0, `${name} has authorization`);
  assert.ok(guard < source.indexOf('const supabase', source.indexOf('Deno.serve')), `${name} authorizes before its privileged client`);
}
console.log('Privacy edge checks passed: deny unknown/public/unprivileged callers, allow verified admins/server, retired endpoints cannot send or reset anything.');
