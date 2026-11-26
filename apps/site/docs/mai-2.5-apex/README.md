# mAI-2.5-Apex

mAI-2.5-Apex est le modèle de la série mAI-2.5 dédié aux tâches alliant une rigueur analytique absolue et de très hautes performances. Conçu pour les ingénieurs, auditeurs et data scientists, il garantit un respect strict des contraintes techniques et une résistance maximale aux dérives d'instructions.

| Caractéristique | Valeur |
| --- | --- |
| Identifiant | mai-2.5-apex |
| Positionnement | Rigueur technique & Haute performance |
| Contexte déclaré | 1 000 000 tokens |
| Sortie maximale déclarée | 256 000 tokens |
| Entrée image & vision | Oui (Multimodal natif) |
| Entrée documents & fichiers | Oui |
| Licence indiquée | Propriétaire |
| Date de sortie indiquée | Décembre 2026 |

## Avancées technologiques majeures

mAI-2.5-Apex se distingue par un équilibre d'ingénierie sans compromis :

### 1. Raisonnement rigoureux et vérifiable
Contrairement aux modèles généralistes sujets aux hallucinations créatives lors de démonstrations complexes, Apex applique un cadre de déduction formel. Il valide chaque assertion mathématique ou logique, cite rigoureusement ses sources de données et formule des démonstrations vérifiables point par point.

### 2. Codage défensif et respect des contraintes
Spécialisé dans les environnements de production critiques, mAI-2.5-Apex applique les meilleures pratiques de programmation défensive. Il prend en compte la gestion des erreurs marginales, la typisation stricte, l'idempotence des opérations, et la prévention des vulnérabilités de sécurité (injections, accès mémoire non sécurisés, race conditions).

### 3. Utilisation de l'ordinateur (Computer Use)
Apex pilote les outils système avec une rigueur prédictive : validation préalable des commandes shell avant exécution, manipulation scrupuleuse des systèmes de fichiers, contrôle strict des sorties de processus et gestion d'erreurs réactive en cas de commande interrompue ou bloquée. Il est l'outil idéal pour les scripts d'administration système, les pipelines CI/CD et l'orchestration de conteneurs.

---

## Benchmarks

mAI-2.5-Apex fait l'objet d'évaluations rigoureuses sur les bancs d'essais orientés exactitude, code et sécurité :

| Benchmark | mAI-2.5 Apex | mAI-2 | Claude Sonnet 5.5 | Gemini 4 Argon |
|:---|---:|---:|---:|---:|
| **DeepSWE v1.1** | — | 74.2 | 71.0 | 77.9 |
| **SWE-bench Verified** | — | — | 68.4 | 70.8 |
| **Terminal-Bench 2.1** | — | 90.6 | 83.2 | — |
| **Terminal-Bench 4.0** | 50.3 | 31.2 | 66.4 | 57.4 |
| **SEC-Bench Pro** | 83.3 | 62.8 | — | — |
| **CyberGym** | — | 88.1 | — | — |
| **ExploitGym** | — | 15.3 | — | — |
| **GPQA Diamond** | 94.3 | 90.9 | 85.2 | — |
| **HLE (Humanity's Last Exam)** | 46.2 | 36.8 | — | 57.1 |
| **HLE (w/tools)** | — | 63.9 | 64.5 | — |
| **AutomationBench** | 60.2 (AA)* | 54.8 | 44.7 | 51.3 |
| **OSWorld (Computer Use)** | 74.2 (v2.1)* | — | 18.5 | — |

### Notes de méthode

- Un tiret cadratin (`—`) indique l'absence de donnée publique homologuée sous le même protocole.
- `*` Précisions d'échelle : le score `74.2 (v2.1)` sur **OSWorld (Computer Use)** correspond au jeu hors-ligne **OSWorld 2.1** à effort maximal (tandis que `18.5` relève du barème v1) ; la valeur `60.2 (AA)` sur **AutomationBench** est issue du protocole **AutomationBench-AA** ; **HLE** (`46.2`) correspond au mode texte seul à effort maximal.
- Les tests sur bancs de sécurité (SEC-Bench Pro, CyberGym) évaluent la capacité du modèle à identifier les vulnérabilités sans produire de faux positifs.

### Sources officielles

- [Anthropic — Claude Sonnet 5.5](https://www.anthropic.com/claude-sonnet-5-5)
- [Google DeepMind — Gemini 4 Argon](https://deepmind.google/models/evals-methodology/gemini-4-argon)

## Disponibilité

La date affichée est celle du catalogue de l’application. La disponibilité effective dépend du déploiement sur la plateforme mAI.
