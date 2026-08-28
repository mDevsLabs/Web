"use client";

import {
  BookOpenIcon,
  BotIcon,
  BrainIcon,
  BriefcaseIcon,
  Code2Icon,
  CpuIcon,
  DatabaseIcon,
  FileTextIcon,
  GlobeIcon,
  HeadsetIcon,
  LightbulbIcon,
  PenLineIcon,
  ScaleIcon,
  SparklesIcon,
  TargetIcon,
  WalletIcon,
  ZapIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, any> = {
  bot: BotIcon,
  sparkles: SparklesIcon,
  code: Code2Icon,
  book: BookOpenIcon,
  target: TargetIcon,
  lightbulb: LightbulbIcon,
  globe: GlobeIcon,
  zap: ZapIcon,
  database: DatabaseIcon,
  wallet: WalletIcon,
  headset: HeadsetIcon,
  brain: BrainIcon,
  cpu: CpuIcon,
  scale: ScaleIcon,
  pen: PenLineIcon,
  file: FileTextIcon,
  briefcase: BriefcaseIcon,
};

export const EMOJI_PRESETS = ["🤖","🧑‍💻","✍️","📈","⚖️","📊","💡","🎧","📚","🔍","⚡","💰","🧠","🎨","🚀","🛠️"];

export function isEmoji(value?: string | null) {
  if (!value) return false;
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
      return <span className={cn("inline-flex items-center justify-center leading-none", className)} style={{ fontSize: size, ...style }}>{emoji}</span>;
    }
    return (
      <span
        className={cn("inline-flex items-center justify-center rounded-lg leading-none", className)}
        style={{ backgroundColor: color || "#6366f1", fontSize: size, width: size + 16, height: size + 16, ...style }}
      >
        {emoji}
      </span>
    );
  }
  const Icon = ICON_MAP[icon || "sparkles"] || SparklesIcon;
  return <Icon className={className} size={size} style={style} />;
}
