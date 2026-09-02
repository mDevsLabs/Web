"use client";

import {
  AlertCircleIcon,
  ArrowRightIcon,
  BotIcon,
  CalendarClockIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  CloudIcon,
  Edit2Icon,
  ExternalLinkIcon,
  Loader2Icon,
  PlayIcon,
  PlusIcon,
  RefreshCwIcon,
  RepeatIcon,
  SearchIcon,
  SparklesIcon,
  Trash2Icon,
  WrenchIcon,
  XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { ScheduleDialog } from "@/components/planning/schedule-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeModelDisplayName } from "@/lib/ai/models";
import type { Agent, ScheduledMessage } from "@/lib/db/schema";
import { cn, fetcher } from "@/lib/utils";

interface PlanningClientProps {
  initialAgents: Agent[];
  initialSchedules: ScheduledMessage[];
  userId: string;
}

export function PlanningClient({
  initialAgents,
  initialSchedules,
  userId,
}: PlanningClientProps) {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduledMessage | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isTriggeringDue, setIsTriggeringDue] = useState(false);

  const {
    data: schedules,
    mutate,
    isValidating,
  } = useSWR<ScheduledMessage[]>(
    `/api/planning?status=${filterStatus}`,
    fetcher,
    {
      fallbackData: initialSchedules,
      refreshInterval: 15000,
    }
  );

  const dueItems = (schedules || []).filter(
    (item) =>
      item.status === "pending" &&
      new Date(item.scheduledAt).getTime() <= Date.now()
  );

  const handleExecuteAllDue = async () => {
    setIsTriggeringDue(true);
    try {
      const res = await fetch("/api/cron/planning", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'exécution");
      }
      if (data.executedCount > 0) {
        toast.success(
          `${data.executedCount} message(s) planifié(s) exécuté(s) avec succès !`
        );
      } else {
        toast.info("Aucun message planifié n'était en attente d'exécution.");
      }
      mutate();
    } catch (err: any) {
      toast.error(err?.message || "Échec de l'exécution des tâches en attente");
    } finally {
      setIsTriggeringDue(false);
    }
  };

  const filteredList = (schedules || []).filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.prompt.toLowerCase().includes(q) ||
      item.modelId.toLowerCase().includes(q)
    );
  });

  const handleExecuteNow = async (id: string) => {
    setExecutingId(id);
    try {
      const res = await fetch(`/api/planning/${id}/execute`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'exécution");
      }
      toast.success("Message planifié exécuté avec succès !");
      mutate();
    } catch (err: any) {
      toast.error(err?.message || "Échec de l'exécution");
    } finally {
      setExecutingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/planning/${deletingId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Erreur lors de la suppression");
      }
      toast.success("Planification supprimée");
      setDeletingId(null);
      mutate();
    } catch (err: any) {
      toast.error(err?.message || "Échec de la suppression");
    }
  };

  const handleStatusChange = async (
    id: string,
    status: "pending" | "cancelled"
  ) => {
    try {
      const res = await fetch(`/api/planning/${id}`, {
        body: JSON.stringify({ status }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }
      toast.success(
        status === "cancelled"
          ? "Planification annulée"
          : "Planification réactivée"
      );
      mutate();
    } catch (err: any) {
      toast.error(err?.message || "Échec de la mise à jour");
    }
  };

  const RECURRENCE_LABELS: Record<string, string> = {
    daily: "Quotidien",
    monthly: "Mensuel",
    weekly: "Hebdomadaire",
  };

  const formatDateTime = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    return d.toLocaleString("fr-FR", {
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" variant="outline">
            <ClockIcon className="mr-1 size-3" />
            En attente
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" variant="outline">
            <Loader2Icon className="mr-1 size-3 animate-spin" />
            En cours
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" variant="outline">
            <CheckCircle2Icon className="mr-1 size-3" />
            Terminé
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20" variant="outline">
            <AlertCircleIcon className="mr-1 size-3" />
            Échoué
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-muted text-muted-foreground border-border" variant="outline">
            <XCircleIcon className="mr-1 size-3" />
            Annulé
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAgentName = (agentId: string | null) => {
    if (!agentId) return null;
    const ag = initialAgents.find((a) => a.id === agentId);
    return ag ? (
      <span className="flex items-center gap-1">
        {ag.emoji ? <span>{ag.emoji}</span> : <BotIcon className="size-3" />}
        <span>{ag.name}</span>
      </span>
    ) : null;
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background">
      {/* Header */}
      <div className="border-b border-border/40 px-6 py-6 sm:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
                <CalendarClockIcon className="size-5" />
              </span>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Planification
              </h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Programmez l'envoi de messages automatiques à l'IA à des dates et heures précises.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {dueItems.length > 0 && (
              <Button
                className="gap-2 border-amber-500/30 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400 shadow-xs text-xs"
                disabled={isTriggeringDue}
                onClick={handleExecuteAllDue}
                size="sm"
                variant="outline"
              >
                {isTriggeringDue ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  <PlayIcon className="size-3.5 fill-current" />
                )}
                <span>
                  Exécuter {dueItems.length} tâche{dueItems.length > 1 ? "s" : ""} échue{dueItems.length > 1 ? "s" : ""}
                </span>
              </Button>
            )}

            <Button
              className="gap-2 shadow-xs"
              onClick={() => {
                setEditingItem(null);
                setIsDialogOpen(true);
              }}
            >
              <PlusIcon className="size-4" />
              <span>Nouvelle planification</span>
            </Button>
          </div>
        </div>

        {/* Filtres & Recherche */}
        <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", label: "Tous" },
              { id: "pending", label: "En attente" },
              { id: "processing", label: "En cours" },
              { id: "completed", label: "Terminés" },
              { id: "failed", label: "Échecs" },
              { id: "cancelled", label: "Annulés" },
            ].map((st) => (
              <button
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer",
                  filterStatus === st.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                key={st.id}
                onClick={() => setFilterStatus(st.id)}
                type="button"
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <SearchIcon className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 pl-8 text-xs"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              value={searchQuery}
            />
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 p-6 sm:p-8">
        {filteredList.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 p-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CalendarClockIcon className="size-6" />
            </div>
            <h3 className="mt-4 font-semibold text-foreground">
              Aucun message planifié
            </h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Planifiez dès maintenant un envoi automatique pour automatiser vos résumés, veilles d'actualité ou rappels IA.
            </p>
            <Button
              className="mt-5 gap-2"
              onClick={() => {
                setEditingItem(null);
                setIsDialogOpen(true);
              }}
              size="sm"
            >
              <PlusIcon className="size-4" />
              Créer une planification
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredList.map((item) => {
              const isDue = new Date(item.scheduledAt).getTime() <= Date.now();
              const isExec = executingId === item.id;
              const agentLabel = getAgentName(item.agentId);

              return (
                <div
                  className="flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-5 shadow-xs transition hover:border-border hover:shadow-sm"
                  key={item.id}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-[15px] text-foreground">
                            {item.title}
                          </h4>
                          {getStatusBadge(item.status)}
                          {item.recurrence && item.recurrence !== "none" && (
                            <Badge
                              className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20"
                              variant="outline"
                            >
                              <RepeatIcon className="mr-1 size-3" />
                              {RECURRENCE_LABELS[item.recurrence] || item.recurrence}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarIcon className="size-3.5" />
                          <span>
                            {item.recurrence && item.recurrence !== "none"
                              ? "Prochain envoi le"
                              : "Prévu le"}{" "}
                            {formatDateTime(item.scheduledAt)}
                          </span>
                          {item.status === "pending" && isDue && (
                            <span className="font-medium text-amber-500">
                              (Échéance atteinte)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {item.status === "pending" && (
                          <>
                            <Button
                              className="size-8"
                              disabled={isExec}
                              onClick={() => handleExecuteNow(item.id)}
                              size="icon"
                              title="Exécuter maintenant"
                              variant="outline"
                            >
                              {isExec ? (
                                <Loader2Icon className="size-3.5 animate-spin" />
                              ) : (
                                <PlayIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                              )}
                            </Button>
                            <Button
                              className="size-8"
                              onClick={() => handleStatusChange(item.id, "cancelled")}
                              size="icon"
                              title="Annuler"
                              variant="ghost"
                            >
                              <XCircleIcon className="size-3.5 text-muted-foreground" />
                            </Button>
                          </>
                        )}
                        {(item.status === "failed" || item.status === "cancelled") && (
                          <Button
                            className="size-8"
                            onClick={() => handleStatusChange(item.id, "pending")}
                            size="icon"
                            title="Réactiver"
                            variant="outline"
                          >
                            <RefreshCwIcon className="size-3.5 text-amber-600 dark:text-amber-400" />
                          </Button>
                        )}
                        <Button
                          className="size-8"
                          onClick={() => {
                            setEditingItem(item);
                            setIsDialogOpen(true);
                          }}
                          size="icon"
                          title="Modifier"
                          variant="ghost"
                        >
                          <Edit2Icon className="size-3.5 text-muted-foreground" />
                        </Button>
                        <Button
                          className="size-8 hover:text-destructive"
                          onClick={() => setDeletingId(item.id)}
                          size="icon"
                          title="Supprimer"
                          variant="ghost"
                        >
                          <Trash2Icon className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Aperçu du prompt */}
                    <div className="mt-3.5 rounded-xl border border-border/30 bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                      <p className="line-clamp-3 font-mono">{item.prompt}</p>
                    </div>

                    {/* Détails de configuration */}
                    <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs">
                      {agentLabel && (
                        <div className="flex items-center rounded-md border border-border/40 bg-background px-2 py-1 text-muted-foreground">
                          {agentLabel}
                        </div>
                      )}
                      <div className="rounded-md border border-border/40 bg-background px-2 py-1 text-muted-foreground font-medium text-[11px]">
                        {normalizeModelDisplayName(item.modelId)}
                      </div>
                      {Array.isArray(item.cloudFileUrls) && (item.cloudFileUrls as string[]).length > 0 && (
                        <span className="flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                          <CloudIcon className="size-3" />
                          <span>{(item.cloudFileUrls as string[]).length} fichier(s)</span>
                        </span>
                      )}
                      {Array.isArray(item.enabledTools) && (item.enabledTools as string[]).map((t) => (
                        <span
                          className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                          key={t}
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    {item.lastError && (
                      <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/10 p-2 text-xs text-destructive">
                        Erreur : {item.lastError}
                      </div>
                    )}
                  </div>

                  {/* Footer de la carte */}
                  <div className="mt-4 flex items-center justify-between border-t border-border/30 pt-3 text-xs text-muted-foreground">
                    <div>
                      {item.executedAt ? (
                        <span>Exécuté le {formatDateTime(item.executedAt)}</span>
                      ) : (
                        <span>Créé le {formatDateTime(item.createdAt)}</span>
                      )}
                    </div>

                    {item.resultChatId && (
                      <Link
                        className="flex items-center gap-1 font-medium text-primary hover:underline"
                        href={`/chat/${item.resultChatId}`}
                      >
                        <span>Voir la discussion</span>
                        <ExternalLinkIcon className="size-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog Création / Édition */}
      <ScheduleDialog
        agents={initialAgents}
        initialData={editingItem}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={() => mutate()}
      />

      {/* Dialog Confirmation de suppression */}
      <AlertDialog onOpenChange={(open) => !open && setDeletingId(null)} open={Boolean(deletingId)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette planification ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le message ne sera plus envoyé automatiquement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}