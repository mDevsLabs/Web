import { FooterLegal } from "@/components/site/footer-legal";

/**
 * Pied de page flottant en verre dépoli.
 *
 * Ce composant était historiquement dupliqué : une version « pleine largeur blanche »
 * avec colonnes de liens, jamais importée nulle part, et une version inline dans
 * `app/layout.tsx`. C'est cette dernière qui faisait autorité — le design a été porté
 * ici et le layout importe ce composant. Il n'existe donc plus qu'une seule source de
 * vérité, et un seul repère `contentinfo` dans l'arbre d'accessibilité.
 *
 * Rendu côté serveur : aucune dépendance d'état ni d'effet.
 */
export function SiteFooter() {
  // Pied de page EN FLUX : `md:fixed` + `safe-bottom-4` le peignait à sa
  // position statique (l'utilitaire généré est `.site-root.safe-bottom-4`,
  // donc inerte sur un enfant), et le copyright remontait sous la navbar.
  // La marge basse réserve la place de la pastille de statut, épinglée en
  // bas à droite.
  return (
    <footer className="relative mt-auto mb-24 w-[95%] max-w-5xl mx-auto md:mb-16 rounded-3xl md:rounded-full glass-strong px-4 md:px-8 py-3">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0">
        <p className="text-xs md:text-sm text-slate-500 font-medium">
          {new Date().getFullYear()} © Tous droits réservés | mAI | Site
          officiel
        </p>

        {/* Menu déroulant Légal */}
        <FooterLegal />
      </div>
    </footer>
  );
}

export function Footer() {
  return <SiteFooter />;
}
