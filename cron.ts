import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

/**
 * ============================================================================
 * cron.ts — les ticks planifiés de l'hôte Next, déclenchés par Val Town
 * ============================================================================
 *
 * POURQUOI UN VAL PLUTÔT QUE LE WORKFLOW GITHUB
 *
 * `.github/workflows/cron-tasks.yml` — supprimé — ne faisait qu'une chose :
 * appeler quatre routes cron de l'application Next à intervalles réguliers,
 * avec `CRON_SECRET` en en-tête. Ce val reprend exactement ce contrat, pour
 * trois raisons :
 *
 *   1. UN SEUL ORDONNANCEUR. La synchronisation du catalogue de modèles est
 *      déjà portée par un val CRON du même runtime (`models-cron.ts`,
 *      `updateModels.ts`). Les deux planifications de mAI partagent désormais
 *      le même déclencheur, les mêmes journaux et les mêmes reprises.
 *   2. LES RUNNERS GITHUB SONT UNE FILE D'ATTENTE. Un quota, une organisation
 *      en maintenance ou une publication qui s'éternise retardent un tick de
 *      plusieurs minutes sans rien signaler : le tick n'est plus dû à son
 *      échéance, il est dû « quand la file se vide ».
 *   3. LE DÉCLENCHEMENT EST VISIBLE OÙ IL EST DÉPLOYÉ. Les logs du val
 *      montrent la réponse JSON de chaque route, tick par tick, au lieu d'un
 *      `::error::` dans un run de workflow.
 *
 * LES QUATRE TICKS (identiques à ceux du workflow)
 *
 *   • /api/cron/agent    — scheduler Agent       POST  maxDuration 300 s
 *   • /api/cron/planning — messages planifiés    POST  maxDuration 300 s
 *   • /api/cron/wakies   — tâches planifiées     POST  maxDuration 300 s
 *   • /api/cron/vibe     — publication Vibe & DM  GET   maxDuration  60 s
 *   • /api/cron/notifications — réplication des    POST  maxDuration 120 s
 *     notifications Vibe & Wakies
 *
 * Le cinquième tick est arrivé APRÈS les quatre autres : il réplique dans
 * la table `Notification` de l'hôte les événements produits par Vibe et
 * Wakies, pour que la cloche mAI soit l'unique point d'entrée. Il est
 * idempotent — un rejeu ne duplique rien — donc son retard de cinq minutes
 * est le seul coût.
 *
 * PAR CONCURRENCE, ET NON DANS L'ORDRE DU WORKFLOW
 *
 * Val Town plafonne une exécution de val à 10 minutes (1 minute en gratuit) et
 * l'intervalle minimal d'un cron à 1 minute (15 minutes en gratuit) : une
 * cadence de 5 minutes suppose le plan Pro, et le plafond de 10 minutes est la
 * vraie contrainte de conception ici. Enchaîner les cinq appels — le plus
 * long, 290 s, borne déjà la run — le dépasserait. Les cinq appels partent
 * donc en parallèle, ce qui borne la run au tick le plus long (≈ 5 min) au
 * lieu de la somme.
 *
 * Le parallélisme ne perd rien du contrat du workflow, qui le disait déjà dans
 * son en-tête : les quatre routes reserving leurs lignes de façon atomique
 * (bail transactionnel côté Agent et Wakies, `FOR UPDATE SKIP LOCKED` côté
 * Vibe), deux ticks concurrents se neutralisent sur l'occurrence au lieu de
 * lancer une seconde exécution. L'ordre n'était donc pas un contrat, il n'était
 * qu'un enchaînement de commandes shell. Le cinquième tick, de réplication des
 * notifications, est idempotent par construction : un rejeu ne duplique rien.
 *
 * CE QUE LE WORKFLOW GARDAIT, ET QUE CE VAL GARDE
 *
 *   1. L'ÉCHEC D'UN TICK N'ARRÊTE PAS LES AUTRES (`continue-on-error` par
 *      étape) : chaque appel est encapsulé, aucun ne rejette.
 *   2. LE SECRET VOYAGE EN EN-TÊTE `Authorization`, jamais en query : une query
 *      atterrit dans les journaux du proxy et l'historique du navigateur. Les
 *      routes lisent `CRON_SECRET` en fail-closed.
 *   3. LA CADENCE RESTE DE 5 MINUTES, borne de la relance des occurrences Agent
 *      (une occurrence peut attendre une approbation jusqu'à 24 h).
 *   4. TOUT EST VISIBLE. Le workflow masquait trois échecs sur quatre derrière
 *      `continue-on-error` : ici les quatre ticks tournent toujours, et la run
 *      du val finit en échec si AU MOINS UN tick a échoué. Un tick Vibe cassé
 *      depuis une semaine ne peut plus ressembler à une semaine calme.
 *
 * INSTALLATION CÔTÉ VAL TOWN (le fichier ne peut pas le faire à la place)
 *
 *   - Déclencheur `CRON` sur ce fichier, expression `CRON_HOTE_SEQUENCE`
 *     ci-dessous (les crons y sont évalués en UTC, comme sur GitHub Actions) ;
 *   - variables d'environnement du val : `APP_URL` (base de l'application,
 *     sans slash final) et `CRON_SECRET` (la même valeur que celle de
 *     l'application — sans elle, les quatre routes refusent l'appel en
 *     production) ;
 *   - `APP_URL` doit pointer vers l'APPLICATION NEXT, pas vers le backend
 *     Val Town : le backend répond « 404 Not Found » sur toutes ses routes,
 *     et les ticks y sont muets. Le précontrôle (voir `verifierCible`) refuse
 *     de partir et nomme la cause ;
 *   - déclenchement manuel : le bouton Run du val remplace
 *     `workflow_dispatch`, et `pnpm exec tsx cron.ts` rejoue un tick depuis le
 *     poste de travail avec le `.env.local`.
 *
 * Le `Deno.cron` n'est volontairement PAS enregistré ici, contrairement à
 * `models-cron.ts` : sur Val Town l'ordonnanceur est le déclencheur CRON du
 * val, et s'y inscrire aussi ferait tourner les mêmes ticks deux fois.
 */

