import {
  Atom,
  BarChart3,
  Bot,
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
  Globe,
  GraduationCap,
  HeartPulse,
  Image as ImageIcon,
  Languages,
  Leaf,
  Lightbulb,
  Map as MapIcon,
  MessageSquare,
  Mic,
  Music,
  Newspaper,
  Palette,
  Puzzle,
  Rocket,
  Rss,
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
  Wrench,
  Zap,
} from "lucide-react";
import type { ComponentType } from "react";
import type { PluginIconRef } from "./types";

// Liste blanche statique : garantit le tree-shaking et évite tout import
// dynamique impossible à bundler côté Next.
const LUCIDE_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  Atom: Atom as any,
  BarChart3: BarChart3 as any,
  Bot: Bot as any,
  Brain: Brain as any,
  Briefcase: Briefcase as any,
  Bug: Bug as any,
  Calculator: Calculator as any,
  Calendar: Calendar as any,
  Camera: Camera as any,
  Cloud: Cloud as any,
  CloudSun: CloudSun as any,
  Code: Code as any,
  Compass: Compass as any,
  Cpu: Cpu as any,
  Database: Database as any,
  FileText: FileText as any,
  Flame: Flame as any,
  Gamepad2: Gamepad2 as any,
  Globe: Globe as any,
  GraduationCap: GraduationCap as any,
  HeartPulse: HeartPulse as any,
  Image: ImageIcon as any,
  Languages: Languages as any,
  Leaf: Leaf as any,
  Lightbulb: Lightbulb as any,
  Map: MapIcon as any,
  MessageSquare: MessageSquare as any,
  Mic: Mic as any,
  Music: Music as any,
  Newspaper: Newspaper as any,
  Palette: Palette as any,
  Puzzle: Puzzle as any,
  Rocket: Rocket as any,
  Rss: Rss as any,
  Search: Search as any,
  Shield: Shield as any,
  ShoppingCart: ShoppingCart as any,
  Sparkles: Sparkles as any,
  Star: Star as any,
  Target: Target as any,
  Terminal: Terminal as any,
  TrendingUp: TrendingUp as any,
  Trophy: Trophy as any,
  Users: Users as any,
  Video: Video as any,
  Wallet: Wallet as any,
  Wrench: Wrench as any,
  Zap: Zap as any,
};

export function resolveLucideIcon(
  name: string
): ComponentType<{ className?: string }> {
  return LUCIDE_ICONS[name] ?? (Puzzle as any);
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
