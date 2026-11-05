# Démonstrations historiques du gabarit OpenDots

Ces enregistrements documentent l'**ancien** gabarit OpenDots, archivé lors du
remplacement par OpenMuse. Ils ne montrent ni les sources actuellement présentes
dans `apps/wakies/`, ni l'état du port servi sous `/wakies`. Pour le statut réel
des fonctions intégrées, lire [INTEGRATION.md](../INTEGRATION.md).

| Vidéo | Parcours | Durée |
| --- | --- | --- |
| [Chat vers un espace](chat-to-space.mp4) | Recherche Web, brouillon, approbation, page enregistrée | 23 s |
| [Chat spécialiste](specialist-chat.mp4) | Suite d'une planification, réponse en direct | 13 s |
| [Espaces et pages](spaces-page-chat.mp4) | Lecture d'une page sauvegardée, conversation associée | 19 s |
| [Ordinateur](computer-chat.mp4) | Navigation, sauvegarde d'un fichier, vérification en terminal | 34 s |
| [Appel vocal](voice-call.mp4) | Interface WebRTC, contrôles, reçu de fin d'appel | 15 s |

Les GIF servent d'aperçu compact ; les MP4 sont fournis pour une lecture fidèle.
Les séquences ont été recadrées, échantillonnées à basse fréquence et accélérées :
elles illustrent des **parcours**, pas la latence ni les performances
d'animation.

## Portée — ce que les clips ne prouvent pas

- Les clips « ordinateur » montrent un service OpenBot dédié (navigateur,
  fichiers, terminal) qui n'est **pas** branché dans le port actuel.
- La carte d'approbation filmée précède l'enregistrement ; elle ne vaut pas
  autorisation serveur.
- Le clip d'appel est une capture **silencieuse**. Le microphone a été contrôlé
  dans une session de validation distincte.
- Les intégrations Slack et la délégation vocale ne sont pas démontrées ici.

Les captures ont été réalisées dans un projet de démonstration et un espace
Launch studio séparés. Elles n'exposent aucune donnée client ni aucun identifiant ;
les réponses proviennent de sessions réelles et n'ont pas été remplacées par du
texte simulé.

## Refaire une capture

Utiliser un espace de démonstration séparé, masquer paramètres et secrets, vérifier
chaque segment, puis actualiser la date et la portée dans la section dédiée de
l'enregistrement.
