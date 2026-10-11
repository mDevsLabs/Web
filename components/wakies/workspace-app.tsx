"use client";

import { ArrowUpIcon } from "@mdevs/icons/arrows/arrow-up";
import { ArrowUpRightIcon } from "@mdevs/icons/arrows/arrow-up-right";
import { MessageCircleIcon } from "@mdevs/icons/communication/message-circle";
import { MessageSquareIcon } from "@mdevs/icons/communication/message-square";
import { PlusIcon } from "@mdevs/icons/controls/plus";
import { SearchIcon } from "@mdevs/icons/controls/search";
import { Settings2Icon } from "@mdevs/icons/controls/settings-2";
import { XIcon } from "@mdevs/icons/controls/x";
import { MonitorIcon } from "@mdevs/icons/devices/monitor";
import { BookOpenIcon } from "@mdevs/icons/files/book-open";
import { FolderIcon } from "@mdevs/icons/files/folder";
import { EllipsisVerticalIcon } from "@mdevs/icons/interface/ellipsis-vertical";
import { MenuIcon } from "@mdevs/icons/interface/menu";
import { PanelLeftIcon } from "@mdevs/icons/interface/panel-left";
import { PauseIcon } from "@mdevs/icons/media/pause";
import { PlayIcon } from "@mdevs/icons/media/play";
import { Trash2Icon } from "@mdevs/icons/objects/trash-2";
import { TimerIcon } from "@mdevs/icons/time/timer";
import { Button } from "@mdevs/ui/primitives/button";
import { Input } from "@mdevs/ui/primitives/input";
import { Textarea } from "@mdevs/ui/primitives/textarea";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { AppSwitcherMenu } from "@/components/common/app-switcher";
import { ApiError, api } from "@/components/wakies/api";
import { Chat } from "@/components/wakies/Chat";
import { ConversationList } from "@/components/wakies/ConversationList";
import { WakiesDraftProvider } from "@/components/wakies/DraftProvider";
import { FriendsScreen } from "@/components/wakies/FriendsScreen";
import { GoalsScreen } from "@/components/wakies/GoalsScreen";
import { IdeasScreen } from "@/components/wakies/IdeasScreen";
import { Mascot } from "@/components/wakies/Mascot";
import { MonProfilCard } from "@/components/wakies/MonProfilCard";
import { Onboarding } from "@/components/wakies/Onboarding";
import { openPageLink } from "@/components/wakies/page-navigation";
import { ResultPane } from "@/components/wakies/ResultPane";
import { SpaceNav } from "@/components/wakies/SpaceNav";
import { SpaceWorkspace } from "@/components/wakies/SpaceWorkspace";
import { TaskActions } from "@/components/wakies/TaskActions";
import { TaskRow } from "@/components/wakies/TaskPresentation";
import { TodayScreen } from "@/components/wakies/TodayScreen";
import { useMessagingNotifications } from "@/components/wakies/useMessagingNotifications";
import { WakieProfileDrawer } from "@/components/wakies/WakieProfileDrawer";
import { WakiesNotificationBell } from "@/components/wakies/WakiesNotificationBell";
import {
  type Dialog,
  WorkspaceDialog,
} from "@/components/wakies/WorkspaceDialog";
import {
  type WakiesSection,
  WorkspaceNavigation,
} from "@/components/wakies/WorkspaceNavigation";
import { APP_PRICING_URL } from "@/lib/constants";
import { memoriserNavReduite } from "@/lib/wakies/client/nav-collapsed";
import type { Page } from "@/lib/wakies/pages";
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
}: {
  /** Lu côté serveur : éviter que le rail ne se replie après l'hydratation. */
  initialNavCollapsed?: boolean;
}) {
  return (
    <WakiesDraftProvider>
      <WakiesWorkspaceContent initialNavCollapsed={initialNavCollapsed} />
    </WakiesDraftProvider>
  );
}

