"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { IconeClasse, IconeLigue } from "@/components/quizzly/icones";
import { useResumeQuizzly } from "@/components/quizzly/shell";
import { estLigue } from "@/lib/quizzly/leagues";
import { libelleAnnee, type SchoolYear } from "@/lib/quizzly/program";
import { fetcher } from "@/lib/utils";

type Ami = {
  avatarUrl: string | null;
  displayName: string;
  friendshipId: string;
  league: string;
  schoolYear: string;
  username: string;
  weeklyXp: number;
};

type Liste = {
  friends: Ami[];
  incoming: Ami[];
  inviteUrl: string;
  outgoing: Ami[];
  qrDataUrl: string | null;
};

export function AmisQuizzly({
  pseudoInitial,
}: {
  pseudoInitial?: string | null;
}) {
  const resume = useResumeQuizzly();
  const { data, error, isLoading, mutate } = useSWR<Liste>(
    "/api/quizzly/amis",
    fetcher
  );
  const [pseudo, setPseudo] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [demandeEnvoyee, setDemandeEnvoyee] = useState<string | null>(null);

  // Une seule demande pour le pseudo porté par l'URL.
  // biome-ignore lint/correctness/useExhaustiveDependencies: demande unique par pseudo
  useEffect(() => {
    if (!pseudoInitial || demandeEnvoyee === pseudoInitial) {
      return;
    }
    setDemandeEnvoyee(pseudoInitial);
    envoyer({ action: "request", username: pseudoInitial });
  }, [demandeEnvoyee, pseudoInitial]);

  async function envoyer(corps: {
    action: "accept" | "decline" | "remove" | "request";
    friendshipId?: string;
    username?: string;
  }) {
    setEnCours(true);
    setMessage(null);
    try {
      const reponse = await fetch("/api/quizzly/amis", {
        body: JSON.stringify(corps),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const recu = (await reponse.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!reponse.ok) {
        throw new Error(recu?.message || "Demande refusée.");
      }
      setMessage(
        corps.action === "request"
          ? "Demande envoyée."
          : corps.action === "accept"
            ? "Vous êtes amis. Vibe suit les deux comptes."
            : "C'est enregistré."
      );
      if (corps.action === "request") {
        setPseudo("");
      }
      await mutate();
      await resume.mutate();
    } catch (raison) {
      setMessage(raison instanceof Error ? raison.message : "Demande refusée.");
    } finally {
      setEnCours(false);
    }
  }

  if (isLoading) {
    return (
      <p className="p-8 text-sm text-muted-foreground">Chargement des amis…</p>
    );
  }
  if (error || !data) {
    return (
      <p className="p-8 text-sm text-destructive">
        Les amis n'ont pas pu être chargés.
      </p>
    );
  }

  return (
    <section className="mx-auto flex max-w-xl flex-col gap-4 p-4 sm:p-6">
      <h1 className="text-lg font-semibold">Amis</h1>
      <p className="text-sm text-muted-foreground">
        Le pseudo est celui de Vibe. Une demande acceptée crée les deux
        abonnements s'ils n'existaient pas.
      </p>
      <form
        className="surface-card flex flex-col gap-3"
        onSubmit={(evenement) => {
          evenement.preventDefault();
          envoyer({ action: "request", username: pseudo });
        }}
      >
        <label className="text-xs font-semibold" htmlFor="quizzly-pseudo">
          Ajouter par @pseudo
        </label>
        <input
          className="field-input"
          id="quizzly-pseudo"
          maxLength={32}
          onChange={(evenement) => setPseudo(evenement.target.value)}
          placeholder="@pseudo"
          value={pseudo}
        />
        <button
          className="chip w-fit"
          data-active="true"
          disabled={enCours || pseudo.trim().length < 2}
          type="submit"
        >
          Envoyer la demande
        </button>
      </form>

      <div className="surface-card flex flex-col items-start gap-3">
        <h2 className="text-sm font-semibold">QR code</h2>
        {data.qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="QR code d'ajout" className="size-40" src={data.qrDataUrl} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Le QR code apparaît quand le pseudo Vibe est connu.
          </p>
        )}
        <p className="break-all text-xs text-muted-foreground">
          {data.inviteUrl}
        </p>
      </div>

      <Liste
        action={(id, action) => envoyer({ action, friendshipId: id })}
        enCours={enCours}
        titre="Demandes reçues"
        vues={data.incoming}
      />
      <Liste
        action={(id, action) => envoyer({ action, friendshipId: id })}
        enCours={enCours}
        titre="Demandes envoyées"
        vues={data.outgoing}
      />
      <Liste
        action={(id, action) => envoyer({ action, friendshipId: id })}
        amis
        enCours={enCours}
        titre="Amis"
        vues={data.friends}
      />
      {message ? <p className="text-sm">{message}</p> : null}
    </section>
  );
}

function Liste({
  action,
  amis = false,
  enCours,
  titre,
  vues,
}: {
  action: (id: string, action: "accept" | "decline" | "remove") => void;
  amis?: boolean;
  enCours: boolean;
  titre: string;
  vues: Ami[];
}) {
  if (vues.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold">{titre}</h2>
      <ul className="flex flex-col gap-2">
        {vues.map((ami) => {
          const ligue = estLigue(ami.league) ? ami.league : "bronze";
          const annee = ami.schoolYear as SchoolYear;
          return (
            <li
              className="surface-card flex flex-wrap items-center gap-3"
              key={ami.friendshipId}
            >
              <IconeLigue league={ligue} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {ami.displayName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {ami.username ? `@${ami.username}` : "Élève"} · {ami.weeklyXp}{" "}
                  XP cette semaine
                </p>
              </div>
              <IconeClasse year={annee} />
              <span className="text-xs text-muted-foreground">
                {libelleAnnee(annee)}
              </span>
              {amis ? (
                <button
                  className="chip"
                  disabled={enCours}
                  onClick={() => action(ami.friendshipId, "remove")}
                  type="button"
                >
                  Retirer
                </button>
              ) : titre.startsWith("Demandes reçues") ? (
                <>
                  <button
                    className="chip"
                    data-active="true"
                    disabled={enCours}
                    onClick={() => action(ami.friendshipId, "accept")}
                    type="button"
                  >
                    Accepter
                  </button>
                  <button
                    className="chip"
                    disabled={enCours}
                    onClick={() => action(ami.friendshipId, "decline")}
                    type="button"
                  >
                    Refuser
                  </button>
                </>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
