import { initBotId } from "botid/client/core";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

initBotId({
  protect: [
    {
      method: "POST",
      path: "/api/chat",
    },
    // Server Actions d'authentification : le POST est émis sur l'URL de la
    // page hôte (/login, /register).
    {
      method: "POST",
      path: "/login",
    },
    {
      method: "POST",
      path: "/register",
    },
    ...(basePath
      ? [
          { method: "POST", path: `${basePath}/api/chat` },
          { method: "POST", path: `${basePath}/login` },
          { method: "POST", path: `${basePath}/register` },
        ]
      : []),
  ],
});
