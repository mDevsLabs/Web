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
        href: "/models#mai-2.5",
        name: "mAI-2.5",
        subitems: [
          { href: "/models/mai-2.5-opal", name: "mAI-2.5-Opal" },
          { href: "/models/mai-2.5-apex", name: "mAI-2.5-Apex" },
          { href: "/models/mai-2.5-omni", name: "mAI-2.5-Omni" },
        ],
      },
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
  { href: "/pricing", name: "Tarifs" },
  {
    href: "/support",
    name: "Plus",
    subitems: [
      { href: "/support", name: "Assistance" },
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
