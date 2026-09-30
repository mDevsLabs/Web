"use client";

import { EraserIcon, PlusIcon, WandIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Constructeur d'instructions système.
//
// Le champ libre est le contrat : c'est lui qui part dans le prompt, et il doit
// rester éditable comme tel. Le constructeur n'ajoute rien au texte de
// l'utilisateur — il produit un BROUILLON à partir de six dimensions qui
// manquaient presque toujours, et le lui rend en un clic.
//
// Pourquoi six dimensions et pas une liste d'archétypes : un archétype fige le
// rôle, le ton, la longueur et les interdits d'un coup, et l'utilisateur passe
// son temps à deleter ce qui ne lui sert pas. Ici chaque dimension est
// indépendante, et une phrase absente est une phrase qu'on n'a pas eu à
// supprimer.
//
// Les sélections vivent dans un état séparé du texte : le brouillon est DÉRIVÉ
// d'elles, jamais écrit dans le textarea. Un clic sur « Effacer » revient donc
// en arrière sans给对方, et une retouche manuelle du texte n'est jamais écrasée
// par un recalcul.

type BuilderDimension = {
  /** Les options, dans l'ordre d'une lecture naturelle. */
  options: { label: string; value: string }[];
  /** Comment la phrase est introduite dans le brouillon. */
  render: (value: string) => string;
  /** Intitulé du bloc dans l'interface. */
  title: string;
};

const DIMENSIONS: BuilderDimension[] = [
  {
    options: [
      { label: "Assistant général", value: "un assistant généraliste" },
      { label: "Développeur", value: "un développeur logiciel expérimenté" },
      { label: "Analyste de données", value: "un analyste de données" },
      { label: "Rédacteur", value: "un rédacteur professionnel" },
      { label: "Traducteur", value: "un traducteur" },
      { label: "Juriste", value: "un juriste" },
      { label: "Enseignant", value: "un pédagogue" },
      { label: "Conseiller", value: "un conseiller" },
    ],
    render: (value) => `Tu es ${value}.`,
    title: "Rôle & expertise",
  },
  {
    options: [
      { label: "Direct", value: "Direct et factuel, sans préambule." },
      {
        label: "Pédagogique",
        value: "Pédagogique : explique avant de conclure.",
      },
      { label: "Professionnel", value: "Professionnel et courtois." },
      { label: "Conversationnel", value: "Conversationnel, tutoiement exclu." },
      {
        label: "Technique",
        value: "Technique et précis, vocabulaire du métier.",
      },
    ],
    render: (value) => value,
    title: "Ton",
  },
  {
    options: [
      {
        label: "Concis",
        value: "Réponds en quelques lignes, sans remplissage.",
      },
      { label: "Standard", value: "Va à l'essentiel, en paragraphs courts." },
      { label: "Détaillé", value: "Développe : contexte, méthode, exemple." },
      { label: "Complet", value: "Sois exhaustif et structure ta réponse." },
    ],
    render: (value) => value,
    title: "Longueur",
  },
  {
    options: [
      {
        label: "Pas d'affirmation sans source",
        value: "N'affirme rien que tu ne puisses justifier.",
      },
      {
        label: "Dis quand tu ne sais pas",
        value: "Dis explicitement quand tu ne sais pas ou quand tu supposes.",
      },
      {
        label: "Demande ce qui manque",
        value: "Demande la précision manquante au lieu de l'inventer.",
      },
      {
        label: "Cite les fichiers utilisés",
        value: "Cite les fichiers et sources que tu as réellement consultés.",
      },
    ],
    render: (value) => value,
    title: "Contraintes",
  },
  {
    options: [
      {
        label: "Pas d'invention",
        value: "N'invente jamais de fait, de chiffre, de citation ou de lien.",
      },
      {
        label: "Pas de remplissage",
        value:
          "Ne remplis pas avec des généralités pour atteindre une longueur.",
      },
      {
        label: "Pas d'excuse d'IA",
        value: "Ne commente pas ta propre nature et ne Supplies pas d'excuse.",
      },
    ],
    render: (value) => value,
    title: "Interdits",
  },
  {
    options: [
      {
        label: "Liste à puces",
        value: "Utilise des listes à puces quand tu enumeres.",
      },
      {
        label: "Markdown",
        value: "Formate en Markdown (titres, listes, gras).",
      },
      {
        label: "Titres de section",
        value: "Structure avec des titres de section.",
      },
      {
        label: "Phrases courtes",
        value: "Rédige en phrases courtes, une idée par phrase.",
      },
    ],
    render: (value) => value,
    title: "Format de sortie",
  },
];

export const INSTRUCTIONS_MAX_LENGTH = 5000;

function composeDraft(
  selections: Record<string, string>,
  dimensions: BuilderDimension[]
): string {
  return dimensions
    .map((dimension) => {
      const value = selections[dimension.title];
      return value ? dimension.render(value) : null;
    })
    .filter((line): line is string => Boolean(line))
    .join("\n\n");
}

export function InstructionBuilder({
  onChange,
  value,
}: {
  onChange: (next: string) => void;
  /** Texte courant du champ : sert à ne pas écraser une retouche manuelle. */
  value: string;
}) {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [isOpen, setIsOpen] = useState(false);

  const draft = useMemo(
    () => composeDraft(selections, DIMENSIONS),
    [selections]
  );

  const toggle = useCallback((title: string, option: string) => {
    setSelections((current) => {
      const next = { ...current };
      if (next[title] === option) {
        delete next[title];
      } else {
        next[title] = option;
      }
      return next;
    });
  }, []);

  /**
   * Écrit le brouillon en refusant de déborder, plutôt que de tronquer en
   * silence : une instruction coupée en milieu de phrase est une consigne
   * fausse, et l'utilisateur ne verrait pas pourquoi le bot se comporte mal.
   */
  const apply = useCallback(
    (mode: "append" | "replace") => {
      if (!draft) {
        toast.info("Choisissez au moins une option.");
        return;
      }
      const next =
        mode === "replace" || !value.trim()
          ? draft
          : `${value.trim()}\n\n${draft}`;
      if (next.length > INSTRUCTIONS_MAX_LENGTH) {
        toast.error(
          `Ce brouillon ferait ${next.length} caractères, au-delà des ${INSTRUCTIONS_MAX_LENGTH} autorisés. Raccourcis les instructions actuelles.`
        );
        return;
      }
      onChange(next);
    },
    [draft, onChange, value]
  );

  return (
    <div className="space-y-2 rounded-xl border border-border/50 bg-muted/20 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <button
          className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold"
          onClick={() => setIsOpen((open) => !open)}
          type="button"
        >
          <WandIcon className="size-3.5" />
          Construire les instructions
        </button>
        {isOpen ? (
          <div className="flex items-center gap-1">
            <button
              className="flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => {
                setSelections({});
                onChange("");
              }}
              type="button"
            >
              <EraserIcon className="size-3" />
              Effacer
            </button>
            <button
              className="flex cursor-pointer items-center gap-1 rounded-md border border-border/60 px-1.5 py-0.5 text-[11px] transition-colors hover:text-foreground"
              disabled={!draft}
              onClick={() => apply("append")}
              type="button"
            >
              <PlusIcon className="size-3" />
              Ajouter
            </button>
            <button
              className="cursor-pointer rounded-md border border-border/60 px-1.5 py-0.5 text-[11px] font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!draft}
              onClick={() => apply("replace")}
              type="button"
            >
              Composer
            </button>
          </div>
        ) : null}
      </div>

      {isOpen ? (
        <div className="space-y-2.5">
          {DIMENSIONS.map((dimension) => (
            <div className="space-y-1.5" key={dimension.title}>
              <p className="text-[11px] font-medium text-muted-foreground">
                {dimension.title}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {dimension.options.map((option) => (
                  <button
                    className="chip"
                    data-active={
                      selections[dimension.title] === option.value || undefined
                    }
                    key={option.value}
                    onClick={() => toggle(dimension.title, option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <p
            className={cn(
              "text-[11px] leading-relaxed",
              draft ? "text-muted-foreground" : "text-muted-foreground/70"
            )}
          >
            {draft
              ? "Le brouillon est assemblé à partir de vos choix, pas écrit dans le champ : vous pouvez encore le modifier à la main."
              : "Choisissez au moins une option pour composer un brouillon."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
