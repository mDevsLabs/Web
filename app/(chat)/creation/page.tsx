// La préférence du compte définit le mode si l'URL n'en impose aucun.
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CreationWorkspace } from "@/components/creation/creation-workspace";
import { requireUser } from "@/lib/auth/require-user";
import { normalizeCreationMode } from "@/lib/creation/mode";
import { getUserPreferences } from "@/lib/db/queries";

async function CreationContent() {
  const session = await requireUser();
  if (!session) {
    redirect("/login?redirectUrl=%2Fcreation");
  }
  const preferences = await getUserPreferences(session.userId);
  return (
    <CreationWorkspace
      defaultMode={normalizeCreationMode(preferences.defaultCreationMode)}
    />
  );
}
export default async function CreationPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-muted-foreground">Chargement de Création…</div>
      }
    >
      <CreationContent />
    </Suspense>
  );
}
