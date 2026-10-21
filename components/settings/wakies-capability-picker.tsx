"use client";

/**
 * ============================================================================
 * CAPACITÉS D'UN WAKIE — COMPOSANT HÔTE
 * ============================================================================
 *
 * POURQUOI UN COMPOSANT DISTINCT
 *
 * L'onglet « Applications » des paramètres mAI montre les outils, les
 * compétences et les extensions d'un Wakie. Il le faisait avec les
 * composants de l'app Wakies (`ToolPicker`, `CapacityPicker`), qui portent
 * les classes `capability-*` de la feuille Wakies.
 *
 * Or cette feuille est GENERÉE et ré-ancrée sous `.wakies-root` : elle
 * n'existe que dans l'app Wakies. Hors de `.wakies-root` — donc dans les
 * paramètres de l'hôte — les classes ne sont pas déclarées, les éléments
 * restent en `display: inline`, et toutes les options s'écoulent sur une
 * seule ligne : la case à cocher, son libellé et son statut se suivent
 * dans le même flux de texte.
 *
 * Ce composant refait la même présentation avec les utilitaires de l'hôte :
 * une ligne par option, la case alignée sur le libellé, le statut sur sa
 * PROPRE ligne.
 *
 * L'app Wakies garde son composant et sa feuille : la feuille Wakies n'est
 * pas étendue hors de son périmètre, et les deux écrans restent lisibles.
 *
 * LES DONNÉES
 *
 * Elles viennent du compte (compétences, catalogue d'extensions, serveurs
 * MCP) et sont lues par `useCapabilities`, partagé avec l'app Wakies.
 */

import { ServerCogIcon } from "@mdevs/icons/cloud/server-cog";
import { BotIcon } from "@mdevs/icons/misc/bot";
import { SparklesIcon } from "@mdevs/icons/misc/sparkles";
import { WrenchIcon } from "@mdevs/icons/tools/wrench";
import type {
  Capabilities,
  Competence,
  Extension,
  ServeurMcp,
} from "@/components/wakies/use-capabilities";
import { cn } from "@/lib/utils";

/** Ton d'un statut, et la couleur qui va avec. */
const TON_STATUT = {
  destructive: "text-destructive",
  info: "text-info",
  warning: "text-warning",
} as const;

type Statut = {
  texte: string;
  ton: keyof typeof TON_STATUT;
};

/**
 * Une ligne d'option.
 *
 * La case et le libellé partagent la première ligne, le statut occupe la
 * seconde : c'est lui qui explique pourquoi une option n'est pas
 * disponible, et il ne doit pas se confondre avec les autres libellés.
 */
function Ligne({
  actif,
  disabled = false,
  libelle,
  onBasculer,
  statut,
}: {
  actif: boolean;
  disabled?: boolean;
  libelle: string;
  onBasculer: () => void;
  statut?: Statut;
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-2.5 px-2 py-2 transition-colors",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:bg-muted/40"
      )}
    >
      <input
        checked={actif}
        className="mt-0.5 size-4 shrink-0 accent-primary"
        disabled={disabled}
        onChange={onBasculer}
        type="checkbox"
      />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[13px] leading-tight text-foreground">
          {libelle}
        </span>
        {statut ? (
          <span className={cn("text-[11px] leading-snug", TON_STATUT[statut.ton])}>
            {statut.texte}
          </span>
        ) : null}
      </span>
    </label>
  );
}

/** Titre d'un groupe d'options. */
function Titre({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon: typeof WrenchIcon;
}) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      <Icon className="size-3.5" />
      {children}
    </div>
  );
}

/** Bascule un identifiant dans une liste. */
function basculer(liste: string[], id: string): string[] {
  return liste.includes(id) ? liste.filter((x) => x !== id) : [...liste, id];
}

export type WakiesOutil = {
  description?: string;
  ecritCompte?: boolean;
  id: string;
  label: string;
};

/**
 * Outils proposés au modèle d'un Wakie.
 *
 * Un outil qui écrit dans le compte n'est jamais coché par défaut, et le
 * dit : l'utilisateur voit ce qu'il autorise.
 */
