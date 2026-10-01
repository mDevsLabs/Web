"use client";

import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  FileCodeIcon,
  ImageDownIcon,
  Share2Icon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  buildStatsPoster,
  describeFilters,
  posterFilename,
} from "@/lib/stats/poster";
import {
  canShareFiles,
  copyPosterToClipboard,
  downloadPosterPng,
  downloadPosterSvg,
  renderPosterPng,
  sharePoster,
} from "@/lib/stats/poster-export";
import {
  STATS_PERIOD_LABELS,
  type StatsKind,
  type UsageStats,
} from "@/lib/stats/stats-types";

// Barre d'export et de partage de l'affiche.
//
// Le thème suit l'application au moment du clic (choix explicite) : l'affiche
// publiée doit ressembler à ce que l'utilisateur vient de regarder. L'image
// porte ses couleurs en littéral, donc une conversion de thème est un simple
// choix de palette — pas une relecture du DOM.
//
// Les boutons sont désactivés tant que les données ne sont pas chargées, et
// pendant une génération : sans cela, deux clics rapides lanceraient deux
// rasterisations concurrentes et l'utilisateur pourrait obtenir deux fichiers
// différents de la même vue.

type Props = {
  /** Types de contenu visibles : l'affiche ne trace que les courbes affichées. */
  visibleKinds: StatsKind[];
  stats: UsageStats;
};

type Action = "copy" | "png" | "share" | "svg";

export function StatsShareBar({ stats, visibleKinds }: Props) {
  const { resolvedTheme } = useTheme();
  const [busy, setBusy] = useState<Action | null>(null);
  const [copied, setCopied] = useState(false);

  // `resolvedTheme` est `undefined` pendant l'hydratation serveur : on ne peut
  // pas alors figer une palette. Le rendu est donc neutralisé jusqu'à la
  // résolution, ce qui évite d'émettre un PNG au thème clair sur une session
  // sombre (le fichier resterait correct, mais incohérent avec l'écran).
  const theme = resolvedTheme === "dark" ? "dark" : "light";
  const themeResolved = resolvedTheme !== undefined;

  const build = useCallback(
    () =>
      buildStatsPoster({
        filterLine: describeFilters(stats, visibleKinds),
        stats,
        theme,
        visibleKinds,
      }),
    [stats, theme, visibleKinds]
  );

  const run = useCallback(
    async (action: Action) => {
      if (!themeResolved || busy) {
        return;
      }
      setBusy(action);
      try {
        const poster = build();
        const svgName = posterFilename(stats, "svg");
        const pngName = posterFilename(stats, "png");
        const size = { height: poster.height, width: poster.width };

        if (action === "svg") {
          // Le SVG est la source : aucun rasterisation, donc aucun échec
          // possible et un fichier vectoriel parfait.
          downloadPosterSvg(poster.svg, svgName);
          toast.success("Affiche SVG téléchargée.");
          return;
        }

        if (action === "png") {
          await downloadPosterPng(poster.svg, pngName, size);
          toast.success("Image PNG téléchargée.");
          return;
        }

        const png = await renderPosterPng(poster.svg, size);

        if (action === "copy") {
          await copyPosterToClipboard(png);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          toast.success("Image copiée dans le presse-papiers.");
          return;
        }

        const outcome = await sharePoster(png, {
          filename: pngName,
          text: `Mes statistiques de consommation mAI (${
            STATS_PERIOD_LABELS[stats.period]
          }).`,
        });
        if (outcome === "unsupported") {
          // Repli plutôt qu'erreur : le bouton reste utile partout, il
          // télécharge simplement le fichier.
          downloadPosterPng(poster.svg, pngName, size);
          toast.info("Partage natif indisponible ici : image téléchargée.");
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "L'export de l'affiche a échoué."
        );
      } finally {
        setBusy(null);
      }
    },
    [build, busy, stats, themeResolved]
  );

  const disabled = !themeResolved || busy !== null;

  const buttons: {
    action: Action;
    busyLabel: string;
    icon: typeof Share2Icon;
    label: string;
    onClick: () => void;
  }[] = [
    {
      action: "share",
      busyLabel: "Préparation…",
      icon: Share2Icon,
      // Le partage natif n'est disponible que sur les navigateurs qui le
      // supportent ; ailleurs le bouton bascule en téléchargement, on ne le
      // masque donc pas.
      label: canShareFiles() ? "Partager" : "Partager / Télécharger",
      onClick: () => run("share"),
    },
    {
      action: "png",
      busyLabel: "Génération…",
      icon: ImageDownIcon,
      label: "Image PNG",
      onClick: () => run("png"),
    },
    {
      action: "svg",
      busyLabel: "Génération…",
      icon: FileCodeIcon,
      label: "SVG",
      onClick: () => run("svg"),
    },
    {
      action: "copy",
      busyLabel: "Génération…",
      icon: copied ? CheckIcon : CopyIcon,
      label: copied ? "Copié" : "Copier l'image",
      onClick: () => run("copy"),
    },
  ];

  return (
    <div className="surface-card flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-foreground">
          Partager et exporter
        </h2>
        <p className="text-[11px] text-muted-foreground">
          L'image reprend les chiffres et les filtres affichés ci-dessus, dans
          le thème clair ou sombre de l'application.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {buttons.map((button) => {
          const Icon = button.icon;
          const isBusy = busy === button.action;
          return (
            <button
              className="chip"
              data-active={isBusy}
              disabled={disabled}
              key={button.action}
              onClick={button.onClick}
              type="button"
            >
              <Icon className="size-3.5" />
              {isBusy ? button.busyLabel : button.label}
            </button>
          );
        })}
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <DownloadIcon className="size-3" />
          {theme === "dark" ? "Thème sombre" : "Thème clair"}
        </span>
      </div>
    </div>
  );
}
