![mAI-1](https://upload.fs.fr/YdirFBxLxC.png)

# mAI-1

mAI-1 est un modèle local mAI. Cette fiche reprend les tags et capacités déclarés dans le catalogue de l’application.

| Caractéristique | Valeur |
| --- | --- |
| Paramètres | 12B |
| Contexte déclaré | 262 144 tokens |
| Sortie maximale déclarée | 16 384 tokens |
| Entrée image | Oui |
| Licence indiquée | MIT |
| Date de sortie indiquée | 11 juillet 2026 |

## Exécuter avec Ollama

~~~sh
ollama run mDevsLabs/mAI-1
~~~

## Télécharger les poids depuis Hugging Face

~~~sh
hf download mDevsLabs/mAI-1-GGUF
~~~

## 📊 Benchmarks de Performance

Voici les scores obtenus par **mAI-1** face aux modèles de référence du marché :

:::flex
![mAI-1 Benchmark 1](/mai-1/mai-1-benchmark-1.png)
![mAI-1 Benchmark 2](/mai-1/mai-1-benchmark-2.png)
:::

Les valeurs de contexte, de sortie et de vision sont celles inscrites dans apps/site/lib/mai-models.ts. Vérifiez les notes de version du modèle avant de choisir un runtime ou un matériel.
