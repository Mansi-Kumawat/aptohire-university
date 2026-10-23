import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const forbidden = [/service_role/i, /sb_secret/i];
const sourceRoots = ['src', ...(existsSync('dist') ? ['dist'] : [])];
const scan = (path, files = []) => { for (const entry of readdirSync(path)) { const full = join(path, entry); if (statSync(full).isDirectory()) scan(full, files); else if (/\.(ts|tsx|js|jsx|html|css)$/.test(full)) files.push(full); } return files; };
let failed = false;
for (const file of sourceRoots.flatMap((root) => scan(root))) {
  const text = readFileSync(file, 'utf8');
  if (forbidden.some((pattern) => pattern.test(text))) { console.error(`Forbidden secret marker found in ${file}`); failed = true; }
}
for (const file of scan('src/components')) {
  const text = readFileSync(file, 'utf8');
  if (/(?:#[0-9a-fA-F]{3,8}\b)/.test(text)) { console.error(`Hard-coded hex colour found in component ${file}`); failed = true; }
}
if (failed) process.exit(1);
console.log('Security marker and component colour checks passed.');
