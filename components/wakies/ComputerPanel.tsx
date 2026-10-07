"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/components/wakies/api";
import type {
  ComputerAction,
  ComputerStatus,
} from "@/lib/wakies/shared/computer-types";
import type { Wakie } from "@/lib/wakies/shared/types";

type Screen = {
  base64: string;
  width: number;
  height: number;
  url: string;
  capturedAt: number;
};

// L'interface est monolingue français (AGENTS.md §7) : les valeurs techniques
// envoyées au service d'ordinateur restent en anglais, seul l'affichage est
// traduit. Une valeur inconnue retombe sur son nom brut.
const TABS = {
  Activity: "Activité",
  Browser: "Navigateur",
  Files: "Fichiers",
  Terminal: "Terminal",
} as const;

const STATES = {
  not_configured: "Non configuré",
  running: "En marche",
  stopped: "Arrêté",
  unavailable: "Indisponible",
} as const;

const OUTCOMES = {
  failed: "Échec",
  pending: "En cours",
  succeeded: "Réussi",
} as const;

const AUDIT_ACTIONS: Record<string, string> = {
  files_list: "liste des fichiers",
  files_read: "lecture d’un fichier",
  files_write: "écriture d’un fichier",
  human_click: "clic",
  human_key: "touche",
  human_release: "restitution du contrôle",
  human_scroll: "défilement",
  human_take: "prise de contrôle",
  human_type: "saisie",
  navigate: "navigation",
  read: "lecture de page",
  screenshot: "capture d’écran",
  scroll: "défilement",
  snapshot: "inspection",
  start: "démarrage",
  stop: "arrêt",
  take: "prise de contrôle",
};

// Touches envoyées telles quelles au service : `value` est technique, `label`
// est ce que l'utilisateur lit.
const KEYS = [
  { label: "Entrée", value: "Enter" },
  { label: "Tabulation", value: "Tab" },
  { label: "Échap", value: "Escape" },
  { label: "Retour arrière", value: "Backspace" },
  { label: "Flèche haut", value: "ArrowUp" },
  { label: "Flèche bas", value: "ArrowDown" },
  { label: "Flèche gauche", value: "ArrowLeft" },
  { label: "Flèche droite", value: "ArrowRight" },
];

