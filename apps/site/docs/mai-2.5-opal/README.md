# mAI-2.5-Opal

mAI-2.5-Opal est le fleuron de la génération mAI-2.5, conçu comme un modèle cloud souverain très haute performance accessible sur la plateforme mAI. Il représente le plus haut niveau de capacités cognitives, d'ingénierie logicielle et d'autonomie agentique de notre laboratoire.

| Caractéristique | Valeur |
| --- | --- |
| Identifiant | mai-2.5-opal |
| Positionnement | Fleuron (Flagship haute performance) |
| Contexte déclaré | 1 000 000 tokens |
| Sortie maximale déclarée | 384 000 tokens |
| Entrée image & vision | Oui (Multimodal natif) |
| Entrée documents & fichiers | Oui |
| Licence indiquée | Propriétaire |
| Date de sortie indiquée | 19 novembre 2026 |

## Avancées technologiques majeures

mAI-2.5-Opal marque une rupture majeure sur trois compétences fondamentales :

### 1. Raisonnement approfondi (Thinking)
mAI-2.5-Opal intègre un moteur de réflexion pas-à-pas autonome capable d'explorer des arbres d'hypothèses, de vérifier ses déductions intermédiaires et de corriger ses propres erreurs avant de finaliser sa réponse. Sur les problèmes de logique formelle, de mathématiques avancées et de stratégie, Opal maintient une cohérence parfaite même sur des chaînes de réflexion de plusieurs dizaines de milliers de tokens.

### 2. Codage & Ingénierie logicielle
Doté d'une fenêtre de contexte d'un million de tokens, mAI-2.5-Opal ingère et modélise des référentiels de code complets. Il excelle dans la détection de régressions subtiles, le refactoring d'architectures distribuées, la génération de tests unitaires et d'intégration complets, et la production de code propre respectant scrupuleusement les contraintes de performance et de sécurité.

### 3. Utilisation de l'ordinateur (Computer Use)
Opal est nativement entraîné pour interagir avec les environnements informatiques modernes : navigation dans des interfaces graphiques complexes (GUI), manipulation fluide du terminal et des shells d'OS, exécution sécurisée d'outils et pilotage de flux multi-agents. Il transforme des objectifs de haut niveau en séquences d'actions concrètes exécutées sur la machine hôte.

---

## Benchmarks

mAI-2.5-Opal est évalué face aux modèles de pointe les plus récents de l'industrie ainsi qu'à la génération précédente mAI-2 :

| Benchmark | mAI-2.5 Opal | mAI-2 | Claude Opus 5.5 | Gemini 4 Argon | GPT-6 Astra |
|:---|---:|---:|---:|---:|---:|
| **GPQA Diamond** | 95.4 | 90.9 | 90.6 | — | 95.8 |
| **HLE (Humanity's Last Exam)** | 52.9 | 36.8 | 61.4 | 57.1 | 54.7 |
| **HLE (w/tools)** | — | 63.9 | 67.7 | — | 57.2 |
| **Codeforces (Rating)** | — | 3471 | — | — | — |
| **MathArena Apex** | — | 65.6 | — | — | — |
| **DeepSWE v1.1** | 75.2 | 74.2 | 74.2 | 77.9 | 74.1 |
| **SWE-bench Verified** | 72.4 | — | 71.2 | 70.8 | 74.5 |
| **Terminal-Bench 2.1** | — | 90.6 | — | — | — |
| **Terminal-Bench 3.0** | — | 30.0 | — | — | — |
| **Terminal-Bench 4.0** | 56.1 | 31.2 | 66.4 | 57.4 | 57.9 |
| **OSWorld (Computer Use)** | 71.4 (v2.0)* | — | 22.0 | — | 38.2 |
| **WebArena** | 39.4 | — | 35.8 | — | 41.5 |
| **CyberGym** | — | 88.1 | — | — | — |
| **SEC-Bench Pro** | 78.8 | 62.8 | — | — | 85.4 |
| **AutomationBench** | 31.7 | 54.8 | 42.5 | 51.3 | 41.4 |
| **Agents' Last Exam** | — | 31.8 | 38.2 | 39.5 | 34.2 |

### Notes de méthode

- Un tiret cadratin (`—`) indique qu'aucun résultat public vérifiable ou protocole équivalent n'est disponible pour le modèle sur cette version d'épreuve.
- `*` Sur **OSWorld (Computer Use)**, le score `71.4 (v2.0)` de mAI-2.5 Opal est mesuré sur le jeu hors-ligne **OSWorld 2.0** à effort maximal (tandis que `22.0` et `38.2` relèvent du barème v1).
- Les métriques `OSWorld` et `WebArena` mesurent spécifiquement l'utilisation d'outils et de l'ordinateur en environnement de bureau et web synthétique.
- Les versions de `Terminal-Bench` (2.1, 3.0, 4.0) reposent sur des environnements et barèmes distincts et ne sont jamais amalgamées.

### Sources officielles

- [Anthropic — Claude Opus 5.5](https://www.anthropic.com/claude-opus-5-5)
- [Google DeepMind — Méthodologie d'évaluation Gemini 4 Argon](https://deepmind.google/models/evals-methodology/gemini-4-argon)
- [OpenAI — GPT-6 Astra](https://openai.com/index/introducing-gpt-6-sol-and-astra/)

## Disponibilité

La date affichée est celle du catalogue de l’application. La disponibilité effective dépend du déploiement sur la plateforme mAI.
