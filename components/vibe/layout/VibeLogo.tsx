import type React from "react";

interface VibeLogoProps {
  className?: string;
  showText?: boolean;
  size?: number;
}

/**
 * Logo Vibe — version arrondie (cercle doux) avec halo coloré.
 * Utilisé dans la sidebar, le header d'accueil et la modale d'authentification.
 */
export const VibeLogo: React.FC<VibeLogoProps> = ({
  className = "",
  size = 36,
  showText = false,
}) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <div
      className="relative flex items-center justify-center rounded-full overflow-hidden shadow-lg shadow-black/40 ring-1 ring-white/20 shrink-0 hover:scale-105 transition-transform bg-white"
      style={{ height: size, width: size }}
    >
      <img
        alt="mAI Vibe Logo"
        className="w-full h-full object-contain p-1"
        src="/vibe/logo.png"
      />
    </div>
    {showText && (
      <span className="font-extrabold text-xl tracking-tight text-white">
        Vibe
      </span>
    )}
  </div>
);
