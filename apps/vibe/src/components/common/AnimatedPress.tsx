import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useMotionPrefs } from '../../hooks/useMotionPrefs';
import type { HapticType } from '../../services/haptics';

interface AnimatedPressProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  children: React.ReactNode;
  /** Haptic joué au tap (défaut: light). `null` = aucun. */
  haptic?: HapticType | null;
  /** Échelle au press (défaut 0.88). */
  pressScale?: number;
  onPress?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * AnimatedPress — bouton spring micro-interaction.
 * - whileTap spring (transform only, 60fps)
 * - haptic synchro via useMotionPrefs
 * - Coupe l'anim si reduced-motion / animations OFF
 */
export const AnimatedPress: React.FC<AnimatedPressProps> = ({
  children,
  haptic = 'light',
  pressScale = 0.88,
  onPress,
  ...rest
}) => {
  const { play, animationsEnabled } = useMotionPrefs();
  const systemReduce = useReducedMotion();

  const effectiveScale = animationsEnabled && !systemReduce ? pressScale : 1;

  return (
    <motion.button
      whileTap={{ scale: effectiveScale }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      onClick={(e) => {
        if (haptic) play(haptic);
        onPress?.(e as unknown as React.MouseEvent<HTMLButtonElement>);
        (rest as { onClick?: (e: unknown) => void }).onClick?.(e);
      }}
      style={{ touchAction: 'manipulation' }}
      {...(rest as Record<string, unknown>)}
    >
      {children}
    </motion.button>
  );
};
