"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  deactivateMentionToken,
  detectTrigger,
  MENTION_TOKEN_RE,
} from "@/components/chat/input/mention-utils";
import {
  getFilteredMentionItems,
  type MentionSelectPayload,
} from "@/components/chat/mention-menu";
import {
  customCommandsToSlashCommands,
  getFilteredSlashCommands,
  type SlashCommand,
} from "@/components/chat/slash-commands";
import type { ProjectLite } from "@/hooks/use-projects";
import type { Agent, CustomCommand, McpServer, Skill } from "@/lib/db/schema";

// Triggers de composition partagés par le Chat et l'Agent : détection des
// commandes « / » et des mentions « @ », navigation clavier dans les menus,
// insertion et suppression atomique des tokens. Les menus eux-mêmes restent
// les composants existants (MentionMenu, SlashCommandMenu) ; le hook ne fait
// qu'unifier leur pilotage pour que les deux composers se comportent
// exactement pareil.
//
// Contrat :
// - `resolveMention` (retour false) interdit l'insertion : le Chat y met ses
//   gardes (outils non supportés, quota mémoire), l'Agent les types sans
//   support serveur. Un veto referme le menu.
// - `onCustomCommand` exécute une mention de commande personnalisée et
//   retourne le token à insérer (« @trigger ») ou null (exécution seule).
// - `onSuggestionSelect` porte les effets de session APRÈS insertion
//   (skill actif, agent, projet, outils one-shot).

export type ComposerTriggerOptions = {
  activeAgent?: Agent | null;
  activeSkill?: Skill | null;
  clearActiveAgent?: () => void;
  clearActiveSkill?: () => void;
  clearPendingProject?: () => void;
  customCommands?: CustomCommand[];
  customMentionCommands?: CustomCommand[];
  input: string;
  installedPlugins?: import("@/lib/plugins/types").PluginManifest[];
  isFree?: boolean;
  isNewChatInput?: boolean;
  memoryAtLimit?: boolean;
  mcpServers?: McpServer[];
  /** Callback à la sélection d'une commande slash système. */
  onSlashCommand?: (command: SlashCommand) => void | Promise<void>;
  onSuggestionSelect?: (payload: MentionSelectPayload) => void;
  pendingProject?: { name: string } | null;
  pendingTools?: readonly unknown[];
  projects?: ProjectLite[];
  /** Retourner false pour interdire l'insertion du token @ (garde applicative). */
  resolveMention?: (payload: MentionSelectPayload) => boolean;
  setInput: Dispatch<SetStateAction<string>>;
  skills?: Skill[];
  supportsTools?: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  togglePendingTool?: (toolId: string) => void;
  userAgents?: Agent[];
  /**
   * Mention de commande personnalisée : exécute l'action et retourne le token
   * à insérer (« @trigger »), ou null pour une exécution sans insertion.
   */
  onCustomCommand?: (command: CustomCommand) => string | null;
};

