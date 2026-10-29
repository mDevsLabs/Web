"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

/**
 * Hôte du noyau de chat.
 *
 * Le noyau (`components/chat/shell.tsx`) est le composant le plus lourd de
 * l'application : il tire le rendu Markdown (`streamdown`, `shiki`,
 * `mermaid`), l'éditeur de code (`codemirror`) et tout le compositeur. Il
 * était monté par le layout `(chat)`, donc téléchargé et évalué sur CHAQUE
 * route du groupe — y compris `/site`, `/vibe`, `/blackline` ou
 * `/settings`, où il ne rendait strictement rien.
 *
 * Le noyau est donc chargé à la demande, et seulement sur les routes de
 * conversation. Sur les autres, le chunk n'est même pas demandé : la
 * mémoire et la bande passante restent disponibles pour l'application
 * réellement affichée.
 *
 * Le rendu serveur est conservé (pas de `ssr: false`) : sur une route de
 * conversation, le noyau est SSR comme avant, et l'interface ne clignote
 * pas. `usePathname` rend le même verdict des deux côtés, donc il n'y a
 * jamais d'écart entre le HTML servi et l'hydratation.
 */
const ChatShell = dynamic(
  () => import("@/components/chat/shell").then((module) => module.ChatShell),
  { loading: () => null }
);

export function ChatHost() {
  const pathname = usePathname();
  const isChatRoute = pathname === "/" || pathname?.startsWith("/chat");

  if (!isChatRoute) {
    return null;
  }

  return <ChatShell />;
}
