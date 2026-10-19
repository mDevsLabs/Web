import Image from "next/image";
import { PageBackButton } from "@/components/chat/page-back-button";
import { isPaidTier } from "@/lib/auth/plan";
import type { MaiUser } from "@/lib/auth/session";
import { APP_PRICING_URL } from "@/lib/constants";

/**
 * Écran « Wakies est réservé aux forfaits payants », et la garde qui le décide.
 *
 * À L'ÉTAT D'OBJET, PAS DE FONCTION DE GARDE : Wakies protège déjà ses routes
 * API (`requireWakiesUser` répond `plan_required` en 403). Ce composant n'est
 * pas une sécurité, c'est ce que l'utilisateur VOIT quand son forfait ne suffit
 * pas — sans lui, la page s'affiche vide et les requêtes échouent en silence.
 *
 * Elle est partagée parce qu'elle est par PAGE, pas par layout : chaque nouvelle
 * route sous `/wakies` doit la rendre explicitement. Une page de réglages qui
 * l'oublierait exposerait une interface dont toutes les écritures sont refusées.
 */
export function deguarderSansPlan(
  user: MaiUser | null
): React.ReactElement | null {
  if (isPaidTier(user?.tier)) return null;

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-background text-foreground">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-3">
          <PageBackButton fallbackHref="/" label="Retour au chat" />
          <div className="flex items-center gap-2.5">
            <Image
              alt="Wakies"
              className="size-9 rounded-xl object-cover shadow-xs"
              height={36}
              src="/wakies/logo.png"
              unoptimized
              width={36}
            />
            <div>
              <h1 className="text-lg font-bold tracking-tight sm:text-xl">
                Wakies
              </h1>
              <p className="text-xs text-muted-foreground">
                Forfait Plus, Pro ou Max requis
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-4 py-12 text-center">
        <Image
          alt="Wakies"
          className="size-16 rounded-2xl object-cover shadow-sm"
          height={64}
          src="/wakies/logo.png"
          unoptimized
          width={64}
        />
        <div>
          <h2 className="mb-2 text-2xl font-bold">
            Wakies est réservé aux forfaits payants
          </h2>
          <p className="text-sm text-muted-foreground">
            Créez des espaces de documents, collaborez avec vos agents coworkers
            persistants, organisez vos pages et planifiez des tâches autonomes
            récurrentes. Passez à un forfait Plus, Pro ou Max pour y accéder.
          </p>
        </div>
        <a
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
          href={APP_PRICING_URL}
        >
          Mettre à niveau mon forfait
        </a>
      </main>
    </div>
  );
}
