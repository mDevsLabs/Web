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

  // Onglet par défaut : Plugins pour tous les forfaits (y compris Free).
  const explicitTab = isToolsTab(params.tab);
  const activeTab = explicitTab ? normalizeToolsTab(params.tab) : "plugins";

  return <ToolsClient initialTab={activeTab} isPaid={isPaid} />;
}
