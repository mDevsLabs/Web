/** Textes d'interface en français (mAI Coder) — Généré depuis messages.en.ts */
export const messagesFr: Record<string, string> = {
  "agent.activity.cmdFailed": "Commande échouée : {{cmd}}",
  "agent.activity.created": "Créé {{path}}",
  "agent.activity.edited": "Modifié {{path}}",
  "agent.activity.editFailed": "Échec de la modification de {{path}}",
  "agent.activity.editing": "Modification de {{path}}…",
  "agent.activity.fetched": "Récupéré {{method}} {{url}}",
  "agent.activity.fetching": "Récupération de {{method}} {{url}}",
  "agent.activity.listed": "Listé {{path}}",
  "agent.activity.listing": "Listage de {{path}}",
  "agent.activity.ran": "Exécuté `{{cmd}}`",
  "agent.activity.read": "Lu {{path}}",
  "agent.activity.readAtLine": "Lu {{path}} L{{line}}",
  "agent.activity.reading": "Lecture de {{path}} en cours…",
  "agent.activity.readingAtLine": "Lecture de {{path}} L{{line}}",
  "agent.activity.readingWithRange": "Lecture de {{path}} L{{start}}–{{end}}",
  "agent.activity.readOpenEditor":
    "Ouvrir dans l’éditeur et surligner cette plage",
  "agent.activity.readWithRange": "Lu {{path}} L{{start}}–{{end}}",
  "agent.activity.running": "Exécution de `{{cmd}}`",
  "agent.activity.searched": "Recherche de « {{pattern}} » effectuée",
  "agent.activity.searching": "Recherche de « {{pattern}} »",
  "agent.activity.updated": "Mis à jour : {{path}}",
  "agent.activity.webSearched": "Recherche web pour « {{query}} »",
  "agent.activity.webSearching": "Recherche web pour « {{query}} » en cours…",
  "agent.activity.writeFailed": "Échec de l'écriture de {{path}}",
  "agent.activity.writing": "Écriture de {{path}}…",
  "agent.activity.wrote": "Écrit {{path}}",
  "agent.command.run": "Exécuter dans le terminal",
  "agent.commandPermission.always": "Toujours exécuter",
  "agent.commandPermission.aria": "Autorisation d’exécution de commande",
  "agent.commandPermission.askEvery": "Demander à chaque fois",
  "agent.commandPermission.rules": "Autoriser selon les règles",
  "agent.commandPermission.settingsHint":
    "Lié à Paramètres → « Exécution & sécurité » (mêmes trois modes shell). Les règles d'autorisation fines se trouvent sous « Règles d'autorisation des outils » sur cette page.",
  "agent.edit.collapse": "Réduire l’aperçu",
  "agent.edit.expand": "Développer l’aperçu ({{lines}} lignes)",
  "agent.edit.reverted": "Restauré",
  "agent.edit.streamingPlaceholder": "Diffusion du correctif…",
  "agent.emptyStructuredReply":
    "Aucune sortie de l’assistant à ce tour (pas de texte du modèle ni d’appel d’outil ; l’exécution a peut-être été interrompue ou a échoué).",
  "agent.files.count": "{{count}} fichiers",
  "agent.keepAll": "Tout conserver",
  "agent.keepFile": "Conserver ce fichier",
  "agent.mistakeLimit.body":
    "{count} appels d’outil consécutifs ont échoué (seuil {threshold}). Continuez, ajoutez des instructions ou arrêtez cette exécution.",
  "agent.mistakeLimit.continue": "Continuer",
  "agent.mistakeLimit.hintField": "Consigne facultative pour le modèle",
  "agent.mistakeLimit.hintPlaceholder":
    "ex. Lisez d'abord uniquement les lignes 20–40 de src/foo.ts ; ne modifiez pas package.json.",
  "agent.mistakeLimit.sendHint": "Envoyer un indice et continuer",
  "agent.mistakeLimit.stop": "Arrêter",
  "agent.mistakeLimit.title": "Échecs répétés des outils",
  "agent.preflight.liveThinking": "Réflexion",
  "agent.preflight.summary.done": "Réflexion et exploration (terminé)",
  "agent.preflight.summary.idle": "Réflexion et exploration",
  "agent.preflight.working": "Réflexion et exploration en cours…",
  "agent.revert.failedAfterRestart":
    "Échec de la restauration : les instantanés ont été effacés par un redémarrage de l'application. Le panneau ne simulera pas une réussite — restaurez via git checkout ou votre éditeur.",
  "agent.revert.singleFailedAfterRestart":
    "Aucun instantané de restauration pour ce fichier (généralement perdu au redémarrage de l’application). Utilisez git checkout ou votre éditeur pour restaurer manuellement.",
  "agent.revert.snapshotMissing":
    "Aucun instantané de restauration disponible — ces modifications appartiennent probablement à une session précédente dont les instantanés en mémoire ont été effacés au redémarrage. Utilisez git checkout ou votre éditeur pour restaurer.",
  "agent.revert.unavailableTooltip":
    "Instantané de restauration indisponible (perdu après redémarrage). Utilisez git checkout ou votre éditeur pour restaurer manuellement.",
  "agent.revertAll": "Tout restaurer",
  "agent.revertFile": "Restaurer ce fichier",
  "agent.review.applyAll": "Tout appliquer",
  "agent.review.applyOne": "Appliquer",
  "agent.review.collapse": "Réduire",
  "agent.review.discardAll": "Tout abandonner",
  "agent.review.expand": "Développer",
  "agent.review.meta": "{{patches}} correctifs · {{paths}} chemins",
  "agent.review.regionAria": "Revue des modifications de l'agent",
  "agent.review.title": "Vérifier les modifications",
  "agent.review.unknownPath": "Chemin inconnu",
  "agent.session.background": "Arrière-plan",
  "agent.session.card.closed":
    "Fermé ; les réponses précédentes restent dans la barre latérale droite.",
  "agent.session.card.completed":
    "Terminé ; ouvrez la barre latérale droite pour lire la réponse.",
  "agent.session.card.default":
    "Ouvrir ce sous-agent dans la barre latérale droite.",
  "agent.session.card.failed":
    "Échec ; ouvrez la barre latérale droite pour inspecter l'erreur.",
  "agent.session.card.running":
    "En cours ; les réponses s'affichent uniquement dans la barre latérale droite.",
  "agent.session.card.waiting":
    "En attente de votre saisie ; ouvrez la barre latérale pour le contexte.",
  "agent.session.close": "Fermer",
  "agent.session.closeDone": "Agent fermé.",
  "agent.session.closeFailed": "Impossible de fermer cet agent.",
  "agent.session.contextFull": "Contexte complet dupliqué",
  "agent.session.contextNone": "Aucune bifurcation de contexte",
  "agent.session.emptyBody":
    "Lancez un agent en arrière-plan ou utilisez l'outil Agent pour commencer à suivre les exécutions enfants ici.",
  "agent.session.emptyReply": "Aucune réponse de ce sous-agent pour l'instant.",
  "agent.session.emptyTitle": "Aucun sous-agent pour l’instant",
  "agent.session.interrupt": "Interrompre l’exécution en cours",
  "agent.session.kicker": "Multi-agent",
  "agent.session.liveOutput": "Sortie en direct",
  "agent.session.liveThinking": "Réflexion en direct",
  "agent.session.messagePlaceholder":
    "Envoyez un message de suivi à cet agent…",
  "agent.session.openDetails": "Ouvrir les détails",
  "agent.session.openTranscript": "Ouvrir la transcription",
  "agent.session.profileExplore": "Profil Exploration",
  "agent.session.profileFull": "Profil complet",
  "agent.session.resume": "Reprendre",
  "agent.session.resumeDone": "Agent repris.",
  "agent.session.resumeFailed": "Impossible de reprendre cet agent.",
  "agent.session.send": "Envoyer",
  "agent.session.sentToast": "Message envoyé à l'agent.",
  "agent.session.status.closed": "Fermé",
  "agent.session.status.completed": "Terminé",
  "agent.session.status.failed": "Échoué",
  "agent.session.status.running": "En cours d'exécution",
  "agent.session.status.waiting": "En attente",
  "agent.session.title": "Agents / Tâches",
  "agent.session.wait": "Attendre",
  "agent.session.waitDone": "Statut de l'agent : {{status}}",
  "agent.session.waitFailed": "Impossible d'attendre cet agent.",
  "agent.session.waitTimedOut": "L’agent est toujours en cours d’exécution.",
  "agent.settings.confirmShell":
    "Demander confirmation avant d’exécuter des commandes shell",
  "agent.settings.confirmWrites":
    "Demander confirmation avant Écriture / Modification",
  "agent.settings.skipSafeShell":
    "Approuver automatiquement les commandes courantes en lecture seule",
  "agent.streamTool.path": "Chemin",
  "agent.streamTool.streaming": "Aperçu en direct",
  "agent.streamTool.title": "Construction de l'appel d'outil",
  "agent.subAgent.output": "Sous-agent",
  "agent.subAgent.thinking": "Réflexion du sous-agent",
  "agent.subAgentBg.done": "Sous-agent en arrière-plan terminé : {{preview}}",
  "agent.subAgentBg.fail": "Échec du sous-agent en arrière-plan : {{preview}}",
  "agent.summary.cmdNoOutput": "aucune sortie",
  "agent.summary.cmdOutput": "{{lines}} lignes de sortie",
  "agent.summary.dirEntries": "{{count}} entrées",
  "agent.summary.emptyDir": "vide",
  "agent.summary.noMatches": "aucun résultat",
  "agent.summary.readLines": "{{count}} lignes",
  "agent.summary.searchMatches": "{{count}} résultats",
  "agent.todoBottomPanel.summary": "{{total}} tâches, {{done}} terminées",
  "agent.todoWrite.updated": "Liste de tâches mise à jour",
  "agent.tool.Agent": "Sous-agent",
  "agent.tool.Bash": "Bash",
  "agent.tool.delegate_task": "Sous-agent",
  "agent.tool.Edit": "Modifier",
  "agent.tool.execute_command": "Exécuter la commande",
  "agent.tool.Fetch": "Récupération",
  "agent.tool.Glob": "Glob",
  "agent.tool.Grep": "Grep",
  "agent.tool.get_diagnostics": "Diagnostics",
  "agent.tool.ListMcpResourcesTool": "Lister les ressources MCP",
  "agent.tool.LSP": "LSP",
  "agent.tool.list_dir": "Lister le répertoire",
  "agent.tool.Read": "Lecture",
  "agent.tool.ReadMcpResourceTool": "Lire la ressource MCP",
  "agent.tool.read_file": "Lire le fichier",
  "agent.tool.request_user_input": "Demander une saisie utilisateur",
  "agent.tool.search_files": "Rechercher des fichiers",
  "agent.tool.str_replace": "Modifier le fichier",
  "agent.tool.Task": "Sous-agent",
  "agent.tool.TaskCreate": "Créer une tâche",
  "agent.tool.TaskGet": "Inspecter la tâche",
  "agent.tool.TaskList": "Lister les tâches",
  "agent.tool.TaskOutput": "Lire la sortie de la tâche",
  "agent.tool.TaskStop": "Arrêter la tâche",
  "agent.tool.TaskUpdate": "Message de tâche",
  "agent.tool.TodoWrite": "Liste de tâches",
  "agent.tool.ToolSearch": "Recherche d'outils différée",
  "agent.tool.WebSearch": "Recherche web",
  "agent.tool.Write": "Écriture",
  "agent.tool.write_to_file": "Écrire le fichier",
  "agent.toolApproval.allow": "Autoriser",
  "agent.toolApproval.deny": "Refuser",
  "agent.toolApproval.titleShell": "Autoriser cette commande dans le terminal…",
  "agent.toolApproval.titleWrite": "Autoriser cette écriture de fichier…",
  "agent.toolCard.args": "Arguments",
  "agent.toolCard.result": "Résultat",
  "agent.toolPending": "{{name}}…",
  "agent.toolProgress.detail": "{{name}} : {{detail}}",
  "agent.toolProgress.executing": "Exécution en cours : {{name}}",
  "agent.userInput.customPlaceholder": "Saisissez votre réponse…",
  "agent.userInput.dialogAria": "Demande d’entrée utilisateur structurée",
  "agent.userInput.dialogTitle": "En attente de votre saisie",
  "agent.userInput.inlineTitle": "Répondre pour continuer",
  "agent.userInput.other": "Autre",
  "agent.userInput.submittedToast": "Réponse envoyée.",
  "agent.userInput.toolActivityDone": "Saisie structurée : réponse reçue",
  "agent.userInput.toolActivityFailed":
    "Saisie structurée : la requête a échoué",
  "agent.userInput.toolActivityPending":
    "Saisie structurée : en attente de votre réponse…",
  "agent.working": "Poursuite du travail sur cette modification…",
  "agentBehavior.avoidPromptsDesc":
    "Lorsque les invites sont indisponibles, considérez « demander » comme un refus.",
  "agentBehavior.avoidPromptsTitle": "Refuser les demandes sans interface",
  "agentBehavior.executionTitle": "Politique d'exécution",
  "agentBehavior.lead":
    "Contrôlez les autorisations d’exécution et les invites de sécurité.",
  "agentBehavior.libraryHint":
    "Les règles, skills, sous-agents et commandes ont été déplacés vers « Règles, Skills, Sous-agents ».",
  "agentBehavior.libraryTitle": "Bibliothèque d'agents",
  "agentBehavior.memBetween":
    "Nombre min. de nouveaux messages entre les exécutions",
  "agentBehavior.memFirst": "Messages min. avant première extraction",
  "agentBehavior.memoryExtractionDesc":
    "Limite l'extraction en arrière-plan vers `.mai/memory`. Désactivez pour arrêter la mise en file d'attente des extractions.",
  "agentBehavior.memoryExtractionEnabled":
    "Activer l'extraction automatique de la mémoire",
  "agentBehavior.memoryExtractionTitle": "Extraction de la mémoire de session",
  "agentBehavior.memTools": "Appels d’outils min. entre les exécutions",
  "agentBehavior.shellComposerHint":
    "Politique d’approbation par défaut pour les commandes shell.",
  "agentBehavior.shellPermissionMode": "Permission des commandes shell",
  "agentBehavior.shellPermissionModeDesc":
    "Reflète le contrôle d'autorisation des commandes du compositeur.",
  "agentBehavior.toolRuleAdd": "+ Ajouter une règle",
  "agentBehavior.toolRuleAllow": "Autoriser",
  "agentBehavior.toolRuleAsk": "Demander",
  "agentBehavior.toolRuleBehavior": "Comportement",
  "agentBehavior.toolRuleContent": "Motif (facultatif)",
  "agentBehavior.toolRuleContentPh":
    "Vide = toutes les invocations ; ou commande Bash / motif glob de fichier",
  "agentBehavior.toolRuleDeny": "Refuser",
  "agentBehavior.toolRuleRemove": "Supprimer la règle",
  "agentBehavior.toolRulesDesc":
    "Définissez autoriser, demander ou refuser par nom d’outil et correspondance ; le refus est prioritaire.",
  "agentBehavior.toolRulesEmpty": "Aucune règle pour l'instant.",
  "agentBehavior.toolRulesTitle": "Règles d'autorisation des outils",
  "agentBehavior.toolRuleToolName": "Nom de l’outil",
  "agentSettings.autoLanguageRuleBadge": "Auto",
  "agentSettings.autoLanguageRuleHint":
    "Dérivé de la langue d’affichage et toujours injecté comme règle Toujours.",
  "agentSettings.backgroundForkDesc":
    "Permet aux tâches longues de l'Agent de s'exécuter en arrière-plan et vous notifie à la fin.",
  "agentSettings.backgroundForkTitle": "Branche en arrière-plan",
  "agentSettings.cmdDesc":
    "Les messages commençant par /slash développent le modèle ; utilisez l’espace réservé args dans le modèle pour le texte après la commande.",
  "agentSettings.cmdDescField": "Description (menu slash)",
  "agentSettings.cmdDescFieldPh":
    "Indice court affiché dans le menu / et la liste des commandes",
  "agentSettings.cmdEmpty": "Aucune commande pour l'instant.",
  "agentSettings.cmdInfo": "Développer les modèles /slash",
  "agentSettings.cmdNameAria": "Libellé de la commande",
  "agentSettings.cmdSlashListAria":
    "Liste des commandes slash intégrées et personnalisées",
  "agentSettings.cmdSlashListCollapse": "Réduire la liste",
  "agentSettings.cmdSlashListExpand": "Afficher {{count}} de plus",
  "agentSettings.cmdSlashListTitle": "Commandes disponibles dans le chat",
  "agentSettings.cmdTemplate": "Modèle",
  "agentSettings.cmdTemplatePh":
    "ex. Listez d'abord les étapes, puis codez. Détails : {args}",
  "agentSettings.cmdTitle": "Commandes",
  "agentSettings.globPattern": "Motif glob",
  "agentSettings.importDesc": "",
  "agentSettings.importTitle": "Importer une configuration tierce",
  "agentSettings.itemScopeStorage": "Stocké dans",
  "agentSettings.lead1": "",
  "agentSettings.lead2": "",
  "agentSettings.lead3": "",
  "agentSettings.leadCursor":
    "Règles, skills et sous-agents pour l’agent. Filtrez par portée ci-dessus. Les dossiers d’espace de travail pour `.cursor`, `.claude` et `.mai` sont fusionnés automatiquement.",
  "agentSettings.maxMistakesLabel": "Seuil (échecs)",
  "agentSettings.mistakeLimitDesc":
    "Met en pause au seuil d'échecs et attend votre confirmation.",
  "agentSettings.mistakeLimitTitle": "Pause après échecs répétés",
  "agentSettings.needWorkspaceForProject":
    "Ouvrez d’abord un dossier d’espace de travail pour ajouter ou modifier les éléments « ce projet ».",
  "agentSettings.new": "Nouveau",
  "agentSettings.newCmd": "Nouvelle commande",
  "agentSettings.newSkill": "Nouvelle compétence",
  "agentSettings.newSkillChat": "Créer dans le chat",
  "agentSettings.newSkillManual": "Ajouter manuellement",
  "agentSettings.newSub": "Nouveau sous-agent",
  "agentSettings.originProject": "Projet",
  "agentSettings.originUser": "Global",
  "agentSettings.pluginCommandFallbackDesc":
    "Flux slash fourni par le plugin disponible dans le chat.",
  "agentSettings.pluginCommandsTitle": "Commandes des plugins",
  "agentSettings.pluginSkillsTitle": "Compétences des plugins",
  "agentSettings.ruleBody": "Corps de la règle",
  "agentSettings.ruleBodyPh": "Contraintes et style pour le modèle…",
  "agentSettings.ruleNameAria": "Nom de la règle",
  "agentSettings.rulesDesc":
    "Injecté automatiquement dans le prompt système selon la portée.",
  "agentSettings.rulesEmpty":
    "Aucune règle pour l’instant. Cliquez sur Nouveau pour en ajouter une.",
  "agentSettings.rulesEmptyFiltered":
    "Aucune règle ne correspond à ce filtre. Passez à « Tout » ou à une autre portée.",
  "agentSettings.rulesInfo": "Injecté par portée dans l'invite système",
  "agentSettings.rulesTitle": "Règles",
  "agentSettings.safetyShellDesc":
    "Lorsque désactivé, l’agent exécute les commandes du terminal sans invite (toujours limité à l’espace de travail).",
  "agentSettings.safetySkipDesc":
    "Pour git status, npm test et commandes similaires.",
  "agentSettings.safetyTitle": "Outils et sécurité",
  "agentSettings.safetyWritesDesc": "Confirmer avant l'écriture des fichiers.",
  "agentSettings.scope": "Portée",
  "agentSettings.scopeAlways": "Toujours",
  "agentSettings.scopeFilterAll": "Tous",
  "agentSettings.scopeFilterAria": "Filtrer par portée de stockage",
  "agentSettings.scopeFilterProject": "Ce projet",
  "agentSettings.scopeFilterUser": "Tous les projets",
  "agentSettings.scopeGlob": "Glob (correspondance de chemin)",
  "agentSettings.scopeManual": "Manuel (@rule : déclencheur)",
  "agentSettings.skillBody": "Corps du skill",
  "agentSettings.skillBodyPh": "Étapes et format de sortie…",
  "agentSettings.skillCreatorHelp":
    "Le compositeur affiche une puce bleue `/create-skill` ; saisissez votre demande après celle-ci. Avant l'envoi, vous choisissez la portée et l'application injecte un brief système intégré pour une sortie au format SKILL.md — nul besoin de coller une longue invite.",
  "agentSettings.skillCreatorThreadTitle": "Créateur de compétences",
  "agentSettings.skillDiskDeleteConfirm":
    "Ceci supprimera l’intégralité du dossier du skill (SKILL.md et tous les autres fichiers de ce répertoire) :\n{{path}}\n\nContinuer…",
  "agentSettings.skillDiskDeleteFailed":
    "Suppression impossible. Le dossier est peut-être en cours d’utilisation ou les permissions sont refusées.",
  "agentSettings.skillDiskDeleteTitle": "Supprimer ce skill du disque",
  "agentSettings.skillDiskImportedHint":
    "Cette entrée provient d'un fichier SKILL.md dans l'espace de travail ; modifiez ce fichier sur le disque.",
  "agentSettings.skillDiskImportedNote":
    "Lecture seule : modifiez le fichier sur le disque pour changer.",
  "agentSettings.skillDiskOpenAria": "Ouvrir {{name}} dans l’éditeur",
  "agentSettings.skillDiskSectionTitle": "Skills sur disque (ce projet)",
  "agentSettings.skillIntro": "Résumé",
  "agentSettings.skillIntroPh": "Objectif en une ligne",
  "agentSettings.skillNameAria": "Nom du skill",
  "agentSettings.skillsDesc":
    "Les éléments éditables fusionnent avec les éléments analysés sur disque par slug ; ceux activés sont injectés dans l'invite système.",
  "agentSettings.skillsEmpty":
    "Aucune compétence pour l'instant. Utilisez « + Nouveau » dans le chat ou ajoutez un fichier SKILL.md dans les dossiers de compétences.",
  "agentSettings.skillsEmptyFiltered":
    "Aucun skill ne correspond à ce filtre. Passez à « Tout » ou à une autre portée.",
  "agentSettings.skillsImport": "Importer",
  "agentSettings.skillsImportError":
    "Échec de l'analyse du SKILL.md, veuillez vérifier le format",
  "agentSettings.skillsImportPrompt":
    "Collez le contenu SKILL.md (avec frontmatter) :",
  "agentSettings.skillsImportSuccess": "Skill importé avec succès",
  "agentSettings.skillsInfo":
    "Créez dans le chat ; ou ajoutez SKILL.md sur le disque ; ./slug dans la saisie",
  "agentSettings.skillsNew": "+ Nouveau",
  "agentSettings.skillsRefresh": "Actualiser",
  "agentSettings.skillsRefreshTitle": "Re-scanner les skills du disque",
  "agentSettings.skillsTemplate": "Modèles",
  "agentSettings.skillsTemplateTitle": "Créer un skill à partir d'un modèle",
  "agentSettings.skillsTitle": "Compétences",
  "agentSettings.slashLabel": "slash (sans /)",
  "agentSettings.slugLabel": "slug (sans ./)",
  "agentSettings.subagentsDesc":
    "Le modèle voit le nom, la description et les instructions de chaque sous-agent pour les tâches multi-rôles.",
  "agentSettings.subagentsInfo": "Descriptions des rôles dans l’invite système",
  "agentSettings.subagentsTitle": "Sous-agents",
  "agentSettings.subDesc": "Description",
  "agentSettings.subDescPh": "Quand ce rôle s'applique",
  "agentSettings.subEmpty": "Aucun sous-agent pour l’instant.",
  "agentSettings.subEmptyFiltered":
    "Aucun sous-agent ne correspond à ce filtre. Passez à « Tout » ou à une autre portée.",
  "agentSettings.subInstr": "Instructions",
  "agentSettings.subInstrPh": "Comportement et exigences de sortie…",
  "agentSettings.subMemoryLocal": "Portée locale",
  "agentSettings.subMemoryNone": "Aucun",
  "agentSettings.subMemoryProject": "Portée projet",
  "agentSettings.subMemoryScope": "Mémoire persistante",
  "agentSettings.subMemoryScopeHint":
    "Facultatif. Donnez à ce sous-agent son propre répertoire de mémoire et sa boucle de rappel/extraction.",
  "agentSettings.subMemoryUser": "Portée utilisateur",
  "agentSettings.subNameAria": "Nom du sous-agent",
  "app.addPlusAria": "Ajouter & mode",
  "app.addPlusTitle": "Ajouter agents, contexte, outils & mode",
  "app.archived": "Archivé",
  "app.automation": "Automatisation",
  "app.branch": "Branche",
  "app.browserAcceptLanguage": "Accept-Language",
  "app.browserAcceptLanguagePlaceholder":
    "Par exemple : en-US,en;q=0.9,zh-CN;q=0.8",
  "app.browserAddressPlaceholder": "Saisissez une URL ou recherchez sur le web",
  "app.browserBlockTrackers": "Bloquer les publicités et les traqueurs",
  "app.browserBlockTrackersHint":
    "Activé par défaut. Bloque les requêtes courantes de publicité, télémétrie et suivi afin de réduire le bruit et les journaux réseau en échec.",
  "app.browserCaptureAgentDraftIntro":
    "Veuillez utiliser le contexte de capture du navigateur ci-dessous pour identifier les échecs, les goulots d’étranglement de performance et les correctifs probables.",
  "app.browserCaptureAgentDraftOmitted":
    "{{count}} requêtes supplémentaires ne sont pas développées ici ; je peux exporter le JSON ou le HAR si vous avez besoin du détail complet.",
  "app.browserCaptureAgentDraftScope": "Portée : {{scope}}",
  "app.browserCaptureAgentDraftTotal": "Requêtes : {{count}}",
  "app.browserCaptureAnalyzeApi": "Rétro-ingénierie d’API",
  "app.browserCaptureAnalyzeApiHint":
    "Table des endpoints + structures requête/réponse + extrait de reproduction.",
  "app.browserCaptureAnalyzeAuto": "Détection automatique",
  "app.browserCaptureAnalyzeAutoHint":
    "Laissez l'agent choisir le meilleur cadrage.",
  "app.browserCaptureAnalyzeCrypto": "Rétro-ingénierie crypto JS",
  "app.browserCaptureAnalyzeCryptoHint":
    "Mapper les hooks crypto → algorithme + reproduction Python.",
  "app.browserCaptureAnalyzeHeading": "Lancer l'analyse dans un nouveau fil",
  "app.browserCaptureAnalyzeLabel": "Analyser",
  "app.browserCaptureAnalyzePerf": "Performance",
  "app.browserCaptureAnalyzePerfHint":
    "Endpoints lents, surcharge de charge utile, appels redondants.",
  "app.browserCaptureAnalyzeSecurity": "Audit de sécurité",
  "app.browserCaptureAnalyzeSecurityHint":
    "Fuites de jetons, absence d'authentification, CSRF, exposition de données sensibles.",
  "app.browserCaptureAnalyzing": "Ouverture d’un nouveau fil…",
  "app.browserCaptureAttachedTabs": "Onglets",
  "app.browserCaptureAttachWarning":
    "Certains onglets ne sont pas encore attachés à la capture",
  "app.browserCaptureBodies": "Corps des requêtes / réponses",
  "app.browserCaptureBodyTruncated": "Le contenu est long et a été tronqué.",
  "app.browserCaptureCaHint":
    "Installez l’autorité locale dans le magasin de certificats système afin que l’interception HTTPS soit vérifiée correctement. Un mot de passe administrateur peut vous être demandé.",
  "app.browserCaptureCaInstall": "Installer le CA",
  "app.browserCaptureCaInstallConfirm":
    "Installer le CA de capture mAI Coder dans votre magasin de certificats utilisateur ? Windows/macOS vous demandera de confirmer la confiance envers ce certificat racine.",
  "app.browserCaptureCaInstalled": "Approuvé",
  "app.browserCaptureCaInstallMachine": "Installer en tant qu’administrateur",
  "app.browserCaptureCaInstallMachineConfirm":
    "Installer l’autorité de capture mAI Coder comme certificat racine système ? Le système vous demandera les droits administrateur.",
  "app.browserCaptureCaNotInstalled": "Non approuvé",
  "app.browserCaptureCapturing": "Capture en cours",
  "app.browserCaptureCaShowFile": "Afficher le fichier CA",
  "app.browserCaptureCaTitle": "Faire confiance à l’autorité de capture",
  "app.browserCaptureCaUninstall": "Supprimer le CA",
  "app.browserCaptureCaUninstallConfirm":
    "Supprimer le certificat racine de capture mAI Coder du magasin de certificats ?",
  "app.browserCaptureClear": "Effacer",
  "app.browserCaptureClearing": "Nettoyage en cours…",
  "app.browserCaptureCollapse": "Réduire le panneau de capture",
  "app.browserCaptureColumnHost": "Hôte",
  "app.browserCaptureColumnMethod": "Méthode",
  "app.browserCaptureColumnPath": "Chemin",
  "app.browserCaptureColumnSeq": "#",
  "app.browserCaptureColumnSource": "Source",
  "app.browserCaptureColumnStatus": "Statut",
  "app.browserCaptureColumnTime": "Heure",
  "app.browserCaptureContentType": "Type de contenu",
  "app.browserCaptureCopied": "Copié",
  "app.browserCaptureCopyCurl": "Copier cURL",
  "app.browserCaptureCopyProxyAddress": "Copier l'adresse du proxy",
  "app.browserCaptureCopyProxyCaUrl": "Copier l'URL de téléchargement du CA",
  "app.browserCaptureCopyProxyHost": "Copier l’hôte proxy",
  "app.browserCaptureCopyProxyPort": "Copier le port du proxy",
  "app.browserCaptureCopyRequestBody": "Copier le corps de la requête",
  "app.browserCaptureCopyRequestHeaders": "Copier les en-têtes de requête",
  "app.browserCaptureCopyResponseBody": "Copier le corps de la réponse",
  "app.browserCaptureCopyResponseHeaders": "Copier les en-têtes de réponse",
  "app.browserCaptureCopyUrl": "Copier l'URL",
  "app.browserCaptureDeviceLimit":
    "Remarque : l'épinglage de certificat, les nouvelles politiques de sécurité réseau des apps Android et les politiques d'appareils gérés peuvent empêcher le déchiffrement HTTPS ; ces requêtes peuvent n'afficher que des échecs ou des métadonnées de connexion.",
  "app.browserCaptureDeviceStepCa":
    "Ouvrez l’URL de téléchargement du CA sur le téléphone, installez le certificat, puis approuvez-le dans les paramètres système.",
  "app.browserCaptureDeviceStepCapture":
    "Gardez la capture activée ici, puis utilisez l’application ou le site cible sur le téléphone. Les requêtes seront marquées comme Proxy.",
  "app.browserCaptureDeviceStepProxy":
    "Dans les détails Wi-Fi du téléphone, réglez le proxy HTTP sur Manuel. Utilisez l'hôte et le port affichés ci-dessus.",
  "app.browserCaptureDeviceStepWifi":
    "Connectez le téléphone et l'ordinateur au même Wi-Fi. Désactivez les données mobiles si nécessaire pour que le trafic ne contourne pas le proxy.",
  "app.browserCaptureDeviceTitle": "Capture téléphone / appareil externe",
  "app.browserCaptureEmptyBody": "Aucun contenu",
  "app.browserCaptureEmptyHintActive":
    "Interagissez avec la page ou envoyez du trafic via le proxy et les requêtes apparaîtront ici.",
  "app.browserCaptureEmptyHintIdle":
    "Cliquez sur Démarrer pour commencer la capture du trafic du navigateur intégré. Démarrez le proxy pour capturer aussi les apps externes.",
  "app.browserCaptureExpand": "Développer le panneau de capture",
  "app.browserCaptureExportFailed": "Échec de l’exportation",
  "app.browserCaptureExportHar": "Exporter le HAR",
  "app.browserCaptureExporting": "Traitement en cours…",
  "app.browserCaptureExportJson": "Exporter en JSON",
  "app.browserCaptureExportMenuLabel": "Exporter…",
  "app.browserCaptureFailed": "L'action de capture a échoué",
  "app.browserCaptureFilterAll": "Tout",
  "app.browserCaptureFilterError": "Erreurs",
  "app.browserCaptureFilteredCount": "{{count}} dans le filtre actuel",
  "app.browserCaptureFilterLabel": "Filtrer les requêtes",
  "app.browserCaptureFilterOther": "Autre",
  "app.browserCaptureFilterPending": "En attente",
  "app.browserCaptureHeaders": "En-têtes requête / réponse",
  "app.browserCaptureHideDetail": "Masquer les détails",
  "app.browserCaptureHookCategoryLabel": "Catégorie",
  "app.browserCaptureHookCount": "{{count}} événements hook",
  "app.browserCaptureHookEmptyHintActive":
    "Ouvrez une page dans le navigateur intégré ; les appels fetch, XHR et crypto apparaîtront ici en temps réel.",
  "app.browserCaptureHookEmptyHintIdle":
    "Démarrez la capture, puis ouvrez une page. Les hooks pour fetch / XHR / crypto.subtle / CryptoJS / SM2/3/4 sont injectés automatiquement.",
  "app.browserCaptureHookEmptyTitle": "Aucun hook JS enregistré pour l'instant",
  "app.browserCaptureHookSearchPlaceholder":
    "Rechercher libellé hook, URL ou arguments",
  "app.browserCaptureHookStack": "Pile d’appels",
  "app.browserCaptureListFailed": "Impossible de charger les requêtes",
  "app.browserCaptureLoadingRequest": "Chargement des détails…",
  "app.browserCaptureLoadingRequests": "Chargement des requêtes…",
  "app.browserCaptureLoadMore": "Charger plus",
  "app.browserCaptureMethodFilterLabel": "Filtrer les requêtes par méthode",
  "app.browserCaptureNoExportableRequests": "Aucune requête à exporter",
  "app.browserCaptureNoRequests": "Aucune requête pour l’instant",
  "app.browserCaptureOpenAnalysisThread": "Ouvrir le fil d’analyse",
  "app.browserCapturePanel": "Panneau de capture",
  "app.browserCaptureProxyAddress": "Adresse du proxy",
  "app.browserCaptureProxyCaDownloaded": "Téléchargé",
  "app.browserCaptureProxyCaFailed": "Échec de l’exportation de l’autorité",
  "app.browserCaptureProxyCaUrl": "URL de téléchargement du CA",
  "app.browserCaptureProxyDownloadCa": "Télécharger le CA",
  "app.browserCaptureProxyFailed": "L’action du proxy a échoué",
  "app.browserCaptureProxyHost": "Hôte",
  "app.browserCaptureProxyPort": "Port",
  "app.browserCaptureProxyRunning":
    "Le proxy est en cours d'exécution ; le trafic du téléphone apparaîtra dans la liste de capture actuelle",
  "app.browserCaptureProxyShortOff": "Proxy désactivé",
  "app.browserCaptureProxyShortOn": "Proxy activé",
  "app.browserCaptureProxyStart": "Démarrer le proxy",
  "app.browserCaptureProxyStarting": "Démarrage…",
  "app.browserCaptureProxyStop": "Arrêter le proxy",
  "app.browserCaptureProxyStopped":
    "Le proxy est arrêté ; démarrez-le, puis configurez le proxy Wi-Fi du téléphone ci-dessous",
  "app.browserCaptureProxyStopping": "Arrêt en cours…",
  "app.browserCaptureReady": "Capture",
  "app.browserCaptureRecentAnalyses": "Analyses récentes",
  "app.browserCaptureRecentAnalysesEmpty":
    "Aucune analyse exécutée pour cette capture pour l’instant.",
  "app.browserCaptureRemainingCount": "{{count}} restants",
  "app.browserCaptureRequestBody": "Corps de la requête",
  "app.browserCaptureRequestHeaders": "En-têtes de requête",
  "app.browserCaptureRequestNotFound": "Détails de la requête indisponibles",
  "app.browserCaptureRequests": "Requêtes",
  "app.browserCaptureRequestsShort": "{{count}} req.",
  "app.browserCaptureResizeDock":
    "Faites glisser pour redimensionner le panneau de capture",
  "app.browserCaptureResourceDocument": "Doc",
  "app.browserCaptureResourceFilterLabel":
    "Filtrer les requêtes par type de ressource",
  "app.browserCaptureResourceImage": "Img",
  "app.browserCaptureResourceScript": "JS",
  "app.browserCaptureResourceStylesheet": "CSS",
  "app.browserCaptureResourceType": "Type de ressource",
  "app.browserCaptureResponseBody": "Corps de la réponse",
  "app.browserCaptureResponseBodyOmitted":
    "Corps de réponse non stocké : {{reason}}",
  "app.browserCaptureResponseHeaders": "En-têtes de réponse",
  "app.browserCaptureSearchPlaceholder":
    "Rechercher URL, méthode, statut, type, source",
  "app.browserCaptureSelectedCount": "{{count}} sélectionné(s)",
  "app.browserCaptureSelectRequest":
    "Sélectionnez une requête pour l'inspecter",
  "app.browserCaptureSendFailed":
    "Impossible de transmettre la capture au brouillon du chat",
  "app.browserCaptureSendingToAgent": "Ajout en cours…",
  "app.browserCaptureSendToAgent":
    "Déposer dans le brouillon de discussion actuel",
  "app.browserCaptureSendToAgentHint":
    "Ajouter la liste brute des requêtes filtrées au brouillon du chat actuel (sans cadrage d'analyse).",
  "app.browserCaptureSentToAgent": "Envoyé · voir le fil",
  "app.browserCaptureSessionsDelete": "Supprimer la session enregistrée",
  "app.browserCaptureSessionsEmpty":
    "Aucune session enregistrée pour l'instant.",
  "app.browserCaptureSessionsLabel": "Sessions",
  "app.browserCaptureSessionsSave": "Enregistrer",
  "app.browserCaptureSessionsSavePlaceholder": "Nommez cette capture…",
  "app.browserCaptureSessionsTitle": "Sessions de capture enregistrées",
  "app.browserCaptureShowDetail": "Afficher le détail",
  "app.browserCaptureShowingRequests": "Affichage de {{count}} sur {{total}}",
  "app.browserCaptureShowProxyRequests": "Requêtes proxy uniquement",
  "app.browserCaptureSnippetEnv": "Variables d'environnement",
  "app.browserCaptureSnippetsHint":
    "Copiez un extrait prêt à l’emploi qui pointe votre outil vers le proxy de capture avec le bon chemin CA.",
  "app.browserCaptureSnippetsTitle":
    "Utiliser le proxy depuis le terminal et le code",
  "app.browserCaptureSourceBrowser": "Navigateur intégré",
  "app.browserCaptureSourceBrowserShort": "Navigateur",
  "app.browserCaptureSourceFilterLabel": "Filtrer les requêtes par source",
  "app.browserCaptureSourceProxy": "Proxy externe",
  "app.browserCaptureSourceProxyShort": "Proxy",
  "app.browserCaptureStart": "Démarrer",
  "app.browserCaptureStarting": "Démarrage…",
  "app.browserCaptureStatus": "Statut",
  "app.browserCaptureStatusFilterLabel": "Filtrer les requêtes par statut",
  "app.browserCaptureStop": "Arrêter",
  "app.browserCaptureStopping": "Arrêt…",
  "app.browserCaptureStorageCookies": "document.cookie",
  "app.browserCaptureStorageEmptyHintActive":
    "Ouvrez une page dans le navigateur intégré ; nous échantillonnons les cookies / localStorage / sessionStorage toutes les quelques secondes.",
  "app.browserCaptureStorageEmptyHintIdle":
    "Lancez la capture, puis ouvrez une page. Les instantanés de stockage apparaîtront ici par hôte.",
  "app.browserCaptureStorageEmptyTitle":
    "Aucun instantané de stockage pour l’instant",
  "app.browserCaptureStorageSelect":
    "Sélectionnez un hôte à gauche pour inspecter son stockage.",
  "app.browserCaptureSystemProxy": "Proxy système",
  "app.browserCaptureSystemProxyDisable": "Arrêter le routage du proxy système",
  "app.browserCaptureSystemProxyEnable":
    "Rediriger le proxy système via la capture",
  "app.browserCaptureSystemProxyHint":
    "Activez le proxy HTTP/HTTPS au niveau du système pour que le trafic des applications hors navigateur passe par le proxy de capture. Nous restaurons votre paramètre précédent à l’arrêt.",
  "app.browserCaptureSystemProxyOff": "Désactivé",
  "app.browserCaptureSystemProxyOn": "Activé",
  "app.browserCaptureTabDevices": "Appareils externes",
  "app.browserCaptureTabHeaders": "En-têtes",
  "app.browserCaptureTabHooks": "Hooks",
  "app.browserCaptureTabRequest": "Requête",
  "app.browserCaptureTabRequests": "Requêtes réseau",
  "app.browserCaptureTabResponse": "Réponse",
  "app.browserCaptureTabStorage": "Stockage",
  "app.browserCaptureTabsShort": "{{attached}}/{{total}} onglets",
  "app.browserCaptureToggleRequest": "Sélectionner cette requête",
  "app.browserCaptureToggleVisible":
    "Sélectionner les requêtes dans la liste actuelle",
  "app.browserClearData": "Effacer les données du navigateur",
  "app.browserClearDataAction": "Effacer",
  "app.browserClearDataConfirm":
    "Effacer les cookies, le cache et le stockage du site pour ce navigateur intégré ?",
  "app.browserClearDataFailed":
    "Impossible d’effacer les données du navigateur",
  "app.browserClearingData": "Effacement en cours…",
  "app.browserCloseTab": "Fermer l'onglet",
  "app.browserDetachedSidebarBody":
    "Le navigateur et le panneau de capture s’ouvrent dans une fenêtre séparée, allégeant l’espace de travail de l’Agent.",
  "app.browserDetachedSidebarTitle":
    "Le navigateur intégré s’exécute séparément",
  "app.browserExtraHeaders": "En-têtes de requête supplémentaires",
  "app.browserExtraHeadersHint":
    "Format : un `Header-Name: value` par ligne. Les lignes vides sont ignorées.",
  "app.browserExtraHeadersPlaceholder":
    "Un en-tête par ligne, par exemple :\nX-Debug: 1\nAuthorization: Bearer token",
  "app.browserForward": "Avancer",
  "app.browserGo": "Aller",
  "app.browserGoogleLoginExternalBody":
    "Le navigateur intégré ne peut pas finaliser la connexion au compte Google. Nous avons ouvert cette page dans votre navigateur par défaut à la place.",
  "app.browserGoogleLoginExternalFailed":
    "Impossible d’ouvrir la connexion Google dans votre navigateur système. Vérifiez les paramètres de votre navigateur par défaut.",
  "app.browserGoogleLoginExternalTitle":
    "Connexion Google ouverte dans votre navigateur système",
  "app.browserHeaderFormatError":
    "La ligne {{line}} est invalide. Utilisez `Nom-En-tête: valeur`.",
  "app.browserLoadFailed": "Impossible d'ouvrir cette page",
  "app.browserLoading": "Chargement de la page",
  "app.browserNewTab": "Nouvel onglet",
  "app.browserOpeningWindow": "Ouverture…",
  "app.browserOpenSettingsInMain":
    "Ouvrir les paramètres dans la fenêtre principale",
  "app.browserOpenWindow": "Ouvrir la fenêtre du navigateur",
  "app.browserPreparing": "Préparation du navigateur",
  "app.browserProxyBypassRules": "Règles de contournement",
  "app.browserProxyBypassRulesHint":
    "Facultatif. Les adresses correspondantes contourneront le proxy personnalisé.",
  "app.browserProxyBypassRulesPlaceholder":
    "Par exemple : localhost,127.0.0.1,*.internal",
  "app.browserProxyMode": "Mode proxy",
  "app.browserProxyModeCustom": "Proxy personnalisé",
  "app.browserProxyModeCustomDesc":
    "Utiliser un proxy dédié uniquement pour ce navigateur intégré.",
  "app.browserProxyModeDirect": "Désactiver le proxy",
  "app.browserProxyModeDirectDesc":
    "Se connecter directement sans utiliser de proxy système.",
  "app.browserProxyModeSystem": "Utiliser le proxy système",
  "app.browserProxyModeSystemDesc":
    "Suivre les paramètres proxy du système d'exploitation.",
  "app.browserProxyRules": "Règles de proxy",
  "app.browserProxyRulesHint":
    "Format `proxyRules` d’Electron. Vous pouvez cibler explicitement différents protocoles.",
  "app.browserProxyRulesPlaceholder":
    "Par exemple : http=127.0.0.1:7890;https=127.0.0.1:7890;socks5=127.0.0.1:1080",
  "app.browserProxyRulesRequired":
    "Les règles de proxy sont requises lors de l'utilisation d'un proxy personnalisé.",
  "app.browserResetDefaults": "Rétablir les valeurs par défaut",
  "app.browserSaveAndReload": "Enregistrer et recharger",
  "app.browserSettings": "Paramètres du navigateur",
  "app.browserSettingsDescription":
    "Personnalisez le navigateur intégré avec le blocage des pubs/trackers, un User-Agent, Accept-Language, des en-têtes de requête supplémentaires et l'usurpation facultative d'empreinte en page (navigator/screen/WebGL/Canvas/WebRTC). L'enregistrement actualisera automatiquement la page actuelle.",
  "app.browserStop": "Arrêter le chargement",
  "app.browserTabsCount": "{{count}} onglets",
  "app.browserUntitled": "Nouvel onglet",
  "app.browserUserAgent": "User-Agent",
  "app.browserUserAgentPlaceholder":
    "Laissez vide pour utiliser le User-Agent par défaut du navigateur",
  "app.changes": "Modifications",
  "app.chatSendFailed":
    "Impossible de démarrer la réponse (le flux n'a pas pu démarrer). Réessayez ou consultez la console développeur.",
  "app.chatSendFailedNoWindow":
    "Impossible de démarrer le chat : l'état de la fenêtre est invalide. Redémarrez l'application.",
  "app.chatSendFailedReason": "Impossible de démarrer le chat : {{reason}}",
  "app.closeTerminalPanel": "Fermer le panneau",
  "app.closeTerminalTab": "Fermer l'onglet du terminal",
  "app.comingSoon": "Bientôt disponible",
  "app.commandCenter": "Centre de commandes",
  "app.commit": "Valider",
  "app.commitAndCreatePR": "Commiter & créer une PR",
  "app.commitBranchWarning":
    "Ce fil était précédemment sur {{oldBranch}}. Veuillez confirmer que vous voulez committer sur {{newBranch}}.",
  "app.commitChangesStats": "+{{additions}} -{{deletions}}",
  "app.commitFiles": "{{count}} fichiers",
  "app.commitGenericError": "Échec du commit",
  "app.commitInProgress": "Traitement en cours…",
  "app.commitMessage": "Message de commit",
  "app.commitMessageHint":
    "Astuce : appuyez sur Ctrl+Entrée (Cmd+Entrée) pour envoyer, Échap pour annuler.",
  "app.commitNothingStaged":
    "Aucun fichier indexé. Activez « Inclure les non indexés » ou indexez d'abord des fichiers.",
  "app.commitPlaceholder": "Message de commit",
  "app.commitPrNoRemote":
    "Impossible de dériver l’URL de la PR — aucune URL remote.origin utilisable.",
  "app.commitPush": "Valider et pousser",
  "app.commitYourChanges": "Commitez vos modifications",
  "app.contextMeter.ariaCustomNote":
    "La limite provient des paramètres du modèle.",
  "app.contextMeter.ariaDefaultNote":
    "Utilisation de la limite par défaut de l’application.",
  "app.contextMeter.ariaSummary":
    "Contexte : {{used}} utilisés, {{max}} max. {{note}}",
  "app.contextMeter.confidenceLow":
    "Dimensions de l'image manquantes ; repli conservateur utilisé — le coût réel peut différer.",
  "app.contextMeter.confidenceMedium":
    "Les jetons d’image sont tarifés d’après les dimensions connues — à considérer comme une borne supérieure.",
  "app.contextMeter.detailCustom":
    "Utilisé (estimation) : {{used}}\nMax : {{max}} (depuis Paramètres → Modèles → Avancé)\nNote : jetons ≈ caractères÷4, incluant fil, flux et brouillon.",
  "app.contextMeter.detailDefault":
    "Utilisé (estimation) : {{used}}\nMax : {{max}} (contexte par défaut — non défini dans les Paramètres ; correspond à la valeur par défaut de 200K de l'app)\nNote : tokens ≈ caractères÷4, y compris le fil, le flux et le brouillon.",
  "app.continue": "Continuer",
  "app.createAgentLayout": "Nouvel Agent",
  "app.createAgentLayoutAria": "Créer une nouvelle disposition Agent",
  "app.createEditorLayout": "Nouvel Éditeur",
  "app.createEditorLayoutAria": "Créer une nouvelle disposition Éditeur",
  "app.currentMode": "Mode actuel : {{mode}}",
  "app.customInstructions": "Instructions personnalisées",
  "app.draft": "Brouillon",
  "app.draftPrefix": "Brouillon : {{title}}",
  "app.edit.copy": "Copier",
  "app.edit.cut": "Couper",
  "app.edit.paste": "Coller",
  "app.edit.redo": "Rétablir",
  "app.edit.selectAll": "Tout sélectionner",
  "app.edit.undo": "Annuler",
  "app.editorAgentChatRail": "Chat de l’agent",
  "app.editorChatContextLocal": "Local",
  "app.editorChatHistoryAria": "Historique des discussions",
  "app.editorChatMoreAria": "Plus d'options",
  "app.editorChatSearchThreads": "Rechercher des chats…",
  "app.editorChatTabListAria": "Onglets de chat",
  "app.editorEmptyDescription":
    "Sélectionnez un fichier dans l’Explorateur, ou demandez à l’agent à droite d’inspecter et de modifier le projet avec vous.",
  "app.editorEmptyTitle": "Ouvrez un fichier pour commencer l'édition",
  "app.editorMarkdownModeAria": "Mode d'affichage Markdown",
  "app.editorMarkdownPreview": "Aperçu",
  "app.editorMarkdownSource": "Source",
  "app.editorReadOnlySaveHint":
    "Aperçu en lecture seule — l'enregistrement est désactivé",
  "app.editorSidebarSearchEmpty":
    "Aucun fichier ne correspond à cette recherche.",
  "app.editorSidebarSearchHint":
    "Saisissez pour filtrer les fichiers par nom ou chemin.",
  "app.editorSidebarSearchPlaceholder":
    "Rechercher des fichiers dans cet espace de travail",
  "app.editorWelcomeActionsAria": "Actions de démarrage",
  "app.editorWelcomeAria": "Démarrer",
  "app.editorWelcomeTagline": "Ultra · Éditeur IA",
  "app.editorWorkspaceMainAria": "Éditeur de code",
  "app.errorPrefix": "Erreur : {{message}}",
  "app.explorerPlaceholder":
    "Ouvrez un espace de travail pour parcourir les fichiers ; les modifications sont mises en évidence par des couleurs et des badges.",
  "app.explorerRefreshAria": "Actualiser l’arborescence des fichiers",
  "app.fileMenu.aria": "Fichier",
  "app.fileMenu.clearRecents": "Effacer l'historique récent",
  "app.fileMenu.closeEditor": "Fermer l'éditeur",
  "app.fileMenu.closeFolder": "Fermer le dossier",
  "app.fileMenu.newEditorWindow": "Nouvelle fenêtre d'éditeur",
  "app.fileMenu.newFile": "Nouveau fichier texte",
  "app.fileMenu.newFileSaveTitle": "Nouveau fichier",
  "app.fileMenu.newWindow": "Nouvelle fenêtre",
  "app.fileMenu.noRecents": "Aucun dossier récent",
  "app.fileMenu.openFile": "Ouvrir un fichier…",
  "app.fileMenu.openFolder": "Ouvrir un dossier…",
  "app.fileMenu.openRecent": "Ouvrir récent",
  "app.fileMenu.openRecentEmpty": "Aucun dossier récent",
  "app.fileMenu.quit": "Quitter",
  "app.fileMenu.revert": "Rétablir le fichier",
  "app.fileMenu.revertFile": "Restaurer le fichier",
  "app.fileMenu.save": "Enregistrer",
  "app.fileMenu.saveAs": "Enregistrer sous…",
  "app.fileMenu.saveAsDialogTitle": "Enregistrer sous",
  "app.filePreview": "Aperçu du fichier",
  "app.filePreviewAcceptChange": "Conserver",
  "app.filePreviewChangeLabel": "Modification IA",
  "app.filePreviewCopyPath": "Copier le chemin",
  "app.filePreviewFileSize": "Taille : {{size}}",
  "app.filePreviewImageTitle": "Aperçu de l’image",
  "app.filePreviewKindArchive": "Archive",
  "app.filePreviewKindBinary": "Binaire",
  "app.filePreviewKindExecutable": "Exécutable",
  "app.filePreviewKindFont": "Police",
  "app.filePreviewKindImage": "Image",
  "app.filePreviewKindLarge": "Fichier volumineux",
  "app.filePreviewKindMedia": "Média",
  "app.filePreviewKindOffice": "Document",
  "app.filePreviewKindPdf": "PDF",
  "app.filePreviewKindUnknown": "Fichier",
  "app.filePreviewOpenDefault": "Ouvrir avec l’application par défaut",
  "app.filePreviewRevertChange": "Annuler",
  "app.filePreviewRevertNewFileConfirm":
    "Annuler la modification de ce nouveau fichier supprimera « {{path}} ». Continuer…",
  "app.filePreviewUnsupportedArchive":
    "Les archives ne sont pas développées dans la barre latérale de l'Agent.",
  "app.filePreviewUnsupportedBinary":
    "Ce fichier ne semble pas être du texte, la barre latérale de l’Agent n’a donc pas tenté de le lire.",
  "app.filePreviewUnsupportedImage":
    "Cette image est affichée visuellement et n’est pas chargée dans l’aperçu texte de l’Agent.",
  "app.filePreviewUnsupportedLarge":
    "Ce fichier est trop volumineux pour un aperçu textuel direct dans la barre latérale.",
  "app.filePreviewUnsupportedMedia":
    "Les fichiers média ne sont pas chargés dans l'aperçu texte de l'Agent.",
  "app.filePreviewUnsupportedOffice":
    "Les documents Office ne peuvent pas être ouverts en toute sécurité comme texte brut. Ouvrez-les avec l’application par défaut ou extrayez le texte explicitement.",
  "app.filePreviewUnsupportedPdf":
    "Les fichiers PDF ne sont pas encore chargés dans l’aperçu texte de l’Agent. Ouvrez-les avec l’application par défaut à la place.",
  "app.filePreviewUnsupportedTitle": "Aperçu non disponible",
  "app.gitBinary": "Fichier binaire ; diff non affiché.",
  "app.gitChangedFallback": "Modifié",
  "app.gitDiffLoading": "Chargement du diff…",
  "app.gitGroupOffTitle": "Grouper par dossier (désactivé)",
  "app.gitGroupOnTitle": "Grouper par dossier (activé)",
  "app.gitGroupRoot": "(racine)",
  "app.gitGroupToggleAria": "Activer/désactiver le regroupement par dossier",
  "app.gitLoadFailed": "Échec du chargement des modifications",
  "app.gitLocal": "Local",
  "app.gitMissingBody":
    "Installez d’abord Git, puis rouvrez ou actualisez cet espace de travail pour activer le contrôle de source ici.",
  "app.gitMissingTitle": "Git n’est pas installé",
  "app.gitNoChanges": "Aucune modification locale",
  "app.gitNoPreview": "Aucun aperçu disponible",
  "app.gitNotRepoBody":
    "Ouvrez un dossier contenant déjà un dépôt Git, ou initialisez Git dans ce dossier pour utiliser le contrôle de source ici.",
  "app.gitNotRepoTitle": "Ce dossier n’est pas un dépôt Git",
  "app.gitOpenInEditorAria": "Ouvrir dans l'éditeur",
  "app.gitOpenTitle": "Ouvrir",
  "app.gitPreviewAria":
    "Prévisualiser le fichier dans la barre latérale de l’Agent",
  "app.gitPreviewTitle": "Aperçu",
  "app.gitRefreshAria": "Actualiser",
  "app.gitUnavailableBody":
    "L'état Git n'a pas pu être chargé pour l'instant. Essayez d'actualiser et vérifiez votre configuration Git si le problème persiste.",
  "app.gitUnavailableTitle": "Le contrôle de source est indisponible",
  "app.gitUncommitted": "{{count}} modifications non commitées",
  "app.help.about": "À propos de mAI Coder",
  "app.help.aboutClose": "Fermer",
  "app.help.aboutCopied": "Copié !",
  "app.help.aboutCopyInfo": "Copier les infos",
  "app.help.aboutCopyright": "© 2026 mAI · mDevsLabs",
  "app.help.aboutOpenRepo": "Ouvrir le dépôt",
  "app.help.aboutTagline":
    "IDE asynchrone natif pour coder avec des agents IA.",
  "app.help.aboutVersion": "Version {version}",
  "app.help.checkForUpdates": "Vérifier les mises à jour",
  "app.help.documentation": "Documentation",
  "app.help.releases": "Notes de version",
  "app.help.reportIssue": "Signaler un problème",
  "app.includeUnstaged": "Inclure les non indexés",
  "app.ipcBrowserOnly": "Aperçu navigateur uniquement",
  "app.ipcError": "Erreur IPC",
  "app.ipcReady": "Prêt · {{message}}",
  "app.jumpToLatest": "Aller au plus récent",
  "app.leaveBlankAutogenerate":
    "Laissez vide pour générer automatiquement le message de commit",
  "app.marketplace": "Marketplace",
  "app.menu": "Menu",
  "app.menuEdit": "Édition",
  "app.menuFile": "Fichier",
  "app.menuHelp": "Aide",
  "app.menuNewTerminal": "Nouveau terminal",
  "app.menuTerminal": "Terminal",
  "app.menuView": "Affichage",
  "app.menuWindow": "Fenêtre",
  "app.newAgent": "Nouvelle discussion",
  "app.newAgentSession": "Nouvelle session d'agent",
  "app.newTerminalTitle": "Nouveau terminal",
  "app.nextSteps": "Prochaines étapes",
  "app.noFileSelected": "Aucun fichier sélectionné",
  "app.noModelSelected":
    "Sélectionnez un modèle d'abord (bouton modèle dans la barre d'envoi), ou configurez les modèles dans Paramètres → Modèles.",
  "app.noRecentsYet":
    "Aucun dossier récent pour l’instant. Ouvrez un projet pour commencer.",
  "app.noThreads": "Aucune conversation dans cet espace.",
  "app.noWorkspace": "Aucun espace de travail ouvert",
  "app.openAgentLayout": "Disposition Agent",
  "app.openAgentLayoutAria": "Ouvrir la disposition Agent",
  "app.openDownloadFolder": "Ouvrir les téléchargements",
  "app.openEditorLayout": "Disposition Éditeur",
  "app.openEditorLayoutAria": "Ouvrir la disposition Éditeur",
  "app.openWorkspace": "Ouvrir un espace de travail",
  "app.planEditorBuilt": "Compilé",
  "app.planNewIdea": "Planifier une nouvelle idée",
  "app.planSidebarDescription":
    "Lorsque vous utilisez le mode Plan, le plan en direct restera ici au lieu de changer de disposition.",
  "app.planSidebarStreaming": "Plan en cours de diffusion",
  "app.planSidebarWaiting": "Planification en cours",
  "app.projectAndAgent": "Projets et Agents",
  "app.pushFailed": "Échec du push (le distant peut ne pas être configuré)",
  "app.quickTerminal": "Terminal",
  "app.readFileFailed": "// Échec de la lecture : {{detail}}",
  "app.recentProjects": "Projets récents",
  "app.reloadFileAria": "Recharger le fichier",
  "app.resetAgentModeAria": "Réinitialiser en mode Agent",
  "app.resizeEditorTerminalAria":
    "Redimensionner la hauteur du terminal de l’éditeur",
  "app.resizeEditorTerminalTitle":
    "Faites glisser pour redimensionner la hauteur du terminal",
  "app.resizeLeftAria": "Redimensionner la barre latérale gauche",
  "app.resizeLeftTitle":
    "Faites glisser pour redimensionner ; double-cliquez pour réinitialiser à ~¼ de la fenêtre de chaque côté",
  "app.resizeRightAria": "Redimensionner la barre latérale droite",
  "app.resizeRightTitle":
    "Faites glisser pour redimensionner ; double-cliquez pour réinitialiser à ~¼ de la fenêtre de chaque côté",
  "app.rightSidebar": "Barre latérale",
  "app.rightSidebarViews": "Vues de la barre latérale",
  "app.searchAgentsAria": "Rechercher dans les chats",
  "app.searchAgentsPlaceholder": "Rechercher des discussions…",
  "app.searchAria": "Rechercher",
  "app.searchPanelHint":
    "La recherche dans l’espace de travail arrive bientôt ; utilisez l’explorateur de fichiers pour l’instant.",
  "app.searchPanelTitle": "Rechercher",
  "app.selectFileToView": "Sélectionnez un fichier à afficher",
  "app.send": "Envoyer",
  "app.settings": "Paramètres",
  "app.settingsAria": "Paramètres de l'application",
  "app.sidebarProjects": "Espaces de travail",
  "app.sidebarThreads": "Fils",
  "app.skills": "Compétences",
  "app.stopGeneration": "Arrêter",
  "app.switchingToEditor": "Bascule vers l'éditeur",
  "app.switchingToEditorHint":
    "Préparation de l'espace de travail de l'éditeur…",
  "app.tabBrowser": "Navigateur",
  "app.tabExplorer": "Explorateur",
  "app.tabGit": "Contrôle de source",
  "app.tabPlan": "Plan",
  "app.tabSearch": "Recherche",
  "app.terminalCollapse": "Réduire",
  "app.terminalDrawer": "Terminal",
  "app.terminalEmbeddedAria": "Terminal intégré",
  "app.terminalStarting": "Démarrage du terminal…",
  "app.terminalTab": "Terminal",
  "app.terminalTabN": "Terminal {{n}}",
  "app.threadEdited": "Modifié {{names}}",
  "app.threadFilesMany": "{{n}} fichiers",
  "app.threadFilesOne": "{{n}} fichier",
  "app.threadUntitled": "Nouveau chat",
  "app.today": "Aujourd’hui",
  "app.universalTerminal": "Terminal Universel",
  "app.universalTerminalAuthPromptCopy":
    "Cette session SSH attend un identifiant avant de pouvoir continuer.",
  "app.universalTerminalAuthPromptPassphrasePlaceholder": "Phrase secrète",
  "app.universalTerminalAuthPromptPasswordPlaceholder": "Mot de passe",
  "app.universalTerminalAuthPromptProfile": "Profil",
  "app.universalTerminalAuthPromptRemember": "Enregistrer le mot de passe",
  "app.universalTerminalAuthPromptSession": "Session",
  "app.universalTerminalAuthPromptTitle": "Authentification requise",
  "app.universalTerminalCloseTab": "Fermer l’onglet",
  "app.universalTerminalEmpty":
    "Aucune session de terminal pour l'instant. Cliquez sur + ci-dessus pour en créer une.",
  "app.universalTerminalFind.close": "Fermer",
  "app.universalTerminalFind.next": "Suivant",
  "app.universalTerminalFind.placeholder": "Rechercher dans le terminal…",
  "app.universalTerminalFind.prev": "Précédent",
  "app.universalTerminalMenu.closeActiveTab": "Fermer l'onglet actif",
  "app.universalTerminalMenu.defaultSuffix": "par défaut",
  "app.universalTerminalMenu.newWithProfile": "Ouvrir avec un profil",
  "app.universalTerminalMenu.title": "Menu du terminal",
  "app.universalTerminalNewTab": "Nouvel onglet",
  "app.universalTerminalPane.close": "Fermer le volet",
  "app.universalTerminalPane.unsplit": "Annuler le fractionnement",
  "app.universalTerminalPasteMultipleLines": "Coller plusieurs lignes ?",
  "app.universalTerminalPorts.configure": "Configurer les ports",
  "app.universalTerminalPorts.copy": "Copier",
  "app.universalTerminalPorts.empty":
    "Aucune règle de redirection de port n’est configurée pour ce profil.",
  "app.universalTerminalPorts.status.checking": "Vérification en cours",
  "app.universalTerminalPorts.status.closed": "Non à l'écoute",
  "app.universalTerminalPorts.status.listening": "À l’écoute",
  "app.universalTerminalPorts.status.remote-unchecked": "Distant",
  "app.universalTerminalPorts.status.unknown": "Inconnu",
  "app.universalTerminalPorts.title": "Redirection de ports",
  "app.universalTerminalPorts.type.dynamic": "Dynamique",
  "app.universalTerminalPorts.type.local": "Local",
  "app.universalTerminalPorts.type.remote": "Distant",
  "app.universalTerminalProfileSelector.clearRecent":
    "Effacer les profils récents",
  "app.universalTerminalProfileSelector.groupRecent": "Récents",
  "app.universalTerminalProfileSelector.groupUngrouped": "Non groupé",
  "app.universalTerminalProfileSelector.hintEnter": "Entrée",
  "app.universalTerminalProfileSelector.manageProfiles": "Gérer les profils",
  "app.universalTerminalProfileSelector.noMatches":
    "Aucun profil correspondant",
  "app.universalTerminalProfileSelector.placeholder":
    "Sélectionnez un profil ou saisissez une adresse",
  "app.universalTerminalProfileSelector.title": "Sélectionner un profil",
  "app.universalTerminalSessionExited": "(processus terminé {{code}})",
  "app.universalTerminalSettings.appearanceCanvas": "Curseur et canevas",
  "app.universalTerminalSettings.appearanceLead":
    "Harmonisez le terminal avec le reste de la fenêtre et gardez-le lisible lors des sessions longues.",
  "app.universalTerminalSettings.appearanceTypography": "Typographie",
  "app.universalTerminalSettings.autoOpen":
    "Ouvrir automatiquement un terminal au démarrage de l'app",
  "app.universalTerminalSettings.autoOpenHint":
    "Lorsque cette option est activée, l’ouverture du terminal universel crée une session si aucune n’est en cours.",
  "app.universalTerminalSettings.behaviorTitle": "Comportement de la session",
  "app.universalTerminalSettings.bell": "Cloche",
  "app.universalTerminalSettings.bell.audible": "Sonore",
  "app.universalTerminalSettings.bell.none": "Désactivé",
  "app.universalTerminalSettings.bell.visual": "Visuel",
  "app.universalTerminalSettings.bracketedPaste": "Collage entre crochets",
  "app.universalTerminalSettings.bracketedPasteHint":
    "Encapsuler le texte collé afin que les shells évitent d'exécuter accidentellement des commandes multilignes.",
  "app.universalTerminalSettings.builtin.bash": "bash",
  "app.universalTerminalSettings.builtin.cmd": "Invite de commandes",
  "app.universalTerminalSettings.builtin.gitBash": "Git Bash",
  "app.universalTerminalSettings.builtin.powershell": "PowerShell",
  "app.universalTerminalSettings.builtin.pwsh": "PowerShell 7",
  "app.universalTerminalSettings.builtin.sshConnection": "Connexion SSH",
  "app.universalTerminalSettings.builtin.systemDefault": "Par défaut système",
  "app.universalTerminalSettings.builtin.wsl": "WSL",
  "app.universalTerminalSettings.builtin.zsh": "zsh",
  "app.universalTerminalSettings.clipboardTitle": "Presse-papiers et sélection",
  "app.universalTerminalSettings.closeEditor": "Fermer",
  "app.universalTerminalSettings.copyOnSelect": "Copier à la sélection",
  "app.universalTerminalSettings.cursor.bar": "Barre",
  "app.universalTerminalSettings.cursor.block": "Bloc",
  "app.universalTerminalSettings.cursor.underline": "Souligné",
  "app.universalTerminalSettings.cursorBlink": "Curseur clignotant",
  "app.universalTerminalSettings.cursorStyle": "Style du curseur",
  "app.universalTerminalSettings.displayPresets.balanced": "Équilibré",
  "app.universalTerminalSettings.displayPresets.compact": "Compact",
  "app.universalTerminalSettings.displayPresets.hint":
    "Appliquez une base optimisée, puis continuez d'ajuster les contrôles détaillés ci-dessous.",
  "app.universalTerminalSettings.displayPresets.presentation": "Présentation",
  "app.universalTerminalSettings.displayPresets.title":
    "Préréglages d’affichage",
  "app.universalTerminalSettings.drawBoldTextInBrightColors":
    "Afficher le texte en gras avec des couleurs vives",
  "app.universalTerminalSettings.duplicateProfile": "Dupliquer",
  "app.universalTerminalSettings.fontFamily": "Famille de police",
  "app.universalTerminalSettings.fontSize": "Taille de police",
  "app.universalTerminalSettings.fontWeight": "Graisse de police",
  "app.universalTerminalSettings.fontWeightBold": "Graisse du gras",
  "app.universalTerminalSettings.groups.local": "Shells locaux",
  "app.universalTerminalSettings.groups.ssh": "Connexions SSH",
  "app.universalTerminalSettings.headline":
    "Définissez comment les nouvelles sessions se lancent et l'apparence de chaque terminal.",
  "app.universalTerminalSettings.hotkeys.actions.clear": "Effacer le terminal",
  "app.universalTerminalSettings.hotkeys.actions.copy":
    "Copier dans le presse-papiers",
  "app.universalTerminalSettings.hotkeys.actions.copy-current-path":
    "Copier le chemin actuel",
  "app.universalTerminalSettings.hotkeys.actions.ctrl-c":
    "Ctrl-C intelligent (copier/interrompre)",
  "app.universalTerminalSettings.hotkeys.actions.delete-line":
    "Supprimer la ligne entière",
  "app.universalTerminalSettings.hotkeys.actions.delete-next-word":
    "Supprimer le mot suivant",
  "app.universalTerminalSettings.hotkeys.actions.delete-previous-word":
    "Supprimer le mot précédent",
  "app.universalTerminalSettings.hotkeys.actions.disconnect-tab":
    "Déconnecter l'onglet actuel (Série/Telnet/SSH)",
  "app.universalTerminalSettings.hotkeys.actions.end": "Fin de ligne",
  "app.universalTerminalSettings.hotkeys.actions.focus-all-tabs":
    "Cibler tous les onglets à la fois (diffusion)",
  "app.universalTerminalSettings.hotkeys.actions.home": "Début de la ligne",
  "app.universalTerminalSettings.hotkeys.actions.next-word":
    "Aller au mot suivant",
  "app.universalTerminalSettings.hotkeys.actions.pane-focus-all":
    "Focaliser tous les volets à la fois (diffusion)",
  "app.universalTerminalSettings.hotkeys.actions.paste":
    "Coller depuis le presse-papiers",
  "app.universalTerminalSettings.hotkeys.actions.previous-word":
    "Aller au mot précédent",
  "app.universalTerminalSettings.hotkeys.actions.reconnect-tab":
    "Reconnecter l'onglet actuel (Série/Telnet/SSH)",
  "app.universalTerminalSettings.hotkeys.actions.reset-zoom":
    "Réinitialiser le zoom",
  "app.universalTerminalSettings.hotkeys.actions.scroll-down":
    "Faire défiler le terminal d’une ligne vers le bas",
  "app.universalTerminalSettings.hotkeys.actions.scroll-page-down":
    "Faire défiler le terminal d’une page vers le bas",
  "app.universalTerminalSettings.hotkeys.actions.scroll-page-up":
    "Faire défiler le terminal d'une page vers le haut",
  "app.universalTerminalSettings.hotkeys.actions.scroll-to-bottom":
    "Faire défiler le terminal vers le bas",
  "app.universalTerminalSettings.hotkeys.actions.scroll-to-top":
    "Faire défiler le terminal vers le haut",
  "app.universalTerminalSettings.hotkeys.actions.scroll-up":
    "Faire défiler le terminal d’une ligne vers le haut",
  "app.universalTerminalSettings.hotkeys.actions.search": "Rechercher",
  "app.universalTerminalSettings.hotkeys.actions.select-all":
    "Tout sélectionner",
  "app.universalTerminalSettings.hotkeys.actions.zoom-in": "Zoom avant",
  "app.universalTerminalSettings.hotkeys.actions.zoom-out": "Zoom arrière",
  "app.universalTerminalSettings.hotkeys.addEllipsis": "Ajouter…",
  "app.universalTerminalSettings.hotkeys.cancel": "Annuler",
  "app.universalTerminalSettings.hotkeys.lead":
    "Recherchez, examinez et modifiez les raccourcis clavier du terminal intégré.",
  "app.universalTerminalSettings.hotkeys.pressKeysNow":
    "Appuyez sur la touche maintenant",
  "app.universalTerminalSettings.hotkeys.removeBinding":
    "Supprimer le raccourci",
  "app.universalTerminalSettings.hotkeys.reset": "Réinitialiser",
  "app.universalTerminalSettings.hotkeys.resetAll":
    "Rétablir toutes les valeurs par défaut intégrées",
  "app.universalTerminalSettings.hotkeys.searchPlaceholder":
    "Rechercher des raccourcis",
  "app.universalTerminalSettings.hotkeys.title": "Raccourcis clavier",
  "app.universalTerminalSettings.launchPreview": "Aperçu du lancement",
  "app.universalTerminalSettings.lineHeight": "Hauteur de ligne",
  "app.universalTerminalSettings.minimumContrastRatio":
    "Ratio de contraste minimal",
  "app.universalTerminalSettings.minimumContrastRatioHint":
    "Augmentez cette valeur lorsque les thèmes à faible contraste rendent le texte difficile à lire.",
  "app.universalTerminalSettings.mouseTitle": "Souris",
  "app.universalTerminalSettings.nav.appearance": "Apparence",
  "app.universalTerminalSettings.nav.appearanceDesc":
    "Ajustez la typographie, le rendu du curseur et les préréglages d’affichage.",
  "app.universalTerminalSettings.nav.displayBehavior":
    "Affichage et comportement",
  "app.universalTerminalSettings.nav.displayBehaviorDesc":
    "Ajustez le rendu, le presse-papiers et les détails d'interaction.",
  "app.universalTerminalSettings.nav.hotkeys": "Raccourcis",
  "app.universalTerminalSettings.nav.hotkeysDesc":
    "Personnalisez les raccourcis clavier du terminal.",
  "app.universalTerminalSettings.nav.profilesConnections":
    "Profils et connexions",
  "app.universalTerminalSettings.nav.profilesConnectionsDesc":
    "Gérez les shells locaux, les cibles SSH et les valeurs par défaut.",
  "app.universalTerminalSettings.nav.terminal": "Terminal",
  "app.universalTerminalSettings.nav.terminalDesc":
    "Configurez le comportement de la session, le presse-papiers et les règles d’interaction.",
  "app.universalTerminalSettings.opacity": "Opacité du panneau",
  "app.universalTerminalSettings.pasteOnMiddleClick": "Coller au clic milieu",
  "app.universalTerminalSettings.preview.connected": "Aperçu en direct",
  "app.universalTerminalSettings.preview.target": "Shell actif",
  "app.universalTerminalSettings.profileActions": "Actions du profil",
  "app.universalTerminalSettings.profiles.add": "Nouveau profil",
  "app.universalTerminalSettings.profiles.advancedBuiltinDesc":
    "Lorsque désactivé, seuls les profils personnalisés enregistrés apparaissent dans la liste (les entrées récentes peuvent toujours résoudre les identifiants intégrés).",
  "app.universalTerminalSettings.profiles.advancedBuiltinTitle":
    "Afficher les profils intégrés dans le sélecteur",
  "app.universalTerminalSettings.profiles.advancedDefaultRowLocal":
    "Terminal local",
  "app.universalTerminalSettings.profiles.advancedDefaultRowSsh": "SSH",
  "app.universalTerminalSettings.profiles.advancedDefaultsDesc":
    "Modifiez les valeurs par défaut fusionnées lors de la création d’un nouveau profil à partir d’un modèle (même principe que les paramètres de profil par défaut de Tabby). L’enregistrement met à jour les paramètres globaux et n’ajoute pas à lui seul un nouveau profil personnalisé.",
  "app.universalTerminalSettings.profiles.advancedDefaultsTitle":
    "Paramètres de profil par défaut",
  "app.universalTerminalSettings.profiles.advancedLead":
    "Options globales et comportement du sélecteur de profil. Ceci est distinct de la modification des profils individuels.",
  "app.universalTerminalSettings.profiles.advancedRecentDesc":
    "Définissez 0 pour désactiver les profils récents.",
  "app.universalTerminalSettings.profiles.advancedRecentTitle":
    "Afficher les profils récents dans le sélecteur",
  "app.universalTerminalSettings.profiles.advancedResetDesc":
    "Rétablir l’apparence, le comportement, les raccourcis et les profils du terminal aux valeurs d’usine. Cette action est irréversible.",
  "app.universalTerminalSettings.profiles.algorithms.cipher": "Chiffrements",
  "app.universalTerminalSettings.profiles.algorithms.compression":
    "Compression",
  "app.universalTerminalSettings.profiles.algorithms.hmac": "HMAC",
  "app.universalTerminalSettings.profiles.algorithms.kex": "Échange de clés",
  "app.universalTerminalSettings.profiles.algorithms.serverHostKey":
    "Clé d'hôte",
  "app.universalTerminalSettings.profiles.args": "Arguments",
  "app.universalTerminalSettings.profiles.argsPlaceholder": "ex. -l ou /K dir",
  "app.universalTerminalSettings.profiles.backspace.backspace": "Transmettre",
  "app.universalTerminalSettings.profiles.backspace.ctrl-?": "Ctrl-?",
  "app.universalTerminalSettings.profiles.backspace.ctrl-h": "Ctrl-H",
  "app.universalTerminalSettings.profiles.backspace.delete": "Suppr (CSI 3~)",
  "app.universalTerminalSettings.profiles.browse": "Parcourir",
  "app.universalTerminalSettings.profiles.clearOnConnect":
    "Effacer le terminal après la connexion",
  "app.universalTerminalSettings.profiles.colorLabel": "Couleur",
  "app.universalTerminalSettings.profiles.connection.direct": "Direct",
  "app.universalTerminalSettings.profiles.connection.jumpHost":
    "Hôte de rebond",
  "app.universalTerminalSettings.profiles.connection.proxyCommand":
    "Commande proxy",
  "app.universalTerminalSettings.profiles.connectionKind": "Connexion",
  "app.universalTerminalSettings.profiles.connectionMode": "Connexion",
  "app.universalTerminalSettings.profiles.connectionSummary": "Connexion",
  "app.universalTerminalSettings.profiles.cwd": "Répertoire de travail",
  "app.universalTerminalSettings.profiles.cwdDefault":
    "Racine de l'espace de travail ou répertoire du processus actuel",
  "app.universalTerminalSettings.profiles.cwdPlaceholder":
    "Relatif à l’espace de travail ou chemin absolu",
  "app.universalTerminalSettings.profiles.defaultBadge": "Par défaut",
  "app.universalTerminalSettings.profiles.defaultProfileHint":
    "Le bouton + et les nouvelles fenêtres de terminal démarrent avec ce profil.",
  "app.universalTerminalSettings.profiles.defaultProfileLabel":
    "Profil par défaut pour les nouveaux onglets",
  "app.universalTerminalSettings.profiles.defaultsEditorTitleLocal":
    "Paramètres par défaut — Terminal local",
  "app.universalTerminalSettings.profiles.defaultsEditorTitleSsh":
    "Paramètres par défaut — SSH",
  "app.universalTerminalSettings.profiles.disableDynamicTitle":
    "Désactiver le titre d'onglet dynamique",
  "app.universalTerminalSettings.profiles.disableDynamicTitleHint":
    "Utiliser le nom de la connexion au lieu du titre distant.",
  "app.universalTerminalSettings.profiles.edit": "Modifier",
  "app.universalTerminalSettings.profiles.editorAdvancedTitle": "Avancé",
  "app.universalTerminalSettings.profiles.editorAuthenticationTitle":
    "Authentification",
  "app.universalTerminalSettings.profiles.editorCancel": "Annuler",
  "app.universalTerminalSettings.profiles.editorConnectionTitle": "Connexion",
  "app.universalTerminalSettings.profiles.editorCopyNew":
    "Ajustez le profil de base, puis enregistrez-le dans votre liste de profils personnalisés.",
  "app.universalTerminalSettings.profiles.editorEnvironmentTitle":
    "Environnement",
  "app.universalTerminalSettings.profiles.editorGeneralTitle": "Général",
  "app.universalTerminalSettings.profiles.editorSave": "Enregistrer",
  "app.universalTerminalSettings.profiles.editorSaveHint":
    "Vérifiez les champs ici, puis confirmez pour enregistrer.",
  "app.universalTerminalSettings.profiles.editorTabsLabel":
    "Sections des paramètres du profil",
  "app.universalTerminalSettings.profiles.editorTitleNew": "Nouveau profil",
  "app.universalTerminalSettings.profiles.emptyGroup":
    "Aucun profil enregistré dans ce groupe pour l’instant.",
  "app.universalTerminalSettings.profiles.env":
    "Environnement (CLÉ=valeur par ligne)",
  "app.universalTerminalSettings.profiles.envCount": "Entrées d'env.",
  "app.universalTerminalSettings.profiles.filter": "Filtrer les profils",
  "app.universalTerminalSettings.profiles.forgetPassword": "Oublier",
  "app.universalTerminalSettings.profiles.forward.add":
    "Ajouter une redirection de port",
  "app.universalTerminalSettings.profiles.forward.dynamic": "Dynamique",
  "app.universalTerminalSettings.profiles.forward.host": "Hôte",
  "app.universalTerminalSettings.profiles.forward.local": "Local",
  "app.universalTerminalSettings.profiles.forward.port": "Port",
  "app.universalTerminalSettings.profiles.forward.remote": "Distant",
  "app.universalTerminalSettings.profiles.forward.remove":
    "Supprimer la redirection",
  "app.universalTerminalSettings.profiles.forward.targetAddress":
    "Adresse cible",
  "app.universalTerminalSettings.profiles.forward.targetPort": "Port cible",
  "app.universalTerminalSettings.profiles.forward.type": "Type",
  "app.universalTerminalSettings.profiles.group.builtin": "Intégré",
  "app.universalTerminalSettings.profiles.group.custom": "Non groupé",
  "app.universalTerminalSettings.profiles.groupLabel": "Groupe",
  "app.universalTerminalSettings.profiles.groupPlaceholder": "Non groupé",
  "app.universalTerminalSettings.profiles.hint":
    "Le profil par défaut est utilisé pour le bouton + et les nouvelles sessions à l'ouverture de la fenêtre.",
  "app.universalTerminalSettings.profiles.iconLabel": "Icône",
  "app.universalTerminalSettings.profiles.iconPlaceholder": "fas fa-desktop",
  "app.universalTerminalSettings.profiles.inputBackspace":
    "Mode touche Retour arrière",
  "app.universalTerminalSettings.profiles.kind.local": "Shell local",
  "app.universalTerminalSettings.profiles.kind.ssh": "SSH",
  "app.universalTerminalSettings.profiles.kindBadge.local": "Local",
  "app.universalTerminalSettings.profiles.kindBadge.ssh": "SSH",
  "app.universalTerminalSettings.profiles.lead":
    "Choisissez comment chaque nouvel onglet se connecte : un shell local sur cette machine, ou via SSH vers un hôte distant.",
  "app.universalTerminalSettings.profiles.login.add": "Nouvel élément",
  "app.universalTerminalSettings.profiles.login.expect": "Attendre",
  "app.universalTerminalSettings.profiles.login.optional": "Facultatif",
  "app.universalTerminalSettings.profiles.login.regex": "Regex",
  "app.universalTerminalSettings.profiles.login.remove": "Supprimer",
  "app.universalTerminalSettings.profiles.login.send": "Envoyer",
  "app.universalTerminalSettings.profiles.name": "Nom",
  "app.universalTerminalSettings.profiles.newButton": "Nouveau",
  "app.universalTerminalSettings.profiles.newDialogCancel": "Annuler",
  "app.universalTerminalSettings.profiles.newDialogCopy":
    "Partez d’un shell détecté ou d’un profil enregistré existant, puis ajustez les détails dans l’éditeur.",
  "app.universalTerminalSettings.profiles.newDialogEmpty":
    "Aucun profil correspondant ou shell intégré n'a été trouvé.",
  "app.universalTerminalSettings.profiles.newDialogSearch":
    "Filtrer les modèles",
  "app.universalTerminalSettings.profiles.newDialogTitle":
    "Sélectionner un profil de base",
  "app.universalTerminalSettings.profiles.newLocal": "Nouveau profil local",
  "app.universalTerminalSettings.profiles.newSsh": "Nouveau profil SSH",
  "app.universalTerminalSettings.profiles.newSshName": "Nouveau profil SSH",
  "app.universalTerminalSettings.profiles.noEnv": "Aucun",
  "app.universalTerminalSettings.profiles.open": "Ouvrir",
  "app.universalTerminalSettings.profiles.passwordClearConfirm":
    "Oublier le mot de passe enregistré pour ce profil ?",
  "app.universalTerminalSettings.profiles.passwordHint":
    "Stockez un mot de passe dans le trousseau.",
  "app.universalTerminalSettings.profiles.passwordLabel": "Mot de passe",
  "app.universalTerminalSettings.profiles.passwordModalConfirmForget":
    "Oublier le mot de passe",
  "app.universalTerminalSettings.profiles.passwordModalDismiss":
    "Fermer la boîte de dialogue du mot de passe",
  "app.universalTerminalSettings.profiles.passwordModalSave":
    "Enregistrer le mot de passe",
  "app.universalTerminalSettings.profiles.passwordPrompt":
    "Saisissez le mot de passe à enregistrer pour ce profil",
  "app.universalTerminalSettings.profiles.pickExecutable":
    "Sélectionner l’exécutable",
  "app.universalTerminalSettings.profiles.pickPrivateKeys":
    "Ajouter une clé privée",
  "app.universalTerminalSettings.profiles.pickWorkingDirectory":
    "Sélectionner le répertoire de travail",
  "app.universalTerminalSettings.profiles.remove": "Supprimer le profil",
  "app.universalTerminalSettings.profiles.removeKey": "Supprimer",
  "app.universalTerminalSettings.profiles.sessionEnd.auto": "Auto",
  "app.universalTerminalSettings.profiles.sessionEnd.close": "Fermer",
  "app.universalTerminalSettings.profiles.sessionEnd.keep": "Conserver",
  "app.universalTerminalSettings.profiles.sessionEnd.reconnect": "Reconnecter",
  "app.universalTerminalSettings.profiles.sessionEndBehavior":
    "À la fin de la session",
  "app.universalTerminalSettings.profiles.sessionEndBehaviorHint":
    "Fermer l'onglet uniquement lorsque la session est explicitement terminée.",
  "app.universalTerminalSettings.profiles.setDefault":
    "Profil par défaut pour les nouveaux onglets",
  "app.universalTerminalSettings.profiles.setPassword":
    "Définir le mot de passe",
  "app.universalTerminalSettings.profiles.shell": "Exécutable du shell",
  "app.universalTerminalSettings.profiles.shellPlaceholder":
    "Laissez vide pour la valeur système par défaut",
  "app.universalTerminalSettings.profiles.sshAuth.agent": "Agent",
  "app.universalTerminalSettings.profiles.sshAuth.auto": "Auto",
  "app.universalTerminalSettings.profiles.sshAuth.keyboardInteractive":
    "Interactif",
  "app.universalTerminalSettings.profiles.sshAuth.password": "Mot de passe",
  "app.universalTerminalSettings.profiles.sshAuth.publicKey": "Clé",
  "app.universalTerminalSettings.profiles.sshAuthMode": "Authentification",
  "app.universalTerminalSettings.profiles.sshExtraArgs":
    "Arguments SSH supplémentaires",
  "app.universalTerminalSettings.profiles.sshExtraArgsPlaceholder":
    "ex. -o ServerAliveInterval=30",
  "app.universalTerminalSettings.profiles.sshHost": "Hôte",
  "app.universalTerminalSettings.profiles.sshIdentityFile":
    "Fichier d’identité",
  "app.universalTerminalSettings.profiles.sshIdentityPlaceholder":
    "Chemin facultatif vers la clé privée",
  "app.universalTerminalSettings.profiles.sshIncomplete":
    "SSH nécessite l'hôte et le nom d'utilisateur. Tant que les deux ne sont pas définis, les nouveaux onglets utiliseront un shell local par défaut.",
  "app.universalTerminalSettings.profiles.sshJumpHost": "Hôte de rebond",
  "app.universalTerminalSettings.profiles.sshJumpHostPlaceholder":
    "Optionnel ; exemple : bastion ou utilisateur@bastion",
  "app.universalTerminalSettings.profiles.sshKeepAliveCountMax":
    "Nombre max de keep alive",
  "app.universalTerminalSettings.profiles.sshKeepAliveInterval":
    "Intervalle de maintien de connexion (secondes)",
  "app.universalTerminalSettings.profiles.sshPasswordAuthHint":
    "Les invites de mot de passe sont toujours gérées par le client ssh système à l’ouverture de la session.",
  "app.universalTerminalSettings.profiles.sshPort": "Port",
  "app.universalTerminalSettings.profiles.sshPrivateKeys": "Clés privées",
  "app.universalTerminalSettings.profiles.sshPrivateKeysEmpty":
    "Aucune clé privée sélectionnée pour l'instant.",
  "app.universalTerminalSettings.profiles.sshPrivateKeysHint":
    "Ajoutez un ou plusieurs fichiers de clé que le client ssh système peut utiliser.",
  "app.universalTerminalSettings.profiles.sshProxyCommand": "Commande proxy",
  "app.universalTerminalSettings.profiles.sshProxyCommandPlaceholder":
    "Facultatif ; commande dont stdin/stdout sert de transport",
  "app.universalTerminalSettings.profiles.sshRemoteCommand":
    "Commande distante",
  "app.universalTerminalSettings.profiles.sshRemoteCommandPlaceholder":
    "Facultatif ; laissez vide pour un shell interactif",
  "app.universalTerminalSettings.profiles.sshUser": "Nom d’utilisateur",
  "app.universalTerminalSettings.profiles.tab.advanced": "Avancé",
  "app.universalTerminalSettings.profiles.tab.ciphers": "Chiffrements",
  "app.universalTerminalSettings.profiles.tab.colors": "Couleurs",
  "app.universalTerminalSettings.profiles.tab.general": "Général",
  "app.universalTerminalSettings.profiles.tab.input": "Saisie",
  "app.universalTerminalSettings.profiles.tab.loginScripts":
    "Scripts de connexion",
  "app.universalTerminalSettings.profiles.tab.ports": "Ports",
  "app.universalTerminalSettings.profiles.untitled": "Nouveau profil",
  "app.universalTerminalSettings.profilesPageTitle": "Profils",
  "app.universalTerminalSettings.profilesSubtab.advanced": "Paramètres avancés",
  "app.universalTerminalSettings.profilesSubtab.profiles": "Profils",
  "app.universalTerminalSettings.quickActionsHint":
    "Créez des profils de démarrage ou restaurez l’espace de travail du terminal à ses valeurs par défaut.",
  "app.universalTerminalSettings.quickActionsTitle": "Actions rapides",
  "app.universalTerminalSettings.renderingTitle": "Rendu",
  "app.universalTerminalSettings.resetAll": "Tout réinitialiser",
  "app.universalTerminalSettings.resetProfile": "Réinitialiser les champs",
  "app.universalTerminalSettings.restoreTabs":
    "Restaurer les onglets du terminal au démarrage de l'app",
  "app.universalTerminalSettings.restoreTabsHint":
    "Recréer le dernier ensemble d'onglets de terminal enregistré à la prochaine ouverture de cette fenêtre.",
  "app.universalTerminalSettings.rightClick.clipboard":
    "Coller / copier la sélection",
  "app.universalTerminalSettings.rightClick.menu": "Menu contextuel",
  "app.universalTerminalSettings.rightClick.off": "Désactivé",
  "app.universalTerminalSettings.rightClick.paste": "Coller",
  "app.universalTerminalSettings.rightClickAction": "Clic droit",
  "app.universalTerminalSettings.scrollback": "Lignes d'historique",
  "app.universalTerminalSettings.scrollOnInput": "Défiler lors de la saisie",
  "app.universalTerminalSettings.sidebarTitle": "Paramètres",
  "app.universalTerminalSettings.soundTitle": "Son",
  "app.universalTerminalSettings.startupTitle": "Démarrage",
  "app.universalTerminalSettings.summary.activeTarget": "Cible actuelle",
  "app.universalTerminalSettings.summary.defaultProfile": "Profil par défaut",
  "app.universalTerminalSettings.summary.envCount": "Variables d’env.",
  "app.universalTerminalSettings.summary.profileCount": "Profils",
  "app.universalTerminalSettings.systemDefaultShell":
    "Shell par défaut du système",
  "app.universalTerminalSettings.terminalLead":
    "Définissez le comportement de l'interaction, du presse-papiers et de l'historique de session pendant votre travail.",
  "app.universalTerminalSettings.title": "Paramètres du terminal",
  "app.universalTerminalSettings.trimWhitespaceOnPaste":
    "Supprimer les espaces au collage",
  "app.universalTerminalSettings.trimWhitespaceOnPasteHint":
    "Supprimer les espaces superflus au début et à la fin des commandes collées lorsque c'est sans risque.",
  "app.universalTerminalSettings.warnOnMultilinePaste":
    "Avertir lors d'un collage multiligne",
  "app.universalTerminalSettings.warnOnMultilinePasteHint":
    "Demander une confirmation avant de coller plusieurs lignes dans le terminal.",
  "app.universalTerminalSettings.wordSeparator": "Séparateurs de mots",
  "app.universalTerminalSettings.wordSeparatorHint":
    "La sélection par double-clic s'arrête à ces caractères.",
  "app.universalTerminalSftpConnected": "Connecté",
  "app.universalTerminalSftpConnecting": "Connexion en cours",
  "app.universalTerminalSftpCopyFullPath": "Copier le chemin complet",
  "app.universalTerminalSftpCreateAction": "Créer",
  "app.universalTerminalSftpCreateDirectory": "Créer un répertoire",
  "app.universalTerminalSftpCreateDirectoryName": "Nom du nouveau répertoire",
  "app.universalTerminalSftpCreateDirectoryTitle": "Créer un répertoire",
  "app.universalTerminalSftpDeleteConfirm": "Supprimer {{fullPath}} ?",
  "app.universalTerminalSftpDownload": "Télécharger",
  "app.universalTerminalSftpDownloadDirectory": "Télécharger le répertoire",
  "app.universalTerminalSftpEditLocal": "Modifier localement",
  "app.universalTerminalSftpEditPath": "Modifier le chemin",
  "app.universalTerminalSftpEntrySummary": "{{count}} éléments",
  "app.universalTerminalSftpEntrySummaryPending": "Préparation de la liste",
  "app.universalTerminalSftpFilter": "Filtrer",
  "app.universalTerminalSftpFilteredSummary":
    "{{shown}} sur {{total}} affichés",
  "app.universalTerminalSftpFilterPlaceholder": "Filtrer les fichiers…",
  "app.universalTerminalSftpGoUp": "Remonter",
  "app.universalTerminalSftpLoading": "Chargement",
  "app.universalTerminalSftpLocation": "Emplacement actuel",
  "app.universalTerminalSftpNoMatches":
    "Aucun fichier ne correspond au filtre « {{filterText}} »",
  "app.universalTerminalSftpTitle": "Fichiers distants",
  "app.universalTerminalSftpUploadFiles": "Téléverser des fichiers",
  "app.universalTerminalSftpUploadFolder": "Téléverser un dossier",
  "app.universalTerminalSftpWorking": "En cours",
  "app.universalTerminalStartPageCopy":
    "Lancez un nouveau shell, connectez-vous à une cible SSH ou ajustez la configuration de votre terminal avant d’ouvrir la prochaine session.",
  "app.universalTerminalStartPageDefaultBadge": "Par défaut",
  "app.universalTerminalStartPageDefaultFallback":
    "Démarre votre profil de terminal par défaut.",
  "app.universalTerminalStartPageDefaultHint": "Démarre {{name}} · {{target}}",
  "app.universalTerminalStartPageMoreProfiles":
    "+{{count}} profils supplémentaires dans les Paramètres",
  "app.universalTerminalStartPageProfilesEmpty":
    "Aucun profil de lancement disponible pour l’instant. Ouvrez les Paramètres pour en créer un.",
  "app.universalTerminalStartPageProfilesHint":
    "Ouvrez un shell enregistré ou une connexion directement depuis votre page d'accueil.",
  "app.universalTerminalStartPageProfilesTitle": "Profils de lancement rapide",
  "app.universalTerminalStartPageSettingsHint":
    "Gérez les profils, l’apparence, le presse-papiers et le comportement au démarrage.",
  "app.universalTerminalTabHeader.contextMenuLabel": "Actions d’onglet",
  "app.universalTerminalTabHeader.duplicateTerminal": "Dupliquer le terminal",
  "app.universalTerminalTabHeader.newTerminal": "Nouveau terminal",
  "app.universalTerminalTabHeader.splitDown": "Diviser vers le bas",
  "app.universalTerminalTabHeader.splitRight": "Fractionner à droite",
  "app.universalTerminalToast.copied": "Copié",
  "app.universalTerminalToolbarPin": "Épingler",
  "app.universalTerminalToolbarPorts": "Ports",
  "app.universalTerminalToolbarReconnect": "Reconnecter",
  "app.universalTerminalToolbarSftp": "SFTP",
  "app.universalTerminalToolbarUnpin": "Désépingler",
  "app.universalTerminalUnavailable": "Service de terminal indisponible",
  "app.universalTerminalWindowTitle": "Terminal universel",
  "app.updateReady": "Mise à jour prête — redémarrez pour appliquer",
  "app.updateReadyMacUnsigned":
    "Mise à jour téléchargée. Veuillez l'installer manuellement.",
  "app.userMsgEditHint":
    "Ouvrez le compositeur complet ici pour modifier et renvoyer (remplace les messages après celui-ci)",
  "app.userMsgGenerating": "Génération de la réponse…",
  "app.view.actualSize": "Taille réelle",
  "app.view.back": "Précédent",
  "app.view.find": "Rechercher",
  "app.view.forward": "Suivant",
  "app.view.nextThread": "Conversation suivante",
  "app.view.previousThread": "Conversation précédente",
  "app.view.toggleDiffPanel": "Basculer le panneau de diffs",
  "app.view.toggleFullscreen": "Plein écran",
  "app.view.toggleSidebar": "Basculer la barre latérale",
  "app.view.toggleTerminal": "Basculer le terminal",
  "app.view.zoomIn": "Zoom avant",
  "app.view.zoomOut": "Zoom arrière",
  "app.viewAllRecents": "Voir tout ({{count}})",
  "app.voiceSoonAria": "Saisie vocale (non disponible)",
  "app.voiceSoonTitle": "Saisie vocale (non disponible)",
  "app.welcomeCloneRepo": "Cloner un dépôt",
  "app.welcomeCloneRepoHint": "Importez un dépôt Git existant dans mAI Coder.",
  "app.welcomeConnectSsh": "Se connecter via SSH",
  "app.welcomeConnectSshHint": "Travaillez avec une machine distante via SSH.",
  "app.welcomeOpenProject": "Ouvrir un projet",
  "app.welcomeOpenProjectHint":
    "Ouvrez un espace de travail local et commencez à éditer.",
  "app.window.close": "Fermer la fenêtre",
  "app.window.maximize": "Agrandir",
  "app.window.minimize": "Réduire",
  "app.window.restore": "Restaurer",
  "app.windowMenu.aria": "Fenêtre",
  "app.workspaceArchiveSoonToast":
    "L’archivage des fils pour les espaces de travail arrive bientôt.",
  "app.workspaceLauncher.antigravity": "Antigravity",
  "app.workspaceLauncher.cursor": "Cursor",
  "app.workspaceLauncher.explorer": "Explorateur de fichiers",
  "app.workspaceLauncher.jetbrains": "JetBrains",
  "app.workspaceLauncher.menuAria": "Choisir le lanceur d’espace de travail",
  "app.workspaceLauncher.openFailed":
    "Impossible d'ouvrir l'espace de travail dans {{app}}.",
  "app.workspaceLauncher.openWith":
    "Ouvrir l'espace de travail actuel dans {{app}}",
  "app.workspaceLauncher.terminal": "Terminal",
  "app.workspaceLauncher.toolUnavailable":
    "{{app}} n’est pas disponible sur ce système.",
  "app.workspaceLauncher.vscode": "VS Code",
  "app.workspaceMenuArchiveThreads": "Archiver les fils",
  "app.workspaceMenuCreateWorktree": "Créer un worktree permanent",
  "app.workspaceMenuEditName": "Modifier le nom",
  "app.workspaceMenuEditNamePrompt": "Nom de l'espace de travail",
  "app.workspaceMenuOpenInExplorer": "Ouvrir dans l'Explorateur",
  "app.workspaceMenuRemove": "Supprimer",
  "app.workspaceNameResetToast": "Nom de l’espace de travail réinitialisé",
  "app.workspaceRemovedToast": "Espace de travail retiré de la barre latérale",
  "app.workspaceRenamedToast": "Espace de travail renommé en {{name}}",
  "app.workspaceWorktreeSoonToast": "Le worktree permanent arrive bientôt.",
  "app.you": "Vous",
  "common.back": "Retour",
  "common.cancel": "Annuler",
  "common.close": "Fermer",
  "common.confirm": "Confirmer...",
  "common.confirmDelete": "Confirmer la suppression",
  "common.continue": "Continuer",
  "common.delete": "Supprimer",
  "common.deleteThread": "Supprimer la conversation",
  "common.dismiss": "Ignorer",
  "common.edit": "Modifier",
  "common.loading": "Chargement…",
  "common.no": "Non",
  "common.open": "Ouvrir",
  "common.refresh": "Actualiser",
  "common.rename": "Renommer",
  "common.renameThread": "Renommer la conversation",
  "common.save": "Enregistrer",
  "common.search": "Rechercher",
  "common.skip": "Passer",
  "common.soon": "Bientôt disponible",
  "common.threadTitle": "Titre de la conversation",
  "common.truncatedSuffix": "\n… (tronqué)",
  "common.yes": "Oui",
  "composer.act": "Action",
  "composer.attach.noWorkspace":
    "Ouvrez un dossier d'espace de travail pour joindre des images ou des fichiers.",
  "composer.attach.saveFailed":
    "Impossible d'enregistrer la pièce jointe dans l'espace de travail.",
  "composer.attach.tooLarge":
    "Le fichier est trop volumineux (max 8 Mo par fichier).",
  "composer.followup.ask":
    "Posez votre question, / pour les commandes, @ pour le contexte",
  "composer.followup.debug":
    "Déboguer, / pour les commandes, @ pour le contexte",
  "composer.followup.default":
    "Construire, / pour les commandes, @ pour le contexte",
  "composer.followup.plan": "Plan, / pour les commandes, @ pour le contexte",
  "composer.followup.team": "Équipe, / pour les commandes, @ pour le contexte",
  "composer.mode.agent": "Agent",
  "composer.mode.ask": "Demander",
  "composer.mode.debug": "Débogage",
  "composer.mode.plan": "Plan",
  "composer.mode.team": "Équipe",
  "composer.placeholder":
    "Demandez quelque chose ou appuyez sur @ pour mentionner un fichier, / pour une commande…",
  "composer.placeholder.agent":
    "Décrivez la tâche pour les étapes et les modifications suggérées… / pour les commandes, @ pour le contexte",
  "composer.placeholder.ask":
    "Posez une question ou lisez du code — ne modifiera pas le dépôt sauf si vous le demandez… / pour les commandes, @ pour le contexte",
  "composer.placeholder.debug":
    "Décrivez les symptômes, erreurs et étapes de reproduction… / pour les commandes, @ pour le contexte",
  "composer.placeholder.plan":
    "Planifiez et concevez avant l'implémentation… / pour les commandes, @ pour le contexte",
  "composer.placeholder.team":
    "Collaborez avec votre équipe de spécialistes pour livrer de bout en bout… / pour les commandes, @ pour le contexte",
  "composer.plan": "Plan",
  "composer.plusImage": "Image",
  "composer.plusMcp": "Serveurs MCP",
  "composer.plusMcpEmpty": "Aucun serveur MCP configuré pour l'instant.",
  "composer.plusMcpHint":
    "Inspectez ici l’état des serveurs MCP et activez ou désactivez directement les serveurs.",
  "composer.plusMenuAria": "Ajouter et mode",
  "composer.plusMenuHint": "Ajouter des agents, du contexte, des outils…",
  "composer.plusMenuModes": "Mode",
  "composer.plusOpenMcpSettings": "Ouvrir les paramètres MCP",
  "composer.plusOpenSkillSettings": "Ouvrir les paramètres des skills",
  "composer.plusSkills": "Skills",
  "composer.plusSkillsEmpty":
    "Aucune compétence appelable n'est disponible pour l'instant. Activez-en une dans les paramètres des compétences ou créez d'abord une nouvelle compétence.",
  "composer.plusSkillsHint":
    "Choisissez un skill pour insérer son préfixe d’invocation `./slug`.",
  "composer.plusUseSkill":
    "Cliquez pour insérer ce skill au début du compositeur.",
  "composer.send": "Envoyer",
  "composer.stop": "Arrêter",
  "composer.tokensUsed": "Tokens : {{count}}",
  "editorSettings.autoSave": "Enregistrement automatique",
  "editorSettings.bracketColorization": "Coloration des paires de crochets",
  "editorSettings.bracketColorizationDesc":
    "Colorer les paires de crochets correspondants.",
  "editorSettings.cursorStyle": "Style du curseur",
  "editorSettings.display": "Affichage",
  "editorSettings.font": "Police",
  "editorSettings.fontFamily": "Famille de police",
  "editorSettings.fontSize": "Taille de police",
  "editorSettings.formatOnSave": "Formater à l'enregistrement",
  "editorSettings.formatOnSaveDesc":
    "Formater automatiquement le code à l'enregistrement (nécessite un formateur).",
  "editorSettings.insertSpaces": "Insérer des espaces",
  "editorSettings.insertSpacesDesc":
    "Insérer des espaces au lieu de tabulations lorsque vous appuyez sur Tab.",
  "editorSettings.lead":
    "Personnalisez l'apparence et le comportement de l'éditeur. Les modifications s'appliquent instantanément.",
  "editorSettings.lineNumbers": "Numéros de ligne",
  "editorSettings.minimap": "Minicarte",
  "editorSettings.minimapDesc":
    "Afficher la minimap sur le côté droit de l’éditeur.",
  "editorSettings.renderWhitespace": "Afficher les espaces",
  "editorSettings.saveBehavior": "Comportement à l'enregistrement",
  "editorSettings.smoothScrolling": "Défilement fluide",
  "editorSettings.tabSize": "Taille de tabulation",
  "editorSettings.textFormatting": "Texte et mise en forme",
  "editorSettings.wordWrap": "Retour à la ligne",
  "errors.modelNameEmpty":
    "Le nom de la requête de modèle est vide. Modifiez l’entrée dans Modèles.",
  "errors.modelNoProvider":
    "Impossible de résoudre le modèle : il n’est lié à aucun fournisseur valide. Vérifiez Paramètres → Modèles.",
  "errors.modelNotChosen":
    "Aucun modèle sélectionné. Choisissez-en un depuis la barre de saisie ou ajoutez des modèles dans Paramètres → Modèles.",
  "errors.modelResolve":
    "Impossible de résoudre le modèle : il est manquant, non activé ou le nom de requête est vide. Vérifiez Paramètres → Modèles.",
  "errors.noAnthropicKey":
    "Aucune clé API Anthropic. Ajoutez-la sous Paramètres → Modèles → Clés API.",
  "errors.noMessages": "Aucun message à envoyer.",
  "errors.noOpenAIKey":
    "Aucune clé API compatible OpenAI. Ajoutez-la dans Paramètres → Modèles → Clés API.",
  "errors.proxyInvalid": "URL de proxy invalide.",
  "explorer.collapseDir": "Réduire",
  "explorer.ctx.addToChat": "Ajouter le fichier au chat mAI Coder",
  "explorer.ctx.addToNewChat":
    "Ajouter le fichier à une nouvelle discussion mAI Coder",
  "explorer.ctx.copy": "Copier",
  "explorer.ctx.copyPath": "Copier le chemin",
  "explorer.ctx.copyRelPath": "Copier le chemin relatif",
  "explorer.ctx.cut": "Couper",
  "explorer.ctx.delete": "Supprimer",
  "explorer.ctx.openInBrowser": "Ouvrir dans le navigateur",
  "explorer.ctx.openInTerminal": "Ouvrir dans le terminal intégré",
  "explorer.ctx.openTimeline": "Ouvrir la chronologie",
  "explorer.ctx.openToSide": "Ouvrir à côté",
  "explorer.ctx.openWith": "Ouvrir avec…",
  "explorer.ctx.rename": "Renommer…",
  "explorer.ctx.revealInExplorer": "Révéler dans l'explorateur de fichiers",
  "explorer.ctx.selectForCompare": "Sélectionner pour comparer",
  "explorer.ctx.share": "Partager",
  "explorer.deleteConfirmDir": "Supprimer ce dossier et tout son contenu…",
  "explorer.deleteConfirmFile": "Supprimer ce fichier…",
  "explorer.empty": "Dossier vide",
  "explorer.errClipboard": "Impossible de copier dans le presse-papiers.",
  "explorer.errDelete": "Suppression impossible.",
  "explorer.errOpenBrowser": "Impossible d'ouvrir dans le navigateur.",
  "explorer.errOpenDefault":
    "Impossible d'ouvrir avec l'application par défaut.",
  "explorer.errRename": "Impossible de renommer.",
  "explorer.errReveal": "Impossible d’afficher dans l’explorateur de fichiers.",
  "explorer.expandDir": "Développer",
  "explorer.loading": "Chargement…",
  "explorer.renamePrompt": "Nouveau nom",
  "git.badge.added": "Ajouté",
  "git.badge.deleted": "Supprimé",
  "git.badge.ignored": "Ignoré",
  "git.badge.modified": "Modifié",
  "git.badge.new": "Nouveau",
  "git.badge.renamed": "Renommé",
  "git.branchPicker.createCheckout": "Créer et extraire une nouvelle branche…",
  "git.branchPicker.createConfirm": "Créer",
  "git.branchPicker.created": "Créée et basculée sur {{name}}",
  "git.branchPicker.createFailed": "Impossible de créer la branche",
  "git.branchPicker.dialogAria": "Choisir une branche Git",
  "git.branchPicker.empty": "Aucune branche correspondante",
  "git.branchPicker.gitMissing":
    "Installez d’abord Git pour activer les fonctionnalités de branche",
  "git.branchPicker.loadFailed": "Impossible de charger les branches",
  "git.branchPicker.loading": "Chargement des branches…",
  "git.branchPicker.newBranchPlaceholder": "Nom de la nouvelle branche",
  "git.branchPicker.noShell": "Shell de l’application non connecté",
  "git.branchPicker.notRepo":
    "L'espace de travail actuel n'est pas un dépôt Git",
  "git.branchPicker.searchPlaceholder": "Rechercher des branches",
  "git.branchPicker.sectionBranches": "Branches",
  "git.branchPicker.switched": "Basculé sur {{name}}",
  "git.branchPicker.switchFailed": "Impossible de changer de branche",
  "git.branchPicker.triggerTitle": "Changer ou créer une branche",
  "git.branchPicker.unavailable":
    "Les fonctionnalités Git sont actuellement indisponibles",
  "git.diffPreview": "Aperçu du diff",
  "mai.account": "Compte mAI",
  "mai.accountTitle": "Mon Compte mAI",
  "mai.apiKeySynced": "Clé API mAI synchronisée avec succès.",
  "mai.connectedAs": "Connecté en tant que",
  "mai.email": "Adresse e-mail",
  "mai.enterOtp": "Entrez le code reçu par e-mail",
  "mai.identifier": "E-mail ou nom d'utilisateur",
  "mai.login": "Connexion",
  "mai.loginSuccess": "Connexion réussie à mAI !",
  "mai.loginToUse":
    "Connectez-vous à votre compte mAI pour activer les fonctionnalités IA.",
  "mai.logout": "Déconnexion",
  "mai.needVerification":
    "Un code de confirmation a été envoyé à votre adresse e-mail.",
  "mai.notLoggedIn": "Non connecté à mAI",
  "mai.otpCode": "Code de vérification (OTP)",
  "mai.password": "Mot de passe",
  "mai.profile": "Profil utilisateur",
  "mai.quotaExhaustedHint":
    "Votre limite hebdomadaire mAI est atteinte. Veuillez recharger votre forfait ou attendre la réinitialisation.",
  "mai.quotaReached": "Quota hebdomadaire épuisé",
  "mai.register": "Inscription",
  "mai.registerSuccess": "Compte mAI créé et vérifié avec succès !",
  "mai.resendCode": "Renvoyer le code",
  "mai.resetAt": "Réinitialisation le",
  "mai.sendCode": "Envoyer le code",
  "mai.submitting": "En cours…",
  "mai.tier": "Forfait",
  "mai.tokensUsed": "Tokens utilisés cette semaine",
  "mai.usage": "Consommation mAI",
  "mai.username": "Nom d'utilisateur",
  "mai.verify": "Vérifier le code",
  "mcp.action.edit": "Modifier",
  "mcp.action.restart": "Redémarrer",
  "mcp.action.start": "Démarrer",
  "mcp.action.stop": "Arrêter",
  "mcp.addCustom": "Ajouter personnalisé",
  "mcp.addEnvVar": "Ajouter une variable d'env.",
  "mcp.addFirstServer": "Ajoutez votre premier serveur",
  "mcp.addFromTemplate": "Ajouter depuis un modèle",
  "mcp.addHeader": "Ajouter un en-tête",
  "mcp.addServer": "Ajouter un serveur",
  "mcp.args": "Arguments",
  "mcp.autoStart": "Démarrage automatique",
  "mcp.command": "Commande",
  "mcp.confirmDelete": "Supprimer cette configuration de serveur MCP…",
  "mcp.connectedTools": "Outils connectés",
  "mcp.connectionError": "Erreur de connexion",
  "mcp.copyJson": "Copier le JSON",
  "mcp.description":
    "Gérez les serveurs Model Context Protocol pour fournir des outils et ressources externes à l'Agent.",
  "mcp.disabled": "Désactivé",
  "mcp.docHint": "MCP est un protocole ouvert. Voir la",
  "mcp.docLink": "Documentation MCP",
  "mcp.editServer": "Modifier le serveur",
  "mcp.enabled": "Activé",
  "mcp.envVars": "Variables d’environnement",
  "mcp.exportJson": "Exporter le JSON",
  "mcp.form.args": "Arguments",
  "mcp.form.argsAdd": "Ajouter un argument",
  "mcp.form.argsEmpty": "Aucun argument configuré",
  "mcp.form.argsHint":
    "Saisissez un argument par ligne. Inutile de saisir des séparateurs, et les chemins contenant des espaces restent intacts.",
  "mcp.form.argsItemPlaceholder": "Saisissez un argument",
  "mcp.form.argsRemove": "Supprimer l’argument",
  "mcp.form.autoStart": "Démarrage automatique",
  "mcp.form.command": "Commande",
  "mcp.form.commandPreview": "Aperçu de la commande",
  "mcp.form.enabled": "Activé",
  "mcp.form.env": "Variables d’environnement",
  "mcp.form.envAdd": "Ajouter une variable d'environnement",
  "mcp.form.envEmpty": "Aucune variable d'environnement configurée",
  "mcp.form.envRemove": "Supprimer la variable d’environnement",
  "mcp.form.exampleArg": "Arg {{index}}",
  "mcp.form.exampleTitle": "Exemple (MCP Système de fichiers)",
  "mcp.form.headers": "En-têtes",
  "mcp.form.headersAdd": "Ajouter un en-tête",
  "mcp.form.headersEmpty": "Aucun en-tête configuré",
  "mcp.form.headersRemove": "Supprimer l'en-tête",
  "mcp.form.name": "Nom",
  "mcp.form.namePlaceholder": "Mon serveur MCP",
  "mcp.form.timeout": "Délai d’attente (ms)",
  "mcp.form.transport": "Transport",
  "mcp.form.url": "URL",
  "mcp.headers": "En-têtes",
  "mcp.importJson": "Importer JSON",
  "mcp.jsonHint":
    "Modifiez directement le tableau des serveurs, ou collez une config Claude Desktop { mcpServers: {} } à importer.",
  "mcp.jsonInvalid": "JSON invalide",
  "mcp.jsonMode": "JSON",
  "mcp.lastConnected": "Dernière connexion",
  "mcp.lead":
    "Connectez des outils et sources de données externes via des serveurs Model Context Protocol.",
  "mcp.learnMore": "En savoir plus",
  "mcp.mcpExplanation":
    "MCP est un protocole ouvert d’Anthropic qui permet aux modèles d’IA d’accéder à des outils, données et ressources externes via des interfaces standardisées. En ajoutant des serveurs MCP, l’Agent peut acquérir plus de capacités : recherche web, accès base de données, opérations GitHub, etc.",
  "mcp.neverConnected": "Jamais connecté",
  "mcp.newServer": "Nouveau serveur",
  "mcp.noServers": "Aucun serveur MCP configuré",
  "mcp.noTools": "Aucun outil disponible",
  "mcp.pluginServersDesc":
    "Ces serveurs sont exposés automatiquement par les plugins installés. Vous pouvez les activer ou désactiver ici, puis démarrer, arrêter ou redémarrer tout serveur activé.",
  "mcp.pluginServersTitle": "Serveurs fournis par les plugins",
  "mcp.prompts": "Invites",
  "mcp.promptsCount": "{{count}} invites",
  "mcp.resources": "Ressources",
  "mcp.resourcesCount": "{{count}} ressources",
  "mcp.restartServer": "Redémarrer le serveur",
  "mcp.serverDetails": "Détails du serveur",
  "mcp.serverName": "Nom du serveur",
  "mcp.serverNamePlaceholder": "ex. GitHub MCP",
  "mcp.serversTitle": "Serveurs configurés",
  "mcp.startAll": "Tout démarrer",
  "mcp.startServer": "Démarrer le serveur",
  "mcp.status.connected": "Connecté",
  "mcp.status.connecting": "Connexion en cours",
  "mcp.status.disabled": "Désactivé",
  "mcp.status.disconnected": "Déconnecté",
  "mcp.status.error": "Erreur",
  "mcp.status.notStarted": "Non démarré",
  "mcp.status.stopped": "Arrêté",
  "mcp.stopServer": "Arrêter le serveur",
  "mcp.templateDescription":
    "Sélectionnez un modèle de serveur MCP courant pour une configuration rapide",
  "mcp.templates": "Modèles",
  "mcp.templatesHint": "Ajout rapide depuis les serveurs MCP populaires :",
  "mcp.timeout": "Délai d’attente",
  "mcp.title": "Serveurs MCP",
  "mcp.tools": "Outils",
  "mcp.toolsCount": "{{count}} outils",
  "mcp.transport": "Transport",
  "mcp.transport.http": "HTTP",
  "mcp.transport.sse": "SSE",
  "mcp.transport.stdio": "stdio",
  "mcp.url": "URL",
  "mcp.visualMode": "Visuel",
  "mcp.whatIsMcp": "Qu'est-ce que MCP…",
  "modelPicker.addModels": "Gérer les modèles…",
  "modelPicker.auto": "Auto",
  "modelPicker.autoDesc":
    "Utilise le premier modèle activé avec un nom de requête, dans l’ordre de la liste.",
  "modelPicker.edit": "Modifier",
  "modelPicker.emptyHint":
    "Aucun modèle disponible. Configurez vos modèles dans les paramètres.",
  "modelPicker.manageInSettings":
    "Gérer les modèles et clés API dans Paramètres…",
  "modelPicker.requestNameMissing": "Nom de requête non défini",
  "modelPicker.selectAria": "Sélecteur de modèle",
  "modelPicker.selectModel": "Sélectionner un modèle",
  "modelPicker.speed.fast": "Rapide",
  "modelPicker.speed.high": "Élevée",
  "modelPicker.speed.medium": "Moyenne",
  "plan.draft.toolActivityDone": "Brouillon du plan structuré mis à jour",
  "plan.draft.toolActivityFailed": "Échec du brouillon du plan structuré",
  "plan.draft.toolActivityPending": "Rédaction du plan structuré",
  "plan.q.aria": "Questions de clarification",
  "plan.q.chatActivity":
    "Options de clarification affichées (voir carte question ci-dessus)",
  "plan.q.chatActivityPending": "Préparation des options de clarification…",
  "plan.q.customPh": "Votre réponse…",
  "plan.q.skipUserMessage":
    "Je passe : poursuivez avec votre valeur par défaut recommandée et ne reposez plus cette question.",
  "plan.q.title": "Questions",
  "plan.q.toolActivityDone":
    "Question de clarification : l'utilisateur a répondu",
  "plan.q.toolActivityFailed": "Question de clarification : échouée",
  "plan.q.toolActivityPending":
    "Question de clarification : en attente de l’utilisateur…",
  "plan.review.addTodo": "Nouvelle tâche",
  "plan.review.addTodoPrompt": "Ajouter une tâche à faire",
  "plan.review.aria": "Vérifier le plan",
  "plan.review.build": "Construire",
  "plan.review.executeUserBubble":
    "Exécuter le document de plan enregistré : suivez chaque étape dans l'ordre et appliquez les modifications de code nécessaires. Le plan complet est joint dans le contexte système de ce tour.",
  "plan.review.execution": "Exécution",
  "plan.review.file": "Fichier du plan",
  "plan.review.fullHide": "Masquer le plan complet",
  "plan.review.fullShow": "Afficher le plan complet (tableaux et risques)",
  "plan.review.goal": "Objectif",
  "plan.review.label": "Vérifier le plan",
  "plan.review.model": "Modèle",
  "plan.review.pickModel": "Choisir un modèle…",
  "plan.review.reviewButton": "Examiner",
  "plan.review.scope": "Portée",
  "plan.review.summaryEmpty": "En attente du résumé final du plan.",
  "plan.review.todo": "À FAIRE ({{done}}/{{total}})",
  "plan.review.todoEmpty":
    "Aucune tâche pour l'instant. Ajoutez-en une depuis cette section.",
  "quickOpen.action.commands": "Afficher et exécuter les commandes",
  "quickOpen.action.goToFile": "Aller au fichier",
  "quickOpen.action.goToSymbol": "Aller au symbole dans l'espace de travail",
  "quickOpen.action.openWorkspace": "Ouvrir l'espace de travail…",
  "quickOpen.action.searchText": "Rechercher du texte",
  "quickOpen.action.settings": "Ouvrir les paramètres",
  "quickOpen.dialogAria": "Ouverture rapide",
  "quickOpen.emptyNoMatch": "Aucun fichier ou commande correspondant",
  "quickOpen.emptyNoProjects": "Aucun projet récent correspondant",
  "quickOpen.hint.goToLine": "Aller à la ligne {{line}} dans {{file}} (Entrée)",
  "quickOpen.hint.lineNumberExpected":
    "Saisissez un numéro de ligne après :, par exemple :42",
  "quickOpen.hint.symbolMode":
    "Saisissez un nom de symbole pour rechercher les symboles exportés dans l'espace de travail ; sélectionnez une ligne pour accéder à la ligne de définition.",
  "quickOpen.hint.textMode":
    "Recherche textuelle : saisissez une requête et appuyez sur Entrée pour ouvrir la vue Recherche, ou choisissez l’action ci-dessous.",
  "quickOpen.listAria": "Résultats d’ouverture rapide",
  "quickOpen.menubarAria": "Ouverture rapide des fichiers et commandes",
  "quickOpen.menubarSummary": "Rechercher fichiers, symboles, commandes…",
  "quickOpen.placeholder":
    "Rechercher des fichiers par nom (tapez > pour les commandes, @ pour filtrer les symboles, % pour la recherche textuelle, :ligne pour aller à la ligne)",
  "quickOpen.recentlyOpened": "ouverts récemment",
  "quickOpen.recentProjects": "projets récents",
  "quickOpen.searchDraftLabel": "Requête de recherche (barre latérale)",
  "ruleWizard.always": "Toujours joindre",
  "ruleWizard.alwaysHint": "Injecté à chaque tour",
  "ruleWizard.aria": "Assistant de création de règle",
  "ruleWizard.bubbleHeadAlways": "[Créer une règle · Toujours]",
  "ruleWizard.bubbleHeadGlob": "[Créer une règle · Glob]",
  "ruleWizard.bubbleHeadManual": "[Créer une règle · Manuel @]",
  "ruleWizard.confirm": "Continuer",
  "ruleWizard.desc":
    "Choisissez comment la règle est injectée ; l'envoi bascule vers Agent afin que l'assistant puisse créer/mettre à jour les fichiers `.mdc` sous `.mai/rules/` lorsqu'un espace de travail est ouvert.",
  "ruleWizard.glob": "Motif glob du chemin",
  "ruleWizard.globHint":
    "Injecter lorsque les chemins @ correspondent au motif glob",
  "ruleWizard.globLine": "Glob : {{pattern}}",
  "ruleWizard.globPattern": "Motif glob (relatif à l'espace de travail)",
  "ruleWizard.manual": "Déclencheur manuel @",
  "ruleWizard.manualHint":
    "Injecter uniquement lorsque le message mentionne @rule :",
  "ruleWizard.title": "Portée de la règle",
  "settings.addModel": "Ajouter un modèle",
  "settings.addModelToProvider": "Ajouter un modèle",
  "settings.addProvider": "Ajouter un fournisseur",
  "settings.anthropicBase": "Anthropic · URL de base (facultatif)",
  "settings.anthropicKey": "Anthropic · Clé API",
  "settings.anthropicKeyHint":
    "Clé API Anthropic : pour les modèles Anthropic.",
  "settings.apiKeys": "Clés API",
  "settings.appearance.accent": "Accent",
  "settings.appearance.ariaGroup": "Mode couleur",
  "settings.appearance.background": "Arrière-plan",
  "settings.appearance.codeFont.jetbrains": "JetBrains Mono",
  "settings.appearance.codeFont.monospace": "Mono Système",
  "settings.appearance.codeFont.sfmono": "SF Mono",
  "settings.appearance.codeFontSize": "Taille de police du code",
  "settings.appearance.codeFontSizeDesc":
    "Ajustez la taille de base utilisée pour le code dans les chats et les diffs.",
  "settings.appearance.codeFontTitle": "Police du code",
  "settings.appearance.contrast": "Contraste",
  "settings.appearance.dark": "Sombre",
  "settings.appearance.defaultApple": "Apple System par défaut",
  "settings.appearance.defaultBadge": "Par défaut",
  "settings.appearance.editorNote":
    "Les polices de l’éditeur de code restent dans les paramètres de l’Éditeur, afin que la typographie de l’interface et celle du code restent distinctes.",
  "settings.appearance.font.apple": "Apple System",
  "settings.appearance.font.appleDesc":
    "Typographie système de style SF Pro avec variantes Apple en priorité.",
  "settings.appearance.font.inter": "Inter",
  "settings.appearance.font.interDesc":
    "Une sans-serif neutre et moderne tout en conservant les polices de secours Apple et Windows.",
  "settings.appearance.font.segoe": "Segoe UI",
  "settings.appearance.font.segoeDesc":
    "Une pile d'interface de style Windows pour les équipes qui préfèrent ce rendu.",
  "settings.appearance.fontDesc":
    "Contrôlez la typographie utilisée dans l’interface mAI Coder. Apple System est la valeur par défaut pour une interface épurée et native.",
  "settings.appearance.fontTitle": "Police de l’interface",
  "settings.appearance.foreground": "Premier plan",
  "settings.appearance.lead":
    "Utilisez une interface claire ou sombre, ou suivez le système. Les changements de thème s'animent en douceur.",
  "settings.appearance.light": "Clair",
  "settings.appearance.modeNote.dark":
    "Contraste plus profond pour le travail nocturne et la concentration.",
  "settings.appearance.modeNote.light":
    "Surfaces claires pour une utilisation diurne.",
  "settings.appearance.modeNote.system":
    "Suit automatiquement macOS ou Windows.",
  "settings.appearance.pointerCursorDesc":
    "Change le curseur en pointeur au survol des éléments interactifs.",
  "settings.appearance.pointerCursorTitle": "Utiliser les curseurs pointeur",
  "settings.appearance.preset.cursor": "Cursor",
  "settings.appearance.preset.forest": "Forêt",
  "settings.appearance.preset.graphite": "Graphite",
  "settings.appearance.preset.mai": "mAI Coder",
  "settings.appearance.preset.sunset": "Coucher de soleil",
  "settings.appearance.previewBody":
    "mAI Coder garde l'interface épurée, lisible et cohérente entre navigation, contenu et actions.",
  "settings.appearance.previewDesc":
    "Prévisualisez le rendu de la navigation, des cartes de contenu et des actions avec la police sélectionnée.",
  "settings.appearance.previewSection": "Aperçu en direct",
  "settings.appearance.previewTitle": "Concevez avec clarté",
  "settings.appearance.previewWindow": "Aperçu de l'apparence",
  "settings.appearance.resetDefaults": "Rétablir les valeurs par défaut",
  "settings.appearance.resetDefaultsTitle":
    "Restaurer la palette et le contraste intégrés pour le mode clair/sombre actuel (correspond au chrome de l’app), ainsi que les polices et tailles par défaut",
  "settings.appearance.system": "Système",
  "settings.appearance.themeDesc":
    "Choisissez le style de chrome par défaut pour l'app. L'option Système suit l'apparence de votre OS.",
  "settings.appearance.themeEditorDesc":
    "Choisissez d’abord un préréglage clair/sombre associé, puis affinez la palette active ci-dessous si nécessaire.",
  "settings.appearance.themeEditorTitle": "Palette du thème",
  "settings.appearance.themePreset": "Thème prédéfini",
  "settings.appearance.themePresetDesc":
    "Chaque préréglage inclut des couleurs claires et sombres correspondantes, et bascule automatiquement avec le mode d'apparence.",
  "settings.appearance.themeTitle": "Thème",
  "settings.appearance.translucentSidebar": "Barre latérale translucide",
  "settings.appearance.uiFontSize": "Taille de police de l'interface",
  "settings.appearance.uiFontSizeDesc":
    "Ajustez la taille de base utilisée pour l'interface mAI Coder.",
  "settings.autoRowDesc": "Premier modèle activé dans l’ordre",
  "settings.autoUpdate.allowDifferential":
    "Autoriser les mises à jour différentielles",
  "settings.autoUpdate.allowDifferentialDesc":
    "Télécharger uniquement les parties modifiées pour des mises à jour plus rapides (désactivez pour des mises à jour complètes)",
  "settings.autoUpdate.available": "Nouvelle version disponible",
  "settings.autoUpdate.checkForUpdates": "Vérifier les mises à jour",
  "settings.autoUpdate.checking": "Recherche de mises à jour…",
  "settings.autoUpdate.currentVersion": "Version actuelle",
  "settings.autoUpdate.downloaded": "Mise à jour téléchargée",
  "settings.autoUpdate.downloading": "Téléchargement de la mise à jour",
  "settings.autoUpdate.downloadNow": "Télécharger maintenant",
  "settings.autoUpdate.enableAutoUpdate": "Activer la mise à jour automatique",
  "settings.autoUpdate.enableAutoUpdateDesc":
    "Vérifier et télécharger automatiquement les mises à jour au démarrage",
  "settings.autoUpdate.error": "Erreur de mise à jour",
  "settings.autoUpdate.lastCheck":
    "Aucune vérification de mise à jour effectuée pour l’instant",
  "settings.autoUpdate.lead":
    "Gérez les mises à jour de l'app pour maintenir mAI Coder à jour",
  "settings.autoUpdate.restartNow": "Redémarrer maintenant",
  "settings.autoUpdate.title": "Mise à jour automatique",
  "settings.autoUpdate.updateStatus": "Statut de mise à jour",
  "settings.autoUpdate.upToDate": "Vous êtes à jour",
  "settings.backAria": "Retour",
  "settings.bots.action.addSkill": "+ Ajouter un skill",
  "settings.bots.action.edit": "Modifier",
  "settings.bots.action.enabled": "Activé",
  "settings.bots.action.importSkillFolder": "Importer depuis un dossier",
  "settings.bots.action.importSkillLoading": "Importation…",
  "settings.bots.action.paused": "En pause",
  "settings.bots.action.remove": "Supprimer",
  "settings.bots.action.removeSkill": "Supprimer la compétence",
  "settings.bots.action.skillDisabled": "Skill désactivé",
  "settings.bots.action.skillEnabled": "Skill activé",
  "settings.bots.action.test": "Tester la connexion",
  "settings.bots.action.testing": "Test en cours…",
  "settings.bots.card.number": "Bot n°{{count}}",
  "settings.bots.discord.requireMention":
    "Exiger des mentions dans les canaux de serveur",
  "settings.bots.empty.body":
    "Commencez depuis une carte de plateforme pour créer un bot pour une équipe ou un canal.",
  "settings.bots.empty.skills":
    "Aucune compétence exclusive configurée pour ce bot pour l'instant.",
  "settings.bots.empty.title": "Aucune intégration de bot pour l’instant",
  "settings.bots.feishu.streamingCard":
    "Utiliser les cartes en streaming (CardKit) pour l’effet machine à écrire en temps réel",
  "settings.bots.feishuAuth.active": "Autorisé · {duration} restant",
  "settings.bots.feishuAuth.activeAs":
    "Autorisé en tant que {name} · {duration} restant",
  "settings.bots.feishuAuth.button": "Autoriser le compte Feishu",
  "settings.bots.feishuAuth.buttonRunning": "En attente du navigateur…",
  "settings.bots.feishuAuth.cancel": "Annuler",
  "settings.bots.feishuAuth.disconnect": "Déconnecter",
  "settings.bots.feishuAuth.error": "Échec de l’autorisation : {message}",
  "settings.bots.feishuAuth.expired":
    "Autorisation expirée — veuillez vous ré-autoriser",
  "settings.bots.feishuAuth.hintIntro":
    "Cliquer sur Autoriser ouvre votre navigateur pour vous connecter à Feishu. Ajoutez d'abord ces URL de redirection à votre app Feishu sous Paramètres de sécurité → URL de redirection :",
  "settings.bots.feishuAuth.hintScopes":
    "Activez également les portées task:task et contact:user.base:readonly dans les permissions de l'app Feishu, sinon les outils de tâches et contacts échoueront.",
  "settings.bots.feishuAuth.none":
    "Non autorisé (outils de tâche / contact désactivés)",
  "settings.bots.field.allowedChats": "IDs de groupes/canaux autorisés",
  "settings.bots.field.allowedUsers": "IDs utilisateurs autorisés",
  "settings.bots.field.appId": "ID d'app",
  "settings.bots.field.appSecret": "App Secret",
  "settings.bots.field.appToken": "Jeton d’application",
  "settings.bots.field.botToken": "Jeton du bot",
  "settings.bots.field.defaultMode": "Mode par défaut",
  "settings.bots.field.defaultModel": "Modèle par défaut",
  "settings.bots.field.encryptKey": "Clé de chiffrement (optionnel)",
  "settings.bots.field.feishuAuth": "Autorisation utilisateur Feishu",
  "settings.bots.field.name": "Nom d'affichage",
  "settings.bots.field.platform": "Plateforme",
  "settings.bots.field.proxy": "Proxy réseau (optionnel)",
  "settings.bots.field.skillContent": "Contenu du skill",
  "settings.bots.field.skillDescription": "Résumé de la compétence",
  "settings.bots.field.skillName": "Nom du skill",
  "settings.bots.field.skillSlug": "Slug du skill",
  "settings.bots.field.systemPrompt": "Invite système supplémentaire",
  "settings.bots.field.verificationToken": "Jeton de vérification (facultatif)",
  "settings.bots.hero.kicker": "Pont de bots",
  "settings.bots.hero.subtitle":
    "Chaque bot dispose d’un modèle, d’un mode et d’une liste blanche de réponses par défaut. La configuration détaillée se fait dans la fenêtre modale.",
  "settings.bots.hero.title": "Connectez mAI Coder à des bots externes",
  "settings.bots.hint.allowedChatChannel":
    "Filtre uniquement les canaux. Les messages directs ne sont pas affectés.",
  "settings.bots.hint.allowedChatGroup":
    "Ne filtre que les chats de groupe. Les messages directs ne sont pas concernés.",
  "settings.bots.hint.allowedUsers":
    "Laissez vide pour autoriser tous les utilisateurs.",
  "settings.bots.hint.model":
    "Choisissez un modèle compatible avec les outils.",
  "settings.bots.hint.proxy":
    "URL de proxy HTTP/HTTPS pour cette plateforme. Les requêtes API et les connexions temps réel l'utiliseront ; laissez vide pour un accès direct.",
  "settings.bots.hint.skillSlug":
    "Facultatif. Les utilisateurs peuvent l’invoquer explicitement dans le chat avec `./slug`.",
  "settings.bots.importSkill.failed": "Impossible d’importer le skill.",
  "settings.bots.importSkill.invalidSkill":
    "Ce SKILL.md manque de nom, slug ou contenu importable.",
  "settings.bots.importSkill.missingSkillMd":
    "Aucun fichier SKILL.md trouvé dans le dossier sélectionné.",
  "settings.bots.modal.close": "Fermer",
  "settings.bots.modal.create": "Créer un bot",
  "settings.bots.modal.createCta": "Créer un bot",
  "settings.bots.modal.edit": "Modifier le bot",
  "settings.bots.modal.saveCta": "Enregistrer les modifications",
  "settings.bots.option.notSet": "Non défini",
  "settings.bots.overview.groups": "Portée des groupes",
  "settings.bots.overview.prompt": "Prompt du pont",
  "settings.bots.overview.skills": "Skills exclusifs",
  "settings.bots.overview.users": "Liste blanche d’utilisateurs",
  "settings.bots.placeholder.allowedChatChannel": "Exemple : IDs de canaux",
  "settings.bots.placeholder.allowedChatGroup":
    "Exemple : ids de groupes de discussion",
  "settings.bots.placeholder.allowedUsers":
    "Exemple : identifiants utilisateur de cette plateforme",
  "settings.bots.placeholder.name": "Exemple : Bot d’incidents",
  "settings.bots.placeholder.proxy": "Exemple : http://127.0.0.1:7890",
  "settings.bots.placeholder.skillContent":
    "Décrivez les étapes, contraintes, format de sortie et limites…",
  "settings.bots.placeholder.skillDescription":
    "Description en une ligne de ce que gère ce skill",
  "settings.bots.placeholder.skillName":
    "Exemple : skill Opérations #{{index}}",
  "settings.bots.placeholder.skillSlug": "Exemple : ops-helper",
  "settings.bots.placeholder.systemPrompt":
    "Exemple : décomposez les requêtes en étapes avant run_async_task.",
  "settings.bots.platform.discord.addHint":
    "Idéal pour les communautés et les projets open source.",
  "settings.bots.platform.discord.description":
    "Idéal pour les canaux communautaires et la collaboration.",
  "settings.bots.platform.discord.label": "Discord",
  "settings.bots.platform.discord.tip":
    "Activez les intents de message dans le portail développeur.",
  "settings.bots.platform.feishu.addHint":
    "Idéal pour les équipes internes et les groupes de projet.",
  "settings.bots.platform.feishu.description":
    "Idéal pour la collaboration interne et les Q&R de groupe.",
  "settings.bots.platform.feishu.label": "Feishu",
  "settings.bots.platform.feishu.tip":
    "Assurez-vous que l'ID d'app / Secret sont correctement configurés.",
  "settings.bots.platform.slack.addHint":
    "Idéal pour la collaboration d’équipe.",
  "settings.bots.platform.slack.description":
    "Idéal pour les canaux d’équipe et les fils.",
  "settings.bots.platform.slack.label": "Slack",
  "settings.bots.platform.slack.tip":
    "Nécessite à la fois un Bot Token et un App Token.",
  "settings.bots.platform.telegram.addHint":
    "Idéal pour les groupes de développeurs et les assistants personnels.",
  "settings.bots.platform.telegram.description":
    "Idéal pour les chats directs et les groupes.",
  "settings.bots.platform.telegram.label": "Telegram",
  "settings.bots.platform.telegram.tip":
    "Définissez la politique de réponse en groupe pour éviter les déclenchements accidentels.",
  "settings.bots.quickStart.copy":
    "Choisissez une plateforme, puis finalisez les identifiants et les listes d’autorisation dans la fenêtre modale.",
  "settings.bots.quickStart.kicker": "Démarrage rapide",
  "settings.bots.quickStart.title": "Créer par plateforme",
  "settings.bots.section.basics.copy":
    "Définissez la plateforme, le modèle par défaut et le mode par défaut.",
  "settings.bots.section.basics.kicker": "Exécution",
  "settings.bots.section.basics.title": "Informations générales",
  "settings.bots.section.connection.title": "Connexion à la plateforme",
  "settings.bots.section.persona.copy":
    "N'affecte que le comportement du pont, comme le ton et les contraintes.",
  "settings.bots.section.persona.kicker": "Persona",
  "settings.bots.section.persona.title": "Invite de pont",
  "settings.bots.section.reply.copy":
    "Limitez les discussions de groupe et les utilisateurs auxquels ce bot peut répondre. Laissez vide pour tout autoriser.",
  "settings.bots.section.reply.kicker": "Portée de réponse",
  "settings.bots.section.reply.title": "Listes d’autorisation de réponse",
  "settings.bots.section.skills.copy":
    "Ces skills sont injectés uniquement dans ce bot à l’exécution et n’affectent pas les autres bots.",
  "settings.bots.section.skills.kicker": "Skills du bot",
  "settings.bots.section.skills.title": "Compétences exclusives au bot",
  "settings.bots.stats.configured": "Configuré",
  "settings.bots.stats.enabled": "Activé",
  "settings.bots.stats.groups": "Cibles de groupe",
  "settings.bots.stats.users": "Liste blanche d'utilisateurs",
  "settings.bots.summary.groupsAll": "Aucun filtre de groupe",
  "settings.bots.summary.groupsScoped": "{{count}} cibles groupe/canal",
  "settings.bots.summary.promptCustom": "Invite supplémentaire configurée",
  "settings.bots.summary.promptDefault": "Prompt du pont par défaut",
  "settings.bots.summary.skillsConfigured": "{{count}} skills exclusifs",
  "settings.bots.summary.skillsEmpty": "Aucun skill exclusif",
  "settings.bots.summary.usersAll": "Aucun filtre utilisateur",
  "settings.bots.summary.usersScoped":
    "{{count}} utilisateurs en liste blanche",
  "settings.bots.switch.hint":
    "Contrôle si l’écouteur de ce bot est en cours d’exécution",
  "settings.bots.switch.off": "En pause",
  "settings.bots.switch.on": "Activé",
  "settings.bots.telegram.policy.desc":
    "Choisissez comment les réponses sont déclenchées en groupes.",
  "settings.bots.telegram.policy.direct":
    "Autoriser les réponses directes aux groupes",
  "settings.bots.telegram.policy.directHint":
    "Plus proactif, mais plus bruyant",
  "settings.bots.telegram.policy.mentionOnly": "Mention uniquement",
  "settings.bots.telegram.policy.mentionOnlyHint":
    "Recommandé, moins de déclenchements accidentels",
  "settings.bots.telegram.policy.title": "Politique de réponse aux groupes",
  "settings.bots.test.failure": "Échec de la connexion",
  "settings.bots.test.running": "Test de connectivité en cours",
  "settings.bots.test.runningHint":
    "Vérification des identifiants, du réseau et des points d'entrée de la plateforme…",
  "settings.bots.test.success": "Connexion OK",
  "settings.bots.test.unavailable":
    "L’IPC de bureau est indisponible dans cette fenêtre.",
  "settings.browser.fingerprintAudioSeed": "Graine de bruit audio",
  "settings.browser.fingerprintAvailHint":
    "Soustrait de la hauteur d'écran pour availHeight ; la valeur par défaut du script est 40.",
  "settings.browser.fingerprintAvailOffset":
    "Décalage de hauteur disponible (px)",
  "settings.browser.fingerprintBadge": "{{count}} actif(s)",
  "settings.browser.fingerprintBadgeTitle":
    "Nombre de champs d'empreinte actuellement surchargés",
  "settings.browser.fingerprintCanvasSeed": "Graine de bruit Canvas",
  "settings.browser.fingerprintCardSubtitle":
    "Ne remplace que ce que vous renseignez ; le reste conserve les valeurs réelles de Chromium. Injecté à chaque navigation de niveau supérieur (navigator, screen, WebGL, Canvas, WebRTC, etc.).",
  "settings.browser.fingerprintCardTitle": "Usurpation d’empreinte",
  "settings.browser.fingerprintClear": "Effacer toutes les surcharges",
  "settings.browser.fingerprintCollapse":
    "Réduire les paramètres d'usurpation d'empreinte",
  "settings.browser.fingerprintColorDepth": "Profondeur de couleur (bits)",
  "settings.browser.fingerprintDpr": "Ratio de pixels de l’appareil",
  "settings.browser.fingerprintEdit": "Modifier",
  "settings.browser.fingerprintExpand":
    "Développer les paramètres d'usurpation d'empreinte",
  "settings.browser.fingerprintGroupIdentity": "Identité et langue",
  "settings.browser.fingerprintGroupNoise": "Bruit canvas et audio",
  "settings.browser.fingerprintGroupPrivacy": "WebRTC et automatisation",
  "settings.browser.fingerprintGroupScreen": "Écran & ratio de pixels",
  "settings.browser.fingerprintGroupTime": "Fuseau horaire",
  "settings.browser.fingerprintGroupWebgl":
    "Fournisseur / moteur de rendu WebGL",
  "settings.browser.fingerprintHardware": "Cœurs CPU logiques",
  "settings.browser.fingerprintHeight": "Hauteur (px)",
  "settings.browser.fingerprintLanguages":
    "Langues (séparées par des virgules)",
  "settings.browser.fingerprintMaskWebdriverBody":
    "Activé par défaut lorsque l’usurpation est active. Désactivez pour conserver le vrai flag webdriver tandis que les autres surcharges restent appliquées.",
  "settings.browser.fingerprintMaskWebdriverTitle":
    "Masquer navigator.webdriver",
  "settings.browser.fingerprintMemory": "Mémoire de l'appareil (Go)",
  "settings.browser.fingerprintModalResetDefault":
    "Rétablir les valeurs par défaut",
  "settings.browser.fingerprintModalSave": "Enregistrer",
  "settings.browser.fingerprintModalTitle": "Usurpation d'empreinte",
  "settings.browser.fingerprintPlatform": "Plateforme",
  "settings.browser.fingerprintPlatformDefault": "Par défaut (réel)",
  "settings.browser.fingerprintPlatformHelp":
    "Gardez ceci cohérent avec votre User-Agent pour que le profil paraisse cohérent.",
  "settings.browser.fingerprintPresetClear":
    "Réinitialiser aux valeurs par défaut du navigateur",
  "settings.browser.fingerprintPresetClearHint":
    "Efface tous les champs usurpés ; la page voit les valeurs réelles.",
  "settings.browser.fingerprintPresetGroup": "Préréglages rapides",
  "settings.browser.fingerprintPresetHelp":
    "Appliquez un profil d’appareil cohérent en un clic. Vous pouvez toujours ajuster les champs individuels ci-dessous.",
  "settings.browser.fingerprintTimezone": "Fuseau horaire IANA",
  "settings.browser.fingerprintTzOffset": "getTimezoneOffset() (minutes)",
  "settings.browser.fingerprintWebglRenderer": "UNMASKED_RENDERER_WEBGL",
  "settings.browser.fingerprintWebglVendor": "UNMASKED_VENDOR_WEBGL",
  "settings.browser.fingerprintWebrtc": "WebRTC",
  "settings.browser.fingerprintWebrtcBlock": "Bloquer le WebRTC en page",
  "settings.browser.fingerprintWebrtcDefault": "Laisser inchangé",
  "settings.browser.fingerprintWidth": "Largeur (px)",
  "settings.browser.lead":
    "Les modifications du proxy, des en-têtes, du User-Agent, de l'usurpation d'empreinte facultative et des options associées s'enregistrent automatiquement après une courte pause et s'appliquent au navigateur intégré (les onglets s'actualisent dans la barre latérale et la fenêtre détachée). Les formats invalides ou les règles de proxy personnalisées vides affichent une erreur jusqu'à correction.",
  "settings.browser.saving": "Enregistrement…",
  "settings.codexLogin": "Connexion Codex",
  "settings.codexLoginCancel": "Annuler la connexion",
  "settings.codexLoginCancelled": "La connexion Codex a été annulée.",
  "settings.codexLoginFailed": "Échec de la connexion Codex.",
  "settings.codexLoginRunning": "Connexion en cours…",
  "settings.codexLoginSuccess":
    "Connexion Codex terminée. Le fournisseur Codex a été ajouté ou mis à jour.",
  "settings.codexLoginSuccessWithAccount":
    "Connexion Codex réussie. Le fournisseur Codex a été ajouté ou mis à jour (compte {{accountId}}).",
  "settings.codexLoginTimedOut":
    "La connexion Codex ne s'est pas terminée, mAI Coder a donc cessé d'attendre. Cliquez sur Connexion Codex pour réessayer.",
  "settings.codexLoginUnavailable":
    "La connexion Codex est indisponible dans cette fenêtre.",
  "settings.comingCategory": "Cette section n’est pas encore disponible.",
  "settings.contextWindowTokens": "Fenêtre de contexte (jetons d'entrée)",
  "settings.contextWindowTokensHint":
    "Facultatif. Détermine le seuil de compaction à l'envoi. Si vide, utilise le cache /v1/models compatible OpenAI, les heuristiques ou la valeur par défaut de 200k.",
  "settings.customApiKey": "Clé API",
  "settings.customApiKeyPh": "Uniquement pour ce modèle",
  "settings.customBaseUrl": "URL de base (facultatif)",
  "settings.customOff": "Utiliser les clés globales",
  "settings.customOn": "Point de terminaison personnalisé activé",
  "settings.defaultChat": "Par défaut",
  "settings.dialogAria": "Paramètres",
  "settings.disabled": "Désactivé",
  "settings.discovering": "Recherche en cours…",
  "settings.discoverModels": "Détecter les modèles",
  "settings.discoverModelsEmpty":
    "Aucun modèle n’a été renvoyé par ce fournisseur.",
  "settings.discoverModelsFailed": "Échec de la découverte des modèles.",
  "settings.discoverModelsImported":
    "{{addedCount}} nouveau(x) modèle(s) importé(s) ; les doublons ont été ignorés automatiquement.",
  "settings.discoverModelsNoNew":
    "{{totalCount}} modèle(s) découvert(s) ; tout est déjà listé ci-dessous.",
  "settings.discoverModelsRunning": "Découverte en cours…",
  "settings.discoverModelsUnavailable":
    "La découverte de modèles est indisponible dans cette fenêtre.",
  "settings.displayName": "Nom d’affichage",
  "settings.displayNamePh": "ex. GPT-4o",
  "settings.enabled": "Activé",
  "settings.geminiKey": "Google Gemini · Clé API",
  "settings.geminiKeyHint": "Clé API Google AI Studio / Gemini.",
  "settings.general.identityAnthropicMetadata":
    "Joindre les métadonnées Anthropic",
  "settings.general.identityAnthropicMetadataDesc":
    "Ajoute une charge utile user_id JSON aux requêtes Anthropic Messages avec client_app, entrypoint, version et session_id.",
  "settings.general.identityAppHeader": "Valeur x-app",
  "settings.general.identityClientApp": "valeur x-client-app",
  "settings.general.identityClientAppHint":
    "Si une passerelle rejette les en-têtes inconnus, désactivez « Joindre les en-têtes HTTP » ou remplacez ces valeurs par celles attendues par votre passerelle.",
  "settings.general.identityEnabled":
    "Activer les signaux d'identité du fournisseur",
  "settings.general.identityEnabledDesc":
    "Contrôle ensemble le User-Agent, les en-têtes de requête supplémentaires, les métadonnées Anthropic et le préfixe d’invite système. Si une passerelle stricte rejette les en-têtes personnalisés, désactivez d’abord ceci et réactivez les éléments progressivement.",
  "settings.general.identityEntrypoint": "Jeton d’entrée",
  "settings.general.identityEntrypointHint":
    "Utilisé dans le User-Agent et les métadonnées Anthropic. Par défaut à `desktop`.",
  "settings.general.identityHttpHeaders": "Joindre les en-têtes HTTP",
  "settings.general.identityHttpHeadersDesc":
    "Ajoute les en-têtes User-Agent, x-app, x-client-app et associés aux requêtes compatibles OpenAI et Anthropic. Le SDK Gemini n’expose actuellement pas ces en-têtes personnalisés.",
  "settings.general.identityLead":
    "Choisissez un préréglage d’identité pour les requêtes. Vous pouvez utiliser le profil par défaut mAI Coder, passer à un profil fidèle à la source Claude Code, ou choisir Personnalisé lorsque vous souhaitez modifier vous-même les valeurs exactes.",
  "settings.general.identityPreset": "Préréglage d'identité",
  "settings.general.identityPreset.antigravity": "Antigravity",
  "settings.general.identityPreset.claudeCode": "Claude Code",
  "settings.general.identityPreset.codex": "Codex CLI",
  "settings.general.identityPreset.custom": "Personnalisé",
  "settings.general.identityPreset.mai": "Par défaut mAI Coder",
  "settings.general.identityPresetAntigravityHint":
    "Correspond à CLIProxyAPI Antigravity : User-Agent antigravity/1.21.9 darwin/arm64, avec le style d’invite système de l’agent Antigravity.",
  "settings.general.identityPresetAsyncHint":
    "Utilise les valeurs par défaut mAI Coder : le User-Agent style mAI Coder, X-Mai-Session-Id, les métadonnées mAI Coder et le préfixe d’invite système mAI Coder.",
  "settings.general.identityPresetClaudeCodeHint":
    "Bascule vers un style Claude Code de bout en bout : User-Agent claude-cli/<version> (external, cli), x-app=cli, X-Claude-Code-Session-Id, le préfixe d'invite système Claude Code et des métadonnées Anthropic au format Claude Code.",
  "settings.general.identityPresetCodexHint":
    "Correspond à CLIProxyAPI Codex TUI : User-Agent codex-tui/0.118.0 (Mac OS 26.3.1; arm64) iTerm.app/3.6.9 (codex-tui; 0.118.0), plus Originator: codex-tui.",
  "settings.general.identityPresetHint":
    "Le préréglage contrôle comment le User-Agent, les en-têtes de requête, les métadonnées Anthropic et le préfixe d’invite système sont générés ensemble.",
  "settings.general.identityPreview": "Aperçu",
  "settings.general.identityPreviewHint":
    "Voici les formats de signaux dérivés pour la config actuelle. `<version>` et `<runtime-session-id>` sont remplacés par les valeurs réelles à l'exécution lors des requêtes.",
  "settings.general.identitySessionHeader": "Joindre l'en-tête de session",
  "settings.general.identitySessionHeaderDesc":
    "Ajoute un en-tête d’identifiant de session d’exécution stable afin que les fournisseurs puissent distinguer cette session de bureau des autres.",
  "settings.general.identitySystemPrompt":
    "Joindre le préfixe d’invite système",
  "settings.general.identitySystemPromptDesc":
    "Permet au modèle de savoir qu'il s'exécute dans mAI Coder. Cela fonctionne généralement même lorsque les fournisseurs suppriment les en-têtes HTTP personnalisés.",
  "settings.general.identitySystemPromptText": "Préfixe du prompt système",
  "settings.general.identitySystemPromptTextHint":
    "Par défaut, indique au modèle qu’il s’exécute dans mAI Coder. Vous pouvez le réécrire pour correspondre à votre propre positionnement produit.",
  "settings.general.identityTitle": "Identité du fournisseur de modèles",
  "settings.general.identityUserAgentProduct": "Jeton produit User-Agent",
  "settings.general.identityUserAgentProductHint":
    "Rendu comme `produit/version (entrypoint, client-app/...)` ; la valeur par défaut suit le même schéma de nommage que Claude Code, adapté pour mAI Coder.",
  "settings.general.lead1": "Les options générales se trouveront ici. Pour ",
  "settings.general.lead2": ", ouvrez ",
  "settings.general.lead3":
    " — Ajustez vos préférences personnelles et votre environnement de travail.",
  "settings.general.leadBold1":
    "Clés API, liste des modèles et modèle par défaut",
  "settings.general.leadBold2": "Configuration globale",
  "settings.indexing.lead":
    "Inspectez la couche mémoire du projet et gérez les fichiers que mAI Coder utilise pour stocker les connaissances durables du projet sous `.mai/memory/`.",
  "settings.indexing.memoryAgentDesc":
    "L’agent et les sous-agents peuvent rappeler les entrées mémoire pertinentes pendant un tour, et l’extraction en arrière-plan met à jour les fichiers mémoire après les réponses de l’assistant.",
  "settings.indexing.memoryAgentTitle": "Comment c’est utilisé",
  "settings.indexing.memoryDir": "Répertoire mémoire",
  "settings.indexing.memoryEntrypoint": "Index du point d'entrée",
  "settings.indexing.memoryIndexEntries": "Entrées d’index",
  "settings.indexing.memoryLayoutDesc":
    "La mémoire du projet se trouve sous `.mai/memory/`. Gardez `MEMORY.md` court et faites des liens vers des fichiers thématiques au lieu de tout déverser dans un seul fichier.",
  "settings.indexing.memoryLayoutTitle": "Disposition du stockage",
  "settings.indexing.memoryLead":
    "mAI Coder utilise désormais une mémoire basée sur fichiers pour les connaissances durables du projet. `MEMORY.md` est l'index, et les fichiers thématiques individuels contiennent les notes réelles.",
  "settings.indexing.memoryStatsHint":
    "Affiché uniquement pour l’espace de travail actuel. Les fichiers mémoire sont exclus de l’index de code normal.",
  "settings.indexing.memoryStatsTitle": "État de la mémoire du projet",
  "settings.indexing.memoryTitle": "Mémoire du projet",
  "settings.indexing.memoryTopicFiles": "Fichiers thématiques",
  "settings.indexing.noWorkspace":
    "Aucun espace de travail ouvert — pas de statistiques.",
  "settings.indexing.openMemoryDir": "Afficher le dossier mémoire",
  "settings.indexing.openMemoryEntrypoint": "Afficher MEMORY.md",
  "settings.indexing.rebuilding": "Traitement en cours…",
  "settings.indexing.rebuildMemory": "Reconstruire MEMORY.md",
  "settings.indexing.refreshMemoryStats": "Actualiser l’état de la mémoire",
  "settings.indexing.statsLoading": "Chargement…",
  "settings.indexing.statsUnavailable":
    "Impossible de charger les statistiques.",
  "settings.inPicker": "Sélecteur",
  "settings.language": "Langue de l'interface",
  "settings.languageFr": "Français",
  "settings.languageHint":
    "L'application est disponible en français uniquement.",
  "settings.maxOutputTokens": "Jetons de sortie max",
  "settings.maxOutputTokensHint":
    "Plafond par complétion ; par défaut 16384 — réduisez si votre passerelle impose un max plus petit (ex. 8192).",
  "settings.modelAdvanced": "Avancé",
  "settings.modelCatalog": "Modèles",
  "settings.modelSearchPlaceholder":
    "Filtrer par fournisseur, nom ou paradigme",
  "settings.modelsGlobalCredsLead":
    "Utilisé lorsqu’un modèle n’active pas « URL de base et clé API personnalisées ». Le proxy HTTP s’applique uniquement aux appels compatibles OpenAI.",
  "settings.modelsGlobalCredsTitle": "Valeurs globales par défaut",
  "settings.modelsHint":
    "Ajoutez d'abord un fournisseur (URL de base, clé API et proxy HTTP pour OpenAI-compatible). Placez chaque modèle partageant cette connexion sous le même fournisseur. Les modèles ne nécessitent que le nom d'affichage, le nom de requête et le plafond de sortie facultatif.",
  "settings.modelsInProvider": "Modèles de ce fournisseur",
  "settings.modelsProviderLead":
    "Supprimer un fournisseur supprime tous ses modèles.",
  "settings.nav.agents": "Agents",
  "settings.nav.appearance": "Apparence",
  "settings.nav.autoUpdate": "Mises à jour",
  "settings.nav.beta": "Bêta",
  "settings.nav.bots": "Bots",
  "settings.nav.browser": "Navigateur",
  "settings.nav.cloud": "Agents Cloud",
  "settings.nav.dev": "Dév",
  "settings.nav.editor": "Éditeur",
  "settings.nav.general": "Général",
  "settings.nav.hooks": "Hooks",
  "settings.nav.indexing": "Indexation du code",
  "settings.nav.mai": "Compte mAI",
  "settings.nav.models": "Modèles",
  "settings.nav.network": "Réseau",
  "settings.nav.plan": "Mode Plan",
  "settings.nav.plugins": "Plugins",
  "settings.nav.rules": "Règles",
  "settings.nav.tab": "Onglet",
  "settings.nav.team": "Mode Équipe",
  "settings.nav.tools": "Outils & Permissions",
  "settings.navAria": "Catégories de paramètres",
  "settings.oauthLogin.antigravity": "Connexion Antigravity",
  "settings.oauthLogin.claude": "Connexion Claude Code",
  "settings.oauthLogin.codex": "Connexion Codex",
  "settings.oauthLoginCancel": "Annuler la connexion",
  "settings.oauthLoginCancelled": "{{provider}} a été annulé.",
  "settings.oauthLoginFailed": "{{provider}} a échoué.",
  "settings.oauthLoginModelsImported":
    "{{count}} modèle(s) disponible(s) importé(s) automatiquement.",
  "settings.oauthLoginSuccess":
    "{{provider}} terminé. Le fournisseur de modèles a été ajouté.",
  "settings.oauthLoginSuccessWithDetail":
    "{{provider}} terminé. Le fournisseur de modèles a été ajouté ({{detail}}).",
  "settings.oauthLoginTimedOut":
    "{{provider}} n'a pas abouti, mAI Coder a donc cessé d'attendre. Cliquez sur connexion pour réessayer.",
  "settings.oauthLoginUnavailable":
    "{{provider}} est indisponible dans cette fenêtre.",
  "settings.oauthUsage.antigravityCredits":
    "Crédits Google One AI : {{amount}}",
  "settings.oauthUsage.antigravityMinimum":
    "Seuil minimal utilisable {{minimum}}",
  "settings.oauthUsage.antigravityUnknown":
    "Antigravity n'a renvoyé aucune utilisation restante affichable.",
  "settings.oauthUsage.codexPlan":
    "Forfait ChatGPT : {{plan}}. Codex n'expose pas de quota restant affichable.",
  "settings.oauthUsage.codexUnknown":
    "Codex n’a pas exposé de quota restant affichable. Les modèles sont importés depuis le catalogue CLIProxyAPI Codex.",
  "settings.oauthUsage.remainingTitle": "Utilisation restante du compte",
  "settings.oauthUsage.tier": "Niveau {{tier}}",
  "settings.oauthUsage.updated": "Mis à jour {{time}}",
  "settings.openaiBase": "Compatible OpenAI · URL de base (facultatif)",
  "settings.openaiKey": "Compatible OpenAI · Clé API",
  "settings.openaiKeyHint":
    "Clé API OpenAI : pour les modèles compatibles OpenAI ; URL de base personnalisée facultative.",
  "settings.paradigm.anthropic": "Anthropic",
  "settings.paradigm.gemini": "Google Gemini",
  "settings.paradigm.openai-compatible": "Compatible OpenAI",
  "settings.paradigmAria": "Paradigme de requête",
  "settings.placeholder.anthropicBase": "https://api.anthropic.com",
  "settings.placeholder.openaiBase": "https://api.openai.com/v1",
  "settings.plugins.addMarketplace": "Ajouter une place de marché",
  "settings.plugins.chooseUserDirectory": "Changer de répertoire",
  "settings.plugins.confirmRemoveMarketplace":
    "Supprimer la place de marché « {{name}} » ?",
  "settings.plugins.confirmUninstallPlugin":
    "Désinstaller le plugin « {{name}} » ?",
  "settings.plugins.disable": "Désactiver",
  "settings.plugins.disabled": "Désactivé",
  "settings.plugins.emptySource":
    "Saisissez d’abord une source de place de marché.",
  "settings.plugins.enable": "Activer",
  "settings.plugins.enabled": "Activé",
  "settings.plugins.examplesLabel": "Exemples",
  "settings.plugins.install": "Installer",
  "settings.plugins.installedDesc":
    "Cette section affiche les plugins découverts à la fois dans les répertoires de plugins au niveau utilisateur et au niveau projet.",
  "settings.plugins.installedEmpty":
    "Aucun plugin n'est actuellement installé.",
  "settings.plugins.installedInScope": "Installé",
  "settings.plugins.installedSourceKind.local": "Local",
  "settings.plugins.installedSourceKind.marketplace": "Place de marché",
  "settings.plugins.installedTitle": "Plugins installés",
  "settings.plugins.installScope": "Installer dans",
  "settings.plugins.lead":
    "Gérez visuellement les places de marché de plugins, parcourez les plugins installables et installez-les dans le répertoire de plugins au niveau utilisateur ou au niveau du projet actuel. Les plugins installés peuvent également être activés, désactivés ou supprimés ici.",
  "settings.plugins.loadFailed": "Échec du chargement des données du plugin.",
  "settings.plugins.marketplaceAdded": "Place de marché ajoutée.",
  "settings.plugins.marketplaceRefreshed": "Place de marché actualisée.",
  "settings.plugins.marketplaceRefreshedAll":
    "Toutes les places de marché distantes ont été actualisées.",
  "settings.plugins.marketplaceRemoved": "Marketplace supprimée.",
  "settings.plugins.marketplacesDesc":
    "Vous pouvez ajouter un fichier marketplace.json local, un répertoire, un dépôt Git, un raccourci GitHub ou une URL directe vers marketplace.json.",
  "settings.plugins.marketplacesEmpty":
    "Aucune place de marché n'a encore été configurée.",
  "settings.plugins.marketplacesTitle": "Places de marché de plugins",
  "settings.plugins.noDescription": "Aucune description fournie.",
  "settings.plugins.noRefreshableMarketplaces":
    "Aucune place de marché distante actualisable pour l'instant.",
  "settings.plugins.operationFailed": "Échec de l'opération du plugin.",
  "settings.plugins.pluginCount": "{{count}} plugins",
  "settings.plugins.pluginDisabled": "Plugin désactivé.",
  "settings.plugins.pluginEnabled": "Plugin activé.",
  "settings.plugins.pluginInstalled": "Plugin installé.",
  "settings.plugins.pluginSourceKind.git": "Dépôt Git",
  "settings.plugins.pluginSourceKind.git-subdir": "Sous-répertoire Git",
  "settings.plugins.pluginSourceKind.github": "Dépôt GitHub",
  "settings.plugins.pluginSourceKind.npm": "Paquet NPM",
  "settings.plugins.pluginSourceKind.pip": "Paquet PyPI",
  "settings.plugins.pluginSourceKind.relative": "Chemin relatif",
  "settings.plugins.pluginSourceKind.unknown": "Source inconnue",
  "settings.plugins.pluginSourceKind.url": "URL Git",
  "settings.plugins.pluginsEmpty":
    "Cette marketplace ne contient aucun plugin visible pour l’instant.",
  "settings.plugins.pluginUninstalled": "Plugin désinstallé.",
  "settings.plugins.projectScope": "Projet",
  "settings.plugins.projectScopeUnavailable":
    "Ouvrez un espace de travail pour utiliser la portée projet.",
  "settings.plugins.refresh": "Actualiser",
  "settings.plugins.refreshAll": "Tout actualiser",
  "settings.plugins.remove": "Supprimer",
  "settings.plugins.resetUserDirectory": "Réinitialiser par défaut",
  "settings.plugins.reveal": "Révéler",
  "settings.plugins.runtimeCommands": "{{count}} commandes",
  "settings.plugins.runtimeMcp": "{{count}} MCP",
  "settings.plugins.runtimeReadyDesc":
    "Disponible immédiatement dans le chat et Outils & MCP.",
  "settings.plugins.runtimeSkillInvokeLabel": "Invoquer dans le chat avec :",
  "settings.plugins.runtimeSkills": "{{count}} skills",
  "settings.plugins.scopeShort.project": "Projet",
  "settings.plugins.scopeShort.user": "Utilisateur",
  "settings.plugins.searchLabel": "Rechercher des plugins",
  "settings.plugins.searchPlaceholder":
    "Rechercher par nom, catégorie, tag ou marketplace",
  "settings.plugins.shellUnavailable":
    "La gestion des places de marché de plugins est indisponible dans l'environnement actuel.",
  "settings.plugins.sourceKind.directory": "Répertoire",
  "settings.plugins.sourceKind.file": "Fichier",
  "settings.plugins.sourceKind.git": "Git",
  "settings.plugins.sourceKind.github": "GitHub",
  "settings.plugins.sourceKind.url": "URL",
  "settings.plugins.sourceLabel": "Source de la place de marché",
  "settings.plugins.sourcePlaceholder":
    "Exemple : owner/repo, https://..., ./marketplace",
  "settings.plugins.uninstall": "Désinstaller",
  "settings.plugins.userDirectoryCustom": "Répertoire personnalisé",
  "settings.plugins.userDirectoryCustomDesc":
    "Vous avez basculé vers un répertoire de plugins personnalisé au niveau utilisateur. Les nouvelles installations et analyses utilisateur utiliseront cet emplacement.",
  "settings.plugins.userDirectoryDefault": "Répertoire par défaut",
  "settings.plugins.userDirectoryDefaultDesc":
    "mAI Coder utilise par défaut le dossier plugins sous son répertoire de données d'application.",
  "settings.plugins.userDirectoryReset":
    "Répertoire des plugins utilisateur réinitialisé par défaut.",
  "settings.plugins.userDirectoryUpdated":
    "Répertoire de plugins utilisateur mis à jour.",
  "settings.plugins.userScope": "Utilisateur",
  "settings.providerApiKey": "Clé API (API Key)",
  "settings.providerApiKeyPh": "Le format dépend du type d'API",
  "settings.providerBaseUrl": "URL de base (Base URL)",
  "settings.providerGroup.antigravity": "Connexion Antigravity",
  "settings.providerGroup.claude": "Connexion Claude",
  "settings.providerGroup.codex": "Connexion Codex (ChatGPT)",
  "settings.providerGroup.manual": "Fournisseurs manuels & API",
  "settings.providerGroupCount": "{{count}} élément(s)",
  "settings.providerIdentity": "Identité du fournisseur de modèles",
  "settings.providerIdentityInherit": "Suivre le global",
  "settings.providerIdentityInheritHint":
    "Utiliser le paramètre d'identité fournisseur global de Général.",
  "settings.providerIdentityOverrideHint":
    "Remplacer les en-têtes de requête et le préfixe du prompt système uniquement pour ce fournisseur.",
  "settings.providerName": "Nom du fournisseur",
  "settings.providerNamePh": "ex. Passerelle d’entreprise, OpenRouter…",
  "settings.providerUntitled": "Sans titre",
  "settings.proxy": "Proxy HTTP (optionnel)",
  "settings.proxyHint": "Proxy HTTP (requêtes compatibles OpenAI uniquement).",
  "settings.removeModel": "Supprimer",
  "settings.removeProvider": "Supprimer le fournisseur",
  "settings.requestName": "Nom de requête (API)",
  "settings.requestNamePh": "ex. gpt-4o",
  "settings.requestParadigm": "Paradigme",
  "settings.resizeSidebarAria":
    "Redimensionner la barre latérale des paramètres",
  "settings.resizeSidebarTitle":
    "Faites glisser pour redimensionner ; double-cliquez pour réinitialiser la largeur",
  "settings.searchAria": "Rechercher",
  "settings.searchProviderModels": "Rechercher les modèles du fournisseur",
  "settings.searchProviderModelsClose": "Fermer",
  "settings.searchProviderModelsConfirm": "Tout importer",
  "settings.searchProviderModelsDuplicateLabel": "Doublons filtrés",
  "settings.searchProviderModelsFiltered":
    "{{duplicateCount}} modèle(s) existant(s) sera/seront filtré(s) automatiquement.",
  "settings.searchProviderModelsFoundLabel": "Trouvé(s)",
  "settings.searchProviderModelsImportableLabel": "Prêt à importer",
  "settings.searchProviderModelsImportReady":
    "{{addedCount}} nouveau(x) modèle(s) peuvent être importés maintenant.",
  "settings.searchProviderModelsNothingNew":
    "Tout ce qui a été trouvé est déjà dans votre liste actuelle.",
  "settings.searchProviderModelsRunning": "Recherche…",
  "settings.searchProviderModelsSummary":
    "{{totalCount}} modèle(s) trouvé(s) chez {{providerName}}.",
  "settings.searchProviderModelsTitle": "Recherche de modèles fournisseur",
  "settings.setDefault": "Définir par défaut",
  "settings.team.activePreset": "Préréglage actif",
  "settings.team.activeSource": "Source active",
  "settings.team.addRole": "Ajouter un rôle",
  "settings.team.applyPresetRoles": "Appliquer les rôles prédéfinis",
  "settings.team.assignmentKey": "Clé d’affectation",
  "settings.team.availableRoles": "Rôles disponibles",
  "settings.team.builtinEffectiveModel": "Effectif : {{model}}",
  "settings.team.builtinEffectiveModelLabel": "Modèle effectif",
  "settings.team.builtinGlobalModel": "Modèle global",
  "settings.team.builtinGlobalModelHint":
    "Si non défini, l’équipe intégrée suit le modèle sélectionné pour le chat actuel.",
  "settings.team.builtinInheritCount": "{{count}} rôles héritent encore",
  "settings.team.builtinLeaderFallback":
    "L'équipe intégrée est orchestrée par un chef qui décide quels spécialistes doivent être activés pour la requête en cours.",
  "settings.team.builtinLeaderHint":
    "L’équipe intégrée est orchestrée par {leader}, qui décide quels spécialistes de cette liste doivent être activés pour la requête en cours.",
  "settings.team.builtinLoadError":
    "Échec du chargement de l’effectif intégré : {error}",
  "settings.team.builtinLoading": "Chargement de l'équipe intégrée…",
  "settings.team.builtinModelInheritGlobal":
    "Utiliser le modèle global ({{model}})",
  "settings.team.builtinModelInheritSession": "Suivre le modèle du chat actuel",
  "settings.team.builtinModelSource.global": "Hériter du modèle global",
  "settings.team.builtinModelSource.override": "Surcharge spécifique au rôle",
  "settings.team.builtinModelSource.session":
    "Hériter du modèle du chat actuel",
  "settings.team.builtinModelsTitle": "Modèles de l’équipe intégrée",
  "settings.team.builtinOverrideCount": "{{count}} surcharges de rôle",
  "settings.team.builtinPath": "Chemin du dépôt intégré",
  "settings.team.builtinPolicyLead":
    "Définissez un modèle par défaut unique pour toute l'équipe intégrée, puis remplacez uniquement les rôles nécessitant une valeur différente.",
  "settings.team.builtinPolicyTitle": "Héritage de modèle",
  "settings.team.builtinRoleModel": "Surcharge de rôle",
  "settings.team.builtinRoleModelHint":
    "Si une surcharge de rôle est vide, elle retombe sur le modèle global, puis sur le modèle de discussion actuel.",
  "settings.team.builtinRoleModelIssue": "Modèle de rôle intégré ({{role}})",
  "settings.team.builtinRoleOverridesLead":
    "Le chef décide toujours qui est activé. Ces paramètres déterminent seulement quel modèle un rôle utilise s’il est activé.",
  "settings.team.builtinRoleOverridesTitle": "Surcharges de rôle",
  "settings.team.builtinRosterTitle": "Effectif intégré",
  "settings.team.customReviewerToggle": "Configuration personnalisée",
  "settings.team.customRoles": "Rôles personnalisés",
  "settings.team.deliveryReviewer": "Relecteur de livraison",
  "settings.team.deliveryReviewerHint":
    "Utilisé pour la revue finale après que les spécialistes ont terminé.",
  "settings.team.empty": "Aucun rôle d'équipe personnalisé pour l'instant.",
  "settings.team.enabled": "Activé",
  "settings.team.enablePreflightReview":
    "Activer l’évaluation préliminaire du réviseur",
  "settings.team.inputPlaceholder": "Saisissez votre décision…",
  "settings.team.lead":
    "Définissez les rôles spécialistes de l'Équipe pour le mode Équipe.",
  "settings.team.maxParallel": "Experts parallèles max",
  "settings.team.model": "ID de modèle préféré (optionnel)",
  "settings.team.planReviewer": "Relecteur du plan",
  "settings.team.planReviewerHint":
    "Utilisé pour la revue préliminaire avant l'exécution des spécialistes.",
  "settings.team.preset.design.description":
    "Idéal pour l’UX, la direction visuelle, les design systems et le travail de conception d’interaction.",
  "settings.team.preset.design.title": "Équipe design",
  "settings.team.preset.engineering.description":
    "Idéal pour les workflows d'implémentation, d'intégration, de test et de revue de code.",
  "settings.team.preset.engineering.title": "Équipe d'ingénierie",
  "settings.team.preset.planning.description":
    "Idéal pour la recherche, la définition du périmètre, la rédaction de PRD et la planification de feuille de route.",
  "settings.team.preset.planning.title": "Équipe planification",
  "settings.team.prompt": "Invite système",
  "settings.team.removeRole": "Supprimer le rôle",
  "settings.team.requirePlanApproval":
    "Exiger l’approbation de l’utilisateur avant exécution",
  "settings.team.restoreDefaults": "Restaurer les rôles par défaut",
  "settings.team.reviewerFallbackHint":
    "Utilise le rôle de relecteur partagé lorsqu'il est laissé désactivé.",
  "settings.team.reviewersTitle": "Rôles de revue",
  "settings.team.role.backend": "Backend",
  "settings.team.role.custom": "Personnalisé",
  "settings.team.role.frontend": "Frontend",
  "settings.team.role.qa": "QA",
  "settings.team.role.reviewer": "Réviseur",
  "settings.team.role.team_lead": "Chef d’équipe",
  "settings.team.roleName": "Nom du rôle",
  "settings.team.roleType": "Type de rôle",
  "settings.team.source.builtin": "Équipe intégrée",
  "settings.team.source.builtin.description":
    "Source par défaut. Charge l’effectif complet agency-agents et laisse le leader décider qui activer pour chaque requête.",
  "settings.team.source.custom": "Équipe personnalisée utilisateur",
  "settings.team.source.custom.description":
    "Gérez vous-même chaque rôle, prompt, modèle et autorisation d'outil.",
  "settings.team.sourcesLead":
    "Le mode Équipe ne comporte désormais que deux sources : l’équipe intégrée charge la liste complète des agents d’agence, tandis que l’équipe personnalisée est entièrement gérée par vous.",
  "settings.team.sourcesTitle": "Sources d’équipe",
  "settings.team.submitInput": "Envoyer la décision",
  "settings.team.templatesLead":
    "Partez d'un préréglage d'équipe prêt à l'emploi, puis affinez le modèle, les outils et le prompt de chaque rôle.",
  "settings.team.templatesTitle": "Modèles d’équipe",
  "settings.team.toolsCsv": "Outils autorisés (séparés par des virgules)",
  "settings.team.untitledRole": "Rôle sans titre",
  "settings.team.useDefaults": "Inclure l'équipe par défaut intégrée",
  "settings.temperature": "Valeur de température",
  "settings.temperatureCustomHint":
    "Généralement 0 à 2. Si un modèle ou une passerelle n’accepte que 1, définissez ce champ à 1.",
  "settings.temperatureMode": "Température",
  "settings.temperatureModeAuto": "Auto",
  "settings.temperatureModeCustom": "Personnalisé",
  "settings.temperatureModeHint":
    "Auto utilise les valeurs par défaut intégrées et les règles de compatibilité. Personnalisé envoie toujours la valeur que vous saisissez.",
  "settings.title": "Paramètres",
  "settings.title.agents": "Exécution et sécurité",
  "settings.title.appearance": "Apparence",
  "settings.title.autoUpdate": "Mise à jour automatique",
  "settings.title.bots": "Bots",
  "settings.title.browser": "Navigateur intégré",
  "settings.title.comingSoon": "Bientôt disponible",
  "settings.title.editor": "Éditeur",
  "settings.title.general": "Général",
  "settings.title.indexing": "Mémoire du projet",
  "settings.title.mcp": "Serveurs MCP",
  "settings.title.models": "Modèles",
  "settings.title.plugins": "Plugins",
  "settings.title.rules": "Règles, Skills, Sous-agents",
  "settings.title.team": "Équipe",
  "settings.title.tools": "Outils et MCP",
  "settings.title.usage": "Statistiques et utilisation",
  "settings.usage.agentLinesSubtitle":
    "Compte les lignes ajoutées + supprimées issues des écritures d'outils de l'Agent et des correctifs appliqués manuellement (style diff unifié).",
  "settings.usage.agentLinesTitle": "Lignes modifiées par l'Agent",
  "settings.usage.chartByModel": "Par modèle",
  "settings.usage.cumulative": "Cumulé",
  "settings.usage.currentStreak": "Série en cours",
  "settings.usage.dataDirLabel": "Dossier de données",
  "settings.usage.dataFileHint":
    "Fichier de données : usage-stats.json dans le dossier que vous choisissez.",
  "settings.usage.disabledState":
    "Les statistiques sont désactivées. Activez-les et choisissez un dossier pour enregistrer et afficher les graphiques.",
  "settings.usage.enableToggle": "Activer les statistiques et l'utilisation",
  "settings.usage.exportCsv": "Exporter en CSV",
  "settings.usage.fewer": "Moins",
  "settings.usage.lead":
    "Les statistiques sont désactivées par défaut. Une fois activées, choisissez un dossier local ; nous y écrivons usage-stats.json. Les données sont globales et partagées entre les espaces de travail.",
  "settings.usage.longestStreak": "Plus longue série",
  "settings.usage.metricTokens": "Jetons",
  "settings.usage.mode.agent": "Agent",
  "settings.usage.mode.ask": "Demander",
  "settings.usage.mode.debug": "Débogage",
  "settings.usage.mode.plan": "Plan",
  "settings.usage.mode.team": "Équipe",
  "settings.usage.more": "Plus",
  "settings.usage.mostActiveDay": "Jour le plus actif",
  "settings.usage.mostActiveMonth": "Mois le plus actif",
  "settings.usage.needDirectory":
    "Les statistiques sont activées, mais aucun dossier n’est défini. Choisissez un dossier pour enregistrer les données.",
  "settings.usage.nextPage": "Suivant",
  "settings.usage.none": "—",
  "settings.usage.noShell":
    "Impossible de joindre le processus de l'app ; les statistiques d'utilisation sont indisponibles.",
  "settings.usage.otherModels": "Autre",
  "settings.usage.period1d": "1j",
  "settings.usage.period7d": "7j",
  "settings.usage.period30d": "30j",
  "settings.usage.pickDataDir": "Choisir le dossier de données…",
  "settings.usage.prevPage": "Précédent",
  "settings.usage.reload": "Actualiser",
  "settings.usage.selectDirBeforeEnable":
    "Choisissez d'abord un dossier de données, puis activez les statistiques.",
  "settings.usage.streakDays": "{{n}} j",
  "settings.usage.tableDate": "Date",
  "settings.usage.tableInput": "Entrée",
  "settings.usage.tableMode": "Mode",
  "settings.usage.tableModel": "Modèle",
  "settings.usage.tableOutput": "Sortie",
  "settings.usage.tablePageRange": "{{from}}–{{to}} sur {{total}}",
  "settings.usage.tablePagerAria": "Pages du tableau d'utilisation des jetons",
  "settings.usage.tableTokens": "Jetons",
  "settings.usage.todayMark": "Aujourd’hui",
  "settings.usage.tokensSubtitle":
    "Utilisation par tour au cours des 30 derniers jours (agrégée par modèle) ; les lignes plus anciennes sont élaguées automatiquement.",
  "settings.usage.tokensTitle": "Utilisation des jetons par modèle",
  "settings.usage.totalLineEdits": "Total des lignes modifiées",
  "settings.useCustomConnection": "URL de base et clé API personnalisées",
  "settings.useCustomConnectionHint":
    "Lorsque désactivé, ce modèle utilise la clé/base globale pour son paradigme.",
  "skillCreator.bubbleHeadAll": "[Créer une compétence · Tous les projets]",
  "skillCreator.bubbleHeadProject": "[Créer un skill · Ce projet]",
  "skillCreator.scopeAllHint":
    "Skills globaux dans les paramètres mAI Coder, disponibles dans chaque espace de travail.",
  "skillCreator.scopeAllProjects": "Tous les projets (niveau utilisateur)",
  "skillCreator.scopeAria": "Choisir la portée de stockage de la compétence",
  "skillCreator.scopeDesc":
    "Après avoir continué, l’application passe en mode Agent ; avec un espace de travail ouvert, l’assistant doit écrire SKILL.md (etc.) via les outils — pas seulement coller dans le chat.",
  "skillCreator.scopeProjectHint":
    "Espace de travail uniquement, ex. `.mai/skills/<slug>/SKILL.md`.",
  "skillCreator.scopeProjectNeedWs":
    "Ouvrez d'abord un dossier d'espace de travail",
  "skillCreator.scopeThisProject": "Ce projet",
  "skillCreator.scopeTitle": "Où ce skill doit-il résider…",
  "skillCreator.sendErrorNoWs":
    "Aucun espace de travail n’est ouvert ; vous ne pouvez pas utiliser la portée « Ce projet ».",
  "skillInvoke.menuAria": "Skills appelables",
  "skillInvoke.noMatch": "Aucune compétence correspondante",
  "slashCmd.createRuleDesc":
    "Créer une Règle : après le choix de la portée, passe en mode Agent pour que l’assistant écrive `.mai/rules/*.mdc` (pas seulement un collage dans le chat).",
  "slashCmd.createSkillDesc":
    "Créer un Skill : sélecteur de portée, puis mode Agent — privilégiez l’écriture de `.mai/skills/.../SKILL.md` avec les outils.",
  "slashCmd.createSubagentDesc":
    "Créer un Sous-agent : choisissez la portée, puis mode Agent — préférez mettre à jour `.mai/agent.json` (etc.) avec les outils, avec mémoire persistante facultative.",
  "slashCmd.helpBuiltin": "Intégré",
  "slashCmd.helpEmpty": "Aucune commande",
  "slashCmd.helpPlugin": "Plugin",
  "slashCmd.helpTitle": "Commandes slash",
  "slashCmd.helpUser": "Personnalisé",
  "slashCmd.menuAria": "Commandes slash",
  "slashCmd.noMatch": "Aucune commande correspondante",
  "subagentWizard.bubbleHeadAll": "[Créer un Sous-agent · Tous les projets]",
  "subagentWizard.bubbleHeadProject": "[Créer un sous-agent · Ce projet]",
  "subagentWizard.scopeAllHint":
    "Sous-agents globaux dans les paramètres mAI Coder.",
  "subagentWizard.scopeAllProjects": "Tous les projets (niveau utilisateur)",
  "subagentWizard.scopeAria": "Choisir la portée de stockage du sous-agent",
  "subagentWizard.scopeDesc":
    "Après avoir continué, l'app bascule vers Agent ; avec un espace de travail ouvert, l'assistant doit persister la config du sous-agent via les outils — pas seulement la coller dans le chat. Il peut aussi ajouter une portée mémoire persistante facultative.",
  "subagentWizard.scopeProjectHint":
    "Paramètres d’agent du projet de l’espace de travail uniquement.",
  "subagentWizard.scopeProjectNeedWs":
    "Ouvrez d’abord un dossier d’espace de travail",
  "subagentWizard.scopeThisProject": "Ce projet",
  "subagentWizard.scopeTitle": "Où ce sous-agent doit-il vivre…",
  "subagentWizard.sendErrorNoWs":
    "Aucun espace de travail n’est ouvert ; vous ne pouvez pas utiliser la portée « Ce projet ».",
  "team.phase.cancelled": "Annulé",
  "team.phase.delivering": "Livraison en cours",
  "team.phase.executing": "Exécution",
  "team.phase.planning": "Planification",
  "team.phase.preflight": "Pré-vol",
  "team.phase.proposing": "En attente d'approbation",
  "team.phase.researching": "Recherche",
  "team.phase.reviewing": "Révision",
  "team.phase.synthesizing": "Synthèse en cours",
  "team.plan.approve": "Approuver et exécuter",
  "team.plan.approveBlocked": "Clarification nécessaire d'abord",
  "team.plan.approveDisabledReason":
    "L’approbation est désactivée car le réviseur a indiqué que la requête est trop ambiguë pour être exécutée en toute sécurité.",
  "team.plan.aria": "Revue du plan d’équipe",
  "team.plan.decisionApproved": "Approuvé — répartition aux spécialistes",
  "team.plan.decisionRejected": "Annulé",
  "team.plan.feedbackLabel": "Retour (facultatif)",
  "team.plan.feedbackPlaceholder":
    "Vous souhaitez rediriger ou ajouter des contraintes ? Laissez une note à l’équipe.",
  "team.plan.label": "En attente d'approbation du plan",
  "team.plan.needsClarificationHint":
    "Le réviseur a signalé un périmètre ou des contraintes manquants. Clarifiez la requête avant que les spécialistes ne s'exécutent.",
  "team.plan.preflightHeading": "Notes du réviseur",
  "team.plan.preflightNeedsClarification":
    "Relecteur : clarification nécessaire",
  "team.plan.preflightOk": "Relecteur : exigence claire",
  "team.plan.reject": "Annuler",
  "team.plan.rejectForClarification": "Retour pour clarification",
  "team.plan.revisionCounts":
    "Ajoutés {added}, conservés {kept}, supprimés {removed}",
  "team.plan.revisionDelta": "Diff de révision",
  "team.plan.revisionLabel": "Plan révisé",
  "team.plan.revisionReason": "Pourquoi le plan a changé",
  "team.plan.tasks": "Tâches spécialisées ({{count}})",
  "team.sendMissingRoleModels":
    "Avant d'envoyer en mode Équipe, configurez ces modèles d'abord : {{roles}}. Allez dans Paramètres → Équipe pour les définir.",
  "team.taskProgress": "{{done}} / {{total}} tâches terminées",
  "team.timeline.acceptanceCriteria": "Critères d'acceptation",
  "team.timeline.assignedTask": "Tâche assignée",
  "team.timeline.dependencies": "Dépendances",
  "team.timeline.kickoffFallback":
    "Cette requête nécessite un travail coordonné. Je la décompose et assigne dès maintenant les bons spécialistes.",
  "team.timeline.leadLabel": "Chef d'équipe",
  "team.timeline.noAcceptanceCriteria": "Aucun fourni",
  "team.timeline.noDependencies": "Aucune",
  "team.timeline.originalRequest": "Requête initiale",
  "team.timeline.pendingTrace":
    "{{name}} n'a pas encore démarré. Sa trace d'exécution complète apparaîtra ici une fois démarré.",
  "team.timeline.planSummary": "Résumé du plan du chef",
  "team.timeline.preparing": "Préparation de l’équipe…",
  "team.timeline.requestPacket": "Paquet de tâches",
  "team.timeline.reviewFocus": "Focus de revue",
  "team.timeline.reviewLabel": "Révision",
  "team.timeline.role.reviewer": "Relecteur",
  "team.timeline.role.specialist": "Spécialiste",
  "team.timeline.rolesLabel": "Rôles assignés",
  "team.timeline.status.completed": "Terminé",
  "team.timeline.status.failed": "Échoué",
  "team.timeline.status.in_progress": "En cours",
  "team.timeline.status.pending": "En attente",
  "team.timeline.status.revision": "Nécessite une révision",
  "thinking.badge.high": "Pensée élevée",
  "thinking.badge.low": "Pensée faible",
  "thinking.badge.max": "Max",
  "thinking.badge.medium": "Pensée moyenne",
  "thinking.badge.off": "Pensée désactivée",
  "thinking.badgeTitle": "Niveau de réflexion du modèle",
  "thinking.collapsePanel": "Retour à la liste des modèles",
  "thinking.effort.high": "Élevé",
  "thinking.effort.low": "Faible",
  "thinking.effort.max": "Max",
  "thinking.effort.medium": "Moyen",
  "thinking.panelAria": "Options du modèle et de réflexion",
  "thinking.panelHint":
    "Réflexion étendue : Anthropic utilise un budget de réflexion ; compatible OpenAI utilise reasoning_effort. Les modèles/passerelles non pris en charge peuvent ignorer. Gemini peut ne pas s’appliquer.",
  "thinking.section.effort": "Effort",
  "thinking.section.options": "Options",
  "thinking.toggleLabel": "Réflexion",
  "thought.detail.done":
    "{{modeHint}}\n\nAttente du premier jeton ~{{sec}}s. Un raisonnement plus riche peut apparaître ici si la passerelle le prend en charge.{{total}}",
  "thought.detail.streaming":
    "{{modeHint}}\n\nLe modèle diffuse en continu ; le temps ci-dessus correspond au délai jusqu’au premier jeton.",
  "thought.detail.thinking":
    "{{modeHint}}\n\nEn attente du premier jeton (les API Chat standard ne diffusent pas de « chaîne de pensée » séparée ; le temps ci-dessous est la latence pré-jeton).",
  "thought.for": "Réflexion pendant {{sec}}s",
  "thought.mode.agent":
    "Mode Agent : étapes actionnables et modifications de fichiers.",
  "thought.mode.ask":
    "Mode Demande : explications et analyse en lecture seule.",
  "thought.mode.debug": "Mode débogage : cause racine et correctifs minimaux.",
  "thought.mode.plan": "Mode Plan : plans structurés et risques.",
  "thought.thinking": "Réflexion…",
  "thought.totalBlock": "\n\nTemps total de génération ~{{sec}}s.",
  "time.daysAgo": "il y a {{count}}j",
  "time.hoursAgo": "il y a {{count}}h",
  "time.justNow": "À l’instant",
  "time.minutesAgo": "{{count}} min",
  "time.monthsAgo": "il y a {{count}} mois",
  "time.yearsAgo": "il y a {{count}}a",
  "usage.tokens": "↑{{input}} ↓{{output}} jetons",
  "usage.tokensShort": "{{input}}↑ {{output}}↓",
  "usage.totalTokens": "Total session : ↑{{input}} ↓{{output}}",
  "ws.asyncCloud": "mAI Cloud",
  "ws.connectSsh": "Connecter SSH",
  "ws.empty": "Aucun résultat. Utilisez « Ouvrir un dossier » ci-dessous.",
  "ws.filterPlaceholder": "Filtrer les dossiers ou choisir ci-dessous…",
  "ws.home": "Accueil",
  "ws.needDesktop": "Utilisez l’application de bureau Electron",
  "ws.openFailed": "Impossible d’ouvrir le dossier",
  "ws.openFolder": "Ouvrir le dossier",
  "ws.recents": "Récents",
  "ws.recentsAria": "Espaces de travail récents",
  "ws.runOn": "Exécuter sur",
  "ws.thisPc": "Ce PC",
  "ws.title": "Ouvrir un espace de travail",
};
