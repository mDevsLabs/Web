"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { PluginIcon } from "@/lib/plugins/icon";
import type { PluginIconRef } from "@/lib/plugins/types";
import type { UserPluginView } from "@/lib/plugins/user-plugin-input";
import { cn, fetcher } from "@/lib/utils";

type UserPluginsResponse = { plugins: UserPluginView[] };
type McpTemplateRow = {
  activation: "ready" | "requires_oauth_flow" | "requires_vetted_stdio";
  description: string;
  id: string;
  name: string;
};

const REPLACED_BY_PLUGIN = new Set(["linear", "notion", "sentry", "stripe"]);

function iconOf(icon: string): PluginIconRef {
  if (icon.startsWith("/")) {
    return { src: icon, type: "image" };
  }
  return { name: icon, type: "lucide" };
}

export function PersonalPlugins({ searchQuery }: { searchQuery: string }) {
  const router = useRouter();
  const { data, mutate } = useSWR<UserPluginsResponse>(
    "/api/user-plugins",
    fetcher
  );
  const { data: templates } = useSWR<{ templates: McpTemplateRow[] }>(
    "/api/mcp/templates",
    fetcher
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const query = searchQuery.trim().toLowerCase();
  const plugins = useMemo(() => {
    const rows = data?.plugins ?? [];
    if (!query) {
      return rows;
    }
    return rows.filter((plugin) =>
      `${plugin.name} ${plugin.description} ${plugin.kind}`
        .toLowerCase()
        .includes(query)
    );
  }, [data, query]);
  const catalog = useMemo(() => {
    const rows = (templates?.templates ?? []).filter(
      (template) => !REPLACED_BY_PLUGIN.has(template.id)
    );
    if (!query) {
      return rows;
    }
    return rows.filter((template) =>
      `${template.name} ${template.description}`.toLowerCase().includes(query)
    );
  }, [query, templates]);

  async function installTemplate(templateId: string) {
    setBusyId(templateId);
    try {
      const response = await fetch("/api/mcp/templates/install", {
        body: JSON.stringify({ templateId }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.message || "Installation impossible.");
      }
      toast.success(payload?.message || "Plugin installé.");
      await mutate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Installation impossible."
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Mes plugins</h3>
        {data ? null : (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        )}
        {data && plugins.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun plugin personnel. Créez-en un à partir d'un serveur MCP ou
            d'une application OAuth.
          </p>
        ) : null}
        {data && plugins.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {plugins.map((plugin) => (
              <button
                className="flex min-h-11 items-center gap-3 rounded-2xl border border-transparent p-3 text-left hover:border-border/50 hover:bg-muted/30"
                key={plugin.id}
                onClick={() =>
                  router.push(`/tools/plugins/custom/${plugin.id}`)
                }
                type="button"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/50 bg-card">
                  <PluginIcon className="size-5" icon={iconOf(plugin.icon)} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {plugin.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {plugin.kind === "oauth" ? "OAuth" : "Serveur MCP"} · v
                    {plugin.version}
                  </span>
                </span>
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    plugin.isEnabled ? "bg-success" : "bg-muted-foreground/40"
                  )}
                />
              </button>
            ))}
          </div>
        ) : null}
      </section>

      {catalog.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground">
            Serveurs MCP
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {catalog.map((template) => {
              const ready = template.activation === "ready";
              return (
                <div
                  className="flex items-center gap-3 rounded-2xl p-3"
                  key={template.id}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {template.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {template.description}
                    </p>
                  </div>
                  <Button
                    className="h-11 shrink-0 sm:h-8"
                    disabled={!ready || busyId === template.id}
                    onClick={() => installTemplate(template.id)}
                    type="button"
                    variant="outline"
                  >
                    {ready ? "Installer" : "Indisponible"}
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
