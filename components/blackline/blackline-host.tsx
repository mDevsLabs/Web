"use client";

/**
 * ============================================================================
 * MONTAGE DU JEU BLACKLINE DANS L'HÔTE
 * ============================================================================
 *
 * Blackline est un jeu Vite autonome : l'hôte ne le compile pas, il le MONTE.
 * Ce composant est le point de contact entre les deux mondes.
 *
 * LE CHEMIN, ÉTAPE PAR ÉTAPE
 *
 *  1. La CONFIRMATION D'ÂGE est demandée. Tant qu'elle n'est pas donnée, le
 *     bundle du jeu n'est même pas demandé : pas de moteur, pas de texture,
 *     pas de bande passante.
 *
 *  2. Le BUNDLE est chargé. Son nom est FIXE (`/blackline/assets/blackline.js`)
 *     mais son Cache-Control est `no-cache` : le navigateur revalide l'entrée
 *     après chaque déploiement. Les chunks référencés, eux, sont hachés et
 *     immuables. Voir `next.config.ts` et `scripts/build-blackline.mjs`.
 *
 *  3. Le JEU est monté dans le conteneur fourni par la page. Le point d'entrée
 *     du jeu (`apps/blackline/src/entry.ts`) est le MÊME que celui de
 *     l'application autonome : il n'y a pas deux montages à diverger.
 *
 *  4. Les RÉGLAGES de la base sont appliqués au jeu. La base fait foi (c'est
 *     le serveur qui décide, partout ailleurs dans mAI) ; le `localStorage` du
 *     jeu reste le repli hors ligne.
 *
 * LE CONTRAT EST UN OBJET SUR `window`
 *
 * L'hôte appelle `window.blackline.mount(...)`. Ce n'est pas un import :
 * le jeu est un artefact statique, servi depuis `public/`, et son nom de
 * chunk est FIXE. Un export nommé serait élagué par le build (le point
 * d'entrée n'a personne à qui parler tant que l'hôte ne l'appelle pas) —
 * et l'échec serait SILENCIEUX, puisque le chargement du module réussit.
 * Une affectation sur `window` ne peut pas être élaguée.
 *
 * OÙ SONT POSÉES LES CLASSES DU JEU
 *
 * Le jeu posait ses classes (`touch-device`, `reduced-motion`, `left-handed`)
 * sur `<html>` : dans l'hôte, ce document est celui du CHAT, et le jeu
 * repeindrait la barre latérale. Elles sont donc posées sur la racine
 * `.blackline-root` — voir `apps/blackline/src/root.ts`.
 */

import { CameraIcon, Loader2Icon, XIcon } from "@mdevs/icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { BlacklineAgeGate } from "@/components/blackline/age-gate";
import { Button } from "@/components/ui/button";
import {
  type DevicePowerProfile,
  deriveSessionDerogation,
  readDevicePowerProfile,
  type SessionDerogation,
} from "@/lib/blackline/power";
import { versIndicatif } from "@/lib/quizzly/name";
import { useEconomy } from "@/lib/resources/economy";

/** Chunk d'entrée du jeu. Son nom est stable : voir scripts/build-blackline.mjs. */
const CHUNK_ENTREE = "/blackline/assets/blackline.js";

/**
 * Le contrat publié par le jeu.
 *
 * Le jeu le pose sur `window` (voir `apps/blackline/src/mount.ts`) : un
 * export Named pourrait être élagué par le build, et l'hôte chercherait
 * alors un contrat absent — sans le moindre message, puisque le chargement
 * du module réussit.
 */
declare global {
  interface Window {
    blackline?: {
      mount: (options: {
        container: HTMLElement;
        root: HTMLElement;
        settings?: Record<string, unknown>;
      }) => Promise<unknown>;
      /**
       * Démonte le jeu et libère la mémoire du moteur.
       *
       * Optionnel par compatibilité : un artefact plus ancien ne publie pas
       * ce point, et l'hôte ne doit pas casser sur un déploiement décalé.
       */
      unmount?: () => void;
    };
  }
}

type BlacklineProfileInfo = {
  avatarUrl: string | null;
  displayName: string;
  username: string;
};

type BlacklineHostProps = {
  /** Profil initial (pseudo et avatar partagés avec Vibe, Quizzly et le compte mAI). */
  initialProfile?: BlacklineProfileInfo | null;
  /** Réglages enregistrés pour ce compte (base de données). */
  settings?: Record<string, unknown> | null;
};

