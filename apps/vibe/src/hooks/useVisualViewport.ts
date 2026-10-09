import { useEffect } from 'react';

/**
 * Suit le clavier virtuel via visualViewport et publie sa hauteur dans la
 * variable CSS `--vibe-kb-offset` (0px quand il est fermé). Les zones de
 * saisie peuvent s'appuyer dessus pour rester visibles sur iOS.
 */
export function useVisualViewport() {
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? (window as any).visualViewport : null;
    if (!vv) return;

    const update = () => {
      const keyboardOffset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty('--vibe-kb-offset', `${Math.round(keyboardOffset)}px`);
    };

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      document.documentElement.style.setProperty('--vibe-kb-offset', '0px');
    };
  }, []);
}
