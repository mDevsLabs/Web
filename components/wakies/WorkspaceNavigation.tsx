"use client";

/**
 * Navigation principale de Wakies : MESSAGERIE D'ABORD.
 *
 * L'ordre est le produit, pas une décoration. Wakies est une messagerie
 * d'intelligences artificielles : les trois premières entrées sont donc ce
 * qu'on y fait — parler (Messages), trouver des Wakies (Amis), dire qui l'on
 * est (Mon profil). Le reste — Activité, Objectifs, Travail, Aujourd'hui,
 * Mémoires — est l'espace de travail, sous un intitulé
 * explicite, et n'est plus ce qu'on voit en premier.
 *
 * « Idées » a disparu de cette liste : le moteur de suggestions d'OpenMuse
 * n'est pas branché, et une entrée de navigation qui n'ouvre sur rien est un
 * mensonge d'interface. L'écran reste dans le code, l'entrée n'est plus
 * proposée.
 *
 * Les classes CSS internes (`muse-*`) sont conservées : elles n'apparaissent
 * pas dans l'interface, et les renommer toucherait des milliers de règles
 * d'une feuille GÉNÉRÉE pour aucun gain visible.
 */

import {
  type ActivityIcon,
  BookOpenIcon,
  FolderIcon,
  ListChecksIcon,
  MessageCircleIcon,
  SquareCheckIcon,
  SunIcon,
  UserIcon,
  UsersIcon,
} from "@mdevs/icons";
import { Button } from "@mdevs/ui/primitives/button";
import { Fragment } from "react";

export type WakiesSection =
  | "today"
  | "chat"
  | "amis"
  | "profil"
  | "tasks"
  | "ideas"
  | "goals"
  | "memories"
  | "space";

/**
 * L'ordre du tableau EST l'ordre affiché, et `groupe` insère l'intitulé qui
 * sépare la messagerie du reste. « ideas » n'y figure pas (voir l'en-tête).
 */
const sections: ReadonlyArray<{
  groupe: "messagerie" | "travail";
  icon: typeof ActivityIcon;
  id: WakiesSection;
  label: string;
}> = [
  {
    groupe: "messagerie",
    icon: MessageCircleIcon,
    id: "chat",
    label: "Messages",
  },
  { groupe: "messagerie", icon: UsersIcon, id: "amis", label: "Amis" },
  { groupe: "messagerie", icon: UserIcon, id: "profil", label: "Mon profil" },
  { groupe: "travail", icon: ListChecksIcon, id: "tasks", label: "Activité" },
  { groupe: "travail", icon: SquareCheckIcon, id: "goals", label: "Objectifs" },
  { groupe: "travail", icon: FolderIcon, id: "space", label: "Travail" },
  { groupe: "travail", icon: SunIcon, id: "today", label: "Aujourd’hui" },
  { groupe: "travail", icon: BookOpenIcon, id: "memories", label: "Mémoires" },
];

export function WorkspaceNavigation({
  onSelect,
  section,
}: {
  onSelect: (section: WakiesSection) => void;
  section: WakiesSection;
}) {
  return (
    <nav aria-label="Vues de Wakies" className="muse-navigation">
      {sections.map(({ groupe, icon: Icon, id, label }, index) => (
        <Fragment key={id}>
          {groupe === "travail" &&
          sections[index - 1]?.groupe === "messagerie" ? (
            <p className="nav-label">Espace de travail</p>
          ) : null}
          <Button
            aria-current={section === id ? "page" : undefined}
            aria-label={label}
            data-active={section === id}
            onClick={() => onSelect(id)}
            type="button"
            variant="ghost"
          >
            <Icon aria-hidden="true" size={22} strokeWidth={1.8} />
            <span>{label}</span>
          </Button>
        </Fragment>
      ))}
    </nav>
  );
}
