"use client";

/**
 * Amis et annuaire : la couche SOCIALE de Wakies.
 *
 * Deux surfaces dans un seul écran, parce qu'elles se répondent :
 *
 *   - la RECHERCHE GLOBALE interroge les Wakies publics de tous les comptes.
 *     Elle ne montre que du contenu publié — et le serveur ne renvoie jamais
 *     l'identité de l'auteur ;
 *   - « MES AMIS » sont les Wakies publics que ce compte suit.
 *
 * Un ami ne se parle pas : il se CONSULTE, et se CLONE. Le clone devient un
 * Wakie du compte, facturé sur ses propres jetons, modifiable sans toucher à
 * l'original. C'est pour ça que le clonage demande un espace de destination :
 * un Wakie vit dans un espace de travail.
 *
 * Les lectures SWR sont isolées par instance et par recherche : une réponse
 * tardive ne remplace pas la fiche ou les résultats actuellement demandés.
 */

import { Button } from "@mdevs/ui/primitives/button";
import { Input } from "@mdevs/ui/primitives/input";
import { useEffect, useId, useRef, useState } from "react";
import useSWR from "swr";
import { api } from "@/components/wakies/api";
import { Mascot } from "@/components/wakies/Mascot";
import {
  type FichePublique,
  type InscritAnnuaire,
  WakiePublicCard,
} from "@/components/wakies/WakiePublicCard";

/** Ligne de `GET /api/wakies/friends`. */
type Ami = {
  accent: string | null;
  amiDepuis: number;
  avatar: string | null;
  bio: string;
  handle: string | null;
  id: string;
  name: string;
  personaPubliee: string;
};

/** Deux caractères : seuil tenu par le serveur, répété pour ne pas l'appeler. */
const LONGUEUR_MINIMALE = 2;

function messageDAccident(erreur: unknown, secours: string): string {
  return erreur instanceof Error ? erreur.message : secours;
}

