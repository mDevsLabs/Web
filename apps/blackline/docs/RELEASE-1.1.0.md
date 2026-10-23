# BLACKLINE 1.1.0 — Ultra HD

## Rendu

- Profil **8K UHD / 120** dans Paramètres : Ultra, rendu 7680 × 4320 sur une fenêtre 16:9, cible 120 FPS, adaptation désactivée, économie désactivée. Les modes 1080p, 1440p, 4K, 8K et pixels natifs conservent le format de la fenêtre. Sur un écran plus petit, UHD effectue un suréchantillonnage ; il ne transforme pas l’écran en écran 8K.
- Limites `MAX_TEXTURE_SIZE`, `MAX_RENDERBUFFER_SIZE`, `MAX_VIEWPORT_DIMS` et plafond de 33 177 600 pixels vérifiés avant allocation. En cas de limite, le compteur affiche les dimensions réelles avec « limite GPU ». Ces capacités ne renseignent pas la mémoire vidéo disponible : le mode 8K reste exigeant et peut excéder la mémoire d’un appareil.
- Auto conserve les budgets précédents : mobile Ultra 1080p, ratio maximal 1,75 ; PC Ultra 4K. Le 8K est un choix explicite. Les anciens réglages FPS restent conservés ; nouveaux profils PC à 120 FPS, mobile à 30 FPS en économie.
- Cibles 30/45/60/90/120 FPS. Le navigateur synchronise l’image au rafraîchissement de l’écran. Une cible est une limite souhaitée, jamais une mesure de débit réel. Le compteur en partie affiche des images réellement dessinées par le jeu.

## Direction visuelle

- Armes et tenues : textures de finition et skins 256 × 256, grain métallique brossé, rayures et tissage, normales et rugosité indépendantes. Marquages d’armes 512 × 128. Biseaux des corps de fusils, crosses, chargeurs et plaques de protection ; pistolet biseauté conservé.
- Sols, maçonnerie, sable et écorce : trois cartes PBR de 512 × 512 par surface, caches partagés, mipmaps et filtrage anisotrope. Les textures restent procédurales et légères à télécharger ; il ne s’agit pas de textures 8K.
- Arbres : branches, racines et sept couronnes irrégulières par arbre, couleurs par sommet. Façades : joints, couvertines, conduits et fixations ; toits : joints et attaches ; intérieurs : plinthes et moulures. Les nouveaux détails laissent les fenêtres de tir ouvertes et ne modifient pas les colliders.
- Environnement de réflexion extérieur précalculé depuis le ciel, soleil cohérent avec la lumière directionnelle, éclairage d’arme avec contre-jour froid. Nuages à trois échelles et reflet du ciel dans l’eau.
- Troisième personne, choix d’épaule, articulations des bras et collision de caméra conservés. Optiques transparentes et zoom ×1,1 du pistolet conservés.

## Coûts du rendu

- FXAA et étalonnage partagent une passe après la conversion HDR vers sRGB. Suppression de l’ancienne passe de film, de ses quatre lectures de netteté, du grain et de la vignette de ce shader. Le HUD conserve ses effets configurables.
- Les cinq niveaux de bloom HDR restent disponibles ; leur entrée est bornée à 1920 × 1080, donc le tampon lumineux à 960 × 540. La scène reste à sa définition UHD. Les deux grands tampons HDR du compositeur restent coûteux en 8K.
- Ombres Ultra conservées (4096 PC, 1024 mobile), actualisation jusqu’à 60 Hz, 30 en économie. Le rendu 120 Hz peut réutiliser les ombres entre deux mises à jour.
- Préchargement des nouvelles sources en tâches séparées, puis initialisation des textures et précompilation GPU existante. Pas de téléchargement d’assets externes ajouté.
- Économie : conserve Ultra et la résolution choisie, cible 30 FPS, menus figés ; onglet masqué sans boucle de rendu. Elle ne peut garantir une consommation basse si le joueur choisit une résolution 8K.

## Validation et limites

TypeScript strict, 174 tests automatisés CPU et build de production. Les huit nouveaux tests couvrent les dimensions 8K, formats et limites GPU, budgets Auto, persistance des profils, cadenceur jusqu’à 240 Hz, taille du bloom, passe FXAA/étalonnage et cartes PBR. Les contrôles existants couvrent les deux arènes, budgets de maillages, collisions, optiques, troisième personne, tirs, progression et sauvegardes.

Le navigateur de vérification a refusé l’aperçu interne (`ERR_BLOCKED_BY_CLIENT`). Aucune mesure GPU, capture de rendu, mesure de batterie ou preuve de 8K à 120 FPS sur appareil n’est disponible. La qualité « AAA » n’est pas une certification obtenue : cette livraison enrichit le rendu du jeu web existant. Valider matériellement le 8K, la VRAM, la stabilité thermique et les FPS avant de qualifier ce débit de garanti.

Le backend de comptes et Neon reste optionnel dans le dépôt, avec les migrations existantes ; cette publication statique n’active pas une connexion SQL sans configuration serveur réelle.
