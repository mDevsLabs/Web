/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — VERIFIED BADGE (src/components/common/VerifiedBadge.tsx)
 * Animated Blue Star Badge with Shooting Star Shimmer & Glow Effects
 * Automatically activates for accounts with is_verified = true OR tier in [Plus, Pro, Max]
 * ============================================================================
 */

import React from 'react';

interface VerifiedBadgeProps {
  isVerified?: boolean;
  tier?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  isVerified,
  tier,
  size = 'sm',
  className = '',
  showTooltip = true,
}) => {
  // Actif si is_verified est vrai OU si le tier est Plus, Pro ou Max
  const cleanTier = (tier || '').toLowerCase().trim();
  const hasPremiumTier = ['plus', 'pro', 'max'].includes(cleanTier);
  const shouldDisplay = Boolean(isVerified || hasPremiumTier);

  if (!shouldDisplay) return null;

  // Dimensions
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  const tooltipText = hasPremiumTier
    ? `Compte Vérifié (${tier?.toUpperCase() || 'PRO'})`
    : 'Compte Officiel Vérifié';

  return (
    <span
      className={`inline-flex items-center justify-center relative group shrink-0 select-none ${className}`}
      title={showTooltip ? tooltipText : undefined}
    >
      {/* Outer subtle celestial glow */}
      <span className="absolute inset-0 rounded-full bg-cyan-400/25 blur-[2px] animate-pulse" />

      {/* SVG Animated Shooting Star / Verified Checkmark Badge */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeClasses} relative z-10 drop-shadow-[0_0_6px_rgba(29,155,240,0.8)] transition-transform duration-300 group-hover:scale-110`}
      >
        <defs>
          {/* Main Blue Gradient */}
          <linearGradient id="vibeBadgeBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#1D9BF0" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>

          {/* Shooting Star Light Sweep Gradient */}
          <linearGradient id="shootingStarSweep" x1="-100%" y1="0%" x2="200%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="55%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="65%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            <animate
              attributeName="x1"
              from="-150%"
              to="250%"
              dur="2.8s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="x2"
              from="-50%"
              to="350%"
              dur="2.8s"
              repeatCount="indefinite"
            />
          </linearGradient>

          {/* Star Sparkle Filter */}
          <filter id="starGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
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
          style={{ mixBlendMode: 'overlay' }}
        />

        {/* Inner Crisp Pure White Checkmark */}
        <path
          d="M7.5 12.2L10.2 15L16.8 8.4"
          stroke="#FFFFFF"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Mini Shooting Star Sparkle Top Right */}
        <circle cx="18" cy="6" r="1" fill="#FFFFFF">
          <animate
            attributeName="opacity"
            values="0;1;0"
            dur="2.8s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </span>
  );
};
