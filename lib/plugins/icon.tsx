import {
  Atom,
  Banknote,
  BarChart3,
  Bot,
  Braces,
  Brain,
  Briefcase,
  Bug,
  Calculator,
  Calendar,
  Camera,
  Cloud,
  CloudSun,
  Code,
  Compass,
  Cpu,
  Database,
  FileText,
  Flame,
  Gamepad2,
  GitBranch,
  Github,
  Gitlab,
  Globe,
  GraduationCap,
  HeartPulse,
  Image as ImageIcon,
  Landmark,
  Languages,
  Leaf,
  Library,
  Lightbulb,
  Mail,
  Map as MapIcon,
  MessageSquare,
  Mic,
  Music,
  Newspaper,
  NotebookPen,
  Palette,
  Puzzle,
  Rocket,
  Rss,
  Salad,
  Search,
  Shield,
  ShoppingCart,
  Sparkles,
  Star,
  Target,
  Terminal,
  TrendingUp,
  Trophy,
  Users,
  Video,
  Wallet,
  Wind,
  Wrench,
  Zap,
} from "lucide-react";
import type { ComponentType } from "react";
import type { LucideIconName } from "./icon-allowlist";
import type { PluginIconRef } from "./types";

// Liste blanche statique : garantit le tree-shaking et évite tout import
// dynamique impossible à bundler côté Next. Le type `Record<LucideIconName, …>`
// rend la correspondance exhaustive : ajouter un nom dans
// `icon-allowlist.ts` sans l'implémenter ici est une erreur de compilation.
const LUCIDE_ICONS: Record<
  LucideIconName,
  ComponentType<{ className?: string }>
> = {
  Atom: Atom as ComponentType<{ className?: string }>,
  Banknote: Banknote as ComponentType<{ className?: string }>,
  BarChart3: BarChart3 as ComponentType<{ className?: string }>,
  Bot: Bot as ComponentType<{ className?: string }>,
  Braces: Braces as ComponentType<{ className?: string }>,
  Brain: Brain as ComponentType<{ className?: string }>,
  Briefcase: Briefcase as ComponentType<{ className?: string }>,
  Bug: Bug as ComponentType<{ className?: string }>,
  Calculator: Calculator as ComponentType<{ className?: string }>,
  Calendar: Calendar as ComponentType<{ className?: string }>,
  Camera: Camera as ComponentType<{ className?: string }>,
  Cloud: Cloud as ComponentType<{ className?: string }>,
  CloudSun: CloudSun as ComponentType<{ className?: string }>,
  Code: Code as ComponentType<{ className?: string }>,
  Compass: Compass as ComponentType<{ className?: string }>,
  Cpu: Cpu as ComponentType<{ className?: string }>,
  Database: Database as ComponentType<{ className?: string }>,
  FileText: FileText as ComponentType<{ className?: string }>,
  Flame: Flame as ComponentType<{ className?: string }>,
  Gamepad2: Gamepad2 as ComponentType<{ className?: string }>,
  GitBranch: GitBranch as ComponentType<{ className?: string }>,
  Github: Github as ComponentType<{ className?: string }>,
  Gitlab: Gitlab as ComponentType<{ className?: string }>,
  Globe: Globe as ComponentType<{ className?: string }>,
  GraduationCap: GraduationCap as ComponentType<{ className?: string }>,
  HeartPulse: HeartPulse as ComponentType<{ className?: string }>,
  Image: ImageIcon as ComponentType<{ className?: string }>,
  Landmark: Landmark as ComponentType<{ className?: string }>,
  Languages: Languages as ComponentType<{ className?: string }>,
  Leaf: Leaf as ComponentType<{ className?: string }>,
  Library: Library as ComponentType<{ className?: string }>,
  Lightbulb: Lightbulb as ComponentType<{ className?: string }>,
  Mail: Mail as ComponentType<{ className?: string }>,
  Map: MapIcon as ComponentType<{ className?: string }>,
  MessageSquare: MessageSquare as ComponentType<{ className?: string }>,
  Mic: Mic as ComponentType<{ className?: string }>,
  Music: Music as ComponentType<{ className?: string }>,
  Newspaper: Newspaper as ComponentType<{ className?: string }>,
  NotebookPen: NotebookPen as ComponentType<{ className?: string }>,
  Palette: Palette as ComponentType<{ className?: string }>,
  Puzzle: Puzzle as ComponentType<{ className?: string }>,
  Rocket: Rocket as ComponentType<{ className?: string }>,
  Rss: Rss as ComponentType<{ className?: string }>,
  Salad: Salad as ComponentType<{ className?: string }>,
  Search: Search as ComponentType<{ className?: string }>,
  Shield: Shield as ComponentType<{ className?: string }>,
  ShoppingCart: ShoppingCart as ComponentType<{ className?: string }>,
  Sparkles: Sparkles as ComponentType<{ className?: string }>,
  Star: Star as ComponentType<{ className?: string }>,
  Target: Target as ComponentType<{ className?: string }>,
  Terminal: Terminal as ComponentType<{ className?: string }>,
  TrendingUp: TrendingUp as ComponentType<{ className?: string }>,
  Trophy: Trophy as ComponentType<{ className?: string }>,
  Users: Users as ComponentType<{ className?: string }>,
  Video: Video as ComponentType<{ className?: string }>,
  Wallet: Wallet as ComponentType<{ className?: string }>,
  Wind: Wind as ComponentType<{ className?: string }>,
  Wrench: Wrench as ComponentType<{ className?: string }>,
  Zap: Zap as ComponentType<{ className?: string }>,
};

export function resolveLucideIcon(
  name: string
): ComponentType<{ className?: string }> {
  return (
    LUCIDE_ICONS[name as LucideIconName] ??
    (Puzzle as ComponentType<{ className?: string }>)
  );
}

export function PluginIcon({
  className,
  icon,
}: {
  className?: string;
  icon: PluginIconRef;
}) {
  if (icon.type === "image") {
    // Image servie depuis /public ou une URL distante : `img` volontaire
    // (les domaines distants ne sont pas déclarés dans next.config).
    return (
      <img alt="" className={className} height={24} src={icon.src} width={24} />
    );
  }
  const Icon = resolveLucideIcon(icon.name);
  return <Icon className={className} />;
}
