"use client";

/**
 * ============================================================================
 * Configuration de départ — assistant en six étapes
 * ============================================================================
 *
 * POURQUOI CET ASSISTANT ÉDITE LE WAKIE EXISTANT
 *
 * `ensureStarterWorkspace` crée déjà un espace et un profil « Wakie » à la
 * première visite, et pose `onboardingCompleted: false`. L'assistant MODIFIE
 * ce profil au lieu d'en créer un deuxième : aucun quota consommé, aucun espace
 * dupliqué, et surtout « quitter puis reprendre » fonctionne tout seul — le
 * profil à moitié configured EST déjà en base.
 *
 * C'est aussi ce qui permet de quitter à l'étape 3 et de revenir demain : à la
 * reprise, le formulaire repart des valeurs enregistrées, pas d'un état local
 * perdu.
 *
 * `PUT` EST UN REMPLACEMENT COMPLET
 *
 * `name`, `instructions`, `memoryAllowed` et `researchAllowed` sont obligatoires
 * à chaque appel. Chaque étape reconstruit donc sa charge utile depuis le
 * profil COURANT plus le champ qu'elle modifie. Sans cela, choisir une mascotte
 * à l'étape 3 renommerait le Wakie « Wakie » et viderait ses instructions.
 *
 * L'ORDRE DES ÉTAPES EST EXPLICITE
 *
 * Les préférences du compte (mémoires) sont présentées AVANT les compétences,
 * et les compétences ne sont jamais fusionnées avec les instructions du Wakie :
 * trois niveaux distincts, du plus faible au plus fort — choix de
 * l'utilisateur, puis configuration du compagnon, puis consigne de rôle.
 */

import { ArrowRightIcon } from "@mdevs/icons/arrows/arrow-right";
import { CheckIcon } from "@mdevs/icons/controls/check";
import { XIcon } from "@mdevs/icons/controls/x";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ModelPicker } from "@/components/wakies/ModelPicker";
import {
  DEFAULT_WAKIE_AVATAR,
  isWakieAvatar,
  WAKIE_AVATARS,
} from "@/lib/wakies/shared/avatars";
import type { Settings, Space, Wakie } from "@/lib/wakies/shared/types";

type Etape = "nom" | "avatar" | "personnalite" | "permissions" | "fin";

const ETAPES: { cle: Etape; titre: string }[] = [
  { cle: "nom", titre: "Son nom" },
  { cle: "avatar", titre: "Son visage" },
  { cle: "personnalite", titre: "Sa façon de répondre" },
  { cle: "permissions", titre: "Ce qu'il peut faire" },
  { cle: "fin", titre: "C'est prêt" },
];

/** Longueurs alignées sur les schémas serveur, qui restent l'autorité. */
const NOM_MAX = 40;
const INSTRUCTIONS_MIN = 3;
const INSTRUCTIONS_MAX = 2000;

