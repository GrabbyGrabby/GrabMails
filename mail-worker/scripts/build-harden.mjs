import { randomBytes } from 'node:crypto';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, copyFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workerDir = resolve(__dirname, '..');
const repoDir = resolve(workerDir, '..');
const vueDir = resolve(repoDir, 'mail-vue');
const distDir = resolve(workerDir, 'dist');
const distWorkerDir = resolve(workerDir, 'dist-worker');
const distWorkerEntry = resolve(distWorkerDir, 'index.js');
const tmpDir = resolve(workerDir, '.bla-tmp');

const require = createRequire(import.meta.url);

function findEsbuild() {
	try {
		return require(require.resolve('esbuild', { paths: [workerDir, vueDir, repoDir] }));
	} catch {
		const pnpmDir = resolve(workerDir, 'node_modules', '.pnpm');
		if (existsSync(pnpmDir)) {
			for (const entry of readdirSync(pnpmDir)) {
				if (entry.startsWith('esbuild@')) {
					const cand = resolve(pnpmDir, entry, 'node_modules', 'esbuild', 'lib', 'main.js');
					if (existsSync(cand)) return require(cand);
				}
			}
		}
		throw new Error('Could not locate esbuild module in node_modules');
	}
}

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

const forceBuild = process.argv.includes('--force') || process.env.FORCE_BUILD === '1';
const vueNodeModules = resolve(vueDir, 'node_modules');
const hasPrebuilt = existsSync(resolve(distDir, 'index.html')) && existsSync(distWorkerEntry);

if (!forceBuild && hasPrebuilt && (!existsSync(vueNodeModules) || !hasPnpm())) {
	console.log('[build-harden] Pre-built hardened dist & dist-worker detected; skipping rebuild.');
	process.exit(0);
}

if (!existsSync(vueNodeModules) || !hasPnpm()) {
	throw new Error('Cannot build: mail-vue dependencies or pnpm are missing and no pre-built artifacts exist.');
}

rmSync(tmpDir, { recursive: true, force: true });
mkdirSync(tmpDir, { recursive: true });
mkdirSync(distWorkerDir, { recursive: true });

try {
	console.log('[build-harden] 1/4 Building frontend with Vite...');
	execSync('pnpm --prefix ../mail-vue install --frozen-lockfile && pnpm --prefix ../mail-vue run build', {
		cwd: workerDir,
		stdio: 'inherit'
	});

	const stageDir = resolve(tmpDir, 'frontend');
	const stageAssetsDir = resolve(stageDir, 'assets');
	mkdirSync(stageAssetsDir, { recursive: true });

	const distAssetsDir = resolve(distDir, 'assets');
	const firstPartyJs = readdirSync(distAssetsDir).filter(
		(name) => name.endsWith('.js') && !name.startsWith('vendor-')
	);

	for (const name of firstPartyJs) {
		copyFileSync(resolve(distAssetsDir, name), resolve(stageAssetsDir, name));
	}
	copyFileSync(resolve(distDir, 'index.html'), resolve(stageDir, 'index.html'));

	const seed = process.env.BLA_SEED || randomBytes(16).toString('hex');

	console.log(`[build-harden] 2/4 Hardening ${firstPartyJs.length} first-party JS chunks + index.html...`);
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

	console.log('[build-harden] 3/4 Bundling mail-worker/src into intermediate ESM...');
	const esbuild = findEsbuild();
	const workerIntermediate = resolve(tmpDir, 'worker-app.mjs');
	esbuild.buildSync({
		entryPoints: [resolve(workerDir, 'src', 'index.js')],
		bundle: true,
		format: 'esm',
		platform: 'neutral',
		packages: 'external',
		outfile: workerIntermediate
	});

	console.log('[build-harden] 4/4 Hardening Worker bundle -> dist-worker/index.js...');
	execSync(
		`npx --yes bla-agents@latest defend "${workerIntermediate}" --intensity balanced --allow-lane-independent --no-honey-maps --seed "${seed}" --output "${distWorkerEntry}"`,
		{ cwd: workerDir, stdio: 'inherit' }
	);

	checkSyntaxAsEsm(distWorkerEntry, resolve(tmpDir, 'worker-syntax-check.mjs'));
	const workerSrc = readFileSync(distWorkerEntry, 'utf8');
	if (!workerSrc.includes('import("cloudflare:email")') && !workerSrc.includes("import('cloudflare:email')")) {
		throw new Error('Dynamic import("cloudflare:email") was unexpectedly altered in dist-worker/index.js');
	}
	console.log('[build-harden] Verified Worker syntax and runtime invariants cleanly.');
} finally {
	rmSync(tmpDir, { recursive: true, force: true });
}
