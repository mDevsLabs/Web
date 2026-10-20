"use client";

import { Button } from "@mdevs/ui/primitives/button";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { ApiError, api } from "@/components/wakies/api";
import { Chat } from "@/components/wakies/Chat";
import { WakiesDraftProvider } from "@/components/wakies/DraftProvider";
import { EmptyChatView } from "@/components/wakies/EmptyChatView";
import { FriendsScreen } from "@/components/wakies/FriendsScreen";
import { GoalsScreen } from "@/components/wakies/GoalsScreen";
import { IdeasScreen } from "@/components/wakies/IdeasScreen";
import { Mascot } from "@/components/wakies/Mascot";
import { MemoriesScreen } from "@/components/wakies/MemoriesScreen";
import { MonProfilCard } from "@/components/wakies/MonProfilCard";
import { Onboarding } from "@/components/wakies/Onboarding";
import { openPageLink } from "@/components/wakies/page-navigation";
import { ResultPane } from "@/components/wakies/ResultPane";
import { SpaceWorkspace } from "@/components/wakies/SpaceWorkspace";
import { TasksActivityScreen } from "@/components/wakies/TasksActivityScreen";
import { TodayScreen } from "@/components/wakies/TodayScreen";
import { useMessagingNotifications } from "@/components/wakies/useMessagingNotifications";
import { WakieProfileDrawer } from "@/components/wakies/WakieProfileDrawer";
import {
  type Dialog,
  WorkspaceDialog,
} from "@/components/wakies/WorkspaceDialog";
import {
  type WakiesSection,
  WorkspaceNavigation,
} from "@/components/wakies/WorkspaceNavigation";
import { WorkspaceSidebar } from "@/components/wakies/WorkspaceSidebar";
import { WorkspaceTopbar } from "@/components/wakies/WorkspaceTopbar";
import { APP_PRICING_URL } from "@/lib/constants";
import { confirmInApp } from "@/lib/ui/app-dialog";
import { memoriserNavReduite } from "@/lib/wakies/client/nav-collapsed";
import type { Page } from "@/lib/wakies/pages";
import type { CapacitesPieces } from "@/lib/wakies/shared/model-attachments";
import type {
  Conversation,
  Detail,
  Result,
  State,
  Wakie,
  WorkspaceState,
} from "@/lib/wakies/shared/types";

/**
 * Coquille de l'application Wakies.
 *
 * Elle remplace le `App.tsx` du gabarit et son `CopilotKitProvider` : le port
 * n'a plus de runtime externe à envelopper. La session, elle, vient de l'hôte —
 * plus aucun écran de déverrouillage ni jeton à saisir (voir api.ts).
 */
export function WakiesWorkspace({
  initialNavCollapsed = false,
  fichePartageeId,
  initialData,
}: {
  /** Lu côté serveur : éviter que le rail ne se replie après l'hydratation. */
  initialNavCollapsed?: boolean;
  fichePartageeId?: string;
  initialData?: { state: State; workspace: WorkspaceState };
}) {
  return (
    <WakiesDraftProvider>
      <WakiesWorkspaceContent
        fichePartageeId={fichePartageeId}
        initialData={initialData}
        initialNavCollapsed={initialNavCollapsed}
      />
    </WakiesDraftProvider>
  );
}

