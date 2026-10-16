/**
 * Rendu d'un média d'article : image, vidéo HTML5 ou présentation YouTube.
 * Les vidéos sont déléguées à `NewsVideo` (lecture auto en boucle, son
 * configurable, bouton muet), les vidéos YouTube à `NewsYouTube` (vignette de
 * couverture, ou iframe sur la page article) ; les images restent des `<img>`.
 */

import { isVideoUrl, type MediaKind, youTubeIdFromUrl } from "@/lib/site/media";
import { NewsVideo } from "./news-video";
import { NewsYouTube } from "./news-youtube";

export function NewsMedia({
  src,
  kind,
  alt,
  className = "w-full h-full object-cover",
  fill = false,
  priority = false,
  sound = false,
}: {
  src: string;
  /** Force le type de média (sinon détection par extension). */
  kind?: MediaKind;
  alt: string;
  className?: string;
  /** Étire le média sur son conteneur (position absolute). */
  fill?: boolean;
  priority?: boolean;
  /** Vidéos : tente une lecture avec son (couvertures), repli muet sinon. */
  sound?: boolean;
}) {
  const youTubeId = youTubeIdFromUrl(src);
  if (youTubeId) {
    return (
      <NewsYouTube
        alt={alt}
        className={className}
        fill={fill}
        id={youTubeId}
        player={sound}
      />
    );
  }

  if (kind === "video" || isVideoUrl(src)) {
    return (
      <NewsVideo
        alt={alt}
        className={className}
        fill={fill}
        sound={sound}
        src={src}
      />
    );
  }

  const layout = fill ? "absolute inset-0 h-full w-full" : "";

  return (
    <img
      alt={alt}
      className={`${layout} ${className}`}
      decoding="async"
      loading={priority ? "eager" : "lazy"}
      src={src}
    />
  );
}
