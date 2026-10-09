# Introducing projects in Release Candidate

![La suite mAI — Web, Vibe, Coder, CLI et Pulse](https://upload.fs.fr/dA57zDuVV5.png)

> **mDevsLabs** annonce que les cinq produits de la suite mAI — **Web**, **Vibe**, **Coder**, **CLI** et **Pulse** — sortent en **Release Candidate**. Un statut longtemps resté discret dans les versions : il devient désormais explicite, public et opposable.

---

## Sommaire

1. [Cinq produits, un même socle](#cinq-produits-un-meme-socle)
2. [Web — l’IA en ligne, directe et intuitive](#web--l-ia-en-ligne-directe-et-intuitive)
3. [Vibe — le réseau social où l’IA fait partie de la conversation](#vibe--le-reseau-social-ou-l-ia-fait-partie-de-la-conversation)
4. [Coder — l’IDE IA pensé pour les agents autonomes](#coder--lide-ia-pense-pour-les-agents-autonomes)
5. [CLI — l’assistant qui vit dans votre terminal](#cli--lassistant-qui-vit-dans-votre-terminal)
6. [Pulse — l’IA dans les outils du quotidien](#pulse--l-ia-dans-les-outils-du-quotidien)
7. [Ce que signifie « Release Candidate »](#ce-que-signifie--release-candidate-)
8. [Comment obtenir les projets](#comment-obtenir-les-projets)
9. [Sources officielles](#sources-officielles)

---

## Cinq produits, un même socle

Nous avons construit la suite mAI selon une conviction simple : **un modèle seul ne suffit pas à faire du travail**. Il faut l’avoir sous la main au moment où il devient nécessaire — dans un onglet, dans un terminal, dans un éditeur, dans une conversation, dans une extension.

Chaque produit est donc une porte d’entrée différente vers le même socle de modèles mAI.

| Produit | Surface | Plateformes | Dépôt |
|:---|:---|:---|:---|
| **Web** | Application d’IA en ligne | Web | [mDevsLabs/Web](https://github.com/mDevsLabs/Web) |
| **Vibe** | Réseau social avec IA intégrée | Web, Android, iOS | [mDevsLabs/Vibe](https://github.com/mDevsLabs/Vibe) |
| **Coder** | IDE IA pour agents autonomes | macOS, Windows, Linux | [mDevsLabs/Coder](https://github.com/mDevsLabs/Coder) |
| **CLI** | Assistant de développement en terminal | macOS, Linux, Windows | [mDevsLabs/CLI](https://github.com/mDevsLabs/CLI) |
| **Pulse** | Extensions pour les outils existants | Navigateur, VS Code | [mDevsLabs/Pulse](https://github.com/mDevsLabs/Pulse) |

Cette année, la génération **mAI-2** a défini le socle : jusqu’à un million de tokens de contexte, texte et images natifs, et un service exécuté dans le cloud via l’API mAI. Les cinq produits s’alignent dessus.

---

## Web — l’IA en ligne, directe et intuitive

Web est le point d’entrée le plus immédiat. Aucune installation, aucune configuration : une application d’IA en ligne, conçue pour discuter directement avec mAI sans détour.

**L’application d’IA en ligne web directement et simplement pour discuter avec l’IA mAI.**

Elle sert de point de repère commun à toute la suite : c’est par elle que l’on compare deux versions, que l’on vérifie une réponse, que l’on retrouve une session.

- [Page du projet](/projects/web)
- [Documentation](/docs?doc=app-web)

---

## Vibe — le réseau social où l’IA fait partie de la conversation

Vibe est le projet le plus récent de la suite, et celui qui s’est écarté le plus loin de ses contemporains. L’idée tient en une phrase : **sur un réseau social, l’IA ne doit pas être un champ de saisie posé à côté de la conversation — elle doit en faire partie.**

Publiez, discutez et créez avec mAI intégré nativement : fil personnalisé, messages privés, cercles, collections et assistants IA. Disponible sur le web, Android et iOS.

Vibe prolonge le travail mené sur nos [applications mobiles](/news/android-mobile-app) : mêmes exigences de confidentialité, même attention portée à l’expérience tactile.

- [Page du projet](/projects/vibe)
- [Documentation](/docs?doc=app-vibe)

---

## Coder — l’IDE IA pensé pour les agents autonomes

Coder n’est pas un éditeur de code assisté. C’est un environnement conçu autour d’une idée : **les agents IA autonomes sont des collaborateurs, pas des propositions de complétion.**

L’IDE IA de nouvelle génération avec agents IA autonomes, orchestration multi-modèles et support natif des outils MCP.

L’orchestration multi-modèles permet de confier chaque tâche au modèle le plus pertinent. Le support MCP n’est pas une option : c’est le protocole par lequel un agent appelle un outil, et il est intégré au premier rang.

- [Page du projet](/projects/coder)
- [Documentation](/docs?doc=app-coder)

---

## CLI — l’assistant qui vit dans votre terminal

CLI est le projet le plus ancien de la suite, et celui qui a le moins changé d’avis. Un assistant de développement qui vit dans votre terminal, à côté de vos commandes, sans vous faire quitter votre outil.

Discussions et séances de codage dans le terminal CLI via mAI.

Il repose sur trois piliers : l’intégration native au terminal, la liberté de choix du modèle d’inférence, et l’unification des flux de codage et de communication opérationnelle. Le modèle BYOK (*Bring Your Own Key*) laisse le choix du fournisseur entre les mains de l’utilisateur.

- [Page du projet](/projects/cli)
- [Documentation](/docs?doc=app-cli)
- [Annonce détaillée](/news/introducing-mai-cli)

---

## Pulse — l’IA dans les outils du quotidien

Pulse répond à une question simple : **si un outil possède déjà une extension, pourquoi changer d’outil ?**

Ensemble d’extensions pour diverses applications pour discuter avec mAI directement.

Pour les éditeurs de code, l’extension Visual Studio Code apporte une complétion contextuelle et un panneau latéral interactif pour l’analyse d’architecture, la révision de code et le refactoring. Pour les navigateurs, l’extension permet d’analyser, de synthétiser et d’extraire des informations directement depuis les pages visitées.

- [Page du projet](/projects/pulse)
- [Documentation](/docs?doc=app-pulse)
- [Annonce détaillée](/news/extensions-mai)

---

## Ce que signifie « Release Candidate »

Nous avons longtemps laissé cette expression rester implicite dans les versions, sans jamais la rendre visible. C’était une erreur : un statut flou est un statut qui ne protège personne.

**Release Candidate signifie ceci :**

- **Les fonctionnalités sont figées.** Ce qui est livré est ce qui sera livré. Nous n’ajouterons pas de nouvelle fonction majeure avant la version finale.
- **Seuls des correctifs entrent.** Fiabilité, sécurité, performance, conformité aux plateformes. Rien d’autre.
- **L’interface n’affiche plus d’étiquette de statut.** Le statut n’est pas une information utile à chaque écran : c’est une décision de livraison. Elle vit dans cette annonce et dans le dépôt de chaque projet, où chaque version est taguée.
- **Rien ne vous oblige à attendre.** Une Release Candidate est utilisable en production. Nous la publions tôt pour que vous puissiez l’éprouver longtemps avant la version finale.

Autrement dit : nous figeons, vous testez, nous corrigeons.

> **Un statut de livraison ne doit pas devenir un argument marketing. Il doit devenir une promesse vérifiable.**

---

## Comment obtenir les projets

Chaque projet dispose de sa propre page, de sa documentation et de son dépôt public.

1. **Partez de la page des projets** : [/projects](/projects).
2. **Téléchargez** depuis la page [Téléchargements](/downloads).
3. **Installez** en suivant le guide dédié : [Documentation](/docs).
4. **Suivez les versions** sur le dépôt GitHub du projet concerné.

Les cinq produits restent accessibles gratuitement. Les offres et forfaits ouvrent l’accès à l’API mAI et à des quotas d’utilisation supplémentaires : voir [Abonnements](/pricing).

---

## Sources officielles

- [mDevsLabs — Portail des projets](/projects)
- [mDevsLabs — Web](https://github.com/mDevsLabs/Web)
- [mDevsLabs — Vibe](https://github.com/mDevsLabs/Vibe)
- [mDevsLabs — Coder](https://github.com/mDevsLabs/Coder)
- [mDevsLabs — CLI](https://github.com/mDevsLabs/CLI)
- [mDevsLabs — Pulse](https://github.com/mDevsLabs/Pulse)
- [Annonce précédente — Applications mobiles](/news/android-mobile-app)
- [Annonce précédente — Extensions Pulse](/news/extensions-mai)
- [Annonce précédente — mAI CLI](/news/introducing-mai-cli)
- [Transition mProjects vers mAI](/news/renommage-mai)

---

**Cinq produits.**
**Un même socle.**
**Des fonctionnalités figées.**
**Des correctifs seulement.**

**La Release Candidate est ouverte.**

*mDevsLabs – Intelligence artificielle haute performance, locale et souveraine.*
