// Test Wrangler's actual production output, not only individual source handlers.
import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../.wrangler/deploy-check/index.js';
import { issueMcpKey } from '../../src/service/mcp-key-service.js';

function fixture() {
    const records = new Map();
    const queries = [];
    const kv = {
        async get(key, options) {
            const value = records.get(key);
            return value ? options?.type === 'json' ? JSON.parse(value) : value : null;
        },
        async put(key, value) { records.set(key, value); }
    };
    const db = {
        prepare(sql) {
            return { bind(...args) {
                queries.push({ sql, args });
                return {
                    first: async () => ({ userId: 7, email: 'owner@example.com' }),
                    all: async () => ({ results: [] })
                };
            } };
        }
    };
    const request = (path, method = 'GET', body, key) => worker.fetch(new Request(`https://example.com${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {})
    }), { kv, db, domain: ['example.com'] }, { waitUntil() {} });
    return { kv, queries, request };
}

test('deployment bundle rejects unauthenticated MCP discovery and calls', async () => {
    const { request, queries } = fixture();
    for (const path of ['/mcp', '/api/mcp']) {
        assert.equal((await request(path)).status, 401);
        for (const method of ['initialize', 'tools/list', 'tools/call']) {
            const response = await request(path, 'POST', {
                jsonrpc: '2.0', id: 1, method,
                params: { name: 'search_emails', arguments: { query: 'private' } }
            });
            assert.equal(response.status, 401);
        }
    }
    assert.deepEqual(queries, [], 'Rejected MCP requests must not query user or email data');
});

test('deployment bundle enforces tool scope, owner-bound searches and rotated keys', async () => {
    const { kv, queries, request } = fixture();
    const consent = scopes => ({ name: 'Bundle test', scopes, expiration: '90d', confirmAuthorization: true });
    const key = await issueMcpKey(kv, 7, consent(['search_emails']));
    const rpc = (method, params, token = key.fullKey) => request('/mcp', 'POST', { jsonrpc: '2.0', id: 1, method, params }, token);
    const discovery = await (await rpc('tools/list')).json();
    assert.deepEqual(discovery.result.tools.map(tool => tool.name), ['search_emails']);
    const rejected = await (await rpc('tools/call', { name: 'create_event' })).json();
    assert.equal(rejected.error.code, -32602);
    await rpc('tools/call', { name: 'search_emails', arguments: { query: 'private', userId: 999 } });
    const search = queries.find(query => query.sql.includes('FROM email'));
    assert.ok(search?.sql.includes('WHERE user_id = ? AND is_del = 0 AND ('), 'Search must scope both subject and body matches to the owner');
    assert.deepEqual(search.args, [7, '%private%', '%private%']);
    const replacement = await issueMcpKey(kv, 7, consent(['list_mailboxes']), key.id);
    assert.equal((await rpc('tools/list')).status, 401);
    assert.deepEqual((await (await rpc('tools/list', {}, replacement.fullKey)).json()).result.tools.map(tool => tool.name), ['list_mailboxes']);
});
