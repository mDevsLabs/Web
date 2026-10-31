import { redirect } from "next/navigation";

/**
 * Le profil Quizzly vit dans les paramètres d'applications. L'adresse
 * historique reste valide pour les liens déjà partagés.
 */
export const instant = false;

export default function ProfilPage() {
  redirect("/settings?tab=applications#quizzly");
}
