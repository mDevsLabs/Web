# Validation de BLACKLINE 1.0.0

Cette version privilégie les règles partagées, la migration des anciennes sauvegardes et des changements de rendu bornés. Les anciens prix et achats restent conservés ; les pièces de puissance sont une monnaie distincte des crédits.

148 tests CPU passent, ainsi que TypeScript strict, le build et le contrôle de bundles. Le moteur Three.js reste dans un chunk distinct d’environ 524 Ko ; aucun chunk ne dépasse le budget de 600 Ko.

## Contrôles automatiques

- TypeScript strict sans émission ; tests Node.js CPU ; build Vite ; budget de chunks et absence de connexion SQL dans le JavaScript navigateur.
- Conservation du niveau d’arme avant migration, conversion idempotente, seuils exacts des 200 niveaux, achats de puissance bornés par maîtrise et solde.
- Récompenses quotidiennes et hebdomadaires, frontières UTC dimanche/lundi, refus des doublons et recul d’horloge détectable. Ces contrôles locaux ne sont pas un système anti-triche.
- Cinq emplacements, possession d’armes, remplacement d’une arme dans le sac, soins limités par charge et HP, maintien de la sélection des anciennes armes achetées.
- Générations de sauvegarde, checksum, récupération après troncature, quota plein et export/import normalisé. Une panne du stockage navigateur est signalée.
- Conflit de révision cloud : le second envoi utilise la révision reçue ; une réponse 409 arrête les écritures suivantes. Validation commune client/API et structure additive de la migration 005.
- Portes et escaliers de tous les bâtiments accessibles, arrivée à l’étage et retour au sol, fenêtres ouvertes aux tirs, murs pleins bloquants, grands pas et marches trop hautes.
- Grille spatiale comparée au parcours complet sur 300 requêtes déterministes ; navigation et simulations de combat/escouades de 90 secondes par carte.
- Caméra d’épaule bloquée par un mur, tir automatique ne contournant pas le couvert, transitions de caméra, modèles/tenues et budget de maillages conservé malgré l’agrandissement.
- Moteur et pages secondaires absents des préchargements de l’entrée HTML ; chunks séparés ; effets dans des pools fixes ; onglet caché sans rendu ni nouveau temporisateur.

## Revue et correctifs pendant la préparation

Les tests ont détecté et permis de corriger l’appui insuffisant sur les marches, le choix d’une arme achetée non ajouté au sac, les attentes d’optique sur les nouvelles familles d’armes, les doublons de matières des tenues et des dépendances circulaires entre chunks graphiques. Les panneaux statiques ont été regroupés dans un atlas ; les détails d’intérieur utilisent exactement les panneaux physiques. Les écritures de profil utilisent une comparaison de révision, avec des écritures subordonnées conditionnées par le nonce de transaction.

## Vérifications nécessitant l’appareil ou les services

Aucun navigateur graphique n’est disponible dans cet environnement. La construction des scènes, des géométries, des shaders et de leurs paramètres est testée sur CPU ; la compilation GPU et l’apparence finale ne sont pas observées. À vérifier sur PC, Safari iOS et Chrome Android : lisibilité des fenêtres/escaliers, cadrage de la caméra, gestes à plusieurs doigts, confort du bouton VUE, changement portrait/paysage, chauffe et consommation sur une session longue.

La base Neon et les comptes ne sont pas activés sur le Site statique. Les migrations 001 à 005, l’inscription, la connexion et une vraie concurrence SQL doivent être exécutées sur le backend Vercel connecté avant d’annoncer une sauvegarde en ligne opérationnelle. L’e-mail n’est pas encore vérifié et aucune récupération de mot de passe par e-mail n’est fournie. Exporter sa sauvegarde locale reste disponible sans serveur.

Les PNJ restent au sol ; leurs lignes de vue et leurs tirs prennent en compte la hauteur, mais ils ne parcourent pas les escaliers ou échelles. Les niveaux, récompenses et achats appartiennent à un jeu solo sans paiement réel ni classement compétitif protégé.
