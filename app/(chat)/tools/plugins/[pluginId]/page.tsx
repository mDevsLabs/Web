import type { Metadata } from "next";
import { isPaidTier } from "@/lib/auth/plan";
import { getMaiUser } from "@/lib/auth/session";
import { getPluginInstallationsByUserId } from "@/lib/db/queries";
import { getPluginManifest } from "@/lib/plugins/catalog";
import { canUsePlugin } from "@/lib/plugins/tier-lock";
import PluginDetailClient from "./plugin-detail-client";

export const metadata: Metadata = {
  description: "Détails d'un plugin mAI : version, description et gestion.",
  title: "Plugin | mAI",
};

// Page dédiée d'un plugin (remplace la fenêtre contextuelle) : accessible
// depuis la vignette d'un plugin installé sur la page Plugins.
export default async function PluginDetailPage({
  params,
}: {
  params: Promise<{ pluginId: string }>;
}) {
  const { pluginId } = await params;
  const [user, manifest] = await Promise.all([
    getMaiUser(),
    Promise.resolve(getPluginManifest(pluginId)),
  ]);

  if (!manifest) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <h1 className="text-xl font-bold">Plugin introuvable</h1>
        <p className="text-sm text-muted-foreground">
          Ce plugin n'existe pas ou a été retiré du catalogue.
        </p>
        <a
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          href="/tools?tab=plugins"
        >
          Retour aux plugins
        </a>
      </div>
    );
  }

  const isPaid = isPaidTier(user?.tier);
  // Verrou de forfait calculé côté serveur : l'interface ne fait qu'afficher
  // la décision, elle ne l'arbitre jamais.
  const locked = !canUsePlugin(manifest, user?.tier);
  let installed = false;
  let enabled = false;
  let installedVersion: string | null = null;
  if (isPaid && user) {
    const installations = await getPluginInstallationsByUserId({
      userId: user.id || user.email,
    });
    const installation = installations.find((i) => i.pluginId === manifest.id);
    installed = Boolean(installation);
    enabled = installation?.isEnabled ?? false;
    installedVersion = installation?.version ?? null;
  }

  return (
    <PluginDetailClient
      enabled={enabled}
      installed={installed}
      installedVersion={installedVersion}
      locked={locked}
      manifest={manifest}
    />
  );
}
