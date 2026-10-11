import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

// Map spécial d'équivalents pour les cas non triviaux
const ICON_MAPPING = {
  AlertTriangle: "AlertTriangleIcon",
  BookMarked: "BookMarkedIcon",
  Chrome: "ChromeIcon",
  CircleHelp: "CircleHelpIcon",
  CircleMinus: "CircleMinusIcon",
  CirclePlus: "CirclePlusIcon",
  CircleX: "CircleXIcon",
  Clock: "ClockIcon",
  Facebook: "FacebookIcon",
  FileJson: "FileJsonIcon",
  FileQuestion: "FileQuestionIcon",
  Github: "GithubIcon",
  Gitlab: "GitlabIcon",
  Globe2: "Globe2Icon",
  HelpCircle: "HelpCircleIcon",
  Instagram: "InstagramIcon",
  Layers: "LayersIcon",
  Layers2: "Layers2Icon",
  LineChart: "LineChartIcon",
  Linkedin: "LinkedinIcon",
  LoaderCircle: "LoaderCircleIcon",
  MessageCircleQuestion: "MessageCircleQuestionIcon",
  MinusCircle: "MinusCircleIcon",
  MoreHorizontal: "MoreHorizontalIcon",
  MoreVertical: "MoreVerticalIcon",
  PanelsTopLeft: "PanelsTopLeftIcon",
  PenLine: "PenLineIcon",
  PenSquare: "PenSquareIcon",
  PieChart: "PieChartIcon",
  PlusCircle: "PlusCircleIcon",
  Podcast: "PodcastIcon",
  ShieldQuestion: "ShieldQuestionIcon",
  Sliders: "SlidersIcon",
  SlidersHorizontal: "SlidersHorizontalIcon",
  SquareCheck: "SquareCheckIcon",
  SquarePen: "SquarePenIcon",
  Trash: "TrashIcon",
  Trash2: "Trash2Icon",
  TriangleAlert: "TriangleAlertIcon",
  Twitter: "TwitterIcon",
  Unlock: "UnlockIcon",
  UploadCloud: "UploadCloudIcon",
  UserRound: "UserRoundIcon",
  WandSparkles: "WandSparklesIcon",
  XCircle: "XCircleIcon",
  Youtube: "YoutubeIcon",
};

function getMdevsIconName(name) {
  if (ICON_MAPPING[name]) return ICON_MAPPING[name];
  if (name.endsWith("Icon")) return name;
  return `${name}Icon`;
}

function transformIconsInFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let modified = false;

  // 1. Remplacer les imports lucide-react
  const lucideRegex =
    /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]lucide-react['"];?/g;

  content = content.replace(lucideRegex, (match, importsStr) => {
    modified = true;
    const parts = importsStr
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const newImports = [];
    const typeImports = [];

    for (const part of parts) {
      if (part.startsWith("type ")) {
        const typeName = part.replace(/^type\s+/, "").trim();
        if (typeName === "LucideIcon" || typeName === "LucideProps") {
          typeImports.push("IconProps");
        } else {
          typeImports.push(typeName);
        }
        continue;
      }

      if (part === "LucideIcon" || part === "LucideProps") {
        typeImports.push("IconProps");
        continue;
      }

      let sourceName = part;
      let aliasName = part;

      if (part.includes(" as ")) {
        const [src, al] = part.split(/\s+as\s+/);
        sourceName = src.trim();
        aliasName = al.trim();
      }

      const mdevsName = getMdevsIconName(sourceName);
      if (aliasName === mdevsName) {
        newImports.push(mdevsName);
      } else {
        newImports.push(`${mdevsName} as ${aliasName}`);
      }
    }

    const lines = [];
    if (newImports.length > 0) {
      lines.push(`import { ${newImports.join(", ")} } from "@mdevs/icons";`);
    }
    if (typeImports.length > 0) {
      lines.push(
        `import type { ${[...new Set(typeImports)].join(", ")} } from "@mdevs/icons";`
      );
    }
    return lines.join("\n");
  });

  // 2. Remplacer les types LucideIcon dans le corps du fichier
  if (content.includes("LucideIcon")) {
    content = content.replace(/LucideIcon/g, "React.ComponentType<any>");
    modified = true;
  }
  if (content.includes("LucideProps")) {
    content = content.replace(/LucideProps/g, "IconProps");
    modified = true;
  }

  // 3. Remplacer react-icons si présent (ex. FaGithub -> GithubIcon, etc.)
  const reactIconsRegex =
    /import\s+\{([^}]+)\}\s+from\s+['"]react-icons\/[a-z0-9]+['"];?/g;
  content = content.replace(reactIconsRegex, (match, importsStr) => {
    modified = true;
    const parts = importsStr
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const brandImports = [];
    for (const part of parts) {
      let src = part;
      let al = part;
      if (part.includes(" as ")) {
        const [s, a] = part.split(/\s+as\s+/);
        src = s.trim();
        al = a.trim();
      }
      let target = "SparklesIcon";
      const lower = src.toLowerCase();
      if (lower.includes("github")) target = "GithubIcon";
      else if (lower.includes("twitter") || lower.includes("x"))
        target = "TwitterIcon";
      else if (lower.includes("linkedin")) target = "LinkedinIcon";
      else if (lower.includes("youtube")) target = "YoutubeIcon";
      else if (lower.includes("instagram")) target = "InstagramIcon";
      else if (lower.includes("facebook")) target = "FacebookIcon";
      else if (lower.includes("check")) target = "CheckIcon";
      else if (lower.includes("close") || lower.includes("x")) target = "XIcon";

      brandImports.push(`${target} as ${al}`);
    }
    return `import { ${brandImports.join(", ")} } from "@mdevs/icons";`;
  });

  if (modified) {
    fs.writeFileSync(filePath, content, "utf8");
    return true;
  }
  return false;
}

function processDirectory(dirPath) {
  const fullDir = path.resolve(repoRoot, dirPath);
  if (!fs.existsSync(fullDir)) return { modified: 0, processed: 0 };
  let count = 0;
  let modifiedCount = 0;

  function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const ent of entries) {
      if (
        ent.name === "node_modules" ||
        ent.name === ".next" ||
        ent.name === "dist"
      )
        continue;
      const full = path.join(current, ent.name);
      if (ent.isDirectory()) {
        walk(full);
      } else if (ent.name.endsWith(".tsx") || ent.name.endsWith(".ts")) {
        count++;
        if (transformIconsInFile(full)) {
          modifiedCount++;
        }
      }
    }
  }

  walk(fullDir);
  return { modified: modifiedCount, processed: count };
}

const targetDirs = process.argv.slice(2);
if (targetDirs.length === 0) {
  console.log("Usage: node scripts/migrate-icons.mjs <dir1> <dir2> ...");
  process.exit(1);
}

for (const d of targetDirs) {
  console.log(`🚀 Migration des icônes dans ${d}...`);
  const res = processDirectory(d);
  console.log(
    `✅ ${d}: ${res.modified} fichiers mis à jour sur ${res.processed} scannés.`
  );
}
