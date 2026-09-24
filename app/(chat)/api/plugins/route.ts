import { z } from "zod";
import {
  errorResponse,
  logError,
  zodIssuesMessage,
} from "@/lib/api/error-response";
import { planGuardResponse, requirePaidPlan } from "@/lib/auth/plan-guard";
import { enforceChatRateLimit } from "@/lib/chat/auth";
import {
  getPluginInstallationsByUserId,
  installPlugin,
} from "@/lib/db/queries";
import { buildCatalogEntries, getPluginManifest } from "@/lib/plugins/catalog";
import {
  canUsePlugin,
  pluginTierMessage,
  withTierLock,
} from "@/lib/plugins/tier-lock";

const installPluginSchema = z.object({
  pluginId: z.string().min(1).max(64),
});

export async function GET() {
  const guard = await requirePaidPlan("plus");
  if (!guard.allowed) {
    return planGuardResponse(guard)!;
  }
  const user = guard.user;
  const userId = user.id || user.email;

  try {
    const installations = await getPluginInstallationsByUserId({ userId });
    const plugins = withTierLock(
      buildCatalogEntries(
        installations.map((i) => ({
          isEnabled: i.isEnabled,
          pluginId: i.pluginId,
          version: i.version,
        }))
      ),
      user.tier
    );
    return Response.json({ plugins });
  } catch (error) {
    logError("GET /api/plugins", error);
    return errorResponse("internal_error");
  }
}

export async function POST(request: Request) {
  const guard = await requirePaidPlan("plus");
  if (!guard.allowed) {
    return planGuardResponse(guard)!;
  }
  const user = guard.user;
  const userId = user.id || user.email;

  try {
    await enforceChatRateLimit(request, userId);
    const json = await request.json();
    const parsed = installPluginSchema.parse(json);

    const manifest = getPluginManifest(parsed.pluginId);
    if (!manifest) {
      return errorResponse("not_found", {
        message: `Plugin introuvable : « ${parsed.pluginId} ».`,
      });
    }

    // Le niveau d'abonnement déclaré par le manifeste est appliqué ici : le
    // forfait payant générique ne suffit pas pour un plugin réservé à Pro/Max.
    if (!canUsePlugin(manifest, user.tier)) {
      return errorResponse("plan_required", {
        message: pluginTierMessage(manifest),
      });
    }

    await installPlugin({
      pluginId: manifest.id,
      userId,
      version: manifest.version,
    });

    const installations = await getPluginInstallationsByUserId({ userId });
    const plugins = withTierLock(
      buildCatalogEntries(
        installations.map((i) => ({
          isEnabled: i.isEnabled,
          pluginId: i.pluginId,
          version: i.version,
        }))
      ),
      user.tier
    );
    return Response.json({
      plugin: plugins.find((p) => p.id === manifest.id) ?? null,
      plugins,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("invalid_request", {
        message: zodIssuesMessage(error),
      });
    }
    logError("POST /api/plugins", error);
    return errorResponse("internal_error");
  }
}
