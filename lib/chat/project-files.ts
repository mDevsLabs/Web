import type { ModelCapabilities } from "@/lib/ai/models";

// Policy d'injection des fichiers projet dans une requête modèle. PURE (aucune
// IO) : les décisions dépendent uniquement du type de fichier, des capacités
// déclarées du modèle (getModelCapabilities → { file, image, vision, tools,
// reasoning }) et du budget de contexte. Un modèle texte seul ne reçoit
// JAMAIS d'image ni de format non pris en charge : la pièce est ignorée et
// signalée dans le manifest plutôt que rejetée en erreur.

export type ProjectFileLike = {
  contentType: string;
  extractedText: string | null;
  extractionStatus: "failed" | "pending" | "ready" | "unsupported";
  fileName: string;
  fileSize: number | null;
};

export type FileInjectionDecision = {
  // Mode d'injection retenu pour ce fichier.
  action:
    | "native_file" // pièce jointe binaire (image/PDF) — modèle multimodal
    | "text" // texte extrait injecté dans le prompt (sous budget)
    | "manifest_only" // non injecté : capacités insuffisantes ou trop lourd
    | "skip"; // sans contenu exploitable (échec d'extraction, vide)
  // Raison affichable dans le manifest pour les fichiers non injectés.
  notice?: string;
  // Troncature appliquée (texte) : true si le contenu dépasse le budget par
  // fichier — le texte injecté est alors suffixé d'une mention.
  truncated?: boolean;
};

export type InjectionBudget = {
  maxCharsPerFile: number;
  maxTotalChars: number;
};

export const DEFAULT_INJECTION_BUDGET: InjectionBudget = {
  maxCharsPerFile: 8000,
  maxTotalChars: 24_000,
};

export type PlannedInjection = {
  decisions: Array<FileInjectionDecision & { file: ProjectFileLike }>;
  // Blocs texte concaténés (déjà tronqués) à placer dans l'addendum de prompt.
  textBlocks: string[];
  // Nombre de caractères réellement consommés par les blocs texte.
  usedChars: number;
};

function isImage(contentType: string, fileName: string): boolean {
  return (
    contentType.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp)$/i.test(fileName)
  );
}

function isPdf(contentType: string, fileName: string): boolean {
  return contentType === "application/pdf" || /\.pdf$/i.test(fileName);
}

function isTextLike(contentType: string, fileName: string): boolean {
  return (
    contentType.startsWith("text/") ||
    contentType === "application/json" ||
    /\.(txt|md|markdown|csv|json|log)$/i.test(fileName)
  );
}

/**
 * Décision d'injection pour UN fichier, selon les capacités du modèle.
 * - image        → native_file si caps.image, sinon manifest_only (signalé).
 * - pdf          → texte extrait prioritaire (caps.file optionnelle) ; sans
 *                  texte ni caps.file → manifest_only signalé.
 * - texte/docx   → texte extrait (manifest_only si aucune extraction).
 * - autre        → manifest_only (statut unsupported).
 */
export function decideProjectFileInjection(
  file: ProjectFileLike,
  caps: Pick<ModelCapabilities, "file" | "image">,
  budget: InjectionBudget = DEFAULT_INJECTION_BUDGET
): FileInjectionDecision {
  const hasExtractedText =
    file.extractionStatus === "ready" &&
    typeof file.extractedText === "string" &&
    file.extractedText.trim().length > 0;

  if (isImage(file.contentType, file.fileName)) {
    if (caps.image) {
      return { action: "native_file" };
    }
    return {
      action: "manifest_only",
      notice:
        "non transmis : ce modèle ne prend pas en charge les images — jointez-le directement à un message avec un modèle multimodal.",
    };
  }

  if (isPdf(file.contentType, file.fileName)) {
    if (hasExtractedText) {
      return { action: "text" };
    }
    if (caps.file) {
      return { action: "native_file" };
    }
    return {
      action: "manifest_only",
      notice:
        "non transmis : PDF sans texte extractible et modèle sans support de fichiers.",
    };
  }

  if (isTextLike(file.contentType, file.fileName) || hasExtractedText) {
    if (hasExtractedText) {
      return { action: "text" };
    }
    return {
      action: "manifest_only",
      notice:
        "en cours de traitement : le contenu texte sera disponible dans les prochaines conversations.",
    };
  }

  if (hasExtractedText) {
    return { action: "text" };
  }
  return {
    action: "manifest_only",
    notice: "type de fichier non exploitable en contexte.",
  };
}