export function BlacklineHost({
  initialProfile = null,
  settings,
}: BlacklineHostProps) {
  const { mutate } = useSWRConfig();
  // La confirmation d'âge vit ici, et NULLE PART : ni base, ni localStorage,
  // ni cookie. Un rechargement repose la question.
  const [age, setAge] = useState<"pending" | "accepted" | "refused">("pending");
  const [chargement, setChargement] = useState<
    "inactif" | "chargement" | "pret"
  >("inactif");
  const [erreur, setErreur] = useState<string | null>(null);
  const conteneurRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  // Profil énergétique de l'appareil et dérogation de session. Lus une fois,
  // avant la confirmation d'âge : l'accueil les affiche, et le montage les
  // applique par-dessus les réglages du compte.
  const [power, setPower] = useState<DevicePowerProfile | null>(null);
  const [derogation, setDerogation] = useState<SessionDerogation | null>(null);
  const [derogationLue, setDerogationLue] = useState(false);

  // État de la modale d'édition du profil (pseudo + avatar synchronisés sur toute la suite)
  const [editionProfilOuverte, setEditionProfilOuverte] = useState(false);
  const [pseudoActuel, setPseudoActuel] = useState(
    () =>
      initialProfile?.displayName ||
      (typeof settings?.callsign === "string" ? settings.callsign : "") ||
      ""
  );
  const [pseudoSaisi, setPseudoSaisi] = useState(pseudoActuel);
  const [avatarActuel, setAvatarActuel] = useState<string | null>(
    () =>
      initialProfile?.avatarUrl ??
      (typeof settings?.avatarUrl === "string" ? settings.avatarUrl : null)
  );
  const [enregistrementProfil, setEnregistrementProfil] = useState(false);
  const [televersementAvatar, setTeleversementAvatar] = useState(false);
  const fichierAvatarRef = useRef<HTMLInputElement>(null);

  // Les réglages sont lus UNE FOIS : le jeu les applique à son montage, et
  // changer la référence ne doit pas remonter le jeu.
  const reglagesRef = useRef(settings);
  reglagesRef.current = settings;
  // La dérogation est lue au moment du montage, pas à chaque rendu : le jeu
  // applique ses réglages une seule fois.
  const derogationRef = useRef(derogation);
  derogationRef.current = derogation;

  useEffect(() => {
    const ouvrirEditionProfil = (event: Event) => {
      const detail = (
        event as CustomEvent<{ avatarUrl?: string | null; callsign?: string }>
      ).detail;
      setPseudoSaisi(
        pseudoActuel ||
          (typeof detail?.callsign === "string" ? detail.callsign : "")
      );
      if (detail?.avatarUrl && !avatarActuel) {
        setAvatarActuel(detail.avatarUrl);
      }
      setEditionProfilOuverte(true);
    };
    window.addEventListener("blackline:edit-profile", ouvrirEditionProfil);
    return () => {
      window.removeEventListener("blackline:edit-profile", ouvrirEditionProfil);
    };
  }, [avatarActuel, pseudoActuel]);

  const televerserAvatar = async (
    evenement: React.ChangeEvent<HTMLInputElement>
  ) => {
    const fichier = evenement.target.files?.[0];
    if (!fichier) {
      return;
    }
    setTeleversementAvatar(true);
    const formData = new FormData();
    formData.append("avatar", fichier);
    try {
      const reponse = await fetch("/api/settings", {
        body: formData,
        method: "POST",
      });
      const recu = (await reponse.json().catch(() => null)) as {
        avatarUrl?: string;
        error?: { message?: string } | string;
        message?: string;
        success?: boolean;
      } | null;
      if (!reponse.ok || !recu?.success || !recu.avatarUrl) {
        const msg =
          typeof recu?.error === "string"
            ? recu.error
            : recu?.error?.message ||
              recu?.message ||
              "Impossible de téléverser l'avatar.";
        toast.error(msg);
        return;
      }
      setAvatarActuel(recu.avatarUrl);
      window.dispatchEvent(
        new CustomEvent("blackline:profile-updated", {
          detail: {
            avatarUrl: recu.avatarUrl,
            callsign: versIndicatif(pseudoActuel || pseudoSaisi),
          },
        })
      );
      void mutate("/api/settings");
      void mutate("/api/quizzly/resume");
      void mutate("/api/quizzly/profil");
      void mutate("/api/blackline/settings");
      toast.success("Avatar mis à jour sur tout votre compte !");
    } catch {
      toast.error("Erreur lors de la mise à jour de l'avatar.");
    } finally {
      setTeleversementAvatar(false);
      if (fichierAvatarRef.current) {
        fichierAvatarRef.current.value = "";
      }
    }
  };

  const enregistrerProfil = async (evenement: React.FormEvent) => {
    evenement.preventDefault();
    const nomNettoye = pseudoSaisi.trim();
    if (nomNettoye.length < 2 || nomNettoye.length > 40) {
      toast.error("Le pseudo doit comporter entre 2 et 40 caractères.");
      return;
    }
    setEnregistrementProfil(true);
    try {
      const reponse = await fetch("/api/quizzly/profil", {
        body: JSON.stringify({ displayName: nomNettoye }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      const recu = (await reponse.json().catch(() => null)) as {
        displayName?: string;
        error?: { message?: string } | string;
        message?: string;
      } | null;
      if (!reponse.ok) {
        const msg =
          typeof recu?.error === "string"
            ? recu.error
            : recu?.error?.message ||
              recu?.message ||
              "Impossible d'enregistrer le pseudo.";
        toast.error(msg);
        return;
      }
      const nouveauNom = recu?.displayName?.trim() || nomNettoye;
      setPseudoActuel(nouveauNom);
      setPseudoSaisi(nouveauNom);
      window.dispatchEvent(
        new CustomEvent("blackline:profile-updated", {
          detail: {
            avatarUrl: avatarActuel,
            callsign: versIndicatif(nouveauNom),
          },
        })
      );
      void mutate("/api/settings");
      void mutate("/api/quizzly/resume");
      void mutate("/api/quizzly/profil");
      void mutate("/api/blackline/settings");
      toast.success(
        "Profil mis à jour sur Blackline, Vibe, Quizzly et votre compte mAI !"
      );
      setEditionProfilOuverte(false);
    } catch {
      toast.error("Erreur lors de l'enregistrement du profil.");
    } finally {
      setEnregistrementProfil(false);
    }
  };

  /**
   * Le jeu est une activité LOURDE : pendant qu'il tourne, l'hôte passe en
   * VEILLE (animations coupées, rafraîchissements et temps réel suspendus).
   * Le signal est libéré par la fonction de nettoyage, quoi qu'il arrive.
   *
   * Il n'est posé QU'UNE FOIS LE MOTEUR MONTÉ : pendant l'accueil et le
   * chargement, rien ne tourne encore au rythme du jeu, et mettre mAI en
   * veille pour un écran de présentation serait une économie imaginaire.
   */
  const { registerHeavyTask } = useEconomy();
  useEffect(() => {
    if (chargement !== "pret") {
      return;
    }
    return registerHeavyTask("blackline");
  }, [chargement, registerHeavyTask]);

  // Lecture du profil énergétique au montage de l'hôte. Une API absente vaut
  // « inconnu» : l'accueil l'écrit, et rien n'est dérogé.
  useEffect(() => {
    let annule = false;
    void readDevicePowerProfile().then((profil) => {
      if (annule) {
        return;
      }
      setPower(profil);
      setDerogation(deriveSessionDerogation(profil));
    });
    return () => {
      annule = true;
    };
  }, []);

  const monterJeu = useCallback(async () => {
    const conteneur = conteneurRef.current;
    if (!conteneur) {
      return;
    }
    setChargement("chargement");
    try {
      // Le jeu est un point d'entrée ES : il publie son contrat sur
      // `window.blackline` (voir apps/blackline/src/mount.ts). Un export nommé
      // pourrait être ÉLAGUÉ par le build — le point d'entrée n'a personne à
      // qui parler tant que l'hôte ne l'appelle pas — et l'hôte chercherait
      // alors un contrat absent, sans le moindre message.
      //
      // `window.blackline` ne peut pas être élagué : rien ne le rend inutile
      // au regard de l'arbreur.
      const contrat = window.blackline;
      if (!contrat?.mount) {
        throw new Error(
          "Le jeu n'a pas publié son point de montage (window.blackline.mount)."
        );
      }
      // Les réglages du COMPTE restent la référence ; la dérogation de
      // session ne fait que les resserrer (batterie faible, mémoire limitée).
      // Elle n'est écrite nulle part : elle disparaît avec la page.
      const reglagesSession = {
        ...(reglagesRef.current ?? {}),
        ...(derogationRef.current?.overrides ?? {}),
      };
      await contrat.mount({
        container: conteneur,
        root: conteneur,
        settings: reglagesSession,
      });
      setChargement("pret");
    } catch (error) {
      console.error("BLACKLINE : montage impossible", error);
      setErreur(
        "Le jeu n'a pas pu être chargé. Vérifiez que WebGL 2 est disponible, puis rechargez la page."
      );
      setChargement("inactif");
    }
  }, []);

  // Le montage a lieu UNE SEULE FOIS, après la confirmation d'âge.
  //
  // Le SCRIPT est inséré et ATTENDU : le jeu publie son contrat sur
  // `window.blackline` au chargement du module. Monter avant que le module
  // soit exécuté trouverait un contrat absent — et l'échec serait
  // silencieux, puisque le module arrive une fraction de seconde plus tard.
  useEffect(() => {
    if (age !== "accepted") {
      return;
    }
    // Un montage déjà en cours ou déjà fait : on ne recommence pas.
    if (scriptRef.current) {
      return;
    }

    const script = document.createElement("script");
    script.type = "module";
    script.src = CHUNK_ENTREE;
    script.async = true;
    document.body.appendChild(script);
    scriptRef.current = script;

    const demarrer = () => {
      void monterJeu();
    };
    script.addEventListener("load", demarrer);
    // Le script a pu être exécuté avant que l'écouteur ne soit posé (il
    // vient du cache) : le contrat est alors déjà publié.
    if (window.blackline?.mount) {
      demarrer();
    }

    return () => {
      script.removeEventListener("load", demarrer);
      // Le moteur est démonté AVANT le retrait de la balise : c'est lui qui
      // tient la boucle de rendu et le contexte WebGL. Sans cette étape, le
      // jeu continuait de tourner dans le vide après la sortie de la page —
      // la boucle se relançait elle-même, et le navigateur refusait d'ouvrir
      // un nouveau contexte WebGL tant que l'ancien n'était pas lâché.
      window.blackline?.unmount?.();
      script.remove();
      scriptRef.current = null;
    };
  }, [age, monterJeu]);

  if (age === "refused") {
    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <div className="surface-card flex max-w-md flex-col gap-4 p-6 text-center">
          <h2 className="text-lg font-bold text-foreground">
            Blackline est réservé aux 16 ans et plus
          </h2>
          <p className="text-sm text-muted-foreground">
            Ce jeu est classé PEGI 16. Vous pouvez continuer à utiliser mAI
            normalement.
          </p>
          <Button asChild className="mx-auto" variant="outline">
            <a href="/">Retour à mAI</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#17211e]">
      {/*
        La RACINE DU JEU. Elle porte la classe `blackline-root` : c'est
        l'élément sous lequel toute la feuille de style du jeu est re-ancrée,
        et celui qui reçoit ses classes d'état (`touch-device`,
        `reduced-motion`, `left-handed`…).

        Elle est `relative` : le canvas du jeu est en `position:absolute`
        (et non `fixed` — voir scripts/build-blackline-css.mjs), donc il se
        borne à CETTE racine et ne couvre jamais la barre latérale du chat.
      */}
      <div className="blackline-root absolute inset-0" ref={conteneurRef}>
        {/*
          Le canvas et l'interface du jeu. Le jeu les crée lui-même : ce
          conteneur n'est qu'un point d'ancrage, et il ne doit contenir QUE ce
          que le jeu y met.
        */}
      </div>

      {editionProfilOuverte && (
        <div
          aria-labelledby="blackline-edit-profile-title"
          aria-modal="true"
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
        >
          <form
            className="flex w-full max-w-md flex-col gap-5 rounded-2xl border border-white/15 bg-[#121c18] p-6 text-[#eef4e4] shadow-2xl"
            onSubmit={enregistrerProfil}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#c6dd94]/70">
                  Profil unifié · Suite mAI
                </p>
                <h2
                  className="mt-0.5 text-lg font-bold text-[#eef4e4]"
                  id="blackline-edit-profile-title"
                >
                  Modifier votre profil
                </h2>
              </div>
              <button
                aria-label="Fermer"
                className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                onClick={() => setEditionProfilOuverte(false)}
                type="button"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-full border border-[#c6dd94]/50 bg-[#192720] flex items-center justify-center">
                {avatarActuel ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={pseudoSaisi || "Avatar"}
                    className="size-full object-cover"
                    src={avatarActuel}
                  />
                ) : (
                  <span className="text-xl font-bold text-[#c6dd94]">
                    {(pseudoSaisi || pseudoActuel || "O")
                      .trim()
                      .charAt(0)
                      .toUpperCase() || "O"}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <button
                  className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/15 cursor-pointer disabled:opacity-50"
                  disabled={televersementAvatar}
                  onClick={() => fichierAvatarRef.current?.click()}
                  type="button"
                >
                  {televersementAvatar ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : (
                    <CameraIcon className="size-3.5 text-[#c6dd94]" />
                  )}
                  {televersementAvatar
                    ? "Téléversement…"
                    : "Changer la photo d'avatar"}
                </button>
                <span className="text-[11px] text-[#c6dd94]/70">
                  S&apos;applique à Blackline, Vibe, Quizzly et votre compte
                  mAI.
                </span>
                <input
                  accept="image/*"
                  className="hidden"
                  onChange={televerserAvatar}
                  ref={fichierAvatarRef}
                  type="file"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#c6dd94]"
                htmlFor="blackline-profile-pseudo"
              >
                Pseudo
              </label>
              <input
                className="h-10 w-full rounded-xl border border-white/15 bg-black/30 px-3 text-sm text-white placeholder:text-white/40 focus:border-[#c6dd94] focus:outline-none"
                id="blackline-profile-pseudo"
                maxLength={40}
                minLength={2}
                onChange={(e) => setPseudoSaisi(e.target.value)}
                placeholder="Votre pseudo"
                required
                type="text"
                value={pseudoSaisi}
              />
              <span className="text-[11px] text-[#c6dd94]/70">
                Synchronisé avec Vibe, Quizzly et le compte mAI en général.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                className="border-white/25 bg-white/5 text-white hover:bg-white/15 hover:text-white"
                onClick={() => setEditionProfilOuverte(false)}
                type="button"
                variant="outline"
              >
                Annuler
              </Button>
              <Button
                className="bg-[#c6dd94] text-[#0f1714] hover:bg-[#d6e9ac]"
                disabled={enregistrementProfil}
                type="submit"
              >
                {enregistrementProfil ? (
                  <>
                    <Loader2Icon className="mr-1.5 size-4 animate-spin" />
                    Enregistrement…
                  </>
                ) : (
                  "Enregistrer"
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/*
        Pendant la partie : l'état de veille est VISIBLE, et la dérogation de
        session est expliquée. Une réduction de qualité silencieuse passerait
        pour un défaut d'affichage ; ici, elle est datée et refermable.
      */}
      {age === "accepted" && chargement === "pret" && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-20 flex max-w-xs flex-col items-start gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/70 backdrop-blur-md">
            <span className="size-1.5 rounded-full bg-[#c6dd94]" />
            Veille mAI active
          </span>
          {derogation?.reason && !derogationLue && (
            <div className="pointer-events-auto rounded-xl border border-white/15 bg-black/65 p-2.5 text-[11px] leading-relaxed text-white/80 backdrop-blur-md">
              <p>{derogation.reason}</p>
              <button
                className="mt-1.5 rounded-lg border border-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/70 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                onClick={() => setDerogationLue(true)}
                type="button"
              >
                Compris
              </button>
            </div>
          )}
        </div>
      )}

      {chargement === "chargement" && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#c6dd94]">
          <div className="size-10 animate-spin rounded-full border-2 border-[#c6dd94]/30 border-t-[#c6dd94]" />
          <p className="text-xs font-semibold uppercase tracking-[0.25em]">
            Préparation de l&apos;opération
          </p>
        </div>
      )}

      {erreur && (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="surface-card flex max-w-md flex-col gap-4 p-6 text-center">
            <h2 className="text-lg font-bold text-foreground">
              Le jeu n&apos;a pas pu démarrer
            </h2>
            <p className="text-sm text-muted-foreground">{erreur}</p>
            <Button
              className="mx-auto"
              onClick={() => {
                setErreur(null);
                setChargement("inactif");
              }}
              variant="outline"
            >
              Réessayer
            </Button>
          </div>
        </div>
      )}

      {age === "pending" && (
        <BlacklineAgeGate
          derogation={derogation}
          onDecide={(result) => {
            setAge(result);
            if (result === "refused") {
              toast.info(
                "Blackline est classé PEGI 16 : l'accès est réservé aux 16 ans et plus."
              );
            }
          }}
          power={power}
        />
      )}
    </div>
  );
}
