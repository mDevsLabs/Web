import { getNewsArticles } from "@/lib/news";
import { HeroSection } from "@/components/home/hero-section";
import { HomeWidgetsGrid } from "@/components/home/home-widgets-grid";
import { ModelsShowcase } from "@/components/home/models-showcase";
import { FeaturesSection } from "@/components/home/features-section";
import { NewsAndUpdates } from "@/components/home/news-and-updates";
import { CommunitySection } from "@/components/home/community-section";

export default async function Home() {
  const news = getNewsArticles();

  return (
    <div className="flex flex-col gap-6 md:gap-12 w-full relative z-10">
      {/* 1. Hero Section Unifié */}
      <HeroSection />

      {/* 2. Grille de Widgets Interactifs & Animés */}
      <HomeWidgetsGrid />

      {/* 3. Showcase des Modèles Phares (mAI-2 & mAI-1.5) */}
      <ModelsShowcase />

      {/* 4. Capacités Clés */}
      <FeaturesSection />

      {/* 5. Activité Récente */}
      <NewsAndUpdates news={news} />

      {/* 6. Communauté & Bandeau Call to Action */}
      <CommunitySection />
    </div>
  );
}
