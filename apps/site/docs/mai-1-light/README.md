![mAI-1-Light](https://upload.fs.fr/8P7ceTZ0wf.png)

# mAI-1-Light

mAI-1-Light est un modèle local mAI. Cette fiche reprend les tags et capacités déclarés dans le catalogue de l’application.

| Caractéristique | Valeur |
| --- | --- |
| Paramètres | 3B |
| Contexte déclaré | 131 072 tokens |
| Sortie maximale déclarée | 8 192 tokens |
| Entrée image | Non |
| Licence indiquée | MIT |
| Date de sortie indiquée | 11 juillet 2026 |

## Exécuter avec Ollama

~~~sh
ollama run mDevsLabs/mAI-1-Light
~~~

## Télécharger les poids depuis Hugging Face

~~~sh
hf download mDevsLabs/mAI-1-Light-GGUF
~~~

## 📊 Benchmarks de Performance

Voici les scores obtenus par **mAI-1-Light** face aux modèles ultra-légers de référence :

:::flex
![mAI-1-Light Benchmark 1](/mai-1-light/mai-1-light-benchmark-1.png)
![mAI-1-Light Benchmark 2](/mai-1-light/mai-1-light-benchmark-2.png)
:::

Les valeurs de contexte, de sortie et de vision sont celles inscrites dans apps/site/lib/mai-models.ts. Vérifiez les notes de version du modèle avant de choisir un runtime ou un matériel.
