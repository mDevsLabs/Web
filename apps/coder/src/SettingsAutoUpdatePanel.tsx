import { useCallback, useEffect, useState } from "react";
import { useI18n } from "./i18n";

type SettingsAutoUpdatePanelProps = {
  shell: NonNullable<Window["maiShell"]> | null;
};

const RELEASES_URL = "https://github.com/mDevsLabs/Coder/releases/latest";

export function SettingsAutoUpdatePanel({
  shell,
}: SettingsAutoUpdatePanelProps) {
  const { t } = useI18n();
  const [currentVersion, setCurrentVersion] = useState("");

  // Récupère la version actuelle (affichage uniquement, pas de recherche auto)
  useEffect(() => {
    if (!shell) return;
    shell
      .invoke("app:getVersion")
      .then((r: unknown) => {
        const v = (r as { version?: string })?.version ?? "";
        setCurrentVersion(v);
      })
      .catch(() => {
        /* ignore */
      });
  }, [shell]);

  const handleSearch = useCallback(() => {
    if (shell) {
      void shell.invoke("shell:openExternalUrl", RELEASES_URL).catch(() => {
        window.open(RELEASES_URL, "_blank", "noopener,noreferrer");
      });
    } else {
      window.open(RELEASES_URL, "_blank", "noopener,noreferrer");
    }
  }, [shell]);

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
              {t("settings.autoUpdate.lead")}
            </p>
          </div>
          <button
            className="ref-settings-add-model"
            onClick={handleSearch}
            type="button"
          >
            Rechercher
          </button>
        </div>
        <p className="ref-settings-agent-card-desc" style={{ marginTop: 12 }}>
          Consultez les dernières versions sur GitHub&nbsp;: {RELEASES_URL}
        </p>
      </div>
    </div>
  );
}
