"use client";

import {
  ArrowUp,
  ArrowUpRight,
  BookOpen,
  Clock3,
  Code2,
  Folder,
  Menu,
  MessageCircle,
  Monitor,
  MoreHorizontal,
  PanelLeft,
  Pause,
  Play,
  Plus,
  Search,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppSwitcherMenu } from "@/components/common/app-switcher";
import { ApiError, api } from "@/components/wakies/api";
import { Chat } from "@/components/wakies/Chat";
import { Mascot } from "@/components/wakies/Mascot";
import { openPageLink } from "@/components/wakies/page-navigation";
import { ResultPane } from "@/components/wakies/ResultPane";
import { SpaceNav } from "@/components/wakies/SpaceNav";
import { SpaceWorkspace } from "@/components/wakies/SpaceWorkspace";
import { TaskActions } from "@/components/wakies/TaskActions";
import { TaskRow } from "@/components/wakies/TaskPresentation";
import { ThreadList } from "@/components/wakies/ThreadList";
import {
  type Dialog,
  WorkspaceDialog,
} from "@/components/wakies/WorkspaceDialog";
import { MAI_UPGRADE_URL } from "@/lib/constants";
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
export function WakiesWorkspace() {
  const [state, setState] = useState<State>();
  const [workspace, setWorkspace] = useState<WorkspaceState>();
  const [selectedWakie, setSelectedWakie] = useState("");
  const [selectedThread, setSelectedThread] = useState<string>();
  const [view, rawSetView] = useState<"chat" | "tasks" | "memories" | "space">(
    "chat"
  );
  const dirtyPage = useRef(false);
  const [spaceId, setSpaceId] = useState("");
  const [pageId, setPageId] = useState<string>();
  const setDirtyPage = useCallback((value: boolean) => {
    dirtyPage.current = value;
  }, []);
  const setView = (next: typeof view) => {
    if (
      dirtyPage.current &&
      !window.confirm("Abandonner votre brouillon de page non enregistré ?")
    )
      return;
    dirtyPage.current = false;
    if (next !== "space")
      history.replaceState(null, "", location.pathname + location.search);
    rawSetView(next);
  };
  useEffect(() => {
    let acceptedHash = location.hash;
    const navigate = () => {
      const match = location.hash.match(
        /^#\/spaces\/([^/]+)(?:\/pages\/([^/]+))?$/
      );
      if (!match) return;
      if (dirtyPage.current && location.hash === acceptedHash) return;
      if (
        dirtyPage.current &&
        !window.confirm("Abandonner votre brouillon de page non enregistré ?")
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
  // Plus de jeton à saisir : un 401 signifie que la session mAI a expiré, et
  // l'interface doit proposer la sortie (reconnexion) plutôt qu'un écran vide.
  const [sessionExpiree, setSessionExpiree] = useState(false);
  const [planRequis, setPlanRequis] = useState(false);
  const [dialog, setDialog] = useState<Dialog>();
  const [mobile, setMobile] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [pane, setPane] = useState(false);
  const [capture, setCapture] = useState<Result>();
  const [prompt, setPrompt] = useState("");
  const [pendingPrompt, setPendingPrompt] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [taskDetail, setTaskDetail] = useState<Detail>();
  const refresh = useCallback(async () => {
    try {
      const [s, w] = await Promise.all([
        api<State>("/state"),
        api<WorkspaceState>("/workspace"),
      ]);
      setState(s);
      setWorkspace(w);
      setSessionExpiree(false);
      setPlanRequis(false);
      setSelectedWakie((previous) => previous || w.wakies[0]?.id || "");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setSessionExpiree(true);
      else if (e instanceof ApiError && e.status === 403) setPlanRequis(true);
      else
        setError(
          e instanceof Error ? e.message : "Impossible de joindre le serveur."
        );
    }
  }, []);
  // Rafraîchissement : le gabarit interrogeait son serveur toutes les 3 s pour
  // suivre l'avancement d'une exécution. Ici les données sont celles du compte,
  // qui ne changent qu'à l'action : 12 s suffisent, et un rafraîchissement au
  // retour sur l'onglet évite d'attendre le prochain tick.
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 12_000);
    const auRetour = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", auRetour);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", auRetour);
    };
  }, [refresh]);
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
    const timer = setInterval(load, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [selectedThread]);
  const mutate = async (path: string, method: string, body?: unknown) => {
    setError("");
    try {
      await api(path, method, body);
      await refresh();
      if (taskDetail)
        setTaskDetail(await api<Detail>(`/tasks/${taskDetail.task.id}`));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
      return false;
    }
  };
  const wakie =
    workspace?.wakies.find((item) => item.id === selectedWakie) ??
    workspace?.wakies[0];
  const thread = workspace?.conversations.find(
    (item) => item.id === selectedThread && item.wakieId === wakie?.id
  );
  const configured = !!workspace && workspace.setup.missing.length === 0;
  const chooseWakie = (next: Wakie) => {
    setSelectedWakie(next.id);
    setSelectedThread(
      workspace?.conversations.find((item) => item.wakieId === next.id)?.id
    );
    setView("chat");
    setMobile(false);
    setPendingPrompt(undefined);
  };
  const newConversation = async (text?: string) => {
    if (!wakie || !configured || busy) return;
    setBusy(true);
    setError("");
    try {
      const next = await api<Conversation>("/conversations", "POST", {
        title: text?.slice(0, 80) || "Une nouvelle réflexion",
        wakieId: wakie.id,
      });
      await refresh();
      setSelectedThread(next.id);
      setPendingPrompt(text);
      setPrompt("");
      setView("chat");
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
        <a
          className="primary"
          href={MAI_UPGRADE_URL}
          rel="noopener"
          target="_blank"
        >
          Mettre à niveau mon forfait
        </a>
        <a className="muted" href="/">
          Retour au chat
        </a>
      </main>
    );
  if (!state || !workspace || !wakie)
    return (
      <main className="unlock">
        <Mascot state="working" />
        <h1>Chargement de vos Wakies…</h1>
        {error && (
          <>
            <p className="chat-error">{error}</p>
            <button onClick={() => void refresh()}>Réessayer</button>
          </>
        )}
        <div style={{ marginTop: "1.25rem" }}>
          <button
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
          >
            ← Retour à la page précédente
          </button>
        </div>
      </main>
    );
  if (!wakie) {
    // Tous les Wakies ont été supprimés : l'écran doit le DIRE et proposer le
    // geste suivant. Rester sur « Chargement de vos Wakies… » ferait croire à
    // une panne, et ressusciter un Wakie de départ ignorerait le choix de
    // l'utilisateur (voir lib/wakies/queries.ts, deleteWakie).
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
          <button
            className="primary"
            onClick={() =>
              space
                ? setDialog({ spaceId: space.id, type: "wakie" })
                : setDialog({ type: "space" })
            }
          >
            {space ? "Créer un Wakie" : "Créer un Espace"}
          </button>
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
    <div className={`app template-app ${navCollapsed ? "nav-collapsed" : ""}`}>
      <nav aria-label="Navigation de l’espace de travail" className="icon-rail">
        {/* Le logo n'est plus un simple retour à l'accueil : il ouvre le menu
            des espaces de mAI (mAI, Site, Vibe, Coder, CLI). Wakies n'appartient
            pas au catalogue, donc AUCUNE entrée n'est marquée « courante » —
            celle de mAI reste cliquable, sinon on ne pourrait plus revenir au
            chat depuis /wakies. */}
        <AppSwitcherMenu align="start" currentAppOverride={null} side="right">
          <button
            aria-label="Changer d’espace de travail"
            className="rail-brand"
            type="button"
          >
            <img
              alt=""
              className="size-5.5 object-contain"
              src="/wakies/logo.png"
            />
          </button>
        </AppSwitcherMenu>
        <button
          aria-label={
            navCollapsed
              ? "Déplier la barre latérale"
              : "Replier la barre latérale"
          }
          onClick={() => setNavCollapsed(!navCollapsed)}
        >
          <PanelLeft size={18} />
        </button>
        <button
          aria-label="Nouvelle conversation"
          disabled={!configured}
          onClick={() => void newConversation()}
        >
          <Plus size={19} />
        </button>
        <button
          aria-label="Ouvrir les Espaces"
          onClick={() => {
            if (workspace.spaces[0]) openPage(workspace.spaces[0].id);
          }}
        >
          <Folder size={18} />
        </button>
        <button aria-label="Ouvrir l’activité" onClick={() => setView("tasks")}>
          <Clock3 size={18} />
        </button>
        <button
          aria-label="Ouvrir les paramètres"
          className="rail-settings"
          onClick={() => setDialog({ type: "settings" })}
        >
          <Settings2 size={18} />
        </button>
      </nav>
      <button
        aria-controls="workspace-sidebar"
        aria-expanded={mobile}
        aria-label="Ouvrir la navigation"
        className="mobile-menu icon-button"
        onClick={() => setMobile(true)}
      >
        <Menu size={21} />
      </button>
      {mobile && (
        <button
          aria-label="Fermer la navigation"
          className="nav-scrim"
          onClick={() => setMobile(false)}
        />
      )}
      <aside
        className={`sidebar ${mobile ? "open" : ""}`}
        id="workspace-sidebar"
      >
        <button
          className="wordmark"
          onClick={() => {
            setView("chat");
            setSelectedThread(undefined);
          }}
        >
          <img
            alt="Wakies"
            className="size-5.5 object-contain shrink-0"
            src="/wakies/logo.png"
          />
          Wakies<span className="wordmark-dot">•</span>
        </button>
        <button
          className="new-chat nav-item"
          disabled={!configured}
          onClick={() => void newConversation()}
        >
          <Plus size={17} />
          <span>Nouvelle conversation</span>
        </button>
        <div className="spaces-heading nav-label">
          WAKIES
          <button
            aria-label="Créer un Wakie"
            className="icon-button"
            onClick={() =>
              setDialog({ spaceId: workspace.spaces[0].id, type: "wakie" })
            }
          >
            <Plus size={14} />
          </button>
        </div>
        <nav aria-label="Wakies" className="wakies-nav">
          {workspace.wakies.map((item) => (
            <div className="wakie-nav-row" key={item.id}>
              <button
                aria-current={
                  wakie.id === item.id && view === "chat" ? "page" : undefined
                }
                className={`wakie-nav ${wakie.id === item.id && view === "chat" ? "active" : ""}`}
                onClick={() => chooseWakie(item)}
              >
                <Mascot
                  avatar={item.avatar}
                  decorative
                  identity={item.id}
                  name={item.name}
                  small
                />
                <span>{item.name}</span>
              </button>
              <button
                aria-label={`Edit ${item.name} settings`}
                className="icon-button wakie-settings"
                onClick={() =>
                  setDialog({
                    spaceId: item.spaceId,
                    type: "wakie",
                    wakie: item,
                  })
                }
              >
                <MoreHorizontal size={15} />
              </button>
            </div>
          ))}
        </nav>
        <div className="spaces-heading nav-label">
          SPACES
          <button
            aria-label="Créer un Espace"
            className="icon-button"
            onClick={() => setDialog({ type: "space" })}
          >
            <Plus size={14} />
          </button>
        </div>
        <nav aria-label="Espaces" className="spaces-nav">
          {workspace.spaces.map((space) => (
            <SpaceNav
              active={view === "space" && spaceId === space.id}
              key={space.id}
              onOpen={(id) => openPage(space.id, id)}
              pageId={pageId}
              space={space}
            />
          ))}
        </nav>
        {configured ? (
          <ThreadList
            local={workspace.conversations}
            onNew={() => void newConversation()}
            onSelect={(id) => {
              const conversation = workspace.conversations.find(
                (item) => item.id === id
              );
              if (conversation) setSelectedWakie(conversation.wakieId);
              setSelectedThread(id);
              setView("chat");
              setMobile(false);
            }}
            selected={view === "chat" ? selectedThread : undefined}
            wakieId={wakie.id}
            wakies={workspace.wakies}
          />
        ) : (
          <div className="sidebar-empty">
            Set up text chat to begin a persistent conversation.
          </div>
        )}
        <div className="sidebar-bottom">
          <button
            className={`nav-item ${view === "tasks" ? "active" : ""}`}
            onClick={() => {
              setView("tasks");
              setMobile(false);
            }}
          >
            <Clock3 size={17} />
            <span>Scheduled & activity</span>
            <small>{state.tasks.length}</small>
          </button>
          <button
            className={`nav-item ${view === "memories" ? "active" : ""}`}
            onClick={() => {
              setView("memories");
              setMobile(false);
            }}
          >
            <BookOpen size={17} />
            <span>Mémoires</span>
            <small>{state.memories.length}</small>
          </button>
          <button
            className="nav-item"
            onClick={() => setDialog({ type: "settings" })}
          >
            <Settings2 size={17} />
            <span>Réglages et configuration</span>
          </button>
          <a
            className="nav-item"
            href="https://github.com/CopilotKit/Wakies"
            rel="noreferrer"
            target="_blank"
          >
            <Code2 size={17} />
            <span>Personnalisez-le</span>
            <ArrowUpRight size={13} />
          </a>
          <div className="version">
            MODÈLE OPEN SOURCE <span>v0.1</span>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button
            aria-label={
              navCollapsed ? "Afficher la navigation" : "Masquer la navigation"
            }
            className="desktop-nav-toggle document-icon"
            onClick={() => setNavCollapsed(!navCollapsed)}
          >
            <PanelLeft size={18} />
          </button>
          <div className="breadcrumbs">
            <span>
              {view === "space"
                ? workspace.spaces.find((space) => space.id === spaceId)?.name
                : "Wakies"}
            </span>
            <span>/</span>
            <strong>
              {view === "chat"
                ? wakie.name
                : view === "tasks"
                  ? "Activité"
                  : view === "space"
                    ? "Pages"
                    : "Mémoires"}
            </strong>
          </div>
          <div className="top-actions">
            <span className="mode-badge">
              {configured ? "HÉBERGÉ LOCALEMENT" : "CONFIGURATION REQUISE"}
            </span>
            <button
              aria-label={
                state.settings.paused
                  ? "Reprendre tous les Wakies"
                  : "Mettre tous les Wakies en pause"
              }
              className="pause-button"
              onClick={() =>
                void mutate("/settings", "PATCH", {
                  paused: !state.settings.paused,
                })
              }
            >
              {state.settings.paused ? <Play size={14} /> : <Pause size={14} />}
              <span>{state.settings.paused ? "Reprendre" : "Pause"}</span>
            </button>
            <button
              aria-expanded={pane}
              aria-label={
                pane ? "Masquer l’ordinateur" : "Afficher l’ordinateur"
              }
              className="icon-button"
              onClick={() => setPane(!pane)}
            >
              <Monitor size={18} />
            </button>
          </div>
        </header>
        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button
              aria-label="Masquer l’erreur"
              className="icon-button"
              onClick={() => setError("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {state.settings.paused && (
          <div className="notice">
            Tous les Wakies sont en pause. Le calcul actif s’arrête et les
            tâches planifiées attendent.
          </div>
        )}
        {view === "space" ? (
          <SpaceWorkspace
            key={spaceId}
            onCreateWakie={() => setDialog({ spaceId, type: "wakie" })}
            onDirty={setDirtyPage}
            onPage={(id) => openPage(spaceId, id)}
            onRefresh={refresh}
            onSchedule={(conversationId) =>
              setDialog({ conversationId, type: "schedule" })
            }
            onSettings={() => setDialog({ type: "settings" })}
            onThread={(id) => {
              const target = workspace.conversations.find((t) => t.id === id);
              if (target) {
                setView("chat");
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
                  initialPrompt={pendingPrompt}
                  key={thread.id}
                  onComputer={() => setPane(true)}
                  onConsumed={() => setPendingPrompt(undefined)}
                  onSaved={refresh}
                  onSchedule={() =>
                    setDialog({ conversationId: thread.id, type: "schedule" })
                  }
                  paused={state.settings.paused}
                  thread={thread}
                  voiceReady={workspace.setup.voice}
                  wakie={wakie}
                />
              ) : (
                <div className="new-conversation">
                  <div className="empty-chat-persona">
                    <Mascot
                      avatar={wakie.avatar}
                      identity={wakie.id}
                      name={wakie.name}
                      state={state.settings.paused ? "paused" : "idle"}
                    />
                    <h2>{wakie.name}</h2>
                    <p>{wakie.instructions}</p>
                    <button
                      className="text-button"
                      onClick={() =>
                        setDialog({
                          spaceId: wakie.spaceId,
                          type: "wakie",
                          wakie,
                        })
                      }
                    >
                      Modifier le spécialiste <MoreHorizontal size={14} />
                    </button>
                  </div>
                  {!configured && (
                    <div className="setup-card">
                      <span className="setup-icon">
                        <Settings2 size={20} />
                      </span>
                      <div>
                        <strong>Connectez votre Wakie</strong>
                        <p>
                          Connectez votre modèle et votre service de
                          conversation dans les Réglages pour commencer à
                          discuter. Vos Espaces et les préférences de vos Wakies
                          sont prêts.
                        </p>
                        <a
                          href="https://github.com/CopilotKit/Wakies/blob/main/docs/SETUP.md"
                          rel="noreferrer"
                          target="_blank"
                        >
                          Ouvrir le guide de configuration{" "}
                          <ArrowUpRight size={12} />
                        </a>
                      </div>
                    </div>
                  )}
                  <form
                    className="composer"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void newConversation(prompt);
                    }}
                  >
                    <textarea
                      aria-label="Démarrer une conversation"
                      disabled={!configured}
                      maxLength={4000}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={
                        configured
                          ? `Message ${wakie.name}…`
                          : "Votre première conversation démarre après la configuration."
                      }
                      value={prompt}
                    />
                    <div className="composer-bottom">
                      <span>
                        <MessageCircle size={14} />
                        Texte et appels, une seule conversation
                      </span>
                      <button
                        aria-label="Démarrer la conversation"
                        className="send-button"
                        disabled={!configured || busy || !prompt.trim()}
                      >
                        <ArrowUp size={19} />
                      </button>
                    </div>
                  </form>
                  <div className="starter-suggestions">
                    {[
                      "Aidez-moi à réfléchir à cela",
                      "Étudier une page publique",
                      "Établir un plan que je puisse suivre",
                    ].map((text) => (
                      <button
                        disabled={!configured}
                        key={text}
                        onClick={() => setPrompt(text)}
                      >
                        {text}
                        <ArrowUpRight size={12} />
                      </button>
                    ))}
                  </div>
                  <div className="connection-note">
                    <span
                      className={`online-dot ${workspace.setup.slack === "online" ? "" : "off"}`}
                    />
                    Slack · {workspace.setup.slack.replaceAll("_", " ")}
                    <button
                      className="text-button"
                      onClick={() => setDialog({ type: "settings" })}
                    >
                      Détails de la configuration
                    </button>
                  </div>
                </div>
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
        ) : (
          <main className="main-content">
            <div className="page-heading">
              <div>
                <span className="eyebrow">VOTRE ESPACE DE TRAVAIL</span>
                <h1>{view === "memories" ? "Memories" : "Un peu de suivi."}</h1>
                <p>
                  {view === "memories"
                    ? "Les préférences que vous choisissez de partager avec vos Wakies."
                    : "Les tours planifiés s’exécutent sur le serveur dans leur conversation d’origine."}
                </p>
              </div>
              {view === "memories" && (
                <button
                  className="primary"
                  onClick={() => setDialog({ type: "memory" })}
                >
                  <Plus size={15} />
                  Ajouter une mémoire
                </button>
              )}
            </div>
            {view === "memories" ? (
              <>
                <div className="memory-grid">
                  {state.memories.map((memory) => (
                    <article className="memory-card" key={memory.id}>
                      <BookOpen size={18} />
                      <p>{memory.text}</p>
                      <div>
                        <small>
                          {state.settings.memoryAllowed
                            ? "Disponible pour les Wakies autorisés"
                            : "Utilisation des mémoires désactivée"}
                        </small>
                        <button
                          aria-label="Modifier la mémoire"
                          className="icon-button"
                          onClick={() => setDialog({ memory, type: "memory" })}
                        >
                          <MoreHorizontal size={17} />
                        </button>
                        <button
                          aria-label="Supprimer la mémoire"
                          className="icon-button"
                          onClick={() =>
                            void mutate(`/memories/${memory.id}`, "DELETE", {})
                          }
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                {!state.memories.length && (
                  <div className="large-empty">
                    <Mascot />
                    <h2>Un peu de contexte change beaucoup de choses.</h2>
                    <p>
                      Ajoutez une préférence comme « Garder mes synthèses de
                      recherche courtes ». Vous pourrez la modifier ou la
                      supprimer à tout moment.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <label className="search-box">
                  <Search size={16} />
                  <input
                    aria-label="Rechercher des tâches"
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Trouver une tâche…"
                    value={search}
                  />
                </label>
                <div className="task-list">
                  {state.tasks
                    .filter((task) =>
                      task.prompt.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((task) => (
                      <TaskRow
                        key={task.id}
                        onClick={() =>
                          void api<Detail>(`/tasks/${task.id}`)
                            .then(setTaskDetail)
                            .catch((e) => setError(e.message))
                        }
                        task={task}
                      />
                    ))}
                </div>
                {!state.tasks.length && (
                  <div className="large-empty">
                    <Clock3 size={32} />
                    <h2>Laissez une réflexion revenir plus tard.</h2>
                    <p>
                      Ouvrez une conversation et utilisez le bouton horloge pour
                      planifier une tâche côté serveur.
                    </p>
                  </div>
                )}
                {taskDetail && (
                  <section className="task-detail-card">
                    <h2>{taskDetail.task.prompt}</h2>
                    <TaskActions
                      busy={busy}
                      onAction={(action) =>
                        void mutate(
                          `/tasks/${taskDetail.task.id}/actions`,
                          "POST",
                          { action }
                        )
                      }
                      onSchedule={async () => {
                        const raw = window.prompt(
                          "Intervalle de répétition en minutes (0 supprime la planification)",
                          String((taskDetail.task.intervalSeconds ?? 0) / 60)
                        );
                        if (raw === null) return;
                        const value = Number(raw);
                        if (!Number.isFinite(value) || value < 0) {
                          setError("Saisissez un nombre de minutes valide.");
                          return;
                        }
                        await mutate(
                          `/tasks/${taskDetail.task.id}/schedule`,
                          "PUT",
                          {
                            intervalSeconds: value
                              ? Math.round(value * 60)
                              : null,
                          }
                        );
                      }}
                      settings={state.settings}
                      task={taskDetail.task}
                    />
                    {taskDetail.task.error && (
                      <p className="chat-error">{taskDetail.task.error}</p>
                    )}
                    {taskDetail.events.slice(-6).map((event) => (
                      <p className="muted" key={event.id}>
                        {event.text}
                      </p>
                    ))}
                    <small>{taskDetail.runs.length} saved runs</small>
                  </section>
                )}
              </>
            )}
          </main>
        )}
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
  return content;
}
