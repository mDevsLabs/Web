import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isPaidTier } from "@/lib/auth/plan";
import { getMaiUser } from "@/lib/auth/session";
import McpClient from "./mcp-client";

// La gestion personnalisée réutilise les formulaires et la garde de forfait
// du catalogue ; les contrôles des secrets restent appliqués par l'API.
export const metadata: Metadata = { title: "Mes serveurs MCP | mAI" };

export default async function McpPage({
  searchParams,
}: {
  searchParams: Promise<{ create?: string }>;
}) {
  const [user, params] = await Promise.all([getMaiUser(), searchParams]);
  if (!user) redirect("/login");
  if (!isPaidTier(user.tier)) redirect("/tools?tab=mcp");
  return <McpClient initialCreate={params.create === "1"} />;
}
