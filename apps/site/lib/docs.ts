import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { type DocMetadata } from '@/lib/text-utils';

export type { DocMetadata };

// Cache mémoire pour éviter la relecture synchrone systématique du disque sur chaque appel
let cachedDocs: DocMetadata[] | null = null;

/**
 * Récupère la liste de tous les documents triés par catégorie, puis par ordre/titre.
 * Utilise un cache mémoire pour la performance.
 */
export function getAllDocs(): DocMetadata[] {
  if (cachedDocs) {
    return cachedDocs;
  }

  const docsDirectory = path.join(process.cwd(), 'docs/documentation');

  if (!fs.existsSync(docsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(docsDirectory);
  const docs: DocMetadata[] = [];

  for (const fileName of fileNames) {
    if (!fileName.endsWith('.md')) continue;

    const slug = fileName.replace(/\.md$/, '');
    const fullPath = path.join(docsDirectory, fileName);

    try {
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      docs.push({
        slug,
        title: data.title || slug,
        description: data.description || '',
        category: data.category || 'Général',
        order: typeof data.order === 'number' ? data.order : 999,
        content});
    } catch (e) {
      // Un fichier mal formé (front-matter YAML invalide) ne doit pas casser tout l'index
      console.error(`[docs] Fichier ignoré (lecture/parsing impossible) : ${fileName}`, e);
    }
  }

  // Ordre canonique des catégories
  const categoryOrderMap: Record<string, number> = {
    'API': 1,
    'Applications': 2,
    "Modèles d'IA": 3,
    'Guides': 4,
    'Architecture': 5,
  };

  docs.sort((a, b) => {
    const catOrderA = categoryOrderMap[a.category] ?? 99;
    const catOrderB = categoryOrderMap[b.category] ?? 99;

    if (catOrderA !== catOrderB) {
      return catOrderA - catOrderB;
    }

    if (a.order !== b.order) {
      return a.order - b.order;
    }

    return a.title.localeCompare(b.title, 'fr');
  });

  cachedDocs = docs;
  return cachedDocs;
}

export function walkDocs(dir: string, baseDir: string): DocMetadata[] {
  let docs: DocMetadata[] = [];
  if (!fs.existsSync(dir)) return docs;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      docs = docs.concat(walkDocs(path.join(dir, entry.name), baseDir));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const fullPath = path.join(dir, entry.name);

      try {
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data, content } = matter(fileContents);

        const relativePath = path.relative(baseDir, fullPath);
        let category = data.category;
        if (!category) {
          const dirname = path.dirname(relativePath);
          if (dirname === '.') {
            category = 'Général';
          } else {
            category = dirname.replace(/\\/g, '/').split('/').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' - ');
          }
        }

        docs.push({
          slug: relativePath.replace(/\\/g, '/').replace(/\.md$/, ''),
          title: data.title || entry.name.replace(/\.md$/, ''),
          description: data.description || '',
          category,
          order: typeof data.order === 'number' ? data.order : 999,
          content});
      } catch (e) {
        console.error(`[docs] Fichier ignoré (lecture/parsing impossible) : ${fullPath}`, e);
      }
    }
  }
  return docs;
}

