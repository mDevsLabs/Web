import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Clock,
  RotateCcw,
  Zap,
} from "lucide-react";
import type {
  SupportPriority,
  SupportTicketStatus,
} from "@/app/(chat)/site/actions/support-utils";

export type { SupportPriority };

export type SupportPriorityOption = {
  id: SupportPriority;
  name: string;
  desc: string;
  badgeColor: string;
  activeColor: string;
};

export const PRIORITY_OPTIONS = [
  {
    activeColor:
      "ring-2 ring-blue-500 bg-blue-50/80 border-blue-500 text-blue-800",
    badgeColor: "border-blue-200 bg-blue-50 text-blue-700",
    desc: "Question générale ou amélioration mineure",
    id: "low",
    name: "Faible",
  },
  {
    activeColor:
      "ring-2 ring-emerald-500 bg-emerald-50/80 border-emerald-500 text-emerald-800",
    badgeColor: "border-emerald-200 bg-emerald-50 text-emerald-700",
    desc: "Dysfonctionnement partiel ou demande standard",
    id: "medium",
    name: "Normale",
  },
  {
    activeColor:
      "ring-2 ring-orange-500 bg-orange-50/80 border-orange-500 text-orange-800",
    badgeColor: "border-orange-200 bg-orange-50 text-orange-700",
    desc: "Impact sérieux sur votre flux de travail",
    id: "high",
    name: "Haute",
  },
  {
    activeColor: "ring-2 ring-red-500 bg-red-50/80 border-red-500 text-red-800",
    badgeColor: "border-red-200 bg-red-50 text-red-700",
    desc: "Panne bloquante ou interruption totale",
    id: "urgent",
    name: "Critique",
  },
] as const satisfies readonly SupportPriorityOption[];

export type SupportTicketStatusVisual = {
  label: string;
  bg: string;
  icon: LucideIcon;
};

export const STATUS_CONFIG: Record<
  SupportTicketStatus,
  SupportTicketStatusVisual
> = {
  archived: {
    bg: "bg-slate-100 text-slate-600 border-slate-200",
    icon: Archive,
    label: "Archivé",
  },
  closed: {
    bg: "bg-slate-100 text-slate-700 border-slate-200",
    icon: CheckCircle2,
    label: "Fermé",
  },
  in_progress: {
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Zap,
    label: "En cours",
  },
  open: {
    bg: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Clock,
    label: "Ouvert",
  },
  reopened: {
    bg: "bg-orange-50 text-orange-700 border-orange-200",
    icon: RotateCcw,
    label: "Réouvert",
  },
  resolved: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
    label: "Résolu",
  },
  waiting_user: {
    bg: "bg-purple-50 text-purple-700 border-purple-200",
    icon: AlertCircle,
    label: "En attente",
  },
};

export const PRIORITY_BADGES: Record<
  SupportPriority,
  { label: string; bg: string }
> = {
  high: {
    bg: "bg-orange-100 text-orange-700 border-orange-200",
    label: "Haute",
  },
  low: { bg: "bg-blue-100 text-blue-700 border-blue-200", label: "Faible" },
  medium: {
    bg: "bg-emerald-100 text-emerald-700 border-emerald-200",
    label: "Normale",
  },
  urgent: { bg: "bg-red-100 text-red-700 border-red-200", label: "Critique" },
};
