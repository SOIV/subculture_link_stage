import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const children = [
  ['scripts/fixture-server.mjs'],
  ['scripts/static-server.mjs', path.join(root, 'apps/starlight/dist'), '4321'],
  ['scripts/static-server.mjs', path.join(root, 'apps/fumadocs/out'), '4322'],
].map(args => spawn(process.execPath, args, { cwd: root, stdio: 'inherit' }));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { for (const child of children) child.kill(signal); process.exit(); });
