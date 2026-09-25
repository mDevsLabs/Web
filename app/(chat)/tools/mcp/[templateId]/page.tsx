import type { Metadata } from "next";
import { isPaidTier, tierMeetsMinimum } from "@/lib/auth/plan";
import { getMaiUser } from "@/lib/auth/session";
import {
  getMcpServerByTemplateId,
  getMcpServerSecrets,
} from "@/lib/db/queries";
import { getMcpTemplate } from "@/lib/mcp-templates/catalog";
import McpDetailClient from "./mcp-detail-client";

export const metadata: Metadata = {
  description:
    "Fiche détaillée d'un serveur MCP mAI : outils, authentification, configuration.",
  title: "Connexion MCP | mAI",
};

// Page dédiée d'un modèle MCP (URL stable, serveur) : le même modèle
// d'expérience que la page de détail des Plugins. Accessible en lien direct,
// avec bouton retour fonctionnel. Aucun secret n'est lu ici : seul l'ÉTAT de
// configuration (quel champ est renseigné) est calculé côté serveur.
export default async function McpDetailPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const manifest = getMcpTemplate(templateId);

  if (!manifest) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <h1 className="text-xl font-bold">Connexion MCP introuvable</h1>
        <p className="text-sm text-muted-foreground">
          Ce serveur n'existe pas ou a été retiré du catalogue.
        </p>
        <a
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          href="/tools?tab=mcp"
        >
          Retour aux connexions MCP
        </a>
      </div>
    );
  }

  const user = await getMaiUser();
  const userId = user ? user.id || user.email : null;
  const paid = isPaidTier(user?.tier);
  const locked = !tierMeetsMinimum(user?.tier, manifest.minTier);

  let installed = false;
  let enabled = false;
  let installedServerId: string | null = null;
  let configuredFields: string[] = [];
  const installError: string | null =
    manifest.activation === "requires_oauth_flow"
      ? "Cette intégration exige un flux OAuth interactif non encore pris en charge par mAI Web : l'installation est refusée côté serveur."
      : manifest.activation === "requires_vetted_stdio"
        ? "Cette intégration stdio attend un wrapper vérifié par l'infrastructure. L'exécution de la commande du modèle est bloquée par sécurité."
        : null;
  if (userId && paid) {
    const server = await getMcpServerByTemplateId({
      templateId: manifest.id,
      userId,
    }).catch(() => null);
    if (server) {
      installed = true;
      enabled = server.isEnabled;
      installedServerId = server.id;
      // ÉTAT de configuration uniquement : les clés renseignées, jamais leurs
      // valeurs (elles restent chiffrées dans mcp_server_secret).
      const secrets = await getMcpServerSecrets({
        serverId: server.id,
        userId,
      }).catch(() => []);
      configuredFields = secrets.map((secret) => secret.key);
    }
  }

  return (
    <McpDetailClient
      configuredFields={configuredFields}
      enabled={enabled}
      installError={installError}
      installed={installed}
      installedServerId={installedServerId}
      locked={locked}
      manifest={manifest}
    />
  );
}
