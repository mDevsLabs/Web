import type { Metadata } from "next";
import { isPaidTier } from "@/lib/auth/plan";
import { getMaiUser } from "@/lib/auth/session";
import { normalizeToolsTab } from "@/lib/tools/tabs";
import ToolsClient from "./tools-client";

export const metadata: Metadata = {
  description: "Gérez vos plugins et vos Skills au même endroit.",
  title: "Applications — Plugins et Skills | mAI",
};

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const [user, params] = await Promise.all([getMaiUser(), searchParams]);
  const isPaid = isPaidTier(user?.tier);

  const activeTab = normalizeToolsTab(params.tab);

  return <ToolsClient initialTab={activeTab} isPaid={isPaid} />;
}
