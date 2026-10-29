import {
  errorResponse,
  logError,
  zodIssuesMessage,
} from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import { userPluginUpdateSchema } from "@/lib/plugins/user-plugin-input";
import {
  deleteUserPlugin,
  getUserPlugin,
  UserPluginError,
  updateUserPlugin,
} from "@/lib/plugins/user-plugin-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getMaiUser();
  if (!user) {
    return errorResponse("auth_required");
  }
  const { id } = await params;
  const plugin = await getUserPlugin(user.id || user.email, id);
  if (!plugin) {
    return errorResponse("not_found", { message: "Plugin introuvable." });
  }
  return Response.json({ plugin });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getMaiUser();
  if (!user) {
    return errorResponse("auth_required");
  }
  const { id } = await params;
  try {
    const json = await request.json();
    const parsed = userPluginUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return errorResponse("invalid_request", {
        message: zodIssuesMessage(parsed.error),
      });
    }
    const plugin = await updateUserPlugin(
      user.id || user.email,
      id,
      parsed.data
    );
    if (!plugin) {
      return errorResponse("not_found", { message: "Plugin introuvable." });
    }
    return Response.json({ plugin });
  } catch (error) {
    if (error instanceof UserPluginError) {
      return errorResponse("invalid_request", { message: error.message });
    }
    logError("PATCH /api/user-plugins/[id]", error);
    return errorResponse("internal_error", {
      message: "Impossible de mettre à jour le plugin.",
    });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getMaiUser();
  if (!user) {
    return errorResponse("auth_required");
  }
  const { id } = await params;
  try {
    const removed = await deleteUserPlugin(user.id || user.email, id);
    if (!removed) {
      return errorResponse("not_found", { message: "Plugin introuvable." });
    }
    return Response.json({ success: true });
  } catch (error) {
    logError("DELETE /api/user-plugins/[id]", error);
    return errorResponse("internal_error", {
      message: "Impossible de supprimer le plugin.",
    });
  }
}
