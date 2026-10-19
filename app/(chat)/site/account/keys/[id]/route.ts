import { type NextRequest, NextResponse } from "next/server";
import { revokeApiKey } from "@/lib/site/api-key-manager";
import { authenticateSession } from "@/lib/site/session-auth";

// DELETE /account/keys/[id] - Révoquer une clé API
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authenticateSession(req);
    if (!auth.ok) return auth.response;
    const userId = auth.identity.userId;

    if (!id) {
      return NextResponse.json(
        {
          error: {
            code: "bad_request",
            message: "Identifiant de clé manquant.",
          },
        },
        { status: 400 }
      );
    }

    const success = await revokeApiKey(userId, id);

    if (!success) {
      return NextResponse.json(
        {
          error: {
            code: "not_found",
            message: "Clé API introuvable ou déjà révoquée.",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Clé API révoquée avec succès.",
      success: true,
    });
  } catch (err: unknown) {
    console.error("Erreur DELETE /account/keys/[id]:", err);
    return NextResponse.json(
      {
        error: {
          code: "internal_error",
          message: "Erreur lors de la révocation de la clé.",
        },
      },
      { status: 500 }
    );
  }
}
