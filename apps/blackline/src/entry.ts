// Point d'entrée du jeu : le montage partagé par l'application autonome et par
// l'hôte mAI.
//
// POURQUOI UN POINT D'ENTRÉE UNIQUE
//
// Deux consommateurs, deux contextes :
//
// - `src/main.ts` : l'application autonome (Electron, Capacitor, `index.html`
//   du dépôt). Elle possède le document, et le jeu est monté dans son `#app`.
//
// - L'hôte mAI (`app/(chat)/blackline`) : la page fournit un conteneur
//   `.blackline-root` et charge ce module.
//
// Le montage lui-même — moteur, écran de chargement, garde d'orientation,
// gestion de l'erreur WebGL — est IDENTIQUE dans les deux cas. Seule la
// racine change. Extraire ce code ici évite d'avoir deux montages qui
// divergent : le bug « l'un marche, l'autre non » serait quasi certain.
//
// LE MOTEUR RESTE PARESSEUX
//
// `import('./game.ts')` est dynamique, et le reste : le chunk `game` (84 Ko)
// et `three-core` (522 Ko) ne sont demandés qu'au montage. C'est une exigence
// de `scripts/check-bundle.mjs` (« the engine is loaded before the interface »
// doit être FAUX) : le menu doit s'afficher avant que le moteur arrive.

import { isTouchDevice } from './input.ts';
import { installLandscapeGuard } from './landscape.ts';
import { loadingProgress, nextPaint } from './preload.ts';
import { clearRoot, setRoot, toggleRootClass } from './root.ts';
import { loadProfile, loadSettings, flushProfileSave } from './storage.ts';
import { preloadMenuPages } from './ui/page-loader.ts';
import { UI } from './ui.ts';

/**
 * Instance montée courante, et sa fonction de libération.
 *
 * Le moteur n'est chargé qu'au montage, et il ne peut pas être « déchargé »
 * par le JavaScript : ce qui peut l'être, en revanche, c'est la mémoire
 * qu'il occupe — tampon GPU, textures, contexte WebGL. C'est le rôle de
 * cette référence : elle permet à l'hôte de demander la libération quand il
 * quitte la page.
 *
 * `dispose` est structurel et non typé : `Game` est importé dynamiquement,
 * son type n'est donc pas disponible ici sans charger le moteur.
 */
let mounted: { dispose: () => void } | null = null;

/**
 * Démonte le jeu monté et libère la mémoire du moteur.
 *
 * Appelée par l'hôte mAI au démontage de la page, et par l'application
 * autonome avant un remontage. Sans elle, la boucle de rendu continue de
 * tourner dans le vide et le contexte WebGL n'est jamais relâché.
 */
export function unmountBlackline(): void {
  const instance = mounted;
  mounted = null;
  if (!instance) {
    return;
  }
  try {
    instance.dispose();
  } catch (error) {
    console.error('BLACKLINE unmount failed', error);
  }
  clearRoot();
}

/**
 * Options de montage.
 *
 * Les trois rôles sont distincts, et les confondre est un bug silencieux :
 *
 *   - le CONTENEUR reçoit le canvas et l'interface du jeu ;
 *   - la RACINE porte les classes et les variables CSS du jeu ;
 *   - l'OVERLAY reçoit les superpositions transitoires (orientation).
 *
 * `settings` permet à l'hôte de fournir des réglages déjà enregistrés (la
 * base fait foi) : le jeu les fusionne avec sa sauvegarde locale, qui reste le
 * repli hors ligne.
 */
export type MountOptions = {
  /** Conteneur du jeu (canvas + interface). Par défaut : `<body>`. */
  container?: HTMLElement;
  /** Élément recevant les superpositions du jeu. Par défaut : la racine. */
  overlay?: HTMLElement;
  /** Racine du jeu. Par défaut : `<html>`. */
  root?: HTMLElement;
  /** Réglages imposés par l'hôte (base de données). Ils PRIMENT sur le local. */
  settings?: Record<string, unknown>;
};

/**
 * Construit le DOM du jeu dans le conteneur.
 *
 * L'application autonome le fournit dans son `index.html` (le canvas et
 * l'interface y sont les deux enfants de `<body>`) ; l'hôte mAI ne connaît pas
 * la structure interne du jeu et ne doit pas la connaître : le point
 * d'entrée la CONSTRUIT. Un seul endroit décrit ce que le jeu attend de son
 * conteneur.
 */
function preparerConteneur(conteneur: HTMLElement): {
  app: HTMLElement;
  canvas: HTMLCanvasElement;
} {
  let canvas = conteneur.querySelector<HTMLCanvasElement>('#game-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'game-canvas';
    canvas.setAttribute('aria-label', 'Arène 3D BLACKLINE');
    conteneur.appendChild(canvas);
  }

  let app = conteneur.querySelector<HTMLElement>('#app');
  if (!app) {
    app = document.createElement('div');
    app.id = 'app';
    conteneur.appendChild(app);
  }

  // L'écran de chargement : il est retiré à la fin du préchargement. Il est
  // un ENFANT DU CONTENEUR (un frère de l'interface), comme dans le
  // `index.html` de l'application autonome : il doit couvrir le jeu entier,
  // interface comprise.
  if (!conteneur.querySelector('#boot')) {
    const boot = document.createElement('div');
    boot.id = 'boot';
    boot.innerHTML =
      '<div class="boot-emblem">B<span>∕</span></div><p>BLACKLINE</p>' +
      '<div class="boot-bar" role="progressbar" aria-label="Préchargement du jeu" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i style="width:0%"></i></div>' +
      '<output>0 %</output><span id="boot-status">PRÉPARATION DU THÉÂTRE D’OPÉRATIONS</span>';
    conteneur.appendChild(boot);
  }

  return { app, canvas };
}

