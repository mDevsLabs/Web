/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — BOOK ICONS (src/components/common/bookIcons.ts)
 * Icônes lucide disponibles pour personnaliser les Livres de Vibe préférées.
 * ============================================================================
 */

import { BookHeartIcon as BookHeart, BookMarkedIcon as BookMarked, BookmarkIcon as Bookmark, BookOpenIcon as BookOpen, BriefcaseIcon as Briefcase, CameraIcon as Camera, CatIcon as Cat, CloudIcon as Cloud, CoffeeIcon as Coffee, DogIcon as Dog, FeatherIcon as Feather, FilmIcon as Film, FlameIcon as Flame, Flower2Icon as Flower2, Gamepad2Icon as Gamepad2, GemIcon as Gem, GraduationCapIcon as GraduationCap, HeartIcon as Heart, LibraryIcon as Library, MapPinIcon as MapPin, MoonIcon as Moon, MusicIcon as Music, PaletteIcon as Palette, PenLineIcon as PenLine, PizzaIcon as Pizza, PlaneIcon as Plane, RocketIcon as Rocket, SparklesIcon as Sparkles, StarIcon as Star, SunIcon as Sun, TrophyIcon as Trophy, ZapIcon as Zap } from "@mdevs/icons";
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
