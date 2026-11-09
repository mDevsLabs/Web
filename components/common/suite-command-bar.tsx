"use client";

import {
  BookOpenIcon,
  BotIcon,
  BrainIcon,
  CheckCircle2Icon,
  Code2Icon,
  CompassIcon,
  CrosshairIcon,
  FlameIcon,
  FolderKanbanIcon,
  Gamepad2Icon,
  GemIcon,
  GlobeIcon,
  GraduationCapIcon,
  HeartIcon,
  HistoryIcon,
  ImageIcon,
  LibraryIcon,
  MessageSquareIcon,
  SearchIcon,
  SettingsIcon,
  ShieldIcon,
  SparklesIcon,
  StoreIcon,
  TargetIcon,
  TrophyIcon,
  UsersIcon,
} from "@mdevs/icons";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { fetcher } from "@/lib/utils";

type ResumeQuizzlyLight = {
  gems: number;
  hearts: number;
  league: string;
  niveau: number;
  streakCount: number;
  xp: number;
};

const QUIZZLY_MATIERES = [
  {
    description: "Calcul, algèbre, géométrie, fonctions et probabilités",
    href: "/quizzly",
    id: "maths",
    name: "Mathématiques",
  },
  {
    description: "Grammaire, conjugaison, vocabulaire et littérature",
    href: "/quizzly",
    id: "francais",
    name: "Français",
  },
  {
    description: "Grandes guerres, Républiques, repères spatiaux et EMC",
    href: "/quizzly",
    id: "histoire",
    name: "Histoire-Géographie & EMC",
  },
  {
    description: "Matière, atomes, mouvements, énergie et réactions chimiques",
    href: "/quizzly",
    id: "physique",
    name: "Physique-Chimie",
  },
  {
    description: "Le vivant, la génétique, la biodiversité et le corps humain",
    href: "/quizzly",
    id: "svt",
    name: "SVT (Sciences de la Vie et de la Terre)",
  },
  {
    description: "Vocabulaire, verbes irréguliers et grammaire anglaise",
    href: "/quizzly",
    id: "anglais",
    name: "Anglais",
  },
  {
    description: "Conjugaison, vocabulaire et culture hispanique",
    href: "/quizzly",
    id: "espagnol",
    name: "Espagnol",
  },
  {
    description: "La liberté, la justice, le devoir, la raison et la vérité",
    href: "/quizzly",
    id: "philo",
    name: "Philosophie",
  },
  {
    description: "Microéconomie, sociologie, monnaie et marchés",
    href: "/quizzly",
    id: "ses",
    name: "SES (Sciences Éco & Sociales)",
  },
];

const QUIZZLY_SECTIONS = [
  {
    href: "/quizzly",
    icon: CompassIcon,
    id: "parcours",
    title: "Parcours des leçons",
  },
  {
    href: "/quizzly/synthese",
    icon: BookOpenIcon,
    id: "synthese",
    title: "Fiches de synthèse & révision",
  },
  {
    href: "/quizzly/coach",
    icon: SparklesIcon,
    id: "coach",
    title: "Coach IA Quizzly",
  },
  {
    href: "/quizzly/ligues",
    icon: TrophyIcon,
    id: "ligues",
    title: "Ligues & Classements",
  },
  {
    href: "/quizzly/quetes",
    icon: TargetIcon,
    id: "quetes",
    title: "Quêtes & Défis du jour",
  },
  {
    href: "/quizzly/boutique",
    icon: StoreIcon,
    id: "boutique",
    title: "Boutique d'XP & Boosters",
  },
  {
    href: "/quizzly/amis",
    icon: UsersIcon,
    id: "amis",
    title: "Amis & Défis partagés",
  },
  {
    href: "/quizzly/profil",
    icon: ShieldIcon,
    id: "profil",
    title: "Profil Quizzly & Badges",
  },
];

