import { useCallback, useEffect, useState } from "react";
import { type TFunction, useI18n } from "./i18n";
import type { AutoUpdateStatus } from "./ipcTypes";

type SettingsAutoUpdatePanelProps = {
  shell: NonNullable<Window["maiShell"]> | null;
};

// Les installateurs Coder sont attachés aux releases du dépôt principal. Le
// dépôt `mDevsLabs/Coder` n'est plus alimenté (dernière version 0.5.5) : y
// renvoyer l'utilisateur lui propose une version plus ancienne que la sienne.
const RELEASES_URL = "https://github.com/mDevsLabs/Web/releases";

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "";
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function statusLabel(
  status: AutoUpdateStatus | null,
  t: TFunction
): string {
  if (!status || status.state === "idle") {
    return t("settings.autoUpdate.checkForUpdates");
  }
  switch (status.state) {
    case "checking":
      return t("settings.autoUpdate.checking");
    case "available":
      return `${t("settings.autoUpdate.available")} · v${status.info.version}`;
    case "not-available":
      return t("settings.autoUpdate.upToDate");
    case "downloading":
      return `${t("settings.autoUpdate.downloading")} · ${Math.round(status.progress.percent)}%`;
    case "downloaded":
      return t("settings.autoUpdate.downloaded");
    case "error":
      return status.message;
    default:
      return t("settings.autoUpdate.checkForUpdates");
  }
}

export function SettingsAutoUpdatePanel({
  shell,
}: SettingsAutoUpdatePanelProps) {
  const { t } = useI18n();
  const [currentVersion, setCurrentVersion] = useState("");
  const [embedded, setEmbedded] = useState(false);
  const [embeddedVersion, setEmbeddedVersion] = useState("");
  const [status, setStatus] = useState<AutoUpdateStatus | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!shell) return;
    let active = true;
    void shell
      .invoke("app:getVersion")
      .then((r: unknown) => {
        if (!active) return;
        const info = (r ?? {}) as {
          embedded?: boolean;
          embeddedVersion?: string;
          version?: string;
        };
        setCurrentVersion(info.version ?? "");
        setEmbedded(Boolean(info.embedded));
        setEmbeddedVersion(info.embeddedVersion ?? "");
      })
      .catch(() => {
        /* ignore */
      });
    void shell
      .invoke("auto-update:get-status")
      .then((next: unknown) => {
        if (active) setStatus((next as AutoUpdateStatus) ?? null);
      })
      .catch(() => {
        /* ignore */
      });
    const unsubscribe = shell.subscribeAutoUpdateStatus?.(
      (next: unknown) => setStatus((next as AutoUpdateStatus) ?? null)
    );
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [shell]);

  const run = useCallback(
    async (channel: string) => {
      if (!shell || busy) return;
      setBusy(true);
      try {
        const next = (await shell.invoke(channel)) as
          | AutoUpdateStatus
          | { ok?: boolean; error?: string }
          | void;
        if (next && typeof next === "object" && "state" in next) {
          setStatus(next as AutoUpdateStatus);
        } else if (
          next &&
          typeof next === "object" &&
          "ok" in next &&
          (next as { ok?: boolean }).ok === false
        ) {
          // Les canaux download/install répondent { ok, error } : sans ce
          // relais, un échec resterait invisible et le bouton semblerait
          // n'avoir rien fait.
          setStatus({
            message:
              (next as { error?: string }).error ??
              "L’opération de mise à jour a échoué.",
            state: "error",
          });
        }
      } catch (error) {
        setStatus({
          message: error instanceof Error ? error.message : String(error),
          state: "error",
        });
      } finally {
        setBusy(false);
      }
    },
    [busy, shell]
  );

  const handleSearch = useCallback(() => {
    if (shell) {
      void shell.invoke("shell:openExternalUrl", RELEASES_URL).catch(() => {
        window.open(RELEASES_URL, "_blank", "noopener,noreferrer");
      });
    } else {
      window.open(RELEASES_URL, "_blank", "noopener,noreferrer");
    }
  }, [shell]);

  const downloadPath =
    status?.state === "downloaded" ? status.downloadPath : undefined;
  const unsignedMac =
    status?.state === "downloaded" &&
    status.platform === "darwin" &&
    !status.isSigned;

  return (
    <div className="ref-settings-panel">
      <p className="ref-settings-lead">{t("settings.autoUpdate.lead")}</p>

      <h2 className="ref-settings-subhead">
        {t("settings.autoUpdate.currentVersion")}
      </h2>
      <div className="ref-settings-agent-card">
        <div className="ref-settings-agent-card-row">
          <div>
            <div className="ref-settings-agent-card-title">
              mAI Coder v{currentVersion || "—"}
            </div>
            <p className="ref-settings-agent-card-desc">
              {embedded
                ? t("settings.autoUpdate.embedded", {
                    version: embeddedVersion || currentVersion || "—",
                  })
                : t("settings.autoUpdate.lead")}
            </p>
          </div>
          <button
            className="ref-settings-add-model"
            disabled={embedded || busy || !shell}
            onClick={() => void run("auto-update:check")}
            type="button"
          >
            {t("settings.autoUpdate.checkForUpdates")}
          </button>
        </div>

        <div
          className="ref-settings-agent-card-desc"
          style={{ marginTop: 12 }}
          role="status"
        >
          {embedded
            ? t("settings.autoUpdate.embeddedStatus")
            : statusLabel(status, t)}
        </div>

        {status?.state === "downloading" ? (
          <div
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={Math.round(status.progress.percent)}
            role="progressbar"
            style={{
              background: "rgba(255,255,255,0.08)",
              borderRadius: 999,
              height: 6,
              marginTop: 10,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background: "var(--void-accent)",
                height: "100%",
                transition: "width 0.2s ease",
                width: `${Math.max(0, Math.min(100, status.progress.percent))}%`,
              }}
            />
          </div>
        ) : null}

        {status?.state === "downloading" ? (
          <p className="ref-settings-agent-card-desc" style={{ marginTop: 6 }}>
            {formatBytes(status.progress.transferred)} /{" "}
            {formatBytes(status.progress.total)}
          </p>
        ) : null}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {status?.state === "available" && !embedded ? (
            <button
              className="ref-settings-add-model"
              disabled={busy}
              onClick={() => void run("auto-update:download")}
              type="button"
            >
              {t("settings.autoUpdate.downloadNow")}
            </button>
          ) : null}
          {status?.state === "downloaded" && !embedded ? (
            <button
              className="ref-settings-add-model"
              disabled={busy}
              onClick={() =>
                void run(unsignedMac ? "auto-update:open-folder" : "auto-update:install")
              }
              type="button"
            >
              {unsignedMac
                ? t("app.openDownloadFolder")
                : t("settings.autoUpdate.restartNow")}
            </button>
          ) : null}
          {downloadPath ? (
            <button
              className="ref-settings-add-model"
              onClick={() => void shell?.invoke("auto-update:open-folder")}
              type="button"
            >
              {t("app.openDownloadFolder")}
            </button>
          ) : null}
          <button
            className="ref-settings-add-model"
            onClick={handleSearch}
            type="button"
          >
            {t("app.help.releases")}
          </button>
        </div>

        <p className="ref-settings-agent-card-desc" style={{ marginTop: 12 }}>
          {RELEASES_URL}
        </p>
      </div>
    </div>
  );
}
