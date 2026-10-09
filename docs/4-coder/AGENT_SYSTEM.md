# 🧠 Système d'Agents & Boucle d'Exécution — mAI Coder

Ce document décrit en détail la boucle d'exécution de l'agent, les modes Composer et le mécanisme de garde-fous pour les actions sensibles.

---

## 1. 🔄 La Boucle Agentique

La boucle de l'agent repose sur quatre phases transparentes :

1. **Réfléchir (Think)** :
   - L'agent analyse la demande utilisateur, explore le contexte de l'espace de travail (fichiers ouverts, arborescence, diffs Git, résultats précédents).
   - Utilise le modèle configuré (Claude 3.7 Sonnet, GPT-4o, Gemini 2.0 Flash...) pour émettre un raisonnement structuré.
2. **Planifier (Plan)** :
   - L'agent décompose la tâche en étapes élémentaires vérifiables.
3. **Exécuter (Execute)** :
   - L'agent invoque un outil spécifique (`read_file`, `write_file`, `edit_file`, `execute_command`, `browser_navigate`, `mcp_tool`...).
   - Les arguments de l'outil sont envoyés en streaming à l'interface pour une visibilité immédiate.
4. **Observer (Observe)** :
   - Le résultat d'exécution (sortie terminal, contenu lu, statut) est retourné à l'agent comme nouvelle observation pour le tour suivant.

---

## 2. 🎛️ Les Quatre Modes Composer

| Mode | Objectif | Comportement des Outils |
|---|---|---|
| **Agent** | Autonomie complète | Exécute les lectures, écritures et commandes de manière itérative jusqu'à l'atteinte de l'objectif. |
| **Plan** | Conception préalable | Rédige et soumet un plan d'action détaillé à l'approbation de l'utilisateur avant toute modification. |
| **Ask** | Consultation & Analyse | Répond aux questions sur le code en lecture seule. Tous les outils modifiant le système sont désactivés. |
| **Debug** | Dépannage ciblé | Se concentre sur l'isolation des bugs, l'analyse des stack traces et la validation par tests unitaires. |

---

## 3. 🛡️ Porte d'Approbation des Outils (`ToolApprovalGate`)

Pour garantir qu'aucun script imprévu ou destructif ne s'exécute à l'insu du développeur :
- Les outils classés **sensibles** (ex: `execute_command` avec des commandes à fort impact comme `rm`, `git reset`, `npm install`, ou écritures de fichiers hors du projet) mettent la boucle en pause.
- L'interface affiche une carte interactive invitant l'utilisateur à **Approuver** ou **Refuser** l'action.
- L'option d'auto-approbation peut être paramétrée dans les réglages pour les commandes jugées fiables.
