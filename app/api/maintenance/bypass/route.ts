import { NextResponse } from "next/server";
import { MAI_MAINTENANCE_BYPASS_COOKIE } from "@/lib/constants";
import { createMaintenanceBypassToken } from "@/lib/maintenance/maintenance-bypass";
import { getActiveMaintenance } from "@/lib/maintenance/maintenance-service";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawCode = typeof body?.code === "string" ? body.code.trim() : "";

    if (!rawCode) {
      return NextResponse.json(
        { error: "Veuillez renseigner un code d'accès." },
        { status: 400 }
      );
    }

    const activeMaintenance = await getActiveMaintenance(true);
    if (!activeMaintenance) {
      return NextResponse.json(
        { error: "Aucune maintenance n'est active actuellement." },
        { status: 400 }
      );
    }

    const activeCode = (activeMaintenance.accessCode || "")
      .trim()
      .toUpperCase();
    const candidateCode = rawCode.toUpperCase();

    if (!activeCode || candidateCode !== activeCode) {
      return NextResponse.json(
        { error: "Code d'accès invalide pour cette maintenance." },
        { status: 401 }
      );
    }

    const token = createMaintenanceBypassToken(
      activeMaintenance.id,
      activeMaintenance.accessCode
    );

    const endMs = new Date(activeMaintenance.endAt).getTime();
    const nowMs = Date.now();
    // Expiration calquée sur la fin de la maintenance (avec un minimum de 60s et un max de 24h)
    const maxAgeSeconds = Math.min(
      86_400,
      Math.max(60, Math.floor((endMs - nowMs) / 1000))
    );

    const response = NextResponse.json({
      message: "Code validé. Accès déverrouillé avec succès !",
      redirectUrl: "/",
      success: true,
    });

    response.cookies.set({
      httpOnly: true,
      maxAge: maxAgeSeconds,
      name: MAI_MAINTENANCE_BYPASS_COOKIE,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      value: token,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de la vérification du code.",
      },
      { status: 500 }
    );
  }
}
