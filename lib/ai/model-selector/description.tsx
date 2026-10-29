"use client";

/**
 * Rendu Markdown des descriptions de modèles.
 *
 * Les descriptions viennent du catalogue des fournisseurs : elles sont écrites
 * en Markdown et affichées telles quelles. Sans moteur Markdown, le texte
 *-affichait sa syntaxe brute — `[Poolside](<https://poolside.ai/>)` —
 * ce qui est illisible et masque le lien.
 *
 * On réutilise `streamdown`, le moteur déjà en place dans l'hôte (chat,
 * recherche, Wakies) : un seul moteur Markdown dans l'application, donc une
 * seule grammaire, un seul traitement des liens.
 *
 * Deux modes :
 *
 * - `compact` : une seule ligne, dans la liste du sélecteur. Tous les
 *   éléments de bloc sont rendus en ligne, sinon le texte passerait à la
 *   ligne et la ligne de la liste éclaterait sa hauteur.
 * - complet : le panneau de détails, avec les blocs habituels.
 */

import type { ComponentProps, ReactNode } from "react";
import {
  type Components,
  type ExtraProps,
  Streamdown,
  type UrlTransform,
} from "streamdown";
import { cn } from "@/lib/utils";

/**
 * Neutralise les schémas d'URL dangereux.
 *
 * La description vient d'un tiers. Seuls `http`, `https` et `mailto` sont
 * acceptés, plus les adresses internes (`/…`, `#…`).
 */
const safeUrlTransform: UrlTransform = (url) => {
  const valeur = String(url ?? "").trim();
  if (valeur.startsWith("/") || valeur.startsWith("#")) {
    return valeur;
  }
  try {
    const analysee = new URL(valeur);
    if (["http:", "https:", "mailto:"].includes(analysee.protocol)) {
      return valeur;
    }
  } catch {
    // URL relative non résolue : ce n'est pas une cible navigable.
  }
  return null;
};

/**
 * Propriétés que le moteur transmet à un composant de rendu.
 *
 * Le moteur ajoute `node` (l'élément AST) aux propriétés natives de la
 * balise. Un composant de rendu doit accepter les deux.
 */
type PropsBloc = { children?: ReactNode } & ExtraProps;
type PropsLien = ComponentProps<"a"> & ExtraProps;

/**
 * Un lien, stoppé à la propagation.
 *
 * La description vit dans une ligne de `CommandItem` : sans cette
 * interruption, cliquer un lien sélectionnerait le modèle au lieu de
 * l'ouvrir.
 */
const Lien = ({
  children,
  className,
  href,
  node: _node,
  onClick,
  ...props
}: PropsLien) => (
  <a
    className={cn("font-medium text-primary underline", className)}
    href={href}
    onClick={(event) => {
      event.stopPropagation();
      onClick?.(event);
    }}
    rel="noopener noreferrer"
    target="_blank"
    {...props}
  >
    {children}
  </a>
);

/** Rend un bloc Markdown comme un fragment en ligne. */
const EnLigne = ({ children }: PropsBloc) => <span>{children}</span>;

/**
 * Éléments de bloc rendus en ligne.
 *
 * Sans cette table, un `<p>` dans la description ouvrait une nouvelle ligne
 * dans la liste du sélecteur.
 */
const composantsEnLigne: Components = {
  a: Lien,
  blockquote: EnLigne,
  h1: EnLigne,
  h2: EnLigne,
  h3: EnLigne,
  h4: EnLigne,
  h5: EnLigne,
  h6: EnLigne,
  hr: EnLigne,
  li: EnLigne,
  ol: EnLigne,
  p: EnLigne,
  pre: EnLigne,
  table: EnLigne,
  tbody: EnLigne,
  td: EnLigne,
  tfoot: EnLigne,
  th: EnLigne,
  thead: EnLigne,
  tr: EnLigne,
  ul: EnLigne,
};

/** Éléments de bloc rendus normalement (panneau de détails). */
const composantsBlocs: Components = {
  a: Lien,
};

export type ModelDescriptionProps = {
  /** Texte Markdown de la description. */
  children: string;
  /** Rendu sur une seule ligne, dans la liste du sélecteur. */
  compact?: boolean;
  /**
   * Classes du conteneur.
   *
   * La couleur des liens se règle ici, avec une variante de descendant
   * (`[&_a]:text-info`) : le moteur impose sa propre classe sur le lien,
   * une classe directe serait écrasée.
   */
  className?: string;
};

export function ModelDescription({
  children,
  compact = false,
  className,
}: ModelDescriptionProps) {
  if (!children) {
    return null;
  }

  return (
    <div
      className={cn(
        compact ? "line-clamp-1" : "line-clamp-3",
        "[&_a]:font-medium [&_a]:underline",
        className
      )}
    >
      <Streamdown
        className={compact ? "inline" : undefined}
        components={compact ? composantsEnLigne : composantsBlocs}
        // Sans ce réglage, Streamdown transforme chaque lien en bouton et
        // ouvre une modale de confirmation : dans une ligne de liste, le
        // bouton déclencherait la sélection du modèle.
        linkSafety={{ enabled: false }}
        mode="static"
        urlTransform={safeUrlTransform}
      >
        {children}
      </Streamdown>
    </div>
  );
}
