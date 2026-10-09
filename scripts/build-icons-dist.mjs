import fs from 'node:fs';
import path from 'node:path';
import esbuild from 'esbuild';

const rootDir = process.cwd();
const iconsSrc = path.join(rootDir, 'packages/icons/src');
const iconsDist = path.join(rootDir, 'packages/icons/dist');
const pnpmDist = path.join(
  rootDir,
  'node_modules/.pnpm/@mdevs+icons@file+packages+icons_react@19.3.0/node_modules/@mdevs/icons/dist'
);

console.log('📦 Compilation incrémentale sécurisée de packages/icons vers dist...');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function safeWrite(filePath, data) {
  try {
    fs.writeFileSync(filePath, data, 'utf8');
  } catch (err) {
    const tmp = `${filePath}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.bak`;
    try {
      fs.renameSync(filePath, tmp);
      fs.writeFileSync(filePath, data, 'utf8');
      try { fs.unlinkSync(tmp); } catch {}
    } catch (e2) {
      console.warn(`Avertissement verrou Windows sur ${filePath}: ${e2.message}`);
    }
  }
}

function writeToDists(relPath, data) {
  const file1 = path.join(iconsDist, relPath);
  ensureDir(path.dirname(file1));
  safeWrite(file1, data);

  if (fs.existsSync(path.dirname(pnpmDist))) {
    const file2 = path.join(pnpmDist, relPath);
    ensureDir(path.dirname(file2));
    safeWrite(file2, data);
  }
}

const targetFiles = [
  'icons/brands/github.tsx',
  'icons/brands/twitter.tsx',
  'icons/brands/facebook.tsx',
  'icons/brands/instagram.tsx',
  'icons/brands/linkedin.tsx',
  'icons/brands/youtube.tsx',
  'icons/brands/chrome.tsx',
  'icons/brands/gitlab.tsx',
  'icons/brands/index.ts',
  'icons/interface/more-horizontal.tsx',
  'icons/interface/more-vertical.tsx',
  'icons/interface/panels-top-left.tsx',
  'icons/interface/index.ts',
  'icons/time/clock.tsx',
  'icons/time/index.ts',
  'icons/files/file-json.tsx',
  'icons/files/file-question.tsx',
  'icons/files/book-marked.tsx',
  'icons/files/index.ts',
  'icons/security/shield-question.tsx',
  'icons/security/index.ts',
  'icons/communication/message-circle-question.tsx',
  'icons/communication/index.ts',
  'icons/controls/square-check.tsx',
  'icons/controls/index.ts',
  'icons/editing/square-pen.tsx',
  'icons/editing/index.ts',
  'index.ts'
];

for (const rel of targetFiles) {
  const srcFile = path.join(iconsSrc, rel);
  if (!fs.existsSync(srcFile)) continue;
  const parsed = path.parse(rel);
  const relBase = path.join(parsed.dir, parsed.name);

  // 1. ESM (.js)
  const esmRes = esbuild.buildSync({
    entryPoints: [srcFile],
    write: false,
    format: 'esm',
    target: 'es2022',
    banner: { js: '"use client";' },
    bundle: false,
    platform: 'neutral',
    loader: { '.tsx': 'tsx', '.ts': 'ts' }
  });
  writeToDists(`${relBase}.js`, esmRes.outputFiles[0].text);

  // 2. CJS (.cjs)
  const cjsRes = esbuild.buildSync({
    entryPoints: [srcFile],
    write: false,
    format: 'cjs',
    target: 'es2022',
    banner: { js: '"use client";' },
    bundle: false,
    platform: 'node',
    loader: { '.tsx': 'tsx', '.ts': 'ts' }
  });
  writeToDists(`${relBase}.cjs`, cjsRes.outputFiles[0].text);

  // 3. d.ts
  const srcContent = fs.readFileSync(srcFile, 'utf8');
  let dtsContent = '';
  if (parsed.name === 'index') {
    dtsContent = srcContent.replace(/\.tsx/g, '.js');
  } else {
    const match = /export const (\w+)/g;
    let m;
    while ((m = match.exec(srcContent)) !== null) {
      dtsContent += `export declare const ${m[1]}: import("react").ForwardRefExoticComponent<Omit<import("${parsed.dir ? '../../create-icon.js' : './create-icon.js'}").IconProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;\n`;
    }
  }
  if (dtsContent) {
    writeToDists(`${relBase}.d.ts`, dtsContent);
  }
}

console.log(`✅ ${targetFiles.length} fichiers compilés dans packages/icons/dist et node_modules !`);
