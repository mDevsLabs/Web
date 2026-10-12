# Revue UI et applications natives — 12 octobre 2026

## Périmètre

Interface examinée sur la preview demandée : <https://m-ai-officiel-eruq0wxb1-mdevslabs.vercel.app>.
Origine de production confirmée pour les clients natifs : <https://mai-officiel.vercel.app>.

La navigation a couvert l'accueil, Wakies (Aujourd'hui, Espaces, amis et messages), la création d'images et d'audio, les trois catalogues d'outils, les projets, la bibliothèque, les bots, le planning, les notifications, les archives, Vibe et le site officiel, avec des observations sur ordinateur et au format téléphone.

Les corrections sont dans le dépôt. La preview distante n'a pas été redéployée pendant cette revue.

## Corrections demandées

| Sujet | Correction |
| --- | --- |
| Rail Wakies | Même hauteur et alignement vertical pour le nom, les notifications et le bouton de réduction. |
| Options des Espaces | Portail dans le rail ou la coquille Wakies, position fixe calculée dans le viewport, options au premier plan et hors des listes défilantes. |
| Clavier des options | Focus initial, flèches, Début/Fin, fermeture par Échap avec retour au déclencheur, attributs ARIA. |
| Accueil mAI | Label Bêta sur l'entrée Wakies du menu principal, y compris l'entrée verrouillée. |
| Versions natives | Identifiant de déploiement Web public sans cache ; contrôle chaque minute, au retour visible, au focus et au retour réseau. |
| Protection des travaux | Rechargement différé pendant une réponse IA, une génération, une action du planning, un brouillon, un fichier sélectionné, un dialogue ou une édition. |
| Coder desktop | Préparation et copie du runtime Electron complet avec ses ressources et modules natifs dans l'installateur ; garde bloquante si le binaire manque. |
| Lancement Coder | Processus natif dédié, argument d'espace de travail, suppression du mode Node hérité, remontée des erreurs au bouton. |
| Compilation Coder | Résolution de `import.meta.dirname` dans le bundle CommonJS pour éviter un chemin de ressources invalide au démarrage. |
| Workflow | Retrait du build autonome du site déjà porté dans Next, des commandes de listing, des échecs masqués et du faux IPA ; conservation des builds Vibe distincts. |

## Corrections supplémentaires

- **Wakies mobile** : hauteur `100dvh`, barre inférieure défilante sans chevauchement des huit entrées, actions tactiles agrandies, bouton de réduction masqué dans le menu mobile.
- **Wakies** : titre « Amis » correct, textes alternatifs français pour les mascottes, logo décoratif sans annonce inutile.
- **Bots** : en-tête adapté au téléphone, filtres défilants, états sélectionnés annoncés, champs et boutons nommés.
- **Outils** : filtres de plugins, MCP et skills défilants horizontalement ; états et recherche accessibles.
- **Projets** : libellés des vues, recherches et options ; cases de sélection du tableau nommées en français en conservant leur état intermédiaire ; actions individuelles avec contrôle des erreurs et rafraîchissement de l'historique.
- **Bibliothèque et archives** : champs de recherche nommés pour les lecteurs d'écran.
- **Planning** : bouton de retour, fallback SWR filtré par statut, état vide adapté au filtre, erreur visible avec réessai, couleur d'avertissement du design system.
- **Réglages de notifications** : suppression du débordement mobile, statuts navigateur en français, demande désactivée lorsqu'elle est impossible, détection après montage, contrôles fins désactivés lorsque les notifications sont coupées.
- **Cloche de notifications** : contrôle des réponses HTTP avant d'afficher un succès, erreurs individuelles visibles, panneau borné à la largeur du viewport, badge utilisant le token destructif.
- **Navigation mAI** : noms des boutons en français ; squelette du rail masqué sur mobile.
- **Coder côté Web** : ordre des hooks stable, suppression du Markdown affiché littéralement, textes correspondant au runtime et à ses réglages propres, erreurs de lancement affichées.
- **Vibe** : une réponse de recherche ancienne ne remplace plus les résultats de la dernière saisie ; champ et effacement nommés. Réponses IA, approbations, générations des livres et envois de messages ou fichiers empêchent le rechargement automatique pendant leur exécution.
- **Site officiel** : description du modèle Mini et pied de page en français, lien « Gérer les clés » corrigé, suppression d'un bouton imbriqué dans un lien.
- **Desktop** : version transmise au preload sandboxé, liens internes dans une nouvelle fenêtre désormais ouverts, origine exacte pour les ponts CLI/Coder et erreurs d'ouverture visibles.
- **Mobile** : schéma local iOS `capacitor`, erreurs des scripts de compilation propagées ; Vibe charge aussi le portage Web officiel sous `/vibe`.
- **CI** : installation stricte depuis les lockfiles, Node 22, préparation Coder pour les deux architectures macOS, recompilation des modules natifs desktop, tests Web et Coder, artefacts manquants bloquants et respect du choix de build iOS.

