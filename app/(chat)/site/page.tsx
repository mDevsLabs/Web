import { CommunitySection } from "@/components/site/home/community-section";
import { FeaturesSection } from "@/components/site/home/features-section";
import { HeroSection } from "@/components/site/home/hero-section";
import { HomeWidgetsGrid } from "@/components/site/home/home-widgets-grid";
import { ModelsShowcase } from "@/components/site/home/models-showcase";
import { NewsAndUpdates } from "@/components/site/home/news-and-updates";
import { getNewsArticles } from "@/lib/site/news";

export default async function Home() {
  const news = getNewsArticles();

  return (
    <div className="flex flex-col gap-6 md:gap-12 w-full relative z-10">
      {/* 1. Hero Section Unifié */}
      <HeroSection />

      {/* 2. Grille de Widgets Interactifs & Animés (Agent, Terminal, Modèles, Santé) */}
      <HomeWidgetsGrid />

      {/* 3. Showcase des Modèles Phares (mAI-2 & mAI-1.5) */}
      <ModelsShowcase />

      {/* 4. Capacités Clés & Valeur Produit */}
      <FeaturesSection />

      {/* 5. Activité Récente (3 Derniers Articles de Blog) */}
      <NewsAndUpdates news={news} />

      {/* 6. Communauté & Bandeau Call to Action */}
      <CommunitySection />
    </div>
  );
}
