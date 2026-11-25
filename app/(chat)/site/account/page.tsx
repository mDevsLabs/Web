"use client";

import { Loader2Icon as Loader2, LogOutIcon as LogOut } from "@mdevs/icons";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  ACCOUNT_SECTION_IDS,
  AccountNavigation,
  type AccountSectionId,
} from "@/components/site/account/account-navigation";
import { AudioUsageSection } from "@/components/site/account/audio-usage-section";
import { CloudStorageSection } from "@/components/site/account/cloud-storage-section";
import { DevicesSection } from "@/components/site/account/devices-section";
import { ImageUsageSection } from "@/components/site/account/image-usage-section";
import { MaiUsageSection } from "@/components/site/account/mai-usage-section";
import { ProfileSection } from "@/components/site/account/profile-section";
import { useAccountDashboard } from "@/components/site/account/use-account-dashboard";
import { useAuth } from "@/components/site/auth-provider";
import { useSiteRouter as useRouter } from "@/components/site/router";

export default function AccountPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const dashboard = useAccountDashboard();

  const [activeSection, setActiveSection] = useState<string>("profil");

  const scrollTo = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    const y = element.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ behavior: "smooth", top: y });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      let current: AccountSectionId = "profil";
      for (const section of ACCOUNT_SECTION_IDS) {
        const element = document.getElementById(section);
        if (element && element.getBoundingClientRect().top <= 150) {
          current = section;
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (dashboard.authLoading || !dashboard.isAuthenticated) return;
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;

    const timer = window.setTimeout(() => scrollTo(hash), 150);
    return () => window.clearTimeout(timer);
  }, [dashboard.authLoading, dashboard.isAuthenticated, scrollTo]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) scrollTo(hash);
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [scrollTo]);

  useEffect(() => {
    if (!dashboard.authLoading && !dashboard.isAuthenticated) {
      router.replace("/account/login?next=%2Faccount");
    }
  }, [dashboard.authLoading, dashboard.isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    toast.success("Déconnecté");
    router.push("/account/login");
  };

  const handleRefreshAll = async () => {
    const result = await dashboard.refreshAll();
    if (result.usageResult) toast.success("Quotas actualisés");
    else toast.error("Session expirée");
  };

  const handleRefreshImages = async () => {
    try {
      await dashboard.refreshImages();
      toast.success("Génération d'images actualisée !");
    } catch {
      toast.error("Erreur lors de l'actualisation des images.");
    }
  };

  const handleRefreshAudio = async () => {
    try {
      await dashboard.refreshAudio();
      toast.success("Création d'audio actualisée !");
    } catch {
      toast.error("Erreur lors de l'actualisation de l'audio.");
    }
  };

  const handleRefreshStorage = async () => {
    try {
      const result = await dashboard.refreshStorage();
      if (result) toast.success("Quota de stockage actualisé");
      else toast.error("Erreur lors de l'actualisation du stockage");
    } catch {
      toast.error("Erreur serveur lors du rafraîchissement.");
    }
  };

  if (dashboard.authLoading || !dashboard.isAuthenticated || !dashboard.user) {
    return (
      <div className="flex justify-center py-20 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Mon compte mAI
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Gérez vos informations personnelles, forfaits et quotas.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-red-200 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition-colors shrink-0"
          onClick={handleLogout}
          type="button"
        >
          <LogOut className="w-4 h-4" /> Se déconnecter
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <AccountNavigation
          activeSection={activeSection}
          onNavigate={scrollTo}
        />

        <div className="flex-1 space-y-8">
          <ProfileSection />

          <ImageUsageSection
            onRefresh={handleRefreshImages}
            refreshing={dashboard.refreshingImages}
            tier={dashboard.user.tier}
            usage={dashboard.imageUsage}
          />

          <AudioUsageSection
            onRefresh={handleRefreshAudio}
            refreshing={dashboard.refreshingAudio}
            tier={dashboard.user.tier}
            usage={dashboard.audioUsage}
          />

          <MaiUsageSection
            onRefresh={handleRefreshAll}
            percent={dashboard.maiPercent}
            refreshing={dashboard.refreshing}
            tier={dashboard.user.tier}
            usage={dashboard.usage}
          />

          <CloudStorageSection
            onRefresh={handleRefreshStorage}
            refreshing={dashboard.refreshingStorage}
            tier={dashboard.user.tier}
            usage={dashboard.cloudStorage}
          />

          <DevicesSection />
        </div>
      </div>
    </div>
  );
}