export function Onboarding({
  espace,
  reglage,
  wakie,
  onEnregistrer,
  onTerminer,
  onRepartir,
}: {
  /** Espace de départ, destination des pages enregistrées. */
  espace: Space | undefined;
  /** Réglages du COMPTE mAI, référents affichés à l'étape des permissions. */
  reglage: Settings;
  /** Profil de départ, que cet assistant MODIFIE au lieu d'en créer un second. */
  wakie: Wakie;
  /** Renvoie `true` si l'enregistrement a abouti. */
  onEnregistrer: (corps: Record<string, unknown>) => Promise<boolean>;
  /** Marque la configuration comme achevée côté serveur. */
  onTerminer: () => Promise<void>;
  /** Ferme l'assistant sans le marquer comme achevé. */
  onRepartir: () => void;
}) {
  const [etape, setEtape] = useState<Etape>("nom");
  const [nom, setNom] = useState(wakie.name);
  const [avatar, setAvatar] = useState(
    isWakieAvatar(wakie.avatar) ? wakie.avatar : DEFAULT_WAKIE_AVATAR
  );
  const [instructions, setInstructions] = useState(wakie.instructions);
  const [model, setModel] = useState<string | null>(wakie.model ?? null);
  const [research, setResearch] = useState(wakie.researchAllowed);
  const [memory, setMemory] = useState(wakie.memoryAllowed);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState("");

  const index = ETAPES.findIndex((entree) => entree.cle === etape);
  const nomValide = nom.trim().length > 0 && nom.trim().length <= NOM_MAX;
  const instructionsValides =
    instructions.trim().length >= INSTRUCTIONS_MIN &&
    instructions.trim().length <= INSTRUCTIONS_MAX;

  /**
   * Charge utile COMPLÈTE à chaque étape. Le `spaceId` est repris tel quel :
   * le contrat de création l'exige, et le résoudre ici transformerait cette
   * livraison de configuration en module de gestion d'espaces.
   */
  const corps = useCallback(
    () => ({
      avatar,
      instructions: instructions.trim(),
      mcpServerIds: wakie.mcpServerIds ?? [],
      memoryAllowed: memory,
      model,
      name: nom.trim(),
      pluginIds: wakie.pluginIds ?? [],
      researchAllowed: research,
      skillIds: wakie.skillIds ?? [],
      spaceId: wakie.spaceId ?? espace?.id ?? "",
      spaceIds: wakie.spaceIds.length > 0 ? wakie.spaceIds : [espace?.id ?? ""],
      toolIds: wakie.toolIds ?? [],
    }),
    [
      avatar,
      espace?.id,
      instructions,
      memory,
      model,
      nom,
      research,
      wakie.mcpServerIds,
      wakie.pluginIds,
      wakie.skillIds,
      wakie.spaceId,
      wakie.spaceIds,
      wakie.toolIds,
    ]
  );

  const enregistrer = useCallback(async () => {
    setBusy(true);
    setErreur("");
    const ok = await onEnregistrer(corps());
    setBusy(false);
    if (!ok) {
      setErreur(
        "L'enregistrement n'a pas abouti. Votre configuration est conservée ici ; réessayez."
      );
      return false;
    }
    return true;
  }, [corps, onEnregistrer]);

  const suivant = useCallback(async () => {
    const cible = ETAPES[index + 1];
    if (!cible) {
      // Dernière étape : on marque comme achevé, sinon l'assistant reviendrait
      // à la prochaine visite.
      setBusy(true);
      await onTerminer();
      setBusy(false);
      onRepartir();
      return;
    }
    if (await enregistrer()) {
      setEtape(cible.cle);
    }
  }, [enregistrer, index, onRepartir, onTerminer]);

  // Les préférences du compte sont la référence affichée, mais le choix par
  // défaut d'un Wakie reste le sien : c'est ce qui lui est proposé.
  useEffect(() => {
    if (etape !== "permissions") {
      return;
    }
    setMemory((actuelle) => actuelle || reglage.memoryAllowed);
    setResearch((actuelle) => actuelle || reglage.researchAllowed);
  }, [etape, reglage.memoryAllowed, reglage.researchAllowed]);

  const apercu = useMemo(
    () => instructions.trim() || "Aucune consigne de rôle pour l'instant.",
    [instructions]
  );

  return (
    // `section` + `aria-label` est l'équivalent sémantique de
    // `div[role=region]` : même nom accessible, pas de rôle redondant.
    <section aria-label="Configuration de départ" className="onboarding">
      <header className="onboarding-head">
        <img alt="" height={56} src="/wakies/logo.png" width={56} />
        <div>
          <span className="eyebrow">CONFIGURATION DE DÉPART</span>
          <h2>{ETAPES[index].titre}</h2>
        </div>
        <button
          aria-label="Fermer la configuration et reprendre plus tard"
          className="icon-button onboarding-close"
          onClick={onRepartir}
          type="button"
        >
          <XIcon size={16} />
        </button>
      </header>

      <ol className="onboarding-steps">
        {ETAPES.map((entree, position) => (
          <li
            className={
              position === index ? "active" : position < index ? "done" : ""
            }
            key={entree.cle}
          >
            {position < index ? <CheckIcon size={13} /> : position + 1}
          </li>
        ))}
      </ol>

      <div className="onboarding-body">
        {etape === "nom" ? (
          <label className="onboarding-field">
            <span>Comment s&apos;appelle-t-il ?</span>
            <input
              autoFocus
              maxLength={NOM_MAX}
              onChange={(event) => setNom(event.target.value)}
              placeholder="Wakie"
              value={nom}
            />
            <small>
              Entre 1 et {NOM_MAX} caractères. C&apos;est son nom affiché, pas
              celui de votre compte.
            </small>
            {nom.trim().length > 0 && !nomValide ? (
              <small className="is-error">Ce nom est trop long.</small>
            ) : null}
          </label>
        ) : null}

        {etape === "avatar" ? (
          <fieldset className="onboarding-field">
            <legend>Quel visage ?</legend>
            <p className="muted">
              Il apparaîtra dans la navigation, l&apos;en-tête du chat et vos
              conversations.
            </p>
            <div className="avatar-picker">
              {WAKIE_AVATARS.map((choix) => (
                <label
                  className={`avatar-choice ${avatar === choix ? "active" : ""}`}
                  key={choix}
                >
                  <input
                    checked={avatar === choix}
                    name="onboarding-avatar"
                    onChange={() => setAvatar(choix)}
                    type="radio"
                    value={choix}
                  />
                  <img
                    alt={`Mascotte ${choix}`}
                    height={64}
                    src={`/wakies/${choix}.png`}
                    width={64}
                  />
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        {etape === "personnalite" ? (
          <>
            <label className="onboarding-field">
              <span>Ses consignes de rôle</span>
              <textarea
                maxLength={INSTRUCTIONS_MAX}
                onChange={(event) => setInstructions(event.target.value)}
                placeholder="Vous êtes un partenaire de recherche rigoureux. Comparez les preuves et dites clairement ce qui reste incertain."
                rows={5}
                value={instructions}
              />
              <small>
                Entre {INSTRUCTIONS_MIN} et {INSTRUCTIONS_MAX} caractères.{" "}
                {instructions.trim().length}/{INSTRUCTIONS_MAX}
              </small>
            </label>
            <div className="onboarding-preview">
              <span className="muted">APERÇU</span>
              <p>{apercu}</p>
            </div>
            <fieldset className="space-access-fields">
              <legend>Modèle par défaut</legend>
              <p className="muted">
                Le modèle de ses nouvelles conversations. Vous pourrez en
                choisir un autre pour une conversation précise.
              </p>
              <span className="wakies-model-picker block">
                <ModelPicker bloc onChoisir={setModel} valeur={model ?? ""} />
              </span>
            </fieldset>
          </>
        ) : null}

        {etape === "permissions" ? (
          <>
            <p className="muted">
              Ces permissions s&apos;appliquent à {nom.trim() || "ce Wakie"}{" "}
              uniquement. Elles ne changent pas vos réglages de compte, et ne
              donnent accès à rien qui ne soit déjà installé.
            </p>
            <label className="permission-row">
              <input
                checked={research}
                onChange={(event) => setResearch(event.target.checked)}
                type="checkbox"
              />
              <span>
                <strong>Recherche sur les pages publiques</strong>
                <small>
                  Autorise l&apos;outil de recherche, en lecture seule, côté
                  serveur. Rien n&apos;est envoyé à un tiers sans votre accord.
                </small>
              </span>
            </label>
            <label className="permission-row">
              <input
                checked={memory}
                onChange={(event) => setMemory(event.target.checked)}
                type="checkbox"
              />
              <span>
                <strong>Utiliser les mémoires enregistrées</strong>
                <small>
                  Inclut vos préférences dans les nouveaux tours. Vos réglages
                  globaux ({reglage.memoryAllowed ? "autorisés" : "refusés"})
                  restent prioritaires.
                </small>
              </span>
            </label>
            <p className="muted">
              Rien n&apos;est coché par défaut pour un accès sensible : vous
              choisissez.
            </p>
          </>
        ) : null}

        {etape === "fin" ? (
          <>
            <p className="muted">
              Voici ce que vous avez configuré. Tout reste modifiable depuis les
              réglages.
            </p>
            <dl className="onboarding-recap">
              <div>
                <dt>Nom</dt>
                <dd>{nom.trim()}</dd>
              </div>
              <div>
                <dt>Mascotte</dt>
                <dd>
                  <img
                    alt=""
                    height={24}
                    src={`/wakies/${avatar}.png`}
                    width={24}
                  />{" "}
                  {avatar}
                </dd>
              </div>
              <div>
                <dt>Modèle</dt>
                <dd>{model ?? "Celui de votre compte mAI"}</dd>
              </div>
              <div>
                <dt>Recherche publique</dt>
                <dd>{research ? "Autorisée" : "Non autorisée"}</dd>
              </div>
              <div>
                <dt>Mémoires du compte</dt>
                <dd>{memory ? "Utilisées" : "Non utilisées"}</dd>
              </div>
            </dl>
          </>
        ) : null}

        {erreur ? (
          <p className="chat-error" role="alert">
            {erreur}
          </p>
        ) : null}
      </div>

      <footer className="onboarding-foot">
        <button
          className="text-button"
          disabled={index === 0 || busy}
          onClick={() => setEtape(ETAPES[index - 1].cle)}
          type="button"
        >
          Retour
        </button>
        <button
          className="primary"
          disabled={
            busy ||
            (etape === "nom" && !nomValide) ||
            (etape === "personnalite" && !instructionsValides)
          }
          onClick={() => void suivant()}
          type="button"
        >
          {busy
            ? "Enregistrement…"
            : index === ETAPES.length - 1
              ? "Ouvrir la conversation"
              : "Continuer"}
          <ArrowRightIcon size={16} />
        </button>
      </footer>
    </section>
  );
}
