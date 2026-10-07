# mAI-2-Mini

mAI-2-Mini est présenté dans le catalogue comme un modèle cloud accessible avec l’API mAI. Les caractéristiques ci-dessous reprennent la fiche de l’application.

| Caractéristique | Valeur |
| --- | --- |
| Alias API | mai-2-mini |
| Contexte déclaré | 1 000 000 tokens |
| Sortie maximale déclarée | 128 000 tokens |
| Entrée image | Oui |
| Licence indiquée | MIT |
| Date de sortie indiquée | 25 octobre 2026 |

## Appel API

~~~sh
curl https://mai.val.run/v1/chat/completions \
  -H "Authorization: Bearer $MAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mai-2-mini",
    "messages": [{ "role": "user", "content": "Bonjour mAI" }]
  }'
~~~

## Benchmarks

mAI-2-Mini a été évalué sur une sélection de benchmarks orientés développement, agents, sécurité et utilisation d'outils :

| Benchmark | mAI 2 Mini | Claude Sonnet 5.5 | Gemini 3.8 Flash | GPT-6 Luna | Qwen3.8-Omni-Flash |
|:---|---:|---:|---:|---:|---:|
| **Terminal-Bench 2.1** | **84.3** | 83.2 | 89.4 | 73.0 | — |
| **DeepSWE v1.1** | **63.4** | 71.0 | 73.7 | 66.6 | 57.8 |
| **Agents' Last Exam** | **26.3** | — | — | 25.0 | — |
| **AutomationBench** | **48.8** | 44.7 | — | 20.7 | — |
| **HLE (w/tools)** | **55.3** | 64.5 | — | — | — |
| **GDPVal-AA** | **1773 (v2)** | 1844 (v2.1) | 1545 (v2) | — | — |
| **CyberGym** | **84.5** | — | — | — | — |
| **ExploitBench** | **54.4** | — | — | — | — |
| **ExploitGym** | **130** | — | — | 11.6 | — |

### Notes de méthode

- Les scores de mAI-2 Mini proviennent de notre campagne d'évaluation ; les autres scores ne sont retenus que lorsqu'une version de benchmark et un protocole suffisamment comparables sont disponibles.
- Un tiret cadratin (`—`) indique qu'aucun résultat public suffisamment comparable n'a été retenu. Il ne représente pas un score nul.
- Les lignes `HLE (w/tools)`, `Agents' Last Exam`, `CyberGym`, `ExploitBench` et `ExploitGym` ne disposent d'aucun résultat concurrent suffisamment comparable : les colonnes restent à `—`.
- La ligne `GDPVal-AA` est publiée avec une version explicite pour chaque modèle : mAI 2 Mini et Gemini 3.8 Flash en v2, Claude Sonnet 5.5 en v2.1. Ces versions ne sont pas directement interchangeables et la ligne n'est pas lue comme un classement direct.
- La ligne `ExploitGym` est publiée telle que fournie par notre campagne d'évaluation : le score de mAI 2 Mini (130) et celui de GPT-6 Luna (11.6) ne reposent pas sur la même échelle et ne doivent pas être lus comme une comparaison directe.
- Terminal-Bench 4.0 n'est pas utilisé comme substitut de Terminal-Bench 2.1 : les deux évaluations ne partagent ni le harnais ni l'échelle.
- Une version différente d'un benchmark n'est jamais utilisée comme substitut.

### Sources officielles

- [Anthropic — Claude Sonnet 5.5](https://www.anthropic.com/claude-sonnet-5-5)
- [Google DeepMind — Gemini 3.8 Flash](https://deepmind.google/models/model-cards/gemini-3-8-flash/)
- [OpenAI — GPT-6 Luna](https://openai.com/index/introducing-gpt-6-luna/)
- [Qwen — Qwen3.8-Omni-Flash](https://qwen.ai/blog)

## Disponibilité

La date affichée est celle du catalogue de l’application. La disponibilité effective de l’alias dépend du déploiement de l’API mAI.
