/**
 * Route /wakies — l'application Wakies dans l'hôte.
 *
 * Wakies est réservé aux forfaits payants (Plus, Pro, Max), bloqué pour
 * le forfait Free comme les Bots ou le mode Agent.
 *
 * La page est marquée « non instantanée » : le composant client lit la session au
 * premier rendu, et `cacheComponents` refuse de pré-rendre une page dont la
 * sortie dépendrait du client. C'est le même arbitrage que `/vibe`.
 */

import Image from "next/image";
import { PageBackButton } from "@/components/chat/page-back-button";
import { WakiesWorkspace } from "@/components/wakies/workspace-app";
import { isPaidTier } from "@/lib/auth/plan";
import { getMaiUser } from "@/lib/auth/session";
import { MAI_UPGRADE_URL } from "@/lib/constants";

export const instant = false;

export const metadata = {
  title: "Wakies — Espace de travail IA | mAI",
};

export default async function WakiesPage() {
  const user = await getMaiUser();
  const eligible = isPaidTier(user?.tier);

  if (!eligible) {
    return (
      <div className="flex flex-col h-full w-full overflow-y-auto bg-background text-foreground">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border/40 bg-background/95 backdrop-blur-md px-4 py-3 sm:px-6">
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

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-2xl mx-auto text-center gap-6">
          <Image
            alt="Wakies"
            className="size-16 rounded-2xl object-cover shadow-sm"
            height={64}
            src="/wakies/logo.png"
            unoptimized
            width={64}
          />
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Wakies est réservé aux forfaits payants
            </h2>
            <p className="text-sm text-muted-foreground">
              Créez des espaces de documents, collaborez avec vos agents
              coworkers persistants, organisez vos pages et planifiez des tâches
              autonomes récurrentes. Passez à un forfait Plus, Pro ou Max pour y
              accéder.
            </p>
          </div>
          <a
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            href={MAI_UPGRADE_URL}
            rel="noopener"
            target="_blank"
          >
            Mettre à niveau mon forfait
          </a>
        </main>
      </div>
    );
  }

  return <WakiesWorkspace />;
}