const BLACKLINE_ACTIONS = [
  {
    description: "Entrer dans l'arène FPS contre des bots d'entraînement",
    href: "/blackline",
    id: "bl-play",
    title: "Lancer une partie de Blackline (3D)",
  },
  {
    description: "Arène industrielle avec conteneurs tactiques",
    href: "/blackline",
    id: "bl-cargo",
    title: "Arène Cargo Yard",
  },
  {
    description: "Combat rapproché et coursives verticales",
    href: "/blackline",
    id: "bl-hangar",
    title: "Arène Hangar Bravo",
  },
  {
    description: "Complexe néon technologique et couloirs étroits",
    href: "/blackline",
    id: "bl-cyber",
    title: "Arène Station Cyber",
  },
  {
    description: "Fortification souterraine pour tirs réflexes",
    href: "/blackline",
    id: "bl-bunker",
    title: "Arène Néo-Bunker",
  },
  {
    description: "Sensibilité, réticule, audio et qualité graphique WebGL",
    href: "/blackline",
    id: "bl-settings",
    title: "Options & Commandes Blackline",
  },
];

const MAI_SUITE_APPS = [
  {
    description: "Conversations, bots et agents autonomes",
    href: "/",
    icon: MessageSquareIcon,
    id: "app-chat",
    title: "mAI Chat & Agents",
  },
  {
    description: "Moteur de recherche moderne avec synthèse IA",
    href: "/search",
    icon: GlobeIcon,
    id: "app-search",
    title: "mAI Search (Web)",
  },
  {
    description: "Recherche exhaustive dans votre compte mAI",
    href: "/recherche",
    icon: SearchIcon,
    id: "app-recherche",
    title: "Recherche interne globale",
  },
  {
    description: "Révisez le collège et le lycée un quiz à la fois",
    href: "/quizzly",
    icon: GraduationCapIcon,
    id: "app-quizzly",
    title: "Quizzly (Éducation)",
  },
  {
    description: "FPS 3D tactique solo dans l'hôte mAI",
    href: "/blackline",
    icon: CrosshairIcon,
    id: "app-blackline",
    title: "Blackline (Jeu 3D)",
  },
  {
    description: "Espace de développement et programmation assisté par IA",
    href: "/coder",
    icon: Code2Icon,
    id: "app-coder",
    title: "Coder",
  },
  {
    description: "Réseau social, créations et vidéos",
    href: "/vibe",
    icon: UsersIcon,
    id: "app-vibe",
    title: "Vibe",
  },
  {
    description: "Messagerie instantanée et assistants dédiés",
    href: "/wakies",
    icon: BotIcon,
    id: "app-wakies",
    title: "Wakies",
  },
  {
    description: "Vos espaces de travail, fichiers et contextes",
    href: "/projects",
    icon: FolderKanbanIcon,
    id: "app-projects",
    title: "Projets",
  },
  {
    description: "Fichiers, images générées et audios",
    href: "/library",
    icon: LibraryIcon,
    id: "app-library",
    title: "Bibliothèque",
  },
  {
    description: "Gestion du compte, modèles et mémoire",
    href: "/settings",
    icon: SettingsIcon,
    id: "app-settings",
    title: "Paramètres",
  },
];

