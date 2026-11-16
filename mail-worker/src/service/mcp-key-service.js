import { MCP_TOOLS } from '../utils/mcp-tools.js';

const names = new Set(MCP_TOOLS.map(tool => tool.name));
function fail(message, code = 400) {
    const error = new Error(message);
    error.name = 'BizError';
    error.code = code;
    throw error;
}
const prefix = userId => `mcp:key:${userId}:`;
const recordKey = (userId, id) => prefix(userId) + id;
async function digest(value) {
    return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), b => b.toString(16).padStart(2, '0')).join('');
}
function publicKey({ tokenHash, ...item }) { return item; }
export async function listMcpKeys(kv, userId) {
    const items = [];
    let cursor;
    do {
        const page = await kv.list({ prefix: prefix(userId), cursor });
        for (const key of page.keys) {
            const item = await kv.get(key.name, { type: 'json' });
            if (item) items.push(publicKey(item));
        }
        cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
    return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function issueMcpKey(kv, userId, body, existingId) {
    const id = existingId ?? crypto.randomUUID();
    if (!body || typeof body.name !== 'string' || !body.name.trim() || body.name.length > 100) fail('Enter a key name (up to 100 characters).');
    if (!Array.isArray(body.scopes) || !body.scopes.length || body.scopes.some(name => !names.has(name))) fail('Select at least one valid MCP tool. Broad scopes are no longer accepted.');
    const durations = { '30d': 30, '90d': 90, '1y': 365, never: null };
    const expiration = body.expiration ?? '90d';
    if (!Object.hasOwn(durations, expiration)) fail('Invalid expiration.');
    if (body.confirmAuthorization !== true) fail('Explicit tool authorization is required.');
    const key = recordKey(userId, id);
    // Caller supplies an ID only for reauthorization; a foreign ID has no owned record.
    if (existingId !== undefined && !await kv.get(key)) fail('Key not found.', 404);
    const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
    const fullKey = `gbk_live_${userId}.${id}.${secret}`;
    const item = { id, userId, name: body.name.trim(), scopes: [...new Set(body.scopes)], expiration,
        prefix: `gbk_live_…${secret.slice(-6)}`, tokenHash: await digest(fullKey),
        createdAt: new Date().toISOString(), expiresAt: durations[expiration] ? Date.now() + durations[expiration] * 86400000 : null };
    await kv.put(key, JSON.stringify(item));
    return { ...publicKey(item), fullKey };
}
export async function revokeMcpKey(kv, userId, id) {
    const key = recordKey(userId, id);
    if (!await kv.get(key)) fail('Key not found.', 404);
    await kv.delete(key);
}
export async function authenticateMcpKey(kv, authorization) {
    const match = /^Bearer (gbk_live_(\d+)\.([a-f0-9-]{36})\.[a-f0-9]{64})$/.exec(authorization || '');
    if (!match) return null;
    const item = await kv.get(recordKey(match[2], match[3]), { type: 'json' });
    if (!item || String(item.userId) !== match[2] || item.tokenHash !== await digest(match[1]) || (item.expiresAt !== null && !(item.expiresAt > Date.now())) || !Array.isArray(item.scopes) || !item.scopes.length || item.scopes.some(name => !names.has(name))) return null;
    return item;
}