export function ComputerPanel({ wakie }: { wakie: Wakie }) {
  const [tab, setTab] = useState<"Browser" | "Files" | "Terminal" | "Activity">(
    "Browser"
  );
  const [status, setStatus] = useState<ComputerStatus>();
  const [screen, setScreen] = useState<Screen>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [key, setKey] = useState("Enter");
  const [point, setPoint] = useState({ x: 0, y: 0 });
  const [path, setPath] = useState("");
  const [contents, setContents] = useState("");
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState("");
  const [screenError, setScreenError] = useState("");
  const lifecycle = useRef({
    active: false,
    busy: false,
    loaded: false,
    revision: 0,
    running: false,
  });
  const controller = useRef<AbortController | null>(null);
  const base = `/wakies/${encodeURIComponent(wakie.id)}/computer`;
  const refresh = useCallback(async () => {
    const revision = lifecycle.current.revision;
    const current = () =>
      lifecycle.current.active && revision === lifecycle.current.revision;
    try {
      const next = await api<ComputerStatus>(
        base,
        "GET",
        undefined,
        controller.current?.signal
      );
      if (!current()) return;
      setStatus(next);
      lifecycle.current.loaded = true;
      lifecycle.current.running = next.state === "running";
      setError("");
      if (
        next.state === "running" &&
        next.permissions.browser &&
        next.permissions.enabled
      ) {
        try {
          const capture = await api<Screen>(
            `${base}/actions`,
            "POST",
            { action: "screenshot", input: {} },
            controller.current?.signal
          );
          if (current()) {
            setScreen(capture);
            setScreenError("");
          }
        } catch (cause) {
          if (current()) {
            setScreen(undefined);
            setScreenError(
              cause instanceof Error
                ? cause.message
                : "Impossible d’actualiser l’écran."
            );
          }
        }
      } else {
        setScreen(undefined);
        setScreenError("");
      }
    } catch (cause) {
      if (current()) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Impossible de charger l’ordinateur."
        );
        setScreen(undefined);
      }
    }
  }, [base]);
  useEffect(() => {
    lifecycle.current.active = true;
    controller.current = new AbortController();
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      if (
        !document.hidden &&
        !lifecycle.current.busy &&
        (!lifecycle.current.loaded || lifecycle.current.running)
      )
        await refresh();
      if (!cancelled && lifecycle.current.active)
        timer = setTimeout(() => void poll(), 4000);
    };
    void poll();
    return () => {
      cancelled = true;
      lifecycle.current.active = false;
      lifecycle.current.revision++;
      controller.current?.abort();
      clearTimeout(timer);
    };
  }, [refresh]);
  const run = async (
    endpoint: string,
    body: unknown = {},
    method = "POST",
    showOutput = false
  ) => {
    if (lifecycle.current.busy) return;
    lifecycle.current.busy = true;
    lifecycle.current.revision++;
    setBusy(true);
    setError("");
    try {
      const result = await api<unknown>(
        `${base}${endpoint}`,
        method,
        body,
        controller.current?.signal
      );
      if (!lifecycle.current.active) return;
      if (showOutput)
        setOutput(
          typeof result === "string" ? result : JSON.stringify(result, null, 2)
        );
      await refresh();
      return result;
    } catch (cause) {
      if (lifecycle.current.active)
        setError(
          cause instanceof Error
            ? cause.message
            : "L’action sur l’ordinateur a échoué."
        );
    } finally {
      lifecycle.current.busy = false;
      if (lifecycle.current.active) setBusy(false);
    }
  };
  const action = (action: ComputerAction, input: unknown, showOutput = false) =>
    run("/actions", { action, input }, "POST", showOutput);
  const running = status?.state === "running" && status.permissions.enabled;
  const human =
    status?.control?.holder === "human" && !status.control.transitioning;
  const browser = !!running && !!status?.permissions.browser;
  return (
    <section
      aria-busy={busy}
      aria-label={`${wakie.name}'s computer`}
      className="computer-panel"
    >
      {error && (
        <p className="computer-error" role="alert">
          {error}
        </p>
      )}
      {status ? (
        <>
          <div className="computer-status">
            <strong>{STATES[status.state]}</strong>
            {status.state !== "running" && (
              <button disabled={busy} onClick={() => void refresh()}>
                Actualiser
              </button>
            )}
            <span>
              {busy
                ? "Traitement…"
                : human
                  ? "Vous avez le contrôle"
                  : "Contrôle par le Wakie"}
            </span>
          </div>
          {!status.configured && (
            <div className="computer-setup">
              <h3>Connecter un service d’ordinateur</h3>
              <p>
                Aucun service d’ordinateur n’est configuré pour ce Wakie.
                Renseignez l’URL et le jeton du service d’ordinateur du serveur,
                puis redémarrez. Chaque Wakie dispose de son propre navigateur
                et de son propre espace de travail.
              </p>
              <a
                href="https://github.com/CopilotKit/Wakies/blob/main/docs/COMPUTERS.md"
                rel="noreferrer"
                target="_blank"
              >
                Guide de configuration des ordinateurs ↗
              </a>
            </div>
          )}
          {status.error && (
            <p className="computer-error" role="alert">
              {status.error}
            </p>
          )}
          <div
            aria-label="Outils de l’ordinateur"
            className="computer-tool-tabs"
            role="tablist"
          >
            {(["Browser", "Files", "Terminal", "Activity"] as const).map(
              (name) => (
                <button
                  aria-selected={tab === name}
                  key={name}
                  onClick={() => setTab(name)}
                  role="tab"
                >
                  {TABS[name]}
                </button>
              )
            )}
          </div>
          {status.configured && (
            <>
              <section
                className="computer-section computer-browser"
                hidden={tab !== "Browser"}
              >
                {!status.permissions.browser && (
                  <p>
                    Activez la permission « Navigateur » pour utiliser l’écran.
                  </p>
                )}
                <form
                  className="computer-row"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void action("navigate", { url });
                  }}
                >
                  <input
                    aria-label="URL du navigateur"
                    disabled={!browser || busy || human}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="https://example.com"
                    required
                    type="url"
                    value={url}
                  />
                  <button disabled={!browser || busy || human || !url.trim()}>
                    Aller
                  </button>
                </form>
                {screenError && (
                  <p className="computer-error" role="status">
                    {screenError}
                  </p>
                )}
                {screen ? (
                  <>
                    <div className="computer-current-url" title={screen.url}>
                      {screen.url || "Écran du navigateur"}
                    </div>
                    <button
                      aria-label={
                        human
                          ? "Cliquez sur un point de l’écran de l’ordinateur"
                          : "Écran de l’ordinateur ; prenez le contrôle pour interagir"
                      }
                      className="computer-screen"
                      disabled={!browser || !human || busy}
                      onClick={(event) => {
                        const rect =
                          event.currentTarget.getBoundingClientRect();
                        void action("human_click", {
                          x: Math.min(
                            screen.width - 1,
                            Math.max(
                              0,
                              Math.floor(
                                ((event.clientX - rect.left) / rect.width) *
                                  screen.width
                              )
                            )
                          ),
                          y: Math.min(
                            screen.height - 1,
                            Math.max(
                              0,
                              Math.floor(
                                ((event.clientY - rect.top) / rect.height) *
                                  screen.height
                              )
                            )
                          ),
                        });
                      }}
                    >
                      <img
                        alt={`Écran de navigateur en direct pour ${wakie.name}`}
                        src={`data:image/png;base64,${screen.base64}`}
                      />
                    </button>
                    <small>
                      Actualisé{" "}
                      {new Date(screen.capturedAt).toLocaleTimeString()}.
                      L’écran se met à jour tant que ce panneau est ouvert.
                    </small>
                  </>
                ) : (
                  <p className="computer-screen-empty">
                    {running && status.permissions.browser
                      ? "En attente de l’écran du navigateur…"
                      : "Démarrez l’ordinateur avec la permission « Navigateur » pour voir son écran."}
                  </p>
                )}
                <div className="computer-control-pill">
                  <span>
                    {human
                      ? "Vous avez le contrôle"
                      : `${wakie.name} a le contrôle`}
                  </span>
                  <button
                    disabled={
                      (!human && !browser) ||
                      busy ||
                      status.control?.transitioning
                    }
                    onClick={() => void run(human ? "/release" : "/take")}
                  >
                    {human ? "Rendre le contrôle" : "Prendre le contrôle"}
                  </button>
                </div>
                {status.control?.transitioning && (
                  <p role="status">Transfert du contrôle…</p>
                )}
                {human && (
                  <details className="computer-human">
                    <summary>Clavier et commandes précises</summary>
                    <p>
                      Cliquez sur l’écran ou saisissez les coordonnées
                      ci-dessous. Le texte est envoyé directement à ce
                      navigateur, hors du chat. Rendez le contrôle à la fin.
                    </p>
                    <form
                      className="computer-row"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void action("human_click", point);
                      }}
                    >
                      <label>
                        X
                        <input
                          max={screen ? screen.width - 1 : undefined}
                          min="0"
                          onChange={(event) =>
                            setPoint({
                              ...point,
                              x: Number(event.target.value),
                            })
                          }
                          type="number"
                          value={point.x}
                        />
                      </label>
                      <label>
                        Y
                        <input
                          max={screen ? screen.height - 1 : undefined}
                          min="0"
                          onChange={(event) =>
                            setPoint({
                              ...point,
                              y: Number(event.target.value),
                            })
                          }
                          type="number"
                          value={point.y}
                        />
                      </label>
                      <button disabled={busy || !browser || !screen}>
                        Cliquer
                      </button>
                    </form>
                    <form
                      className="computer-row"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const value = text;
                        setText("");
                        void action("human_type", { text: value });
                      }}
                    >
                      <input
                        aria-label="Texte à saisir dans l’ordinateur"
                        autoComplete="off"
                        maxLength={20_000}
                        onChange={(event) => setText(event.target.value)}
                        placeholder="Saisir dans le champ ciblé"
                        type="password"
                        value={text}
                      />
                      <button disabled={busy || !browser || !text}>
                        Saisir
                      </button>
                    </form>
                    <form
                      className="computer-row"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void action("human_key", { key });
                      }}
                    >
                      <select
                        aria-label="Touche à appuyer"
                        onChange={(event) => setKey(event.target.value)}
                        value={key}
                      >
                        {KEYS.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                      <button disabled={busy || !browser}>
                        Appuyer sur la touche
                      </button>
                    </form>
                    <div className="computer-actions">
                      <button
                        disabled={busy || !browser}
                        onClick={() =>
                          void action("human_scroll", { deltaY: -500 })
                        }
                      >
                        Défiler vers le haut
                      </button>
                      <button
                        disabled={busy || !browser}
                        onClick={() =>
                          void action("human_scroll", { deltaY: 500 })
                        }
                      >
                        Défiler vers le bas
                      </button>
                    </div>
                  </details>
                )}
              </section>
              <details
                className="computer-section"
                hidden={tab !== "Files"}
                open
              >
                <summary>Fichiers de l’espace de travail</summary>
                <p>
                  Les chemins sont relatifs à l’espace de travail persistant de
                  ce Wakie.
                </p>
                <label>
                  Chemin
                  <input
                    disabled={!running || !status.permissions.files || busy}
                    onChange={(event) => setPath(event.target.value)}
                    placeholder="notes.txt"
                    value={path}
                  />
                </label>
                <div className="computer-actions">
                  <button
                    disabled={!running || !status.permissions.files || busy}
                    onClick={() => void action("files_list", { path }, true)}
                  >
                    Lister les fichiers
                  </button>
                  <button
                    disabled={
                      !running ||
                      !status.permissions.files ||
                      busy ||
                      !path.trim()
                    }
                    onClick={() =>
                      void action("files_read", { path }, true).then(
                        (result) => {
                          if (
                            lifecycle.current.active &&
                            result &&
                            typeof result === "object" &&
                            "text" in result &&
                            typeof result.text === "string"
                          )
                            setContents(result.text);
                        }
                      )
                    }
                  >
                    Lire le fichier
                  </button>
                </div>
                <label>
                  Contenu du fichier
                  <textarea
                    aria-label="Contenu du fichier à enregistrer"
                    disabled={!running || !status.permissions.files || busy}
                    maxLength={100_000}
                    onChange={(event) => setContents(event.target.value)}
                    rows={5}
                    value={contents}
                  />
                </label>
                <button
                  disabled={
                    !running ||
                    !status.permissions.files ||
                    busy ||
                    !path.trim()
                  }
                  onClick={() =>
                    void action("files_write", { contents, path }, true)
                  }
                >
                  Enregistrer le fichier (remplace le contenu)
                </button>
                {!status.permissions.files && (
                  <p>
                    Activez la permission « Fichiers de l’espace de travail »
                    pour utiliser ces commandes.
                  </p>
                )}
              </details>
              <details
                className="computer-section"
                hidden={tab !== "Terminal"}
                open
              >
                <summary>Terminal</summary>
                <p>
                  S’exécute dans l’ordinateur de ce Wakie. Les commandes
                  s’interrompent au bout de 30 secondes.
                </p>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void action("exec", { command, timeoutMs: 30_000 }, true);
                  }}
                >
                  <textarea
                    aria-label="Commande du terminal"
                    disabled={!running || !status.permissions.shell || busy}
                    maxLength={8000}
                    onChange={(event) => setCommand(event.target.value)}
                    placeholder="pwd"
                    rows={3}
                    value={command}
                  />
                  <button
                    disabled={
                      !running ||
                      !status.permissions.shell ||
                      busy ||
                      !command.trim()
                    }
                  >
                    Exécuter la commande
                  </button>
                </form>
                {!status.permissions.shell && (
                  <p>
                    Activez la permission « Commandes du terminal » pour
                    exécuter des commandes.
                  </p>
                )}
              </details>
              {output && (tab === "Files" || tab === "Terminal") && (
                <section className="computer-section">
                  <h3>Sortie</h3>
                  <pre>{output}</pre>
                  <button onClick={() => setOutput("")}>
                    Effacer la sortie
                  </button>
                </section>
              )}
            </>
          )}
          <details
            className="computer-section"
            hidden={tab !== "Activity"}
            open
          >
            <summary>Activité récente</summary>
            {status.audit.length ? (
              <ol className="computer-audit">
                {status.audit
                  .slice(-30)
                  .reverse()
                  .map((entry) => (
                    <li key={entry.id}>
                      <strong>
                        {AUDIT_ACTIONS[entry.action] ??
                          entry.action.replaceAll("_", " ")}
                      </strong>
                      <span>
                        {entry.actor} · {OUTCOMES[entry.outcome]} ·{" "}
                        {new Date(entry.createdAt).toLocaleTimeString()}
                      </span>
                    </li>
                  ))}
              </ol>
            ) : (
              <p>Aucune action sur l’ordinateur pour l’instant.</p>
            )}
          </details>
          <details className="computer-settings">
            <summary>Paramètres de l’ordinateur</summary>{" "}
            <details
              className="computer-permissions"
              open={!status.permissions.enabled}
            >
              <summary>Permissions de l’ordinateur</summary>
              <p>
                Choisissez ce à quoi {wakie.name} et les commandes de
                l’ordinateur ont accès.
              </p>
              {(["enabled", "browser", "files", "shell"] as const).map(
                (permission) => (
                  <label key={permission}>
                    <input
                      checked={status.permissions[permission]}
                      disabled={busy || !status.configured}
                      onChange={(event) =>
                        void run(
                          "/permissions",
                          { [permission]: event.target.checked },
                          "PATCH"
                        )
                      }
                      type="checkbox"
                    />
                    {
                      {
                        browser: "Navigateur",
                        enabled: "Activer cet ordinateur",
                        files: "Fichiers de l’espace de travail",
                        shell: "Commandes du terminal",
                      }[permission]
                    }
                  </label>
                )
              )}
            </details>
            <div className="computer-actions">
              <button
                disabled={
                  busy ||
                  !status.configured ||
                  !status.permissions.enabled ||
                  status.state === "running"
                }
                onClick={() => void run("/start")}
              >
                Démarrer l’ordinateur
              </button>
              <button
                disabled={busy || status.state !== "running"}
                onClick={() => void run("/stop")}
              >
                Arrêter l’ordinateur
              </button>
            </div>
            <p className="computer-hint">
              L’arrêt conserve les fichiers de l’espace de travail de ce Wakie.
              Les sessions de navigateur peuvent demander une nouvelle
              connexion.
            </p>
          </details>
        </>
      ) : (
        <p role="status">
          {error
            ? "Statut de l’ordinateur indisponible."
            : "Chargement de l’ordinateur…"}
        </p>
      )}
    </section>
  );
}
