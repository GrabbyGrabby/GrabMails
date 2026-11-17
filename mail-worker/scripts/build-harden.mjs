import { randomBytes } from 'node:crypto';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, copyFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workerDir = resolve(__dirname, '..');
const repoDir = resolve(workerDir, '..');
const vueDir = resolve(repoDir, 'mail-vue');
const distDir = resolve(workerDir, 'dist');
const tmpDir = resolve(workerDir, '.bla-tmp');

function hasPnpm() {
	try {
		execSync('pnpm --version', { stdio: 'ignore' });
		return true;
	} catch {
		return false;
	}
}

function checkSyntaxAsEsm(filePath, tempCheckPath) {
	copyFileSync(filePath, tempCheckPath);
	execSync(`"${process.execPath}" --check "${tempCheckPath}"`, { stdio: 'pipe' });
}

const vueNodeModules = resolve(vueDir, 'node_modules');
// This optional hardening utility must never silently reuse stale output.
if (!existsSync(vueNodeModules) || !hasPnpm()) {
    throw new Error('Cannot build: install mail-vue dependencies and pnpm first.');
}

rmSync(tmpDir, { recursive: true, force: true });
mkdirSync(tmpDir, { recursive: true });

try {
	console.log('[build-harden] 1/2 Building frontend with Vite...');
	execSync('pnpm --prefix ../mail-vue install --frozen-lockfile && pnpm --prefix ../mail-vue run build', {
		cwd: workerDir,
		stdio: 'inherit'
	});

	const stageDir = resolve(tmpDir, 'frontend');
	const stageAssetsDir = resolve(stageDir, 'assets');
	mkdirSync(stageAssetsDir, { recursive: true });

	const distAssetsDir = resolve(distDir, 'assets');
	const localePrefixes = [
		'ar-', 'bn-', 'de-', 'es-', 'fa-', 'fr-', 'gu-', 'ha-', 'hi-', 'id-', 'it-', 'ja-',
		'kn-', 'ko-', 'ml-', 'mr-', 'ms-', 'nl-', 'pa-', 'pl-', 'pt-BR-', 'pt-PT-', 'ru-',
		'si-', 'sw-', 'ta-', 'te-', 'th-', 'tr-', 'uk-', 'ur-', 'vi-', 'zh-', 'en-'
	];
	const firstPartyJs = readdirSync(distAssetsDir).filter(
		(name) => name.endsWith('.js') && !name.startsWith('vendor-') && !localePrefixes.some(prefix => name.startsWith(prefix))
	);

	for (const name of firstPartyJs) {
		copyFileSync(resolve(distAssetsDir, name), resolve(stageAssetsDir, name));
	}
	copyFileSync(resolve(distDir, 'index.html'), resolve(stageDir, 'index.html'));

	const seed = process.env.BLA_SEED || randomBytes(16).toString('hex');

	console.log(`[build-harden] 2/2 Hardening ${firstPartyJs.length} first-party JS chunks + index.html...`);
	execSync(
		`npx --yes bla-agents@latest harden "${stageDir}" --intensity balanced --allow-lane-independent --seed "${seed}"`,
		{ cwd: workerDir, stdio: 'inherit' }
	);

	const hardenedFrontendDir = resolve(stageDir, '.bla-hardened');
	const hardenedAssetsDir = resolve(hardenedFrontendDir, 'assets');
	const syntaxProbePath = resolve(tmpDir, 'syntax-check.mjs');

	for (const name of firstPartyJs) {
		const hardenedPath = resolve(hardenedAssetsDir, name);
		if (!existsSync(hardenedPath)) {
			throw new Error(`Missing hardened frontend chunk: ${name}`);
		}
		checkSyntaxAsEsm(hardenedPath, syntaxProbePath);
	}
	rmSync(syntaxProbePath, { force: true });

	for (const name of firstPartyJs) {
		copyFileSync(resolve(hardenedAssetsDir, name), resolve(distAssetsDir, name));
	}
	copyFileSync(resolve(hardenedFrontendDir, 'index.html'), resolve(distDir, 'index.html'));
	console.log(`[build-harden] Verified ESM syntax on ${firstPartyJs.length}/${firstPartyJs.length} hardened frontend chunks.`);

} finally {
	rmSync(tmpDir, { recursive: true, force: true });
}
