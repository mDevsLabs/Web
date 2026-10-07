# mAI-2

mAI-2 est présenté dans le catalogue comme un modèle cloud accessible avec l’API mAI. Les caractéristiques ci-dessous reprennent la fiche de l’application.

| Caractéristique | Valeur |
| --- | --- |
| Alias API | mai-2 |
| Contexte déclaré | 1 000 000 tokens |
| Sortie maximale déclarée | 384 000 tokens |
| Entrée image | Oui |
| Licence indiquée | MIT |
| Date de sortie indiquée | 25 octobre 2026 |

## Appel API

~~~sh
curl https://mai.val.run/v1/chat/completions \
  -H "Authorization: Bearer $MAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mai-2",
    "messages": [{ "role": "user", "content": "Bonjour mAI" }]
  }'
~~~

## Benchmarks

mAI-2 obtient les résultats suivants sur la campagne d'évaluation mAI-2, face aux modèles frontier les plus récents :

| Benchmark | mAI 2 | Claude Opus 5.5 | Gemini 4 Argon | GPT-6.1 Sol | GPT-6 Astra |
|:---|---:|---:|---:|---:|---:|
| **GPQA Diamond** | **90.9** | 90.6 | — | 95.4 | 95.8 |
| **HLE** | **36.8** | 61.4 | 57.1 | 52.9 | 54.7 |
| **Codeforces (Rating)** | **3471** | — | — | — | — |
| **MathArena Apex** | **65.6** | — | — | — | — |
| **Terminal-Bench 2.1** | **90.6** | — | — | — | — |
| **Terminal-Bench 3.0** | **30.0** | — | — | — | — |
| **Terminal-Bench 4.0** | **31.2** | 66.4 | 57.4 | 56.1 | 57.9 |
| **DeepSWE v1.1** | **74.2** | 74.2 | 77.9 | 75.2 | 74.1 |
| **ProgramBench** | **20.3** | — | — | — | — |
| **NL2Repo-Bench** | **65.4** | — | — | — | — |
| **CyberGym** | **88.1** | — | — | — | — |
| **SEC-Bench Pro** | **62.8** | — | — | 78.8 | 85.4 |
| **ExploitGym** | **15.3** | — | — | 35.1 | 42.4 |
| **HLE (w/tools)** | **63.9** | 67.7 | — | — | 57.2 |
| **AutomationBench** | **54.8** | 42.5 | 51.3 | 31.7 | 41.4 |
| **Agents' Last Exam** | **31.8** | 38.2 | 39.5 | — | 34.2 |
| **Chartography (w/tools)** | **78.9** | 89.0 | — | — | — |
| **BabyVision (w/tools)** | **89.6** | — | — | — | — |
| **ZeroBench-main (w/tools)** | **49.0** | — | — | — | — |

### Notes de méthode

- Les scores de mAI-2 proviennent de notre campagne d'évaluation mAI-2 ; les autres scores ne sont retenus que lorsqu'une version de benchmark et un protocole suffisamment comparables sont disponibles.
- Un tiret cadratin (`—`) indique qu'aucun résultat public suffisamment comparable n'a été retenu. Il ne représente pas un score nul.
- Les lignes `HLE` et `HLE (w/tools)` sont deux évaluations distinctes : la première est mesurée sans outils, la seconde avec outils. Elles ne sont jamais fusionnées, et la seconde n'est jamais utilisée pour la première.
- Terminal-Bench 2.1, Terminal-Bench 3.0 et Terminal-Bench 4.0 sont trois évaluations distinctes, chacune avec son propre harnais et sa propre échelle. Aucune version n'est utilisée comme substitut d'une autre, y compris lorsque les trois sont publiées : sur les trois lignes, le score de mAI-2 tombe de 90.6 à 31.2.
- Les lignes `GPQA Diamond`, `HLE`, `Terminal-Bench 2.1`, `MathArena Apex`, `ProgramBench`, `NL2Repo-Bench`, `CyberGym`, `Terminal-Bench 3.0`, `Chartography (w/tools)`, `BabyVision (w/tools)` et `ZeroBench-main (w/tools)` ne disposent d'aucun résultat concurrent suffisamment comparable : les colonnes restent à `—`.
- Les scores sont publiés dans l'unité de chaque benchmark (points, notation Codeforces pour `Codeforces (Rating)`), sans conversion en pourcentage.
- Gemini 4 Argon est reporté sur `HLE`, `Terminal-Bench 4.0`, `DeepSWE v1.1`, `AutomationBench` et `Agents' Last Exam`, les seules lignes de ce tableau où sa campagne publie le même protocole.
- Une version différente d'un benchmark n'est jamais utilisée comme substitut, et les scores ne sont pas comparés au-delà des conditions décrites ci-dessus.

### Sources officielles

- [Anthropic — Claude Opus 5.5](https://www.anthropic.com/claude-opus-5-5)
- [Google DeepMind — Méthodologie d'évaluation Gemini 4 Argon](https://deepmind.google/models/evals-methodology/gemini-4-argon)
- [OpenAI — GPT-6 Sol et Astra](https://openai.com/index/introducing-gpt-6-sol-and-astra/)

## Disponibilité

La date affichée est celle du catalogue de l’application. La disponibilité effective de l’alias dépend du déploiement de l’API mAI.
