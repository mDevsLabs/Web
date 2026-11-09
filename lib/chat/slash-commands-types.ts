import type { ReactNode } from "react";
import type { SlashCommandAction } from "@/lib/chat/slash-command-catalog";
import type { CustomCommand } from "@/lib/db/schema";

export type SlashCommand = {
  name: string;
  description: string;
  icon?: ReactNode;
  action: SlashCommandAction;
  shortcut?: string;
  aliases?: string[];
  custom?: CustomCommand;
};
