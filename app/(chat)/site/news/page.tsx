import { getNewsArticles } from "@/lib/site/news";
import { NewsClient } from "./NewsClient";

export const metadata = {
  description: "Les dernières actualités de mDevsLabs.",
  title: "Actualités",
};

export default function NewsPage() {
  // Le contenu markdown complet n'est pas nécessaire pour la liste.
  const articles = getNewsArticles().map(
    ({ content: _content, ...article }) => article
  );

  return <NewsClient articles={articles} />;
}
