import React from 'react';
import { ImageIcon, GlobeIcon as Globe, FileTextIcon as FileText, ShieldCheckIcon as ShieldCheck, SparklesIcon as Sparkles, LanguagesIcon as Languages, SendIcon as Send, TrendingUpIcon as TrendingUp, BarChart3Icon as BarChart3, ZapIcon as Zap, BellIcon as Bell, UserPlusIcon as UserPlus, HeartIcon as Heart, MessageCircleIcon as MessageCircle, SettingsIcon as Settings, BookmarkIcon as Bookmark, Repeat2Icon as Repeat2, MessageSquareIcon as MessageSquare, ActivityIcon as Activity, Trash2Icon as Trash2, LightbulbIcon as Lightbulb, SearchIcon as Search, UserIcon as User, UsersIcon as Users, ClockIcon as Clock, ArrowLeftRightIcon as ArrowLeftRight, TargetIcon as Target, LayoutGridIcon as LayoutGrid, MessagesSquareIcon as MessagesSquare, BookOpenIcon as BookOpen, HashIcon as Hash } from "@mdevs/icons";
import { type MAITool } from '../../data/maiTools';
import { useAvailableMAITools } from '../../hooks/useAvailableMAITools';

interface ToolAutocompleteProps {
  query: string;
  trigger: '/' | '@';
  onSelect: (tool: MAITool) => void;
  onClose: () => void;
  /** Action spéciale proposée en tête de liste (ex : « Mentionner un post »). */
  specialAction?: {
    label: string;
    description: string;
    /** Sous-titre affiché à côté du label (défaut : « Mentionner un post »). */
    subtitle?: string;
    iconName?: string;
    onSelect: () => void;
  };
  /** Masque la liste des outils mAI (ex : messages → uniquement l'action spéciale). */
  showTools?: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  Image: ImageIcon,
  Globe: Globe,
  FileText: FileText,
  ShieldCheck: ShieldCheck,
  Sparkles: Sparkles,
  Languages: Languages,
  Send: Send,
  TrendingUp: TrendingUp,
  BarChart3: BarChart3,
  Zap: Zap,
  Bell: Bell,
  UserPlus: UserPlus,
  Heart: Heart,
  MessageCircle: MessageCircle,
  Settings: Settings,
  Bookmark: Bookmark,
  Repeat2: Repeat2,
  MessageSquare: MessageSquare,
  Activity: Activity,
  Trash2: Trash2,
  Lightbulb: Lightbulb,
  Search: Search,
  User: User,
  Users: Users,
  Clock: Clock,
  ArrowLeftRight: ArrowLeftRight,
  Target: Target,
  LayoutGrid: LayoutGrid,
  MessagesSquare: MessagesSquare,
  BookOpen: BookOpen,
  Hash: Hash,
};

export const ToolAutocomplete: React.FC<ToolAutocompleteProps> = ({
  query,
  trigger,
  onSelect,
  specialAction,
  showTools = true,
}) => {
  const availableTools = useAvailableMAITools();
  const cleanQ = query.toLowerCase().replace(/^[/@]/, '');

  const matches = showTools
    ? availableTools.filter((t) => {
        if (!cleanQ) return true;
        const tag = trigger === '/' ? t.slashCommand : t.mentionTag;
        return (
          tag.toLowerCase().includes(cleanQ) ||
          t.name.toLowerCase().includes(cleanQ) ||
          t.description.toLowerCase().includes(cleanQ)
        );
      }).slice(0, 6)
    : [];

  const specialMatches =
    specialAction &&
    (!cleanQ ||
      specialAction.label.toLowerCase().replace(/^[/@]/, '').includes(cleanQ) ||
      (showTools ? 'post publication mentionner'.includes(cleanQ) : specialAction.description.toLowerCase().includes(cleanQ)));

  if (matches.length === 0 && !specialMatches) return null;

  return (
    <div className="absolute bottom-full left-0 mb-2 w-full max-w-sm vibe-menu rounded-2xl shadow-2xl overflow-hidden z-50 animate-scaleUp">
      <div className="p-2 border-b border-zinc-200 dark:border-zinc-800 bg-black/5 dark:bg-zinc-900/50 flex items-center justify-between text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
        <span>{showTools ? `Outils & Actions mAI (${trigger === '/' ? 'Commandes /' : 'Mentions @'})` : 'Actions du Livre'}</span>
        <span>{matches.length + (specialMatches ? 1 : 0)} suggéré(s)</span>
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-900 max-h-56 overflow-y-auto">
        {specialMatches && specialAction && (
          <button
            type="button"
            onClick={specialAction.onSelect}
            className="w-full p-2.5 flex items-center gap-3 text-left hover:bg-black/5 dark:hover:bg-zinc-900 transition-colors group"
          >
            <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 group-hover:bg-zinc-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors text-zinc-800 dark:text-white shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-zinc-900 dark:text-white">{specialAction.label}</span>
                <span className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate font-semibold">{specialAction.subtitle || 'Mentionner un post'}</span>
              </div>
              <p className="text-[11px] text-zinc-500 truncate mt-0.5">{specialAction.description}</p>
            </div>
          </button>
        )}
        {matches.map((tool) => {
          const Icon = iconMap[tool.iconName] || Sparkles;
          const label = trigger === '/' ? tool.slashCommand : tool.mentionTag;

          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onSelect(tool)}
              className="w-full p-2.5 flex items-center gap-3 text-left hover:bg-black/5 dark:hover:bg-zinc-900 transition-colors group"
            >
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 group-hover:bg-zinc-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors text-zinc-800 dark:text-white shrink-0">
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-zinc-900 dark:text-white">
                    {label}
                  </span>
                  <span className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate font-semibold">
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
