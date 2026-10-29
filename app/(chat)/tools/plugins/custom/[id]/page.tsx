import type { Metadata } from "next";
import { Suspense } from "react";
import { UserPluginEditor } from "./editor";

export const metadata: Metadata = { title: "Plugin | mAI" };

export default async function UserPluginPage() {
  return (
    <Suspense
      fallback={
        <p className="px-4 py-10 text-sm text-muted-foreground">Chargement…</p>
      }
    >
      <UserPluginEditor />
    </Suspense>
  );
}
