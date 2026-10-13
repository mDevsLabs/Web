"use client";

/**
 * Page de réglages des Wakies — ce que le dialogue « Réglages » ne pouvait pas
 * être.
 *
 * POURQUOI UNE PAGE
 *
 * Les réglages vivaient dans une variante de `WorkspaceDialog` : deux cases,
 * dans une fenêtre qui rend le reste de l'atelier inerte, sans URL donc sans
 * lien, sans retour arrière, et perdue dès la fermeture. Une page a une adresse,
 * un titre, et permet de revenir à un réglage plus tard.
 *
 * CE QUE CETTE PAGE NE FAIT PAS
 *
 * Les capacités (modèle, outils, extensions, MCP, compétences) sont réglées
 * PAR WAKIE, parce que c'est la hiérarchie que le serveur applique
 * (conversation → Wakie → défaut). Il n'existe aucun réglage de CAPACITÉS au
 * niveau du compte : une case « par défaut pour tous » inventerait un troisième
 * niveau de repli et élargirait silencieusement le plateau de chaque Wakie.
 *
 * Les quotas sont LUS, jamais recalculés : les nombres affichés sont ceux que
 * le serveur opposera un refus.
 */

import { useEffect, useState } from "react";
import { api } from "@/components/wakies/api";
import {
  CapacityPicker,
  ToolPicker,
  useCapabilities,
} from "@/components/wakies/CapacityPicker";
import { FileLibrary } from "@/components/wakies/FileLibrary";
import { ModelPicker } from "@/components/wakies/ModelPicker";
import { getIntegrationProvider } from "@/lib/integrations/providers";
import type { IntegrationStatus } from "@/lib/integrations/status";
import { confirmInApp } from "@/lib/ui/app-dialog";
import type { SetupStatus, Wakie } from "@/lib/wakies/shared/types";
import { WAKIE_TOOL_CATALOG } from "@/lib/wakies/tool-catalog";

type ReglagesCompte = {
  memoryAllowed: boolean;
  name: string;
  onboardingCompleted?: boolean;
  paused: boolean;
  researchAllowed: boolean;
};

type Chargé = {
  quotas: Record<string, number | null>;
  settings: ReglagesCompte;
  setup?: SetupStatus;
  storageBytes: number;
  tier: string;
  wakies: Wakie[];
};

const LIBELLES_QUOTA: Record<string, string> = {
  conversations: "Conversations",
  memories: "Mémoires",
  pages: "Pages",
  spaces: "Espaces",
  tasks: "Tâches planifiées",
  wakieProfileImages: "Images de fiche",
  wakies: "Wakies",
};