export function SuiteCommandBar({
  onOpenChange,
  open,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const isQuizzly = pathname.startsWith("/quizzly");
  const isBlackline = pathname.startsWith("/blackline");

  // Charge les données légères du compte Quizzly si l'utilisateur y est
  const { data: resume } = useSWR<ResumeQuizzlyLight>(
    isQuizzly ? "/api/quizzly/resume" : null,
    fetcher,
    { dedupingInterval: 10_000, revalidateOnFocus: false }
  );

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  const handleSelect = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router]
  );

  const cleanQuery = searchQuery.trim();

  return (
    <CommandDialog
      className="max-w-2xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl"
      description="Naviguez rapidement et recherchez dans toutes les applications mAI"
      onOpenChange={onOpenChange}
      open={open}
      title="Barre de commande universelle"
    >
      <div className="flex flex-col border-b border-border/40">
        <CommandInput
          autoFocus
          className="h-13 text-base placeholder:text-muted-foreground/70"
          onValueChange={setSearchQuery}
          placeholder={
            isQuizzly
              ? "Rechercher une matière, une fiche, une action Quizzly... (⌘K)"
              : isBlackline
                ? "Rechercher une arène, une arme, une option Blackline... (⌘K)"
                : "Rechercher dans toute la suite mAI... (⌘K)"
          }
          value={searchQuery}
        />

        {/* Bandeau d'état Quizzly si dans Quizzly */}
        {isQuizzly && resume && (
          <div className="flex items-center gap-3 bg-muted/20 px-4 py-2 text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1 text-q-streak">
              <FlameIcon className="size-3.5 fill-current" />
              {resume.streakCount} j
            </span>
            <span className="flex items-center gap-1 text-q-level">
              <GraduationCapIcon className="size-3.5" />
              Niv. {resume.niveau} ({resume.xp} XP)
            </span>
            <span className="flex items-center gap-1 text-q-heart">
              <HeartIcon className="size-3.5 fill-current" />
              {resume.hearts}
            </span>
            <span className="flex items-center gap-1 text-q-shop">
              <GemIcon className="size-3.5" />
              {resume.gems}
            </span>
            <span className="ml-auto text-[11px] font-normal text-muted-foreground">
              Ligue : {resume.league}
            </span>
          </div>
        )}
      </div>

      <CommandList className="max-h-[380px] p-2">
        <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
          Aucun élément correspondant à « {cleanQuery} ».
        </CommandEmpty>

        {/* Passerelle recherche Web / Recherche interne dès qu'une requête est saisie */}
        {cleanQuery.length >= 2 && (
          <CommandGroup heading="Recherche élargie">
            <CommandItem
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 cursor-pointer"
              onSelect={() =>
                handleSelect(`/recherche?q=${encodeURIComponent(cleanQuery)}`)
              }
            >
              <SearchIcon className="size-4 text-primary" />
              <span>
                Chercher « <strong>{cleanQuery}</strong> » dans le compte
                complet
              </span>
              <CommandShortcut>Recherche</CommandShortcut>
            </CommandItem>
            <CommandItem
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 cursor-pointer"
              onSelect={() =>
                handleSelect(`/search?q=${encodeURIComponent(cleanQuery)}`)
              }
            >
              <GlobeIcon className="size-4 text-primary" />
              <span>
                Chercher « <strong>{cleanQuery}</strong> » sur le Web avec mAI
                Search
              </span>
              <CommandShortcut>mAI Search</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        )}

        {/* Section Quizzly */}
        {isQuizzly && (
          <>
            <CommandGroup heading="Matières Quizzly">
              {QUIZZLY_MATIERES.map((matiere) => (
                <CommandItem
                  className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 cursor-pointer"
                  key={matiere.id}
                  onSelect={() => handleSelect(matiere.href)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <GraduationCapIcon className="size-4 shrink-0 text-q-level" />
                    <span className="font-medium truncate">{matiere.name}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                    {matiere.description}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator className="my-1" />

            <CommandGroup heading="Sections & Fiches Quizzly">
              {QUIZZLY_SECTIONS.map((section) => {
                const IconComponent = section.icon;
                return (
                  <CommandItem
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 cursor-pointer"
                    key={section.id}
                    onSelect={() => handleSelect(section.href)}
                  >
                    <IconComponent className="size-4 text-muted-foreground" />
                    <span>{section.title}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            <CommandSeparator className="my-1" />
          </>
        )}

        {/* Section Blackline */}
        {isBlackline && (
          <>
            <CommandGroup heading="Actions & Arènes Blackline">
              {BLACKLINE_ACTIONS.map((action) => (
                <CommandItem
                  className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 cursor-pointer"
                  key={action.id}
                  onSelect={() => handleSelect(action.href)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CrosshairIcon className="size-4 shrink-0 text-primary" />
                    <span className="font-medium truncate">{action.title}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                    {action.description}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator className="my-1" />
          </>
        )}

        {/* Applications de la suite mAI */}
        <CommandGroup
          heading={
            isQuizzly || isBlackline
              ? "Basculer vers une autre application"
              : "Applications de la suite mAI"
          }
        >
          {MAI_SUITE_APPS.map((app) => {
            const AppIcon = app.icon;
            const isCurrent =
              pathname === app.href ||
              (app.href !== "/" && pathname.startsWith(app.href));
            return (
              <CommandItem
                className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 cursor-pointer"
                key={app.id}
                onSelect={() => handleSelect(app.href)}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <AppIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="font-medium truncate">{app.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-muted-foreground truncate max-w-[180px] hidden sm:inline">
                    {app.description}
                  </span>
                  {isCurrent && (
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      Actuelle
                    </span>
                  )}
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
