import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AgentCustomization,
  AgentMemoryExtractionSettings,
} from "./agentSettingsTypes";
import { defaultAgentCustomization } from "./agentSettingsTypes";
import { useI18n } from "./i18n";

type MemoryStats = {
  ok?: boolean;
  workspaceRoot?: string | null;
  memoryDir?: string | null;
  entrypointPath?: string | null;
  entrypointExists?: boolean;
  topicFiles?: number;
  entryCount?: number;
};

type ShellApi = NonNullable<Window["maiShell"]>;

type Props = {
  shell: ShellApi | null;
  workspaceOpen: boolean;
  /** 会话记忆抽取阈值写入 `agent.memoryExtraction` */
  agentCustomization: AgentCustomization;
  onChangeAgentCustomization: (next: AgentCustomization) => void;
};

export function SettingsIndexingPanel({
  shell,
  workspaceOpen,
  agentCustomization,
  onChangeAgentCustomization,
}: Props) {
  const { t } = useI18n();
  const av = useMemo(
    () => ({ ...defaultAgentCustomization(), ...agentCustomization }),
    [agentCustomization]
  );
  const patchAgent = useCallback(
    (p: Partial<AgentCustomization>) => {
      onChangeAgentCustomization({ ...av, ...p });
    },
    [av, onChangeAgentCustomization]
  );
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [memoryLoading, setMemoryLoading] = useState(false);
  const [memoryRebuilding, setMemoryRebuilding] = useState(false);

  const refreshMemoryStats = useCallback(async () => {
    if (!shell || !workspaceOpen) {
      setMemoryStats(null);
      return;
    }
    setMemoryLoading(true);
    try {
      const r = (await shell.invoke("workspace:memory:stats")) as MemoryStats;
      setMemoryStats(r?.ok ? r : null);
    } catch {
      setMemoryStats(null);
    } finally {
      setMemoryLoading(false);
    }
  }, [shell, workspaceOpen]);

  useEffect(() => {
    void refreshMemoryStats();
  }, [refreshMemoryStats, workspaceOpen]);

  const runMemoryRebuild = async () => {
    if (!shell || !workspaceOpen) {
      return;
    }
    setMemoryRebuilding(true);
    try {
      await shell.invoke("workspace:memory:rebuild");
      await refreshMemoryStats();
    } finally {
      setMemoryRebuilding(false);
    }
  };

  const revealAbsolutePath = async (absPath: string | null | undefined) => {
    if (!shell || !absPath) {
      return;
    }
    await shell.invoke("shell:revealAbsolutePath", absPath);
  };

  return (
    <div className="ref-settings-panel ref-settings-panel--indexing">
      <p className="ref-settings-lead">{t("settings.indexing.lead")}</p>

      <h2 className="ref-settings-subhead" style={{ marginTop: 28 }}>
        {t("settings.indexing.memoryTitle")}
      </h2>
      <p className="ref-settings-proxy-hint">
        {t("settings.indexing.memoryLead")}
      </p>
      <div className="ref-settings-agent-card">
        <div className="ref-settings-agent-card-row">
          <div>
            <div className="ref-settings-agent-card-title">
              {t("settings.indexing.memoryLayoutTitle")}
            </div>
            <p className="ref-settings-agent-card-desc">
              {t("settings.indexing.memoryLayoutDesc")}
            </p>
          </div>
        </div>
        <div className="ref-settings-agent-card-row" style={{ marginTop: 12 }}>
          <div>
            <div className="ref-settings-agent-card-title">
              {t("settings.indexing.memoryAgentTitle")}
            </div>
            <p className="ref-settings-agent-card-desc">
              {t("settings.indexing.memoryAgentDesc")}
            </p>
          </div>
        </div>
      </div>
      <h2 className="ref-settings-subhead" style={{ marginTop: 24 }}>
        {t("settings.indexing.memoryStatsTitle")}
      </h2>
      <p className="ref-settings-proxy-hint">
        {t("settings.indexing.memoryStatsHint")}
      </p>
      <div className="ref-settings-indexing-stats">
        {workspaceOpen ? (
          memoryLoading ? (
            <p className="ref-settings-proxy-hint">
              {t("settings.indexing.statsLoading")}
            </p>
          ) : memoryStats ? (
            <ul className="ref-settings-indexing-stat-list">
              <li>
                {t("settings.indexing.memoryDir")}:{" "}
                <strong>{memoryStats.memoryDir ?? "—"}</strong>
              </li>
              <li>
                {t("settings.indexing.memoryEntrypoint")}:{" "}
                <strong>{memoryStats.entrypointPath ?? "—"}</strong>
              </li>
              <li>
                {t("settings.indexing.memoryTopicFiles")}:{" "}
                <strong>{memoryStats.topicFiles ?? 0}</strong>
              </li>
              <li>
                {t("settings.indexing.memoryIndexEntries")}:{" "}
                <strong>{memoryStats.entryCount ?? 0}</strong>
              </li>
            </ul>
          ) : (
            <p className="ref-settings-proxy-hint">
              {t("settings.indexing.statsUnavailable")}
            </p>
          )
        ) : (
          <p className="ref-settings-proxy-hint">
            {t("settings.indexing.noWorkspace")}
          </p>
        )}
      </div>
      <div className="ref-settings-indexing-actions">
        <button
          className="ref-settings-add-model"
          disabled={
            !shell || !workspaceOpen || memoryLoading || memoryRebuilding
          }
          onClick={() => void runMemoryRebuild()}
          type="button"
        >
          {memoryRebuilding
            ? t("settings.indexing.rebuilding")
            : t("settings.indexing.rebuildMemory")}
        </button>
        <button
          className="ref-settings-add-model"
          disabled={
            !shell || !workspaceOpen || memoryLoading || !memoryStats?.memoryDir
          }
          onClick={() => void revealAbsolutePath(memoryStats?.memoryDir)}
          type="button"
        >
          {t("settings.indexing.openMemoryDir")}
        </button>
        <button
          className="ref-settings-add-model"
          disabled={
            !shell ||
            !workspaceOpen ||
            memoryLoading ||
            !memoryStats?.entrypointPath
          }
          onClick={() => void revealAbsolutePath(memoryStats?.entrypointPath)}
          type="button"
        >
          {t("settings.indexing.openMemoryEntrypoint")}
        </button>
        <button
          className="ref-settings-set-default"
          disabled={
            !shell || !workspaceOpen || memoryLoading || memoryRebuilding
          }
          onClick={() => void refreshMemoryStats()}
          type="button"
        >
          {t("settings.indexing.refreshMemoryStats")}
        </button>
      </div>

      <h2 className="ref-settings-subhead" style={{ marginTop: 28 }}>
        {t("agentBehavior.memoryExtractionTitle")}
      </h2>
      <p className="ref-settings-proxy-hint">
        {t("agentBehavior.memoryExtractionDesc")}
      </p>
      <div className="ref-settings-agent-card">
        <div className="ref-settings-agent-card-row">
          <div>
            <div className="ref-settings-agent-card-title">
              {t("agentBehavior.memoryExtractionEnabled")}
            </div>
          </div>
          <button
            aria-checked={av.memoryExtraction?.enabled !== false}
            className={`ref-settings-toggle ${av.memoryExtraction?.enabled === false ? "" : "is-on"}`}
            onClick={() => {
              const cur: AgentMemoryExtractionSettings = {
                ...(av.memoryExtraction ?? {}),
              };
              const on = cur.enabled !== false;
              patchAgent({
                memoryExtraction: {
                  ...cur,
                  enabled: on ? false : true,
                },
              });
            }}
            role="switch"
            type="button"
          >
            <span className="ref-settings-toggle-knob" />
          </button>
        </div>
        <div
          className="ref-settings-agent-card-row"
          style={{
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            marginTop: 12,
          }}
        >
          <label className="ref-settings-field ref-settings-field--compact">
            <span>{t("agentBehavior.memFirst")}</span>
            <input
              className="ref-settings-agent-number"
              disabled={av.memoryExtraction?.enabled === false}
              max={50}
              min={1}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                if (!Number.isFinite(n)) return;
                patchAgent({
                  memoryExtraction: {
                    ...(av.memoryExtraction ?? {}),
                    minNonSystemMessagesBeforeFirst: Math.min(
                      50,
                      Math.max(1, n)
                    ),
                  },
                });
              }}
              type="number"
              value={av.memoryExtraction?.minNonSystemMessagesBeforeFirst ?? 4}
            />
          </label>
          <label className="ref-settings-field ref-settings-field--compact">
            <span>{t("agentBehavior.memBetween")}</span>
            <input
              className="ref-settings-agent-number"
              disabled={av.memoryExtraction?.enabled === false}
              max={50}
              min={1}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                if (!Number.isFinite(n)) return;
                patchAgent({
                  memoryExtraction: {
                    ...(av.memoryExtraction ?? {}),
                    minNonSystemMessagesBetween: Math.min(50, Math.max(1, n)),
                  },
                });
              }}
              type="number"
              value={av.memoryExtraction?.minNonSystemMessagesBetween ?? 3}
            />
          </label>
          <label className="ref-settings-field ref-settings-field--compact">
            <span>{t("agentBehavior.memTools")}</span>
            <input
              className="ref-settings-agent-number"
              disabled={av.memoryExtraction?.enabled === false}
              max={50}
              min={0}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                if (!Number.isFinite(n)) return;
                patchAgent({
                  memoryExtraction: {
                    ...(av.memoryExtraction ?? {}),
                    minToolCallsBetween: Math.min(50, Math.max(0, n)),
                  },
                });
              }}
              type="number"
              value={av.memoryExtraction?.minToolCallsBetween ?? 3}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
