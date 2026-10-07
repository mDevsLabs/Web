# Services d’ordinateur Wakies

Les images de service et de superviseur utilisent la révision OpenBot b6932d31a8d6e7896c15139dfc27a6c6911deb27, récupérée par BuildKit depuis un contexte Git épinglé. La construction ne dépend pas d’une branche mouvante ni d’une image latest.

Le service ordinateur reste inchangé. Le superviseur conserve des opérations limitées à ensure, stop, reset et list, avec contrôle de propriété des ressources. Un patch refuse de construire si la ligne amont épinglée change.

Chaque ordinateur reçoit un jeton dérivé pour son Wakie, calculé par HMAC-SHA256 à partir du jeton ordinateur et de l’identifiant du Wakie. Le jeton maître, les secrets du superviseur et les clés de modèle ne sont pas transmis au conteneur. Lorsqu’un jeton maître change, le superviseur remplace les conteneurs qu’il possède sans supprimer leurs volumes.

Ne supprimez pas les volumes de profil ou de workspace lors d’une mise à jour normale. Toute mise à niveau OpenBot demande une revue conjointe des contrats API, de la propriété des volumes et du patch local.

- [Architecture des ordinateurs dans le port mAI](../../../../docs/3-wakies/COMPUTERS.md)
- [Guide de déploiement de la source](../../README.md)
- Licence OpenBot : [LICENSE.openbot](LICENSE.openbot)
