/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — BOOK ICONS (src/components/common/bookIcons.ts)
 * Icônes lucide disponibles pour personnaliser les Livres de Vibe préférées.
 * ============================================================================
 */

import {
  BookHeart,
  BookMarked,
  Bookmark,
  BookOpen,
  Briefcase,
  Camera,
  Cat,
  Cloud,
  Coffee,
  Dog,
  Feather,
  Film,
  Flame,
  Flower2,
  Gamepad2,
  Gem,
  GraduationCap,
  Heart,
  Library,
  MapPin,
  Moon,
  Music,
  Palette,
  PenLine,
  Pizza,
  Plane,
  Rocket,
  Sparkles,
  Star,
  Sun,
  Trophy,
  Zap,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

export type BookIconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export const BOOK_ICON_OPTIONS: {
  name: string;
  Component: BookIconComponent;
}[] = [
  { Component: BookHeart, name: "BookHeart" },
  { Component: BookMarked, name: "BookMarked" },
  { Component: BookOpen, name: "BookOpen" },
  { Component: Bookmark, name: "Bookmark" },
  { Component: Heart, name: "Heart" },
  { Component: Star, name: "Star" },
  { Component: Sparkles, name: "Sparkles" },
  { Component: Music, name: "Music" },
  { Component: Film, name: "Film" },
  { Component: Camera, name: "Camera" },
  { Component: Coffee, name: "Coffee" },
  { Component: Flower2, name: "Flower2" },
  { Component: Moon, name: "Moon" },
  { Component: Sun, name: "Sun" },
  { Component: Cloud, name: "Cloud" },
  { Component: Flame, name: "Flame" },
  { Component: Zap, name: "Zap" },
  { Component: Rocket, name: "Rocket" },
  { Component: Trophy, name: "Trophy" },
  { Component: Gamepad2, name: "Gamepad2" },
  { Component: GraduationCap, name: "GraduationCap" },
  { Component: Briefcase, name: "Briefcase" },
  { Component: Plane, name: "Plane" },
  { Component: MapPin, name: "MapPin" },
  { Component: Cat, name: "Cat" },
  { Component: Dog, name: "Dog" },
  { Component: Pizza, name: "Pizza" },
  { Component: Palette, name: "Palette" },
  { Component: Feather, name: "Feather" },
  { Component: Gem, name: "Gem" },
  { Component: Library, name: "Library" },
  { Component: PenLine, name: "PenLine" },
];

/** Retourne le composant lucide correspondant à un nom d'icône stocké. */
export function getBookIcon(name: string): BookIconComponent {
  return BOOK_ICON_OPTIONS.find((o) => o.name === name)?.Component || BookHeart;
}
