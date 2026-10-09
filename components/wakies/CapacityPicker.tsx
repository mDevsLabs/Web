"use client";

/**
 * ============================================================================
 * Sélecteur de capacités d'un Wakie
 * ============================================================================
 *
 * CE QUE CET ÉCRAN MONTRE
 *
 * Trois familles de ressources du compte mAI, telles que le serveur les
 * renvoie, jamais comme le client ne les invente :
 *
 *   - les COMPÉTENCES (`GET /api/skills`) : instructions, paramètres et outils
 *     déclarés. Ce sont des compétences(configurées), pas des plugins.
 *   - les EXTENSIONS (`GET /api/plugins`) : le catalogue mAI, avec quatre
 *     situations distinctes — non installée, installée et active, installée et
 *     désactivée, verrouillée par le forfait.
 *   - les SERVEURS MCP (`GET /api/mcp`) : ce que le compte a installé chez lui.
 *
 * LES QUATRE SITUATIONS D'UNE EXTENSION
 *
 * Elles sont VOLONTAIREMENT distinctes et le texte le dit. « Installer », « activer » et
 * « connecter un compte externe » sont trois gestes différents : une
 * installation désactivée reste dans la bibliothèque, mais ses outils ne sont
 * PAS exposés au modèle. L'interface ne montre donc jamais de simple coche
 * verte là où rien ne s'exécute.
 *
 * CE QUE LA SÉLECTION NE FAIT PAS
 *
 * Elle n'accorde rien. Un identifiant coché ici est revalidé à chaque tour par
 * `resolveSelection` : extension supprimée, désactivée, hors forfait ou outil
 * inconnu sont retirés et signalés. La sélection enregistre une INTENTION, pas
 * une autorisation.
 */

import { ServerCogIcon } from "@mdevs/icons/cloud/server-cog";
import { CheckIcon } from "@mdevs/icons/controls/check";
import { XIcon } from "@mdevs/icons/controls/x";
import { AlertTriangleIcon } from "@mdevs/icons/misc/alert-triangle";
import { BotIcon } from "@mdevs/icons/misc/bot";
import { SparklesIcon } from "@mdevs/icons/misc/sparkles";
import { WrenchIcon } from "@mdevs/icons/tools/wrench";
import { useCallback, useEffect, useState } from "react";

/** Compétence personnelle du compte. */
export type Competence = {
  description?: string | null;
  id: string;
  name: string;
  pinned?: boolean;
};

/** Fiche d'extension du catalogue mAI. */
export type Extension = {
  description?: string | null;
  enabled?: boolean;
  id: string;
  installed?: boolean;
  locked?: boolean;
  name: string;
  toolIds?: string[];
};

/** Serveur MCP du compte. Masqué si le DTO ne porte que `secretKeys`. */
export type ServeurMcp = {
  enabled?: boolean;
  id: string;
  name: string;
  transport?: string | null;
};

export type Capabilities = {
  competences: Competence[];
  extensions: Extension[];
  serveurs: ServeurMcp[];
};

export const CAPACITIES_VIDES: Capabilities = {
  competences: [],
  extensions: [],
  serveurs: [],
};

async function chargerCompetences(): Promise<Competence[]> {
  try {
    const reponse = await fetch("/api/skills", { credentials: "same-origin" });
    if (!reponse.ok) {
      return [];
    }
    const corps = await reponse.json().catch(() => null);
    if (Array.isArray(corps)) {
      return corps as Competence[];
    }
    if (
      corps &&
      typeof corps === "object" &&
      Array.isArray((corps as { skills?: Competence[] }).skills)
    ) {
      return (corps as { skills: Competence[] }).skills;
    }
    return [];
  } catch {
    return [];
  }
}

async function chargerExtensions(): Promise<Extension[]> {
  try {
    const reponse = await fetch("/api/plugins", { credentials: "same-origin" });
    if (!reponse.ok) {
      return [];
    }
    const corps = await reponse.json().catch(() => null);
    if (Array.isArray(corps)) {
      return corps as Extension[];
    }
    if (
      corps &&
      typeof corps === "object" &&
      Array.isArray((corps as { plugins?: Extension[] }).plugins)
    ) {
      return (corps as { plugins: Extension[] }).plugins;
    }
    return [];
  } catch {
    return [];
  }
}

