"use client";

import { PlusIcon } from "@mdevs/icons/controls/plus";
import { Settings2Icon } from "@mdevs/icons/controls/settings-2";
import { XIcon } from "@mdevs/icons/controls/x";
import { BookOpenIcon } from "@mdevs/icons/files/book-open";
import { EllipsisVerticalIcon } from "@mdevs/icons/interface/ellipsis-vertical";
import { MenuIcon } from "@mdevs/icons/interface/menu";
import { PanelLeftIcon } from "@mdevs/icons/interface/panel-left";
import { Button } from "@mdevs/ui/primitives/button";
import { Input } from "@mdevs/ui/primitives/input";
import type React from "react";
import { AppSwitcherMenu } from "@/components/common/app-switcher";
import { ConversationList } from "@/components/wakies/ConversationList";
import { Mascot } from "@/components/wakies/Mascot";
import { SpaceNav } from "@/components/wakies/SpaceNav";
import type { Dialog } from "@/components/wakies/WorkspaceDialog";
import {
  type WakiesSection,
  WorkspaceNavigation,
} from "@/components/wakies/WorkspaceNavigation";
import type { State, Wakie, WorkspaceState } from "@/lib/wakies/shared/types";

export interface WorkspaceSidebarProps {
  basculerNav: () => void;
  chooseWakie: (w: Wakie) => void;
  configured: boolean;
  mobile: boolean;
  navCollapsed: boolean;
  newConversation: () => Promise<void>;
  openPage: (space: string, page?: string) => void;
  ouvrirReglages: () => void;
  pageId?: string;
  refresh: () => Promise<void>;
  /**
   * Les résultats de la recherche, déjà filtrés par le serveur.
   *
   * Une seule liste pour toutes les surfaces : le rail ne filtre plus rien
   * lui-même, donc il ne peut plus afficher un résultat que la base
   * ne contient pas.
   */
  searchResults: Array<{
    conversationId?: string;
    href: string;
    id: string;
    kind:
      | "conversation"
      | "memory"
      | "message"
      | "page"
      | "space"
      | "task"
      | "wakie";
    messageId?: string;
    pageId?: string;
    spaceId?: string;
    subtitle?: string;
    title: string;
    wakieId?: string;
  }>;
  selectedThread?: string;
  selectedWakie: string;
  setCibleMessageId: (id: string | null) => void;
  setDialog: (d: Dialog | undefined) => void;
  setMobile: (val: boolean) => void;
  setSelectedThread: (id: string | undefined) => void;
  setSelectedWakie: (id: string) => void;
  setSidebarSearch: (val: string) => void;
  setView: (section: WakiesSection) => Promise<boolean>;
  sidebarSearch: string;
  spaceId: string;
  state: State;
  view: WakiesSection;
  workspace: WorkspaceState;
}

/**
 * Le LIBELLÉ de chaque type de résultat.
 *
 * Le rail ne connaît pas les tables : il connaît des SURFACES, et chaque
 * surface a son nom. « Conversation », « Page », « Espace », « Wakie »,
 * « Message », « Mémoire », « Tâche » — les mots que l'utilisateur utilise
 * déjà dans l'application.
 */
const LIBELLE_SURFACE: Record<string, string> = {
  conversation: "Conversation",
  memory: "Mémoire",
  message: "Message",
  page: "Page",
  space: "Espace",
  task: "Tâche",
  wakie: "Wakie",
};

/**
 * L'ORDRE des surfaces dans les résultats.
 *
 * Ce n'est pas l'ordre alphabétique : on cherche d'abord ce qu'on cherche
 * le plus souvent — une conversation, un message, une page — et les
 * surfaces d'organisation (Espace, Wakie) viennent ensuite.
 */
