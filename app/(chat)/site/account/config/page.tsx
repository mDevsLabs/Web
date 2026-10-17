import type { Metadata } from "next";
import ConfigClient from "./ConfigClient";

export const metadata: Metadata = {
  description:
    "Générez dynamiquement vos extraits de code pour intégrer nos API avec les SDK OpenAI, Google, Anthropic, Python et cURL.",
  title: "Configuration API & SDKs | mAI",
};

export default function ApiConfigPage() {
  return (
    <main className="min-h-[100dvh] bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <ConfigClient />
      </div>
    </main>
  );
}