function WakiesWorkspaceContent({
  initialNavCollapsed,
}: {
  initialNavCollapsed: boolean;
}) {
  const [state, setState] = useState<State>();
  const routeur = useRouter();
  /**
   * Les réglages sont une PAGE, plus une fenêtre. Une URL se relit, se
   * partage, et surtout se ferme sans emporter le contexte avec elle ; le
   * dialogue, lui, rendait l'atelier inerte et n'existait nulle part.
   */
  const ouvrirReglages = useCallback(
    () => routeur.push("/wakies/settings"),
    [routeur]
  );
  const [workspace, setWorkspace] = useState<WorkspaceState>();
  const [selectedWakie, setSelectedWakie] = useState("");
  const [selectedThread, setSelectedThread] = useState<string>();
  const [view, rawSetView] = useState<WakiesSection>("today");
  const dirtyPage = useRef(false);
  const [spaceId, setSpaceId] = useState("");
  const [pageId, setPageId] = useState<string>();
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [searchPages, setSearchPages] = useState<
    { page: Page; space: WorkspaceState["spaces"][number] }[]
  >([]);
  /** Message visé par une recherche : le fil s'y rend et le met en évidence. */
  const [cibleMessageId, setCibleMessageId] = useState<string | null>(null);
  /**
   * Résultats de la recherche SERVEUR.
   *
   * Les titres se filtrent localement (la liste est déjà chargée) ; le TEXTE
   * des messages, non — il vit en base. La route `/search` le cherche, borné
   * aux 100 derniers messages de chaque conversation, et le dit : c'est une
   * recherche de reprise, pas une indexation complète de l'historique.
   */
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
          // Une recherche en panne laisse la liste locale : elle ne bloque ni
          // la lecture ni la navigation.
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
  const setView = (next: typeof view) => {
    if (
      dirtyPage.current &&
      !window.confirm("Abandonner votre brouillon de page non enregistré ?")
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
  const [dialog, rawSetDialog] = useState<Dialog>();
  /** Fiche sociale ouverte depuis « Mon profil » (tiroir, pas un écran). */
  const [ficheWakie, setFicheWakie] = useState<Wakie>();
  const setDialog = (next: Dialog | undefined) => {
    setMobile(false);
    rawSetDialog(next);
  };
  const [mobile, setMobile] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(initialNavCollapsed);
  // La réduction est un réglage d'affichage : il survit au rechargement, comme
  // la barre de l'hôte, mais sous sa propre clé de cookie.
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
  const messaging = useMessagingNotifications(
    view === "chat" ? selectedThread : undefined
  );
  /** Une notification mène à son fil, puis sort du compteur. */
  const ouvrirNotification = (conversationId: string) => {
    if (!setView("chat")) return;
    const cible = workspace?.conversations.find(
      (conversation) => conversation.id === conversationId
    );
    if (!cible) return;
    setSelectedWakie(cible.wakieId);
    setSelectedThread(cible.id);
    messaging.retirer(cible.id);
  };
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
  const marquerLu = useCallback(
    (conversationId: string) => {
      messaging.retirer(conversationId);
      void refreshData();
    },
    [messaging.retirer, refreshData]
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
  /**
   * L'assistant de configuration s'ouvre tant que le compte n'a pas terminé
   * SA configuration de départ. Il édite le Wakie de départ déjà en base :
   * quitter puis reprendre est donc gratuit, et supprimer ce Wakie fait
   * disparaître l'assistant au lieu de le boucler.
   */
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
  const chooseWakie = (next: Wakie) => {
    if (!setView("chat")) return;
    setSelectedWakie(next.id);
    setSelectedThread(
      workspace?.conversations.find((item) => item.wakieId === next.id)?.id
    );
    setMobile(false);
    setPendingPrompt(undefined);
  };
  const newConversation = async (text?: string) => {
    if (!wakie || !configured || busy) return;
    if (!setView("chat")) return;
    setBusy(true);
    setError("");
    try {
      const next = await api<Conversation>("/conversations", "POST", {
        title: text?.trim().slice(0, 80) || "Une nouvelle réflexion",
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
      <Button
        aria-controls="workspace-sidebar"
        aria-expanded={mobile}
        aria-label="Ouvrir la navigation"
        className="mobile-menu icon-button"
        onClick={() => setMobile(true)}
        variant="ghost"
      >
        <MenuIcon size={21} />
      </Button>
      {mobile && (
        <Button
          aria-label="Fermer la navigation"
          className="nav-scrim"
          onClick={() => setMobile(false)}
          variant="outline"
        />
      )}
      <aside
        aria-label="Navigation de Wakies"
        aria-modal={mobile || undefined}
        className={`sidebar ${mobile ? "open" : ""}`}
        id="workspace-sidebar"
        role={mobile ? "dialog" : undefined}
      >
        {/* Rangée de tête du rail : le sélecteur d'applications, puis les
            notifications et la réduction, à sa droite. Ces trois commandes
            restent praticables quand le rail se réduit en colonne d'icônes. */}
        <div className="rail-actions">
          <AppSwitcherMenu
            align="start"
            currentAppOverride={null}
            side="bottom"
          >
            <Button
              aria-label="Changer d’espace de travail"
              className="wordmark"
              variant="ghost"
            >
              <img
                alt="Wakies"
                className="size-5.5 object-contain shrink-0"
                src="/wakies/logo.png"
              />
              <span className="rail-label">Wakies</span>
            </Button>
          </AppSwitcherMenu>
          <WakiesNotificationBell
            notifications={messaging.notifications}
            onAutoriser={() => void messaging.autoriser()}
            onSelect={ouvrirNotification}
            permission={messaging.permission}
          />
          <Button
            aria-label={navCollapsed ? "Déplier le menu" : "Réduire le menu"}
            className="rail-collapse"
            onClick={basculerNav}
            variant="ghost"
          >
            <PanelLeftIcon size={17} />
          </Button>
        </div>
        <Button
          aria-label="Fermer le menu"
          className="sidebar-close icon-button"
          onClick={() => setMobile(false)}
          variant="ghost"
        >
          <XIcon size={18} />
        </Button>
        <Button
          className="new-chat nav-item"
          disabled={!configured}
          onClick={() => void newConversation()}
          variant="ghost"
        >
          <PlusIcon size={17} />
          <span>Nouvelle conversation</span>
        </Button>
        <div className="wakies-sidebar-search">
          <Input
            aria-label="Rechercher dans Wakies"
            onChange={(event) => setSidebarSearch(event.target.value)}
            placeholder="Rechercher…"
            value={sidebarSearch}
          />
          {sidebarSearch.trim() && workspace && (
            <section
              aria-label="Résultats de recherche"
              className="wakies-search-results"
            >
              {workspace.conversations
                .filter((item) =>
                  item.title
                    .toLocaleLowerCase("fr")
                    .includes(sidebarSearch.trim().toLocaleLowerCase("fr"))
                )
                .map((item) => (
                  <button
                    key={`conversation-${item.id}`}
                    onClick={() => {
                      const owner = workspace.wakies.find(
                        (candidate) => candidate.id === item.wakieId
                      );
                      if (owner) setSelectedWakie(owner.id);
                      setSelectedThread(item.id);
                      setView("chat");
                    }}
                    type="button"
                  >
                    Conversation · {item.title}
                  </button>
                ))}
              {workspace.spaces
                .filter((item) =>
                  item.name
                    .toLocaleLowerCase("fr")
                    .includes(sidebarSearch.trim().toLocaleLowerCase("fr"))
                )
                .map((item) => (
                  <button
                    key={`space-${item.id}`}
                    onClick={() => openPage(item.id)}
                    type="button"
                  >
                    Espace · {item.name}
                  </button>
                ))}
              {workspace.wakies
                .filter((item) =>
                  item.name
                    .toLocaleLowerCase("fr")
                    .includes(sidebarSearch.trim().toLocaleLowerCase("fr"))
                )
                .map((item) => (
                  <button
                    key={`wakie-${item.id}`}
                    onClick={() => chooseWakie(item)}
                    type="button"
                  >
                    Wakie · {item.name}
                  </button>
                ))}
              {searchPages.map(({ page, space }) => (
                <button
                  key={`page-${page.id}`}
                  onClick={() => openPage(space.id, page.id)}
                  type="button"
                >
                  Page · {page.title} ({space.name})
                </button>
              ))}
              {/* Les messages trouvés s'affichent sous les titres : on cherche
                  une phrase, pas un fil — et cliquer ouvre le fil en mettant
                  le message en évidence. */}
              {searchMessages.map((message) => {
                const fil = workspace.conversations.find(
                  (item) => item.id === message.conversationId
                );
                return (
                  <button
                    key={`message-${message.id}`}
                    onClick={() => {
                      const cible = workspace.conversations.find(
                        (item) => item.id === message.conversationId
                      );
                      if (!cible) return;
                      const proprietaire = workspace.wakies.find(
                        (candidat) => candidat.id === cible.wakieId
                      );
                      if (proprietaire) setSelectedWakie(proprietaire.id);
                      setSelectedThread(cible.id);
                      setCibleMessageId(message.id);
                      setView("chat");
                      setMobile(false);
                      setSidebarSearch("");
                    }}
                    type="button"
                  >
                    Message · {message.extrait.slice(0, 80)}
                    {fil ? ` (${fil.title})` : ""}
                  </button>
                );
              })}
              {!workspace.conversations.some((item) =>
                item.title
                  .toLocaleLowerCase("fr")
                  .includes(sidebarSearch.trim().toLocaleLowerCase("fr"))
              ) &&
                !workspace.spaces.some((item) =>
                  item.name
                    .toLocaleLowerCase("fr")
                    .includes(sidebarSearch.trim().toLocaleLowerCase("fr"))
                ) &&
                !workspace.wakies.some((item) =>
                  item.name
                    .toLocaleLowerCase("fr")
                    .includes(sidebarSearch.trim().toLocaleLowerCase("fr"))
                ) &&
                !searchPages.length && <p>Aucun résultat.</p>}
            </section>
          )}
        </div>
        <div className="sidebar-sections">
          <WorkspaceNavigation onSelect={setView} section={view} />
        </div>
        <div className="spaces-heading nav-label">
          WAKIES
          <Button
            aria-label="Créer un Wakie"
            className="icon-button"
            onClick={() =>
              setDialog(
                workspace.spaces[0]
                  ? { spaceId: workspace.spaces[0].id, type: "wakie" }
                  : { type: "space" }
              )
            }
            variant="ghost"
          >
            <PlusIcon size={14} />
          </Button>
        </div>
        <nav aria-label="Wakies" className="wakies-nav">
          {workspace.wakies.map((item) => (
            <div className="wakie-nav-row" key={item.id}>
              <Button
                aria-current={
                  wakie.id === item.id && view === "chat" ? "page" : undefined
                }
                className={`wakie-nav ${wakie.id === item.id && view === "chat" ? "active" : ""}`}
                onClick={() => chooseWakie(item)}
                variant="outline"
              >
                <Mascot
                  avatar={item.avatar}
                  decorative
                  identity={item.id}
                  name={item.name}
                  small
                />
                <span>{item.name}</span>
              </Button>
              <Button
                aria-label={`Personnaliser ${item.name}`}
                className="icon-button wakie-settings"
                onClick={() =>
                  setDialog({
                    spaceId: item.spaceId,
                    type: "wakie",
                    wakie: item,
                  })
                }
                variant="ghost"
              >
                <EllipsisVerticalIcon size={15} />
              </Button>
            </div>
          ))}
        </nav>
        <div className="spaces-heading nav-label">
          ESPACES
          <Button
            aria-label="Créer un Espace"
            className="icon-button"
            onClick={() => setDialog({ type: "space" })}
            variant="ghost"
          >
            <PlusIcon size={14} />
          </Button>
        </div>
        <nav aria-label="Espaces" className="spaces-nav">
          {workspace.spaces.map((space) => (
            <SpaceNav
              active={view === "space" && spaceId === space.id}
              key={space.id}
              onChanged={() => void refresh()}
              onOpen={(id) => openPage(space.id, id)}
              onSupprime={(id) => {
                // L'écran ouvert vient de cesser d'exister : y rester
                // afficherait un espace fantôme jusqu'au prochain clic.
                if (view === "space" && spaceId === id) setView("today");
              }}
              pageId={pageId}
              space={space}
            />
          ))}
        </nav>
        {configured ? (
          <ConversationList
            local={workspace.conversations}
            onChanged={refresh}
            onNew={() => void newConversation()}
            onSelect={(id: string) => {
              if (!setView("chat")) return;
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
        ) : null}
        <div className="sidebar-bottom">
          <Button
            className={`nav-item ${view === "memories" ? "active" : ""}`}
            onClick={() => {
              setView("memories");
              setMobile(false);
            }}
            variant="outline"
          >
            <BookOpenIcon size={17} />
            <span>Mémoires</span>
            <small>{state.memories.length}</small>
          </Button>
          <Button
            className="nav-item"
            onClick={() => ouvrirReglages()}
            variant="ghost"
          >
            <Settings2Icon size={17} />
            <span>Réglages et configuration</span>
          </Button>
          {/* La version vient du paquet, pas d'un dépôt externe : le port est
              intégré à mAI et n'est plus un modèle à code source ouvert à installer. */}
          <div className="version">
            HÉBERGÉ PAR MAI <span>v0.1</span>
          </div>
        </div>
      </aside>
      <div className="workspace" inert={mobile ? true : undefined}>
        <header className="topbar">
          {view === "chat" ? (
            <Button
              aria-label={`Personnaliser ${wakie.name}`}
              className="muse-persona"
              onClick={() => setDialog({ spaceId, type: "wakie", wakie })}
              type="button"
              variant="ghost"
            >
              <Mascot
                avatar={wakie.avatar}
                identity={wakie.id}
                name={wakie.name}
                small
              />
              <strong>{wakie.name}</strong>
              <small>
                {state.settings.paused ? "En pause" : "À votre écoute"}
              </small>
            </Button>
          ) : (
            <div className="muse-page-title">
              <span>WAKIES</span>
              <h1>
                {view === "today"
                  ? "Aujourd’hui"
                  : view === "tasks"
                    ? "Activité"
                    : view === "ideas"
                      ? "Idées"
                      : view === "goals"
                        ? "Objectifs"
                        : view === "memories"
                          ? "Mémoires"
                          : view === "profil"
                            ? "Mon profil"
                            : "Espaces"}
              </h1>
            </div>
          )}
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
                    : view === "profil"
                      ? "Mon profil"
                      : "Mémoires"}
            </strong>
          </div>
          <div className="top-actions">
            {/* Le badge disait « HÉBERGÉ LOCALEMENT », ce qui est FAUX :
                l'espace est servi par mAI, sur les serveurs mAI, avec la
                session et les quotas du compte. C'est une information
                affichée, pas un coussin décoratif : elle doit être juste. */}
            <span className="mode-badge">
              {configured ? "HÉBERGÉ PAR MAI" : "CONFIGURATION REQUISE"}
            </span>
            <Button
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
              variant="outline"
            >
              {state.settings.paused ? (
                <PlayIcon size={14} />
              ) : (
                <PauseIcon size={14} />
              )}
              <span>{state.settings.paused ? "Reprendre" : "Pause"}</span>
            </Button>
            <Button
              aria-expanded={pane}
              aria-label={
                pane ? "Masquer l’ordinateur" : "Afficher l’ordinateur"
              }
              className="icon-button"
              onClick={() => setPane(!pane)}
              variant="ghost"
            >
              <MonitorIcon size={18} />
            </Button>
          </div>
        </header>
        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <Button
              aria-label="Masquer l’erreur"
              className="icon-button"
              onClick={() => setError("")}
              variant="ghost"
            >
              <XIcon size={16} />
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
            onOpenConversation={(conversation) => {
              const owner = workspace.wakies.find(
                (candidate) => candidate.id === conversation.wakieId
              );
              if (owner) {
                chooseWakie(owner);
                setSelectedThread(conversation.id);
                setView("chat");
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
                  voiceReady={workspace.setup.voice}
                  wakie={wakie}
                  wakies={workspace.wakies}
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
                    <Button
                      className="text-button"
                      onClick={() =>
                        setDialog({
                          spaceId: wakie.spaceId,
                          type: "wakie",
                          wakie,
                        })
                      }
                      variant="outline"
                    >
                      Modifier le spécialiste <EllipsisVerticalIcon size={14} />
                    </Button>
                  </div>
                  {!configured && (
                    <div className="setup-card">
                      <span className="setup-icon">
                        <Settings2Icon size={20} />
                      </span>
                      <div>
                        <strong>Terminez la configuration</strong>
                        <p>
                          Choisissez un nom, une mascotte et des consignes de
                          rôle pour ce Wakie. Vos Espaces et vos préférences
                          sont déjà prêts.
                        </p>
                        <Button
                          className="text-button"
                          onClick={() =>
                            setDialog({
                              spaceId: wakie.spaceId,
                              type: "wakie",
                              wakie,
                            })
                          }
                          type="button"
                          variant="outline"
                        >
                          Personnaliser ce Wakie
                          <ArrowUpRightIcon size={12} />
                        </Button>
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
                    <Textarea
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
                        <MessageCircleIcon size={14} />
                        Texte et appels, une seule conversation
                      </span>
                      <Button
                        aria-label="Démarrer la conversation"
                        className="send-button"
                        disabled={!configured || busy || !prompt.trim()}
                        type="submit"
                        variant="solid"
                      >
                        <ArrowUpIcon size={19} />
                      </Button>
                    </div>
                  </form>
                  <div className="starter-suggestions">
                    {[
                      "Aidez-moi à réfléchir à cela",
                      "Étudier une page publique",
                      "Établir un plan que je puisse suivre",
                    ].map((text) => (
                      <Button
                        disabled={!configured}
                        key={text}
                        onClick={() => setPrompt(text)}
                        variant="outline"
                      >
                        {text}
                        <ArrowUpRightIcon size={12} />
                      </Button>
                    ))}
                  </div>
                  {/* La ligne affichait « Slack · not_configured » avec un
                      voyant. C'est trompeur sur deux points : Slack n'est pas
                      branché dans le port, et un voyant d'état ne veut rien
                      dire pour l'utilisateur qui n'a jamais demandé Slack.
                      On affiche ce qui est réellement branché. */}
                  <div className="connection-note">
                    <span
                      className={`online-dot ${workspace.setup.model ? "" : "off"}`}
                    />
                    Modèle servi par votre compte mAI
                    <Button
                      className="text-button"
                      onClick={() => ouvrirReglages()}
                      variant="outline"
                    >
                      Détails de la configuration
                    </Button>
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
            onChanged={refresh}
            onOuvrirWakie={(wakieId, conversationId) => {
              if (conversationId) {
                setSelectedWakie(wakieId);
                setSelectedThread(conversationId);
                setView("chat");
                return;
              }
              const cible = workspace.wakies.find(
                (candidat) => candidat.id === wakieId
              );
              if (cible) chooseWakie(cible);
            }}
          />
        ) : (
          <main className="main-content">
            <div className="page-heading">
              <div>
                <span className="eyebrow">VOTRE ESPACE DE TRAVAIL</span>
                <h1>{view === "memories" ? "Mémoires" : "Un peu de suivi."}</h1>
                <p>
                  {view === "memories"
                    ? "Les préférences que vous choisissez de partager avec vos Wakies."
                    : "Les tours planifiés s’exécutent sur le serveur dans leur conversation d’origine."}
                </p>
              </div>
              {view === "memories" && (
                <Button
                  className="primary"
                  onClick={() => setDialog({ type: "memory" })}
                  variant="solid"
                >
                  <PlusIcon size={15} />
                  Ajouter une mémoire
                </Button>
              )}
            </div>
            {view === "memories" ? (
              <>
                <div className="memory-grid">
                  {state.memories.map((memory) => (
                    <article className="memory-card" key={memory.id}>
                      <BookOpenIcon size={18} />
                      <p>{memory.text}</p>
                      <div>
                        <small>
                          {state.settings.memoryAllowed
                            ? "Disponible pour les Wakies autorisés"
                            : "Utilisation des mémoires désactivée"}
                        </small>
                        <Button
                          aria-label="Modifier la mémoire"
                          className="icon-button"
                          onClick={() => setDialog({ memory, type: "memory" })}
                          variant="ghost"
                        >
                          <EllipsisVerticalIcon size={17} />
                        </Button>
                        <Button
                          aria-label="Supprimer la mémoire"
                          className="icon-button"
                          onClick={() =>
                            void mutate(`/memories/${memory.id}`, "DELETE", {})
                          }
                          variant="ghost"
                        >
                          <Trash2Icon size={15} />
                        </Button>
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
                  <SearchIcon size={16} />
                  <Input
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
                    <TimerIcon size={32} />
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
                        if (value > 0 && value < 1) {
                          setError(
                            "L’intervalle doit être d’au moins 1 minute."
                          );
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
                    <small>
                      {taskDetail.runs.length} exécution
                      {taskDetail.runs.length > 1 ? "s" : ""} enregistrée
                      {taskDetail.runs.length > 1 ? "s" : ""}
                    </small>
                  </section>
                )}
              </>
            )}
          </main>
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
