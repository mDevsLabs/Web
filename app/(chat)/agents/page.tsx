import { PageBackButton } from "@/components/chat/page-back-button";
import { UpgradeDialog } from "@/components/common/upgrade-dialog";
import { isPaidTier } from "@/lib/auth/plan";
import { getMaiUser } from "@/lib/auth/session";
import { MAI_UPGRADE_URL } from "@/lib/constants";
import AgentsClient from "./agents-client";

export default async function AgentsPage() {
  const user = await getMaiUser();
  const eligible = isPaidTier(user?.tier);

  if (!eligible) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border/40 bg-background/95 backdrop-blur-md px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <PageBackButton fallbackHref="/" label="Retour au chat" />
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
                <span className="text-xs font-bold">A</span>
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight sm:text-xl">
                  Agents IA
                </h1>
                <p className="text-xs text-muted-foreground">
                  Forfait Plus, Pro ou Max requis
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-2xl mx-auto text-center gap-6">
          <div className="size-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Agents IA réservés aux forfaits payants
            </h2>
            <p className="text-sm text-muted-foreground">
              Créez jusqu'à 10 agents personnalisés avec styles, instructions
              (5000c), icône/emoji, modèle par défaut, skills, MCP et fichiers
              cloud. Passez à un forfait Plus, Pro ou Max pour y accéder.
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

        <UpgradeDialog feature="agents" onOpenChange={() => undefined} open />
      </div>
    );
  }

  return <AgentsClient />;
}
