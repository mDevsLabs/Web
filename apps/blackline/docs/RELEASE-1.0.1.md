# BLACKLINE 1.0.1 — Ultra et troisième personne

Cette mise à jour corrige la régression qui remplaçait Ultra par Performance quand l’économie d’énergie était active. La qualité est maintenant indépendante de la politique de cadence.

## Qualité conservée

- Les anciennes préférences migrent une fois vers Ultra (`graphicsVersion: 2`), résolution adaptative désactivée. Les préférences explicites choisies ensuite sont préservées.
- L’économie limite à 30 FPS, sans changer le budget Ultra, les textures, les détails, les ombres, le bloom ou la netteté. Ultra mobile conserve sa cible 1080p maximum et ses ombres 1024 ; Ultra PC sa cible 4K maximum et ses ombres 4096. Le format de fenêtre et les capacités du GPU déterminent les dimensions effectives.
- Tenues et casques enrichis par géométries fusionnées, feuillages plus fins, filtrage progressif du relief de façade et anisotropie des skins. Les budgets de maillages existants restent respectés.

## Énergie et préchargement

- En pause, sur l’écran de résultat ou dans un menu figé, une image n’est redessinée qu’après invalidation. L’onglet caché n’a ni dessin GPU ni temporisateur de rendu actif. Les menus animés restent limités à 15 FPS.
- La cadence suit des échéances absolues pour éviter l’accumulation des retards et les divisions involontaires de cadence. Les tests simulent des écrans 60/90/120/144 Hz avec cibles 30/45/60 FPS.
- La physique garde ses sous-pas. Les poses, particules et décors sont actualisés une fois par image. Le HUD conserve les fragments HTML inchangés ; le changement d’arme réutilise le corps et ses articulations.
- Les textures procédurales se préparent dans des tâches courtes. Les textures GPU sont initialisées et les shaders regroupés en deux étapes : terrain/tenues, puis armes équipées. La scène ne démarre son rendu qu’après cette préparation.
- Une compilation lente est bornée et n’entraîne pas une succession de compilations concurrentes. Les modèles temporaires sont gardés jusqu’à la résolution ou au rejet de leur compilation, puis libérés.
- Les pages arsenal/boutique/guide se préchargent après l’écran de démarrage, à des moments libres ; les modules du moteur restent séparés de l’interface initiale.

## Troisième personne et correctifs

- Caméra orbitale avec choix d’épaule, volume de collision incluant le sol, rapprochement immédiat devant un obstacle et retour progressif. Très près d’un mur, la première personne évite de voir l’intérieur du personnage.
- Les tirs et l’aide tactile utilisent la vraie direction de la caméra. Le second rayon depuis le joueur bloque toujours les tirs à travers son couvert.
- Correction du signe d’inclinaison du canon et de la tête ; bras à deux articulations suivant les poignées et le rechargement. Le bouton VUE sort de la lunette et indique 1P/3P.
- Les animations de tir du joueur vieillissent correctement. Les corps restent à l’altitude de l’étage/toit. Le cache d’animation utilise des références faibles et n’empêche plus de cloner une arme déjà animée pour le préchargement.
- Correction de l’unité de distance de caméra dans les paramètres et migration des anciens réglages cloud vers Ultra.

## Vérification et limites

TypeScript strict, tests CPU, build Vite, budget de bundles et validation des archives. Les tests ajoutés couvrent la qualité Ultra réelle des réglages du moteur, les migrations, la cadence, les rendus figés, les sous-pas/animations, les compilations retardées, le préchauffage d’armes animées, les collisions de caméra, les tirs, les articulations et la conservation des modèles.

Les scènes et shaders sont construits sur CPU, mais aucune session graphique n’est disponible ici. L’apparence finale, la compilation GPU réelle, la chauffe, la consommation et la fluidité sont à contrôler sur PC et téléphone. Les réductions de travail et de rendus inutiles ne constituent pas une mesure de batterie économisée. Ultra reste matériellement plus coûteux qu’un profil Performance.

La publication Sites reste statique. Le backend Neon/Vercel, ses migrations et les comptes restent à activer avec une connexion réelle ; cette mise à jour ne change pas cette disponibilité.
