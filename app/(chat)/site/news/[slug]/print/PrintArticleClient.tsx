"use client";

import { ArrowLeftIcon as ArrowLeft, DownloadIcon as Download, PrinterIcon as Printer } from "@mdevs/icons";
import PrintContent from "@/components/site/print-content";
import Link from "@/components/site/router";

export default function PrintArticleClient({
  article,
}: {
  article: {
    slug: string;
    title: string;
    content: string;
    author: string;
    date: string;
    description: string;
  };
}) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <Link
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-sm text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white/60 transition-all duration-300"
          href={`/news/${article.slug}`}
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'article
        </Link>

        <div className="flex gap-3">
          <button
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-sm text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white/60 transition-all duration-300"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4" />
            Imprimer
          </button>
          <button
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors shadow-lg"
            onClick={() => window.print()}
          >
            <Download className="w-4 h-4" />
            Télécharger PDF
          </button>
        </div>
      </div>

      <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-3xl p-8 md:p-12">
        <PrintContent
          author={article.author}
          content={article.content}
          date={article.date}
          description={article.description}
          title={article.title}
        />
      </div>
    </div>
  );
}