async function chargerServeurs(): Promise<ServeurMcp[]> {
  try {
    const reponse = await fetch("/api/mcp", { credentials: "same-origin" });
    if (!reponse.ok) {
      return [];
    }
    const corps = await reponse.json().catch(() => null);
    const rawList = Array.isArray(corps)
      ? corps
      : corps &&
          typeof corps === "object" &&
          Array.isArray((corps as { servers?: unknown[] }).servers)
        ? (corps as { servers: unknown[] }).servers
        : [];
    return (
      rawList as Array<{
        enabled?: boolean;
        id: string;
        isEnabled?: boolean;
        name: string;
        transport?: string | null;
      }>
    ).map((s) => ({
      enabled: s.enabled ?? s.isEnabled ?? true,
      id: s.id,
      name: s.name,
      transport: s.transport ?? null,
    }));
  } catch {
    return [];
  }
}

export function useCapabilities(actif: boolean): {
  capabilities: Capabilities;
  chargement: boolean;
  erreur: string;
  rafraichir: () => Promise<void>;
} {
  const [capabilities, setCapabilities] = useState(CAPACITIES_VIDES);
  const [chargement, setChargement] = useState(actif);
  const [erreur, setErreur] = useState("");

  const rafraichir = useCallback(async () => {
    setChargement(true);
    setErreur("");
    try {
      const [competences, extensions, serveurs] = await Promise.all([
        chargerCompetences(),
        chargerExtensions(),
        chargerServeurs(),
      ]);
      setCapabilities({ competences, extensions, serveurs });
    } catch {
      setErreur("Vos capacités n'ont pas pu être chargées. Réessayez.");
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    if (actif) {
      void rafraichir();
    }
  }, [actif, rafraichir]);

  return { capabilities, chargement, erreur, rafraichir };
}

function Ligne({
  actif,
  detail,
  disabled = false,
  libelle,
  onBasculer,
  statut,
}: {
  actif: boolean;
  detail?: string | null;
  disabled?: boolean;
  libelle: string;
  onBasculer: () => void;
  statut?: { texte: string; ton: "info" | "warning" | "destructive" };
}) {
  return (
    <label className="capability-row">
      <input
        checked={actif}
        disabled={disabled}
        onChange={onBasculer}
        type="checkbox"
      />
      <span className="capability-row-body">
        <span className="capability-row-title">
          {libelle}
          {actif ? <CheckIcon size={14} /> : null}
        </span>
        {detail ? (
          <small className="capability-row-detail">{detail}</small>
        ) : null}
        {statut ? (
          <small className={`capability-row-status is-${statut.ton}`}>
            {statut.texte}
          </small>
        ) : null}
      </span>
    </label>
  );
}

export function CapacityPicker({
  capabilities,
  valeur,
  onChanger,
}: {
  capabilities: Capabilities;
  valeur: {
    mcpServerIds: string[];
    pluginIds: string[];
    skillIds: string[];
  };
  onChanger: (suivant: {
    mcpServerIds: string[];
    pluginIds: string[];
    skillIds: string[];
  }) => void;
}) {
  const competences = Array.isArray(capabilities?.competences)
    ? capabilities.competences
    : [];
  const extensions = Array.isArray(capabilities?.extensions)
    ? capabilities.extensions
    : [];
  const serveurs = Array.isArray(capabilities?.serveurs)
    ? capabilities.serveurs
    : [];

  const basculer = (liste: string[], id: string) =>
    liste.includes(id) ? liste.filter((x) => x !== id) : [...liste, id];

  return (
    <div className="capability-picker">
      <fieldset>
        <legend>
          <SparklesIcon size={15} />
          Compétences
        </legend>
        {competences.length === 0 ? (
          <p className="muted">
            Aucune compétence dans votre bibliothèque. Créez-en depuis
            Applications, dans votre compte mAI.
          </p>
        ) : (
          competences.map((competence) => (
            <Ligne
              actif={valeur.skillIds.includes(competence.id)}
              detail={competence.description}
              key={competence.id}
              libelle={competence.name}
              onBasculer={() =>
                onChanger({
                  ...valeur,
                  skillIds: basculer(valeur.skillIds, competence.id),
                })
              }
            />
          ))
        )}
      </fieldset>

      <fieldset>
        <legend>
          <BotIcon size={15} />
          Extensions
        </legend>
        {extensions.length === 0 ? (
          <p className="muted">Aucune extension disponible sur ce compte.</p>
        ) : (
          extensions.map((extension) => {
            const installee = extension.installed === true;
            const activee = extension.enabled === true;
            const verrouillee = extension.locked === true;
            // Un outil de Plugin ne devient exécutable que si le Plugin est
            // installé ET activé ET accessible au forfait. L'interface le dit,
            // au lieu de cocher une case qui ne produirait aucun effet.
            const statut = verrouillee
              ? {
                  texte: "Nécessite un forfait supérieur.",
                  ton: "warning" as const,
                }
              : installee
                ? activee
                  ? null
                  : {
                      texte:
                        "Installée mais désactivée : ses outils ne sont pas exposés.",
                      ton: "warning" as const,
                    }
                : {
                    texte:
                      "Non installée — activez-la depuis votre compte mAI.",
                    ton: "info" as const,
                  };
            return (
              <Ligne
                actif={valeur.pluginIds.includes(extension.id)}
                detail={extension.description}
                disabled={!installee || verrouillee}
                key={extension.id}
                libelle={extension.name}
                onBasculer={() =>
                  onChanger({
                    ...valeur,
                    pluginIds: basculer(valeur.pluginIds, extension.id),
                  })
                }
                statut={statut ?? undefined}
              />
            );
          })
        )}
      </fieldset>

      <fieldset>
        <legend>
          <ServerCogIcon size={15} />
          Serveurs MCP
        </legend>
        {serveurs.length === 0 ? (
          <p className="muted">
            Aucun serveur MCP installé. Ajoutez-en depuis votre compte mAI.
          </p>
        ) : (
          serveurs.map((serveur) => (
            <Ligne
              actif={valeur.mcpServerIds.includes(serveur.id)}
              detail={
                serveur.transport ? `Transport ${serveur.transport}` : null
              }
              disabled={serveur.enabled === false}
              key={serveur.id}
              libelle={serveur.name}
              onBasculer={() =>
                onChanger({
                  ...valeur,
                  mcpServerIds: basculer(valeur.mcpServerIds, serveur.id),
                })
              }
              statut={
                serveur.enabled === false
                  ? { texte: "Serveur désactivé.", ton: "destructive" as const }
                  : undefined
              }
            />
          ))
        )}
      </fieldset>
    </div>
  );
}

/** Catalogue des outils de `lib/ai/tools`, pour la sélection d'outils. */
export function ToolPicker({
  outils,
  valeur,
  onChanger,
  outilsCompte,
}: {
  /** Catalogue `{ id, label, description, ecritCompte }`. */
  outils: {
    description?: string;
    ecritCompte?: boolean;
    id: string;
    label: string;
  }[];
  valeur: string[];
  onChanger: (suivant: string[]) => void;
  /** `Set` des outils fournis par une extension sélectionnée. */
  outilsCompte?: Set<string>;
}) {
  const listeOutils = Array.isArray(outils) ? outils : [];
  return (
    <div className="capability-picker">
      <fieldset>
        <legend>
          <WrenchIcon size={15} />
          Outils de ce Wakie
        </legend>
        <p className="muted">
          Ces outils sont proposés au modèle à chaque tour. Un outil qui écrit
          dans votre compte n&apos;est jamais coché par défaut.
        </p>
        {listeOutils.map((outil) => (
          <Ligne
            actif={valeur.includes(outil.id)}
            detail={outil.description}
            key={outil.id}
            libelle={outil.label}
            onBasculer={() =>
              onChanger(
                valeur.includes(outil.id)
                  ? valeur.filter((x) => x !== outil.id)
                  : [...valeur, outil.id]
              )
            }
            statut={
              outil.ecritCompte
                ? {
                    texte: "Cette action modifie votre compte mAI.",
                    ton: "destructive" as const,
                  }
                : undefined
            }
          />
        ))}
      </fieldset>
    </div>
  );
}

/** Avertissement des capacités demandées mais non utilisables. */
export function CapacityIssues({
  issues,
}: {
  issues: { id: string; kind: string; raison: string }[];
}) {
  const listeIssues = Array.isArray(issues) ? issues : [];
  if (listeIssues.length === 0) {
    return null;
  }
  return (
    <div className="capability-issues" role="status">
      <AlertTriangleIcon size={15} />
      <ul>
        {listeIssues.map((issue) => (
          <li key={`${issue.kind}-${issue.id}`}>
            <strong>{issue.raison}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Bouton de retrait réutilisé par le composer. */
export function BoutonRetirer({ onClick }: { onClick: () => void }) {
  return (
    <button
      aria-label="Retirer"
      className="icon-button"
      onClick={onClick}
      type="button"
    >
      <XIcon size={14} />
    </button>
  );
}
