"use client";

import {
  BrainIcon,
  DatabaseIcon,
  DownloadIcon,
  HardDriveIcon,
  ImageIcon,
  Loader2Icon,
  MicIcon,
  TrashIcon,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
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
import { Input } from "@/components/ui/input";
import { useDeleteAllChats } from "@/hooks/use-delete-all-chats";
import { extractApiErrorMessage } from "@/lib/api/client-error";
import { apiUrl } from "@/lib/client/api-endpoints";
import { fetcher } from "@/lib/utils";

// Onglet « Données » : tout ce qui détruit, regroupé au même endroit.
//
// La suppression totale de l'historique a vécu dans la barre latérale, à un
// clic d'une discussion, entre « Messages archivés » et le bas de l'écran. C'est
// l'emplacement le moins cohérent de l'application pour une action irréversible :
// la barre latérale invite à naviguer, pas à perdre vos données. Elle est donc
// ici, avec ses conséquences énoncées — et une saisie de confirmation, que
// l'emplacement précédent n'exigeait pas.

/** Confirmation saisie : distingue un clic sur un bouton d'une décision. */
const DELETE_CONFIRMATION = "SUPPRIMER";

type HistoryPage = { chats?: unknown[] } | unknown[];

function readChats(data: HistoryPage | undefined): number {
  if (Array.isArray(data)) {
    return data.length;
  }
  if (data && Array.isArray(data.chats)) {
    return data.chats.length;
  }
  return 0;
}

export function DataTab() {
  const { deleteAll, isDeleting } = useDeleteAllChats();

  // ── Compteurs ────────────────────────────────────────────────────────────
  // Volontairement en `dedupingInterval` long : ces compteurs sont indicatifs,
  // ils ne justifient pas quatre revalidations à l'ouverture de l'onglet.
  const { data: historyData } = useSWR<HistoryPage>(
    apiUrl("/api/history?limit=50&includeArchived=true"),
    fetcher,
    { dedupingInterval: 30_000, revalidateOnFocus: false }
  );
  const { data: memoryData } = useSWR<{ memories?: unknown[] }>(
    apiUrl("/api/memory"),
    fetcher,
    { dedupingInterval: 30_000, revalidateOnFocus: false }
  );
  const { data: imagesData } = useSWR<{ data?: unknown[]; images?: unknown[] }>(
    apiUrl("/api/images/history?page=1&limit=50"),
    fetcher,
    { dedupingInterval: 30_000, revalidateOnFocus: false }
  );
  const { data: audioData } = useSWR<{ data?: unknown[]; audio?: unknown[] }>(
    apiUrl("/api/audio/history"),
    fetcher,
    { dedupingInterval: 30_000, revalidateOnFocus: false }
  );

  const historyCount = readChats(historyData);
  const memoryCount = Array.isArray(memoryData?.memories)
    ? memoryData.memories.length
    : 0;
  const imageCount = Array.isArray(imagesData?.data)
    ? imagesData.data.length
    : Array.isArray(imagesData?.images)
      ? imagesData.images.length
      : 0;
  const audioCount = Array.isArray(audioData?.data)
    ? audioData.data.length
    : Array.isArray(audioData?.audio)
      ? audioData.audio.length
      : 0;
  const generationCount = imageCount + audioCount;

  // ── Actions ──────────────────────────────────────────────────────────────
  const [busy, setBusy] = useState<null | "export" | "memory" | "generations">(
    null
  );
  const [pendingAction, setPendingAction] = useState<
    null | "generations" | "history" | "memory"
  >(null);
  const [confirmation, setConfirmation] = useState("");

  const handleExport = useCallback(async () => {
    setBusy("export");
    try {
      // Le téléchargement passe par une ancre invisible plutôt que par
      // `window.open` : ce dernier est bloqué par les bloqueurs de pop-ups dès
      // que l'appel est asynchrone, et l'utilisateur ne reçoit rien.
      const res = await fetch(apiUrl("/api/history/export"));
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(extractApiErrorMessage(data) || "L'export a échoué.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `mai-historique-${new Date().toISOString().slice(0, 10)}.md`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success("Historique exporté en Markdown");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "L'export a échoué."
      );
    } finally {
      setBusy(null);
    }
  }, []);

  const handleResetMemory = useCallback(async () => {
    setBusy("memory");
    try {
      const res = await fetch(apiUrl("/api/memory?scope=all"), {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          extractApiErrorMessage(data) || "La réinitialisation a échoué."
        );
      }
      toast.success(
        data.count > 0
          ? `${data.count} élément(s) de mémoire supprimé(s)`
          : "Mémoire déjà vide"
      );
      setPendingAction(null);
      setConfirmation("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "La réinitialisation a échoué."
      );
    } finally {
      setBusy(null);
    }
  }, []);

  const handlePurgeGenerations = useCallback(async () => {
    setBusy("generations");
    try {
      // Les deux appels sont lancés ensemble : les purges sont indépendantes
      // et l'une ne doit pas conditionner l'autre. `allSettled` pour ne pas
      // laisser une rejetée non observée.
      const [images, audio] = await Promise.allSettled([
        fetch(apiUrl("/api/images/history?all=1"), { method: "DELETE" }),
        fetch(apiUrl("/api/audio/history?all=1"), { method: "DELETE" }),
      ]);
      const failed = [images, audio].filter((r) => r.status === "rejected");
      const refused = [images, audio].filter(
        (r) => r.status === "fulfilled" && !r.value.ok
      );
      if (failed.length > 0 || refused.length > 0) {
        throw new Error(
          "La purge des générations a partiellement échoué. Réessayez dans un instant."
        );
      }
      toast.success("Générations supprimées");
      setPendingAction(null);
      setConfirmation("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "La purge a échoué."
      );
    } finally {
      setBusy(null);
    }
  }, []);

  const handleConfirmPending = useCallback(() => {
    if (pendingAction === "history") {
      void deleteAll().then((ok) => {
        if (ok) {
          setPendingAction(null);
          setConfirmation("");
        }
      });
      return;
    }
    if (pendingAction === "memory") {
      void handleResetMemory();
      return;
    }
    if (pendingAction === "generations") {
      void handlePurgeGenerations();
    }
  }, [deleteAll, handlePurgeGenerations, handleResetMemory, pendingAction]);

  const isBusy = isDeleting || busy !== null;
  const needsTyping = pendingAction !== null;

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* Historique */}
        <div
          className="surface-card flex flex-col gap-5 scroll-mt-6"
          id="data-history"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-info/10 text-info ring-1 ring-info/20">
              <DatabaseIcon className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Historique des discussions
              </h3>
              <p className="text-xs text-muted-foreground">
                Exportez vos conversations ou effacez-les définitivement.
              </p>
            </div>
          </div>

          <div className="surface-muted flex items-center gap-2 text-xs text-muted-foreground">
            <HardDriveIcon className="size-4 shrink-0" />
            <span>
              {historyCount > 0
                ? `${historyCount} conversation(s) récente(s) dans cet aperçu.`
                : "Aucune conversation à afficher."}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-card/60 px-4 py-2.5 text-sm font-medium transition-all hover:bg-muted active:scale-95 cursor-pointer disabled:opacity-50"
              disabled={isBusy}
              onClick={handleExport}
              type="button"
            >
              {busy === "export" ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <DownloadIcon className="size-4" />
              )}
              Exporter en Markdown
            </button>

            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive transition-all hover:bg-destructive/15 active:scale-95 cursor-pointer disabled:opacity-50"
              data-testid="data-delete-all-chats"
              disabled={isBusy}
              onClick={() => {
                setConfirmation("");
                setPendingAction("history");
              }}
              type="button"
            >
              {isDeleting ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <TrashIcon className="size-4" />
              )}
              Supprimer tout l'historique
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground">
            L'export produit un seul fichier Markdown contenant l'intégralité de
            vos conversations, classée de la plus récente à la plus ancienne.
          </p>
        </div>

        {/* Mémoire */}
        <div
          className="surface-card flex flex-col gap-5 scroll-mt-6"
          id="data-memory"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-warning/10 text-warning ring-1 ring-warning/20">
              <BrainIcon className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Mémoire
              </h3>
              <p className="text-xs text-muted-foreground">
                Ce que mAI retient de vous, de vos projets et de vos bots.
              </p>
            </div>
          </div>

          <div className="surface-muted flex items-center gap-2 text-xs text-muted-foreground">
            <BrainIcon className="size-4 shrink-0" />
            <span>
              {memoryCount > 0
                ? `${memoryCount} élément(s) en mémoire.`
                : "Mémoire vide pour le moment."}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive transition-all hover:bg-destructive/15 active:scale-95 cursor-pointer disabled:opacity-50"
              disabled={isBusy}
              onClick={() => {
                setConfirmation("");
                setPendingAction("memory");
              }}
              type="button"
            >
              {busy === "memory" ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <TrashIcon className="size-4" />
              )}
              Réinitialiser la mémoire
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground">
            La purge porte sur les trois portées à la fois : personnelle, projet
            et agent. mAI cessera de faire référence à ces informations, mais
            vos conversations resteront inchangées.
          </p>
        </div>

        {/* Générations */}
        <div
          className="surface-card flex flex-col gap-5 scroll-mt-6"
          id="data-generations"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-success/10 text-success ring-1 ring-success/20">
              <HardDriveIcon className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Images et audios générés
              </h3>
              <p className="text-xs text-muted-foreground">
                Vos créations de l'outil Images et de l'outil Synthèse vocale.
              </p>
            </div>
          </div>

          <div className="surface-muted flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <ImageIcon className="size-4 shrink-0" />
              {imageCount} image(s)
            </span>
            <span className="flex items-center gap-2">
              <MicIcon className="size-4 shrink-0" />
              {audioCount} audio(s)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive transition-all hover:bg-destructive/15 active:scale-95 cursor-pointer disabled:opacity-50"
              disabled={isBusy}
              onClick={() => {
                setConfirmation("");
                setPendingAction("generations");
              }}
              type="button"
            >
              {busy === "generations" ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <TrashIcon className="size-4" />
              )}
              Purger les générations
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Les fichiers sont retirés de votre espace, y compris de vos
            conversations. Les quotas déjà consommés ne sont pas remboursés.
          </p>
        </div>
      </div>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open && !isBusy) {
            setPendingAction(null);
            setConfirmation("");
          }
        }}
        open={needsTyping}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction === "history"
                ? "Supprimer toutes les discussions ?"
                : pendingAction === "memory"
                  ? "Réinitialiser la mémoire ?"
                  : "Purger les générations ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction === "history"
                ? "Toutes vos conversations, y compris celles archivées et partagées, seront définitivement effacées. Cette action est irréversible. Exportez-les d'abord si vous souhaitez les conserver."
                : pendingAction === "memory"
                  ? "Tout ce que mAI retient de vous sera oublié : préférences apprises, éléments de projet et souvenirs attachés à vos bots. Cette action est irréversible."
                  : "Toutes vos images et tous vos audios générés seront définitivement supprimés, y compris ceux cités dans vos conversations. Cette action est irréversible."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-2">
            <label
              className="text-xs font-medium text-muted-foreground"
              htmlFor="data-delete-confirmation"
            >
              Saisissez <span className="font-mono">{DELETE_CONFIRMATION}</span>{" "}
              pour confirmer.
            </label>
            <Input
              autoComplete="off"
              id="data-delete-confirmation"
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder={DELETE_CONFIRMATION}
              value={confirmation}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBusy}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={confirmation !== DELETE_CONFIRMATION || isBusy}
              onClick={handleConfirmPending}
            >
              {isBusy ? <Loader2Icon className="size-4 animate-spin" /> : null}
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
