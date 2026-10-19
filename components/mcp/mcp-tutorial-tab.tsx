import { BookOpenIcon, TerminalIcon } from "@mdevs/icons";
import React from "react";

export function McpTutorialTab() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="size-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
            <BookOpenIcon className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-bold">
              Qu'est-ce que le Model Context Protocol (MCP) ?
            </h2>
            <p className="text-xs text-muted-foreground">
              Le standard ouvert pour connecter l'IA à vos systèmes
              d'information
            </p>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Le <strong>Model Context Protocol (MCP)</strong> est un protocole
          standardisé via JSON-RPC 2.0. Ajoutez un serveur, cochez les outils
          autorisés, liez-le à un Skill, et contrôlez chaque appel via les
          permissions per-tool.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border/50 bg-card p-4">
          <div className="flex items-center gap-2 mb-2 text-primary font-semibold text-xs">
            <span className="size-5 rounded-full bg-primary/10 flex items-center justify-center text-xs">
              1
            </span>
            <span>Connectez</span>
          </div>
          <p className="text-xs text-muted-foreground">
            URL SSE/HTTP ou commande stdio + timeout/rate-limit.
          </p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card p-4">
          <div className="flex items-center gap-2 mb-2 text-sky-500 font-semibold text-xs">
            <span className="size-5 rounded-full bg-sky-500/10 flex items-center justify-center text-xs">
              2
            </span>
            <span>Autorisez per-tool</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Activez/désactivez chaque outil + son niveau d'approbation.
          </p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card p-4">
          <div className="flex items-center gap-2 mb-2 text-purple-500 font-semibold text-xs">
            <span className="size-5 rounded-full bg-purple-500/10 flex items-center justify-center text-xs">
              3
            </span>
            <span>Liez à un Skill</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Dans Skills, whitelist les serveurs/outils pour ce Skill.
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
          <TerminalIcon className="size-4 text-purple-500" />
          <span>Exemples</span>
        </h3>
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 font-mono">
            <span className="text-muted-foreground block mb-1">
              # Serveur SSE
            </span>
            <span className="text-primary block font-semibold">
              URL: https://mcp.company.com/sse
            </span>
            <span className="text-muted-foreground block">
              Auth: bearer • timeout 15000ms • rate 60/min
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 font-mono">
            <span className="text-muted-foreground block mb-1">
              # Stdio Postgres (vars chiffrées)
            </span>
            <span className="text-primary block font-semibold">
              Commande: npx -y @modelcontextprotocol/server-postgres
            </span>
            <span className="text-muted-foreground block">
              Env: PGPASSWORD=••••
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
