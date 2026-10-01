"use client";

import { memo } from "react";
import { resolveAgentIcon } from "@/components/agents/agent-registry";
import { BotGlyph } from "@/components/agents/bot-avatar";

/**
 * Sidebar chat icon: custom-agent chats show the agent's configured icon,
 * plain chats show the standard bot icon.
 */
export const ChatAgentIcon = memo(function ChatAgentIcon({
  agentIcon,
  agentColor,
  size = 14,
}: {
  agentIcon?: string | null;
  agentColor?: string | null;
  size?: number;
}) {
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
        <Icon color="#fff" size={size - 2} />
      </span>
    );
  }

  // Standard (no custom agent): neutral bot glyph — la même identité que le
  // sélecteur de bots, pas une icône Lucide à côté d'elle.
  return (
    <BotGlyph className="shrink-0 text-sidebar-foreground/50" size={size} />
  );
});
