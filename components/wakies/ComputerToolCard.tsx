"use client";

import { ArrowUpRight, FileText, Monitor, Terminal } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { api } from "@/components/wakies/api";

const screenSchema = z.object({
  base64: z
    .string()
    .regex(/^[A-Za-z0-9+/=]+$/)
    .max(4_000_000),
  url: z.string(),
});
export type ComputerToolRenderProps = {
  name: string;
  toolCallId: string;
  status: string;
  args?: unknown;
  result?: unknown;
};
const labels: Record<string, string> = {
  click: "Clic dans le navigateur",
  exec: "Commande terminal en cours",
  files_list: "Liste des fichiers",
  files_read: "Lecture du fichier",
  files_write: "Enregistrement du fichier",
  key: "Utilisation du clavier",
  navigate: "Ouverture du site",
  read: "Lecture de la page",
  screenshot: "Aperçu du navigateur",
  scroll: "Défilement de la page",
  snapshot: "Inspection du navigateur",
  type: "Saisie dans le navigateur",
};
export function computerToolResult(raw: unknown): Record<string, unknown> {
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return { error: raw };
    }
  }
  return raw && typeof raw === "object" && !Array.isArray(raw)
    ? Object.fromEntries(Object.entries(raw))
    : {};
}
export function ComputerToolCard({
  name,
  status,
  args,
  result,
  wakieId,
  wakieName,
  showScreen,
  running,
  onExpand,
}: ComputerToolRenderProps & {
  wakieId: string;
  wakieName: string;
  showScreen: boolean;
  running: boolean;
  onExpand?: () => void;
}) {
  const [screen, setScreen] = useState<z.infer<typeof screenSchema>>();
  const [screenError, setScreenError] = useState("");
  const action = name.replace(/^computer_/, "");
  const data = computerToolResult(result);
  const parameters = computerToolResult(args);
  const interrupted =
    data.status === "stopped" || data.reason === "stop_requested";
  const error =
    typeof data.error === "string"
      ? data.error
      : data.status === "error" && typeof data.message === "string"
        ? data.message
        : "";
  const interruption =
    interrupted && typeof data.message === "string" ? data.message : "";
  const complete = status === "complete";
  const failed =
    data.status === "error" ||
    !!error ||
    (typeof data.exitCode === "number" && data.exitCode !== 0);
  const state = interrupted
    ? "Interrompu"
    : failed
      ? "Attention requise"
      : complete
        ? "Terminé"
        : running
          ? "En cours"
          : "Interrompu";
  const detail =
    typeof parameters.url === "string"
      ? parameters.url
      : typeof parameters.path === "string"
        ? parameters.path
        : "";
  useEffect(() => {
    if (!showScreen) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    setScreen(undefined);
    setScreenError("");
    const refresh = async () => {
      if (!document.hidden) {
        try {
          const value = await api<unknown>(
            `/wakies/${encodeURIComponent(wakieId)}/computer/actions`,
            "POST",
            { action: "screenshot", input: {} },
            controller.signal
          );
          const next = screenSchema.parse(value);
          if (!controller.signal.aborted) {
            setScreen(next);
            setScreenError("");
          }
        } catch (cause) {
          if (!controller.signal.aborted) {
            setScreen(undefined);
            setScreenError(
              cause instanceof Error
                ? cause.message
                : "Aperçu de l’ordinateur indisponible."
            );
          }
        }
      }
      if (!controller.signal.aborted)
        timer = setTimeout(() => void refresh(), 3000);
    };
    void refresh();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [wakieId, showScreen]);
  const Icon =
    action === "exec"
      ? Terminal
      : action.startsWith("files_")
        ? FileText
        : Monitor;
  return (
    <section
      aria-label={`Ordinateur de ${wakieName} : ${labels[action] ?? action}`}
      className={`inline-computer ${showScreen ? "with-screen" : ""}`}
    >
      <header>
        <Icon aria-hidden="true" size={16} />
        <strong>{labels[action] ?? "Utilisation de l’ordinateur"}</strong>
        <span className={failed ? "tool-state failed" : "tool-state"}>
          {state}
        </span>
        {onExpand && (
          <button
            aria-label={`Agrandir l’ordinateur de ${wakieName}`}
            onClick={onExpand}
            type="button"
          >
            <ArrowUpRight size={16} />
          </button>
        )}
      </header>
      {detail && (
        <div className="inline-computer-detail" title={detail}>
          {detail}
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      {interruption && <p role="status">{interruption}</p>}
      {action === "exec" && complete && typeof data.stdout === "string" && (
        <pre aria-label="Sortie du terminal de l’ordinateur">
          {data.stdout.slice(0, 4000)}
        </pre>
      )}
      {action === "exec" &&
        complete &&
        typeof data.stderr === "string" &&
        data.stderr && <pre>{data.stderr.slice(0, 2000)}</pre>}
      {showScreen && (
        <div className="inline-computer-preview">
          <div className="inline-computer-caption">
            <span className="live-indicator" />
            Ordinateur de {wakieName} · Vue actuelle du navigateur
          </div>
          {screen && (
            <img
              alt={`Vue actuelle du navigateur depuis l’ordinateur de ${wakieName}`}
              src={`data:image/png;base64,${screen.base64}`}
            />
          )}
          {screenError ? (
            <p role="status">{screenError}</p>
          ) : (
            !screen && <p role="status">Connexion à l’ordinateur…</p>
          )}
          {screen && <div className="inline-computer-url">{screen.url}</div>}
        </div>
      )}
    </section>
  );
}
