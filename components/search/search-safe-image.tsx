"use client";

import { useEffect, useState } from "react";

/**
 * Composant image résistant aux blocages anti-hotlink :
 * Si l'URL distante échoue (403, CORS, Referer interdit), bascule automatiquement vers notre proxy interne.
 */
export function SearchSafeImage({
  src,
  alt,
  className,
  fallback,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}) {
  const [currentSrc, setCurrentSrc] = useState<string>(src || "");
  const [triedProxy, setTriedProxy] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    setCurrentSrc(src || "");
    setTriedProxy(false);
    setHasFailed(false);
  }, [src]);

  if (hasFailed || !currentSrc) {
    return fallback ? (fallback as React.ReactElement) : null;
  }

  return (
    <img
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        if (!triedProxy && src && !src.startsWith("/api/")) {
          setTriedProxy(true);
          setCurrentSrc(
            `/api/mai-search/image-proxy?url=${encodeURIComponent(src)}`
          );
        } else {
          setHasFailed(true);
        }
      }}
      referrerPolicy="no-referrer"
      src={currentSrc}
    />
  );
}
