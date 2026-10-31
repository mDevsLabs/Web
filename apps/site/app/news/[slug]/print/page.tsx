import { notFound } from 'next/navigation';
import { getNewsArticle, getNewsArticles } from '@/lib/news';
import PrintArticleClient from './PrintArticleClient';

export async function generateStaticParams() {
  const articles = getNewsArticles();
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export default async function PrintArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const article = getNewsArticle(resolvedParams.slug);

  if (!article || article.visibility === 'hidden') {
    // `notFound()` comme sur `/news/[slug]` : renvoyer un composant « Article non
    // trouvé » renvoyait un HTTP 200, ce qui rendait ces pages indexables.
    notFound();
  }

  return <PrintArticleClient article={article} />;
}
