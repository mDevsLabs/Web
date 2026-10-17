import { CommunitySection } from "@/components/site/home/community-section";
import { FeaturesSection } from "@/components/site/home/features-section";
import { HeroSection } from "@/components/site/home/hero-section";
import { ModelsShowcase } from "@/components/site/home/models-showcase";
import { NewsAndUpdates } from "@/components/site/home/news-and-updates";
import { ProjectsShowcase } from "@/components/site/home/projects-showcase";
import { getNewsArticles } from "@/lib/site/news";

export default async function Home() {
  const news = getNewsArticles();

  return (
    <div className="flex flex-col gap-6 md:gap-12 w-full relative z-10">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Flagship Models Showcase (mAI-1.5 Series) */}
      <ModelsShowcase />

      {/* 3. Products & Projects Showcase */}
      <ProjectsShowcase />

      {/* 4. Core Features & Value Propositions */}
      <FeaturesSection />

      {/* 5. Activité Récente (3 Derniers Articles de Blog) */}
      <NewsAndUpdates news={news} />

      {/* 6. Communauté & Bandeau Call to Action */}
      <CommunitySection />
    </div>
  );
}
