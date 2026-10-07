import { MonitorPlay } from "lucide-react";

/**
 * Présentation vidéo du modèle, intégrée via YouTube.
 *
 * Les vidéos étaient auparavant stockées dans `public/mai-2/` (plus de 140 Mo
 * par modèle) et lues par un lecteur HTML5 maison : lecteur en fenêtre
 * contextuelle, vitesse, qualité, téléchargement. Ces fichiers ont été retirés
 * au profit d'un iframe d'embed YouTube — le lecteur natif de la plateforme
 * gère la lecture, le son, la vitesse et le plein écran, et la page ne pèse
 * plus rien en vidéo.
 */
export function IntroVideoSection({
  videoId,
  modelName,
}: {
  videoId: string;
  modelName: string;
}) {
  // Les intitulés YouTube d'origine sont en espaces (« Introducing mAI 2 »),
  // les identifiants internes utilisent des tirets.
  const videoTitle = `Introducing ${modelName.replace(/-/g, " ")}`;

  return (
    <section
      id="presentation"
      className="scroll-mt-24 bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-3xl p-6 md:p-10"
    >
      <h2 className="text-2xl font-black text-slate-900 mb-2 pb-4 border-b border-black/10 flex items-center gap-2">
        <MonitorPlay className="w-5 h-5 text-blue-600" />
        Présentation
      </h2>
      <p className="text-slate-600 text-sm mt-4 mb-6">
        Découvrez {modelName} en vidéo. Si la lecture ne démarre pas, autorisez
        le lecteur intégré ou ouvrez la vidéo sur YouTube.
      </p>

      <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/60 shadow-md bg-slate-950">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}`}
          title={videoTitle}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>

      <p className="mt-4 text-sm">
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors"
        >
          Regarder sur YouTube
        </a>
      </p>
    </section>
  );
}