/** Cadence de référence, en UTC : un tick toutes les 5 minutes. */
export const CRON_HOTE_SEQUENCE = "*/5 * * * *";

interface CronTick {
  /**
   * Budget d'attente de l'appel. Toujours INFÉRIEUR au `maxDuration` de la
   * route : c'est le val qui doit conclure son tick, pas l'invocation serverless
   * qui doit être tuée en cours de route pour qu'on l'apprenne par un 504.
   */
  budgetMs: number;
  method: "GET" | "POST";
  path: string;
}

const TICKS: CronTick[] = [
  { budgetMs: 285_000, method: "POST", path: "/api/cron/agent" },
  { budgetMs: 290_000, method: "POST", path: "/api/cron/planning" },
  { budgetMs: 290_000, method: "POST", path: "/api/cron/wakies" },
  { budgetMs: 60_000, method: "GET", path: "/api/cron/vibe" },
  { budgetMs: 120_000, method: "POST", path: "/api/cron/notifications" },
];

export interface TickResult {
  durationMs: number;
  error?: string;
  method: "GET" | "POST";
  ok: boolean;
  path: string;
  status?: number;
}

export interface CronReport {
  failed: number;
  finishedAt: string;
  ok: number;
  ticks: TickResult[];
}

/** Un secret absent vaut un tick silencieusement non exécuté : on refuse de partir. */
interface CronConfig {
  base: string;
  secret: string;
}

