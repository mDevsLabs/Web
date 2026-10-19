import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
} from "react";
import type { AgentCustomization, TeamSettings } from "../agentSettingsTypes";
import type { ShellLayoutMode } from "../app/shellLayoutStorage";
import type { AppAppearanceSettings } from "../appearanceSettings";
import type { BotIntegrationConfig } from "../botSettingsTypes";
import {
  type AppColorMode,
  type ThemeTransitionOrigin,
  writeStoredColorMode,
} from "../colorMode";
import type { EditorSettings } from "../EditorSettingsPanel";
import type { AppLocale } from "../i18n";
import type { ThinkingLevel } from "../ipcTypes";
import type { McpServerConfig } from "../mcpTypes";
import type { UserLlmProvider, UserModelEntry } from "../modelCatalog";
import type { ProviderIdentitySettings } from "../providerIdentitySettings";

export type LayoutWindowAvailability = Record<ShellLayoutMode, boolean>;

export type UseSettingsPersistenceParams = {
  shell: NonNullable<Window["maiShell"]> | undefined;

  // color mode + transition
  setTransitionOrigin: (origin?: ThemeTransitionOrigin) => void;
  setColorMode: Dispatch<SetStateAction<AppColorMode>>;

  // layout-window availability
  setLayoutWindowAvailability: Dispatch<
    SetStateAction<LayoutWindowAvailability>
  >;
  workspace: string | null;

  // settings page UI
  setSettingsPageOpen: Dispatch<SetStateAction<boolean>>;

  // settings persistence inputs
  locale: AppLocale;
  providerIdentity: ProviderIdentitySettings;
  defaultModel: string;
  modelProviders: UserLlmProvider[];
  modelEntries: UserModelEntry[];
  enabledModelIds: string[];
  thinkingByModelId: Record<string, ThinkingLevel>;
  agentCustomization: AgentCustomization;
  editorSettings: EditorSettings;
  teamSettings: TeamSettings;
  botIntegrations: BotIntegrationConfig[];
  setBotIntegrations: Dispatch<SetStateAction<BotIntegrationConfig[]>>;
  mcpServers: McpServerConfig[];
  colorMode: AppColorMode;
  appearanceSettings: AppAppearanceSettings;
  layoutMode: ShellLayoutMode;
  layoutPinnedBySurface: boolean;
};

export type UseSettingsPersistenceResult = {
  onPersistLanguage: (loc: AppLocale) => Promise<void>;
  onChangeColorMode: (
    next: AppColorMode,
    origin?: ThemeTransitionOrigin
  ) => Promise<void>;
  refreshLayoutWindowAvailability: () => Promise<void>;
  persistSettings: () => Promise<void>;
  onChangeBotIntegrations: (next: BotIntegrationConfig[]) => void;
  closeSettingsPage: () => Promise<void>;
};

/**
 * Persistance IPC des paramètres et détection de disponibilité des fenêtres.
 *
 * Comportement identique à l'ancien App.tsx :
 *  - colorMode écrit en localStorage, IPC et origine de transition ;
 *  - persistSettings écrit tous les slices de settings en une fois vers le processus main ;
 *  - disponibilité des fenêtres rafraîchie au mount / changement workspace / focus / visibilitychange ;
 *  - closeSettingsPage ferme l'UI puis persiste sur disque.
 */
