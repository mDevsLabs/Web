import { cookies } from "next/headers";
import Script from "next/script";
import { Suspense } from "react";
import { AppSidebar } from "@/components/chat/app-sidebar";
import { DataStreamProvider } from "@/components/chat/data-stream-provider";
import { NotificationPermissionGate } from "@/components/chat/notification-permission-gate";
import { ChatShell } from "@/components/chat/shell";
import {
  RouteSkeleton,
  SidebarSkeleton,
} from "@/components/common/route-skeleton";
import { OnboardingTutorial } from "@/components/onboarding/onboarding-tutorial";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ActiveChatProvider } from "@/hooks/use-active-chat";
import { AgentModeProvider } from "@/hooks/use-agent-mode";
import { SharedDraftProvider } from "@/hooks/use-shared-draft";
import { getMaiUser } from "@/lib/auth/session";
import { MAI_SESSION_COOKIE } from "@/lib/constants";

// Coque affichée pendant la résolution de session du layout.
function WorkspaceSkeleton() {
  return (
    <div className="flex h-dvh bg-sidebar">
      <div className="w-64 shrink-0 border-r border-sidebar-border">
        <SidebarSkeleton />
      </div>
      <div className="min-w-0 flex-1 bg-background">
        <RouteSkeleton cards={2} />
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="lazyOnload"
      />
      <DataStreamProvider>
        {/*
          Le squelette porte la silhouette complète — barre latérale et
          contenu — pour que la navigation n'ait pas l'air de charger deux
          fois : d'abord la coque, puis la page.
        */}
        <Suspense fallback={<WorkspaceSkeleton />}>
          <SidebarShell>{children}</SidebarShell>
        </Suspense>
      </DataStreamProvider>
    </>
  );
}

async function SidebarShell({ children }: { children: React.ReactNode }) {
  const [user, cookieStore] = await Promise.all([getMaiUser(), cookies()]);
  const isCollapsed = cookieStore.get("sidebar_state")?.value !== "true";
  // Un cookie de session présent alors qu'aucun utilisateur n'a pu être
  // résolu : la session est morte (expirée, révoquée, ou signée avec une clé
  // différente de celle du backend). L'interface doit proposer une sortie —
  // sans elle, l'utilisateur est coincé dans l'application, sans bouton de
  // déconnexion ni accès à /login.
  const hasDeadSession =
    !user && Boolean(cookieStore.get(MAI_SESSION_COOKIE)?.value);
  const rawModelCookie = cookieStore.get("chat-model")?.value;
  const initialModelId = rawModelCookie
    ? decodeURIComponent(rawModelCookie)
    : undefined;
  const rawAgentCookie = cookieStore.get("agent-id")?.value;
  const initialAgentId = rawAgentCookie
    ? decodeURIComponent(rawAgentCookie)
    : undefined;

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      {/*
        Le brouillon partagé est le provider le plus externe : il doit
        surplomber `<ChatShell />` — le point de bascule Chat ⇄ Agent, où les
        deux compositeurs se montent et se démontent — ET
        `ActiveChatProvider`, dont l'effet de purge de l'input a lui aussi
        besoin de son signal d'exception. Un provider sous l'un des deux ne
        pourrait pas lui fournir ce signal : le contexte descend, jamais vers le
        haut. Voir hooks/use-shared-draft.tsx.
      */}
      <SharedDraftProvider>
        <ActiveChatProvider
          initialAgentId={initialAgentId}
          initialModelId={initialModelId}
        >
          <AgentModeProvider>
            <AppSidebar hasDeadSession={hasDeadSession} user={user} />
            <SidebarInset className="flex flex-col has-[.site-root]:bg-white has-[.site-root]:[transform:none]">
              <Suspense fallback={<div className="flex h-dvh" />}>
                <ChatShell />
              </Suspense>
              <div className="flex flex-1 flex-col">
                <div className="flex-1">{children}</div>
              </div>
              <OnboardingTutorial />
              <NotificationPermissionGate />
            </SidebarInset>
          </AgentModeProvider>
        </ActiveChatProvider>
      </SharedDraftProvider>
    </SidebarProvider>
  );
}
