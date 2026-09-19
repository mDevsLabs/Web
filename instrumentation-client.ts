import { initBotId } from "botid/client/core";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Toute route serveur qui appelle checkBotId() (via authenticateChatRequest ou
// guardAuthAction) DOIT figurer ici : sans protection côté client, la requête
// part sans attestation BotID et Vercel la classe comme un bot en production —
// y compris pour un utilisateur authentifié légitime (réponse access_denied).
// C'était la cause du refus immédiat « Vous n'avez pas l'autorisation… » en
// mode Agent : /api/agent était vérifié côté serveur mais jamais attesté ici.
const protectedRoutes: { method: "POST"; path: string }[] = [
  { method: "POST", path: "/api/chat" },
  { method: "POST", path: "/api/agent" },
  { method: "POST", path: "/api/agent/schedules" },
  // Server Actions d'authentification : le POST est émis sur l'URL de la
  // page hôte (/login, /register).
  { method: "POST", path: "/login" },
  { method: "POST", path: "/register" },
];

initBotId({
  protect: [
    ...protectedRoutes,
    ...(basePath
      ? protectedRoutes.map((route) => ({
          method: route.method,
          path: `${basePath}${route.path}`,
        }))
      : []),
  ],
});