## Vérification visuelle locale

Les composants réels `SpaceMenu`, `WorkspaceNavigation` et `GlobalSearchBar` ont été montés dans une fixture locale sans données de compte.

- Sur ordinateur, les trois éléments du rail ont une hauteur de 36 px et le même centre vertical.
- À 390 × 844, la racine Wakies occupe les 844 px et le menu complet reste dans l'écran, hors du conteneur défilant.
- Fin déplace le focus au dernier élément ; Échap ferme le menu et redonne le focus au bouton des options.
- Pour Vibe, les deux réponses ont été délivrées dans l'ordre inverse : après réception de l'ancienne réponse et réouverture du panneau, les résultats correspondent toujours à la seconde saisie.

## Vérifications de code

- `pnpm check` et `pnpm typecheck` : réussis.
- Suite Web : 137 fichiers réussis, 1 511 tests réussis et 4 ignorés. Le dernier passage limite les workers à deux pour réduire la consommation de mémoire.
- Coder : contrôle des types réussi ; 118 fichiers de tests et 713 tests réussis ; bundles Main et Renderer compilés.
- Desktop : compilation TypeScript et terminal réussie ; mobile : compilation de la configuration réussie.
- Scripts de préparation et garde Coder : syntaxe valide. Workflow : YAML valide, 14 jobs, dépendances présentes.
- `git diff --check` : réussi.
- Build Web complet avec `MAI_DISABLE_BUILD_CACHE=1` : réussi, bundles compilés, types validés et 259 pages générées.
- Artefacts du build : identifiant de déploiement identique dans la route serveur de version et le bundle client, afin d'éviter un rechargement permanent des clients natifs.

## Limites de validation

Le terminal desktop propose l'installation du CLI si celui-ci manque ; Node.js et npm sont nécessaires. Le CLI n'est pas un paquet embarqué dans l'installateur. Coder, lui, doit être embarqué par la préparation et la garde de packaging.

La compilation des bundles Coder et des clients desktop/mobile a été exécutée. La préparation de l'installateur Coder sur cette machine Windows s'arrête sur la compilation native de `better-sqlite3`, faute d'outils C++ Visual Studio. L'installation et le lancement réels d'un paquet complet restent donc à vérifier sur une machine équipée ou dans la CI prévue à cet effet.

Le premier build Next a compilé les bundles, puis a été arrêté lors de la vérification des types après un avertissement de compactage du cache Turbopack, avec moins de 700 Mo libres sur C:. La suppression du cache généré a été refusée par le contrôle automatique d'approbation. La relance complète sans cache de build sur disque a réussi. L'option locale reste disponible ; le cache est également désactivé en CI où il n'est pas restauré.

Le build local journalise l'absence de `CRON_SECRET` pour Vibe et refuse ces appels, conformément à sa garde. Ce journal local ne permet pas de conclure sur la configuration de la preview ou de la production.

Les modifications de l'interface Web seront reçues par les clients natifs après déploiement. Les nouvelles fonctions de packaging Coder, Electron et Capacitor nécessitent de construire et distribuer de nouveaux installateurs.