export function WakiesSettings() {
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [donnees, setDonnees] = useState<Chargé>();
  const [compte, setCompte] = useState<ReglagesCompte>();
  const [wakieActif, setWakieActif] = useState<string>("");
  const [bibliothequeOuverte, setBibliothequeOuverte] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [connexions, setConnexions] = useState<IntegrationStatus[]>([]);
  const { capabilities } = useCapabilities(true);

  useEffect(() => {
    let annule = false;
    // Une connexion externe ne se GÈRE pas ici : la page montre un ÉTAT, et
    // renvoie vers l'onglet qui sait demander le consentement. Jamais de jeton
    // dans cette réponse — `lib/integrations/status.ts` fait foi.
    api<{ integrations: IntegrationStatus[] }>("/integrations")
      .then((data) => {
        if (!annule) setConnexions(data.integrations ?? []);
      })
      .catch(() => {
        if (!annule) setConnexions([]);
      });
    return () => {
      annule = true;
    };
  }, []);

  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        const data = await api<Chargé>("/settings");
        if (annule) return;
        setDonnees(data);
        setCompte(data.settings);
        setWakieActif((actuel) => actuel || data.wakies[0]?.id || "");
      } catch (e) {
        if (!annule) {
          setErreur(e instanceof Error ? e.message : "Réglages indisponibles.");
        }
      } finally {
        if (!annule) setChargement(false);
      }
    })();
    return () => {
      annule = true;
    };
  }, []);

  const enregistrerCompte = async (patch: Partial<ReglagesCompte>) => {
    setEnCours(true);
    setErreur("");
    try {
      const maj = await api<ReglagesCompte>("/settings", "PATCH", patch);
      // La réponse du serveur fait foi : la page relit l'état réel, pas une
      // hypothèse optimiste que l'écriture aurait contredite.
      setCompte((precedent) => ({ ...(precedent as ReglagesCompte), ...maj }));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setEnCours(false);
    }
  };

  const wakie = donnees?.wakies.find((item) => item.id === wakieActif);

  const enregistrerWakie = async (
    patch: Partial<
      Pick<
        Wakie,
        "model" | "pluginIds" | "mcpServerIds" | "skillIds" | "toolIds"
      >
    >
  ) => {
    if (!wakie) return;
    setEnCours(true);
    setErreur("");
    try {
      // `PUT` exige la charge COMPLÈTE du Wakie : n'envoyer que le modèle
      // effacerait les instructions, l'avatar et la sélection d'outils.
      await api(`/wakies/${wakie.id}`, "PUT", {
        avatar: wakie.avatar ?? null,
        instructions: wakie.instructions,
        mcpServerIds: patch.mcpServerIds ?? wakie.mcpServerIds ?? [],
        memoryAllowed: wakie.memoryAllowed,
        model: patch.model === undefined ? (wakie.model ?? null) : patch.model,
        name: wakie.name,
        pluginIds: patch.pluginIds ?? wakie.pluginIds ?? [],
        researchAllowed: wakie.researchAllowed,
        skillIds: patch.skillIds ?? wakie.skillIds ?? [],
        spaceId: wakie.spaceId,
        spaceIds: wakie.spaceIds,
        toolIds: patch.toolIds ?? wakie.toolIds ?? [],
      });
      const data = await api<Chargé>("/settings");
      setDonnees(data);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setEnCours(false);
    }
  };

  const appliquerATous = async (
    patch: Partial<
      Pick<
        Wakie,
        "mcpServerIds" | "model" | "pluginIds" | "skillIds" | "toolIds"
      >
    >
  ) => {
    if (!wakie || !donnees) return;
    if (
      !(await confirmInApp(
        `Reproduire ces réglages sur les ${donnees.wakies.length} Wakies de ce compte ? Chacun recevra aussi le modèle « ${wakie.model ?? "défaut"} ».`
      ))
    ) {
      return;
    }
    setEnCours(true);
    setErreur("");
    try {
      // ÉCRASE les réglages de chaque Wakie : c'est le geste demandé, et le
      // dire avant évite la surprise d'un clic qui reconfigure tout l'atelier.
      for (const cible of donnees.wakies) {
        await api(`/wakies/${cible.id}`, "PUT", {
          avatar: cible.avatar ?? null,
          instructions: cible.instructions,
          mcpServerIds: patch.mcpServerIds ?? [],
          memoryAllowed: cible.memoryAllowed,
          model: patch.model ?? null,
          name: cible.name,
          pluginIds: patch.pluginIds ?? [],
          researchAllowed: cible.researchAllowed,
          skillIds: patch.skillIds ?? [],
          spaceId: cible.spaceId,
          spaceIds: cible.spaceIds,
          toolIds: patch.toolIds ?? [],
        });
      }
      setDonnees(await api<Chargé>("/settings"));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Application impossible.");
    } finally {
      setEnCours(false);
    }
  };

  if (chargement) {
    return (
      <section className="wakies-settings">
        <p className="muted">Chargement des réglages…</p>
      </section>
    );
  }
  if (!donnees || !compte) {
    return (
      <section className="wakies-settings">
        <h1>Réglages des Wakies</h1>
        <p className="sidebar-error" role="status">
          {erreur || "Les réglages n'ont pas pu être chargés."}
        </p>
      </section>
    );
  }

  return (
    <section className="wakies-settings">
      <header className="wakies-settings-tete">
        <h1>Réglages des Wakies</h1>
        <p className="muted">
          Forfait {donnees.tier.toUpperCase()} ·{" "}
          {Math.round(donnees.storageBytes / 1024 / 1024)} Mo de stockage
        </p>
      </header>

      {erreur ? (
        <p className="sidebar-error" role="status">
          {erreur}
        </p>
      ) : null}

      <div className="settings-section">
        <h2>Général</h2>
        <label className="settings-field">
          Nom de l'atelier
          <input
            disabled={enCours}
            maxLength={40}
            onBlur={() => {
              if (compte.name !== donnees.settings.name) {
                void enregistrerCompte({ name: compte.name });
              }
            }}
            onChange={(event) =>
              setCompte({ ...compte, name: event.target.value })
            }
            value={compte.name}
          />
        </label>
        <label className="settings-check">
          <input
            checked={compte.paused}
            disabled={enCours}
            onChange={(event) => {
              const paused = event.target.checked;
              setCompte({ ...compte, paused });
              void enregistrerCompte({ paused });
            }}
            type="checkbox"
          />
          Mettre tous mes Wakies en pause
        </label>
        {/* Le `config-note` du dialogue était la SEULE surface qui disait ce
            qui n'est pas branché. Le retirer sans le déplacer ferait
            disparaître une information, pas une redondance. */}
        <div className="surface-muted settings-note">
          <p className="muted">
            {donnees.setup?.voice
              ? "La voix temps réel est disponible."
              : "La voix temps réel n'est pas encore branchée."}{" "}
            {donnees.setup?.slack
              ? "Slack est connectable."
              : "Slack n'est pas connecté."}
          </p>
          {donnees.setup?.missing?.length ? (
            <p className="muted">
              Non configuré : {donnees.setup.missing.join(", ")}.
            </p>
          ) : null}
        </div>
      </div>

      <div className="settings-section">
        <h2>Confidentialité</h2>
        <label className="settings-check">
          <input
            checked={compte.researchAllowed}
            disabled={enCours}
            onChange={(event) => {
              const researchAllowed = event.target.checked;
              setCompte({ ...compte, researchAllowed });
              void enregistrerCompte({ researchAllowed });
            }}
            type="checkbox"
          />
          Recherche sur les pages publiques
        </label>
        <label className="settings-check">
          <input
            checked={compte.memoryAllowed}
            disabled={enCours}
            onChange={(event) => {
              const memoryAllowed = event.target.checked;
              setCompte({ ...compte, memoryAllowed });
              void enregistrerCompte({ memoryAllowed });
            }}
            type="checkbox"
          />
          Utiliser les mémoires enregistrées
        </label>
      </div>

      <div className="settings-section">
        <h2>Capacités d'un Wakie</h2>
        <label className="settings-field">
          Wakie
          <select
            disabled={enCours || donnees.wakies.length === 0}
            onChange={(event) => setWakieActif(event.target.value)}
            value={wakieActif}
          >
            {donnees.wakies.length === 0 ? (
              <option value="">Aucun Wakie</option>
            ) : null}
            {donnees.wakies.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        {wakie ? (
          <>
            <div className="settings-field">
              Modèle par défaut de ce Wakie
              <ModelPicker
                bloc
                onChoisir={(modele) => void enregistrerWakie({ model: modele })}
                valeur={wakie.model ?? ""}
              />
            </div>
            <ToolPicker
              onChanger={(toolIds) => void enregistrerWakie({ toolIds })}
              outils={WAKIE_TOOL_CATALOG}
              valeur={wakie.toolIds ?? []}
            />
            <CapacityPicker
              capabilities={capabilities}
              onChanger={(suivant) => void enregistrerWakie(suivant)}
              valeur={{
                mcpServerIds: wakie.mcpServerIds ?? [],
                pluginIds: wakie.pluginIds ?? [],
                skillIds: wakie.skillIds ?? [],
              }}
            />
            <button
              className="settings-lien"
              disabled={enCours}
              onClick={() =>
                void appliquerATous({
                  mcpServerIds: wakie.mcpServerIds ?? [],
                  model: wakie.model ?? null,
                  pluginIds: wakie.pluginIds ?? [],
                  skillIds: wakie.skillIds ?? [],
                  toolIds: wakie.toolIds ?? [],
                })
              }
              type="button"
            >
              Appliquer ces réglages à tous mes Wakies
            </button>
          </>
        ) : (
          <p className="muted">
            Créez un Wakie depuis l'atelier pour régler ses capacités.
          </p>
        )}
      </div>

      <div className="settings-section">
        <h2>Données</h2>
        <ul className="settings-quotas">
          {Object.entries(LIBELLES_QUOTA).map(([cle, label]) => (
            <li key={cle}>
              <span>{label}</span>
              <strong>
                {donnees.quotas[cle] === null
                  ? "illimité"
                  : (donnees.quotas[cle] ?? 0)}
              </strong>
            </li>
          ))}
        </ul>
        <button
          className="settings-lien"
          onClick={() => setBibliothequeOuverte((ouvert) => !ouvert)}
          type="button"
        >
          {bibliothequeOuverte
            ? "Masquer Mes fichiers"
            : "Consulter et libérer Mes fichiers"}
        </button>
        <FileLibrary
          // Depuis le fil, choisir un fichier le joint au message. Ici, la
          // surface sert à consulter et à supprimer : la sélection est sans
          // effet, et le panneau reste sous `.wakies-root`.
          onOpenChange={setBibliothequeOuverte}
          onSelect={() => setBibliothequeOuverte(false)}
          open={bibliothequeOuverte}
          sansDeclencheur
        />
        <p className="muted settings-aide">
          « Mes fichiers » est le stockage privé des pièces jointes du chat. La
          bibliothèque cloud mAI est une surface distincte, gérée depuis
          l'onglet Bibliothèque de mAI.
        </p>
      </div>

      <div className="settings-section">
        <h2>Connexions</h2>
        {connexions.length === 0 ? (
          <p className="muted">
            Aucune application externe n'est reliée à ce compte.
          </p>
        ) : (
          <ul className="settings-quotas">
            {connexions.map((etat) => {
              const descripteur = getIntegrationProvider(etat.provider);
              return (
                <li key={etat.provider}>
                  <span>{descripteur?.label ?? etat.provider}</span>
                  <strong>
                    {etat.connected ? "connectée" : "non connectée"}
                  </strong>
                </li>
              );
            })}
          </ul>
        )}
        <p className="muted settings-aide">
          Relier une application se fait dans l'onglet Plugins de mAI : c'est là
          que le consentement est demandé. Cette page ne montre qu'un état,
          jamais un jeton.
        </p>
      </div>

      <div className="settings-section">
        <h2>Alertes</h2>
        <p className="muted settings-aide">
          Les alertes de réponses terminées et la permission navigateur se
          règlent dans les notifications de mAI ; la sourdine se règle FIL PAR
          FIL, dans l'en-tête de la conversation — c'est une préférence du fil,
          pas du compte.
        </p>
        <a className="settings-lien" href="/settings">
          Ouvrir les notifications de mAI
        </a>
      </div>
    </section>
  );
}
