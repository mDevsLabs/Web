/**
 * Logo d'un fournisseur de modèle.
 *
 * Les logos proviennent de `models.dev` (SVG publics, un par laboratoire). Un
 * logo absent ou cassé ne doit pas laisser une image vide : on retombe sur
 * une étoile dorée, appliquée une seule fois par image.
 *
 * L'inversion en mode sombre est portée par la classe `dark:invert` : elle
 * suit `<html>`, ce qui convient au Site comme à l'hôte (le Site recopie le
 * thème résolu de l'hôte sur sa racine, cf. `components/site/theme-sync.tsx`).
 */

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type ModelSelectorLogoProps = Omit<
  ComponentProps<"img">,
  "src" | "alt"
> & {
  provider: string;
};

// Repli élégant : belle étoile moderne à 5 branches dorée/ambre (non-Gemini)
function starLogoDataUri(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><defs><linearGradient id="starG" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#d97706"/></linearGradient></defs><path fill="url(#starG)" stroke="#b45309" stroke-width="0.75" stroke-linejoin="round" d="M12 2l2.9 6.26L21.8 9.27l-5.1 4.73 1.38 6.75L12 17.35 5.92 20.75l1.38-6.75-5.1-4.73 6.9-1.01L12 2z"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Nettoyage et normalisation des alias de logos
function normalizeLogoProvider(rawProvider: string): string {
  const p = String(rawProvider || "")
    .toLowerCase()
    .trim()
    .replace(/^~+/, "");

  if (p === "granite" || p === "ibm" || p.includes("granite")) return "ibm";
  if (
    p === "tencent" ||
    p === "hunyuan" ||
    p.startsWith("hy3") ||
    p.startsWith("hy4")
  )
    return "tencent";
  if (p === "qwen" || p === "alibaba" || p === "alibaba-cn") return "qwen";
  if (
    p === "zhipu" ||
    p === "zhipuai" ||
    p === "zai" ||
    p === "z-ai" ||
    p === "glm" ||
    p === "bigmodel"
  )
    return "zhipuai";
  if (p === "inclusion" || p === "inclusion-ai" || p === "inclusionai")
    return "inclusion-ai";
  if (p === "dots" || p === "dots-studio" || p === "dotsstudio")
    return "dots-studio";
  if (p === "bytedance" || p === "doubao" || p === "volcengine")
    return "bytedance";
  if (p === "xai" || p === "x-ai" || p === "grok") return "xai";
  if (p === "liquid" || p === "liquid-ai" || p === "liquidai" || p === "lfm")
    return "liquid-ai";
  if (p === "meituan" || p === "longcat") return "meituan";
  if (p === "kwaipilot" || p === "kuaishou" || p === "kwai" || p === "kolors")
    return "kwaipilot";
  if (p === "next-agi" || p === "nextagi") return "nextagi";
  if (p === "aion" || p === "aion-labs" || p === "aionlabs") return "aionlabs";
  if (p === "perceptron" || p === "perceptron-ai") return "perceptron";
  if (
    p === "mistral" ||
    p === "mistralai" ||
    p === "mistral-ai" ||
    p === "codestral" ||
    p === "pixtral" ||
    p === "ministral"
  )
    return "mistral";
  if (p === "arcee" || p === "arcee-ai" || p === "arceeai") return "arceeai";
  if (p === "reka" || p === "reka-ai" || p === "rekaai") return "rekaai";
  if (p === "writer" || p === "palmyra") return "writer";
  if (
    p === "amazon" ||
    p === "amazon-bedrock" ||
    p === "aws" ||
    p === "nova" ||
    p === "titan"
  )
    return "amazon";
  if (p === "meta" || p === "meta-llama" || p === "llama") return "meta-llama";
  if (p === "poolside" || p === "laguna") return "poolside";
  if (p === "kimi" || p === "moonshot" || p === "moonshotai")
    return "moonshotai";
  if (p === "01-ai" || p === "yi") return "01-ai";
  if (p === "microsoft" || p === "azure") return "azure";
  if (p === "together" || p === "togetherai") return "togetherai";
  if (p === "fireworks" || p === "fireworks-ai") return "fireworks-ai";
  if (p === "stability" || p === "stability-ai" || p === "stabilityai")
    return "stability-ai";
  if (p === "recraft" || p === "recraft-ai") return "recraft-ai";
  if (p === "google-vertex" || p === "google") return "google";

  return p || "mai";
}

export const ModelSelectorLogo = ({
  provider,
  className,
  ...props
}: ModelSelectorLogoProps) => {
  const normalized = normalizeLogoProvider(provider);
  const isMai =
    normalized === "mai" ||
    normalized === "mdevslabs" ||
    normalized === "mdevs";
  return (
    <img
      {...props}
      alt={`${provider} logo`}
      className={cn("size-4 shrink-0 mr-2 dark:invert", className)}
      decoding="async"
      height={16}
      loading="lazy"
      onError={(event) => {
        const img = event.currentTarget;
        if (img.dataset.logoFallbackApplied) {
          return;
        }
        img.dataset.logoFallbackApplied = "true";
        img.src = starLogoDataUri();
        img.style.filter = "none";
      }}
      src={
        isMai ? "/models/mai.svg" : `https://models.dev/logos/${normalized}.svg`
      }
      width={16}
    />
  );
};
