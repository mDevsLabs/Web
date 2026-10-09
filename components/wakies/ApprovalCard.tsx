"use client";

/**
 * ============================================================================
 * Carte de validation d'un appel d'outil
 * ============================================================================
 *
 * CE QUE CE COMPOSANT REMPLACE
 *
 * Le gabarit portait la validation par `useHumanInTheLoop` de CopilotKit. Le
 * port l'a d'abord perdue au profit d'un simple rendu de résultat. Cette carte
 * la rétablit, en composition avec la validation d'action de Muse : titre
 * court, résumé de l'action, paramètres essentiels, cible, puis deux boutons.
 *
 * CE QUI N'EST PAS NÉGOCIABLE
 *
 *   1. La décision porte sur UN appel EXACT. `toolCallId` est transmis tel
 *      quel : autoriser « l'outil A » ne vaut pas autorisation pour « l'outil B »
 *      appelé plus tard dans la même conversation.
 *   2. UN REFUS EST UN RÉSULTAT. Il revient dans le flux comme partie de tool
 *      avec une sortie d'échec. Le modèle doit le voir et s'en servir pour
 *      expliquer ; ce n'est jamais un succès maquillé en « c'est fait ».
 *   3. Le contrôle reste CACHÉ côté serveur. Cette carte n'accorde rien :
 *      `createMcpChatTools` ne retire le `execute` d'un outil sensible que si la
 *      décision est retrouvée dans les parties du message. Effacer cette carte
 *      ne rend donc l'outil exécutable à personne — mais la cacher quand elle
 *      existe laisserait le modèle attendre indéfiniment.
 *
 * D'où viennent les demandes
 *
 * `createMcpChatTools` produit, pour un outil qui exige une approbation, une
 * définition SANS `execute` : l'AI SDK interrompt alors le flux et émet une
 * part `approval-requested`. C'est cette part que ce composant rend.
 */

import { CheckIcon } from "@mdevs/icons/controls/check";
import { XIcon } from "@mdevs/icons/controls/x";
import { ShieldIcon } from "@mdevs/icons/security/shield";
import { Button } from "@mdevs/ui/primitives/button";
import type { UIMessage } from "ai";

/**
 * Nombre de paramètres affichés. Une carte de validation qui aligne trente
 * champs n'est plus lisible, et l'utilisateur finit par autoriser sans
 * lire — exactement ce que la carte doit empêcher.
 */
const PARAMETRES_AFFICHES = 5;

export type DemandeValidation = {
  /** Identifiant de l'appel : c'est ce que la décision vise. */
  toolCallId: string;
  /** Nom lisible de l'outil. */
  toolName: string;
  /** Serveur MCP d'origine, quand l'appel vient d'un serveur. */
  serverName?: string | null;
  /** Action demandée (`write`, `delete`, `execute`…). */
  actionType?: string | null;
  /** Entrées de l'appel. */
  input?: unknown;
};

/** Extrait les demandes d'approbation en attente d'un message. */
export function demandesValidation(message: UIMessage): DemandeValidation[] {
  const parts = (message.parts ?? []) as {
    approval?: { input?: unknown };
    input?: unknown;
    providerMetadata?: unknown;
    state?: string;
    toolCallId?: string;
    toolName?: string;
    type: string;
  }[];
  return parts
    .filter((part) => part.state === "approval-requested" && part.toolName)
    .map((part) => ({
      actionType:
        (part.providerMetadata as { actionType?: string } | undefined)
          ?.actionType ?? null,
      input: part.input ?? part.approval?.input,
      serverName:
        (part.providerMetadata as { serverName?: string } | undefined)
          ?.serverName ?? null,
      toolCallId: part.toolCallId ?? "",
      toolName: part.toolName ?? "",
    }));
}

/** Un libellé lisible pour la cible de l'action. */
function describeCible(demande: DemandeValidation): string | null {
  const entree = demande.input;
  if (typeof entree !== "object" || entree === null) {
    return null;
  }
  const champs = entree as Record<string, unknown>;
  for (const cle of ["url", "path", "filePath", "query", "id", "name"]) {
    const valeur = champs[cle];
    if (typeof valeur === "string" && valeur.trim()) {
      return valeur;
    }
  }
  return null;
}

/** Libellé français de l'action, quand le serveur en a envoyé un. */
function libelleAction(actionType: string | null | undefined): string | null {
  switch (actionType) {
    case "write": {
      return "écrire";
    }
    case "delete": {
      return "supprimer";
    }
    case "execute": {
      return "exécuter";
    }
    default: {
      return null;
    }
  }
}

export function ApprovalCard({
  demande,
  onRepondre,
  busy = false,
}: {
  demande: DemandeValidation;
  onRepondre: (toolCallId: string, approved: boolean) => void;
  busy?: boolean;
}) {
  const cible = describeCible(demande);
  const action = libelleAction(demande.actionType);
  const entrees =
    demande.input && typeof demande.input === "object"
      ? Object.entries(demande.input as Record<string, unknown>)
      : [];
  const affiches = entrees.slice(0, PARAMETRES_AFFICHES);
  const restants = entrees.length - affiches.length;

  return (
    <section
      aria-label={`Validation de l'appel ${demande.toolName}`}
      className="wakies-approval"
      data-state={busy ? "busy" : "pending"}
    >
      <header className="wakies-approval-head">
        <ShieldIcon size={16} />
        <strong>{demande.toolName}</strong>
        {demande.serverName ? (
          <span className="wakies-approval-origin">{demande.serverName}</span>
        ) : null}
      </header>

      <p className="wakies-approval-summary">
        {action
          ? `Ce Wakie demande à ${action} avec cette action. Vérifiez les paramètres avant d'autoriser.`
          : "Ce Wakie demande à effectuer cette action. Vérifiez les paramètres avant d'autoriser."}
      </p>

      {cible ? (
        <p className="wakies-approval-target">
          <span>Cible</span>
          <code>{cible}</code>
        </p>
      ) : null}

      {affiches.length > 0 ? (
        <dl className="wakies-approval-params">
          {affiches.map(([cle, valeur]) => (
            <div key={cle}>
              <dt>{cle}</dt>
              <dd>
                {typeof valeur === "string" ? valeur : JSON.stringify(valeur)}
              </dd>
            </div>
          ))}
          {restants > 0 ? (
            <div>
              <dt>autres</dt>
              <dd>
                {restants} paramètre{restants > 1 ? "s" : ""} de plus
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <footer className="wakies-approval-actions">
        <Button
          // `Button` de @mdevs/ui vaut `type="button"` par défaut : on le dit
          // quand même, pour que le formulaire qui entoure la carte ne
          // transforme pas ce clic en envoi.
          onClick={() => onRepondre(demande.toolCallId, false)}
          type="button"
          variant="outline"
        >
          <XIcon size={15} />
          Refuser
        </Button>
        <Button
          disabled={busy}
          onClick={() => onRepondre(demande.toolCallId, true)}
          type="button"
          variant="solid"
        >
          <CheckIcon size={15} />
          Autoriser
        </Button>
      </footer>
    </section>
  );
}
