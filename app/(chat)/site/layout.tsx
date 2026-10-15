import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "@mdevs/ui/styles.css";
import "@/components/site/site.css";
import { AuthProvider } from "@/components/site/auth-provider";
import { BackToTop } from "@/components/site/back-to-top";
import { SiteFooter } from "@/components/site/footer";
import { LoginInviteBanner } from "@/components/site/login-invite-banner";
import { MotionProvider } from "@/components/site/motion-provider";
import { Navbar } from "@/components/site/navbar";
import { OnboardingProvider } from "@/components/site/onboarding/onboarding-provider";
import { StatusWidget } from "@/components/site/status-widget";
import { CookieBanner, ToastProvider } from "@/components/site/ui/index";
import { getMaiSessionToken, getMaiUser } from "@/lib/auth/session";
import { getChangelogs } from "@/lib/site/changelog";
import { getNewsArticles } from "@/lib/site/news";

export const instant = false;

export const metadata: Metadata = {
  description:
    "Portail de suivi des versions, documentation et outils d'intelligence artificielle de mDevsLabs.",
  icons: {
    apple: "/site/logo.png",
    icon: "/site/favicon.ico",
    shortcut: "/site/favicon.ico",
  },
  title: {
    default: "mAI - Just build",
    template: "%s | mAI - Just build",
  },
};

export const viewport: Viewport = {
  initialScale: 1,
  themeColor: "#ffffff",
  viewportFit: "cover",
  width: "device-width",
};

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getMaiSessionToken();
  const user = token ? await getMaiUser(token) : null;
  const changelogs = getChangelogs();
  const news = getNewsArticles();

  // Mapping AuthUser
  const initialUser = user
    ? {
        avatarUrl: user.avatarUrl ?? undefined,
        email: user.email,
        id: user.id,
        phone: user.phone,
        tier: user.tier,
        username: user.username,
      }
    : null;

  return (
    <div
      className="site-root md-root min-h-screen flex flex-col relative bg-white text-slate-900 w-full overflow-x-hidden selection:bg-purple-100 selection:text-purple-900"
      data-md-theme="light"
    >
      <MotionProvider>
        <ToastProvider>
          <AuthProvider initialToken={token} initialUser={initialUser}>
            <OnboardingProvider>
              <Navbar changelogs={changelogs} news={news} />
              <CookieBanner />

              {/* Background Orbs décoratives optimisées GPU */}
              <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 -z-10 overflow-hidden contain-paint"
              >
                <div className="absolute -top-24 -left-24 h-96 w-96 transform-gpu will-change-transform animate-orb-a">
                  <div className="h-full w-full rounded-full bg-purple-400/20 blur-[90px]" />
                </div>
                <div className="absolute top-1/3 -right-24 h-80 w-80 transform-gpu will-change-transform animate-orb-b">
                  <div className="h-full w-full rounded-full bg-blue-400/20 blur-[80px]" />
                </div>
                <div className="absolute -bottom-32 left-1/4 h-80 w-80 transform-gpu will-change-transform animate-orb-c [animation-delay:-24s]">
                  <div className="h-full w-full rounded-full bg-emerald-300/20 blur-[80px]" />
                </div>
              </div>

              <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-12 md:pb-32 pt-24 sm:pt-28 z-10">
                {/* L’invitation vient après l’espace réservé à la navigation fixe. */}
                <Suspense fallback={null}>
                  <LoginInviteBanner />
                </Suspense>
                {children}
              </main>

              <SiteFooter />

              {/* Ligne décorative en bas de page */}
              <div
                aria-hidden="true"
                className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-400 z-50 pointer-events-none"
              />
            </OnboardingProvider>
          </AuthProvider>
        </ToastProvider>
        <BackToTop />
        <StatusWidget />
      </MotionProvider>
    </div>
  );
}
