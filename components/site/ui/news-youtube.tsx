/**
 * Rendu YouTube des médias d'actualité.
 *
 * Pourquoi deux formes :
 *  - couverture de carte (défaut) : vignette + pastille de lecture. Un iframe
 *    complet dans chaque carte d'un lien alourdirait la page et intercepterait
 *    le clic de navigation du `<Link>` ;
 *  - lecteur d'article (`player`) : iframe d'embed avec ses contrôles natifs.
 */

import { PlayIcon } from "@mdevs/icons";

export function NewsYouTube({
  id,
  alt,
  className = "w-full h-full object-cover",
  fill = false,
  player = false,
}: {
  /** Identifiant de vidéo YouTube (11 caractères). */
  id: string;
  alt: string;
  className?: string;
  /** Étire le média sur son conteneur (position absolute). */
  fill?: boolean;
  /** Lecteur interactif (page article) plutôt que couverture de carte. */
  player?: boolean;
}) {
  if (player) {
    return (
      <span
        className={`block overflow-hidden bg-black ${fill ? "absolute inset-0" : "relative"}`}
      >
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className={`absolute inset-0 h-full w-full ${className}`}
          referrerPolicy="strict-origin-when-cross-origin"
          src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`}
          title={alt}
        />
      </span>
    );
  }

  // `hqdefault.jpg` existe pour toutes les vidéos ; dans un conteneur 16/9,
  // `object-cover` recadre exactement les bandes noires 4/3 de la vignette.
  return (
    <span
      className={`block overflow-hidden bg-slate-100 ${fill ? "absolute inset-0" : "relative"}`}
    >
      <img
        alt={alt}
        className={`${fill ? "absolute inset-0 h-full w-full" : ""} ${className}`}
        decoding="async"
        loading="lazy"
        src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/65 text-white shadow-lg backdrop-blur-sm">
          <PlayIcon className="ml-0.5 h-5 w-5" />
        </span>
      </span>
    </span>
  );
}
