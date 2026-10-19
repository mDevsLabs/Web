import { redirect } from "next/navigation";
import { deguarderSansPlan } from "@/components/wakies/plan-requis";
import { getMaiUser } from "@/lib/auth/session";

/**
 * Route /wakies/settings
 * Les réglages de Wakies ont été centralisés dans les paramètres globaux mAI
 * sous l'onglet Applications (/settings?tab=applications#wakies).
 */

export const instant = false;

export const metadata = {
  title: "Réglages des Wakies | mAI",
};

export default async function WakiesSettingsPage() {
  const user = await getMaiUser();
  const garde = deguarderSansPlan(user);
  if (garde) return garde;

  redirect("/settings?tab=applications#wakies");
}
