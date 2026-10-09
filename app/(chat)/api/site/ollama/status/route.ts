import { type NextRequest, NextResponse } from "next/server";
import { fetchOllama, getLoopbackOllamaUrl } from "@/lib/site/ollama-url";

export async function GET(req: NextRequest) {
  const ollamaUrl = getLoopbackOllamaUrl();
  if (!ollamaUrl) {
    return NextResponse.json({
      message:
        "Configuration OLLAMA_BASE_URL invalide : seule une adresse de boucle locale est autorisée.",
      modelInstalled: false,
      online: false,
    });
  }
  const ollamaHost = ollamaUrl.origin;
  const { searchParams } = new URL(req.url);
  const targetModel = searchParams.get("model");

  try {
    // 1. Ping version Ollama
    const versionRes = await fetchOllama(`${ollamaHost}/api/version`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      method: "GET",
    });

    if (!versionRes.ok) {
      return NextResponse.json({
        message: `Serveur Ollama inaccessible (${versionRes.statusText}).`,
        modelInstalled: false,
        online: false,
      });
    }

    const versionData = await versionRes.json();
    const versionStr = versionData.version || "Actif";

    // 2. Vérifier les modèles installés via /api/tags
    if (targetModel) {
      try {
        const tagsRes = await fetchOllama(`${ollamaHost}/api/tags`, {
          cache: "no-store",
          method: "GET",
        });

        if (tagsRes.ok) {
          const tagsData = await tagsRes.json();
          const installedList: any[] = tagsData.models || [];
          const cleanTarget = targetModel.toLowerCase();

          const isInstalled = installedList.some(
            (m) =>
              m.name?.toLowerCase() === cleanTarget ||
              m.model?.toLowerCase() === cleanTarget ||
              m.name?.toLowerCase().startsWith(cleanTarget)
          );

          if (!isInstalled) {
            return NextResponse.json({
              message: `Serveur Ollama connecté (${versionStr}), mais le modèle "${targetModel}" n'est pas disponible en local.`,
              modelInstalled: false,
              online: true,
              version: versionStr,
            });
          }
        }
      } catch {
        // En cas d'erreur sur /api/tags, considérer Ollama en ligne
      }
    }

    return NextResponse.json({
      message: `Serveur Ollama connecté (${versionStr}) et modèle prêt.`,
      modelInstalled: true,
      online: true,
      version: versionStr,
    });
  } catch {
    return NextResponse.json({
      message: `Impossible de joindre le serveur local Ollama (${ollamaHost}). Assurez-vous que l'application Ollama est démarrée.`,
      modelInstalled: false,
      online: false,
    });
  }
}
