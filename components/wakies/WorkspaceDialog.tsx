"use client";
import { Button } from "@mdevs/ui/primitives/button";
import { Input } from "@mdevs/ui/primitives/input";
import { Textarea } from "@mdevs/ui/primitives/textarea";

/**
 * Dialogue de personnalisation d'un Wakie.
 *
 * `PUT /api/wakies/wakies/:id` est un remplacement COMPLET : `name`,
 * `instructions`, `memoryAllowed` et `researchAllowed` sont obligatoires à chaque
 * appel. Une édition qui ne touche qu'un champ doit donc REBÂTIR sa charge
 * utile à partir du profil déjà chargé — c'est ce que fait le `body` ci-dessous,
 * en partant de `dialog.wakie` et des valeurs courantes pour les champs que
 * l'utilisateur ne modifie pas. Sans cela, renommer un Wakie effacerait son
 * avatar, son modèle et sa sélection d'outils.
 *
 * CE QUI N'EST PLUS PROPOSÉ
 *
 * Le bloc « apprentissage automatique » du gabarit (`learningContainerId`,
 * `skillDeliveryEnabled`, liens CopilotKit) a été retiré : `lib/wakies/setup.ts`
 * déclare `intelligence: false`, et présenter un service non branché comme une
 * option serait un bouton sans effet. Les colonnes restent en base pour ne pas
 * perdre la donnée d'un compte qui l'exploiterait ailleurs.
 */

