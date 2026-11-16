import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('legacy hardening utility fails without build dependencies even with prebuilt output and SKIP_BUILD', () => {
    const root = mkdtempSync(join(tmpdir(), 'grabmails-stale-build-'));
    try {
        const worker = join(root, 'mail-worker');
        for (const directory of ['scripts', 'dist', 'dist-worker']) mkdirSync(join(worker, directory), { recursive: true });
        copyFileSync(new URL('../scripts/build-harden.mjs', import.meta.url), join(worker, 'scripts/build-harden.mjs'));
        writeFileSync(join(worker, 'dist/index.html'), 'old frontend');
        writeFileSync(join(worker, 'dist-worker/index.js'), 'old worker');
        const result = spawnSync(process.execPath, ['scripts/build-harden.mjs'], {
            cwd: worker, encoding: 'utf8', env: { ...process.env, SKIP_BUILD: '1' }, timeout: 15000
        });
        assert.equal(result.error, undefined);
        assert.equal(result.status, 1);
        assert.match(result.stderr, /Cannot build: install mail-vue dependencies and pnpm first/);
        assert.equal(readFileSync(join(worker, 'dist-worker/index.js'), 'utf8'), 'old worker');
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