export function FriendsScreen({
  espaces,
  onChanged,
  onOuvrirWakie,
  fichePartageeId,
  wakiesDuCompte = [],
}: {
  /** Espaces du compte : destination possible d'un clone. */
  espaces: Array<{ id: string; name: string }>;
  /** Recharge l'espace de travail après un clonage. */
  onChanged: () => Promise<void>;
  /** Ouvre le Wakie cloné (ou un des miens) dans la conversation. */
  onOuvrirWakie: (wakieId: string, conversationId?: string) => void;
  fichePartageeId?: string;
  wakiesDuCompte?: { id: string }[];
}) {
  const [requete, setRequete] = useState("");
  const [termeDiffere, setTermeDiffere] = useState("");
  const [inscription, setInscription] = useState<InscritAnnuaire | null>(null);
  const [espaceClonage, setEspaceClonage] = useState("");
  const [avis, setAvis] = useState("");
  const [erreur, setErreur] = useState("");
  const [busy, setBusy] = useState(false);
  const operation = useRef(false);
  const instance = useId();
  const partageOuvert = useRef<string | undefined>(undefined);
  const terme = requete.trim();
  const recherchePrete =
    terme.length >= LONGUEUR_MINIMALE && terme === termeDiffere;
  const destinationExiste = espaces.some((item) => item.id === espaceClonage);
  const {
    data: listeAmis,
    error: erreurAmis,
    isLoading: chargeAmis,
    mutate: chargerAmis,
  } = useSWR<{ amis: Ami[] }>(
    ["wakies-friends", instance],
    () => api("/friends"),
    { refreshInterval: 5000, revalidateOnFocus: true }
  );
  const {
    data: annuaire,
    error: erreurRecherche,
    isLoading: chargeRecherche,
    mutate: chargerRecherche,
  } = useSWR<{ resultats: InscritAnnuaire[] }>(
    recherchePrete ? ["wakies-directory", instance, termeDiffere] : null,
    () => api(`/directory?q=${encodeURIComponent(termeDiffere)}`)
  );
  const {
    data: fiche,
    error: erreurFiche,
    mutate: chargerFiche,
  } = useSWR<FichePublique>(
    inscription
      ? ["wakies-public-profile", instance, inscription.wakieId]
      : null,
    () => {
      if (!inscription) throw new Error("Aucune fiche sélectionnée.");
      return api(`/wakies/${inscription.wakieId}/profile`);
    }
  );
  const amis = listeAmis?.amis ?? [];
  const {
    data: fichePartagee,
    error: erreurPartagee,
    mutate: chargerPartagee,
  } = useSWR<FichePublique>(
    fichePartageeId
      ? ["wakies-linked-profile", instance, fichePartageeId]
      : null,
    async () => {
      const data = await api<FichePublique>(
        `/wakies/${fichePartageeId}/profile`
      );
      if (data.profil.isPublic !== true)
        throw new Error("Cette fiche n’est plus publique.");
      return data;
    }
  );
  const resultats = recherchePrete ? (annuaire?.resultats ?? []) : [];
  const cherche =
    terme.length >= LONGUEUR_MINIMALE && (!recherchePrete || chargeRecherche);
  const reessayer = (lecture: () => Promise<unknown>) => {
    void lecture().catch(() => {});
  };
  useEffect(() => {
    if (
      !fichePartageeId ||
      !fichePartagee ||
      (!listeAmis && !erreurAmis) ||
      partageOuvert.current === fichePartageeId
    )
      return;
    partageOuvert.current = fichePartageeId;
    setInscription({
      accent: null,
      avatar: fichePartagee.profil.avatar ?? null,
      bio: fichePartagee.profil.bio,
      estAmi: Boolean(
        listeAmis?.amis.some((item) => item.id === fichePartageeId)
      ),
      estMien: wakiesDuCompte.some((item) => item.id === fichePartageeId),
      handle: fichePartagee.profil.handle,
      name: fichePartagee.profil.name,
      nombreImages: fichePartagee.images.length,
      personaPubliee: fichePartagee.profil.personaPubliee ?? "",
      wakieId: fichePartageeId,
    });
  }, [fichePartageeId, fichePartagee, listeAmis, erreurAmis, wakiesDuCompte]);

  useEffect(() => {
    if (!destinationExiste) setEspaceClonage(espaces[0]?.id ?? "");
  }, [destinationExiste, espaces]);

  // Recherche différée : une frappe ne déclenche pas une requête.
  useEffect(() => {
    const minuteur = setTimeout(() => setTermeDiffere(terme), 300);
    return () => clearTimeout(minuteur);
  }, [terme]);

  /** Met à jour l'état social affiché, sans relancer une recherche. */
  const marquerAmi = (wakieId: string, estAmi: boolean) => {
    void chargerRecherche(
      (precedents) =>
        precedents
          ? {
              resultats: precedents.resultats.map((item) =>
                item.wakieId === wakieId ? { ...item, estAmi } : item
              ),
            }
          : precedents,
      { revalidate: false }
    );
    setInscription((precedent) =>
      precedent && precedent.wakieId === wakieId
        ? { ...precedent, estAmi }
        : precedent
    );
  };

  const avecBusy = async (action: () => Promise<void>) => {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setErreur("");
    setAvis("");
    try {
      await action();
    } catch (probleme) {
      setErreur(messageDAccident(probleme, "Action impossible."));
    } finally {
      operation.current = false;
      setBusy(false);
    }
  };

  const ouvrirFiche = (inscrit: InscritAnnuaire) => {
    setInscription(inscrit);
    setErreur("");
  };

  const ajouter = (wakieId: string) =>
    avecBusy(async () => {
      await api("/friends", "POST", { wakieId });
      marquerAmi(wakieId, true);
      await chargerAmis();
      setAvis("Wakie ajouté à vos amis.");
    });

  const retirer = (wakieId: string) =>
    avecBusy(async () => {
      await api(`/friends?wakieId=${encodeURIComponent(wakieId)}`, "DELETE");
      marquerAmi(wakieId, false);
      await chargerAmis();
      setAvis("Wakie retiré de vos amis.");
    });

  const cloner = (wakieId: string) =>
    avecBusy(async () => {
      if (!destinationExiste)
        throw new Error("Créez un Espace avant de cloner ce Wakie.");
      const data = await api<{ wakie: { id: string; name: string } }>(
        `/wakies/${wakieId}/clone`,
        "POST",
        { spaceId: espaceClonage }
      );
      setAvis(
        `${data.wakie.name} a rejoint vos Wakies : il consomme désormais votre quota et vos jetons.`
      );
      try {
        await onChanged();
        const conversation = await api<{ id: string }>(
          "/conversations",
          "POST",
          {
            title: `Avec ${data.wakie.name}`.slice(0, 120),
            wakieId: data.wakie.id,
          }
        );
        await onChanged();
        onOuvrirWakie(data.wakie.id, conversation.id);
      } catch (probleme) {
        // Le clone existe déjà : annoncer l'échec de conversation plutôt que
        // laisser croire que recliquer est nécessaire et créer un doublon.
        setErreur(
          `Le Wakie a été cloné. ${messageDAccident(probleme, "La conversation n'a pas pu être ouverte.")} Retrouvez-le dans Messages.`
        );
      }
    });

  const liensFiche = (inscrit: InscritAnnuaire) => (
    <li key={inscrit.wakieId}>
      <Mascot
        avatar={inscrit.avatar}
        decorative
        identity={inscrit.wakieId}
        name={inscrit.name}
        small
      />
      <span className="wakies-social-line">
        <strong>{inscrit.name}</strong>
        {inscrit.handle ? <small> @{inscrit.handle}</small> : null}
        <small className="muted">{inscrit.bio}</small>
      </span>
      <Button
        aria-label={`Voir la fiche de ${inscrit.name}`}
        className="text-button"
        onClick={() => ouvrirFiche(inscrit)}
        type="button"
        variant="ghost"
      >
        Voir la fiche
      </Button>
      {inscrit.estMien ? (
        <Button
          className="text-button"
          onClick={() => onOuvrirWakie(inscrit.wakieId)}
          type="button"
          variant="ghost"
        >
          Discuter
        </Button>
      ) : inscrit.estAmi ? (
        <Button
          className="text-button"
          disabled={busy}
          onClick={() => void retirer(inscrit.wakieId)}
          type="button"
          variant="ghost"
        >
          Retirer
        </Button>
      ) : (
        <Button
          className="text-button"
          disabled={busy}
          onClick={() => void ajouter(inscrit.wakieId)}
          type="button"
          variant="ghost"
        >
          Ajouter
        </Button>
      )}
    </li>
  );

  return (
    <section className="wakies-social" data-app-update-blocked={busy}>
      <header className="wakies-social-head">
        <h1>Amis</h1>
        <p className="muted">
          Recherchez un Wakie public, ajoutez-le en ami, ou clonez sa persona
          publiée pour en faire un Wakie qui vous appartient.
        </p>
      </header>
      {fichePartageeId && !fichePartagee && !erreurPartagee ? (
        <p className="muted" role="status">
          Ouverture de la fiche partagée…
        </p>
      ) : null}
      {erreurPartagee ? (
        <div className="sidebar-error" role="alert">
          <p>
            {messageDAccident(erreurPartagee, "Fiche partagée indisponible.")}
          </p>
          <Button onClick={() => reessayer(chargerPartagee)} variant="outline">
            Recharger la fiche partagée
          </Button>
        </div>
      ) : null}
      {erreur ? (
        <p className="sidebar-error" role="alert">
          {erreur}
        </p>
      ) : null}
      {avis ? (
        <p className="sidebar-note" role="status">
          {avis}
        </p>
      ) : null}
      <div className="wakies-social-search">
        <Input
          aria-label="Rechercher un Wakie public"
          onChange={(evenement) => setRequete(evenement.target.value)}
          placeholder="Rechercher un Wakie (@pseudo ou nom)…"
          value={requete}
        />
      </div>
      <p className="muted wakies-social-search-status" role="status">
        {terme.length < LONGUEUR_MINIMALE
          ? "Saisissez au moins deux caractères pour rechercher un Wakie public."
          : cherche
            ? "Recherche…"
            : erreurRecherche
              ? ""
              : `Résultats pour « ${terme} » : ${resultats.length}`}
      </p>
      {erreurRecherche ? (
        <div className="sidebar-error" role="alert">
          <p>{messageDAccident(erreurRecherche, "Recherche impossible.")}</p>
          <Button onClick={() => reessayer(chargerRecherche)} variant="outline">
            Réessayer la recherche
          </Button>
        </div>
      ) : recherchePrete && !cherche && annuaire && resultats.length === 0 ? (
        <p className="muted">
          Aucun Wakie public ne correspond à votre recherche.
        </p>
      ) : null}
      {espaces.length > 1 ? (
        <label className="field-label">
          Espace de destination d&apos;un clone
          <select
            disabled={busy}
            onChange={(evenement) => setEspaceClonage(evenement.target.value)}
            value={espaceClonage}
          >
            {espaces.map((espace) => (
              <option key={espace.id} value={espace.id}>
                {espace.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {destinationExiste ? null : (
        <p className="muted">
          Créez un Espace pour pouvoir cloner un Wakie public.
        </p>
      )}
      {inscription ? (
        <WakiePublicCard
          busy={busy}
          clonageDisponible={destinationExiste}
          erreurFiche={
            erreurFiche
              ? messageDAccident(erreurFiche, "Fiche détaillée indisponible.")
              : undefined
          }
          fiche={fiche ?? null}
          inscription={inscription}
          onAjouter={(wakieId) => void ajouter(wakieId)}
          onCloner={(wakieId) => void cloner(wakieId)}
          onDiscuter={onOuvrirWakie}
          onReessayer={() => reessayer(chargerFiche)}
          onRetirer={(wakieId) => void retirer(wakieId)}
        />
      ) : null}
      {resultats.length > 0 ? (
        <section className="wakies-social-list">
          <h2>Résultats ({resultats.length})</h2>
          <ul>{resultats.map(liensFiche)}</ul>
        </section>
      ) : null}
      <section className="wakies-social-list">
        <h2>Mes amis{listeAmis ? ` (${amis.length})` : ""}</h2>
        {erreurAmis ? (
          <div className="sidebar-error" role="alert">
            <p>{messageDAccident(erreurAmis, "Liste d’amis indisponible.")}</p>
            <Button onClick={() => reessayer(chargerAmis)} variant="outline">
              Recharger mes amis
            </Button>
          </div>
        ) : null}
        {chargeAmis ? (
          <p className="muted" role="status">
            Chargement de vos amis…
          </p>
        ) : listeAmis ? (
          amis.length === 0 && !erreurAmis ? (
            <p className="muted">
              Aucun ami pour l&apos;instant. Un ami est un Wakie public
              d&apos;un autre compte : cherchez-en un ci-dessus.
            </p>
          ) : amis.length > 0 ? (
            <ul>
              {amis.map((ami) =>
                liensFiche({
                  accent: ami.accent,
                  avatar: ami.avatar,
                  bio: ami.bio,
                  estAmi: true,
                  estMien: false,
                  handle: ami.handle,
                  name: ami.name,
                  nombreImages: 0,
                  personaPubliee: ami.personaPubliee,
                  wakieId: ami.id,
                })
              )}
            </ul>
          ) : null
        ) : null}
      </section>
    </section>
  );
}
