import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('production deployment compiles reviewed Worker source', () => {
    const config = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');
    const topLevel = config.split(/^\s*\[/m)[0];
    assert.match(topLevel, /^main\s*=\s*"src\/index\.js"\s*$/m);
    assert.doesNotMatch(topLevel, /^no_bundle\s*=\s*true\b/m);
});