/**
 * LE PRÉCONTRÔLE DE LA CIBLE
 *
 * Un tick qui répond 404 ne dit pas « la route a échoué » : il dit « cette
 * route n'existe pas sur cette cible ». Les deux causes sont très différentes
 * — une route absente du déploiement visé (version trop ancienne), ou une URL
 * qui ne pointe pas vers l'application Next du tout. Le backend Val Town, lui,
 * répond « 404 Not Found » sur TOUTES ses routes : les ticks y sont muets,
 * et sans précontrôle le journal dit seulement « HTTP 404 » cinq fois de
 * suite, sans jamais nommer la cause.
 *
 * Le précontrôle interroge une route qui existe dans tous les déploiements et
 * qui ne déclenche aucun effet de bord : `/api/app-version`. Un 404 dessus
 * signifie que la cible n'est pas l'application mAI, et la run s'arrête là,
 * avec un message qui le dit.
 */
const PRECONTROLE_PATH = "/api/app-version";
const PRECONTROLE_BUDGET_MS = 15_000;

/** Un corps de réponse est une trace, pas une archive : borné, sinon il noie le journal. */
const CORPS_MAX = 400;

function env(name: string): string | undefined {
  return typeof Deno === "undefined" ? process.env[name] : Deno.env.get(name);
}

/**
 * L'hôte du backend Val Town expose les API du backend, pas les routes cron
 * de l'application Next. Y pointer `APP_URL` produit cinq 404 muets.
 */
function estHoteBackend(base: string): boolean {
  try {
    return /(^|\.)val\.run$/i.test(new URL(base).hostname);
  } catch {
    return false;
  }
}

function configure(): CronConfig {
  const base = env("APP_URL")?.trim();
  const secret = env("CRON_SECRET")?.trim();
  const manquants = [
    ...(base ? [] : ["APP_URL"]),
    ...(secret ? [] : ["CRON_SECRET"]),
  ];
  if (manquants.length > 0) {
    throw new Error(
      `Configuration incomplète, variables manquantes : ${manquants.join(", ")}`
    );
  }
  // Un slash final produirait `//api/cron/agent` : les routes Next le
  // redirigeraient, mais le tick ne serait plus celui documenté.
  const normalise = base!.replace(/\/+$/, "");
  if (estHoteBackend(normalise)) {
    throw new Error(
      `APP_URL pointe vers le backend Val Town (${normalise}) : les routes cron appartiennent à l'application Next, pas au backend.`
    );
  }
  return { base: normalise, secret: secret! };
}

/**
 * Vérifie que la cible est bien l'application mAI AVANT de lancer les ticks.
 *
 * Un précontrôle raté doit arrêter la run : cinq ticks sur une cible fausse
 * coûtent cinq minutes pour apprendre la même chose cinq fois.
 */
async function verifierCible(config: CronConfig): Promise<void> {
  const url = `${config.base}${PRECONTROLE_PATH}`;
  let reponse: Response;
  try {
    reponse = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(PRECONTROLE_BUDGET_MS),
    });
  } catch (error) {
    // Injoignable : les ticks diront la même chose, avec leur propre message.
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[cron] Précontrôle impossible sur ${url} : ${message}`);
    return;
  }
  if (reponse.status === 404) {
    throw new Error(
      `APP_URL ne pointe pas vers l'application mAI : ${url} répond 404. Les routes cron (/api/cron/**) n'existent que dans l'application Next.`
    );
  }
  if (!reponse.ok) {
    console.warn(
      `[cron] Précontrôle : ${url} a répondu HTTP ${reponse.status} — les ticks sont lancés quand même.`
    );
  }
}

