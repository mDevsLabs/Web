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
  // Le chat d'un Wakie passe aussi par authenticateChatRequest(). C'est la
  // seule route de /api/wakies/** dans ce cas — les 44 autres utilisent
  // requireWakiesUser(), qui n'appelle jamais checkBotId(). Sans cette ligne,
  // /wakies répondait 403 « Vous n'avez pas l'autorisation d'accéder à cette
  // ressource. » à un utilisateur authentifié, en production seulement
  // (next dev renvoie toujours isBot: false).
  { method: "POST", path: "/api/wakies/chat" },
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