import { XIcon } from "@mdevs/icons/controls/x";
import { Trash2Icon } from "@mdevs/icons/objects/trash-2";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CapacityPicker,
  ToolPicker,
  useCapabilities,
} from "@/components/wakies/CapacityPicker";
import { ModelPicker } from "@/components/wakies/ModelPicker";
import {
  DEFAULT_WAKIE_AVATAR,
  isWakieAvatar,
  WAKIE_AVATARS,
} from "@/lib/wakies/shared/avatars";
import type {
  Memory,
  State,
  Wakie,
  WorkspaceState,
} from "@/lib/wakies/shared/types";
import { outilsParDefaut, WAKIE_TOOL_CATALOG } from "@/lib/wakies/tool-catalog";
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
  // Mascotte et modèle : deux réglages propres au Wakie. Le modèle est le
  // DÉFAUT de ses nouvelles conversations ; la conversation peut le changer
  // ensuite, depuis le menu de l'en-tête du chat. `model` reste ici la valeur
  // ÉCRITE (null = défaut mAI), distincte de ce qu'affiche le sélecteur.
  const [avatar, setAvatar] = useState<string>(
    dialog.type === "wakie" && isWakieAvatar(dialog.wakie?.avatar)
      ? dialog.wakie.avatar
      : DEFAULT_WAKIE_AVATAR
  );
  const [model, setModel] = useState<string | null>(
    dialog.type === "wakie" ? (dialog.wakie?.model ?? null) : null
  );
  const [interval, setInterval] = useState("86400");

  // Sélection d'outils du WAKIE. Elle sert de DÉFAUT aux conversations qui
  // n'ont rien choisi (colonne `null`) ; une conversation qui a coché
  // elle-même garde son propre choix, et le changer ici ne l'écrase pas.
  const [selection, setSelection] = useState({
    mcpServerIds:
      dialog.type === "wakie" ? (dialog.wakie?.mcpServerIds ?? []) : [],
    pluginIds: dialog.type === "wakie" ? (dialog.wakie?.pluginIds ?? []) : [],
    skillIds: dialog.type === "wakie" ? (dialog.wakie?.skillIds ?? []) : [],
  });
  const [toolIds, setToolIds] = useState<string[]>(() => {
    if (dialog.type !== "wakie") {
      return [];
    }
    // `null` = aucun réglage : on montre les outils par défaut, sans les
    // écrire tant que l'utilisateur n'a rien changé.
    return (
      dialog.wakie?.toolIds ??
      outilsParDefaut(dialog.wakie?.researchAllowed ?? true)
    );
  });

  const capacites = useCapabilities(dialog.type === "wakie");
  const outilsExtension = useMemo(() => new Set<string>(), []);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const container = useRef<HTMLElement>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: piégeage modal posé à l'ouverture, retiré à la fermeture
  useEffect(() => {
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const focusables = () =>
      [
        ...(container.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]),input:not([disabled]):not([type="hidden"]),textarea:not([disabled]),select:not([disabled]),a[href]'
        ) ?? []),
      ].filter(
        (item) => item.tabIndex >= 0 && item.getClientRects().length > 0
      );
    focusables()
      .find((item) => item.matches("input,textarea,select"))
      ?.focus();
    const key = (event: KeyboardEvent) => {
      // Un menu Radix imbriqué peut déjà avoir traité Échap ; conserver alors le dialogue parent.
      if (event.defaultPrevented) return;
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const items = focusables();
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
        <Button
          aria-label="Fermer la boîte de dialogue"
          className="modal-close icon-button"
          onClick={onClose}
          variant="ghost"
        >
          <XIcon size={18} />
        </Button>
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
              // Charge utile COMPLÈTE : `PUT` exige les champs obligatoires,
              // et les colonnes de sélection sont écrites telles que l'écran
              // les montre. Une édition partielle qui n'enverrait que le nom
              // effacerait l'avatar, le modèle et la sélection d'outils.
              body = {
                avatar,
                instructions: text,
                mcpServerIds: selection.mcpServerIds,
                memoryAllowed: memory,
                model,
                name,
                pluginIds: selection.pluginIds,
                researchAllowed: research,
                skillIds: selection.skillIds,
                spaceId: defaultSpace,
                spaceIds,
                toolIds,
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
                Nom
              </label>
              <Input
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
              <Textarea
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
              <legend>Mascotte</legend>
              <p className="muted">
                Choisissez le visage de ce Wakie. Il apparaît dans la
                navigation, l'en-tête du chat et les conversations.
              </p>
              <div className="avatar-picker">
                {WAKIE_AVATARS.map((choice) => (
                  <label
                    className={`avatar-choice ${avatar === choice ? "active" : ""}`}
                    key={choice}
                  >
                    <input
                      checked={avatar === choice}
                      name="wakie-avatar"
                      onChange={() => setAvatar(choice)}
                      type="radio"
                      value={choice}
                    />
                    <img
                      alt=""
                      height={64}
                      src={`/wakies/${choice}.png`}
                      width={64}
                    />
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {dialog.type === "wakie" && (
            <fieldset className="space-access-fields">
              <legend>Modèle IA</legend>
              <p className="muted">
                Le modèle par défaut de ses nouvelles conversations. Une
                conversation peut en choisir un autre, puis y revenir.
              </p>
              <span className="wakies-model-picker block">
                <ModelPicker
                  bloc
                  onChoisir={setModel}
                  outilsActifs={
                    toolIds.length > 0 ||
                    selection.pluginIds.length > 0 ||
                    selection.mcpServerIds.length > 0
                  }
                  valeur={model ?? ""}
                />
              </span>
            </fieldset>
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
              <legend>Outils</legend>
              <p className="muted">
                Ce que ce Wakie peut utiliser par défaut. Ses nouvelles
                conversations suivront ce choix tant que vous ne
                l&apos;overridez pas conversation par conversation.
              </p>
              <ToolPicker
                onChanger={setToolIds}
                outils={WAKIE_TOOL_CATALOG}
                outilsCompte={outilsExtension}
                valeur={toolIds}
              />
            </fieldset>
          )}
          {dialog.type === "wakie" && (
            <fieldset className="space-access-fields">
              <legend>Compétences et connexions</legend>
              <p className="muted">
                Ces ressources viennent de votre compte mAI. Les cocher ici ne
                les installe pas : une ressource non installée ou désactivée
                reste signalée comme telle, et n&apos;accorde aucun accès.
              </p>
              {capacites.chargement ? (
                <p className="muted">Chargement de vos ressources…</p>
              ) : null}
              {capacites.erreur ? (
                <p className="chat-error" role="alert">
                  {capacites.erreur}
                </p>
              ) : null}
              {!capacites.chargement && !capacites.erreur ? (
                <CapacityPicker
                  capabilities={capacites.capabilities}
                  onChanger={setSelection}
                  valeur={selection}
                />
              ) : null}
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
                Slack : {workspace.setup.slack.replaceAll("_", " ")}. Voix :{" "}
                {workspace.setup.voice
                  ? "configuration présente"
                  : "non configurée actuellement"}
                .
              </p>
              <p className="muted">
                Les modèles et les quotas sont gérés directement par votre
                compte mAI.
              </p>
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
          <Button
            className="primary full"
            disabled={busy}
            type="submit"
            variant="solid"
          >
            {busy ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </form>
        {dialog.type === "wakie" && dialog.wakie && (
          <div className="dialog-danger-zone">
            <div>
              <strong>Supprimer « {dialog.wakie.name} »</strong>
              <p className="muted">
                Ses conversations et ses messages partent avec lui. Les pages
                déjà enregistrées dans vos Espaces restent en place.
              </p>
            </div>
            <Button
              className="danger"
              disabled={busy}
              onClick={async () => {
                if (
                  !window.confirm(
                    `Supprimer définitivement « ${dialog.wakie?.name} » et toutes ses conversations ?`
                  )
                ) {
                  return;
                }
                setBusy(true);
                setError("");
                if (await mutate(`/wakies/${dialog.wakie?.id}`, "DELETE")) {
                  onClose();
                } else {
                  setError(
                    "Suppression impossible. Vérifiez l'erreur de l'espace de travail et réessayez."
                  );
                }
                setBusy(false);
              }}
              type="button"
              variant="outline"
            >
              <Trash2Icon size={15} />
              Supprimer ce Wakie
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
