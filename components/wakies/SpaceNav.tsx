"use client";

import {
  ChevronRightIcon as ChevronRight,
  FileTextIcon as FileText,
  FolderIcon as Folder,
} from "@mdevs/icons";
import { useEffect, useState } from "react";
import { api } from "@/components/wakies/api";
import {
  type EspaceMenuAction,
  SpaceMenu,
} from "@/components/wakies/SpaceMenu";
import type { Page } from "@/lib/wakies/pages";
import type { Space } from "@/lib/wakies/shared/types";

/**
 * Une ligne d'Espace dans le rail : ouverture, arborescence de pages, et le
 * menu « … » (renommer, épingler, exporter, supprimer).
 *
 * Deux erreurs distinctes, deux états distincts : la lecture des pages échoue
 * en silence derrière une flèche repliée, alors qu'une action refusée doit être
 * vue tout de suite, que la flèche soit ouverte ou non.
 */

type FormatExport = "json" | "md" | "zip";

/**
 * Télécharge une exportation produite par le serveur.
 *
 * Le fichier est assemblé côté API (`/api/wakies/spaces/:id/export`) : les
 * pages d'un Espace ne sont chargées dans le rail que quand sa flèche est
 * ouverte, et reconstituer l'arborescence depuis ce que l'interface a sous la
 * main produirait un export partiel sans que rien le signale.
 */
