import type { ComponentProps, ReactNode } from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Popover as PopoverPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export type ModelSelectorProps = React.ComponentProps<typeof PopoverPrimitive.Root>;

export const ModelSelector = (props: ModelSelectorProps) => (
  <Popover {...props} />
);

export type ModelSelectorTriggerProps = ComponentProps<typeof PopoverTrigger>;

export const ModelSelectorTrigger = (props: ModelSelectorTriggerProps) => (
  <PopoverTrigger {...props} />
);

export type ModelSelectorContentProps = ComponentProps<typeof PopoverContent> & {
  commandDefaultValue?: ComponentProps<typeof Command>["defaultValue"];
  title?: ReactNode;
  shouldFilter?: boolean;
  filter?: ComponentProps<typeof Command>["filter"];
};

export const ModelSelectorContent = ({
  className,
  commandDefaultValue,
  children,
  title: _title,
  shouldFilter,
  filter,
  ...props
}: ModelSelectorContentProps) => (
  <PopoverContent
    align="start"
    className={cn(
      "w-[280px] p-0 rounded-xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-[var(--shadow-float)]",
      className
    )}
    side="top"
    sideOffset={8}
    {...props}
  >
    <Command
      className="**:data-[slot=command-input-wrapper]:h-auto"
      defaultValue={commandDefaultValue}
      filter={filter}
      shouldFilter={shouldFilter}
    >
      {children}
    </Command>
  </PopoverContent>
);

export type ModelSelectorInputProps = ComponentProps<typeof CommandInput>;

export const ModelSelectorInput = ({
  className,
  ...props
}: ModelSelectorInputProps) => (
  <CommandInput className={cn("h-auto py-2.5 text-[13px]", className)} {...props} />
);

export type ModelSelectorListProps = ComponentProps<typeof CommandList>;

export const ModelSelectorList = ({ className, ...props }: ModelSelectorListProps) => (
  <CommandList className={cn("max-h-[280px]", className)} {...props} />
);

export type ModelSelectorEmptyProps = ComponentProps<typeof CommandEmpty>;

export const ModelSelectorEmpty = (props: ModelSelectorEmptyProps) => (
  <CommandEmpty {...props} />
);

export type ModelSelectorGroupProps = ComponentProps<typeof CommandGroup>;

export const ModelSelectorGroup = (props: ModelSelectorGroupProps) => (
  <CommandGroup {...props} />
);

export type ModelSelectorItemProps = ComponentProps<typeof CommandItem>;

export const ModelSelectorItem = ({ className, ...props }: ModelSelectorItemProps) => (
  <CommandItem className={cn("w-full text-[13px] rounded-lg", className)} {...props} />
);

export type ModelSelectorShortcutProps = ComponentProps<typeof CommandShortcut>;

export const ModelSelectorShortcut = (props: ModelSelectorShortcutProps) => (
  <CommandShortcut {...props} />
);

export type ModelSelectorSeparatorProps = ComponentProps<
  typeof CommandSeparator
>;

export const ModelSelectorSeparator = (props: ModelSelectorSeparatorProps) => (
  <CommandSeparator {...props} />
);

export type ModelSelectorLogoProps = Omit<
  ComponentProps<"img">,
  "src" | "alt"