/**
 * Monte le jeu et renvoie son interface.
 *
 * La promesse se résout quand le moteur est prêt (ou quand l'échec a été
 * signalé) : l'hôte peut alors masquer son propre écran de chargement.
 */
export async function mountBlackline(
  options: MountOptions = {}
): Promise<UI | null> {
  // DEUX ÉLÉMENTS, DEUX RÔLES
  //
  // Le CONTENEUR reçoit le canvas et l'interface du jeu. La RACINE reçoit les
  // classes et les variables CSS du jeu.
  //
  // Dans l'application autonome, ce sont deux éléments différents : le
  // conteneur est `<body>` (le canvas et l'interface y sont ses enfants) et
  // la racine est `<html>` (le document est possédé par le jeu, et la feuille
  // de style d'origine s'y applique). Dans l'hôte mAI, c'est le MÊME
  // élément : le conteneur `.blackline-root`.
  const conteneur = options.container ?? document.body;
  if (!conteneur) {
    throw new Error("BLACKLINE : aucun conteneur de montage.");
  }

  const { app, canvas } = preparerConteneur(conteneur);

  // La racine reçoit les classes du jeu. Dans l'application autonome, c'est
  // `<html>` (le document est possédé par le jeu) ; dans l'hôte mAI, c'est le
  // conteneur `.blackline-root`.
  const root = options.root ?? document.documentElement;
  setRoot(root, options.overlay);

  const mobile = isTouchDevice();
  toggleRootClass("touch-device", mobile);

  const settings = loadSettings(mobile);
  // Les réglages de l'hôte PRIMENT : la base de données fait foi, le
  // `localStorage` n'est qu'un cache local. Un réglage absent de la base
  // conserve sa valeur locale.
  if (options.settings) {
    Object.assign(settings, options.settings);
  }
  const profile = loadProfile();
  const ui = new UI(app, settings, profile, mobile);
  ui.engineReady = false;
  ui.menu();

  const updateOrientation = installLandscapeGuard(mobile, app, () => ui.game);
  const status = loadingProgress((value, label) => {
    // L'écran de chargement est un frère de l'interface, pas un enfant :
    // il est cherché dans le CONTENEUR.
    const boot = conteneur.querySelector<HTMLElement>('#boot');
    if (!boot) return;
    const text = boot.querySelector('#boot-status');
    if (text) text.textContent = label;
    boot.querySelector('i')?.style.setProperty('width', value + '%');
    boot
      .querySelector('[role="progressbar"]')
      ?.setAttribute('aria-valuenow', String(value));
    const number = boot.querySelector('output');
    if (number) number.textContent = value + ' %';
  });

  try {
    status(5, 'CHARGEMENT DU MOTEUR 3D');
    await nextPaint();
    const [{ Game }, { preloadAssets }] = await Promise.all([
      import('./game.ts'),
      import('./asset-preload.ts'),
    ]);
    status(20, 'PRÉPARATION DES TEXTURES ULTRA');
    await preloadAssets(profile, (fraction, label) =>
      status(20 + fraction * 14, label)
    );
    await nextPaint();
    const game = new Game(
      canvas,
      settings,
      {
        end: (r) => ui.end(r),
        event: (type, data) => ui.event(type, data),
        hud: (data) => ui.hud(data),
        performance: (fps, resolution) => ui.performance(fps, resolution),
        state: (s) => ui.stateChanged(s),
      },
      mobile
    );
    ui.setGame(game);
    game.applySettings(settings);
    updateOrientation();
    // Le moteur est monté : il devient la instance libérable par l'hôte.
    mounted = {
      dispose: () => {
        game.dispose();
        ui.game = null;
      },
    };
    status(35, 'PRÉCHARGEMENT DE L’ARSENAL');
    try {
      await game.warmup((progress, label) => status(35 + progress * 60, label));
    } catch {
      ui.notice(
        'Préparation graphique partielle : les éléments restants seront chargés pendant le jeu.'
      );
    }
    ui.engineReady = true;
    status(100, 'PRÊT POUR L’OPÉRATION');
    ui.menu();
    void preloadMenuPages(() => ui.state === 'menu');
    conteneur.querySelector('#boot')?.classList.add('done');
    window.setTimeout(
      () => conteneur.querySelector('#boot')?.remove(),
      400
    );
    return ui;
  } catch (error) {
    conteneur.querySelector('#boot')?.remove();
    console.error('BLACKLINE initialization failed', error);
    ui.engineReady = false;
    ui.notice(
      'WebGL 2 est nécessaire. Activez l’accélération graphique de votre navigateur puis rechargez le jeu.'
    );
    canvas.style.background = '#1c2823';
    return null;
  }
}

/**
 * Branche les événements globaux de l'application autonome.
 *
 * L'hôte mAI ne s'en sert pas : il gère lui-même la suspension en arrière-plan
 * et la touche « retour ».
 */
export function bindNativeEvents(ui: UI): void {
  window.addEventListener(
    'blackline:storage-error',
    () =>
      ui.notice(
        'Espace de stockage indisponible. Exportez votre sauvegarde depuis Sauvegarde avant de fermer le jeu.'
      )
  );
  window.addEventListener(
    'blackline:native-notice',
    ((event: CustomEvent) => ui.notice(String(event.detail))) as EventListener
  );
  window.addEventListener('blackline:background', () => {
    ui.game?.pause();
    flushProfileSave();
  });
  window.addEventListener('blackline:back', () => {
    if (ui.game?.state === 'playing' || ui.game?.state === 'dead')
      ui.game.pause();
    else if (ui.game?.state === 'paused') ui.game.resume();
  });
}
