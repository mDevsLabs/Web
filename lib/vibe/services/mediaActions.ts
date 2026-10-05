/**
 * ============================================================================
 * VIBE — ACTIONS MÉDIAS (src/services/mediaActions.ts)
 * Téléchargement et partage natif d'un média (image/vidéo), avec replis
 * propres quand le CORS du stockage bloque fetch ou le partage de fichier.
 * ============================================================================
 */

import { haptics } from "@/lib/vibe/services/haptics";
import { NotificationService } from "@/lib/vibe/services/notificationService";

function filenameFromUrl(url: string, fallback = "vibe-media"): string {
  try {
    const clean = url.split("?")[0].split("#")[0];
    const name = decodeURIComponent(clean.split("/").pop() || "");
    return name || fallback;
  } catch {
    return fallback;
  }
}

/** Télécharge un média ; si le fetch est bloqué (CORS), l'ouvre dans un onglet. */
export async function downloadMedia(url: string): Promise<void> {
  const filename = filenameFromUrl(url);
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error("fetch failed");
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
    haptics.success();
  } catch {
    // CORS non autorisé : ouverture directe (le navigateur propose alors le téléchargement)
    window.open(url, "_blank", "noopener,noreferrer");
    NotificationService.showInAppToast(
      "Téléchargement",
      "Média ouvert dans un nouvel onglet (téléchargement direct indisponible).",
      "info"
    );
  }
}

/** Partage natif d'un média : fichier si supporté, sinon lien, sinon copie. */
export async function shareMedia(url: string, title?: string): Promise<void> {
  const nav = navigator as any;
  const filename = filenameFromUrl(url);
  try {
    if (nav.share) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const blob = await res.blob();
          const file = new File([blob], filename, {
            type: blob.type || "application/octet-stream",
          });
          if (nav.canShare?.({ files: [file] })) {
            await nav.share({ files: [file], title: title || "Vibe" });
            haptics.success();
            return;
          }
        }
      } catch {
        // Repli : partage du lien seul
      }
      await nav.share({ title: title || "Vibe", url });
      haptics.success();
      return;
    }
    await navigator.clipboard.writeText(url);
    haptics.success();
    NotificationService.showInAppToast(
      "Lien copié",
      "Le partage natif n'est pas disponible : le lien du média a été copié.",
      "info"
    );
  } catch {
    // Partage annulé par l'utilisateur : silencieux
  }
}

/** Télécharge un contenu texte généré côté client (export mAI, sauvegardes…). */
export function downloadTextFile(
  filename: string,
  content: string,
  mime = "text/plain;charset=utf-8"
): void {
  const blob = new Blob([content], { type: mime });
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
}
