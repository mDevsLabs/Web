/**
 * ============================================================================
 * VIBE — SERVICE VISITE GUIDÉE (src/services/tutorialService.ts)
 * Full tour multi-pages basé sur driver.js : navigation par groupes de route,
 * ciblage du premier élément VISIBLE (mobile + desktop), étapes absentes
 * ignorées, progression persistée en local (rejouable depuis Paramètres).
 * ============================================================================
 */
import { driver, type Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import '../components/tutorial/tour.css';
import { TOUR_STEPS, type TourStepDef } from '../components/tutorial/TourSteps';

const TOUR_DONE_KEY = 'vibe_tour_completed_v1';

let activeDriver: Driver | null = null;
let tourRunning = false;

export function isTourCompleted(): boolean {
  try {
    return window.localStorage.getItem(TOUR_DONE_KEY) === '1';
  } catch {
    return false;
  }
}

export function markTourCompleted(): void {
  try {
    window.localStorage.setItem(TOUR_DONE_KEY, '1');
  } catch {}
}

export function stopTour(): void {
  tourRunning = false;
  try {
    activeDriver?.destroy();
  } catch {}
  activeDriver = null;
}

/** Premier élément correspondant au sélecteur ET réellement visible. */
function queryVisible(selector: string): Element | null {
  try {
    const nodes = Array.from(document.querySelectorAll(selector));
    for (const el of nodes) {
      const rect = (el as HTMLElement).getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return el;
    }
  } catch {}
  return null;
}

/** Attend qu'un sélecteur (ou son repli) devienne visible, sans jamais bloquer. */
function waitForVisible(step: TourStepDef, timeoutMs = 4000): Promise<Element> {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve) => {
    const tick = () => {
      const el = queryVisible(step.selector) || (step.fallback ? queryVisible(step.fallback) : null) || queryVisible('main');
      if (el || Date.now() >= deadline) {
        resolve(el || document.body);
        return;
      }
      window.setTimeout(tick, 120);
    };
    tick();
  });
}

interface TourGroup {
  route: string;
  steps: TourStepDef[];
  /** Index global du premier step du groupe (pour la progression affichée). */
  startIndex: number;
}

function groupByRoute(): TourGroup[] {
  const groups: TourGroup[] = [];
  TOUR_STEPS.forEach((step, i) => {
    const last = groups[groups.length - 1];
    if (last && last.route === step.route) {
      last.steps.push(step);
    } else {
      groups.push({ route: step.route, steps: [step], startIndex: i });
    }
  });
  return groups;
}

/**
 * Lance la visite guidée complète. Navigue de page en page, conduit chaque
 * groupe d'étapes avec driver.js, enchaîne au « Suivant » final de chaque
 * groupe. Terminer le dernier groupe marque la visite comme vue.
 */
export async function startFullTour(navigate: (path: string) => void): Promise<void> {
  stopTour();
  tourRunning = true;
  const groups = groupByRoute();

  const finish = (completed: boolean) => {
    stopTour();
    if (completed) markTourCompleted();
  };

  const runGroup = async (gi: number, startAt = 0): Promise<void> => {
    if (!tourRunning || gi < 0 || gi >= groups.length) {
      finish(gi >= groups.length);
      return;
    }
    const group = groups[gi];
    if (window.location.pathname !== group.route) {
      navigate(group.route);
    }
    // Laisse la route + le lazy() se monter, puis résout les cibles visibles.
    await waitForVisible(group.steps[0], 4500);
    if (!tourRunning) return;
    const resolved = group.steps
      .map((s) => ({ def: s, el: queryVisible(s.selector) || (s.fallback ? queryVisible(s.fallback) : null) || queryVisible('main') }))
      .filter((r) => r.el);
    if (resolved.length === 0) {
      // Page vide ou non montée : on passe au groupe suivant.
      await runGroup(gi + 1);
      return;
    }
    try {
      activeDriver?.destroy();
    } catch {}
    const d = driver({
      showProgress: true,
      progressText: `{{current}} / ${TOUR_STEPS.length}`,
      nextBtnText: 'Suivant',
      prevBtnText: 'Retour',
      doneBtnText: 'Terminer',
      popoverClass: 'vibe-tour-popover',
      allowClose: true,
      overlayColor: '#000000',
      overlayOpacity: 0.72,
      smoothScroll: true,
      stagePadding: 6,
      stageRadius: 12,
      allowKeyboardControl: true,
      steps: resolved.map((r) => ({
        element: r.el as Element,
        popover: { title: r.def.title, description: r.def.description },
      })),
      onNextClick: (_el, _step, opts) => {
        const last = (opts.state.activeIndex ?? 0) >= resolved.length - 1;
        if (last) {
          try {
            opts.driver.destroy();
          } catch {}
          void runGroup(gi + 1);
        } else {
          opts.driver.moveNext();
        }
      },
      onPrevClick: (_el, _step, opts) => {
        const first = (opts.state.activeIndex ?? 0) <= 0;
        if (first && gi > 0) {
          try {
            opts.driver.destroy();
          } catch {}
          void runGroup(gi - 1, -1);
        } else {
          opts.driver.movePrevious();
        }
      },
      onCloseClick: (_el, _step, opts) => {
        try {
          opts.driver.destroy();
        } catch {}
        finish(false);
      },
    });
    activeDriver = d;
    const at = startAt === -1 ? resolved.length - 1 : Math.min(Math.max(startAt, 0), resolved.length - 1);
    d.drive(at);
  };

  await runGroup(0);
}
