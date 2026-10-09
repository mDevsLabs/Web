"use client";

/** Port DOM de la navigation App.tsx d'OpenMuse : les vues métier gardent leurs adaptateurs mAI. */
import {
  LightbulbIcon as Lightbulb,
  MessageCircleIcon as MessageCircle,
  PanelsTopLeftIcon as PanelsTopLeft,
  ShapesIcon as Shapes,
  SquareCheckIcon as SquareCheck,
} from "@mdevs/icons";
import { Button } from "@mdevs/ui/primitives/button";
export type WakiesSection =
  | "chat"
  | "tasks"
  | "ideas"
  | "goals"
  | "apps"
  | "memories"
  | "space";
const sections = [
  { icon: MessageCircle, id: "chat", label: "Conversation" },
  { icon: PanelsTopLeft, id: "tasks", label: "Activité" },
  { icon: Lightbulb, id: "ideas", label: "Idées" },
  { icon: SquareCheck, id: "goals", label: "Objectifs" },
  { icon: Shapes, id: "apps", label: "Applications" },
] as const;
export function WorkspaceNavigation({
  section,
  onSelect,
}: {
  section: WakiesSection;
  onSelect: (section: WakiesSection) => void;
}) {
  return (
    <nav aria-label="Vues de Wakies" className="muse-navigation">
      {sections.map(({ id, label, icon: Icon }) => (
        <Button
          aria-current={section === id ? "page" : undefined}
          aria-label={label}
          data-active={section === id}
          key={id}
          onClick={() => onSelect(id)}
          type="button"
          variant="ghost"
        >
          <Icon aria-hidden="true" size={22} strokeWidth={1.8} />
          <span>{label}</span>
        </Button>
      ))}
    </nav>
  );
}
