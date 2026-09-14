import type { Metadata } from "next";
import { isPaidTier } from "@/lib/auth/plan";
import { getMaiUser } from "@/lib/auth/session";
import { isToolsTab, normalizeToolsTab } from "@/lib/tools/tabs";
import ToolsClient from "./tools-client";

export const metadata: Metadata = {
  description:
    "Gérez vos plugins, vos serveurs MCP et vos Skills au même endroit.",
  title: "Applications — Plugins, MCP & Skills | mAI",
};

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const [user, params] = await Promise.all([getMaiUser(), searchParams]);
  const isPaid = isPaidTier(user?.tier);

  // Onglet par défaut : Plugins pour les forfaits payants, Skills pour Free.
  // Un onglet explicite est respecté, mais les panneaux Plugins/MCP d'un
  // utilisateur Free n'affichent que l'écran d'upgrade — aucune donnée n'est
  // chargée (`/api/plugins` et `/api/mcp` sont gardés côté serveur).
  const explicitTab = isToolsTab(params.tab);
  const activeTab = explicitTab
    ? normalizeToolsTab(params.tab)
    : isPaid
      ? "plugins"
      : "skills";

  return <ToolsClient initialTab={activeTab} isPaid={isPaid} />;
}
