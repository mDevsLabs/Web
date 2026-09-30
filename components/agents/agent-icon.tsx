"use client";

import {
  BookOpenIcon,
  BrainIcon,
  BriefcaseIcon,
  CameraIcon,
  ChartLineIcon,
  CloudIcon,
  Code2Icon,
  CpuIcon,
  DatabaseIcon,
  FileTextIcon,
  GlobeIcon,
  GraduationCapIcon,
  HeadsetIcon,
  HeartIcon,
  LightbulbIcon,
  MessageCircleIcon,
  MusicIcon,
  PaletteIcon,
  PenLineIcon,
  RocketIcon,
  ScaleIcon,
  ShieldIcon,
  SparklesIcon,
  TargetIcon,
  WalletIcon,
  WrenchIcon,
  ZapIcon,
} from "lucide-react";
import { BotGlyph, type BotGlyphProps } from "@/components/agents/bot-avatar";
import { cn } from "@/lib/utils";

/**
 * Contrat commun aux icônes du registre : Lucide pour toutes, `BotGlyph` pour
 * « bot ». Les deux acceptent les mêmes props, donc `<Icon size={…} />` reste
 * valide quelle que soit l'entrée tirée du registre.
 */
type IconComponent = (props: BotGlyphProps) => React.ReactNode;

const ICON_MAP: Record<string, IconComponent> = {
  book: BookOpenIcon,
  bot: BotGlyph,
  brain: BrainIcon,
  briefcase: BriefcaseIcon,
  camera: CameraIcon,
  chart: ChartLineIcon,
  cloud: CloudIcon,
  code: Code2Icon,
  cpu: CpuIcon,
  database: DatabaseIcon,
  file: FileTextIcon,
  globe: GlobeIcon,
  "graduation-cap": GraduationCapIcon,
  headset: HeadsetIcon,
  heart: HeartIcon,
  lightbulb: LightbulbIcon,
  "message-circle": MessageCircleIcon,
  music: MusicIcon,
  palette: PaletteIcon,
  pen: PenLineIcon,
  rocket: RocketIcon,
  scale: ScaleIcon,
  shield: ShieldIcon,
  sparkles: SparklesIcon,
  target: TargetIcon,
  wallet: WalletIcon,
  wrench: WrenchIcon,
  zap: ZapIcon,
};

export function AgentIcon({
  icon,
  color,
  className,
  size = 16,
  variant = "default",
  style,
}: {
  icon?: string | null;
  color?: string | null;
  className?: string;
  size?: number;
  variant?: "default" | "plain";
  style?: React.CSSProperties;
}) {
  const Icon = ICON_MAP[icon || "sparkles"] || SparklesIcon;
  if (variant === "plain") {
    return <Icon className={className} size={size} style={style} />;
  }
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg leading-none text-white",
        className
      )}
      style={{
        backgroundColor: color || "#6366f1",
        height: size + 16,
        width: size + 16,
        ...style,
      }}
    >
      <Icon size={size} style={style} />
    </span>
  );
}
