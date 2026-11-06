# Wiki technique mAI Coder

Points d'entrée vers l'architecture et les modules de `apps/coder/`. Ce wiki
réduit le temps de recherche ; il ne remplace **pas** la lecture du code. En cas
d'écart, la source active et les types distribués font foi, puis la page est
corrigée dans le même mouvement.

## Navigation

| Niveau | Pages |
| --- | --- |
| Vue d'ensemble | [project-overview.md](project-overview.md) · [repo-map.md](repo-map.md) |
| Architecture | [runtime-architecture.md](architecture/runtime-architecture.md) · [ipc-channel-map.md](architecture/ipc-channel-map.md) · [agent-system.md](architecture/agent-system.md) · [state-and-memory.md](architecture/state-and-memory.md) · [workspace-intelligence.md](architecture/workspace-intelligence.md) |
| Modules | [Index des pages de modules](modules/README.md) |
| Opérations | [dev-workflow.md](operations/dev-workflow.md) |
| Métrologie du wiki | [maintenance-playbook.md](meta/maintenance-playbook.md) · [preload-main-invoke-checklist.md](meta/preload-main-invoke-checklist.md) · [contradictions-and-open-questions.md](meta/contradictions-and-open-questions.md) |

## Périmètre

Ce wiki décrit **mAI Coder uniquement**. Ni l'application Next mAI Web, ni les
sources autonomes Vibe, Wakies et Site, ni le jeu Blackline.

## Maintenir les pages

Quand un comportement évolue, mettre à jour la page d'architecture **et** les
fiches des modules concernés. Retirer les conclusions devenues fausses plutôt
que d'empiler des historiques contradictoires : [le registre des
contradictions](meta/contradictions-and-open-questions.md) signale déjà les
cartes incomplètes (les canaux IPC y sont couverts partiellement) et les
questions ouvertes. Indiquer les sources examinées et les limites restantes.

Le point d'entrée d'une modification du pont Main/Renderer est la
[checklist preload ↔ Main](meta/preload-main-invoke-checklist.md) : un canal non
déclaré des deux côtés ne casse pas au build, mais à l'exécution.
