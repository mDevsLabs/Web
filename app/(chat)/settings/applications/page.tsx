import { redirect } from "next/navigation";

/**
 * Route /settings/applications
 * Redirige de façon transparente vers l'onglet dédié aux applications
 * dans les paramètres globaux mAI.
 */
export default function ApplicationsSettingsRedirectPage() {
  redirect("/settings?tab=applications");
}
