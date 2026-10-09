# Accessibilité — contrats, parcours et limites

Les composants proposent une base sémantique et des comportements locaux. Radix porte plusieurs interactions complexes. L’application fournit les contenus, noms accessibles, données, hiérarchie de page et règles de métier. La qualité dépend de cette composition, pas seulement du composant choisi.

## 1. Nommer chaque contrôle dans son usage

| Élément | Nom attendu | À vérifier |
| --- | --- | --- |
| IconButton | label obligatoire | Décrit l’action, pas la forme du dessin |
| Input/Textarea/Select | label associé ou nom ARIA pertinent | Placeholder insuffisant comme seul libellé |
| Checkbox/Switch/RadioGroup | label du contrat | Relation entre choix et effet |
| RangeSlider/Rating | label | Valeur compréhensible et clavier |
| Dialog/Drawer | title | Titre visible et accessible |
| Popover | label | Région nommée selon le contenu |
| Navigation/Breadcrumbs | label de région | Distinction entre navigations multiples |
| DataTable | caption | Sujet des lignes et colonnes |
| Progress/Meter | label | Ce que mesure la valeur |
| Icône informative | title ou référence de nom | Role et visibilité ARIA cohérents |

Un bouton contenant déjà « Enregistrer » n’a pas besoin d’un second nom sur son icône décorative. Une icône seule ne peut pas transformer un div cliquable en bouton utilisable au clavier ; employer un élément natif ou IconButton.

## 2. Relier label, aide et erreur

```tsx
import {Field, Input} from '@mdevs/ui';

export function EmailField({error}: {error?: string}) {
  const describedBy = ['email-hint', error ? 'email-error' : undefined].filter(Boolean).join(' ');
  return <Field label="Adresse e-mail" htmlFor="email"
    hint="Utilisée pour recevoir les notifications." error={error}>
    <Input id="email" name="email" type="email" required
      aria-describedby={describedBy} aria-invalid={Boolean(error)}/>
  </Field>;
}
```

Field produit des IDs à partir de `htmlFor`, mais ne clone pas son enfant pour les ajouter. L’application fournit donc `aria-describedby` et `aria-invalid`. Les IDs doivent rester uniques dans la page ; employer `useId` quand plusieurs instances peuvent coexister.

Le message d’erreur de Field porte `role=alert`. Éviter de recréer ce message à chaque frappe si cela provoque une annonce répétée inutile. Pour une erreur après soumission, choisir une annonce ou un résumé utile et un focus qui aide à corriger.

## 3. États contrôlés et annonces

Une valeur contrôlée qui ne change pas après le callback donne l’impression d’un contrôle bloqué. Mettre à jour l’état parent est autant une exigence d’interaction qu’une question de données.

`Button loading` expose aria-busy et désactive l’action. `XForm pending` désactive ses champs et soumission. Ces props ne fournissent pas automatiquement tous les messages attendus pour une longue sauvegarde : rendre un état textuel quand il aide l’utilisateur.

`Alert` est statique par défaut. Avec `live`, il utilise status ou alert selon sa tonalité. `ToastProvider` possède une région live polie et des boutons de fermeture. Les annonces sont locales et ne constituent pas une trace persistante des notifications.

Un état coloré doit aussi être exprimé par texte ou structure. StatusBadge montre une présence textuelle ; les statuts métier restent des codes affichés. Pour des libellés français spécialisés, prévoir un rendu applicatif adapté.

## 4. Matrice clavier

| Composant | Parcours prévu | Limite ou responsabilité |
| --- | --- | --- |
| Button/Link/Input natifs | Tab, Entrée/Espace selon élément | Ne pas remplacer leur sémantique par un div |
| Select natif | Clavier et sélecteur mobile natifs | Options désactivées selon données |
| Checkbox/Switch Radix | Tab et Espace | Nom et état contrôlé fournis |
| RadioGroup/Rating/SegmentedControl | Radios natifs et clavier navigateur | Identité de groupe et labels lisibles |
| Tabs | Flèches et activation Radix | Intitulés distincts et contenu associé |
| Accordion | Tab et déclencheurs Radix | Titres compréhensibles |
| Dialog/Drawer | Focus modal, Tab contenu, Échap | Retour du focus à vérifier avec/sans trigger |
| DropdownMenu | Navigation/activation Radix | Actions nommées et disabled réel |
| Tooltip | Focus ou survol du déclencheur | Information essentielle aussi disponible ailleurs |
| TreeView | Details/summary et boutons natifs | Ce n’est pas un ARIA tree à modèle fléché complet |
| CommandPalette | Recherche puis boutons via Tab | Ce n’est pas une combobox avec sélection fléchée |
| TagInput | Entrée ajoute, boutons suppriment | L’entrée en composition IME est prise en compte |
| Table triable | Tab jusqu’au bouton d’en-tête, activation | Région de défilement locale accessible |

La matrice décrit le contrat attendu. Vérifier les parcours réellement utilisés dans l’application, notamment avec des composants déclencheurs personnalisés.

## 5. Fenêtres et focus

