import { toast } from "sonner";
import { apiUrl } from "@/lib/client/api-endpoints";

// Export d'une conversation en Markdown, partagé par le Chat et l'Agent.
//
// L'agent `/export` faisait sa requête, créait son Blob et déclenchait son
// téléchargement en ligne. Le duplication aurait été le pire endroit possible
// pour deux chemins qui doivent produire exactement le même fichier.

/**
 * Télécharge la conversation au format Markdown.
 *
 * Retourne `false` si l'export a échoué : l'appelant peut alors décider s'il
 * valait la peine d'afficher un second message, plutôt que de laisser une
 * fonction void tout signaler.
 */
export async function downloadChatAsMarkdown(chatId: string): Promise<boolean> {
  try {
    const response = await fetch(
      apiUrl(`/api/chats/${chatId}/export?format=md`)
    );
    if (!response.ok) {
      throw new Error("Export échoué");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `chat-${chatId}.md`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast.success("Export Markdown téléchargé");
    return true;
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Erreur lors de l'export"
    );
    return false;
  }
}
