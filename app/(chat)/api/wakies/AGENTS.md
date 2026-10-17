# Consignes des routes Wakies

Ces routes utilisent les services de l’hôte Next et PostgreSQL ; elles ne sont pas le serveur OpenMuse et ne sont pas toutes des proxys Val Town.

- Authentifier avec `requireWakiesUser()` avant tout accès privé. Vérifier l’origine avant les mutations utilisant le cookie.
- Valider strictement le corps et les paramètres ; `params` est une Promise. Une ressource d’un autre compte répond comme une ressource absente.
- Utiliser les helpers de `lib/wakies/http.ts` pour les erreurs et la sérialisation des dates. Ne pas transmettre les secrets, identités ou propriétés privées des autres comptes.
- Les quotas viennent de `lib/plans/tier-limits.ts`, jamais du calcul client.
- Le PATCH de conversation accepte notamment `favorite` et `muted`, booléens facultatifs. `false` est une modification explicite.
- `GET /notifications` initialise un curseur sans rejouer l’historique. `?after=<entier>` relève au plus 100 événements terminés du compte, dans l’ordre ; réponse privée `no-store`.
- Un fil n'a qu'un répondant, le Wakie qui le porte : la création de conversation n'accepte plus `isGroup` ni `inviteWakieIds`, et la route des membres est retirée.