export function useComposerTriggers(options: ComposerTriggerOptions) {
  const {
    activeAgent = null,
    activeSkill = null,
    clearActiveAgent,
    clearActiveSkill,
    clearPendingProject,
    customCommands = [],
    customMentionCommands = [],
    input,
    installedPlugins = [],
    isFree = false,
    isNewChatInput = true,
    memoryAtLimit = false,
    mcpServers = [],
    onCustomCommand,
    onSlashCommand,
    onSuggestionSelect,
    pendingProject = null,
    pendingTools = [],
    projects = [],
    resolveMention,
    setInput,
    skills = [],
    supportsTools = true,
    textareaRef,
    togglePendingTool,
    userAgents = [],
  } = options;

  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const mentionTriggerPosRef = useRef<number | null>(null);

  const customSlashCommands = useMemo(
    () => customCommandsToSlashCommands(customCommands),
    [customCommands]
  );

  const closeMenus = useCallback(() => {
    setSlashOpen(false);
    setMentionOpen(false);
    setSlashQuery("");
    setMentionQuery("");
    mentionTriggerPosRef.current = null;
  }, []);

  const handleInput = useCallback(
    (value: string, cursor: number | null) => {
      setInput(value);
      const position = cursor ?? value.length;
      const trigger = detectTrigger(value, position);
      if (trigger?.type === "slash") {
        setSlashOpen(true);
        setSlashQuery(trigger.query);
        setSlashIndex(0);
        setMentionOpen(false);
        mentionTriggerPosRef.current = null;
        return;
      }
      if (trigger?.type === "mention") {
        setMentionOpen(true);
        setMentionQuery(trigger.query);
        setMentionIndex(0);
        mentionTriggerPosRef.current = trigger.start;
        setSlashOpen(false);
        return;
      }
      closeMenus();
    },
    [closeMenus, setInput]
  );

  const filteredSlashCommands = useMemo(
    () =>
      getFilteredSlashCommands(
        slashQuery,
        { isFree, isHome: isNewChatInput },
        customSlashCommands
      ),
    [customSlashCommands, isFree, isNewChatInput, slashQuery]
  );

  const filteredMentionItems = useMemo(
    () =>
      getFilteredMentionItems(
        mentionQuery,
        projects as never,
        skills,
        mcpServers,
        userAgents,
        customMentionCommands,
        installedPlugins
      ),
    [
      customMentionCommands,
      installedPlugins,
      mcpServers,
      mentionQuery,
      projects,
      skills,
      userAgents,
    ]
  );

  const handleSlashSelect = useCallback(
    (command: SlashCommand) => {
      closeMenus();
      // Le propriétaire décide : le Chat délègue à runSlashCommand, l'Agent
      // traduit vers ses options one-shot.
      void onSlashCommand?.(command);
    },
    [closeMenus, onSlashCommand]
  );

  const insertMentionToken = useCallback(
    (tag: string) => {
      const textarea = textareaRef.current;
      const cursor = textarea?.selectionStart ?? input.length;
      const atPosition = mentionTriggerPosRef.current;
      let nextValue = input;
      let targetCursor = cursor;
      if (atPosition !== null && atPosition >= 0) {
        const before = input.slice(0, atPosition);
        const after = input.slice(cursor);
        nextValue = `${before}${tag}${after.trimStart()}`;
        targetCursor = before.length + tag.length;
      } else {
        const before = input.trimEnd();
        nextValue = `${before ? `${before} ` : ""}${tag}`;
        targetCursor = nextValue.length;
      }
      setInput(nextValue);
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          try {
            textareaRef.current.setSelectionRange(targetCursor, targetCursor);
          } catch {}
        }
      });
    },
    [input, setInput, textareaRef]
  );

  const handleMentionSelect = useCallback(
    (payload: MentionSelectPayload) => {
      // Commande personnalisée : exécution déléguée, insertion conditionnelle
      // au token retourné (les commandes « combinables » s'insèrent, les
      // autres s'exécutent seules).
      if (payload.type === "customCommand") {
        const tag = onCustomCommand?.(payload.command);
        closeMenus();
        if (tag) {
          insertMentionToken(`${tag} `);
        }
        return;
      }

      // Garde applicative : veto = pas d'insertion, menu refermé.
      if (resolveMention && !resolveMention(payload)) {
        closeMenus();
        return;
      }

      insertMentionToken(`@${mentionLabelForPayload(payload)} `);
      closeMenus();
      // L'état de session (skill actif, agent, projet, outils) reste de la
      // responsabilité de l'appelant via onSuggestionSelect.
      onSuggestionSelect?.(payload);
    },
    [
      closeMenus,
      insertMentionToken,
      onCustomCommand,
      onSuggestionSelect,
      resolveMention,
    ]
  );

  const handleTextareaKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (mentionOpen) {
        const flat = filteredMentionItems;
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setMentionIndex((index) =>
            Math.min(index + 1, Math.max(flat.length - 1, 0))
          );
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setMentionIndex((index) => Math.max(index - 1, 0));
          return;
        }
        if (event.key === "Enter" || event.key === "Tab") {
          event.preventDefault();
          const item = flat[mentionIndex];
          if (item) {
            handleMentionSelect(mentionItemToPayload(item));
          }
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          setMentionOpen(false);
          return;
        }
        return;
      }

      if (slashOpen) {
        const filtered = filteredSlashCommands;
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSlashIndex((index) =>
            Math.min(index + 1, Math.max(filtered.length - 1, 0))
          );
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setSlashIndex((index) => Math.max(index - 1, 0));
          return;
        }
        if (event.key === "Enter" || event.key === "Tab") {
          event.preventDefault();
          const command = filtered[slashIndex];
          if (command) {
            handleSlashSelect(command);
          }
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          setSlashOpen(false);
          return;
        }
      }

      if (
        event.key === "Backspace" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        const target = event.currentTarget;
        const { selectionStart, value } = target;
        if (
          selectionStart === target.selectionEnd &&
          selectionStart !== null &&
          selectionStart > 0
        ) {
          const before = value.slice(0, selectionStart);
          const match = before.match(MENTION_TOKEN_RE);
          if (match) {
            event.preventDefault();
            const token = match[1];
            const deleteFrom = selectionStart - match[0].length;
            setInput(
              `${before.slice(0, deleteFrom)}${value.slice(selectionStart)}`
            );
            requestAnimationFrame(() => {
              try {
                target.setSelectionRange(deleteFrom, deleteFrom);
              } catch {}
            });
            deactivateMentionToken({
              activeAgent,
              activeSkill,
              clearActiveAgent: clearActiveAgent ?? (() => {}),
              clearActiveSkill: clearActiveSkill ?? (() => {}),
              clearPendingProject: clearPendingProject ?? (() => {}),
              pendingProject,
              pendingTools,
              plugins: installedPlugins,
              togglePendingTool: togglePendingTool ?? (() => {}),
              token,
              userMcpServers: mcpServers,
            });
          }
        }
      }
    },
    [
      activeAgent,
      activeSkill,
      clearActiveAgent,
      clearActiveSkill,
      clearPendingProject,
      filteredMentionItems,
      filteredSlashCommands,
      handleMentionSelect,
      handleSlashSelect,
      installedPlugins,
      mentionIndex,
      mentionOpen,
      mcpServers,
      pendingProject,
      pendingTools,
      setInput,
      slashIndex,
      slashOpen,
      togglePendingTool,
    ]
  );

  const handleTextareaBlur = useCallback(() => {
    setTimeout(() => {
      setSlashOpen(false);
      setMentionOpen(false);
    }, 150);
  }, []);

  return {
    closeMenus,
    filteredMentionItems,
    filteredSlashCommands,
    handleInput,
    handleMentionSelect,
    handleSlashSelect,
    handleTextareaBlur,
    handleTextareaKeyDown,
    mentionIndex,
    mentionOpen,
    mentionQuery,
    mentionTriggerPos: mentionTriggerPosRef.current,
    slashIndex,
    slashOpen,
    slashQuery,
    textareaProps: useMemo(
      () => ({
        onBlur: handleTextareaBlur,
        onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) =>
          handleInput(event.target.value, event.target.selectionStart),
        onKeyDown: handleTextareaKeyDown,
      }),
      [handleInput, handleTextareaBlur, handleTextareaKeyDown]
    ),
  };
}

