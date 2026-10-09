export interface NavSubItem {
  href: string;
  name: string;
  subitems?: { name: string; href: string }[];
}

export interface NavItem {
  href: string;
  name: string;
  subitems?: NavSubItem[];
}

export const navLinks: NavItem[] = [
  { href: "/news", name: "Actualités" },
  {
    href: "/models",
    name: "Modèles",
    subitems: [
      { href: "/models", name: "Tous les modèles" },
      {
        href: "/models#mai-2",
        name: "mAI-2",
        subitems: [
          { href: "/models/mai-2", name: "mAI-2" },
          { href: "/models/mai-2-mini", name: "mAI-2-Mini" },
        ],
      },
      {
        href: "/models#mai-1.5",
        name: "mAI-1.5",
        subitems: [
          { href: "/models/mai-1.5-light", name: "mAI-1.5-Light" },
          { href: "/models/mai-1.5-apex", name: "mAI-1.5-Apex" },
          { href: "/models/mai-1.5-opal", name: "mAI-1.5-Opal" },
        ],
      },
      {
        href: "/models#mai-1.2",
        name: "mAI-1.2",
        subitems: [
          { href: "/models/mai-1.2-light", name: "mAI-1.2-Light" },
          { href: "/models/mai-1.2-apex", name: "mAI-1.2-Apex" },
          { href: "/models/mai-1.2-opal", name: "mAI-1.2-Opal" },
        ],
      },
      {
        href: "/models#mai-1",
        name: "mAI-1",
        subitems: [
          { href: "/models/mai-1", name: "mAI-1" },
          { href: "/models/mai-1-light", name: "mAI-1-Light" },
        ],
      },
    ],
  },
  {
    href: "/projects",
    name: "Projets",
    subitems: [
      { href: "/projects", name: "Tous les projets" },
      { href: "/projects/web", name: "Web" },
      { href: "/projects/vibe", name: "Vibe" },
      { href: "/projects/coder", name: "Coder" },
      { href: "/projects/cli", name: "CLI" },
      { href: "/projects/pulse", name: "Pulse" },
    ],
  },
  {
    href: "/account/keys",
    name: "API",
    subitems: [
      {
        href: "/account/models",
        name: "Modèles",
        subitems: [
          { href: "/account/models", name: "Modèles Texte" },
          { href: "/account/models/images", name: "Modèles Images" },
          { href: "/account/models/audio", name: "Modèles Audio" },
          { href: "/account/models/mai", name: "Modèles mAI" },
        ],
      },
      { href: "/account/keys", name: "Clés API" },
      { href: "/account/requests", name: "Requêtes" },
      { href: "/account/usage", name: "Usage" },
      { href: "/account/config", name: "Configuration" },
    ],
  },
  { href: "/pricing", name: "Tarifs" },
  {
    href: "/support",
    name: "Plus",
    subitems: [
      { href: "/support", name: "Support" },
      { href: "/docs", name: "Documentation" },
      { href: "/downloads", name: "Téléchargements" },
    ],
  },
];

export function checkSubActive(sub: NavSubItem, pathname: string): boolean {
  if (pathname === sub.href) return true;
  if (sub.subitems?.some((nested) => pathname === nested.href)) return true;
  return false;
}

export function checkLinkActive(link: NavItem, pathname: string): boolean {
  if (pathname === link.href) return true;
  if (link.subitems?.some((sub) => checkSubActive(sub, pathname))) return true;
  return false;
}