export function WakiesToolPicker({
  outils,
  valeur,
  onChanger,
}: {
  outils: WakiesOutil[];
  valeur: string[];
  onChanger: (suivant: string[]) => void;
}) {
  const listeOutils = Array.isArray(outils) ? outils : [];
  return (
    <div className="flex flex-col gap-2">
      <Titre icon={WrenchIcon}>Outils de ce Wakie</Titre>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Ces outils sont proposés au modèle à chaque tour. Un outil qui écrit
        dans votre compte n&apos;est jamais coché par défaut.
      </p>
      <div className="flex flex-col divide-y divide-border/40 rounded-xl border border-border/50 bg-card/40">
        {listeOutils.map((outil) => (
          <Ligne
            actif={valeur.includes(outil.id)}
            key={outil.id}
            libelle={outil.label}
            onBasculer={() => onChanger(basculer(valeur, outil.id))}
            statut={
              outil.ecritCompte
                ? {
                    texte: "Cette action modifie votre compte mAI.",
                    ton: "destructive",
                  }
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Compétences, extensions et serveurs MCP d'un Wakie.
 *
 * Les quatre situations d'une extension restent distinctes, et le texte le
 * dit : « Installer », « activer » et « connecter un compte externe » sont
 * trois gestes différents. L'interface ne montre jamais de simple coche
 * verte là où rien ne s'exécute.
 */
export function WakiesCapacityPicker({
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
  const competences: Competence[] = Array.isArray(capabilities?.competences)
    ? capabilities.competences
    : [];
  const extensions: Extension[] = Array.isArray(capabilities?.extensions)
    ? capabilities.extensions
    : [];
  const serveurs: ServeurMcp[] = Array.isArray(capabilities?.serveurs)
    ? capabilities.serveurs
    : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Titre icon={SparklesIcon}>Compétences</Titre>
        {competences.length === 0 ? (
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Aucune compétence dans votre bibliothèque. Créez-en depuis
            Applications, dans votre compte mAI.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-border/40 rounded-xl border border-border/50 bg-card/40">
            {competences.map((competence) => (
              <Ligne
                actif={valeur.skillIds.includes(competence.id)}
                key={competence.id}
                libelle={competence.name}
                onBasculer={() =>
                  onChanger({
                    ...valeur,
                    skillIds: basculer(valeur.skillIds, competence.id),
                  })
                }
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Titre icon={BotIcon}>Extensions</Titre>
        {extensions.length === 0 ? (
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Aucune extension disponible sur ce compte.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-border/40 rounded-xl border border-border/50 bg-card/40">
            {extensions.map((extension) => {
              const installee = extension.installed === true;
              const activee = extension.enabled === true;
              const verrouillee = extension.locked === true;
              // Un outil d'extension ne devient exécutable que si elle est
              // installée ET activée ET accessible au forfait. L'interface le
              // dit, au lieu de cocher une case qui ne produirait aucun
              // effet.
              const statut: Statut | null = verrouillee
                ? {
                    texte: "Nécessite un forfait supérieur.",
                    ton: "warning",
                  }
                : installee
                  ? activee
                    ? null
                    : {
                        texte:
                          "Installée mais désactivée : ses outils ne sont pas exposés.",
                        ton: "warning",
                      }
                  : {
                      texte:
                        "Non installée — activez-la depuis votre compte mAI.",
                      ton: "info",
                    };
              return (
                <Ligne
                  actif={valeur.pluginIds.includes(extension.id)}
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
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Titre icon={ServerCogIcon}>Serveurs MCP</Titre>
        {serveurs.length === 0 ? (
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Aucun serveur MCP installé. Ajoutez-en depuis votre compte mAI.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-border/40 rounded-xl border border-border/50 bg-card/40">
            {serveurs.map((serveur) => (
              <Ligne
                actif={valeur.mcpServerIds.includes(serveur.id)}
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
                    ? { texte: "Serveur désactivé.", ton: "destructive" }
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
