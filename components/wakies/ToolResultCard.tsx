"use client";

/** Port des cartes de résultats OpenMuse : le format AI SDK est interprété explicitement, sans exécuter le contenu retourné. */
import type { UIMessage } from "ai";
import { PluginToolLogo } from "@/lib/integrations/logo";
import { getPluginByToolId } from "@/lib/plugins/catalog";
import { safeAttachmentLink } from "@/lib/wakies/shared/messages";
export function ToolResultCard({ part }: { part: UIMessage["parts"][number] }) {
  if (part.type === "source-url") {
    const url = safeAttachmentLink(part.url);
    return url ? (
      <a
        className="tool-card"
        href={url}
        rel="noopener noreferrer"
        target="_blank"
      >
        {part.title || new URL(url).hostname}
      </a>
    ) : null;
  }
  if (part.type === "reasoning")
    return (
      <details className="tool-card">
        <summary>Réflexion</summary>
        <p>{part.text}</p>
      </details>
    );
  if (!(part.type === "dynamic-tool" || part.type.startsWith("tool-")))
    return null;
  const value = part as {
    type: string;
    toolName?: string;
    state?: string;
    output?: unknown;
    errorText?: string;
    toolCallId?: string;
  };
  const name = value.toolName ?? value.type.slice(5);
  // Un outil de connecteur a un nom français dans son manifeste : l'afficher
  // avec le logo de l'application dit laquelle a répondu, au lieu d'un
  // identifiant technique en camelCase.
  const manifest = getPluginByToolId(name);
  const pluginTool = manifest?.tools.find((item) => item.id === name);
  const label = manifest
    ? `${manifest.name} · ${pluginTool?.label ?? name}`
    : name;
  const state = value.state;
  let output = "";
  if (value.output !== undefined) {
    try {
      output =
        typeof value.output === "string"
          ? value.output
          : JSON.stringify(value.output, null, 2);
    } catch {
      output = "Résultat non affichable.";
    }
  }
  return (
    <article aria-label={`Outil ${label}`} className="tool-card">
      <strong className="tool-card-title">
        <PluginToolLogo className="tool-card-logo" toolId={name} />
        {label}
      </strong>
      <p role="status">
        {state === "output-available"
          ? "Résultat enregistré"
          : state === "output-error"
            ? "L’outil a échoué"
            : state === "output-denied"
              ? "Exécution refusée"
              : state === "approval-requested"
                ? "Validation requise"
                : "Appel d’outil"}
      </p>
      {value.errorText && <p>{value.errorText}</p>}
      {output && (
        <details>
          <summary>Voir le résultat</summary>
          <pre>
            {output.slice(0, 20_000)}
            {output.length > 20_000 ? "\n[Affichage tronqué.]" : ""}
          </pre>
        </details>
      )}
      {!output && state === "input-available" && (
        <small>
          Pour les actions MCP sensibles, utilisez le mode Agent mAI et son
          circuit d’approbation.
        </small>
      )}
    </article>
  );
}
