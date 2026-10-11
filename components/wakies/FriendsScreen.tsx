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
 * Aucune donnée sociale n'est mise en cache ici : l'écran recharge au retour,
 * ce qui évite d'afficher un état `estAmi` périmé après un ajout.
 */

import { Button } from "@mdevs/ui/primitives/button";
import { Input } from "@mdevs/ui/primitives/input";
import { useCallback, useEffect, useState } from "react";
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
}: {
  /** Espaces du compte : destination possible d'un clone. */
  espaces: Array<{ id: string; name: string }>;
  /** Recharge l'espace de travail après un clonage. */
  onChanged: () => Promise<void>;
  /** Ouvre le Wakie cloné (ou un des miens) dans la conversation. */
  onOuvrirWakie: (wakieId: string, conversationId?: string) => void;
}) {
  const [requete, setRequete] = useState("");
  const [resultats, setResultats] = useState<InscritAnnuaire[]>([]);
  const [amis, setAmis] = useState<Ami[]>([]);
  const [inscription, setInscription] = useState<InscritAnnuaire | null>(null);
  const [fiche, setFiche] = useState<FichePublique | null>(null);
  const [espaceClonage, setEspaceClonage] = useState("");
  const [avis, setAvis] = useState("");
  const [erreur, setErreur] = useState("");
  const [busy, setBusy] = useState(false);
  const [cherche, setCherche] = useState(false);

  const chargerAmis = useCallback(async () => {
    try {
      const data = await api<{ amis: Ami[] }>("/friends");
      setAmis(data.amis);
    } catch (probleme) {
      setErreur(messageDAccident(probleme, "Liste d'amis indisponible."));
    }
  }, []);

  useEffect(() => {
    void chargerAmis();
  }, [chargerAmis]);

  useEffect(() => {
    if (!espaceClonage && espaces.length > 0) {
      setEspaceClonage(espaces[0].id);
    }
  }, [espaceClonage, espaces]);

  // Recherche différée : une frappe ne déclenche pas une requête.
  useEffect(() => {
    const terme = requete.trim();
    if (terme.length < LONGUEUR_MINIMALE) {
      setResultats([]);
      setCherche(false);
      return;
    }
    let annule = false;
    const minuteur = setTimeout(async () => {
      setCherche(true);
      try {
        const data = await api<{ resultats: InscritAnnuaire[] }>(
          `/directory?q=${encodeURIComponent(terme)}`
        );
        if (!annule) setResultats(data.resultats);
      } catch (probleme) {
        if (!annule) {
          setErreur(messageDAccident(probleme, "Recherche impossible."));
        }
      } finally {
        if (!annule) setCherche(false);
      }
    }, 300);
    return () => {
      annule = true;
      clearTimeout(minuteur);
    };
  }, [requete]);

  /** Met à jour l'état social affiché, sans relancer une recherche. */
  const marquerAmi = (wakieId: string, estAmi: boolean) => {
    setResultats((precedents) =>
      precedents.map((item) =>
        item.wakieId === wakieId ? { ...item, estAmi } : item
      )
    );
    setInscription((precedent) =>
      precedent && precedent.wakieId === wakieId
        ? { ...precedent, estAmi }
        : precedent
    );
  };

  const avecBusy = async (action: () => Promise<void>) => {
    setBusy(true);
    setErreur("");
    setAvis("");
    try {
      await action();
    } catch (probleme) {
      setErreur(messageDAccident(probleme, "Action impossible."));
    } finally {
      setBusy(false);
    }
  };

  const ouvrirFiche = async (inscrit: InscritAnnuaire) => {
    setInscription(inscrit);
    setFiche(null);
    setErreur("");
    try {
      setFiche(await api<FichePublique>(`/wakies/${inscrit.wakieId}/profile`));
    } catch (probleme) {
      // La fiche de base reste lisible : seule la galerie détaillée manque.
      setErreur(messageDAccident(probleme, "Fiche détaillée indisponible."));
      setFiche({
        images: [],
        profil: {
          avatarUrl: null,
          bannerUrl: null,
          bio: inscrit.bio,
          handle: inscrit.handle,
          links: [],
          name: inscrit.name,
          personaPubliee: inscrit.personaPubliee,
        },
      });
    }
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
      const data = await api<{ wakie: { id: string; name: string } }>(
        `/wakies/${wakieId}/clone`,
        "POST",
        { spaceId: espaceClonage }
      );
      setAvis(
        `${data.wakie.name} a rejoint vos Wakies : il consomme désormais votre quota et vos jetons.`
      );
      await onChanged();
      try {
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
        className="text-button"
        onClick={() => void ouvrirFiche(inscrit)}
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
    <section className="wakies-social">
      <header className="wakies-social-head">
        <h1>Amis</h1>
        <p className="muted">
          Recherchez un Wakie public, ajoutez-le en ami, ou clonez sa persona
          publiée pour en faire un Wakie qui vous appartient.
        </p>
      </header>
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
        {cherche ? <span className="muted">Recherche…</span> : null}
      </div>
      {espaces.length > 1 ? (
        <label className="field-label">
          Espace de destination d&apos;un clone
          <select
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
      {inscription ? (
        <WakiePublicCard
          busy={busy}
          fiche={fiche}
          inscription={inscription}
          onAjouter={(wakieId) => void ajouter(wakieId)}
          onCloner={(wakieId) => void cloner(wakieId)}
          onDiscuter={onOuvrirWakie}
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
        <h2>Mes amis ({amis.length})</h2>
        {amis.length === 0 ? (
          <p className="muted">
            Aucun ami pour l&apos;instant. Un ami est un Wakie public d&apos;un
            autre compte : cherchez-en un ci-dessus.
          </p>
        ) : (
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
        )}
      </section>
    </section>
  );
}
