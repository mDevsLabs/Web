"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  deactivateMentionToken,
  detectTrigger,
  findMentionTokenAtCursor,
} from "@/components/chat/input/mention-utils";
import {
  type FlatMentionItem,
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
  /** Mode du composer pour garder la même liste visible et clavier. */
  mode?: "agent" | "chat";
  installedPlugins?: import("@/lib/plugins/types").PluginManifest[];
  isFree?: boolean;
  isNewChatInput?: boolean;
  memoryAtLimit?: boolean;
  memoryLimit?: number;
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

function isSlashCommandDisabled(command: SlashCommand, supportsTools: boolean) {
  return command.action.startsWith("tool-") && !supportsTools;
}

function isMentionItemDisabled(
  item: FlatMentionItem,
  supportsTools: boolean,
  memoryAtLimit: boolean,
  memoryLimit?: number
) {
  const isToolFeature =
    item.kind === "skill" || item.kind === "mcp" || item.kind === "plugin";
  const isMemoryBlocked =
    item.kind === "memory" &&
    memoryAtLimit &&
    typeof memoryLimit === "number" &&
    memoryLimit > 0;
  return (isToolFeature && !supportsTools) || isMemoryBlocked;
}

function moveSelectableIndex(
  length: number,
  current: number,
  delta: 1 | -1,
  isSelectable: (index: number) => boolean
): number {
  if (length <= 0) {
    return 0;
  }
  let index = current;
  for (let step = 0; step < length; step += 1) {
    index = (index + delta + length) % length;
    if (isSelectable(index)) {
      return index;
    }
  }
  return isSelectable(current) ? current : 0;
}

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
    memoryLimit,
    mcpServers = [],
    mode = "chat",
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
  const instanceId = useId().replace(/:/g, "");
  const slashMenuId = `${instanceId}-slash-listbox`;
  // Un seul menu est ouvert à la fois ; réutiliser l'identifiant évite les
  // collisions entre plusieurs composers montés sur la même page.
  const mentionMenuId = slashMenuId;

  const customSlashCommands = useMemo(
    () => customCommandsToSlashCommands(customCommands),
    [customCommands]
  );

  const closeMenus = useCallback(() => {
    setSlashOpen(false);
    setMentionOpen(false);
    setSlashQuery("");
    setMentionQuery("");
    setSlashIndex(0);
    setMentionIndex(0);
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
        { isFree, isHome: isNewChatInput, mode },
        customSlashCommands
      ),
    [customSlashCommands, isFree, isNewChatInput, mode, slashQuery]
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

  const selectableSlashCommands = useMemo(
    () =>
      filteredSlashCommands.filter(
        (command) => !isSlashCommandDisabled(command, supportsTools)
      ),
    [filteredSlashCommands, supportsTools]
  );

  const selectableMentionItems = useMemo(
    () =>
      filteredMentionItems.filter(
        (item) =>
          !isMentionItemDisabled(
            item,
            supportsTools,
            memoryAtLimit,
            memoryLimit
          )
      ),
    [filteredMentionItems, supportsTools, memoryAtLimit, memoryLimit]
  );

  useEffect(() => {
    setSlashIndex((current) => {
      if (
        filteredSlashCommands[current] &&
        !isSlashCommandDisabled(filteredSlashCommands[current], supportsTools)
      ) {
        return current;
      }
      return filteredSlashCommands.findIndex(
        (command) => !isSlashCommandDisabled(command, supportsTools)
      );
    });
  }, [filteredSlashCommands, supportsTools]);

  useEffect(() => {
    setMentionIndex((current) => {
      if (
        filteredMentionItems[current] &&
        !isMentionItemDisabled(
          filteredMentionItems[current],
          supportsTools,
          memoryAtLimit,
          memoryLimit
        )
      ) {
        return current;
      }
      return filteredMentionItems.findIndex(
        (item) =>
          !isMentionItemDisabled(
            item,
            supportsTools,
            memoryAtLimit,
            memoryLimit
          )
      );
    });
  }, [filteredMentionItems, supportsTools, memoryAtLimit, memoryLimit]);

  const handleSlashSelect = useCallback(
    (command: SlashCommand) => {
      if (isSlashCommandDisabled(command, supportsTools)) {
        toast.warning(
          "Ce modèle ne prend pas en charge les outils (tools). Cette commande est indisponible."
        );
        return;
      }
      closeMenus();
      // Le propriétaire décide : le Chat délègue à runSlashCommand, l'Agent
      // traduit vers ses options one-shot.
      void onSlashCommand?.(command);
    },
    [closeMenus, onSlashCommand, supportsTools]
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

  const knownMentionLabels = useMemo(
    () => [
      "Memory",
      "Web",
      "Library",
      "Planning",
      "Notes",
      ...projects.map((project) => project.name),
      ...skills.map((skill) => skill.name),
      ...mcpServers.map((server) => server.name),
      ...userAgents.map((agent) => agent.name),
      ...installedPlugins.map((plugin) => plugin.name),
      ...customMentionCommands.map((command) => command.trigger),
    ],
    [
      customMentionCommands,
      installedPlugins,
      mcpServers,
      projects,
      skills,
      userAgents,
    ]
  );

  const handleTextareaKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (mentionOpen) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setMentionIndex((index) =>
            moveSelectableIndex(
              filteredMentionItems.length,
              index,
              1,
              (candidate) =>
                !isMentionItemDisabled(
                  filteredMentionItems[candidate],
                  supportsTools,
                  memoryAtLimit,
                  memoryLimit
                )
            )
          );
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setMentionIndex((index) =>
            moveSelectableIndex(
              filteredMentionItems.length,
              index,
              -1,
              (candidate) =>
                !isMentionItemDisabled(
                  filteredMentionItems[candidate],
                  supportsTools,
                  memoryAtLimit,
                  memoryLimit
                )
            )
          );
          return;
        }
        if (event.key === "Home") {
          event.preventDefault();
          setMentionIndex(
            filteredMentionItems.findIndex(
              (item) =>
                !isMentionItemDisabled(
                  item,
                  supportsTools,
                  memoryAtLimit,
                  memoryLimit
                )
            )
          );
          return;
        }
        if (event.key === "End") {
          event.preventDefault();
          setMentionIndex(
            filteredMentionItems
              .map((item, index) => ({ index, item }))
              .reverse()
              .find(
                ({ item }) =>
                  !isMentionItemDisabled(
                    item,
                    supportsTools,
                    memoryAtLimit,
                    memoryLimit
                  )
              )?.index ?? 0
          );
          return;
        }
        if (event.key === "Enter" || event.key === "Tab") {
          event.preventDefault();
          const current = filteredMentionItems[mentionIndex];
          const item =
            current &&
            !isMentionItemDisabled(
              current,
              supportsTools,
              memoryAtLimit,
              memoryLimit
            )
              ? current
              : selectableMentionItems[0];
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
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSlashIndex((index) =>
            moveSelectableIndex(
              filteredSlashCommands.length,
              index,
              1,
              (candidate) =>
                !isSlashCommandDisabled(
                  filteredSlashCommands[candidate],
                  supportsTools
                )
            )
          );
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setSlashIndex((index) =>
            moveSelectableIndex(
              filteredSlashCommands.length,
              index,
              -1,
              (candidate) =>
                !isSlashCommandDisabled(
                  filteredSlashCommands[candidate],
                  supportsTools
                )
            )
          );
          return;
        }
        if (event.key === "Home") {
          event.preventDefault();
          setSlashIndex(
            filteredSlashCommands.findIndex(
              (command) => !isSlashCommandDisabled(command, supportsTools)
            )
          );
          return;
        }
        if (event.key === "End") {
          event.preventDefault();
          setSlashIndex(
            filteredSlashCommands
              .map((command, index) => ({ command, index }))
              .reverse()
              .find(
                ({ command }) => !isSlashCommandDisabled(command, supportsTools)
              )?.index ?? 0
          );
          return;
        }
        if (event.key === "Enter" || event.key === "Tab") {
          event.preventDefault();
          const current = filteredSlashCommands[slashIndex];
          const command =
            current && !isSlashCommandDisabled(current, supportsTools)
              ? current
              : selectableSlashCommands[0];
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
          const match = findMentionTokenAtCursor(
            value,
            selectionStart,
            knownMentionLabels
          );
          if (match) {
            event.preventDefault();
            const trailing = value.slice(match.end, selectionStart);
            const deleteTo = /^[ \t\u00a0]+$/.test(trailing)
              ? selectionStart
              : match.end;
            setInput(`${value.slice(0, match.start)}${value.slice(deleteTo)}`);
            requestAnimationFrame(() => {
              try {
                target.setSelectionRange(match.start, match.start);
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
              token: match.token,
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
      knownMentionLabels,
      memoryAtLimit,
      memoryLimit,
      mentionIndex,
      mentionOpen,
      mcpServers,
      pendingProject,
      pendingTools,
      selectableMentionItems,
      selectableSlashCommands,
      setInput,
      slashIndex,
      slashOpen,
      supportsTools,
      togglePendingTool,
    ]
  );

  const handleTextareaBlur = useCallback(() => {
    setTimeout(() => {
      setSlashOpen(false);
      setMentionOpen(false);
    }, 150);
  }, []);

  const activeSlashOptionId =
    slashOpen && filteredSlashCommands[slashIndex]
      ? `${slashMenuId}-option-${slashIndex}`
      : undefined;
  const activeMentionOptionId =
    mentionOpen && filteredMentionItems[mentionIndex]
      ? `${mentionMenuId}-option-${mentionIndex}`
      : undefined;

  return {
    closeMenus,
    customSlashCommands,
    filteredMentionItems,
    filteredSlashCommands,
    handleInput,
    handleMentionSelect,
    handleSlashSelect,
    handleTextareaBlur,
    handleTextareaKeyDown,
    mentionIndex,
    mentionMenuId,
    mentionOpen,
    mentionQuery,
    mentionTriggerPos: mentionTriggerPosRef.current,
    slashIndex,
    slashMenuId,
    slashOpen,
    slashQuery,
    textareaProps: useMemo(
      () => ({
        "aria-activedescendant": mentionOpen
          ? activeMentionOptionId
          : activeSlashOptionId,
        "aria-autocomplete": "list" as const,
        "aria-controls": mentionOpen
          ? mentionMenuId
          : slashOpen
            ? slashMenuId
            : undefined,
        "aria-expanded": mentionOpen || slashOpen,
        onBlur: handleTextareaBlur,
        onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) =>
          handleInput(event.target.value, event.target.selectionStart),
        onKeyDown: handleTextareaKeyDown,
        role: "combobox" as const,
      }),
      [
        activeMentionOptionId,
        activeSlashOptionId,
        handleInput,
        handleTextareaBlur,
        handleTextareaKeyDown,
        mentionMenuId,
        mentionOpen,
        slashMenuId,
        slashOpen,
      ]
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