function WakiesWorkspaceContent({
  initialNavCollapsed,
  fichePartageeId,
  initialData,
}: {
  initialNavCollapsed: boolean;
  fichePartageeId?: string;
  initialData?: { state: State; workspace: WorkspaceState };
}) {
  const [state, setState] = useState<State | undefined>(initialData?.state);
  const routeur = useRouter();
  const ouvrirReglages = useCallback(
    () => routeur.push("/wakies/settings"),
    [routeur]
  );
  const [workspace, setWorkspace] = useState<WorkspaceState | undefined>(
    initialData?.workspace
  );
  const [selectedWakie, setSelectedWakie] = useState(
    () => initialData?.workspace.wakies[0]?.id || ""
  );
  const [selectedThread, setSelectedThread] = useState<string | undefined>(
    () => initialData?.workspace.conversations[0]?.id
  );
  const [newConvModel, setNewConvModel] = useState("");
  const [sourceOpen, setSourceOpen] = useState(false);
  const [source, setSource] = useState("");
  const [bibliothequeOuverte, setBibliothequeOuverte] = useState(false);
  const inputFichier = useRef<HTMLInputElement>(null);
  const [capacitesFichiers, setCapacitesFichiers] = useState<CapacitesPieces>({
    documents: false,
    images: false,
  });
  const accepteFichiers =
    capacitesFichiers.images || capacitesFichiers.documents;
  const [view, rawSetView] = useState<WakiesSection>(
    fichePartageeId ? "amis" : "today"
  );
  const dirtyPage = useRef(false);
  const [spaceId, setSpaceId] = useState("");
  const [pageId, setPageId] = useState<string>();
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [searchPages, setSearchPages] = useState<
    { page: Page; space: WorkspaceState["spaces"][number] }[]
  >([]);
  const [cibleMessageId, setCibleMessageId] = useState<string | null>(null);
  const [searchMessages, setSearchMessages] = useState<
    Array<{
      conversationId: string;
      extrait: string;
      id: string;
      role: string;
    }>
  >([]);
  const spaceKey = workspace?.spaces.map((space) => space.id).join(",") ?? "";

  useEffect(() => {
    const query = sidebarSearch.trim().toLocaleLowerCase("fr");
    if (!query || !workspace?.spaces.length) {
      setSearchPages([]);
      return;
    }
    setSearchPages([]);
    let active = true;
    const timer = setTimeout(() => {
      void Promise.all(
        workspace.spaces.map(async (space) => ({
          pages: await api<Page[]>(`/spaces/${space.id}/pages`),
          space,
        }))
      )
        .then((groups) => {
          if (active)
            setSearchPages(
              groups.flatMap(({ pages, space }) =>
                pages
                  .filter((page) =>
                    page.title.toLocaleLowerCase("fr").includes(query)
                  )
                  .map((page) => ({ page, space }))
              )
            );
        })
        .catch(() => {
          if (active) setSearchPages([]);
        });
    }, 180);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [sidebarSearch, spaceKey, workspace?.spaces]);

  useEffect(() => {
    const requete = sidebarSearch.trim();
    if (requete.length < 2) {
      setSearchMessages([]);
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      void api<{
        messages: Array<{
          conversationId: string;
          extrait: string;
          id: string;
          role: string;
        }>;
      }>(`/search?q=${encodeURIComponent(requete)}`)
        .then((donnees) => {
          if (active) setSearchMessages(donnees.messages);
        })
        .catch(() => {
          if (active) setSearchMessages([]);
        });
    }, 220);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [sidebarSearch]);

  const setDirtyPage = useCallback((value: boolean) => {
    dirtyPage.current = value;
  }, []);

  const setView = async (next: typeof view) => {
    if (
      dirtyPage.current &&
      !(await confirmInApp(
        "Abandonner votre brouillon de page non enregistré ?"
      ))
    )
      return false;
    dirtyPage.current = false;
    if (next !== "space")
      history.replaceState(null, "", location.pathname + location.search);
    rawSetView(next);
    setMobile(false);
    return true;
  };

  useEffect(() => {
    let acceptedHash = location.hash;
    const navigate = async () => {
      const match = location.hash.match(
        /^#\/spaces\/([^/]+)(?:\/pages\/([^/]+))?$/
      );
      if (!match) return;
      if (dirtyPage.current && location.hash === acceptedHash) return;
      if (
        dirtyPage.current &&
        !(await confirmInApp(
          "Abandonner votre brouillon de page non enregistré ?"
        ))
      ) {
        history.replaceState(null, "", acceptedHash || location.pathname);
        return;
      }
      acceptedHash = location.hash;
      dirtyPage.current = false;
      setSpaceId(match[1]);
      setPageId(match[2]);
      rawSetView("space");
      setMobile(false);
    };
    navigate();
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);

  const openPage = (space: string, page?: string) => {
    openPageLink(`#/spaces/${space}${page ? `/pages/${page}` : ""}`);
  };

  const [error, setError] = useState("");
  const [sessionExpiree, setSessionExpiree] = useState(false);
  const [planRequis, setPlanRequis] = useState(false);
  const [dialog, rawSetDialog] = useState<Dialog>();
  const [ficheWakie, setFicheWakie] = useState<Wakie>();
  const setDialog = (next: Dialog | undefined) => {
    setMobile(false);
    rawSetDialog(next);
  };
  const [mobile, setMobile] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(initialNavCollapsed);
  const basculerNav = () => {
    const suivante = !navCollapsed;
    setNavCollapsed(suivante);
    memoriserNavReduite(suivante);
  };

  useEffect(() => {
    if (!mobile) return;
    const sidebar = document.getElementById("workspace-sidebar");
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const focusables = () =>
      [
        ...(sidebar?.querySelectorAll<HTMLElement>(
          "button:not([disabled]),a[href],input:not([disabled])"
        ) ?? []),
      ].filter(
        (item) => item.tabIndex >= 0 && item.getClientRects().length > 0
      );
    focusables()[0]?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === "Escape") setMobile(false);
      if (event.key !== "Tab") return;
      const items = focusables();
      if (event.shiftKey && document.activeElement === items[0]) {
        event.preventDefault();
        items.at(-1)?.focus();
      } else if (!event.shiftKey && document.activeElement === items.at(-1)) {
        event.preventDefault();
        items[0]?.focus();
      }
    };
    const resized = () => {
      if (window.innerWidth > 900) setMobile(false);
    };
    document.addEventListener("keydown", key);
    window.addEventListener("resize", resized);
    return () => {
      document.removeEventListener("keydown", key);
      window.removeEventListener("resize", resized);
      previous?.focus();
    };
  }, [mobile]);

  const [pane, setPane] = useState(false);
  const [capture, setCapture] = useState<Result>();
  const [prompt, setPrompt] = useState("");
  const [pendingPrompt, setPendingPrompt] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [taskDetail, setTaskDetail] = useState<Detail>();
  // Le hook ne sert plus qu'à l'ALERTE NAVIGATEUR : la cloche du rail a
  // disparu (les notifications Wakies sont dans la cloche mAI, qui lit la
  // table unifiée). L'alerte système, elle, reste : elle dépend de la
  // fenêtre ouverte, pas d'une page.
  const messaging = useMessagingNotifications(
    view === "chat" ? selectedThread : undefined
  );

  const { data: loaded, mutate: refreshData } = useSWR(
    "wakies-workspace",
    async () => {
      const [s, w] = await Promise.all([
        api<State>("/state"),
        api<WorkspaceState>("/workspace"),
      ]);
      return { state: s, workspace: w };
    },
    {
      fallbackData: initialData,
      onError: (e: unknown) => {
        if (e instanceof ApiError && e.status === 401) setSessionExpiree(true);
        else if (e instanceof ApiError && e.status === 403) setPlanRequis(true);
        else
          setError(
            e instanceof Error ? e.message : "Impossible de joindre le serveur."
          );
      },
      refreshInterval: 5000,
      revalidateOnFocus: true,
    }
  );

  useEffect(() => {
    if (!loaded) return;
    const w = loaded.workspace;
    setState(loaded.state);
    setWorkspace(w);
    setSessionExpiree(false);
    setPlanRequis(false);
    setSelectedWakie((previous) =>
      w.wakies.some((item) => item.id === previous)
        ? previous
        : w.wakies[0]?.id || ""
    );
    setSelectedThread((previous) =>
      w.conversations.some((item) => item.id === previous)
        ? previous
        : undefined
    );
  }, [loaded]);

  const refresh = useCallback(async () => {
    await refreshData();
    await messaging.refresh();
  }, [refreshData, messaging.refresh]);

  // Le fil a marqué sa lecture de son côté (`POST /conversations/:id/read`).
  // Ce callback ne sert plus qu'à rafraîchir l'état local : la cloche du
  // rail a disparu, donc il n'y a plus de liste d'alertes à retirer.
  const marquerLu = useCallback(
    (_conversationId: string) => {
      void refreshData();
    },
    [refreshData]
  );

  useEffect(() => {
    const ouvrir = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      const conversation = workspace?.conversations.find(
        (item) => item.id === id
      );
      if (!conversation || dirtyPage.current) return;
      rawSetView("chat");
      setSelectedWakie(conversation.wakieId);
      setSelectedThread(id);
      setMobile(false);
    };
    window.addEventListener("wakies-open-conversation", ouvrir);
    return () => window.removeEventListener("wakies-open-conversation", ouvrir);
  }, [workspace]);

  useEffect(() => {
    setCapture(undefined);
    if (!selectedThread) return;
    let active = true;
    const load = () =>
      void api<Result | null>(`/conversations/${selectedThread}/capture`)
        .then((result) => {
          if (active) setCapture(result ?? undefined);
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine) load();
    }, 30_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [selectedThread]);

  const mutate = useCallback(
    async (path: string, method: string, body?: unknown) => {
      setError("");
      try {
        await api(path, method, body);
        await refresh();
        if (taskDetail) {
          setTaskDetail(await api<Detail>(`/tasks/${taskDetail.task.id}`));
        }
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Enregistrement impossible.");
        return false;
      }
    },
    [refresh, taskDetail]
  );

  const wakie =
    workspace?.wakies.find((item) => item.id === selectedWakie) ??
    workspace?.wakies[0];
  const thread = workspace?.conversations.find(
    (item) => item.id === selectedThread && item.wakieId === wakie?.id
  );
  const configured = !!workspace && workspace.setup.missing.length === 0;

  const onboardingOuvert = Boolean(
    workspace && !state?.settings.onboardingCompleted && wakie
  );
  const terminerOnboarding = useCallback(async () => {
    try {
      await mutate("/settings", "PATCH", { onboardingCompleted: true });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "La configuration n'a pas pu être enregistrée."
      );
    }
  }, [mutate]);

  const chooseWakie = async (next: Wakie) => {
    if (!(await setView("chat"))) return;
    setSelectedWakie(next.id);
    setSelectedThread(
      workspace?.conversations.find((item) => item.wakieId === next.id)?.id
    );
    setMobile(false);
    setPendingPrompt(undefined);
  };

  const newConversation = async (text?: string, modelOverride?: string) => {
    if (!wakie || !configured || busy) return;
    if (!(await setView("chat"))) return;
    setBusy(true);
    setError("");
    try {
      const next = await api<Conversation>("/conversations", "POST", {
        title: text?.trim().slice(0, 80) || "Une nouvelle réflexion",
        wakieId: wakie.id,
      });
      const chosen = modelOverride || newConvModel;
      if (chosen && chosen !== (wakie.model ?? "")) {
        await api(`/conversations/${next.id}`, "PATCH", {
          model: chosen,
        }).catch(() => null);
      }
      await refresh();
      setSelectedThread(next.id);
      setPendingPrompt(text);
      setPrompt("");
      setSource("");
      setSourceOpen(false);
      await setView("chat");
      setMobile(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Impossible de créer la conversation."
      );
    } finally {
      setBusy(false);
    }
  };

  if (sessionExpiree)
    return (
      <main className="unlock">
        <Mascot />
        <h1>Votre session a expiré.</h1>
        <p>
          Wakies utilise la session de votre compte mAI. Reconnectez-vous pour
          reprendre votre espace de travail.
        </p>
        <a className="primary" href="/login?redirectUrl=%2Fwakies">
          Se reconnecter
        </a>
        <p className="muted">
          Aucun jeton à saisir : c’est votre compte mAI qui compte.
        </p>
      </main>
    );

  if (planRequis)
    return (
      <main className="unlock">
        <Mascot />
        <h1>Wakies est réservé aux forfaits payants</h1>
        <p>
          L'espace de travail Wakies nécessite un forfait Plus, Pro ou Max.
          Mettez à niveau votre compte mAI pour accéder à vos Wakies, vos
          espaces et vos tâches planifiées.
        </p>
        <a className="primary" href={APP_PRICING_URL}>
          Mettre à niveau mon forfait
        </a>
        <a className="muted" href="/">
          Retour au chat
        </a>
      </main>
    );

  if (!state || !workspace)
    return (
      <main className="unlock">
        <Mascot state="working" />
        <h1>Chargement de vos Wakies…</h1>
        {error && (
          <>
            <p className="chat-error">{error}</p>
            <Button onClick={() => void refresh()} variant="outline">
              Réessayer
            </Button>
          </>
        )}
        <div style={{ marginTop: "1.25rem" }}>
          <Button
            className="muted"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                window.history.back();
              } else {
                window.location.href = "/";
              }
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "inline-block",
              textDecoration: "underline",
            }}
            type="button"
            variant="outline"
          >
            ← Retour à la page précédente
          </Button>
        </div>
      </main>
    );

  if (!wakie) {
    const space = workspace.spaces[0];
    return (
      <div className="app template-app">
        <main className="unlock">
          <Mascot />
          <h1>Aucun Wakie pour l’instant</h1>
          <p>
            Un Wakie est un spécialiste : donnez-lui un rôle, une mascotte et un
            modèle, puis ouvrez la conversation. Vos Espaces et vos pages
            restent en place.
          </p>
          <Button
            className="primary"
            onClick={() =>
              space
                ? setDialog({ spaceId: space.id, type: "wakie" })
                : setDialog({ type: "space" })
            }
            variant="solid"
          >
            {space ? "Créer un Wakie" : "Créer un Espace"}
          </Button>
          {error && (
            <p className="chat-error" role="alert">
              {error}
            </p>
          )}
        </main>
        {dialog && (
          <WorkspaceDialog
            dialog={dialog}
            mutate={mutate}
            onClose={() => setDialog(undefined)}
            state={state}
            workspace={workspace}
          />
        )}
      </div>
    );
  }

  const content = (
    <div
      className={`app template-app muse-app ${navCollapsed ? "nav-collapsed" : ""}`}
    >
      <WorkspaceSidebar
        basculerNav={basculerNav}
        chooseWakie={chooseWakie}
        configured={configured}
        mobile={mobile}
        navCollapsed={navCollapsed}
        newConversation={newConversation}
        openPage={openPage}
        ouvrirReglages={ouvrirReglages}
        pageId={pageId}
        refresh={refresh}
        searchMessages={searchMessages}
        searchPages={searchPages}
        selectedThread={selectedThread}
        selectedWakie={selectedWakie}
        setCibleMessageId={setCibleMessageId}
        setDialog={setDialog}
        setMobile={setMobile}
        setSelectedThread={setSelectedThread}
        setSelectedWakie={setSelectedWakie}
        setSidebarSearch={setSidebarSearch}
        setView={setView}
        sidebarSearch={sidebarSearch}
        spaceId={spaceId}
        state={state}
        view={view}
        workspace={workspace}
      />

      <div className="workspace" inert={mobile ? true : undefined}>
        <WorkspaceTopbar
          configured={configured}
          onTogglePause={() =>
            void mutate("/settings", "PATCH", {
              paused: !state.settings.paused,
            })
          }
          pane={pane}
          setDialog={setDialog}
          setPane={setPane}
          spaceId={spaceId}
          state={state}
          view={view}
          wakie={wakie}
          workspace={workspace}
        />

        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <Button
              aria-label="Masquer l’erreur"
              className="icon-button"
              onClick={() => setError("")}
              variant="ghost"
            >
              <svg
                aria-hidden="true"
                fill="none"
                height="16"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="16"
              >
                <line x1="18" x2="6" y1="6" y2="18" />
                <line x1="6" x2="18" y1="6" y2="18" />
              </svg>
            </Button>
          </div>
        )}

        {state.settings.paused && (
          <div className="notice">
            Tous les Wakies sont en pause. Le calcul actif s’arrête et les
            tâches planifiées attendent.
          </div>
        )}

        {view === "today" ? (
          <TodayScreen
            busy={busy}
            configured={configured}
            conversations={workspace.conversations}
            onCreateConversation={(prompt) => void newConversation(prompt)}
            onOpenConversation={async (conversation) => {
              if (!(await setView("chat"))) return;
              const owner = workspace.wakies.find(
                (candidate) => candidate.id === conversation.wakieId
              );
              if (owner) {
                setSelectedWakie(owner.id);
                setSelectedThread(conversation.id);
              }
            }}
            onOpenSpace={(id) => openPage(id)}
            onSection={setView}
            paused={state.settings.paused}
            spaces={workspace.spaces}
            tasks={state.tasks}
            wakies={workspace.wakies}
          />
        ) : view === "goals" ? (
          <GoalsScreen
            defaultSpaceId={wakie.spaceId}
            onOpen={openPage}
            spaces={workspace.spaces}
          />
        ) : view === "ideas" ? (
          <IdeasScreen
            onGoals={() => setView("goals")}
            onMemories={() => setView("memories")}
          />
        ) : view === "space" ? (
          <SpaceWorkspace
            key={spaceId}
            onCreateWakie={() => setDialog({ spaceId, type: "wakie" })}
            onDirty={setDirtyPage}
            onPage={(id) => openPage(spaceId, id)}
            onRefresh={refresh}
            onSchedule={(conversationId) =>
              setDialog({ conversationId, type: "schedule" })
            }
            onSettings={() => ouvrirReglages()}
            onThread={async (id) => {
              const target = workspace.conversations.find((t) => t.id === id);
              if (target) {
                if (!(await setView("chat"))) return;
                setSelectedWakie(target.wakieId);
                setSelectedThread(id);
              }
            }}
            pageId={pageId}
            paused={state.settings.paused}
            space={
              workspace.spaces.find((s) => s.id === spaceId) ??
              workspace.spaces[0]
            }
            workspace={workspace}
          />
        ) : view === "chat" ? (
          <div className={`chat-workspace ${pane ? "split" : ""}`}>
            <div className="chat-column">
              {thread && configured ? (
                <Chat
                  calls={workspace.calls.filter(
                    (call) => call.conversationId === thread.id
                  )}
                  cibleMessageId={cibleMessageId}
                  conversations={workspace.conversations}
                  espaces={workspace.spaces}
                  initialPrompt={pendingPrompt}
                  key={thread.id}
                  onComputer={() => setPane(true)}
                  onConsumed={() => setPendingPrompt(undefined)}
                  onLu={marquerLu}
                  onSaved={refresh}
                  onSchedule={() =>
                    setDialog({ conversationId: thread.id, type: "schedule" })
                  }
                  paused={state.settings.paused}
                  thread={thread}
                  wakie={wakie}
                  wakies={workspace.wakies}
                />
              ) : (
                <EmptyChatView
                  accepteFichiers={accepteFichiers}
                  bibliothequeOuverte={bibliothequeOuverte}
                  busy={busy}
                  capacitesFichiers={capacitesFichiers}
                  configured={configured}
                  inputFichier={inputFichier}
                  newConvModel={newConvModel}
                  onNewConversation={newConversation}
                  ouvrirReglages={ouvrirReglages}
                  prompt={prompt}
                  selectedThread={selectedThread}
                  setBibliothequeOuverte={setBibliothequeOuverte}
                  setCapacitesFichiers={setCapacitesFichiers}
                  setDialog={setDialog}
                  setNewConvModel={setNewConvModel}
                  setPrompt={setPrompt}
                  setSource={setSource}
                  setSourceOpen={setSourceOpen}
                  source={source}
                  sourceOpen={sourceOpen}
                  state={state}
                  wakie={wakie}
                  workspace={workspace}
                />
              )}
            </div>
            {pane && (
              <ResultPane
                defaultWakieId={wakie.id}
                key={wakie.id}
                latest={capture}
                onClose={() => setPane(false)}
                wakieState="idle"
                wakies={workspace.wakies}
              />
            )}
          </div>
        ) : view === "profil" ? (
          <main className="main-content">
            <div className="page-heading">
              <div>
                <span className="eyebrow">
                  CE QUE VOS WAKIES SAVENT DE VOUS
                </span>
                <h1>Mon profil</h1>
                <p>
                  Votre profil Vibe est lu par vos Wakies : ils vous connaissent
                  sans que vous ayez à vous présenter à chaque conversation. Il
                  se modifie dans Vibe. Vos fiches de Wakie, elles, se publient
                  ici.
                </p>
              </div>
            </div>
            <MonProfilCard />
            <section className="surface-muted">
              <strong>Mes fiches Wakie</strong>
              <p className="muted">
                Pseudo, bio, liens, persona publiée et images : ce qu&apos;un
                autre compte peut voir, et cloner.
              </p>
              <ul className="wakies-social-list">
                {workspace.wakies.map((item) => (
                  <li className="wakies-social-line" key={item.id}>
                    <Mascot
                      avatar={item.avatar}
                      decorative
                      identity={item.id}
                      name={item.name}
                      small
                    />
                    <strong>{item.name}</strong>
                    {item.handle ? (
                      <small className="muted"> @{item.handle}</small>
                    ) : (
                      <small className="muted"> Sans pseudo</small>
                    )}
                    <Button
                      className="text-button"
                      onClick={() => setFicheWakie(item)}
                      type="button"
                      variant="ghost"
                    >
                      Publier ma fiche
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
            {ficheWakie ? (
              <WakieProfileDrawer
                key={ficheWakie.id}
                onChanged={refresh}
                onClose={() => setFicheWakie(undefined)}
                wakie={ficheWakie}
              />
            ) : null}
          </main>
        ) : view === "amis" ? (
          <FriendsScreen
            espaces={workspace.spaces.map((espace) => ({
              id: espace.id,
              name: espace.name,
            }))}
            fichePartageeId={fichePartageeId}
            onChanged={refresh}
            onOuvrirWakie={async (wakieId, conversationId) => {
              if (conversationId) {
                if (!(await setView("chat"))) return;
                setSelectedWakie(wakieId);
                setSelectedThread(conversationId);
                return;
              }
              const cible = workspace.wakies.find(
                (candidat) => candidat.id === wakieId
              );
              if (cible) chooseWakie(cible);
            }}
            wakiesDuCompte={workspace.wakies}
          />
        ) : view === "memories" ? (
          <MemoriesScreen
            memories={state.memories}
            onDeleteMemory={async (id) => {
              await mutate(`/memories/${id}`, "DELETE", {});
            }}
            setDialog={setDialog}
            settings={state.settings}
          />
        ) : (
          <TasksActivityScreen
            busy={busy}
            mutate={mutate}
            search={search}
            setError={setError}
            setSearch={setSearch}
            setTaskDetail={setTaskDetail}
            settings={state.settings}
            taskDetail={taskDetail}
            tasks={state.tasks}
          />
        )}
        <WorkspaceNavigation onSelect={setView} section={view} />
        {pane && view !== "chat" && (
          <div className="computer-overlay">
            <ResultPane
              defaultWakieId={
                view === "space"
                  ? (workspace.wakies.find((candidate) =>
                      candidate.spaceIds.includes(spaceId)
                    )?.id ?? wakie.id)
                  : wakie.id
              }
              key={view === "space" ? spaceId : wakie.id}
              onClose={() => setPane(false)}
              wakieState="idle"
              wakies={workspace.wakies}
            />
          </div>
        )}
      </div>
      {onboardingOuvert && state && workspace && wakie ? (
        <Onboarding
          espace={workspace.spaces.find(
            (candidate) => candidate.id === wakie.spaceId
          )}
          onEnregistrer={async (corps) => {
            const ok = await mutate(`/wakies/${wakie.id}`, "PUT", corps);
            return ok;
          }}
          onRepartir={() => void refresh()}
          onTerminer={terminerOnboarding}
          reglage={state.settings}
          wakie={wakie}
        />
      ) : null}
      {dialog ? (
        <WorkspaceDialog
          dialog={dialog}
          mutate={mutate}
          onClose={() => setDialog(undefined)}
          state={state}
          workspace={workspace}
        />
      ) : null}
    </div>
  );
  return content;
}
