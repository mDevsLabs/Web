import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StoryComposer } from "@/components/vibe/stories/StoryComposer";
import { StoryRing } from "@/components/vibe/stories/StoryRing";
import { StoryViewer } from "@/components/vibe/stories/StoryViewer";
import { ApiService } from "@/lib/vibe/services/api";
import type { StoryAuthor } from "@/lib/vibe/types/vibe";

/**
 * RAIL DE STORIES (StoriesTray.tsx)
 *
 * Barre horizontale posée au-dessus du fil : mon avatar avec un « + » pour
 * publier, puis un anneau par auteur. L'anneau est dégradé tant qu'une story de
 * l'auteur est inédite, grise quand toutes ont été vues — c'est le seul indicateur
 * que le rail ait à donner.
 *
 * Le rail n'est PAS pré-hydraté côté serveur : le gabarit de page ne porte qu'une
 * graine par route, et celle de `/vibe` est prise par le fil. Il appelle donc
 * `GET /v1/stories/tray`, dont la réponse est mise en cache 15 s par `ApiService`.
 */

export const StoriesTray: React.FC = () => {
  const [auteurs, setAuteurs] = useState<StoryAuthor[]>([]);
  const [indexOuvert, setIndexOuvert] = useState<number | null>(null);
  const [compositeurOuvert, setCompositeurOuvert] = useState(false);
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    try {
      const res = await ApiService.getStoriesTray();
      setAuteurs(Array.isArray(res?.stories) ? res.stories : []);
    } catch {
      // Un rail vide vaut mieux qu'un rail fantôme : une erreur réseau ne doit
      // pas laisser affichées des stories qui ne sont plus publiables.
      setAuteurs([]);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  // Le compositeur et le lecteur émettent cet événement après une écriture.
  useEffect(() => {
    const onRefresh = () => charger();
    window.addEventListener("vibe:stories_refresh", onRefresh);
    return () => window.removeEventListener("vibe:stories_refresh", onRefresh);
  }, [charger]);

  const mesStories = useMemo(() => auteurs.find((a) => a.isMine), [auteurs]);

  const ouvert = indexOuvert === null ? null : auteurs[indexOuvert];

  if (chargement) {
    return (
      <div aria-label="Chargement des stories" className="vibe-stories-tray">
        <div className="h-[76px] w-full rounded-2xl bg-zinc-900/60 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="vibe-stories-tray">
      <div className="flex gap-3 overflow-x-auto px-4 py-3 no-scrollbar">
        {/* Publier : toujours en tête, même sans story, sinon l'entrée disparaît. */}
        <button
          className="flex shrink-0 flex-col items-center gap-1"
          onClick={() => setCompositeurOuvert(true)}
          type="button"
        >
          <span className="relative">
            <StoryRing
              avatarUrl={mesStories?.avatarUrl ?? null}
              displayName={mesStories?.username}
              hasStory={false}
              size="md"
            />
            <span className="vibe-stories-add">+</span>
          </span>
          <span className="max-w-[68px] truncate text-[11px] text-zinc-400">
            {mesStories ? "Ma story" : "Ajouter"}
          </span>
        </button>

        {auteurs.map((auteur, index) => (
          <button
            className="flex shrink-0 flex-col items-center gap-1"
            key={auteur.authorId}
            onClick={() => setIndexOuvert(index)}
            type="button"
          >
            <StoryRing
              avatarUrl={auteur.avatarUrl}
              displayName={auteur.displayName}
              hasStory
              seen={auteur.seen}
              size="md"
            />
            <span className="max-w-[68px] truncate text-[11px] text-zinc-400">
              @{auteur.username}
            </span>
          </button>
        ))}
      </div>

      {ouvert ? (
        <StoryViewer
          authors={auteurs}
          initialAuthorIndex={indexOuvert ?? 0}
          onClose={() => {
            setIndexOuvert(null);
            // Le visionnage modifie l'état « vue » de plusieurs anneaux : le rail
            // doit le refléter dès la fermeture, sans attendre un rafraîchissement.
            ApiService.invalidateCache(ApiService.storiesTrayEndpoint());
            charger();
          }}
        />
      ) : null}

      <StoryComposer
        onClose={() => setCompositeurOuvert(false)}
        onPublished={() => {
          setCompositeurOuvert(false);
          ApiService.invalidateCache("/v1/stories");
          charger();
        }}
        open={compositeurOuvert}
      />
    </div>
  );
};
