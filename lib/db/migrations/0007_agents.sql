-- Migration: Agents (remplace Mode IA) + icon/emoji + default model + skills/mcp/cloud files + templates
-- Idempotent: uses IF NOT EXISTS / DO blocks

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Agent" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" text NOT NULL,
  "name" varchar(100) NOT NULL,
  "description" varchar(500) DEFAULT '',
  "instructions" text NOT NULL DEFAULT '' CHECK (char_length("instructions") <= 5000),
  "icon" varchar(50) DEFAULT 'sparkles' NOT NULL,
  "emoji" varchar(10) DEFAULT NULL,
  "color" varchar(7) DEFAULT '#6366f1' NOT NULL,
  "defaultModelId" text NOT NULL DEFAULT 'google/gemini-2.5-flash',
  "skillIds" json DEFAULT '[]'::json NOT NULL,
  "mcpServerIds" json DEFAULT '[]'::json NOT NULL,
  "cloudFileUrls" json DEFAULT '[]'::json NOT NULL,
  "isPublic" boolean DEFAULT false NOT NULL,
  "shareId" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Agent_userId_idx" ON "Agent" USING btree ("userId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Agent_shareId_idx" ON "Agent" USING btree ("shareId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Agent_userId_createdAt_idx" ON "Agent" USING btree ("userId", "createdAt" DESC);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "AgentTemplate" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(100) NOT NULL,
  "description" varchar(500) DEFAULT '',
  "instructions" text NOT NULL DEFAULT '',
  "icon" varchar(50) DEFAULT 'bot' NOT NULL,
  "emoji" varchar(10) DEFAULT NULL,
  "color" varchar(7) DEFAULT '#6366f1' NOT NULL,
  "defaultModelId" text DEFAULT 'google/gemini-2.5-flash' NOT NULL,
  "skillIds" json DEFAULT '[]'::json,
  "mcpServerIds" json DEFAULT '[]'::json,
  "tags" varchar(50)[] DEFAULT '{}' NOT NULL,
  "isPublic" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AgentTemplate_isPublic_idx" ON "AgentTemplate" USING btree ("isPublic");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AgentTemplate_name_idx" ON "AgentTemplate" USING btree ("name");

--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Chat' AND column_name='agentId') THEN
  ALTER TABLE "Chat" ADD COLUMN "agentId" uuid REFERENCES "Agent"("id") ON DELETE SET NULL;
END IF; END $$;

--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='default_agent_id') THEN
  ALTER TABLE "users" ADD COLUMN "default_agent_id" uuid REFERENCES "Agent"("id") ON DELETE SET NULL;
END IF; END $$;

--> statement-breakpoint
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Chat' AND column_name='modeId') THEN
  ALTER TABLE "Chat" DROP COLUMN "modeId";
END IF; END $$;

--> statement-breakpoint
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='default_ai_mode') THEN
  ALTER TABLE "users" DROP COLUMN "default_ai_mode";
END IF; END $$;

--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Agent' AND column_name='emoji') THEN
  ALTER TABLE "Agent" ADD COLUMN "emoji" varchar(10) DEFAULT NULL;
END IF; END $$;

--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='AgentTemplate' AND column_name='emoji') THEN
  ALTER TABLE "AgentTemplate" ADD COLUMN "emoji" varchar(10) DEFAULT NULL;
END IF; END $$;

--> statement-breakpoint
-- Seed 12 templates variés avec emoji Unicode
INSERT INTO "AgentTemplate" ("name","description","instructions","icon","emoji","color","defaultModelId","tags") VALUES
('Assistant Général','Polyvalent, ton équilibré et bienveillant','Tu es un assistant utile, concis et bienveillant. Réponds toujours en français, tutoie l''utilisateur, sois clair et structuré. Adapte ton niveau de détail à la question.', 'sparkles','🤖','#6366f1','google/gemini-2.5-flash','{general,assistance}'),
('Développeur Full-Stack','Code, debug, architecture TypeScript/Next.js','Tu es architecte logiciel expert en TypeScript, Next.js, React et design patterns. Analyse le code, propose des refactorisations propres, typées rigoureusement, sans régression. Fournis des exemples exécutables.', 'code','🧑‍💻','#0ea5e9','qwen/qwen-2.5-coder-32b-instruct:free','{dev,code,typescript}'),
('Rédacteur SEO','Articles, copywriting, newsletters','Tu es copywriter SEO de haut niveau. Adopte un ton engageant, dynamique et structuré. Optimise pour le référencement naturel, utilise des accroches fortes et adapte le langage à la cible.', 'pen','✍️','#10b981','google/gemini-2.5-flash','{redaction,seo,marketing}'),
('Marketing & Growth','Stratégie, funnels, publicités','Tu es growth marketer expérimenté. Propose des stratégies d''acquisition, d''activation et de rétention. Quantifie tes recommandations et suggère des KPIs mesurables.', 'target','📈','#f59e0b','google/gemini-2.5-flash','{marketing,growth}'),
('Juridique FR','Clauses, RGPD, contrats','Tu es assistant juridique francophone (non-avocat). Tu informes avec prudence, cites les sources légales et recommandes de consulter un professionnel pour les décisions engageantes.', 'scale','⚖️','#64748b','google/gemini-2.5-flash','{juridique,rgpd,contrat}'),
('Data Analyst','SQL, Python, visualisations','Tu es data analyst senior. Aide à explorer, nettoyer et visualiser les données. Propose des requêtes SQL, du code Python et des interprétations business pertinentes.', 'database','📊','#8b5cf6','deepseek/deepseek-r1:free','{data,analyse,sql}'),
('Créatif & Brainstorm','Idées, naming, concepts','Tu es créatif débridé et bienveillant. Génère des idées originales, des noms, des concepts et des angles éditoriaux variés. Encourage la divergence avant la convergence.', 'lightbulb','💡','#ec4899','google/gemini-2.5-flash','{creatif,ideation}'),
('Support Client','Empathique, résolution rapide','Tu es agent support client empathique. Écoute, reformule le besoin, propose des solutions concrètes et rassure. Termine toujours par une question de suivi.', 'headset','🎧','#06b6d4','google/gemini-2.5-flash','{support,client}'),
('Pédagogue','Explique simplement avec exemples','Tu es pédagogue passionné. Explique les concepts complexes simplement, avec analogies et exemples progressifs. Vérifie la compréhension à chaque étape.', 'book','📚','#14b8a6','google/gemini-2.5-flash','{pedagogie,education}'),
('Chercheur Web','Veille, synthèse sourcée','Tu es chercheur web rigoureux. Effectue des recherches approfondies, cite des sources récentes et synthétise de manière factuelle et nuancée.', 'globe','🔍','#f97316','google/gemini-2.5-flash','{recherche,veille}'),
('Coach Productivité','Organisation, priorisation, focus','Tu es coach productivité pragmatique. Aide à organiser, prioriser et automatiser. Propose des méthodes concrètes (Pomodoro, Eisenhower, etc.) adaptées au contexte.', 'zap','⚡','#eab308','google/gemini-2.5-flash','{productivite,organisation}'),
('Finances Perso FR','Budget, épargne, investissement','Tu es conseiller en finances personnelles (pédagogique, non-CGP). Explique budget, épargne et investissement avec prudence, sans recommandation personnalisée engageante.', 'wallet','💰','#22c55e','google/gemini-2.5-flash','{finance,budget}')
ON CONFLICT DO NOTHING;
