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
import type { Page } from "@/lib/wakies/pages";
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
  searchMessages: Array<{
    conversationId: string;
    extrait: string;
    id: string;
    role: string;
  }>;
  searchPages: { page: Page; space: WorkspaceState["spaces"][number] }[];
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
  searchPages,
  searchMessages,
  setDialog,
  refresh,
  pageId,
  spaceId,
  ouvrirReglages,
}) => {
  const wakie =
    workspace.wakies.find((candidate) => candidate.id === selectedWakie) ??
    workspace.wakies[0];

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
              {workspace.conversations
                .filter((item) =>
                  item.title
                    .toLocaleLowerCase("fr")
                    .includes(sidebarSearch.trim().toLocaleLowerCase("fr"))
                )
                .map((item) => (
                  <button
                    key={`conversation-${item.id}`}
                    onClick={async () => {
                      if (!(await setView("chat"))) return;
                      const owner = workspace.wakies.find(
                        (candidate) => candidate.id === item.wakieId
                      );
                      if (owner) setSelectedWakie(owner.id);
                      setSelectedThread(item.id);
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
              {searchMessages.map((message) => {
                const fil = workspace.conversations.find(
                  (item) => item.id === message.conversationId
                );
                return (
                  <button
                    key={`message-${message.id}`}
                    onClick={async () => {
                      const cible = workspace.conversations.find(
                        (item) => item.id === message.conversationId
                      );
                      if (!cible) return;
                      const proprietaire = workspace.wakies.find(
                        (candidat) => candidat.id === cible.wakieId
                      );
                      if (!(await setView("chat"))) return;
                      if (proprietaire) setSelectedWakie(proprietaire.id);
                      setSelectedThread(cible.id);
                      setCibleMessageId(message.id);
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
