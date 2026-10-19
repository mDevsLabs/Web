/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — BOOK ICONS (src/components/common/bookIcons.ts)
 * Icônes lucide disponibles pour personnaliser les Livres de Vibe préférées.
 * ============================================================================
 */

import type { ComponentType, SVGProps } from 'react';
import { BookHeartIcon as BookHeart, BookMarkedIcon as BookMarked, BookOpenIcon as BookOpen, BookmarkIcon as Bookmark, HeartIcon as Heart, StarIcon as Star, SparklesIcon as Sparkles, MusicIcon as Music, FilmIcon as Film, CameraIcon as Camera, CoffeeIcon as Coffee, Flower2Icon as Flower2, MoonIcon as Moon, SunIcon as Sun, CloudIcon as Cloud, FlameIcon as Flame, ZapIcon as Zap, RocketIcon as Rocket, TrophyIcon as Trophy, Gamepad2Icon as Gamepad2, GraduationCapIcon as GraduationCap, BriefcaseIcon as Briefcase, PlaneIcon as Plane, MapPinIcon as MapPin, CatIcon as Cat, DogIcon as Dog, PizzaIcon as Pizza, PaletteIcon as Palette, FeatherIcon as Feather, GemIcon as Gem, LibraryIcon as Library, PenLineIcon as PenLine } from "@mdevs/icons";

export type BookIconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export const BOOK_ICON_OPTIONS: { name: string; Component: BookIconComponent }[] = [
  { name: 'BookHeart', Component: BookHeart },
  { name: 'BookMarked', Component: BookMarked },
  { name: 'BookOpen', Component: BookOpen },
  { name: 'Bookmark', Component: Bookmark },
  { name: 'Heart', Component: Heart },
  { name: 'Star', Component: Star },
  { name: 'Sparkles', Component: Sparkles },
  { name: 'Music', Component: Music },
  { name: 'Film', Component: Film },
  { name: 'Camera', Component: Camera },
  { name: 'Coffee', Component: Coffee },
  { name: 'Flower2', Component: Flower2 },
  { name: 'Moon', Component: Moon },
  { name: 'Sun', Component: Sun },
  { name: 'Cloud', Component: Cloud },
  { name: 'Flame', Component: Flame },
  { name: 'Zap', Component: Zap },
  { name: 'Rocket', Component: Rocket },
  { name: 'Trophy', Component: Trophy },
  { name: 'Gamepad2', Component: Gamepad2 },
  { name: 'GraduationCap', Component: GraduationCap },
  { name: 'Briefcase', Component: Briefcase },
  { name: 'Plane', Component: Plane },
  { name: 'MapPin', Component: MapPin },
  { name: 'Cat', Component: Cat },
  { name: 'Dog', Component: Dog },
  { name: 'Pizza', Component: Pizza },
  { name: 'Palette', Component: Palette },
  { name: 'Feather', Component: Feather },
  { name: 'Gem', Component: Gem },
  { name: 'Library', Component: Library },
  { name: 'PenLine', Component: PenLine },
];

/** Retourne le composant lucide correspondant à un nom d'icône stocké. */
export function getBookIcon(name: string): BookIconComponent {
  return BOOK_ICON_OPTIONS.find((o) => o.name === name)?.Component || BookHeart;
}
