/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — VERIFIED BADGE (src/components/common/VerifiedBadge.tsx)
 * Animated Blue Star Badge with Shooting Star Shimmer & Glow Effects
 * Automatically activates for accounts with is_verified = true OR tier in [Plus, Pro, Max]
 * ============================================================================
 */

import type React from "react";

interface VerifiedBadgeProps {
  className?: string;
  isVerified?: boolean;
  showTooltip?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  tier?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  isVerified,
  tier,
  size = "sm",
  className = "",
  showTooltip = true,
}) => {
  // Actif si is_verified est vrai OU si le tier est Plus, Pro ou Max
  const cleanTier = (tier || "").toLowerCase().trim();
  const hasPremiumTier = ["plus", "pro", "max"].includes(cleanTier);
  const shouldDisplay = Boolean(isVerified || hasPremiumTier);

  if (!shouldDisplay) return null;

  // Dimensions
  const sizeClasses = {
    lg: "w-5 h-5",
    md: "w-4 h-4",
    sm: "w-3.5 h-3.5",
    xs: "w-3 h-3",
  }[size];

  const tooltipText = hasPremiumTier
    ? `Compte Vérifié (${tier?.toUpperCase() || "PRO"})`
    : "Compte Officiel Vérifié";

  return (
    <span
      className={`inline-flex items-center justify-center relative group shrink-0 select-none ${className}`}
      title={showTooltip ? tooltipText : undefined}
    >
      {/* Outer subtle celestial glow */}
      <span className="absolute inset-0 rounded-full bg-cyan-400/25 blur-[2px] animate-pulse" />

      {/* SVG Animated Shooting Star / Verified Checkmark Badge */}
      <svg
        className={`${sizeClasses} relative z-10 drop-shadow-[0_0_6px_rgba(29,155,240,0.8)] transition-transform duration-300 group-hover:scale-110`}
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Main Blue Gradient */}
          <linearGradient
            id="vibeBadgeBlue"
            x1="0%"
            x2="100%"
            y1="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#1D9BF0" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>

          {/* Shooting Star Light Sweep Gradient */}
          <linearGradient
            id="shootingStarSweep"
            x1="-100%"
            x2="200%"
            y1="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="55%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="65%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            <animate
              attributeName="x1"
              dur="2.8s"
              from="-150%"
              repeatCount="indefinite"
              to="250%"
            />
            <animate
              attributeName="x2"
              dur="2.8s"
              from="-50%"
              repeatCount="indefinite"
              to="350%"
            />
          </linearGradient>

          {/* Star Sparkle Filter */}
          <filter height="140%" id="starGlow" width="140%" x="-20%" y="-20%">
            <feGaussianBlur result="blur" stdDeviation="0.8" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 8-pointed Octagram Star Seal */}
        <path
          d="M12 1.5L14.4 4.8L18.4 4.2L19.2 8.2L22.8 10L21.4 13.8L23.4 17.2L19.6 18.8L18.4 22.8L14.4 21.8L12 24.5L9.6 21.8L5.6 22.8L4.4 18.8L0.6 17.2L2.6 13.8L1.2 10L4.8 8.2L5.6 4.2L9.6 4.8L12 1.5Z"
          fill="url(#vibeBadgeBlue)"
        />

        {/* Shooting Star Light Sweep Overlay */}
        <path
          d="M12 1.5L14.4 4.8L18.4 4.2L19.2 8.2L22.8 10L21.4 13.8L23.4 17.2L19.6 18.8L18.4 22.8L14.4 21.8L12 24.5L9.6 21.8L5.6 22.8L4.4 18.8L0.6 17.2L2.6 13.8L1.2 10L4.8 8.2L5.6 4.2L9.6 4.8L12 1.5Z"
          fill="url(#shootingStarSweep)"
          style={{ mixBlendMode: "overlay" }}
        />

        {/* Inner Crisp Pure White Checkmark */}
        <path
          d="M7.5 12.2L10.2 15L16.8 8.4"
          stroke="#FFFFFF"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.4"
        />

        {/* Mini Shooting Star Sparkle Top Right */}
        <circle cx="18" cy="6" fill="#FFFFFF" r="1">
          <animate
            attributeName="opacity"
            dur="2.8s"
            repeatCount="indefinite"
            values="0;1;0"
          />
        </circle>
      </svg>
    </span>
  );
};