const ORDRE_SURFACE = [
  "conversation",
  "message",
  "page",
  "wakie",
  "space",
  "task",
  "memory",
] as const;

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  mobile,
  setMobile,
  navCollapsed,
  basculerNav,
  configured,
  newConversation,
  sidebarSearch,
  setSidebarSearch,
  workspace,
  state,
  view,
  setView,
  selectedWakie,
  setSelectedWakie,
  selectedThread,
  setSelectedThread,
  setCibleMessageId,
  chooseWakie,
  openPage,
  searchResults,
  setDialog,
  refresh,
  pageId,
  spaceId,
  ouvrirReglages,
}) => {
  const wakie =
    workspace.wakies.find((candidate) => candidate.id === selectedWakie) ??
    workspace.wakies[0];

  /**
   * Les résultats, GROUPÉS par surface et dans l'ordre d'usage.
   *
   * Le regroupement est fait ici, à l'affichage, et non par le serveur :
   * le serveur rend des résultats, le rail décide comment les montrer. Une
   * section « Message (3) » est plus lisible qu'une liste mêlée.
   */
  const resultatsParSurface = ORDRE_SURFACE.map((kind) => ({
    hits: searchResults.filter((resultat) => resultat.kind === kind),
    kind,
  })).filter((groupe) => groupe.hits.length > 0);

  return (
    <>
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
                alt=""
                className="size-5.5 object-contain shrink-0"
                src="/wakies/logo.png"
              />
              <span className="rail-label">Wakies</span>
            </Button>
          </AppSwitcherMenu>
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
              {resultatsParSurface.map((groupe) => (
                <div className="wakies-search-group" key={groupe.kind}>
                  <p className="wakies-search-group-label">
                    {LIBELLE_SURFACE[groupe.kind]} ({groupe.hits.length})
                  </p>
                  {groupe.hits.map((resultat) => (
                    <button
                      key={resultat.id}
                      onClick={async () => {
                        setMobile(false);
                        setSidebarSearch("");
                        if (resultat.kind === "message") {
                          // Un message : on ouvre le fil qui le contient et
                          // on le vise, pour qu'il soit mis en évidence.
                          const cible = workspace.conversations.find(
                            (item) => item.id === resultat.conversationId
                          );
                          if (!cible) return;
                          const proprietaire = workspace.wakies.find(
                            (candidat) => candidat.id === cible.wakieId
                          );
                          if (!(await setView("chat"))) return;
                          if (proprietaire) setSelectedWakie(proprietaire.id);
                          setSelectedThread(cible.id);
                          setCibleMessageId(resultat.messageId ?? null);
                          return;
                        }
                        if (resultat.kind === "conversation") {
                          const cible = workspace.conversations.find(
                            (item) => item.id === resultat.conversationId
                          );
                          if (!(await setView("chat"))) return;
                          if (cible) {
                            const owner = workspace.wakies.find(
                              (candidate) => candidate.id === cible.wakieId
                            );
                            if (owner) setSelectedWakie(owner.id);
                            setSelectedThread(cible.id);
                          }
                          return;
                        }
                        if (resultat.kind === "space") {
                          if (resultat.spaceId) openPage(resultat.spaceId);
                          return;
                        }
                        if (resultat.kind === "page") {
                          if (resultat.spaceId)
                            openPage(resultat.spaceId, resultat.pageId);
                          return;
                        }
                        if (resultat.kind === "wakie") {
                          const wakieTrouve = workspace.wakies.find(
                            (item) => item.id === resultat.wakieId
                          );
                          if (wakieTrouve) chooseWakie(wakieTrouve);
                          return;
                        }
                        // Mémoire et tâche : le rail n'a pas d'écran dédié
                        // dans la barre latérale ; on ouvre la section.
                        if (resultat.kind === "memory") {
                          await setView("memories");
                          return;
                        }
                        await setView("tasks");
                      }}
                      type="button"
                    >
                      <span className="wakies-search-group-kind">
                        {LIBELLE_SURFACE[resultat.kind]}
                      </span>
                      <span className="wakies-search-group-title">
                        {resultat.title}
                      </span>
                      {resultat.subtitle ? (
                        <span className="wakies-search-group-subtitle">
                          {resultat.subtitle.slice(0, 80)}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              ))}
              {resultatsParSurface.length === 0 && <p>Aucun résultat.</p>}
            </section>
          )}
        </div>
        {/* Section WAKIES en haut de la barre latérale */}
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
                  wakie?.id === item.id && view === "chat" ? "page" : undefined
                }
                className={`wakie-nav ${wakie?.id === item.id && view === "chat" ? "active" : ""}`}
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
        <div className="sidebar-sections">
          <WorkspaceNavigation onSelect={setView} section={view} />
        </div>
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
                if (view === "space" && spaceId === id) void setView("today");
              }}
              pageId={pageId}
              space={space}
            />
          ))}
        </nav>
        {configured && wakie ? (
          <ConversationList
            local={workspace.conversations}
            onChanged={refresh}
            onNew={() => void newConversation()}
            onSelect={async (id: string) => {
              if (!(await setView("chat"))) return;
              const conversation = workspace.conversations.find(
                (item) => item.id === id
              );
              if (conversation) setSelectedWakie(conversation.wakieId);
              setSelectedThread(id);
              await setView("chat");
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
            onClick={async () => {
              await setView("memories");
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
          <div className="version">
            HÉBERGÉ PAR MAI <span>v0.1</span>
          </div>
        </div>
      </aside>
    </>
  );
};
