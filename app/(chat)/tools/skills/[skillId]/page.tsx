import type { Metadata } from "next";
import { isPaidTier, tierMeetsMinimum } from "@/lib/auth/plan";
import { getMaiUser } from "@/lib/auth/session";
import {
  getSkillCategoryLabel,
  getSkillTemplate,
} from "@/lib/skill-templates/catalog";
import SkillDetailClient from "./skill-detail-client";

export const metadata: Metadata = {
  description:
    "Fiche détaillée d'un Skill mAI : instructions, outils, paramètres.",
  title: "Skill | mAI",
};

// Page dédiée d'un Skill (URL stable, serveur) : même modèle d'expérience que
// les Plugins et les MCP. Accessible en lien direct, bouton retour fonctionnel.
export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ skillId: string }>;
}) {
  const { skillId } = await params;
  const manifest = getSkillTemplate(skillId);

  if (!manifest) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <h1 className="text-xl font-bold">Skill introuvable</h1>
        <p className="text-sm text-muted-foreground">
          Ce skill n'existe pas ou a été retiré du catalogue.
        </p>
        <a
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          href="/tools?tab=skills"
        >
          Retour aux skills
        </a>
      </div>
    );
  }

  const user = await getMaiUser();
  const userId = user ? user.id || user.email : null;
  const locked = !tierMeetsMinimum(user?.tier, manifest.minTier);
  const paid = isPaidTier(user?.tier);

  // État d'installation lu directement en base (appariement templateId,
  // migration 0019) : la fiche serveur ne dépend d'aucun cookie.
  let installed = false;
  let installedSkillId: string | null = null;
  if (userId && paid) {
    const [{ dbReady }, { skill }, { and, eq }] = await Promise.all([
      import("@/lib/db/queries"),
      import("@/lib/db/schema"),
      import("drizzle-orm"),
    ]);
    try {
      const db = await dbReady();
      const rows = await db
        .select({ id: skill.id })
        .from(skill)
        .where(and(eq(skill.userId, userId), eq(skill.templateId, manifest.id)))
        .limit(1);
      if (rows[0]) {
        installed = true;
        installedSkillId = rows[0].id;
      }
    } catch {
      // Base indisponible : la fiche reste consultable sans état d'installation.
    }
  }

  return (
    <SkillDetailClient
      categoryLabel={getSkillCategoryLabel(manifest.category)}
      installed={installed}
      installedSkillId={installedSkillId}
      locked={locked}
      manifest={manifest}
    />
  );
}
