import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('../', import.meta.url));
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const removeText = value => Array.isArray(value) ? value.map(removeText) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).filter(([key]) => !['description','summary'].includes(key)).map(([key, val]) => [key, removeText(val)])) : value;
const schemas = await Promise.all(['ko','ja','en'].map(async lang => JSON.parse(await readFile(path.join(root, `fixtures/openapi.${lang}.json`), 'utf8'))));
assert.deepEqual(removeText(schemas[0]), removeText(schemas[1]));
assert.deepEqual(removeText(schemas[0]), removeText(schemas[2]));
const outputs = {};
for (const [name, relative] of [['starlight-scalar','apps/starlight/dist'], ['fumadocs','apps/fumadocs/out']]) {
  const directory = path.join(root, relative);
  const entries = await readdir(directory, { recursive: true, withFileTypes: true });
  const files = entries.filter(entry => entry.isFile());
  const sizes = await Promise.all(files.map(async entry => (await stat(path.join(entry.parentPath, entry.name))).size));
  outputs[name] = { files: files.length, htmlFiles: files.filter(entry => entry.name.endsWith('.html')).length, bytes: sizes.reduce((a,b) => a+b,0) };
}
const scalarBundleBytes = (await stat(path.join(root, 'apps/starlight/public/vendor/scalar.js'))).size;
const result = { node: process.version, versions: pkg.dependencies, localizedContractsStructurallyEqual: true, outputs, scalarBundleBytes, note: 'Total uncompressed files on disk, including the locally hosted Scalar bundle; not initial transfer size or a speed benchmark.' };
await writeFile(path.join(root, 'artifacts/build-summary.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ localizedContractsStructurallyEqual: true, outputs }));
