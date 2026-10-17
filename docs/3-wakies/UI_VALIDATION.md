# Vérification de l’interface et du chat Wakies

L’interface active est le port React DOM sous `components/wakies`. Les sources Expo/Hono dans `apps/wakies` restent une référence ; elles ne deviennent ni un second compte, ni un serveur de conversations obligatoire.

## Corrections livrées

- Navigation principale latérale sur desktop, navigation basse sur téléphone et tablette. Le rail redondant a été retiré ; le retour aux autres produits mAI reste accessible depuis le logo Wakies. Le tiroir mobile dispose d’un bouton Fermer, d’Échap et d’un piégeage du focus ; il se ferme au choix d’une destination.
- Boutons, champs et zones de texte des parcours principaux utilisent `packages/ui`. Les feuilles historiques sont dans `wakies-base`, avant `mdevs`. Les règles et animations du paquet restent limitées à `.wakies-root`. Aucun fichier du paquet partagé ni du layout des autres applications n’est modifié.
- Icônes liées à la couleur de leur bouton, cibles tactiles de 44 px minimum, compositeur sur deux lignes avec le message en pleine largeur. La hauteur est recalculée lors du retour sur un brouillon. Les dialogues sont lisibles sur fond opaque et la bibliothèque de fichiers devient une feuille mobile.
- La mascotte ouvre la personnalisation. Le portail du menu de modèles passe au-dessus du dialogue Wakies, se ferme après sélection et conserve le dialogue parent lors d’Échap. Le refus d’abandonner une page protège aussi le changement de Wakie et la création d’une conversation.
- Le chat utilise les callbacks `onEnd` de l’AI SDK installé. Un arrêt ou une annulation est enregistré comme `interrupted`, avec conservation de la réponse partielle. Une erreur de chargement MCP est signalée sans bloquer la conversation textuelle.

## Périmètre audité

Les points d’entrée examinés comprennent la coquille, la navigation, le chat et son transport, le catalogue de modèles, la personnalisation, les fichiers, les cartes de résultats d’outils, les brouillons et la file, ainsi que la route `/api/wakies/chat`, la résolution des capacités, les fabriques Plugins/MCP et le filtrage `activeTools` du SDK installé. Les permissions et données restent gérées par les services mAI ; les fonctions optionnelles désactivées ne sont pas présentées comme exécutables.

## Reproduction

Voir `tests/manual/WAKIES_UI.md`. Le script `tests/manual/wakies-responsive.cjs` utilise les vrais composants et intercepte les API. Il vérifie 375×812, 430×932, 768×1024 et 1440×900 : navigation, historique, conservation du brouillon, bibliothèque de fichiers, taille des contrôles, contraste de l’icône Envoyer, clavier du tiroir et du dialogue, sélection d’un modèle et fermeture d’un menu imbriqué.

Les captures de référence sont dans `verification/fixture-*.png`. Les captures après correction et le résultat de la dernière exécution sont dans `verification/ui-after/`. Les fichiers de captures isolés ne signifient pas que l’ensemble du script est passé : consulter `responsive.json` et le compte rendu final.

Les tests de la route utilisent le vrai moteur de streaming AI SDK avec `MockLanguageModelV4` et des accès aux données contrôlés. Ils vérifient notamment réponse, historique serveur, identifiant assistant, résultat d’outil persisté, usage cumulé, arrêt partiel, refus d’un outil exclu, compte étranger, session absente, forfait Free, quota et rejeu. Ils ne constituent pas une validation avec un fournisseur distant ni une écriture PostgreSQL réelle.

Aucune migration supplémentaire n’est nécessaire pour ces corrections UI. Les migrations déjà appliquées restent en place. Les validations Capacitor/Electron sur appareil natif et une conversation avec session/fournisseur réels doivent être distinguées des contrôles responsive du navigateur.
