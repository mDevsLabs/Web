"use client";

import { memo } from "react";
import { BotIcon } from "lucide-react";
import { resolveAgentIcon } from "@/components/agents/agent-registry";

/**
 * Sidebar chat icon: custom-agent chats show the agent's configured icon,
 * plain chats show the standard bot icon.
 */
export const ChatAgentIcon = memo(function ChatAgentIcon({
  agentIcon,
  agentEmoji,
  agentColor,
  size = 14,
}: {
  agentIcon?: string | null;
  agentEmoji?: string | null;
  agentColor?: string | null;
  size?: number;
}) {
  if (agentEmoji) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-[4px] leading-none"
        style={{
          backgroundColor: agentColor || "#6366f1",
          fontSize: size - 2,
          height: size + 2,
          width: size + 2,
        }}
      >
        {agentEmoji}
      </span>
    );
  }

  if (agentIcon) {
    const Icon = resolveAgentIcon(agentIcon);
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-[4px]"
        style={{
          backgroundColor: agentColor || "#6366f1",
          height: size + 2,
          width: size + 2,
        }}
      >
        <Icon size={size - 2} color="#fff" />
      </span>
    );
  }

  // Standard (no custom agent): neutral bot glyph
  return <BotIcon className="shrink-0 text-sidebar-foreground/50" size={size} />;
});
