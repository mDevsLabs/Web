"use client";

import {
  AlertCircle,
  Archive,
  ArchiveRestore,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileQuestion,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  User,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import toast from "react-hot-toast";
import {
  archiveTicket,
  deleteTicket,
  getTicketsList,
  updateTicketTitle,
} from "@/app/(chat)/site/actions/support";
import {
  isAdminUser,
  type SupportTicket,
} from "@/app/(chat)/site/actions/support-utils";
import { useAuth } from "@/components/site/auth-provider";
import Link from "@/components/site/router";
import { formatDisplayDate } from "@/lib/site/date-format";

const STATUS_TABS = [
  { id: "all", label: "Tous (actifs)" },
  { id: "open", label: "Ouverts" },
  { id: "in_progress", label: "En cours" },
  { id: "waiting_user", label: "En attente" },
  { id: "reopened", label: "Réouverts" },
  { id: "resolved", label: "Résolus" },
  { id: "closed", label: "Fermés" },
  { id: "archived", label: "Archivés" },
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; icon: any }> =
  {
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

const PRIORITY_BADGES: Record<string, { label: string; bg: string }> = {
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

export default function TicketsListClient() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [, startTransition] = useTransition();

  // Actions states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const isAdmin = isAdminUser(user?.email);

  const searchQueryRef = useRef(searchQuery);
  searchQueryRef.current = searchQuery;

  const fetchTickets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await getTicketsList({
        priority: priorityFilter,
        project: projectFilter,
        search: searchQueryRef.current.trim(),
        status: statusFilter,
      });
      if (res.success && res.tickets) setTickets(res.tickets);
    } catch (err) {
      console.error("Erreur chargement liste tickets:", err);
    } finally {
      setLoading(false);
    }
  }, [user, priorityFilter, projectFilter, statusFilter]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) fetchTickets();
    else if (!authLoading && !isAuthenticated) setLoading(false);
  }, [authLoading, isAuthenticated, fetchTickets]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => fetchTickets());
  };

  const handleRename = async (ticketId: string) => {
    if (!user) return;
    const trimmed = editingTitle.trim();
    if (trimmed.length < 3 || trimmed.length > 120) {
      toast.error("Le titre doit contenir entre 3 et 120 caractères.");
      return;
    }
    setActionLoading(ticketId);
    try {
      const res = await updateTicketTitle({
        newTitle: trimmed,
        ticketId,
      });
      if (res.success) {
        toast.success("Titre renommé !");
        setEditingId(null);
        await fetchTickets();
      } else toast.error(res.error || "Erreur renommage.");
    } catch {
      toast.error("Erreur renommage.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchiveToggle = async (ticket: SupportTicket) => {
    if (!user) return;
    const shouldArchive = ticket.status !== "archived" && !ticket.is_archived;
    if (
      !confirm(
        shouldArchive
          ? "Archiver ce ticket ? Il sera masqué de la liste active."
          : "Désarchiver ce ticket ?"
      )
    )
      return;
    setActionLoading(ticket.id);
    try {
      const res = await archiveTicket({
        archive: shouldArchive,
        ticketId: ticket.id,
      });
      if (res.success) {
        toast.success(shouldArchive ? "Ticket archivé." : "Ticket désarchivé.");
        await fetchTickets();
      } else toast.error(res.error || "Erreur archivage.");
    } catch {
      toast.error("Erreur archivage.");
    } finally {
      setActionLoading(null);
      setOpenMenuId(null);
    }
  };

  const handleDelete = async (ticket: SupportTicket) => {
    if (!user) return;
    if (
      !confirm(
        `Supprimer définitivement le ticket #TICK-${ticket.ticket_number} ? Cette action est irréversible et supprimera aussi les fichiers Z1 associés.`
      )
    )
      return;
    // second confirm for safety
    if (!confirm("Confirmez la suppression définitive ?")) return;
    setActionLoading(ticket.id);
    try {
      const res = await deleteTicket({
        ticketId: ticket.id,
      });
      if (res.success) {
        toast.success(
          "Ticket supprimé définitivement. Les fichiers Z1 seront purgés automatiquement."
        );
        await fetchTickets();
      } else toast.error(res.error || "Erreur suppression.");
    } catch {
      toast.error("Erreur suppression.");
    } finally {
      setActionLoading(null);
      setOpenMenuId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center py-32 bg-white rounded-3xl border border-black/5">
        <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
          <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
          <span>Vérification de la session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-8 sm:p-12 rounded-3xl bg-white border border-black/5 text-center max-w-xl mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
          <FileQuestion className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Connectez-vous pour voir vos tickets
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Votre historique est rattaché à votre compte mAI.
        </p>
        <div className="pt-2">
          <Link
            className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-sm inline-block"
            href="/account/login?next=/support/tickets"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            {isAdmin
              ? "Gestion globale des tickets (Admin)"
              : "Historique de vos demandes"}
            {isAdmin && (
              <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-xs font-bold">
                Admin
              </span>
            )}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isAdmin
              ? "Tous les tickets clients • Renommer, archiver, supprimer disponibles."
              : "Suivez vos signalements, renommez ou archivez vos tickets."}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
            disabled={loading}
            onClick={() => fetchTickets()}
            title="Rafraîchir"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin text-purple-600" : ""}`}
            />
          </button>
          <Link
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-sm"
            href="/support/new"
          >
            <PlusCircle className="w-4 h-4" /> Nouveau ticket
          </Link>
        </div>
      </div>

      {/* Filtres */}
      <div className="p-4 rounded-2xl bg-white border border-black/5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${isActive ? "bg-purple-600 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <form
          className="grid grid-cols-1 sm:grid-cols-12 gap-3"
          onSubmit={handleSearchSubmit}
        >
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-purple-500 outline-none"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par titre, #TICK ou mot-clé..."
              type="text"
              value={searchQuery}
            />
          </div>
          <div className="sm:col-span-3">
            <select
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:bg-white focus:border-purple-500 outline-none font-medium cursor-pointer"
              onChange={(e) => setProjectFilter(e.target.value)}
              value={projectFilter}
            >
              <option value="all">Tous les projets</option>
              <option value="mAI Web">mAI Web</option>
              <option value="mAI Pulse">mAI Pulse</option>
              <option value="mAI CLI">mAI CLI</option>
              <option value="mAI Coder">mAI Coder</option>
              <option value="mSearch">mSearch</option>
              <option value="API & Modèles IA">API & Modèles IA</option>
            </select>
          </div>
          <div className="sm:col-span-3">
            <select
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:bg-white focus:border-purple-500 outline-none font-medium cursor-pointer"
              onChange={(e) => setPriorityFilter(e.target.value)}
              value={priorityFilter}
            >
              <option value="all">Toutes priorités</option>
              <option value="urgent">Critique / Urgent</option>
              <option value="high">Haute</option>
              <option value="medium">Normale</option>
              <option value="low">Faible</option>
            </select>
          </div>
        </form>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center items-center py-24 bg-white rounded-3xl border border-black/5">
          <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
            <span>Chargement des tickets...</span>
          </div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-black/5 text-center space-y-3">
          <FileQuestion className="w-10 h-10 mx-auto text-slate-400" />
          <h3 className="text-base font-bold text-slate-800">
            Aucun ticket ne correspond
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Modifiez vos filtres ou créez une nouvelle demande.
          </p>
          <div className="pt-2 flex gap-2 justify-center">
            <button
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              onClick={() => {
                setStatusFilter("all");
                setProjectFilter("all");
                setPriorityFilter("all");
                setSearchQuery("");
              }}
            >
              Réinitialiser
            </button>
            <Link
              className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold"
              href="/support/new"
            >
              Nouveau ticket
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const statusCfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.open;
            const StatusIcon = statusCfg.icon;
            const priorityCfg =
              PRIORITY_BADGES[t.priority] || PRIORITY_BADGES.medium;
            const dateStr = formatDisplayDate(t.created_at, {
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              month: "short",
              year: "numeric",
            });
            const isEditing = editingId === t.id;
            return (
              <div
                className="relative p-5 rounded-2xl bg-white border border-black/5 hover:border-purple-200 hover:shadow-md transition-all group overflow-visible"
                key={t.id}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-black text-purple-700">
                        #TICK-{t.ticket_number || t.id.slice(0, 6)}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                        {t.project}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px]">
                        {t.category}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md border text-[11px] font-bold ${priorityCfg.bg}`}
                      >
                        {priorityCfg.label}
                      </span>
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          autoFocus
                          className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-purple-300 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-500/20"
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename(t.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          placeholder="Nouveau titre (3-120)"
                          value={editingTitle}
                        />
                        <button
                          className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 disabled:opacity-40 cursor-pointer"
                          disabled={actionLoading === t.id}
                          onClick={() => handleRename(t.id)}
                        >
                          {actionLoading === t.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            "Enregistrer"
                          )}
                        </button>
                        <button
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 cursor-pointer"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Link
                          className="text-base font-bold text-slate-900 group-hover:text-purple-600 transition-colors hover:underline line-clamp-1"
                          href={`/support/tickets/${t.id}`}
                        >
                          {t.title}
                        </Link>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {t.description}
                        </p>
                      </div>
                    )}

                    {isAdmin && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium pt-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Demandeur :</span>
                        <strong className="text-slate-800">
                          {t.user_name}
                        </strong>
                        <span className="text-purple-600 font-mono">
                          ({t.user_email})
                        </span>
                        {t.user_tier && (
                          <span className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-bold text-[10px]">
                            {t.user_tier}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right space-y-1">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${statusCfg.bg}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusCfg.label}
                      </span>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium justify-end">
                        <span>{dateStr}</span>
                        {t.message_count !== undefined && (
                          <span className="flex items-center gap-1 text-slate-500 font-bold">
                            <MessageSquare className="w-3 h-3" />
                            {t.message_count}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="relative flex items-center gap-1">
                      <button
                        className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
                        onClick={() =>
                          setOpenMenuId(openMenuId === t.id ? null : t.id)
                        }
                        title="Actions"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      <Link
                        className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-600 cursor-pointer hidden sm:flex"
                        href={`/support/tickets/${t.id}`}
                        title="Ouvrir"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>

                      {openMenuId === t.id && (
                        <div className="absolute right-0 top-10 z-[9999] w-52 p-2 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-1">
                          <Link
                            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-700"
                            href={`/support/tickets/${t.id}`}
                            onClick={() => setOpenMenuId(null)}
                          >
                            <MessageSquare className="w-4 h-4 text-blue-600" />{" "}
                            Ouvrir le ticket
                          </Link>
                          <button
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer text-left"
                            onClick={() => {
                              setEditingId(t.id);
                              setEditingTitle(t.title);
                              setOpenMenuId(null);
                            }}
                          >
                            <Pencil className="w-4 h-4 text-slate-500" />{" "}
                            Renommer
                          </button>
                          <button
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-amber-50 text-xs font-bold text-amber-700 cursor-pointer text-left disabled:opacity-40"
                            disabled={actionLoading === t.id}
                            onClick={() => handleArchiveToggle(t)}
                          >
                            {t.is_archived || t.status === "archived" ? (
                              <ArchiveRestore className="w-4 h-4" />
                            ) : (
                              <Archive className="w-4 h-4" />
                            )}
                            {t.is_archived || t.status === "archived"
                              ? "Désarchiver"
                              : "Archiver"}
                          </button>
                          <div className="h-px bg-slate-100 my-1" />
                          <button
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-50 text-xs font-bold text-red-600 cursor-pointer text-left disabled:opacity-40"
                            disabled={actionLoading === t.id}
                            onClick={() => handleDelete(t)}
                          >
                            <Trash2 className="w-4 h-4" /> Supprimer
                            définitivement
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
