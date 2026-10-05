/**
 * ============================================================================
 * VIBE — ÉTAPES DE LA VISITE GUIDÉE (src/components/tutorial/TourSteps.ts)
 * Full visite guidée multi-pages (driver.js) : Accueil, publication, Explorer,
 * Notifications, Messages, Profil, Statistiques, Livres, Paramètres.
 * Les sélecteurs sont résolus au premier élément VISIBLE (mobile + desktop).
 * ============================================================================
 */

export interface TourStepDef {
  description: string;
  /** Sélecteur de repli si la cible est absente (défaut 'main'). */
  fallback?: string;
  /** Route à afficher avant l'étape (navigate si différente). */
  route: string;
  /** Sélecteur CSS de la cible (premier élément visible retenu). */
  selector: string;
  title: string;
}

export const TOUR_STEPS: TourStepDef[] = [
  {
    description:
      "Touchez ce bouton pour écrire une publication : texte, sondage, médias, co-signature ou post programmé.",
    fallback: "main",
    route: "/",
    selector: '[title="Poster une vibe"]',
    title: "Publiez votre Vibe",
  },
  {
    description:
      "Vos Vibes et celles des comptes suivis. Restez une seconde sur un post pour compter une vue, likez, commentez, repartagez.",
    route: "/",
    selector: "main",
    title: "Fil d\u2019accueil",
  },
  {
    description:
      "Tendances, recherche de comptes et de publications, hashtags et sujets du moment.",
    route: "/explore",
    selector: "main",
    title: "Explorer",
  },
  {
    description:
      "Likes, reposts, réponses, follows et mentions. Le point rose signale les non-lues.",
    route: "/notifications",
    selector: "main",
    title: "Notifications",
  },
  {
    description:
      "Discussions privées, réactions emoji, réponses citées et personnalisation des bulles.",
    route: "/messages",
    selector: "main",
    title: "Messages",
  },
  {
    description:
      "Modifiez votre profil ici. L\u2019icône graphique ouvre votre page Statistiques créateur.",
    fallback: "main",
    route: "/profile",
    selector: '[data-tour="profile-stats-button"]',
    title: "Votre profil & vos stats",
  },
  {
    description:
      "Vues, likes, reposts, réponses, visites de votre profil et taux d\u2019engagement sur la période.",
    fallback: "main",
    route: "/stats",
    selector: '[data-tour="stats-kpi"]',
    title: "Indicateurs clés",
  },
  {
    description:
      "Courbes de vues, barres de réactions et sources de trafic. Changez de période : 7J, 30J, 90J ou 12M.",
    fallback: "main",
    route: "/stats",
    selector: '[data-tour="stats-chart"]',
    title: "Graphiques & périodes",
  },
  {
    description:
      "Vos Livres de Vibes préférées : regroupez vos publications par thème avec une icône dédiée.",
    route: "/books",
    selector: "main",
    title: "Livres",
  },
  {
    description:
      "Thème, langue, fils, modération, mAI. Revenez ici à tout moment pour refaire cette visite guidée.",
    fallback: "main",
    route: "/settings",
    selector: '[data-tour="settings-tutorial"]',
    title: "Paramètres & aide",
  },
];