function mentionLabelForPayload(payload: MentionSelectPayload): string {
  switch (payload.type) {
    case "agent":
      return payload.agent.name;
    case "memory":
      return "Memory";
    case "mcp":
      return payload.server.name;
    case "plugin":
      return payload.plugin.name;
    case "project":
      return payload.project.name;
    case "skill":
      return payload.skill.name;
    case "system":
      return payload.label;
    default:
      return "";
  }
}

function mentionItemToPayload(item: {
  kind: string;
  [key: string]: unknown;
}): MentionSelectPayload {
  switch (item.kind) {
    case "agent":
      return { agent: item.agent as Agent, type: "agent" };
    case "custom-command":
      return {
        command: item.command as CustomCommand,
        type: "customCommand",
      };
    case "memory":
      return { type: "memory" };
    case "mcp":
      return { server: item.server as McpServer, type: "mcp" };
    case "plugin":
      return {
        plugin: item.plugin as import("@/lib/plugins/types").PluginManifest,
        type: "plugin",
      };
    case "project":
      return {
        project: item.project as ProjectLite,
        type: "project",
      };
    case "skill":
      return { skill: item.skill as Skill, type: "skill" };
    case "system":
      return {
        action: item.action as "web" | "library" | "planning" | "notes",
        label: item.label as string,
        type: "system",
      };
    default:
      return { type: "memory" };
  }
}
