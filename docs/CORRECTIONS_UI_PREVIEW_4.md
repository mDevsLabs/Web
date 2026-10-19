# Revue et corrections de la preview 4

Preview inspectée le 12 octobre 2026 :
`https://m-ai-officiel-8fo1idey1-mdevslabs.vercel.app/`.

## Formulaires dans Paramètres

Dans **Paramètres → Formulaires**, la page affiche « Impossible de charger les
formulaires pour le moment » et le bouton **Réessayer**. Elle n’affiche donc ni
la fiche conçue, ni l’état « aucun formulaire disponible ».

La base configurée localement contient bien les tables `UserForm` et
`UserFormResponse`, ainsi qu’un formulaire actif **Signalement de bugs** de
deux questions, commencé le 12 octobre 2026 à 15:11 UTC.

La cause se trouvait dans le filtre SQL de `/api/forms` : la borne de fin
injectait la date JavaScript dans une expression SQL brute. Avec le pilote
`postgres-js`, ce paramètre n’était pas encodé par Drizzle et faisait échouer
la requête avant l’envoi des formulaires. Le filtre utilise maintenant `gte`
sur la colonne Drizzle, comme pour la borne de début. La requête complète a
ensuite été reproduite en lecture seule sur la base locale : elle retourne le
formulaire, ses dates et ses champs JSON correctement typés. Aucun formulaire
ni aucune réponse n’a été modifié.

La preview déjà déployée conserve son ancien code jusqu’au prochain
redéploiement ; son retour à la page restera en erreur jusque-là. L’accès aux
journaux Vercel n’a pas été nécessaire pour isoler la cause dans le code.

## Partage d’un Wakie

- Ajout d’une URL publique `/wakies/share/<id>` et d’une page consultable sans
  session. Un identifiant mal formé ou une publication retirée ne révèle pas
  de fiche.
- Dans la fiche d’un Wakie, le bouton de partage reste inactif avant
  l’enregistrement de **Visible dans l’annuaire public**. Le lien ouvre la
  fiche publiée et peut être copié ; son QR PNG est généré localement.
- La page publique sélectionne les propriétés publiées explicitement, filtre
  les liens externes aux URL HTTP(S), et ne renvoie pas les chemins internes de
  stockage, les instructions privées ou l’identité du propriétaire. Les blobs
  apparaissent avec des URL signées temporaires.
- Depuis la fiche publique, **Ajouter ou cloner dans Wakies** conduit à
  l’espace de travail. La connexion et le forfait Wakies restent contrôlés par
  les gardes existantes.
- La route publique relit la publication à chaque requête ; elle n’utilise pas
  de cache persistant qui pourrait conserver une publication retirée.

## Autres corrections sociales et visuelles

- Les listes d’amis, l’annuaire, les profils et la galerie distinguent le
  chargement, une liste vide et une erreur récupérable.
- Les réponses de profil tardives ne remplacent plus la fiche actuellement
  ouverte. Les brouillons restent préservés après une actualisation ou une
  modification de galerie.
- Le formulaire de profil reste désactivé tant que sa lecture initiale a
  échoué ; quota inconnu et quota illimité ont des états distincts.
- Le contenu des cartes de fiche et les commandes de partage restent contenus
  dans la largeur disponible sur écran étroit ; la case de visibilité garde
  une largeur fixe et s’aligne avec son libellé à gauche.

## Vérifications

- `pnpm typecheck` : réussi après le correctif du filtre des dates.
- `pnpm test:unit` : 142 fichiers, 1 565 tests réussis et 4 ignorés.
- Lecture de `getActiveForms` sur la base configurée, DDL runtime désactivé :
  le formulaire actif est retourné avec ses dates et ses questions décodées.
- Biome ciblé : les trois fichiers du correctif passent.
- Tests ciblés partage, authentification, capacités et fiches sociales :
  40 réussis après le dernier changement.
- `pnpm check` : 25 diagnostics dans les scripts d’administration
  (`scripts/admin-forms.ts`, `scripts/admin-models.ts` et `scripts/admin.ts`).
  Les fichiers de cette revue ne figurent pas dans ces diagnostics.
- `git diff --check` : aucun problème d’espacement.

Les corrections sont prêtes dans les sources locales. La preview Vercel n’a
pas été redéployée pendant cette passe.
