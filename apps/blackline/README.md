# BLACKLINE 1.2.0 — Opération Horizon

FPS solo en TypeScript et Three.js, PC et mobile en paysage. Quatre arènes, quatre modes, huit armes, progression locale et applications embarquées Electron/Capacitor.

## Version 1.2.0

- Échelles : un appui sur **MONTER** ou **DESCENDRE** déclenche le trajet. Le bouton suspend/reprend ; le saut décroche. Le sens est déterminé par la position du joueur, sans être inversé par une direction maintenue avant la saisie. Mode manuel disponible ; bouton mobile au centre.
- Paramètres regroupés : image/énergie, caméra/visée, jeu/assistance et touches PC. Suppression de la limite FPS manuelle. Cadence automatique jusqu’à 120 selon écran/GPU, 30 en économie ; Ultra conservé. Nouvelles options de sensibilité en visée, taille du réticule, zone morte du joystick, échelles automatiques et rechargement automatique. Mouvements et confirmation de touche disposent chacun d’un réglage unifié. Réinitialisation des réglages sans toucher à la progression.
- Comptes et synchronisation en ligne retirés. Page **Sauvegarde** avec import/export JSON ; progression existante conservée. Les anciennes routes API retournent 410 sans connexion SQL, même si d’anciens secrets sont présents. Migrations SQL historiques conservées sans suppression de données.
- Arènes : **Nereïs** (port, 120 × 100 m), **Kestrel** (désert, 120 × 100 m), **Sylve** (forêt brumeuse, 136 × 112 m) et **Vulcain** (fonderie et rails, 144 × 112 m). Six échelles et deux bâtiments avec étages/fenêtres par arène.
- Choix indépendant de **1 à 20 équipiers** et **1 à 20 ennemis**, en plus du joueur. En survie, les équipiers restent entre les vagues et le nombre d’ennemis respecte le choix ; leur santé progresse avec les vagues.
- Bilan : dégâts réels, ratio, tirs/touches, précision, meilleure série, éliminations à la tête/grenade/corps à corps, soins, ravitaillements, captures, temps sur objectif, XP/crédits et classement des escouades.
- `.github/workflows/build.yml` vérifie le web et prépare les applications Windows, macOS, Linux, Android et iOS simulateur. Aucun iframe ; les ressources du jeu sont intégrées aux paquets. [Instructions natives](docs/NATIVE-APPS.md).

## Développement

Node.js 24, npm.

```bash
npm ci
npm run dev
npm run typecheck
npm test
npm run build
npm run check:bundle
npm run export -- /chemin/absolu/BLACKLINE-1.2.0.zip
```

Le moteur 3D et les pages secondaires se chargent progressivement. Le build produit `dist/`, utilisable avec Sites ou Vercel. `base: './'` permet aussi le chargement depuis les ressources embarquées des applications. Les dépendances natives disposent de leurs propres manifestes et lockfiles dans `apps/`.

### Intégration dans mAI Web

Le jeu est aussi **monté par l'hôte mAI** sous `/blackline` : le build Vite
produit un chunk d'entrée au nom fixe (`assets/blackline.js`), et l'hôte l'importe
par ce chemin. Le contrat d'intégration est publié sur `window.blackline` :

```ts
window.blackline.mount({ container, root, settings });
```

- `apps/blackline/src/entry.ts` — le montage partagé (autonome et hôte) ;
- `apps/blackline/src/mount.ts` — le point d'entrée public du build ;
- `apps/blackline/src/root.ts` — la racine du jeu (classes et variables CSS).

Le jeu ne touche jamais `<html>` : dans l'hôte, ce document est celui du chat.
Voir `docs/6-blackline/` dans le dépôt hôte.

## Jeu et progression

Huit armes, optiques transparentes, pistolet ×1,1, caméra première/troisième personne avec choix d’épaule, tenues distinctes pour soi/alliés/ennemis. Cinq emplacements équipés maximum, armes/soins/grenades inclus. Maîtrise jusqu’au niveau 200, achats d’améliorations de dégâts avec pièces ; une pièce toutes les 50 XP de profil. Récompenses quotidiennes et hebdomadaires UTC.

Sauvegardes locales avec checksum et trois générations ; exportez votre JSON avant de changer d’appareil. Les récompenses et sauvegardes d’un jeu solo local ne sont pas une économie serveur anti-triche.

## Graphismes

Ultra, matériaux PBR procéduraux, biseaux, façades et végétation détaillées. Profils 4K/8K dans Paramètres, bornés par les dimensions GPU. La cadence réelle, le 8K/120 et la batterie ne sont pas garantis ; une haute résolution reste coûteuse. Aucune validation visuelle GPU n’est disponible dans cette session. Les applications natives ne sont pas des réécritures du moteur en Swift/Kotlin/C++ : elles embarquent le même moteur WebGL avec des interfaces système.

Voir [validation 1.2.0](docs/RELEASE-1.2.0.md), [déploiement](docs/DEPLOYMENT.md) et [applications](docs/NATIVE-APPS.md).