async function telechargerExport(
  spaceId: string,
  format: FormatExport,
  nom: string
): Promise<void> {
  const reponse = await fetch(
    `/api/wakies/spaces/${encodeURIComponent(spaceId)}/export?format=${format}`,
    { credentials: "same-origin" }
  );
  if (!reponse.ok) {
    const donnees = (await reponse.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(
      donnees?.message ?? "Export impossible. Réessayez dans un instant."
    );
  }
  const extension = format === "md" ? "md" : format;
  const lien = document.createElement("a");
  const url = URL.createObjectURL(await reponse.blob());
  lien.href = url;
  lien.download = `${nom.replace(/[^\p{L}\p{N} -]/gu, "").slice(0, 60) || "espace"}.${extension}`;
  lien.click();
  URL.revokeObjectURL(url);
}

export function SpaceNav({
  active,
  onOpen,
  pageId,
  space,
  onChanged,
  onSupprime,
}: {
  active: boolean;
  onOpen: (pageId?: string) => void;
  pageId?: string;
  space: Space;
  /** L'espace a changé de nom ou d'épingle : le parent relit la liste. */
  onChanged: () => void | Promise<void>;
  /** L'espace a été supprimé : le parent doit en sortir, il ne peut plus l'afficher. */
  onSupprime?: (spaceId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [pages, setPages] = useState<Page[]>([]);
  const [erreurPages, setErreurPages] = useState("");
  const [erreur, setErreur] = useState("");
  const [renomme, setRenomme] = useState(false);
  const [titre, setTitre] = useState(space.name);

  useEffect(() => {
    if (!expanded) return;
    let current = true;
    const load = async () => {
      try {
        const next = await api<Page[]>(`/spaces/${space.id}/pages`);
        if (current) {
          setPages(next);
          setErreurPages("");
        }
      } catch {
        if (current) setErreurPages("Impossible de charger les pages.");
      }
    };
    void load();
    const timer = setInterval(() => void load(), 3000);
    return () => {
      current = false;
      clearInterval(timer);
    };
  }, [expanded, space.id]);

  // Un renommage refusé doit rendre l'ancien nom : laisser le champ sur un nom
  // que la base n'a pas accepté ferait croire qu'il est enregistré.
  useEffect(() => {
    setTitre(space.name);
  }, [space.name]);

  const signaler = (erreurRecue: unknown, defaut: string) => {
    setErreur(erreurRecue instanceof Error ? erreurRecue.message : defaut);
  };

  const enregistrerNom = async () => {
    setRenomme(false);
    const nouveau = titre.trim();
    // Rien de tapé n'est une modification : sans ce garde, sortir du champ sans
    // rien changer réécrirait le nom à l'identique et pousserait `updatedAt`,
    // ce qui ferait remonter l'Espace dans la liste pour rien.
    if (!nouveau || nouveau === space.name) {
      setTitre(space.name);
      return;
    }
    try {
      await api<Space>(`/spaces/${space.id}`, "PATCH", { name: nouveau });
      setErreur("");
      await onChanged();
    } catch (erreurRecue) {
      setTitre(space.name);
      signaler(erreurRecue, "Renommage impossible.");
    }
  };

  const epingler = async () => {
    try {
      await api<Space>(`/spaces/${space.id}`, "PATCH", {
        pinned: !space.pinned,
      });
      setErreur("");
      await onChanged();
    } catch (erreurRecue) {
      signaler(erreurRecue, "Épingle impossible.");
    }
  };

  const exporter = async (format: FormatExport) => {
    try {
      await telechargerExport(space.id, format, space.name);
      setErreur("");
    } catch (erreurRecue) {
      signaler(erreurRecue, "Export impossible.");
    }
  };

  const supprimer = async () => {
    // Le nombre de pages vient du serveur : la flèche du rail n'a pas
    // forcément chargé la liste, et annoncer « 0 page » avant d'en détruire
    // trente serait un mensonge dans la seule phrase qui précède l'irréversible.
    let texte = `Supprimer « ${space.name} » ? Ses pages seront supprimées avec lui. Cette action est irréversible.`;
    try {
      const detail = await api<{ pageCount: number | null }>(
        `/spaces/${space.id}`
      );
      if (typeof detail.pageCount === "number") {
        texte = `Supprimer « ${space.name} » et ses ${detail.pageCount} page(s) ? Les Wakies et les conversations survivent. Cette action est irréversible.`;
      }
    } catch (erreurRecue) {
      // Sans comptage fiable, on ne propose pas une confirmation qui ment.
      signaler(erreurRecue, "Comptage des pages impossible.");
      return;
    }
    if (!window.confirm(texte)) {
      return;
    }
    try {
      await api(`/spaces/${space.id}`, "DELETE");
      setErreur("");
      onSupprime?.(space.id);
      await onChanged();
    } catch (erreurRecue) {
      signaler(erreurRecue, "Suppression impossible.");
    }
  };

  const actions: EspaceMenuAction[] = [
    {
      id: "renommer",
      kind: "action",
      label: "Renommer",
      onSelect: () => {
        setTitre(space.name);
        setRenomme(true);
      },
    },
    {
      id: "epingle",
      kind: "action",
      label: space.pinned ? "Désépingler" : "Épingler",
      onSelect: () => void epingler(),
    },
    {
      id: "exporter",
      kind: "groupe",
      label: "Exporter",
      options: [
        {
          id: "md",
          label: "Tout en Markdown",
          onSelect: () => void exporter("md"),
        },
        {
          id: "json",
          label: "Sauvegarde en JSON",
          onSelect: () => void exporter("json"),
        },
        {
          id: "zip",
          label: "Archive ZIP",
          onSelect: () => void exporter("zip"),
        },
      ],
    },
    {
      danger: true,
      id: "supprimer",
      kind: "action",
      label: "Supprimer",
      onSelect: () => void supprimer(),
    },
  ];

  const branches = (parentId: string | null, depth = 0): React.ReactNode =>
    pages
      .filter((page) => page.parentId === parentId)
      .map((page) => (
        <div key={page.id}>
          <button
            aria-current={active && pageId === page.id ? "page" : undefined}
            className={`nav-item space-page-link ${active && pageId === page.id ? "active" : ""}`}
            onClick={() => onOpen(page.id)}
            style={{ paddingLeft: 28 + depth * 12 }}
          >
            <FileText size={14} />
            <span>{page.title}</span>
          </button>
          {branches(page.id, depth + 1)}
        </div>
      ));

  return (
    <div className="space-nav-group">
      <div className="space-nav-row">
        <button
          aria-controls={`space-pages-${space.id}`}
          aria-expanded={expanded}
          aria-label={`${expanded ? "Replier" : "Déplier"} ${space.name}`}
          className="icon-button space-disclosure"
          onClick={() => setExpanded(!expanded)}
        >
          <ChevronRight
            size={13}
            style={{ transform: expanded ? "rotate(90deg)" : undefined }}
          />
        </button>
        {renomme ? (
          <input
            aria-label={`Nouveau nom de ${space.name}`}
            autoFocus
            className="space-rename"
            maxLength={60}
            onBlur={() => void enregistrerNom()}
            onChange={(event) => setTitre(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void enregistrerNom();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                setTitre(space.name);
                setRenomme(false);
              }
            }}
            value={titre}
          />
        ) : (
          <button
            aria-current={active && !pageId ? "page" : undefined}
            className={`nav-item ${active && !pageId ? "active" : ""}`}
            onClick={() => onOpen()}
            onDoubleClick={() => {
              setTitre(space.name);
              setRenomme(true);
            }}
          >
            <Folder size={16} />
            <span>{space.name}</span>
            {space.pinned ? (
              <span aria-hidden="true" className="space-pin-mark">
                •
              </span>
            ) : null}
          </button>
        )}
        <SpaceMenu actions={actions} libelle={space.name} />
      </div>
      {erreur ? (
        <p className="sidebar-error" role="status">
          {erreur}
        </p>
      ) : null}
      {expanded && (
        <div id={`space-pages-${space.id}`}>
          {erreurPages ? (
            <p className="sidebar-error" role="status">
              {erreurPages}
            </p>
          ) : (
            branches(null)
          )}
          {!erreurPages && !pages.length && (
            <p className="sidebar-empty">Aucune page pour l’instant</p>
          )}
        </div>
      )}
    </div>
  );
}