> & {
  provider:
    | "moonshotai-cn"
    | "lucidquery"
    | "moonshotai"
    | "zai-coding-plan"
    | "alibaba"
    | "xai"
    | "vultr"
    | "nvidia"
    | "upstage"
    | "groq"
    | "github-copilot"
    | "mistral"
    | "vercel"
    | "nebius"
    | "deepseek"
    | "alibaba-cn"
    | "google-vertex-anthropic"
    | "venice"
    | "chutes"
    | "cortecs"
    | "github-models"
    | "togetherai"
    | "azure"
    | "baseten"
    | "huggingface"
    | "opencode"
    | "fastrouter"
    | "google"
    | "google-vertex"
    | "cloudflare-workers-ai"
    | "inception"
    | "wandb"
    | "openai"
    | "zhipuai-coding-plan"
    | "perplexity"
    | "openrouter"
    | "zenmux"
    | "v0"
    | "iflowcn"
    | "synthetic"
    | "deepinfra"
    | "zhipuai"
    | "submodel"
    | "zai"
    | "inference"
    | "requesty"
    | "morph"
    | "lmstudio"
    | "anthropic"
    | "aihubmix"
    | "fireworks-ai"
    | "modelscope"
    | "llama"
    | "scaleway"
    | "amazon-bedrock"
    | "cerebras"
    | "ibm"
    | "granite"
    | "tencent"
    | "hunyuan"
    | "qwen"
    | "inclusion-ai"
    | "dots-studio"
    | "bytedance"
    | "doubao"
    | "liquid-ai"
    | "meituan"
    | "kwaipilot"
    | "nextagi"
    | "aionlabs"
    | "perceptron"
    | "arceeai"
    | "rekaai"
    | "writer"
    | "amazon"
    // oxlint-disable-next-line typescript-eslint(ban-types) -- intentional pattern for autocomplete-friendly string union
    | (string & {});
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
  if (p === "tencent" || p === "hunyuan" || p.startsWith("hy3") || p.startsWith("hy4")) return "tencent";
  if (p === "qwen" || p === "alibaba" || p === "alibaba-cn") return "qwen";
  if (p === "zhipu" || p === "zhipuai" || p === "zai" || p === "z-ai" || p === "glm" || p === "bigmodel") return "zhipuai";
  if (p === "inclusion" || p === "inclusion-ai" || p === "inclusionai") return "inclusion-ai";
  if (p === "dots" || p === "dots-studio" || p === "dotsstudio") return "dots-studio";
  if (p === "bytedance" || p === "doubao" || p === "volcengine") return "bytedance";
  if (p === "xai" || p === "x-ai" || p === "grok") return "xai";
  if (p === "liquid" || p === "liquid-ai" || p === "liquidai" || p === "lfm") return "liquid-ai";
  if (p === "meituan" || p === "longcat") return "meituan";
  if (p === "kwaipilot" || p === "kuaishou" || p === "kwai" || p === "kolors") return "kwaipilot";
  if (p === "next-agi" || p === "nextagi") return "nextagi";
  if (p === "aion" || p === "aion-labs" || p === "aionlabs") return "aionlabs";
  if (p === "perceptron" || p === "perceptron-ai") return "perceptron";
  if (p === "mistral" || p === "mistralai" || p === "mistral-ai" || p === "codestral" || p === "pixtral" || p === "ministral") return "mistral";
  if (p === "arcee" || p === "arcee-ai" || p === "arceeai") return "arceeai";
  if (p === "reka" || p === "reka-ai" || p === "rekaai") return "rekaai";
  if (p === "writer" || p === "palmyra") return "writer";
  if (p === "amazon" || p === "amazon-bedrock" || p === "aws" || p === "nova" || p === "titan") return "amazon";
  if (p === "meta" || p === "meta-llama" || p === "llama") return "meta-llama";
  if (p === "poolside" || p === "laguna") return "poolside";
  if (p === "kimi" || p === "moonshot" || p === "moonshotai") return "moonshotai";
  if (p === "01-ai" || p === "yi") return "01-ai";
  if (p === "microsoft" || p === "azure") return "azure";
  if (p === "together" || p === "togetherai") return "togetherai";
  if (p === "fireworks" || p === "fireworks-ai") return "fireworks-ai";
  if (p === "stability" || p === "stability-ai" || p === "stabilityai") return "stability-ai";
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
  return (
    <img
      {...props}
      alt={`${provider} logo`}
      className={cn("size-4 dark:invert", className)}
      height={16}
      onError={(event) => {
        const img = event.currentTarget;
        if (img.dataset.logoFallbackApplied) {
          return;
        }
        img.dataset.logoFallbackApplied = "true";
        img.src = starLogoDataUri();
        img.style.filter = "none";
      }}
      src={`https://models.dev/logos/${normalized}.svg`}
      width={16}
    />
  );
};

export type ModelSelectorLogoGroupProps = ComponentProps<"div">;

export const ModelSelectorLogoGroup = ({
  className,
  ...props
}: ModelSelectorLogoGroupProps) => (
  <div
    className={cn(
      "flex shrink-0 items-center -space-x-1 [&>img]:rounded-full [&>img]:p-px [&>img]:ring-1 [&>img]:ring-border/30",
      className
    )}
    {...props}
  />
);

export type ModelSelectorNameProps = ComponentProps<"span">;

export const ModelSelectorName = ({
  className,
  ...props
}: ModelSelectorNameProps) => (
  <span className={cn("flex-1 truncate text-left", className)} {...props} />
);
