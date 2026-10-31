"use client";

import useSWR from "swr";
import { IconeLigue, nomLigue } from "@/components/quizzly/icones";
import { estLigue, type LeagueId } from "@/lib/quizzly/leagues";
import { fetcher } from "@/lib/utils";

type Ligne = {
  avatarUrl: string | null;
  displayName: string;
  me: boolean;
  rank: number;
  username: string;
  weeklyXp: number;
};

type Classement = {
  league: LeagueId;
  lignes: Ligne[];
  weekKey: string;
};

export function LiguesQuizzly() {
  const { data, error, isLoading } = useSWR<Classement>(
    "/api/quizzly/ligues",
    fetcher
  );

  if (isLoading) {
    return (
      <p className="p-8 text-sm text-muted-foreground">
        Chargement de la ligue…
      </p>
    );
  }
  if (error || !data || !estLigue(data.league)) {
    return (
      <p className="p-8 text-sm text-destructive">
        La ligue n'a pas pu être chargée.
      </p>
    );
  }

  return (
    <section className="mx-auto flex max-w-xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <IconeLigue className="size-10" league={data.league} />
        <div>
          <h1 className="text-lg font-semibold">{nomLigue(data.league)}</h1>
          <p className="text-sm text-muted-foreground">
            Semaine {data.weekKey} · les 5 premiers montent, les 5 derniers
            descendent, le lundi à minuit (Paris).
          </p>
        </div>
      </div>
      <ol className="flex flex-col gap-2">
        {data.lignes.map((ligne) => (
          <li
            className="surface-card flex items-center gap-3"
            data-active={ligne.me ? "true" : "false"}
            key={ligne.rank}
          >
            <span className="w-6 text-sm font-semibold text-muted-foreground">
              {ligne.rank}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {ligne.displayName}
                {ligne.me ? " · vous" : ""}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {ligne.username ? `@${ligne.username}` : ""}
              </p>
            </div>
            <span className="text-sm font-semibold">{ligne.weeklyXp} XP</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
