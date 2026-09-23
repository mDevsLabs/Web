import type { ModelCapabilities } from "@/lib/ai/registry/capabilities";
import type { ChatMessage } from "@/lib/types";

// Validation et description des pièces jointes côté Agent. Le client ne fait
// jamais autorité : types, limites et nombre sont revérifiés ici, en fonction
// des capacités réelles du modèle sélectionné.

export type AgentAttachment = {
  contentType: string;
  name: string;
  url: string;
};

const DOCUMENT_TYPES = [
  "application/pdf",
  "application/json",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/csv",
];

export function collectAttachments(
  message: ChatMessage | null
): AgentAttachment[] {
  const parts = message?.parts ?? [];
  const attachments: AgentAttachment[] = [];
  for (const part of parts) {
    const candidate = part as {
      mediaType?: string;
      name?: string;
      type?: string;
      url?: string;
    };
    if (candidate.type === "file" && candidate.url) {
      attachments.push({
        contentType: candidate.mediaType ?? "application/octet-stream",
        name: candidate.name ?? "fichier",
        url: candidate.url,
      });
    }
  }
  return attachments;
}

export function validateAttachmentsAgainstModel(params: {
  attachments: AgentAttachment[];
  capabilities: ModelCapabilities;
}): { error?: string } {
  const { attachments, capabilities } = params;
  if (attachments.length === 0) {
    return {};
  }

  if (capabilities.maxFiles <= 0) {
    return {
      error:
        "Ce modèle ne prend pas en charge les fichiers. Choisissez un autre modèle ou retirez les pièces jointes.",
    };
  }

  if (attachments.length > capabilities.maxFiles) {
    return {
      error: `Ce modèle accepte au maximum ${capabilities.maxFiles} fichiers par tâche (${attachments.length} fournis).`,
    };
  }

  for (const attachment of attachments) {
    const isImage = attachment.contentType.startsWith("image/");
    const isDocument =
      capabilities.documents &&
      (DOCUMENT_TYPES.includes(attachment.contentType) ||
        attachment.contentType.startsWith("text/"));

    if (isImage && !capabilities.images) {
      return {
        error: `Ce modèle ne prend pas en charge les images (« ${attachment.name} »).`,
      };
    }
    if (!isImage && !isDocument) {
      return {
        error: `Ce modèle ne prend pas en charge ce type de fichier (« ${attachment.name} », ${attachment.contentType}).`,
      };
    }
  }

  return {};
}

// Bloc injecté dans les instructions : Agent sait quels fichiers existent et
// comment les lire (par URL pour les fichiers téléversés, par identifiant pour
// la bibliothèque), sans recevoir leur contenu d'office.
export function attachmentsInstructions(
  attachments: AgentAttachment[]
): string | null {
  if (attachments.length === 0) {
    return null;
  }
  const lines = attachments.map(
    (attachment) =>
      `- ${attachment.name} (${attachment.contentType}) : ${attachment.url}`
  );
  return [
    "Fichiers joints par l'utilisateur pour cette tâche :",
    ...lines,
    "Utilise l'outil de lecture de fichier avec l'URL fournie quand tu as besoin de leur contenu : ne suppose jamais ce qu'ils contiennent.",
  ].join("\n");
}