Fournir un titre à Dialog/Drawer et une description quand elle éclaire l’action. Les déclencheurs `asChild` doivent être un seul élément acceptant props et ref. Un Button Mdevs ou un bouton HTML convient ; un composant qui ignore la ref peut casser le retour du focus.

Avec un déclencheur, la fermeture doit rendre le focus à un endroit logique. Avec `open` contrôlé depuis une action externe et sans `trigger`, l’application doit vérifier puis gérer ce retour au contrôle utile. Les wrappers ne transmettent pas toutes les options de focus/portail de Radix.

ConfirmDialog utilise un Dialog et ferme immédiatement lors de la confirmation. Pour une sauvegarde longue restant ouverte, composer Dialog et l’état pending. Éviter de retirer l’élément focalisé sans définir la suite du parcours.

Voir [OVERLAYS](OVERLAYS.md) pour les exemples et les cas d’absence de déclencheur.

## 6. Hiérarchie et régions

Heading accepte un niveau de titre. GlassCard et les familles métier utilisent des titres h3 ; concevoir la hiérarchie du parent pour les situer. Le seul fait d’obtenir un style de titre ne justifie pas de sauter un niveau sémantique.

GlassSidebar est une région complémentaire nommée. NavigationMenu et Breadcrumbs portent des navigations. Si deux menus coexistent, donner des noms distincts. Un tableau reçoit un caption et des en-têtes ; conserver une clé de ligne stable et unique.

Les régions de défilement des tableaux sont nommées et focusables. Vérifier que le focus n’est pas coupé et que l’utilisateur peut atteindre les colonnes masquées à une petite largeur.

## 7. SVG : décoration, information, action

| Situation | Mise en œuvre |
| --- | --- |
| Dessin accompagne un texte équivalent | Icône sans title/aria-label, décorative |
| Icône contient une information sans texte équivalent | title ou aria-labelledby cohérent, role=img |
| Icône dans un bouton sans texte | Nom sur IconButton ; dessin décoratif |
| SVG brut ajouté manuellement | Ajouter les attributs sémantiques selon le contexte |

Le wrapper crée un title à ID unique avec `useId`. Les props explicites sont appliquées après les défauts : `aria-hidden=true` peut masquer une icône malgré son title, `role` peut remplacer img et `aria-labelledby` peut remplacer la référence calculée. Éviter de combiner inutilement plusieurs sources de nom.

L’icône n’expose pas un contrôle focusable par défaut. Sa présence visuelle ne définit pas la zone d’action. Pour les usages tactiles, dimensionner le bouton indépendamment du dessin. [ICONS](ICONS.md) précise le comportement exact.

## 8. Contraste, verre et préférences

Le verre est dépendant du fond hôte. Un flou ne garantit pas le contraste sur une photographie ou un dégradé chargé. Contrôler texte, actions, focus et contours sur les arrière-plans réels. Si l’accent change, vérifier `--md-accent-ink` en même temps.

`glass=false` retire le flou et rend opaques les surfaces `.md-glass` ; les autres contrôles peuvent conserver des fonds translucides. `prefers-reduced-motion` désactive les animations ; `prefers-reduced-transparency` retire le flou lorsque le navigateur le reconnaît. En couleurs forcées, le système utilise des couleurs natives.

Les boutons principaux ont une hauteur minimale de 44 px. Les boutons de fermeture et certaines suppressions compactes ont des cibles plus petites dans cette version ; adapter la densité et les styles hôtes lorsque le contexte tactile le demande.

## 9. Vérification pratique d’une intégration

1. Parcourir l’écran sans souris : Tab, Maj+Tab, Entrée, Espace et Échap selon les contrôles.
2. Vérifier noms, aides, erreurs et changement d’état dans l’arbre d’accessibilité.
3. Ouvrir et fermer chaque type de fenêtre utilisé ; observer focus et titre.
4. Tester une saisie invalide et une erreur serveur si ces parcours existent.
5. Vérifier clair/sombre, largeur mobile et zoom selon les besoins du projet.
6. Vérifier les préférences réduites et les couleurs forcées lorsque pertinentes.
7. Exécuter un analyseur automatisé sur l’écran réel puis examiner ses résultats.
8. Pour la livraison cible, essayer les navigateurs et lecteurs d’écran effectivement utilisés.

Les contrôles automatisés complètent les parcours manuels. Corriger une alerte avec sa cause concrète, pas en supprimant une sémantique utile pour faire disparaître le signal.

## 10. Portée des preuves incluses

Les rapports initiaux vérifient le catalogue livré sous Chromium Linux en clair/sombre, plusieurs largeurs et certains parcours de modal/recherche. Les tests unitaires couvrent plusieurs comportements, les 104 formulaires et le rendu serveur de l’inventaire. Aucun résultat Safari/iOS/Firefox ou essai complet avec lecteur d’écran n’est revendiqué.

Une absence de violation axe sur cette page ne certifie pas tous les composants, contenus et compositions futurs. Lire [TESTING](TESTING.md) et le rapport de validation pour distinguer méthode, inventaire et exécution datée.
