"use client";

import { FlaskConicalIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react";
import { type AgentChannel, getAgentChannelInfo } from "@/lib/agent/channel";
import { cn } from "@/lib/utils";

// Badge de canal (Alpha aujourd'hui, Beta puis Stable sans toucher au reste de
// l'interface) : la valeur vient de la constante AGENT_CHANNEL.

const CHANNEL_STYLES: Record<AgentChannel, string> = {
  alpha:
    "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  beta: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  stable:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

const CHANNEL_ICONS: Record<AgentChannel, typeof FlaskConicalIcon> = {
  alpha: FlaskConicalIcon,
  beta: SparklesIcon,
  stable: ShieldCheckIcon,
};

export function AgentChannelBadge({
  className,
  channel,
}: {
  channel?: AgentChannel;
  className?: string;
}) {
  const info = getAgentChannelInfo(channel);
  const Icon = CHANNEL_ICONS[info.channel];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        CHANNEL_STYLES[info.channel],
        className
      )}
      data-testid="agent-channel-badge"
    >
      <Icon aria-hidden className="size-3" />
      {info.label}
    </span>
  );
}

export function AgentChannelNotice({
  channel,
  className,
}: {
  channel?: AgentChannel;
  className?: string;
}) {
  const info = getAgentChannelInfo(channel);

  return (
    <p
      className={cn(
        "text-[11.5px] leading-relaxed text-muted-foreground",
        className
      )}
    >
      {info.notice}
    </p>
  );
}
