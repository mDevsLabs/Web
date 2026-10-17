/**
 * Route /wakies/settings — les réglages des Wakies, en page.
 *
 * Ils étaient une VARIANTE DE DIALOGUE de l'atelier : deux cases dans une
 * fenêtre sans adresse, qui rendait le reste de l'écran inerte et disparaissait
 * à la fermeture. Une page a une URL, un titre, et se retrouve plus tard.
 *
 * La garde de forfait est rendue ICI, comme sur `/wakies` : elle est par page,
 * pas par layout. L'oublier exposerait une interface dont toutes les écritures
 * répondent 403 — pire que refusée, trompeuse.
 *
 * Le layout `(wakies)` fournit déjà `.wakies-root` et les feuilles de style :
 * cette page vit dans l'atelier, pas à côté.
 */

import { PageBackButton } from "@/components/chat/page-back-button";
import { deguarderSansPlan } from "@/components/wakies/plan-requis";
import { WakiesSettings } from "@/components/wakies/WakiesSettings";
import { getMaiUser } from "@/lib/auth/session";

export const instant = false;

export const metadata = {
  title: "Réglages des Wakies | mAI",
};

export default async function WakiesSettingsPage() {
  const user = await getMaiUser();
  const garde = deguarderSansPlan(user);
  if (garde) return garde;

  return (
    <div className="wakies-settings-page">
      <header className="wakies-settings-barre">
        <PageBackButton fallbackHref="/wakies" label="Retour à l'atelier" />
      </header>
      <WakiesSettings />
    </div>
  );
}
