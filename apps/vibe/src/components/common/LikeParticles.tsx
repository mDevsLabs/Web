import React, { useMemo } from 'react';

interface LikeParticlesProps {
  /** Déclencheur : change à chaque like pour rejouer l'anim. */
  burstKey: number;
  /** Nombre de particules (défaut 7, capé pour perf). */
  count?: number;
  /** Couleurs du confetti. */
  colors?: string[];
}

/**
 * LikeParticles — confetti léger CSS (transform/opacity only).
 * Joué uniquement quand burstKey > 0. Aucun JS d'anim, 60fps mobile.
 */
export const LikeParticles: React.FC<LikeParticlesProps> = ({
  burstKey,
  count = 7,
  colors = ['#fb7185', '#f43f5e', '#fda4af', '#ffffff', '#fbbf24'],
}) => {
  const particles = useMemo(() => {
    if (burstKey <= 0) return [];
    const safeCount = Math.min(Math.max(count, 4), 10);
    return Array.from({ length: safeCount }, (_, i) => {
      const angle = (i / safeCount) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 22 + Math.random() * 22;
      return {
        id: `${burstKey}-${i}`,
        px: `${Math.cos(angle) * dist}px`,
        py: `${Math.sin(angle) * dist - 14}px`,
        color: colors[i % colors.length],
        size: 4 + Math.random() * 4,
        delay: `${Math.random() * 0.05}s`,
      };
    });
  }, [burstKey, count, colors]);

  if (burstKey <= 0) return null;

  return (
    <span aria-hidden className="absolute inset-0 pointer-events-none overflow-visible">
      {particles.map((p) => (
        <span
          key={p.id}
          className="vibe-particle"
          style={
            {
              '--px': p.px,
              '--py': p.py,
              backgroundColor: p.color,
              width: p.size,
              height: p.size,
              animationDelay: p.delay,
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  );
};
