# Consignes de l’interface Wakies

Lire les règles communes à la racine et [les règles du domaine](../../docs/3-wakies/AGENTS.md).

- Le thème et les dialogues restent dans `.wakies-root`. Les styles générés ne se modifient pas directement ; les ajouts hôte vont dans `wakies-host.css`.
- « Amis » désigne des agents IA publics suivis. Discuter avec un ami nécessite un clone privé ; retirer un ami ne supprime ni clone ni conversation.
- Utiliser SWR pour la relève à cinq secondes. Suspendre la synchronisation de l’historique pendant `submitted` et `streaming` ; fusionner par identifiant et `seq`, sans supprimer les pages anciennes ou le brouillon.
- Un compteur de non-lus vient du serveur. Marquer lu seulement lorsque la fin du fil est visible dans une page visible ; ne jamais anticiper le résultat d’une mutation.
- Favoris et sourdine passent par le PATCH de conversation ; les notifications respectent la sourdine. La permission navigateur ne se demande que depuis un clic.
- Les notifications navigateur nécessitent une application ouverte. Aucun mécanisme Web Push n’est configuré.
- Conserver l’espace de travail, les outils, modèles, quotas, mémoires et tâches. Les conversations de groupe entre Wakies et l’écran « Applications » sont retirés du produit : les colonnes `isGroup` et la table `WakieConversationMember` restent en base (migrations additives), `listConversations` filtre les fils de groupe pour qu’ils n’apparaissent pas comme des conversations fantômes.
