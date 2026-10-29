/**
 * Hôtes autorisés d'un connecteur.
 *
 * La liste exacte suffit pour une API à hôte fixe. Jira et Upstash n'ont pas
 * d'hôte fixe : le site ou la base est choisi à la connexion et stocké, jamais
 * proposé par le modèle. Le suffixe n'accepte alors qu'UNE étiquette
 * (`foo.atlassian.net`, pas `foo.bar.atlassian.net`), pour qu'un hôte
 * ressemblant ne passe pas.
 */

export type HostPolicy = {
  hostSuffixes?: readonly string[];
  hosts: readonly string[];
};

const SINGLE_LABEL = /^(?:[a-z0-9]|[a-z0-9][a-z0-9-]{0,61}[a-z0-9])$/;

export function hostAllowed(host: string, policy: HostPolicy): boolean {
  const normalized = host.toLowerCase();
  if (policy.hosts.some((item) => item.toLowerCase() === normalized)) {
    return true;
  }
  return (policy.hostSuffixes ?? []).some((suffix) =>
    hostMatchesSuffix(normalized, suffix)
  );
}

function hostMatchesSuffix(host: string, suffix: string): boolean {
  const expected = suffix.toLowerCase();
  if (!expected.startsWith(".") || host.length <= expected.length) {
    return false;
  }
  if (!host.endsWith(expected)) {
    return false;
  }
  return SINGLE_LABEL.test(host.slice(0, -expected.length));
}

/** URL HTTPS déjà composée, refusée si l'hôte n'est pas celui du connecteur. */
export function allowedHttpsUrl(policy: HostPolicy, raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) {
    return null;
  }
  if (!hostAllowed(url.host, policy)) {
    return null;
  }
  return url;
}