export function useSettingsPersistence(
  params: UseSettingsPersistenceParams
): UseSettingsPersistenceResult {
  const {
    shell,
    setTransitionOrigin,
    setColorMode,
    setLayoutWindowAvailability,
    workspace,
    setSettingsPageOpen,
    locale,
    providerIdentity,
    defaultModel,
    modelProviders,
    modelEntries,
    enabledModelIds,
    thinkingByModelId,
    agentCustomization,
    editorSettings,
    teamSettings,
    botIntegrations,
    setBotIntegrations,
    mcpServers,
    colorMode,
    appearanceSettings,
    layoutMode,
    layoutPinnedBySurface,
  } = params;

  const onPersistLanguage = useCallback(
    async (loc: AppLocale) => {
      if (!shell) {
        return;
      }
      await shell.invoke("settings:set", { language: loc });
    },
    [shell]
  );

  const onChangeColorMode = useCallback(
    async (next: AppColorMode, origin?: ThemeTransitionOrigin) => {
      setTransitionOrigin(origin);
      setColorMode(next);
      writeStoredColorMode(next);
      if (shell) {
        try {
          await shell.invoke("settings:set", { ui: { colorMode: next } });
        } catch (e) {
          console.error("Failed to persist color mode:", e);
        }
      }
    },
    [shell, setTransitionOrigin, setColorMode]
  );

  const refreshLayoutWindowAvailability = useCallback(async () => {
    if (!shell) {
      setLayoutWindowAvailability({ agent: false, editor: false });
      return;
    }
    try {
      const [agentResult, editorResult] = await Promise.all([
        shell.invoke("app:windowSurfaceStatus", "agent"),
        shell.invoke("app:windowSurfaceStatus", "editor"),
      ]);
      const parseExists = (value: unknown) => {
        if (!value || typeof value !== "object") {
          return false;
        }
        const result = value as { ok?: boolean; exists?: boolean };
        return !!(result.ok && result.exists);
      };
      setLayoutWindowAvailability({
        agent: parseExists(agentResult),
        editor: parseExists(editorResult),
      });
    } catch {
      setLayoutWindowAvailability({ agent: false, editor: false });
    }
  }, [shell, setLayoutWindowAvailability]);

  useEffect(() => {
    void refreshLayoutWindowAvailability();
  }, [refreshLayoutWindowAvailability, workspace]);

  useEffect(() => {
    const handleFocus = () => {
      void refreshLayoutWindowAvailability();
    };
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void refreshLayoutWindowAvailability();
      }
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshLayoutWindowAvailability]);

  const persistSettings = useCallback(async () => {
    if (!shell) {
      return;
    }
    await shell.invoke("settings:set", {
      agent: {
        backgroundForkAgent: agentCustomization.backgroundForkAgent,
        commands: agentCustomization.commands ?? [],
        confirmShellCommands: agentCustomization.confirmShellCommands,
        confirmWritesBeforeExecute:
          agentCustomization.confirmWritesBeforeExecute,
        importThirdPartyConfigs: true,
        maxConsecutiveMistakes: agentCustomization.maxConsecutiveMistakes,
        memoryExtraction: agentCustomization.memoryExtraction,
        mistakeLimitEnabled: agentCustomization.mistakeLimitEnabled,
        rules: agentCustomization.rules ?? [],
        shellPermissionMode: agentCustomization.shellPermissionMode,
        shouldAvoidPermissionPrompts:
          agentCustomization.shouldAvoidPermissionPrompts,
        skills: agentCustomization.skills ?? [],
        skipSafeShellCommandsConfirm:
          agentCustomization.skipSafeShellCommandsConfirm,
        subagents: agentCustomization.subagents ?? [],
        toolPermissionRules: agentCustomization.toolPermissionRules ?? [],
      },
      anthropic: { apiKey: undefined, baseURL: undefined },
      bots: { integrations: botIntegrations },
      defaultModel,
      editor: editorSettings,
      gemini: { apiKey: undefined },
      language: locale,
      mcp: { servers: mcpServers },
      models: {
        enabledIds: enabledModelIds,
        entries: modelEntries,
        providers: modelProviders,
        thinkingByModelId,
      },
      openAI: { apiKey: undefined, baseURL: undefined, proxyUrl: undefined },
      providerIdentity,
      team: teamSettings,
      ui: {
        accentColor: appearanceSettings.accentColor,
        backgroundColor: appearanceSettings.backgroundColor,
        codeFontPreset: appearanceSettings.codeFontPreset,
        codeFontSize: appearanceSettings.codeFontSize,
        colorMode,
        contrast: appearanceSettings.contrast,
        fontPreset: appearanceSettings.uiFontPreset,
        foregroundColor: appearanceSettings.foregroundColor,
        themePresetId: appearanceSettings.themePresetId,
        translucentSidebar: appearanceSettings.translucentSidebar,
        uiFontPreset: appearanceSettings.uiFontPreset,
        uiFontSize: appearanceSettings.uiFontSize,
        usePointerCursors: appearanceSettings.usePointerCursors,
        ...(layoutPinnedBySurface ? {} : { layoutMode }),
      },
    });
  }, [
    shell,
    modelProviders,
    defaultModel,
    modelEntries,
    enabledModelIds,
    thinkingByModelId,
    providerIdentity,
    agentCustomization,
    editorSettings,
    locale,
    mcpServers,
    teamSettings,
    botIntegrations,
    colorMode,
    appearanceSettings,
    layoutMode,
    layoutPinnedBySurface,
  ]);

  const onChangeBotIntegrations = useCallback(
    (next: BotIntegrationConfig[]) => {
      setBotIntegrations(next);
      if (!shell) {
        return;
      }
      void shell.invoke("settings:set", {
        bots: { integrations: next },
      });
    },
    [shell, setBotIntegrations]
  );

  /** Ferme la page de paramètres puis persiste les réglages sur disque. */
  const closeSettingsPage = useCallback(async () => {
    setSettingsPageOpen(false);
    try {
      await persistSettings();
    } catch (e) {
      console.error("Failed to persist settings:", e);
    }
  }, [persistSettings, setSettingsPageOpen]);

  return {
    closeSettingsPage,
    onChangeBotIntegrations,
    onChangeColorMode,
    onPersistLanguage,
    persistSettings,
    refreshLayoutWindowAvailability,
  };
}
