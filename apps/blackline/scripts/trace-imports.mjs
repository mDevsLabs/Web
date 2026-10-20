// Trace l graphe d'imports statiques depuis un point d'entrée, pour trouver
// qui tire le moteur (`three`) dans le chunk d'entrée.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const ROOT = resolve(process.argv[2] ?? 'src');
const ENTRY = resolve(ROOT, process.argv[3] ?? 'main.ts');

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (name.endsWith('.ts')) files.push(full);
  }
})(ROOT);

const importsOf = (file) => {
  const src = readFileSync(file, 'utf8');
  const out = [];
  const re = /^\s*import\s+(?!type\s)(?:[^'"]*?\sfrom\s+)?['"]([^'"]+)['"]/gm;
  let m;
  while ((m = re.exec(src))) {
    const spec = m[1];
    if (!spec.startsWith('.')) {
      out.push({ spec, external: true });
      continue;
    }
    let target = resolve(dirname(file), spec);
    if (!target.endsWith('.ts')) {
      try {
        statSync(target);
      } catch {
        target = target.replace(/\.js$/, '.ts');
      }
    }
    out.push({ spec, target, external: false });
  }
  return out;
};

// DFS : qui atteint `three` en statique depuis l'entrée ?
const memo = new Map();
function reachesThree(file, stack = []) {
  if (memo.has(file)) return memo.get(file);
  if (stack.includes(file)) return [];
  memo.set(file, []);
  const hits = [];
  for (const imp of importsOf(file)) {
    if (imp.external) {
      if (imp.spec === 'three' || imp.spec.startsWith('three/')) {
        hits.push({ file, via: imp.spec, stack: [...stack, file] });
      }
      continue;
    }
    const sub = reachesThree(imp.target, [...stack, file]);
    for (const h of sub) hits.push(h);
  }
  memo.set(file, hits);
  return hits;
}

const hits = reachesThree(ENTRY);
console.log(`Chemins statiques vers three depuis ${ENTRY} :`);
for (const h of hits) {
  console.log(`\n  ${h.file.replace(ROOT, '.')}`);
  console.log(`    via ${h.via}`);
  console.log(`    chemin: ${h.stack.map((f) => f.replace(ROOT, '.')).join(' -> ')}`);
}
if (!hits.length) console.log('  (aucun)');
