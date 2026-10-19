import { FileText, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default async function LegalIndexPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <header className="mb-10 space-y-3 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Informations légales
        </p>
        <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
          Vos droits et nos engagements
        </h1>
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600">
          Retrouvez les conditions d’utilisation de mAI et les informations sur
          la protection de vos données personnelles.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          className="group rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          href="/legal/terms"
        >
          <FileText aria-hidden="true" className="mb-4 size-7 text-primary" />
          <h2 className="text-xl font-bold text-slate-900 group-hover:text-primary">
            Conditions générales d’utilisation
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Consultez les règles applicables à l’accès et à l’utilisation des
            services mAI.
          </p>
        </Link>

        <Link
          className="group rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          href="/legal/privacy"
        >
          <ShieldCheck aria-hidden="true" className="mb-4 size-7 text-primary" />
          <h2 className="text-xl font-bold text-slate-900 group-hover:text-primary">
            Politique de confidentialité
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Découvrez comment vos données sont traitées et protégées.
          </p>
        </Link>
      </div>
    </main>
  );
}
