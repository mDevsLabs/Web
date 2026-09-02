"use client";

import {
  BookOpenIcon,
  BotIcon,
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
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, any> = {
  book: BookOpenIcon,
  bot: BotIcon,
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

export const EMOJI_PRESETS = [
  "🤖",
  "🧑‍💻",
  "✍️",
  "📈",
  "⚖️",
  "📊",
  "💡",
  "🎧",
  "📚",
  "🔍",
  "⚡",
  "💰",
  "🧠",
  "🎨",
  "🚀",
  "🛠️",
];

export function isEmoji(value?: string | null) {
  if (!value) {
    return false;
  }
  return /\p{Emoji}/u.test(value);
}

export function AgentIcon({
  icon,
  emoji,
  color,
  className,
  size = 16,
  variant = "default",
  style,
}: {
  icon?: string | null;
  emoji?: string | null;
  color?: string | null;
  className?: string;
  size?: number;
  variant?: "default" | "plain";
  style?: React.CSSProperties;
}) {
  if (emoji) {
    if (variant === "plain") {
      return (
        <span
          className={cn(
            "inline-flex items-center justify-center leading-none",
            className
          )}
          style={{ fontSize: size, ...style }}
        >
          {emoji}
        </span>
      );
    }
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-lg leading-none",
          className
        )}
        style={{
          backgroundColor: color || "#6366f1",
          fontSize: size,
          height: size + 16,
          width: size + 16,
          ...style,
        }}
      >
        {emoji}
      </span>
    );
  }
  const Icon = ICON_MAP[icon || "sparkles"] || SparklesIcon;
  return <Icon className={className} size={size} style={style} />;
}
