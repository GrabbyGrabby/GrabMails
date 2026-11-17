import test from 'node:test';
import assert from 'node:assert/strict';
import { Hono } from 'hono';
import { issueMcpKey, listMcpKeys, authenticateMcpKey, revokeMcpKey } from '../src/service/mcp-key-service.js';
import { registerMcpRoutes } from '../src/service/mcp-routes.js';
import { MCP_TOOLS } from '../src/utils/mcp-tools.js';
import { MCP_TOOLS as uiTools } from '../../mail-vue/src/utils/mcp-tools.js';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

// CI reruns these HTTP assertions against Wrangler's actual deployment output.
const deployedWorker = process.env.MCP_WORKER_BUNDLE
    ? (await import(pathToFileURL(resolve(process.env.MCP_WORKER_BUNDLE)).href)).default
    : null;

function fixture() {
    const records = new Map();
    const kv = {
        async get(key, options) { const v = records.get(key); return v ? options?.type === 'json' ? JSON.parse(v) : v : null; },
        async put(key, value) { records.set(key, value); },
        async delete(key) { records.delete(key); },
        async list({ prefix }) { return { keys: [...records.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }; }
    };
    return { records, kv };
}
const consent = (scopes = ['list_mailboxes']) => ({ name: 'My agent', scopes, expiration: '90d', confirmAuthorization: true });

test('requires explicit, nonempty, known individual tools', async () => {
    const { kv } = fixture();
    for (const body of [{}, consent([]), consent(['mcp:read']), consent(['unknown']), { ...consent(), confirmAuthorization: false }]) {
        await assert.rejects(issueMcpKey(kv, 1, body));
    }
    assert.deepEqual(uiTools, MCP_TOOLS);
});

test('keys are owned, stored hashed, expiring, revocable, and rotated on reauthorization', async () => {
    const { kv, records } = fixture();
    const first = await issueMcpKey(kv, 1, consent());
    assert.ok(await authenticateMcpKey(kv, `Bearer ${first.fullKey}`));
    assert.ok(!JSON.stringify([...records.values()]).includes(first.fullKey));
    assert.equal((await listMcpKeys(kv, 1))[0].fullKey, undefined);
    assert.equal((await listMcpKeys(kv, 1))[0].tokenHash, undefined);
    assert.deepEqual(await listMcpKeys(kv, 2), []);
    await assert.rejects(issueMcpKey(kv, 2, consent(['create_event']), first.id));
    await assert.rejects(revokeMcpKey(kv, 2, first.id));
    const second = await issueMcpKey(kv, 1, consent(['list_mailboxes', 'create_event']), first.id);
    assert.equal(await authenticateMcpKey(kv, `Bearer ${first.fullKey}`), null);
    assert.deepEqual((await authenticateMcpKey(kv, `Bearer ${second.fullKey}`)).scopes, ['list_mailboxes', 'create_event']);
    const recordName = [...records.keys()][0];
    const record = JSON.parse(records.get(recordName));
    records.set(recordName, JSON.stringify({ ...record, expiresAt: Date.now() - 1 }));
    assert.equal(await authenticateMcpKey(kv, `Bearer ${second.fullKey}`), null);
    records.set(recordName, JSON.stringify(record));
    await revokeMcpKey(kv, 1, first.id);
    assert.equal(await authenticateMcpKey(kv, `Bearer ${second.fullKey}`), null);
    assert.equal(await authenticateMcpKey(kv, 'Bearer gbk_live_legacy'), null);
});

test('MCP HTTP authentication, filtered discovery, call enforcement, and reauthorization', async () => {
    const { kv } = fixture();
    let queries = [];
    const db = { prepare(sql) { return { bind(...args) { queries.push({ sql, args }); return { first: async () => ({ userId: 1, email: 'owner@example.com' }), all: async () => ({ results: [] }) }; } }; } };
    const app = deployedWorker ? {
        request(path, init, env) {
            return deployedWorker.fetch(new Request(`https://example.com${path}`, init), env, { waitUntil() {} });
        }
    } : new Hono();
    if (!deployedWorker) registerMcpRoutes(app);
    let key = await issueMcpKey(kv, 1, consent(['search_emails']));
    const request = (method, params, token = key.fullKey) => app.request('/mcp', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }, { kv, db });
    assert.equal((await request('tools/list', {}, 'bad')).status, 401);
    assert.equal((await app.request('/mcp', {}, { kv, db })).status, 401);
    assert.equal((await app.request('/mcp', { method: 'POST', body: JSON.stringify({ method: 'tools/list' }) }, { kv, db })).status, 401);
    assert.equal(queries.length, 0, 'unauthenticated requests must not query the database');
    assert.deepEqual((await (await request('tools/list')).json()).result.tools.map(t => t.name), ['search_emails']);
    const get = await app.request('/mcp', { headers: { Authorization: `Bearer ${key.fullKey}` } }, { kv, db });
    assert.deepEqual((await get.json()).tools, ['search_emails']);
    assert.equal((await (await request('tools/call', { name: 'create_event', scopes: ['create_event'] })).json()).error.code, -32602);
    await request('tools/call', { name: 'search_emails', arguments: { query: 'hello', userId: 2 } });
    const search = queries.find(q => q.sql.includes('FROM email'));
    assert.ok(search.sql.includes('user_id = ?'));
    assert.deepEqual(search.args, [1, '%hello%', '%hello%']);
    const old = key.fullKey;
    key = await issueMcpKey(kv, 1, consent(['list_mailboxes']), key.id);
    assert.equal((await request('tools/list', {}, old)).status, 401);
    assert.deepEqual((await (await request('tools/list')).json()).result.tools.map(t => t.name), ['list_mailboxes']);
    assert.equal((await (await request('tools/call', { name: 'search_emails' })).json()).error.code, -32602);
    assert.ok((await (await request('tools/call', { name: 'list_mailboxes' })).json()).result);
});
