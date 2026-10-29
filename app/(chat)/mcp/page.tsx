import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMaiUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Plugins | mAI" };

export default async function McpPage({
  searchParams,
}: {
  searchParams: Promise<{ create?: string }>;
}) {
  const [user, params] = await Promise.all([getMaiUser(), searchParams]);
  if (!user) {
    redirect("/login");
  }
  if (params.create === "1") {
    redirect("/tools/plugins/custom/new");
  }
  redirect("/tools?tab=plugins");
}
