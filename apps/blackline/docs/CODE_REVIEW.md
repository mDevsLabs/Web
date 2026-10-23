# Revue de code — Alpha 0.8

Périmètre : amorçage, imports et cascade CSS, interfaces et navigation, paramètres et commandes, modèles et géométries, combat, physique verticale, grenades, progression, sauvegardes, PNJ, API de profils/comptes, migrations et export. Les tests existants couvrent aussi navigation A*, visibilité, objectifs, animation, matériaux, contrôle tactile, reprise de partie et optiques. Cette revue ne garantit pas l’absence de tout autre défaut.

| Zone | Défaut ou risque constaté | Changement vérifié |
| --- | --- | --- |
| Grenades / mêlée | Distances au sol malgré une cible sur un toit | Distance 3D, rayon et avertissement cohérents avec l’altitude |
| Lancer | Point de libération pouvant se trouver dans un mur proche | Contrôle de collision entre l’œil et le point de libération |
| Domination | Capture possible depuis un étage au-dessus de l’objectif | Limite de hauteur alignée sur le contrôle au sol |
| Survie | Récompense de fin de vague possible sur une image où le joueur est mort | Condition explicite de joueur vivant |
| Simulation | Temps de jeu ralenti sous 25 FPS par le plafond de 40 ms | Sous-pas jusqu’à 100 ms, chacun au plus 1/60 s |
| PNJ | Angle courant d’une cible encore utilisé entre deux perceptions après occultation | Abandon de la cible courante ; dernière position observée conservée |
| PNJ | Répulsion entre acteurs de deux étages différents | Filtre vertical et évitement local anticipé au même niveau |
| Rendu | Largeur spécifique d’une traînée perdue aux images suivantes | Largeur conservée dans l’état du projectile |
| Interface | Un tri automatique des imports pouvait changer la cascade CSS | Entrée unique `theme.css` avec ordre explicite |
| Inventaire | Quatre emplacements codés en dur | Catalogue de six armes, commandes 5/6, verrouillage moteur et interface |
| Achats | Risque de débit répété ou équipement non possédé | Catalogue partagé, déduplication, budget et validation à la lecture |
| Sauvegarde | Réglages et nouvelles données absents du profil connecté | Migration 004 et sérialisation collection/guide/réglages |
| Préparation | Compilation GPU pouvant prendre trop longtemps | Étapes asynchrones, progression monotone et délais GPU bornés |
| Visée | Bascule PC réinitialisée au relâchement en mode sans capture | Conservation de la bascule, annulation lors d’une interruption |
| Progression | Éliminations de grenade créditant l’arme tenue | XP d’arme attribuée aux dégâts de tir uniquement |

Les deux armes achetées utilisent leurs statistiques réelles. Le SG-8 consomme une cartouche pour six rayons, compte la précision une fois par détente et produit un seul bruit de tir. Les effets de tirs utilisent des matériaux distincts dans le pool pour ne pas changer les projectiles des PNJ. Les pools restent bornés. Les cartes procédurales et les modèles sont mis en cache.

Le budget de maillages n’a pas été relevé pour intégrer les nouveaux détails. Les matériaux des conduits et grilles sont regroupés avec ceux du décor existant. Les détails secondaires restent masqués en Performance.

Vérifications : TypeScript strict, tests CPU, construction des arènes, optiques ouvertes, prix SQL cohérents, compilation Vite, absence d’URL SQL dans les bundles, moteur chargé après l’interface, archive sans secrets. Le serveur de comptes reste désactivé tant que Neon/Vercel ne sont pas configurés.

Limites : aucun navigateur de test pris en charge n’est disponible dans cet environnement. Le rendu GPU, la performance et la disposition sur un téléphone réel ne sont donc pas vérifiés visuellement. La migration est créée et versionnée, mais n’est pas exécutée sur une base Neon distante. L’économie reste celle d’un jeu solo dont le client est propriétaire de sa progression ; il n’y a ni paiement réel, ni classement anti-triche.
