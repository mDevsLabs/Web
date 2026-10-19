![mAI-1.5-Opal](https://upload.fs.fr/XrRoXSQq0B.png)

# mAI-1.5-Opal

mAI-1.5-Opal est un modèle local mAI. Cette fiche reprend les tags et capacités déclarés dans le catalogue de l’application.

| Caractéristique | Valeur |
| --- | --- |
| Paramètres | 27B |
| Contexte déclaré | 262 144 tokens |
| Sortie maximale déclarée | 32 768 tokens |
| Entrée image | Oui |
| Licence indiquée | MIT |
| Date de sortie indiquée | 28 août 2026 |

## Exécuter avec Ollama

~~~sh
ollama run mDevsLabs/mAI-1.5-Opal
~~~

## Télécharger les poids depuis Hugging Face

~~~sh
hf download mDevsLabs/mAI-1.5-Opal-GGUF
~~~

Les valeurs de contexte, de sortie et de vision sont celles inscrites dans apps/site/lib/mai-models.ts. Vérifiez les notes de version du modèle avant de choisir un runtime ou un matériel.
