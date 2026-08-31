-- Migration data : descriptions des templates d'agents réécrites pour décrire
-- ce que l'agent fait concrètement et quand le choisir (et non plus sa configuration).
-- Idempotente par nature (UPDATE par nom).

UPDATE "AgentTemplate" SET "description" = 'Répond à toutes les questions du quotidien : rédaction, synthèses, explications, traductions. À choisir par défaut pour un ton clair et bienveillant sur tout sujet.' WHERE "name" = 'Assistant Général';
--> statement-breakpoint
UPDATE "AgentTemplate" SET "description" = 'Écrit, corrige et refactorise du code TypeScript/Next.js : debug, architecture, revues et exemples exécutables. À choisir pour tout travail technique sur un projet web.' WHERE "name" = 'Développeur Full-Stack';
--> statement-breakpoint
UPDATE "AgentTemplate" SET "description" = 'Rédige des articles optimisés pour le référencement, des newsletters et du copywriting avec accroches fortes. À choisir pour publier du contenu qui se positionne sur Google.' WHERE "name" = 'Rédacteur SEO';
--> statement-breakpoint
UPDATE "AgentTemplate" SET "description" = 'Construit des stratégies d''acquisition, des tunnels de conversion et des campagnes, avec KPIs mesurables. À choisir pour lancer ou développer un produit.' WHERE "name" = 'Marketing & Growth';
--> statement-breakpoint
UPDATE "AgentTemplate" SET "description" = 'Explique le droit français (contrats, RGPD, clauses) avec sources légales et prudence. À choisir pour comprendre un cadre juridique avant de consulter un professionnel.' WHERE "name" = 'Juridique FR';
--> statement-breakpoint
UPDATE "AgentTemplate" SET "description" = 'Explore, nettoie et visualise vos données : requêtes SQL, scripts Python et interprétations business. À choisir pour transformer un jeu de données en décisions.' WHERE "name" = 'Data Analyst';
--> statement-breakpoint
UPDATE "AgentTemplate" SET "description" = 'Génère des idées originales, des noms, des concepts et des angles éditoriaux en grande quantité. À choisir pour lever un blocage créatif ou lancer un projet.' WHERE "name" = 'Créatif & Brainstorm';
--> statement-breakpoint
UPDATE "AgentTemplate" SET "description" = 'Répond aux clients avec empathie : reformule le besoin, propose une solution concrète et rassure. À choisir pour rédiger des réponses SAV efficaces.' WHERE "name" = 'Support Client';
--> statement-breakpoint
UPDATE "AgentTemplate" SET "description" = 'Explique des concepts complexes simplement, avec analogies et exemples progressifs. À choisir pour apprendre ou faire apprendre, pas à pas.' WHERE "name" = 'Pédagogue';
--> statement-breakpoint
UPDATE "AgentTemplate" SET "description" = 'Effectue des recherches approfondies, croise les sources récentes et synthétise de façon factuelle et nuancée. À choisir pour la veille et les études documentées.' WHERE "name" = 'Chercheur Web';
--> statement-breakpoint
UPDATE "AgentTemplate" SET "description" = 'Aide à organiser, prioriser et automatiser avec des méthodes concrètes (Pomodoro, Eisenhower…). À choisir pour structurer vos journées et vos projets.' WHERE "name" = 'Coach Productivité';
--> statement-breakpoint
UPDATE "AgentTemplate" SET "description" = 'Explique budget, épargne et investissement de façon pédagogique, sans recommandation personnalisée engageante. À choisir pour y voir clair dans vos finances.' WHERE "name" = 'Finances Perso FR';
