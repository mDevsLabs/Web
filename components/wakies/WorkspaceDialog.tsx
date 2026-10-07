"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type {
  Memory,
  State,
  Wakie,
  WorkspaceState,
} from "@/lib/wakies/shared/types";
export type Dialog =
  | { type: "space" }
  | { type: "wakie"; wakie?: Wakie; spaceId: string }
  | { type: "settings" }
  | { type: "memory"; memory?: Memory }
  | { type: "schedule"; conversationId: string };
export function WorkspaceDialog({
  dialog,
  state,
  workspace,
  onClose,
  mutate,
}: {
  dialog: Dialog;
  state: State;
  workspace: WorkspaceState;
  onClose: () => void;
  mutate: (path: string, method: string, body?: unknown) => Promise<boolean>;
}) {
  const [name, setName] = useState(
    dialog.type === "wakie" ? (dialog.wakie?.name ?? "") : ""
  );
  const [text, setText] = useState(
    dialog.type === "wakie"
      ? (dialog.wakie?.instructions ?? "")
      : dialog.type === "memory"
        ? (dialog.memory?.text ?? "")
        : ""
  );
  const [research, setResearch] = useState(
    dialog.type === "wakie"
      ? (dialog.wakie?.researchAllowed ?? true)
      : state.settings.researchAllowed
  );
  const [memory, setMemory] = useState(
    dialog.type === "wakie"
      ? (dialog.wakie?.memoryAllowed ?? true)
      : state.settings.memoryAllowed
  );
  const [spaceIds, setSpaceIds] = useState(
    dialog.type === "wakie" ? (dialog.wakie?.spaceIds ?? [dialog.spaceId]) : []
  );
  const [defaultSpace, setDefaultSpace] = useState(
    dialog.type === "wakie" ? (dialog.wakie?.spaceId ?? dialog.spaceId) : ""
  );
  const [interval, setInterval] = useState("86400");
  const [learningContainer, setLearningContainer] = useState(
    dialog.type === "wakie" ? (dialog.wakie?.learningContainerId ?? "") : ""
  );
  const [skillDelivery, setSkillDelivery] = useState(
    dialog.type === "wakie"
      ? (dialog.wakie?.skillDeliveryEnabled ?? false)
      : false
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const container = useRef<HTMLElement>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: piégeage modal posé à l'ouverture, retiré à la fermeture
  useEffect(() => {
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    container.current
      ?.querySelector<HTMLElement>("input,textarea,select")
      ?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const items = [
          ...(container.current?.querySelectorAll<HTMLElement>(
            "button:not([disabled]),input,textarea,select,a[href]"
          ) ?? []),
        ];
        if (event.shiftKey && document.activeElement === items[0]) {
          event.preventDefault();
          items.at(-1)?.focus();
        } else if (!event.shiftKey && document.activeElement === items.at(-1)) {
          event.preventDefault();
          items[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  const title =
    dialog.type === "space"
      ? "Un espace pour quelque chose."
      : dialog.type === "wakie"
        ? dialog.wakie
          ? "Personnalisez ce Wakie."
          : "Rencontrez votre prochain spécialiste."
        : dialog.type === "settings"
          ? "Votre espace de travail, vos règles."
          : dialog.type === "memory"
            ? "Quelque chose à retenir."
            : "Confiez le temps à votre Wakie.";
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        aria-labelledby="dialog-title"
        aria-modal="true"
        className="modal"
        onClick={(e) => e.stopPropagation()}
        ref={container}
        role="dialog"
      >
        <button
          aria-label="Fermer la boîte de dialogue"
          className="modal-close icon-button"
          onClick={onClose}
        >
          <X size={18} />
        </button>
        <span className="eyebrow">MODÈLE WAKIES</span>
        <h2 id="dialog-title">{title}</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            let path = "",
              method = "POST",
              body: unknown;
            if (dialog.type === "space") {
              path = "/spaces";
              body = { description: text, name };
            }
            if (dialog.type === "wakie") {
              path = dialog.wakie ? `/wakies/${dialog.wakie.id}` : "/wakies";
              method = dialog.wakie ? "PUT" : "POST";
              body = {
                instructions: text,
                learningContainerId: learningContainer.trim() || null,
                memoryAllowed: memory,
                name,
                researchAllowed: research,
                skillDeliveryEnabled: skillDelivery,
                spaceId: defaultSpace,
                spaceIds,
              };
            }
            if (dialog.type === "settings") {
              path = "/settings";
              method = "PATCH";
              body = { memoryAllowed: memory, researchAllowed: research };
            }
            if (dialog.type === "memory") {
              path = dialog.memory
                ? `/memories/${dialog.memory.id}`
                : "/memories";
              method = dialog.memory ? "PUT" : "POST";
              body = { text };
            }
            if (dialog.type === "schedule") {
              path = "/tasks";
              body = {
                conversationId: dialog.conversationId,
                intervalSeconds: Number(interval),
                prompt: text,
              };
            }
            if (await mutate(path, method, body)) onClose();
            else
              setError(
                "Enregistrement impossible. Vérifiez l’erreur de l’espace de travail et réessayez."
              );
            setBusy(false);
          }}
        >
          {(dialog.type === "space" || dialog.type === "wakie") && (
            <>
              <label className="field-label" htmlFor="entity-name">
                Name
              </label>
              <input
                id="entity-name"
                maxLength={40}
                onChange={(e) => setName(e.target.value)}
                required
                value={name}
              />
            </>
          )}
          {dialog.type !== "settings" && (
            <>
              <label className="field-label" htmlFor="entity-text">
                {dialog.type === "wakie"
                  ? "Instructions de rôle"
                  : dialog.type === "space"
                    ? "Que contient cet espace ?"
                    : dialog.type === "memory"
                      ? "Préférence ou contexte"
                      : "Tâche à reprendre"}
              </label>
              <textarea
                id="entity-text"
                maxLength={dialog.type === "schedule" ? 4000 : 2000}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  dialog.type === "wakie"
                    ? "Vous êtes un partenaire de recherche rigoureux. Comparez les preuves et dites clairement ce qui reste incertain."
                    : ""
                }
                required={dialog.type !== "space"}
                rows={4}
                value={text}
              />
            </>
          )}
          {dialog.type === "wakie" && (
            <fieldset className="space-access-fields">
              <legend>Accès aux Espaces</legend>
              <p className="muted">
                Choisissez où ce Wakie peut lire et modifier des pages.
              </p>
              {workspace.spaces.map((space) => (
                <label className="permission-row" key={space.id}>
                  <input
                    checked={spaceIds.includes(space.id)}
                    onChange={(event) => {
                      const next = event.target.checked
                        ? [...spaceIds, space.id]
                        : spaceIds.filter((id) => id !== space.id);
                      setSpaceIds(next);
                      if (!next.includes(defaultSpace))
                        setDefaultSpace(next[0] ?? "");
                    }}
                    type="checkbox"
                  />
                  <span>{space.name}</span>
                </label>
              ))}
              <label className="field-label" htmlFor="default-space">
                Destination par défaut des pages enregistrées
              </label>
              <select
                id="default-space"
                onChange={(event) => setDefaultSpace(event.target.value)}
                required
                value={defaultSpace}
              >
                <option disabled value="">
                  Choisir un Espace
                </option>
                {workspace.spaces
                  .filter((space) => spaceIds.includes(space.id))
                  .map((space) => (
                    <option key={space.id} value={space.id}>
                      {space.name}
                    </option>
                  ))}
              </select>
            </fieldset>
          )}
          {(dialog.type === "wakie" || dialog.type === "settings") && (
            <>
              <label className="permission-row">
                <input
                  checked={research}
                  onChange={(e) => setResearch(e.target.checked)}
                  type="checkbox"
                />
                <span>
                  <strong>Recherche sur les pages publiques</strong>
                  <small>
                    Autorisez l’outil navigateur en lecture seule côté serveur.
                    Les réglages globaux priment toujours.
                  </small>
                </span>
              </label>
              <label className="permission-row">
                <input
                  checked={memory}
                  onChange={(e) => setMemory(e.target.checked)}
                  type="checkbox"
                />
                <span>
                  <strong>Utiliser les mémoires enregistrées</strong>
                  <small>
                    Incluez vos préférences dans les nouveaux tours. Modifier la
                    permission interrompt le travail en cours.
                  </small>
                </span>
              </label>
            </>
          )}
          {dialog.type === "wakie" && (
            <fieldset className="space-access-fields">
              <legend>Apprentissage automatique</legend>
              <label className="field-label" htmlFor="learning-container">
                Identifiant du conteneur d’apprentissage
              </label>
              <input
                aria-describedby="learning-help"
                id="learning-container"
                maxLength={64}
                onChange={(event) => {
                  setLearningContainer(event.target.value);
                  if (!event.target.value.trim()) setSkillDelivery(false);
                }}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                placeholder="research-workflow"
                value={learningContainer}
              />
              <p className="muted" id="learning-help">
                Créez d’abord ce conteneur dans votre projet Intelligence. Les
                nouvelles conversations y contribueront par des preuves. Laissez
                vide pour exclure les nouvelles conversations de
                l’apprentissage. Les conversations existantes conservent leur
                affectation d’origine.
              </p>
              <label className="permission-row">
                <input
                  checked={skillDelivery}
                  disabled={!learningContainer.trim()}
                  onChange={(event) => setSkillDelivery(event.target.checked)}
                  type="checkbox"
                />
                <span>
                  <strong>Utiliser les compétences publiées</strong>
                  <small>
                    Chargez les compétences révisées depuis le conteneur affecté
                    à chaque conversation. Activez aussi la diffusion dans
                    Intelligence. Désactiver cette option arrête le chargement
                    des compétences, pas la collecte des preuves.
                  </small>
                </span>
              </label>
              <a
                href="https://docs.copilotkit.ai/learning"
                rel="noreferrer"
                target="_blank"
              >
                Configurer l’apprentissage et réviser les compétences ↗
              </a>
            </fieldset>
          )}
          {dialog.type === "schedule" && (
            <>
              <label className="field-label" htmlFor="schedule-interval">
                Répéter après chaque exécution réussie
              </label>
              <select
                id="schedule-interval"
                onChange={(e) => setInterval(e.target.value)}
                value={interval}
              >
                <option value="60">Toutes les minutes (test)</option>
                <option value="3600">Toutes les heures</option>
                <option value="86400">Tous les jours</option>
                <option value="604800">Toutes les semaines</option>
              </select>
              <p className="muted">
                S’exécute sur le serveur dans cette même conversation, même
                onglet fermé. Les exécutions échouées attendent une relance
                manuelle.
              </p>
            </>
          )}
          {dialog.type === "settings" && (
            <div className="config-note">
              <strong>Configuration du service</strong>
              <p>
                {workspace.setup.missing.length
                  ? `Ajoutez ${workspace.setup.missing.join(", ")} à l’environnement du serveur, puis redémarrez.`
                  : "La configuration du service est présente. Une conversation réussie confirme la connectivité."}
              </p>
              <p>
                Slack: {workspace.setup.slack.replaceAll("_", " ")}. Voice:{" "}
                {workspace.setup.voice
                  ? "configuration présente"
                  : "nécessite VOICE_API_KEY et VOICE_MODEL"}
                .
              </p>
              <a
                href="https://github.com/CopilotKit/Wakies/blob/main/docs/SETUP.md"
                rel="noreferrer"
                target="_blank"
              >
                Guide de configuration du modèle ↗
              </a>
            </div>
          )}
          {dialog.type === "memory" && (
            <p className="muted">
              Les mémoires sont des préférences explicites, pas un apprentissage
              automatique. Évitez les secrets : les mémoires activées sont
              envoyées à votre fournisseur de modèle.
            </p>
          )}
          {error && (
            <p className="chat-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary full" disabled={busy}>
            {busy ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      </section>
    </div>
  );
}
