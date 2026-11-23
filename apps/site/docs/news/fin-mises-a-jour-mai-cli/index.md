# mAI CLI : fin des mises à jour

Nous annonçons aujourd'hui l'arrêt du développement et de la publication de mises à jour pour **mAI CLI**. L'outil passe en statut gelé : aucune nouvelle version, aucune évolution fonctionnelle et aucun correctif ne seront désormais déployés.

---

## Ce qui change concrètement

- **Aucune mise à jour future** : les canaux `main` et `canary`, le paquet `@mdevs/mai-cli` ainsi que la commande `mai --update` ne recevront plus de nouvelles publications.
- **Retrait de la page Téléchargements** : mAI CLI n'est plus mis en avant parmi les applications actives sur notre portail de téléchargement.
- **Impact lié à l'arrêt de l'API mAI** : conformément à notre annonce sur [l'arrêt de l'API le 10 décembre 2026](/site/news/arret-api-mai-decembre-2026), les appels dirigés vers l'infrastructure API mAI cesseront de fonctionner à compter du 10 décembre 2026.

Les installations déjà présentes sur vos postes restent utilisables en l'état uniquement avec vos propres clés fournisseurs (**mode BYOK** : OpenAI, Anthropic, Google Gemini, Groq ou Ollama en local), sans garantie de compatibilité future.

---

## Pourquoi concentrer nos efforts ailleurs ?

La suite mAI s'articule désormais autour d'expériences plus complètes et maintenues activement sur le long terme :

- **mAI Coder** reprend et dépasse le périmètre de mAI CLI en réunissant dans une application de bureau native des terminaux PTY complets, un éditeur Monaco, l'intégration Git et des agents autonomes équipés du protocole MCP.
- **mAI Desktop** et **mAI Web** centralisent l'ensemble des outils conversationnels, projets et connecteurs dans une interface unifiée.
- **Ollama** permet d'exécuter directement en terminal nos modèles open-weights locaux (**mAI-1**, **mAI-1.2**, **mAI-1.5**), sans couche intermédiaire.

---

## Quelle alternative adopter ?

| Besoin initial avec mAI CLI | Solution recommandée |
|---|---|
| Agent de codage, terminal intégré et édition de dépôt | **[mAI Coder](/site/downloads)** (macOS, Windows, Linux) |
| Discussion directe et tâches autonomes avec les modèles cloud | **[mAI Web](/) / [mAI Desktop](/site/downloads)** |
| Inférence locale rapide depuis un shell | **`ollama run mDevsLabs/mAI-1.5-Apex`** ([Modèles](/site/models)) |

Nous remercions toutes les personnes qui ont testé et utilisé mAI CLI depuis son lancement en juillet 2026. Pour toute question, vous pouvez contacter l'équipe depuis l'[espace d'assistance](/site/support).
