import type { Metadata } from "next";
import { GlobalSearchClient } from "@/components/chat/global-search-client";
import { isPaidTier } from "@/lib/auth/plan";
import { getMaiUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  description:
    "Recherchez dans vos discussions, vos Skills, vos serveurs MCP, vos bots, vos modèles, vos images, vos audios et vos statistiques.",
  title: "Recherche globale | mAI",
};

// Page de recherche globale : le point d'entrée unique pour trouver quelque chose
// dans le compte, quel que soit le domaine.
//
// Elle prend le relais du bouton « Rechercher » de la barre latérale, qui
// n'ouvrait qu'une modale limitée aux conversations, messages, projets et
// fichiers. La modale reste en place pour ⌘K et la commande `/search` : c'est
// l'accès rapide depuis une conversation, la page est la recherche exhaustive.
//
// Le tier est résolu ICI, côté serveur, et non via `useTier()` : `/api/mcp` et
// `/api/agents` répondent `plan_required` à un compte Free, et afficher un
// résultat vide pour une source interdite n'apprend rien à personne.
//
// Cette lecture de `cookies()` est ce qui rend la route NON INSTANT, et
// `cacheComponents` l'exige : sans `instant = false`, le segment de page se
// rendait hors de tout `<Suspense>` et la navigation levait
// « Could not validate `instant` because an error prevented the target segment
// from rendering » (E1338), en amont d'un E1430 sur `cookies()`. Le correctif
// par `<Suspense>` était possible mais fausse la promesse ci-dessus : le tier
// doit être connu AU PREMIER RENDU, sinon un compte Pro voit d'abord les
// catégories payantes disparaître puis revenir. Ici, la route est simplement
// bloquante — ce qu'elle est de toute façon : le layout `(chat)` attend le MÊME
// `getMaiUser()` avant d'afficher quoi que ce soit, et `getMaiUser` sert la
// seconde lecture depuis son cache mémoire de deux minutes.
export const instant = false;

export default async function SearchPage() {
  const user = await getMaiUser();

  return <GlobalSearchClient isPaid={isPaidTier(user?.tier)} />;
}
