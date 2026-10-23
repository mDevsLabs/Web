# BLACKLINE 1.2.0 — Stabilité et nouvelles arènes

## Corrections et expérience

- Le bouton d’échelle démarre un trajet contextuel au lieu d’exiger une direction après l’accrochage. Suspendre/reprendre reste possible ; le mode manuel accepte les commandes d’avance/recul. L’entrée descendante et la sortie sur le toit sont interpolées. Une direction maintenue avant saisie ne retourne plus immédiatement le joueur sur le toit. La sortie vérifie le volume complet du joueur ; on ne saisit plus une échelle à travers un mur depuis l’intérieur d’un bâtiment.
- Saut/décès libèrent l’état de transition. Sprint/glissade ne restent pas actifs sur l’échelle. Les appuis simultanés de plusieurs doigts sur un même bouton d’action sont regroupés.
- Connexion, inscription et synchronisation de compte retirées. Progression locale conservée, export/import sans compte ; import validé et inventaire complet actualisé, génération précédente conservée. Aucun compte SQL n’est supprimé. Les routes anciennes sont retirées (410) même si les variables d’environnement restent configurées.
- Suppression du choix FPS manuel ; image/énergie, caméra/visée, assistance regroupés. Nouvelles sensibilités de visée, taille du réticule, zone morte, recharge/échelles automatiques. Réglages de mouvements et de confirmation unifiés ; remise à zéro des seuls réglages.
- Nouvelles arènes Sylve et Vulcain. Tailles, parcours, couverts, végétation, ciel, éclairage et décors distincts. Port et base désertique restent disponibles et reçoivent des marquages propres. Chaque arène a six toits avec échelles et deux bâtiments avec étages accessibles.
- 1–20 ennemis et 1–20 équipiers séparément, apparitions séparées, identifiants uniques. La survie maintient les alliés entre les vagues et termine une vague quand les ennemis sont éliminés. Les alliés peuvent réapparaître ; le nombre d’ennemis reste celui configuré, avec santé progressive.
- Statistiques détaillées et classement en fin de partie. Les dégâts comptent la vie effectivement retirée, pas les surdégâts.
- Projets Electron et Capacitor avec ressources embarquées, lockfiles, icônes, scripts de préparation et workflow GitHub Actions pour les plateformes bureau/mobile.

## Validation

198 tests automatisés réussis. Tests CPU couvrant quatre cartes, accès aux objectifs et ravitaillements, six échelles par carte, montée/descente tactiles sans joystick, pause/reprise, direction maintenue, mode manuel et saut. Partie réelle simulée à 20 alliés/20 ennemis ; vagues de survie et progression. Contrôles des imports, réglages unifiés, routes retirées et protocole desktop.

TypeScript, compilation et budgets de chunks contrôlés. Préparation locale Android et iOS avec Capacitor, intégration des quatre plugins, génération des assets du pont natif, validation XML/plist/YAML et configuration du paysage. Copie des assets Electron vérifiée.

La vérification visuelle/GPU n’a pas pu être réalisée, l’aperçu navigateur étant bloqué dans cet environnement. Les compilations finales NSIS/DMG/AppImage/APK/iOS et le workflow GitHub Actions n’ont pas été exécutés ici. Aucun débit 8K/120 ni absence absolue de bugs n’est garanti.
