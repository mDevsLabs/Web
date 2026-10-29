import { z } from "zod";
import {
  errorResponse,
  logError,
  zodIssuesMessage,
} from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import { enforceChatRateLimit } from "@/lib/chat/auth";
import { userPluginCreateSchema } from "@/lib/plugins/user-plugin-input";
import {
  createUserPlugin,
  listUserPlugins,
  UserPluginError,
} from "@/lib/plugins/user-plugin-store";

export async function GET() {
  const user = await getMaiUser();
  if (!user) {
    return errorResponse("auth_required");
  }
  try {
    const plugins = await listUserPlugins(user.id || user.email);
    return Response.json({ plugins });
  } catch (error) {
    logError("GET /api/user-plugins", error);
    return errorResponse("internal_error", {
      message: "Impossible de lire vos plugins.",
    });
  }
}

export async function POST(request: Request) {
  const user = await getMaiUser();
  if (!user) {
    return errorResponse("auth_required");
  }
  const userId = user.id || user.email;
  try {
    await enforceChatRateLimit(request, userId);
    const json = await request.json();
    const parsed = userPluginCreateSchema.safeParse(json);
    if (!parsed.success) {
      return errorResponse("invalid_request", {
        message: zodIssuesMessage(parsed.error),
      });
    }
    const plugin = await createUserPlugin(userId, parsed.data);
    return Response.json({ plugin }, { status: 201 });
  } catch (error) {
    if (error instanceof UserPluginError) {
      return errorResponse("invalid_request", { message: error.message });
    }
    if (error instanceof z.ZodError) {
      return errorResponse("invalid_request", {
        message: zodIssuesMessage(error),
      });
    }
    logError("POST /api/user-plugins", error);
    return errorResponse("internal_error", {
      message: "Impossible de créer le plugin.",
    });
  }
}
