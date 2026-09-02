import { Star } from "lucide-react";
import { PageBackButton } from "@/components/chat/page-back-button";
import { UpgradeDialog } from "@/components/common/upgrade-dialog";
import { isPaidTier } from "@/lib/auth/plan";
import { getMaiUser } from "@/lib/auth/session";
import { MAI_UPGRADE_URL } from "@/lib/constants";
import McpClient from "./mcp-client";

export default async function McpPage() {
  const user = await getMaiUser();
  const eligible = isPaidTier(user?.tier);

  if (!eligible) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border/40 bg-background/95 backdrop-blur-md px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <PageBackButton fallbackHref="/" label="Retour au chat" />
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <span className="text-xs font-bold">M</span>
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight sm:text-xl">
                  Model Context Protocol (MCP)
                </h1>
                <p className="text-xs text-muted-foreground">
                  Forfait Plus, Pro ou Max requis
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-2xl mx-auto text-center gap-6">
          <div className="size-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-md">
            <Star className="size-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">
              MCP réservé aux forfaits payants
            </h2>
            <p className="text-sm text-muted-foreground">
              Connectez vos bases de données, APIs et outils locaux directement
              à l'IA avec contrôle strict des autorisations. Passez à un forfait
              Plus, Pro ou Max.
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

        <UpgradeDialog feature="mcp" onOpenChange={() => {}} open />
      </div>
    );
  }

  return <McpClient />;
}
