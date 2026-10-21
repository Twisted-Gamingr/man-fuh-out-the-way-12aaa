import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const output = resolve(root, 'dist');
const staticFiles = [
  'index.html', 'styles.css', 'app.js', 'icon.svg', 'manifest.webmanifest'
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of staticFiles) {
  const source = resolve(root, file);
  await stat(source);
  await cp(source, resolve(output, file));
}
console.log(`Built Atmos standalone static frontend to ${output} (${staticFiles.length} files).`);
console.log('One shared API dispatcher is deployed from api/[route].js; no per-endpoint functions are created.');
