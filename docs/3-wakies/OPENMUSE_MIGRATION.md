# Cartographie et décisions OpenMuse

## Références vérifiées

mAI canary : c7a390aedc0424d83fc552d13ea189ab417c7f66 ; OpenMuse main : 1ac68f3909f2478ab6280883f1ab5ea65eb5719d. Les références distantes correspondaient aux références fournies. Un clone officiel a précédé les modifications. SOURCE_MANIFEST.json valide les 226 fichiers importés et SOURCE_AUDIT.json indexe les modules, imports, exports et symboles critiques. Cet index complet ne signifie pas une revue manuelle exhaustive de chaque ligne.

Le travail local préexistant a été sauvegardé avant remplacement, avec le patch et les adaptations Wakies. L'ancien apps/wakies a été retiré de l'arbre actif ; ses deux sources CSS utiles ont été transférées vers integration/web. Aucun fichier source officiel n'est altéré hors renommage de README/package. Licence MIT conservée. Les sources facultatives gardent leurs mentions techniques et légales OpenMuse.

## Cartographie

| Source | Interface active | Services mAI |
|---|---|---|
| App.tsx, ui.tsx | cinq destinations, surfaces et navigation DOM | layout Wakies dédié |
| chat.tsx, conversation-queue.ts, conversation-run.ts | Chat, DraftProvider, file et arrêt | API /chat, AI SDK |
| assistant-response.tsx, agent-ui.tsx | ChatTranscript, ToolResultCard | UIMessage, Streamdown |
| threads.tsx et Rich Threads | ConversationList, messages paginés | PostgreSQL |
| workspace.tsx, screens.tsx | Apps, Activité, pages, mémoires, objectifs simples | APIs existantes |
| serveur/auth/models/Intelligence | source non exécutée | session, catalogue, permissions mAI |
| domain/integrations/backends/worker/computer | sources optionnelles conservées | services non configurés |

React DOM est retenu pour conserver le React et les composants de l'hôte. react-native-web aurait exigé alias, transpilation Expo et preuve de compatibilité des API de plateforme. Aucune comparaison chiffrée des bundles des deux stratégies n'a été effectuée : le choix évite les nouvelles dépendances sans prétendre à une mesure inexistante.

## Plan et critères de validation

1. Vérifier commits, état local, sauvegarde et clone officiel. Critère : manifeste et absence de .git imbriqué.
2. Remplacer la source et isoler les modules Expo/Hono. Critère : aucune dépendance source ajoutée au package racine.
3. Raccorder le port DOM et préserver les fonctions hôte. Critère : /wakies importe la nouvelle navigation et le chat adapté.
4. Sécuriser historique, modèle, origine et idempotence. Critère : refus entre comptes, messages forgés, quotas, migration additive et tests de streaming.
5. Conserver fichiers, tâches, mémoires, Skills/Plugins/MCP ; ajouter objectifs simples et capacités honnêtes. Critère : aucune simulation de données ou infrastructure.
6. Vérifier styles isolés et tailles d'écran. Critère : tests statiques puis navigateur, distingués des tests natifs.
7. Exécuter TypeScript, style, tests unitaires, plugins et build. Critère : résultats consignés dans VALIDATION_OPENMUSE.md.

## Limites à poursuivre

Idées et le moteur autonome Goals ne sont pas activés. Les approbations sensibles demandent une reprise serveur avant exposition. La recherche actuelle filtre la liste chargée, sans archivage de conversation. Le contexte modèle est borné aux 199 messages récents sans résumé automatique. Brouillons/file ne sont pas synchronisés. Le sélecteur des pièces jointes privées mAI est raccordé ; la bibliothèque cloud du backend Val Town conserve son parcours existant distinct.

La migration 0043 doit être appliquée avant utilisation du nouveau chat. La livraison ne doit pas être déclarée validée en production avant tests PostgreSQL réel, fournisseur réel, fichiers privés et parcours Capacitor/Electron. Aucun déploiement, base distante ni service externe payant n'est automatiquement créé.
