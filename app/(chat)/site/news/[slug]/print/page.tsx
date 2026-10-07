import { notFound } from "next/navigation";
import { getAllNewsArticles, getNewsArticle } from "@/lib/site/news";
import PrintArticleClient from "./PrintArticleClient";

export async function generateStaticParams() {
  const articles = getAllNewsArticles();
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export default async function PrintArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const article = getNewsArticle(resolvedParams.slug);

  if (!article) {
    // `notFound()` comme sur `/news/[slug]` : renvoyer un composant « Article non
    // trouvé » renvoyait un HTTP 200, ce qui rendait ces pages indexables.
    notFound();
  }

  return <PrintArticleClient article={article} />;
}