/**
 * Plan d'injection complet : texte sous budget global (plus récents d'abord),
 * pièces natives séparées, notices pour le manifest. Les fichiers trop
 * nombreux/lourds ne sont jamais envoyés systématiquement : seuls les blocs
 * qui tiennent dans le budget partent.
 */
export function planProjectFilesInjection(
  files: ProjectFileLike[],
  caps: Pick<ModelCapabilities, "file" | "image">,
  budget: InjectionBudget = DEFAULT_INJECTION_BUDGET
): PlannedInjection {
  const decisions: Array<FileInjectionDecision & { file: ProjectFileLike }> =
    [];
  const textBlocks: string[] = [];
  let usedChars = 0;

  for (const file of files) {
    const decision = decideProjectFileInjection(file, caps, budget);
    if (decision.action !== "text") {
      decisions.push({ ...decision, file });
      continue;
    }

    let text = file.extractedText ?? "";
    let truncated = false;
    if (text.length > budget.maxCharsPerFile) {
      text = `${text.slice(0, budget.maxCharsPerFile)}\n[... fichier tronqué : ${file.fileName}]`;
      truncated = true;
    }
    if (usedChars + text.length > budget.maxTotalChars) {
      const remaining = budget.maxTotalChars - usedChars;
      if (remaining < 500) {
        // Plus de budget : le fichier reste listé mais n'est pas injecté.
        decisions.push({
          action: "manifest_only",
          file,
          notice:
            "non transmis : budget de contexte projet atteint pour ce message.",
        });
        continue;
      }
      text = `${text.slice(0, remaining)}\n[... fichier tronqué : ${file.fileName}]`;
      truncated = true;
      usedChars = budget.maxTotalChars;
      decisions.push({ action: "text", file, truncated });
      textBlocks.push(`### ${file.fileName}\n${text}`);
      continue;
    }

    usedChars += text.length;
    decisions.push({
      action: "text",
      file,
      truncated: truncated || undefined,
    });
    textBlocks.push(`### ${file.fileName}\n${text}`);
  }

  return { decisions, textBlocks, usedChars };
}

/**
 * Manifest compact (noms, types, tailles, statuts) injecté dans TOUTE
 * conversation du projet : coût négligeable, le modèle sait ce qui existe et
 * peut dire à l'utilisateur ce qui n'a pas pu être transmis et pourquoi.
 */
export function buildProjectFilesManifest(
  files: ProjectFileLike[],
  decisions?: Array<FileInjectionDecision>
): string | null {
  if (files.length === 0) {
    return null;
  }
  const byName = new Map((decisions ?? []).map((d) => [d.file.fileName, d]));
  const lines = files.map((file) => {
    const decision = byName.get(file.fileName);
    const size = file.fileSize ? ` (${formatBytes(file.fileSize)})` : "";
    const notice = decision?.notice ? ` — ${decision.notice}` : "";
    return `- ${file.fileName}${size}${notice}`;
  });
  return [
    `Fichiers du projet (${files.length}) — disponibles comme contexte :`,
    ...lines,
  ].join("\n");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} o`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} Ko`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

/**
 * Bloc complet pour l'addendum de prompt : manifest + contenus texte sous
 * budget. Retourne null quand le projet n'a aucun fichier (zéro coût).
 */
export function buildProjectFilesPromptBlock(params: {
  files: ProjectFileLike[];
  caps: Pick<ModelCapabilities, "file" | "image">;
  budget?: InjectionBudget;
}): string | null {
  if (params.files.length === 0) {
    return null;
  }
  const plan = planProjectFilesInjection(
    params.files,
    params.caps,
    params.budget
  );
  const manifest = buildProjectFilesManifest(params.files, plan.decisions);
  const sections: string[] = [];
  if (manifest) {
    sections.push(manifest);
  }
  if (plan.textBlocks.length > 0) {
    sections.push(
      [
        "Contenu des fichiers du projet (texte extrait, sous budget) :",
        ...plan.textBlocks,
      ].join("\n\n")
    );
  }
  return sections.join("\n\n");
}
