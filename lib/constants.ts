export const isProductionEnvironment = process.env.NODE_ENV === "production";
export const isDevelopmentEnvironment = process.env.NODE_ENV === "development";
export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT
);

export const MAI_SESSION_COOKIE = "mai_session_token";
export const MAI_API_URL =
  process.env.NEXT_PUBLIC_MAI_API_URL || "https://mai.val.run";
export const MAI_UPGRADE_URL = "https://mai-devs.vercel.app";

export const suggestions = [
  "Propose-moi 3 idées de recettes rapides avec ce que j'ai dans mon frigo 🍳",
  "Comment organiser efficacement ma journée pour être plus serein ? 📅",
  "Rédige un message poli pour reprogrammer un rendez-vous ✉️",
  "Explique-moi les principes de base pour bien gérer mon budget 💡",
];
