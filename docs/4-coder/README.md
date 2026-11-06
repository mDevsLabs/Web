# Documentation mAI Coder

mAI Coder est l'application Electron de développement (`apps/coder/`) : éditeur
Monaco, explorateur, Git, terminal PTY, outils MCP, navigateur et plusieurs
fournisseurs de modèles, orchestrés par un agent dont chaque action sensible est
soumise à approbation. Cette section couvre les deux processus, l'agent, les
intégrations et la publication desktop.

## Guides

- [ARCHITECTURE.md](ARCHITECTURE.md) — processus Main, Renderer, frontière IPC
- [AGENT_SYSTEM.md](AGENT_SYSTEM.md) — modes Composer, boucle d'exécution, approbations
- [INTEGRATIONS.md](INTEGRATIONS.md) — MCP, bots de messagerie, navigateur
- [DESKTOP_BUILD.md](DESKTOP_BUILD.md) — compilation, installateurs, intégration continue
- [AGENTS.md](AGENTS.md) — règles impératives pour agents et contributeurs
- [llm-wiki/](llm-wiki/README.md) — index des modules
- [assets/](assets/) — captures et visuels

Le démarrage et les commandes sont dans
[apps/coder/README.md](../../apps/coder/README.md).

## Avertissement de fraicheur

Ces guides ont été écrits sur une version précédente et **leurs numéros de
versions peuvent être périmés**. À l'heure où ces lignes, `apps/coder/package.json`
passe Electron 44 et Monaco 0.57, là où `AGENTS.md` et `ARCHITECTURE.md` citent
Electron 41 et Monaco 0.52, et décrivent des dépendances (Zustand, `simple-git`)
qui ne sont plus utilisées.

**Règle** : pour une version, une dépendance ou une commande, `package.json` et
le code font foi. Signalez l'écart plutôt que de le reproduire, et corrigez le
guide en même temps que le code.

Le wiki technique garde son propre registre des divergences connues dans
[llm-wiki/meta/contradictions-and-open-questions.md](llm-wiki/meta/contradictions-and-open-questions.md).
