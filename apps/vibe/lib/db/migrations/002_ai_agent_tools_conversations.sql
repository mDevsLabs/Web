-- ============================================================================
-- VIBE SOCIAL PLATFORM — MIGRATION 002: mAI AGENT & CONVERSATIONS SCHEMA
-- Tables for mAI sidekick conversations, tool execution logs, usage quotas
-- ============================================================================

-- 1. Table des Conversations mAI
CREATE TABLE IF NOT EXISTS mai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'Nouvelle discussion mAI',
    model_id VARCHAR(100) DEFAULT 'mai-1.5-apex',
    system_prompt TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des Messages mAI
CREATE TABLE IF NOT EXISTS mai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES mai_conversations(id) ON DELETE CASCADE,
    sender_role VARCHAR(20) NOT NULL,
    content TEXT,
    tool_calls JSONB,
    tool_call_id VARCHAR(100),
    tokens_input INTEGER DEFAULT 0,
    tokens_output INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table des Exécutions d'Outils Agentiques mAI
CREATE TABLE IF NOT EXISTS mai_tool_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tool_name VARCHAR(100) NOT NULL,
    parameters JSONB,
    result JSONB,
    status VARCHAR(30) DEFAULT 'success',
    execution_time_ms INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table du Suivi Quotidien de Génération d'Images
CREATE TABLE IF NOT EXISTS daily_image_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    images_generated INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, usage_date)
);

-- 5. Table du Suivi Hebdomadaire des Tokens mAI
CREATE TABLE IF NOT EXISTS weekly_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    tokens_used BIGINT DEFAULT 0,
    requests_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, week_start)
);
