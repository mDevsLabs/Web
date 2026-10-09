import { ActivityIcon as Activity, ArrowLeftRightIcon as ArrowLeftRight, BarChart3Icon as BarChart3, BellIcon as Bell, BookmarkIcon as Bookmark, BookOpenIcon as BookOpen, ClockIcon as Clock, FileTextIcon as FileText, GlobeIcon as Globe, HashIcon as Hash, HeartIcon as Heart, ImageIcon, LanguagesIcon as Languages, LayoutGridIcon as LayoutGrid, LightbulbIcon as Lightbulb, MessageCircleIcon as MessageCircle, MessageSquareIcon as MessageSquare, MessagesSquareIcon as MessagesSquare, Repeat2Icon as Repeat2, SearchIcon as Search, SendIcon as Send, SettingsIcon as Settings, ShieldCheckIcon as ShieldCheck, SparklesIcon as Sparkles, TargetIcon as Target, Trash2Icon as Trash2, TrendingUpIcon as TrendingUp, UserIcon as User, UserPlusIcon as UserPlus, UsersIcon as Users, ZapIcon as Zap } from "@mdevs/icons";
import type React from "react";
import type { MAITool } from "@/lib/vibe/data/maiTools";
import { useAvailableMAITools } from "@/lib/vibe/hooks/useAvailableMAITools";

interface ToolAutocompleteProps {
  onClose: () => void;
  onSelect: (tool: MAITool) => void;
  query: string;
  /** Masque la liste des outils mAI (ex : messages → uniquement l'action spéciale). */
  showTools?: boolean;
  /** Action spéciale proposée en tête de liste (ex : « Mentionner un post »). */
  specialAction?: {
    label: string;
    description: string;
    /** Sous-titre affiché à côté du label (défaut : « Mentionner un post »). */
    subtitle?: string;
    iconName?: string;
    onSelect: () => void;
  };
  trigger: "/" | "@";
}

const iconMap: Record<string, React.ElementType> = {
  Activity,
  ArrowLeftRight,
  BarChart3,
  Bell,
  Bookmark,
  BookOpen,
  Clock,
  FileText,
  Globe,
  Hash,
  Heart,
  Image: ImageIcon,
  Languages,
  LayoutGrid,
  Lightbulb,
  MessageCircle,
  MessageSquare,
  MessagesSquare,
  Repeat2,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  User,
  UserPlus,
  Users,
  Zap,
};

export const ToolAutocomplete: React.FC<ToolAutocompleteProps> = ({
  query,
  trigger,
  onSelect,
  specialAction,
  showTools = true,
}) => {
  const availableTools = useAvailableMAITools();
  const cleanQ = query.toLowerCase().replace(/^[/@]/, "");

  const matches = showTools
    ? availableTools
        .filter((t) => {
          if (!cleanQ) return true;
          const tag = trigger === "/" ? t.slashCommand : t.mentionTag;
          return (
            tag.toLowerCase().includes(cleanQ) ||
            t.name.toLowerCase().includes(cleanQ) ||
            t.description.toLowerCase().includes(cleanQ)
          );
        })
        .slice(0, 6)
    : [];

  const specialMatches =
    specialAction &&
    (!cleanQ ||
      specialAction.label.toLowerCase().replace(/^[/@]/, "").includes(cleanQ) ||
      (showTools
        ? "post publication mentionner".includes(cleanQ)
        : specialAction.description.toLowerCase().includes(cleanQ)));

  if (matches.length === 0 && !specialMatches) return null;

  return (
    <div className="absolute bottom-full left-0 mb-2 w-full max-w-sm vibe-menu rounded-2xl shadow-2xl overflow-hidden z-50 animate-scaleUp">
      <div className="p-2 border-b border-zinc-200 vibe-dark:border-zinc-800 bg-black/5 vibe-dark:bg-zinc-900/50 flex items-center justify-between text-[11px] font-mono text-zinc-600 vibe-dark:text-zinc-400">
        <span>
          {showTools
            ? `Outils & Actions mAI (${trigger === "/" ? "Commandes /" : "Mentions @"})`
            : "Actions du Livre"}
        </span>
        <span>{matches.length + (specialMatches ? 1 : 0)} suggéré(s)</span>
      </div>

      <div className="divide-y divide-zinc-100 vibe-dark:divide-zinc-900 max-h-56 overflow-y-auto">
        {specialMatches && specialAction && (
          <button
            className="w-full p-2.5 flex items-center gap-3 text-left hover:bg-black/5 vibe-dark:hover:bg-zinc-900 transition-colors group"
            onClick={specialAction.onSelect}
            type="button"
          >
            <div className="p-2 rounded-xl bg-zinc-100 vibe-dark:bg-zinc-900 border border-zinc-200 vibe-dark:border-zinc-800 group-hover:bg-zinc-900 group-hover:text-white vibe-dark:group-hover:bg-white vibe-dark:group-hover:text-black transition-colors text-zinc-800 vibe-dark:text-white shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-zinc-900 vibe-dark:text-white">
                  {specialAction.label}
                </span>
                <span className="text-[11px] text-zinc-600 vibe-dark:text-zinc-400 truncate font-semibold">
                  {specialAction.subtitle || "Mentionner un post"}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                {specialAction.description}
              </p>
            </div>
          </button>
        )}
        {matches.map((tool) => {
          const Icon = iconMap[tool.iconName] || Sparkles;
          const label = trigger === "/" ? tool.slashCommand : tool.mentionTag;

          return (
            <button
              className="w-full p-2.5 flex items-center gap-3 text-left hover:bg-black/5 vibe-dark:hover:bg-zinc-900 transition-colors group"
              key={tool.id}
              onClick={() => onSelect(tool)}
              type="button"
            >
              <div className="p-2 rounded-xl bg-zinc-100 vibe-dark:bg-zinc-900 border border-zinc-200 vibe-dark:border-zinc-800 group-hover:bg-zinc-900 group-hover:text-white vibe-dark:group-hover:bg-white vibe-dark:group-hover:text-black transition-colors text-zinc-800 vibe-dark:text-white shrink-0">
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-zinc-900 vibe-dark:text-white">
                    {label}
                  </span>
                  <span className="text-[11px] text-zinc-600 vibe-dark:text-zinc-400 truncate font-semibold">
                    {tool.name}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                  {tool.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
