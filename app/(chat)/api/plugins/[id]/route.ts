import { z } from "zod";
import {
  errorResponse,
  logError,
  zodIssuesMessage,
} from "@/lib/api/error-response";
import { planGuardResponse, requirePaidPlan } from "@/lib/auth/plan-guard";
import {
  getPluginInstallationsByUserId,
  setPluginEnabled,
  uninstallPlugin,
} from "@/lib/db/queries";
import { buildCatalogEntries, getPluginManifest } from "@/lib/plugins/catalog";
import {
  canUsePlugin,
  pluginTierMessage,
  withTierLock,
} from "@/lib/plugins/tier-lock";

const patchPluginSchema = z.object({
  isEnabled: z.boolean(),
});

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePaidPlan("plus");
  if (!guard.allowed) {
    return planGuardResponse(guard)!;
  }
  const user = guard.user;
  const userId = user.id || user.email;
  const { id } = await params;

  if (!getPluginManifest(id)) {
    return errorResponse("not_found", {
      message: `Plugin introuvable : « ${id} ».`,
    });
  }

  try {
    // Le retrait reste toujours possible (nettoyage après rétrogradation) : il
    // ne donne accès à aucune capacité supplémentaire.
    await uninstallPlugin({ pluginId: id, userId });
    const installations = await getPluginInstallationsByUserId({ userId });
    return Response.json({
      plugins: withTierLock(
        buildCatalogEntries(
          installations.map((i) => ({
            isEnabled: i.isEnabled,
            pluginId: i.pluginId,
            version: i.version,
          }))
        ),
        user.tier
      ),
    });
  } catch (error) {
    logError("DELETE /api/plugins/[id]", error);
    return errorResponse("internal_error");
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePaidPlan("plus");
  if (!guard.allowed) {
    return planGuardResponse(guard)!;
  }
  const user = guard.user;
  const userId = user.id || user.email;
  const { id } = await params;

  const manifest = getPluginManifest(id);
  if (!manifest) {
    return errorResponse("not_found", {
      message: `Plugin introuvable : « ${id} ».`,
    });
  }

  try {
    const json = await request.json();
    const parsed = patchPluginSchema.parse(json);
    // Réactiver un plugin hors forfait est refusé côté serveur ; la
    // désactivation, elle, reste toujours permise.
    if (parsed.isEnabled && !canUsePlugin(manifest, user.tier)) {
      return errorResponse("plan_required", {
        message: pluginTierMessage(manifest),
      });
    }
    await setPluginEnabled({
      isEnabled: parsed.isEnabled,
      pluginId: id,
      userId,
    });
    const installations = await getPluginInstallationsByUserId({ userId });
    return Response.json({
      plugins: withTierLock(
        buildCatalogEntries(
          installations.map((i) => ({
            isEnabled: i.isEnabled,
            pluginId: i.pluginId,
            version: i.version,
          }))
        ),
        user.tier
      ),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("invalid_request", {
        message: zodIssuesMessage(error),
      });
    }
    logError("PATCH /api/plugins/[id]", error);
    return errorResponse("internal_error");
  }
}
