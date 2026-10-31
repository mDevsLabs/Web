/**
 * Export et partage locaux d'un fil Coach.
 * Aucune URL publique : le texte reste sur l'appareil.
 */

export function markdownConversation(
  titre: string,
  messages: readonly { role: "assistant" | "user"; text: string }[]
): string {
  const lignes = [`# ${titre}`, ""];
  for (const message of messages) {
    lignes.push(
      message.role === "user" ? "## Moi" : "## Coach",
      "",
      message.text,
      ""
    );
  }
  return lignes.join("\n");
}

export function markdownMessage(message: {
  role: "assistant" | "user";
  text: string;
}): string {
  const auteur = message.role === "user" ? "Moi" : "Coach";
  return `# ${auteur}\n\n${message.text}\n`;
}

export function nomFichierCoach(titre: string): string {
  const base = titre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `quizzly-coach-${base || "conversation"}.md`;
}

export function telechargerMarkdown(nom: string, contenu: string): void {
  const blob = new Blob([contenu], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nom;
  lien.click();
  URL.revokeObjectURL(url);
}

export async function partagerTexte(
  titre: string,
  texte: string
): Promise<"annule" | "copie" | "partage"> {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ text: texte, title: titre });
      return "partage";
    } catch (raison) {
      if (raison instanceof DOMException && raison.name === "AbortError") {
        return "annule";
      }
    }
  }
  await navigator.clipboard.writeText(texte);
  return "copie";
}
