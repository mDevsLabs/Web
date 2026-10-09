import { FooterLegal } from "@/components/footer-legal";

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
  return (
    <footer className="relative mt-auto mb-4 w-[95%] max-w-5xl mx-auto md:fixed md:safe-bottom-4 md:left-1/2 md:-translate-x-1/2 z-40 rounded-3xl md:rounded-full glass-strong px-4 md:px-8 py-3">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0">
        <p className="text-xs md:text-sm text-slate-500 font-medium">
          {new Date().getFullYear()} © All rights reserved | mAI | Official Website
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
