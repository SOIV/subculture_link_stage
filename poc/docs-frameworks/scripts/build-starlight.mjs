import { cp, mkdir, readFile, writeFile, realpath, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const stageRoot = process.env.POC_STAGE_DIR ?? path.join(os.tmpdir(), 'scls-docs-poc-starlight-build');
const stageApp = path.join(stageRoot, 'apps/starlight');
await mkdir(stageApp, { recursive: true });
await cp(path.join(root, 'apps/starlight'), stageApp, { recursive: true, filter: source => !['node_modules', '.astro', 'dist'].includes(path.basename(source)) });
await cp(path.join(root, 'fixtures'), path.join(stageRoot, 'fixtures'), { recursive: true });
const modules = await realpath(path.join(root, 'node_modules'));
const hash = createHash('sha256').update(await readFile(path.join(root, 'package-lock.json'))).digest('hex');
const stamp = path.join(stageRoot, 'dependencies.sha256');
if (await readFile(stamp, 'utf8').catch(() => '') !== hash) {
  const destination = path.join(stageApp, 'node_modules');
  await rm(destination, { recursive: true, force: true });
  try {
    if (process.platform !== 'linux') throw new Error('Use portable copy');
    await promisify(execFile)('cp', ['-al', modules, destination]);
  } catch {
    await rm(destination, { recursive: true, force: true });
    await cp(modules, destination, { recursive: true });
  }
  await writeFile(stamp, hash);
}
const started = Date.now();
const child = spawn(process.execPath, [path.join(stageApp, 'node_modules/astro/bin/astro.mjs'), 'build'], {
  cwd: stageApp, env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' }, stdio: 'inherit',
});
const code = await new Promise(resolve => child.once('exit', resolve));
if (code !== 0) process.exit(code ?? 1);
const destination = path.join(root, 'apps/starlight/dist');
await rm(destination, { recursive: true, force: true });
await cp(path.join(stageApp, 'dist'), destination, { recursive: true });
await mkdir(path.join(root, 'artifacts'), { recursive: true });
await writeFile(path.join(root, 'artifacts/starlight-build.json'), JSON.stringify({ milliseconds: Date.now() - started, stagedBuild: true, reason: 'Astro dependency symlinks and mounted-drive path isolation', node: process.version }, null, 2));
