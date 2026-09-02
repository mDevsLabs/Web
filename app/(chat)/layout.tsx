import { cookies } from "next/headers";
import Script from "next/script";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { AppSidebar } from "@/components/chat/app-sidebar";
import { DataStreamProvider } from "@/components/chat/data-stream-provider";
import { ChatShell } from "@/components/chat/shell";
import { OnboardingTutorial } from "@/components/onboarding/onboarding-tutorial";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ActiveChatProvider } from "@/hooks/use-active-chat";
import { getMaiUser } from "@/lib/auth/session";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="lazyOnload"
      />
      <DataStreamProvider>
        <Suspense fallback={<div className="flex h-dvh bg-sidebar" />}>
          <SidebarShell>{children}</SidebarShell>
        </Suspense>
      </DataStreamProvider>
    </>
  );
}

async function SidebarShell({ children }: { children: React.ReactNode }) {
  const [user, cookieStore] = await Promise.all([getMaiUser(), cookies()]);
  const isCollapsed = cookieStore.get("sidebar_state")?.value !== "true";

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <ActiveChatProvider>
        <AppSidebar user={user} />
        <SidebarInset className="flex flex-col">
          <Toaster
            position="top-center"
            theme="system"
            toastOptions={{
              className:
                "!bg-card !text-foreground !border-border/50 !shadow-[var(--shadow-float)]",
            }}
          />
          <Suspense fallback={<div className="flex h-dvh" />}>
            <ChatShell />
          </Suspense>
          <div className="flex flex-1 flex-col">
            <div className="flex-1">{children}</div>
          </div>
          <OnboardingTutorial />
        </SidebarInset>
      </ActiveChatProvider>
    </SidebarProvider>
  );
}
