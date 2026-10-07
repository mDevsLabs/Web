import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const srcSite = path.join(rootDir, "apps/site");

// 1. Préparation des répertoires cibles
const targetLib = path.join(rootDir, "lib/site");
const targetComponents = path.join(rootDir, "components/site");
const targetApp = path.join(rootDir, "app/(chat)/site");
const targetApi = path.join(rootDir, "app/(chat)/api/site");

fs.mkdirSync(targetLib, { recursive: true });
fs.mkdirSync(targetComponents, { recursive: true });
fs.mkdirSync(targetApp, { recursive: true });
fs.mkdirSync(targetApi, { recursive: true });

console.log("🚀 Début de la migration de apps/site vers mAI Web...");

// Remplacement textuel commun pour réécrire les imports et assets
function transformContent(content, filePath) {
  let transformed = content;

  // Réécriture des imports internes
  transformed = transformed.replace(/@\/components\//g, "@/components/site/");
  transformed = transformed.replace(/@\/lib\//g, "@/lib/site/");
  transformed = transformed.replace(
    /@\/app\/actions\//g,
    "@/app/(chat)/site/actions/"
  );
  transformed = transformed.replace(
    /from\s+["']@\/email["']/g,
    'from "@/lib/site/email"'
  );

  // Remplacement de next/link par l'adaptateur router pour le site
  // Attention à ne pas remplacer dans components/site/router.tsx lui-même !
  if (!filePath.endsWith("router.tsx")) {
    transformed = transformed.replace(
      /from\s+["']next\/link["']/g,
      'from "@/components/site/router"'
    );
  }

  // Remplacement des assets publics vers /site/... en préservant le guillemet exact
  const assetReplacements = [
    [/(["'])\/logo\.png\1/g, "$1/site/logo.png$1"],
    [/(["'])\/mai\.png\1/g, "$1/site/mai.png$1"],
    [/(["'])\/galaxy\.JPG\1/g, "$1/site/galaxy.JPG$1"],
    [/(["'])\/snob\.png\1/g, "$1/site/snob.png$1"],
    [/(["'])\/openprovider\.png\1/g, "$1/site/openprovider.png$1"],
    [/(["'])\/msearch\.PNG\1/g, "$1/site/msearch.PNG$1"],
    [/(["'])\/devices\//g, "$1/site/devices/"],
    [/(["'])\/mai-1\//g, "$1/site/mai-1/"],
    [/(["'])\/mai-1-light\//g, "$1/site/mai-1-light/"],
    [/(["'])\/mai-1\.2-apex\//g, "$1/site/mai-1.2-apex/"],
    [/(["'])\/mai-1\.2-light\//g, "$1/site/mai-1.2-light/"],
    [/(["'])\/mai-1\.2-opal\//g, "$1/site/mai-1.2-opal/"],
    [/(["'])\/mai-1\.5-apex\//g, "$1/site/mai-1.5-apex/"],
    [/(["'])\/mai-1\.5-light\//g, "$1/site/mai-1.5-light/"],
    [/(["'])\/mai-1\.5-opal\//g, "$1/site/mai-1.5-opal/"],
    [/(["'])\/mai-2\//g, "$1/site/mai-2/"],
    [/(["'])\/news\//g, "$1/site/news/"],
    [/(["'])\/sounds\//g, "$1/site/sounds/"],
  ];

  for (const [regex, replacement] of assetReplacements) {
    transformed = transformed.replace(regex, replacement);
  }

  // Nettoyage de runtime/revalidate/dynamic incompatibles avec cacheComponents de Next 16
  transformed = transformed.replace(
    /export\s+const\s+runtime\s*=\s*['"]nodejs['"];?\r?\n?/g,
    ""
  );
  transformed = transformed.replace(
    /export\s+const\s+revalidate\s*=\s*\d+;?\r?\n?/g,
    ""
  );
  transformed = transformed.replace(
    /export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"];?\r?\n?/g,
    ""
  );

  // Remplacement d'appel d'API /api/search vers /api/site/search
  transformed = transformed.replace(/\/api\/search\?/g, "/api/site/search?");

  return transformed;
}

// Fonction récursive de copie de fichiers avec transformation
function copyDirRecursive(src, dest, filterFn) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath, filterFn);
    } else if (entry.isFile()) {
      if (filterFn && !filterFn(entry.name, srcPath)) continue;

      let content = fs.readFileSync(srcPath, "utf8");
      content = transformContent(content, destPath);

      // Personnalisations spécifiques :
      // 1. docs.ts / news.ts / changelog.ts : chemins de documents
      if (
        entry.name === "docs.ts" ||
        entry.name === "news.ts" ||
        entry.name === "changelog.ts"
      ) {
        content = content.replace(
          /path\.join\(process\.cwd\(\),\s*['"]docs\//g,
          "path.join(process.cwd(), 'apps/site/docs/"
        );
        content = content.replace(
          /path\.join\(process\.cwd\(\),\s*`docs\//g,
          "path.join(process.cwd(), `apps/site/docs/"
        );
      }

      // 2. session-auth.ts : extraction du cookie mAI session token en plus de mai_token
      if (entry.name === "session-auth.ts") {
        content = content.replace(
          /req\.cookies\.get\(["']mai_token["']\)\?\.value/g,
          '(req.cookies.get("mai_session_token")?.value || req.cookies.get("mai_token")?.value)'
        );
        content = content.replace(
          /store\.get\(["']mai_token["']\)\?\.value/g,
          '(store.get("mai_session_token")?.value || store.get("mai_token")?.value)'
        );
      }

      // 3. auth-storage.ts : cookies mAI
      if (entry.name === "auth-storage.ts") {
        content = content.replace(
          /const cookieUser = getCookie\(["']mai_user["']\);/g,
          'const cookieUser = getCookie("mai_user") || getCookie("mai_session_token");'
        );
      }

      // 4. command-menu.tsx : useRouter de l'adaptateur
      if (entry.name === "command-menu.tsx") {
        content = content.replace(
          /import\s+\{\s*useRouter\s*\}\s+from\s+["']next\/navigation["'];/g,
          'import { useSiteRouter as useRouter, toSitePath } from "@/components/site/router";'
        );
      }

      // 5. search-bar.tsx : useRouter de l'adaptateur
      if (entry.name === "search-bar.tsx") {
        content = content.replace(
          /import\s+\{\s*useRouter\s*\}\s+from\s+["']next\/navigation["'];/g,
          'import { useSiteRouter as useRouter } from "@/components/site/router";'
        );
      }

      // 6. auth-provider.tsx : initialToken et initialUser
      if (entry.name === "auth-provider.tsx") {
        content = content.replace(
          /export function AuthProvider\(\{ children \}: \{ children: ReactNode \}\) \{/g,
          `export function AuthProvider({
  children,
  initialToken = null,
  initialUser = null,
}: {
  children: ReactNode;
  initialToken?: string | null;
  initialUser?: AuthUser | null;
}) {`
        );
        content = content.replace(
          /const \[loading, setLoading\] = useState\(true\);/g,
          "const [loading, setLoading] = useState(!initialToken);"
        );
        content = content.replace(
          /const \[token, setToken\] = useState<string \| null>\(null\);/g,
          "const [token, setToken] = useState<string | null>(initialToken);"
        );
        content = content.replace(
          /const \[user, setUser\] = useState<AuthUser \| null>\(null\);/g,
          "const [user, setUser] = useState<AuthUser | null>(initialUser);"
        );
        content = content.replace(
          /const session = getSession\(\);\s+if \(!session\?\.token\) \{/g,
          `const session = getSession();
      const effectiveToken = session?.token || initialToken;
      if (!effectiveToken) {`
        );
        content = content.replace(
          /setToken\(session\.token\);\s+const partial = sessionToUser\(session\);/g,
          `setToken(effectiveToken);
      const partial = session ? sessionToUser(session) : initialUser;`
        );
        content = content.replace(/session\.token/g, "effectiveToken");
      }

      fs.writeFileSync(destPath, content, "utf8");
    }
  }
}

// A. Migration de apps/site/lib vers lib/site
console.log("📦 1. Copie et adaptation de lib/site...");
copyDirRecursive(
  path.join(srcSite, "lib"),
  targetLib,
  (name) =>
    name.endsWith(".ts") || name.endsWith(".tsx") || name.endsWith(".json")
);

// B. Migration de apps/site/components vers components/site
console.log("🎨 2. Copie et adaptation de components/site...");
copyDirRecursive(
  path.join(srcSite, "components"),
  targetComponents,
  (name) =>
    name.endsWith(".ts") ||
    name.endsWith(".tsx") ||
    name.endsWith(".css") ||
    name.endsWith(".json")
);

// C. Migration des routes API de apps/site/app/api vers app/(chat)/api/site
console.log("🔌 3. Copie et adaptation de app/api vers app/(chat)/api/site...");
copyDirRecursive(
  path.join(srcSite, "app/api"),
  targetApi,
  (name) =>
    name.endsWith(".ts") || name.endsWith(".tsx") || name.endsWith(".json")
);

// D. Migration des pages de apps/site/app vers app/(chat)/site
console.log("📄 4. Copie et adaptation des pages vers app/(chat)/site...");
copyDirRecursive(path.join(srcSite, "app"), targetApp, (name, fullPath) => {
  // Exclure les fichiers layout.tsx racine (on créera le nôtre), globals.css et le dossier api
  if (
    fullPath.includes(`${path.sep}api${path.sep}`) ||
    fullPath.endsWith(`${path.sep}api`)
  )
    return false;
  if (name === "globals.css" || name === "favicon.ico") return false;
  if (
    name === "layout.tsx" &&
    fullPath === path.join(srcSite, "app/layout.tsx")
  )
    return false;
  return (
    name.endsWith(".ts") || name.endsWith(".tsx") || name.endsWith(".json")
  );
});

console.log("✅ Migration des fichiers terminée avec succès !");