async function callTick(
  config: CronConfig,
  tick: CronTick
): Promise<TickResult> {
  const startedAt = Date.now();
  const url = `${config.base}${tick.path}`;
  const headers: Record<string, string> = {
    accept: "application/json",
    authorization: `Bearer ${config.secret}`,
  };
  if (tick.method === "POST") {
    headers["content-type"] = "application/json";
  }
  try {
    const response = await fetch(url, {
      headers,
      method: tick.method,
      signal: AbortSignal.timeout(tick.budgetMs),
    });
    const body = (await response.text().catch(() => "")).slice(0, CORPS_MAX);
    const durationMs = Date.now() - startedAt;
    if (response.ok) {
      console.log(
        `[cron] ${tick.method} ${tick.path} → HTTP ${response.status} (${durationMs} ms) ${body}`
      );
      return {
        durationMs,
        method: tick.method,
        ok: true,
        path: tick.path,
        status: response.status,
      };
    }
    // 404 n'est pas « la route a échoué » : c'est « la route n'existe pas
    // ici ». Le dire dans le journal évite de relire le tick comme un bug
    // de la route alors que le déploiement ou l'URL est en cause.
    const erreur =
      response.status === 404
        ? `HTTP 404 — la route n'existe pas sur ${config.base} (déploiement trop ancien, ou APP_URL erroné)`
        : `HTTP ${response.status}`;
    console.error(
      `[cron] ${tick.method} ${tick.path} → ${erreur} (${durationMs} ms) ${body}`
    );
    return {
      durationMs,
      error: erreur,
      method: tick.method,
      ok: false,
      path: tick.path,
      status: response.status,
    };
  } catch (error) {
    // AbortSignal.timeout inclus : un tick trop lent est un échec de ce tick,
    // jamais la mort du val.
    const message = error instanceof Error ? error.message : String(error);
    const durationMs = Date.now() - startedAt;
    console.error(
      `[cron] ${tick.method} ${tick.path} → ${message} (${durationMs} ms)`
    );
    return {
      durationMs,
      error: message,
      method: tick.method,
      ok: false,
      path: tick.path,
    };
  }
}

/**
 * Un tick complet : les quatre routes, en parallèle, sans qu'un échec en masque
 * un autre. Rejette si l'un d'eux a échoué, pour que la run du val soit rouge.
 */
export async function runHostCron(): Promise<CronReport> {
  const config = configure();
  // Avant les ticks : une cible qui ne sert pas l'application mAI ne peut
  // répondre qu'en 404. Le dire tout de suite vaut mieux que cinq ticks
  // muets sur cinq minutes.
  await verifierCible(config);
  // `callTick` ne rejette jamais : c'est ce qui rend `Promise.all` sûr ici, les
  // quatre appels étant toujours attendus avant de rendre la main.
  const ticks = await Promise.all(TICKS.map((tick) => callTick(config, tick)));
  const failed = ticks.filter((tick) => !tick.ok);
  if (failed.length > 0) {
    throw new Error(
      `${failed.length} tick(s) en échec : ${failed
        .map((tick) => `${tick.path} (${tick.error})`)
        .join(", ")}`
    );
  }
  return {
    failed: 0,
    finishedAt: new Date().toISOString(),
    ok: ticks.length,
    ticks,
  };
}

/**
 * Point d'entrée du déclencheur CRON de Val Town, à la signature documentée
 * `cronValHandler`. L'export par défaut ci-dessous sert les hôtes Deno qui
 * appellent la valeur par défaut du module, comme le val catalogue de modèles.
 */
export async function cronValHandler(): Promise<CronReport> {
  return await runHostCron();
}

export default async function cronHandler(): Promise<CronReport> {
  return await runHostCron();
}

// Exécution locale : `pnpm exec tsx cron.ts`. Sur Val Town, `import.meta.url`
// est une URL https du runtime, donc ce bloc ne s'exécute jamais : il ne peut
// pas doubler le déclencheur CRON.
//
// L'attente est encapsulée dans une fonction asynchrone : le dépôt est un
// paquet CommonJS (`package.json` sans `"type": "module"`), et l'attente de
// premier niveau n'y est pas compilable. Sans cette encapsulation, la
// commande documentée ne démarrait pas — « Top-level await is currently not
// supported with the "cjs" output format » — et le seul moyen de rejouer un
// tick depuis le poste de travail devenait le déploiement.
const invokedFile = process.argv[1];
if (
  import.meta.url.startsWith("file:") &&
  invokedFile &&
  path.resolve(invokedFile) === fileURLToPath(import.meta.url)
) {
  void (async () => {
    const { loadLocalEnv } = await import("./cli-env.ts");
    loadLocalEnv();
    await runHostCron().catch((error) => {
      console.error("[cron] Échec :", error.message);
      process.exitCode = 1;
    });
  })();
}
