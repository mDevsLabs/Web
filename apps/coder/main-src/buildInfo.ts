// Commit Git injecté par esbuild au moment du build (`GITHUB_SHA` en CI).
//
// Les préversions de ce dépôt conservent le même numéro de version (0.9.1) et
// n'avancent que par le tag de release. electron-updater, qui compare des
// versions sémantiques, ne peut donc pas voir une build plus récente. Le SHA
// permet de comparer la build installée au commit publié dans la dernière
// release et d'afficher malgré tout la mise à jour.
declare const __MAI_BUILD_SHA__: string;
declare const __MAI_BUILD_TIME__: string;

export const MAI_BUILD_SHA =
  typeof __MAI_BUILD_SHA__ === "string" ? __MAI_BUILD_SHA__.trim() : "";

/** Millisecondes de compilation, 0 si la build ne l'a pas injecté. */
export const MAI_BUILD_TIME =
  typeof __MAI_BUILD_TIME__ === "string"
    ? Date.parse(__MAI_BUILD_TIME__) || 0
    : 0;

export const MAI_RELEASES_REPO = "mDevsLabs/Web";
export const MAI_RELEASES_API = `https://api.github.com/repos/${MAI_RELEASES_REPO}/releases?per_page=20`;
export const MAI_RELEASES_URL = `https://github.com/${MAI_RELEASES_REPO}/releases`;
