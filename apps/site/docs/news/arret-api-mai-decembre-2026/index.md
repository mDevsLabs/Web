# Arrêt de l'API mAI le 10 décembre 2026

À compter du **10 décembre 2026**, l'API publique mAI cessera définitivement de fonctionner. Tous les points de terminaison exposés aux développeurs externes (`/v1/*`, génération audio/images via API et gestion de clés API) seront mis hors service à cette date.

---

## Pourquoi cet arrêt ?

Ces derniers mois, l'écosystème mAI s'est recentré autour d'une architecture unifiée et de ses applications officielles (**mAI Web**, **mAI Desktop**, **mAI Coder**, **mAI Vibe**, **Quizzly**, **Wakies** et **Blackline**).

Maintenir une API publique distincte pour des appels tiers implique une charge d'infrastructure et de sécurité qui ne correspond plus à la trajectoire produit de mDevsLabs. Nous concentrons désormais l'ensemble de nos ressources sur nos applications, sur les agents intégrés et sur la distribution de nos modèles locaux.

---

## Calendrier et impact technique

| Date | Étape |
|---|---|
| **23 novembre 2026** | Annonce officielle de la fermeture et entrée en période de transition |
| **10 décembre 2026** | Arrêt complet des points de terminaison de l'API publique et désactivation des clés API associées |

Concrètement, à partir du **10 décembre 2026** :

- Les requêtes authentifiées par clé API (`Authorization: Bearer mai-...` ou `mp-...`) renverront une erreur et ne seront plus servies.
- Aucune nouvelle clé API ne sera délivrée ni renouvelée.
- Les intégrations tierces ou scripts personnels qui dépendent de l'API mAI devront être migrés avant cette date.

---

## Ce qui continue de fonctionner sans interruption

L'arrêt concerne **uniquement l'API publique externe**. L'ensemble de la plateforme applicative reste pleinement opérationnel :

- **mAI Web** ([accéder à l'application](/)) : discussions, Mode Agent, projets, skills, connecteurs MCP, mémoire et génération multimédia.
- **mAI Desktop & mAI Coder** ([télécharger](/site/downloads)) : vos applications natives de bureau restent maintenues et synchronisées avec votre compte.
- **mAI Vibe, Quizzly, Wakies et Blackline** : aucun impact sur vos comptes, vos données ou vos quotas d'abonnement.

---

## Solutions de remplacement recommandées

Pour vos usages nécessitant une exécution locale ou automatisée :

1. **Modèles locaux open-weights via Ollama ou Hugging Face** : les familles **mAI-1**, **mAI-1.2** et **mAI-1.5** restent librement téléchargeables et exécutables sur vos propres machines sans clé distante ([catalogue des modèles](/site/models)).
2. **mAI Coder** : pour les flux d'ingénierie logicielle, d'automatisation locale et d'orchestration d'outils MCP directement sur votre poste ([Téléchargements](/site/downloads)).
3. **mAI Web & mAI Desktop** : pour l'accès aux modèles cloud et aux agents autonomes dans l'écosystème officiel.

Pour toute question liée à votre compte ou à la transition de vos usages, notre équipe reste disponible via l'[espace d'assistance](/site/support).
