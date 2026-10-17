import { RouteSkeleton } from "@/components/common/route-skeleton";

// La navigation vers cette page attend la résolution de session du layout
// `(chat)`. Sans ce squelette, l'utilisateur voit un cadre vide pendant ce
// délai — le skeleton reprend la forme des cartes réelles pour que la
// transition ne change pas la mise en page.
export default function SkillsLoading() {
  return <RouteSkeleton cards={2} toolbar />;
}
