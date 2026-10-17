/**
 * Script de migration adapté à la VRAIE structure de la base Neon
 * Basé sur l'audit du 2026-09-02 :
 *   - usage_logs.user_id est UUID (pas INTEGER)
 *   - weekly_usage existe sans updated_at
 *   - user_settings manque 5 colonnes
 *   - users et profiles manquent is_verified
 */
import { neon } from '@neondatabase/serverless';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function readOptionalEnvFile(path) {
  if (!existsSync(path)) return {};

  const vars = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const eq = line.indexOf('=');
    if (eq < 0 || line.trim().startsWith('#')) continue;

    const key = line.slice(0, eq).trim();
    if (!key) continue;

    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

const fileEnv = readOptionalEnvFile(join(__dirname, '..', '.env'));
const env = { ...fileEnv, ...process.env };
const databaseUrl = env.DATABASE_URL?.trim();

if (!databaseUrl) {
  console.error(
    '❌ DATABASE_URL est requis. Définissez-la dans l’environnement (par exemple DATABASE_URL=... npm run migrate:ci).'
  );
  process.exit(1);
}

const sql = neon(databaseUrl);

async function runAlter(name, query) {
  try {
    await sql.query(query);
    console.log(`  ✅ ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`  ❌ ${name} — ERREUR: ${message}`);
    throw new Error(`Migration en échec (${name}) : ${message}`, { cause: error });
  }
}

async function migrate() {
  console.log('\n🚀 MIGRATION RÉELLE — Basée sur audit de la base Neon\n');
  console.log('═'.repeat(60));

  // ─────────────────────────────────────────────────────────────
  // 1. users — Ajouter is_verified
  // ─────────────────────────────────────────────────────────────
  console.log('\n👤 TABLE users:');
  await runAlter(
    'users.is_verified',
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE`
  );

  // ─────────────────────────────────────────────────────────────
  // 2. profiles — Ajouter is_verified
  // ─────────────────────────────────────────────────────────────
  console.log('\n📸 TABLE profiles:');
  await runAlter(
    'profiles.is_verified',
    `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE`
  );
  await runAlter(
    'profiles.updated_at',
    `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`
  );
  await runAlter(
    'profiles.display_name_nullable',
    `ALTER TABLE profiles ALTER COLUMN display_name DROP NOT NULL`
  );

  // ─────────────────────────────────────────────────────────────
  // 3. user_settings — Ajouter les 5 colonnes manquantes
  // ─────────────────────────────────────────────────────────────
  console.log('\n⚙️  TABLE user_settings:');
  await runAlter(
    'user_settings.feed_default_mode',
    `ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS feed_default_mode VARCHAR(32) DEFAULT 'for_you'`
  );
  await runAlter(
    'user_settings.hide_reposts',
    `ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS hide_reposts BOOLEAN DEFAULT FALSE`
  );
  await runAlter(
    'user_settings.blocked_keywords',
    `ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS blocked_keywords TEXT[] DEFAULT '{}'`
  );
  await runAlter(
    'user_settings.two_factor_auth',
    `ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS two_factor_auth BOOLEAN DEFAULT FALSE`
  );
  await runAlter(
    'user_settings.allow_mentions',
    `ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS allow_mentions VARCHAR(32) DEFAULT 'everyone'`
  );
  await runAlter(
    'user_settings.allow_dms',
    `ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS allow_dms VARCHAR(20) DEFAULT 'everyone'`
  );
  await runAlter(
    'user_settings.dms_enabled',
    `ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS dms_enabled BOOLEAN DEFAULT TRUE`
  );
  // allow_dms est la colonne canonique utilisée par le backend. Conserver
  // allow_dms_from comme source de compatibilité tant que des données l'utilisent.
  await runAlter(
    'user_settings.allow_dms_from_to_allow_dms',
    `DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'user_settings'
          AND column_name = 'allow_dms_from'
      ) THEN
        EXECUTE 'UPDATE user_settings
                 SET allow_dms = allow_dms_from
                 WHERE allow_dms = ''everyone''
                   AND allow_dms_from IS NOT NULL
                   AND allow_dms_from <> ''everyone''';
      END IF;
    END $$`
  );
  await runAlter(
    'user_settings.mai_auto_approve_tools',
    `ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS mai_auto_approve_tools BOOLEAN DEFAULT FALSE`
  );
  await runAlter(
    'user_settings.posts_ai_generated_by_default',
    `ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS posts_ai_generated_by_default BOOLEAN DEFAULT FALSE`
  );
  await runAlter(
    'user_settings.ui_language',
    `ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS ui_language TEXT`
  );
  await runAlter(
    'user_settings.hide_verified_badge',
    `ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS hide_verified_badge BOOLEAN DEFAULT FALSE`
  );

  // ─────────────────────────────────────────────────────────────
  // 4. usage_logs — Ajouter colonne endpoint (manquante selon schéma)
  // Note: user_id est UUID dans cette table (pas INTEGER) — NORMAL
  // ─────────────────────────────────────────────────────────────
  console.log('\n📊 TABLE usage_logs:');
  await runAlter(
    'usage_logs.endpoint',
    `ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS endpoint TEXT`
  );

  // ─────────────────────────────────────────────────────────────
  // 5. weekly_usage — Ajouter updated_at
  // ─────────────────────────────────────────────────────────────
  console.log('\n📈 TABLE weekly_usage:');
  await runAlter(
    'weekly_usage.updated_at',
    `ALTER TABLE weekly_usage ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`
  );

  // ─────────────────────────────────────────────────────────────
  // 6. posts — Ajouter parent_post_id et is_repost
  // ─────────────────────────────────────────────────────────────
  console.log('\n📝 TABLE posts:');
  await runAlter(
    'posts.parent_post_id',
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS parent_post_id UUID REFERENCES posts(id) ON DELETE SET NULL`
  );
  await runAlter(
    'posts.is_repost',
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_repost BOOLEAN DEFAULT FALSE`
  );
  await runAlter(
    'posts.ai_generated',
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE`
  );
  await runAlter(
    'posts.quoted_post_id',
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS quoted_post_id UUID REFERENCES posts(id) ON DELETE SET NULL`
  );
  await runAlter(
    'posts.status',
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published'`
  );
  await runAlter(
    'posts.scheduled_at',
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ`
  );
  await runAlter(
    'posts.update_null_status',
    `UPDATE posts SET status = 'published' WHERE status IS NULL`
  );
  await runAlter(
    'media_assets.comment_id',
    `ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS comment_id UUID REFERENCES comments(id) ON DELETE CASCADE`
  );

  // ─────────────────────────────────────────────────────────────
  // 7. notifications — Assurer is_read
  // ─────────────────────────────────────────────────────────────
  console.log('\n🔔 TABLE notifications:');
  await runAlter(
    'notifications.is_read',
    `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE`
  );

  // ─────────────────────────────────────────────────────────────
  // 8. direct_messages — Assurer read_at
  // ─────────────────────────────────────────────────────────────
  console.log('\n💬 TABLE direct_messages:');
  await runAlter(
    'direct_messages.read_at',
    `ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE`
  );

  // ─────────────────────────────────────────────────────────────
  // 8b. comments — Colonnes réponses imbriquées + likes
  // ─────────────────────────────────────────────────────────────
  console.log('\n💬 TABLE comments:');
  await runAlter(
    'comments.path drop not null',
    `ALTER TABLE comments ALTER COLUMN path DROP NOT NULL`
  );
  await runAlter(
    'comments.path default empty',
    `ALTER TABLE comments ALTER COLUMN path SET DEFAULT ''`
  );
  await runAlter(
    'comments.parent_comment_id',
    `ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE`
  );
  await runAlter(
    'comments.depth',
    `ALTER TABLE comments ADD COLUMN IF NOT EXISTS depth INTEGER DEFAULT 0`
  );
  await runAlter(
    'comments.likes_count',
    `ALTER TABLE comments ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0`
  );
  await runAlter(
    'comments.is_hidden',
    `ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE`
  );
  await runAlter(
    'table comment_likes',
    `CREATE TABLE IF NOT EXISTS comment_likes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id BIGINT NOT NULL,
      comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE (user_id, comment_id)
    )`
  );

  // ─────────────────────────────────────────────────────────────
  // 8d. Traductions DeepL (posts + commentaires, cf. translate.ts)
  // ─────────────────────────────────────────────────────────────
  console.log('\n🌍 TABLES TRADUCTIONS:');
  await runAlter(
    'TABLE post_translations',
    `CREATE TABLE IF NOT EXISTS post_translations (
      post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      target_lang TEXT NOT NULL,
      detected_language TEXT,
      translation TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (post_id, target_lang)
    )`
  );
  await runAlter(
    'post_translations.provider',
    `ALTER TABLE post_translations ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'mai'`
  );
  await runAlter(
    'TABLE comment_translations',
    `CREATE TABLE IF NOT EXISTS comment_translations (
      comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
      target_lang TEXT NOT NULL,
      detected_language TEXT,
      translation TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (comment_id, target_lang)
    )`
  );

  // ─────────────────────────────────────────────────────────────
  // 8c. direct_messages — Réponses + réactions DM
  // ─────────────────────────────────────────────────────────────
  await runAlter(
    'direct_messages.reply_to_id',
    `ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES direct_messages(id) ON DELETE SET NULL`
  );
  await runAlter(
    'table dm_reactions',
    `CREATE TABLE IF NOT EXISTS dm_reactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      message_id UUID NOT NULL REFERENCES direct_messages(id) ON DELETE CASCADE,
      user_id BIGINT NOT NULL,
      emoji VARCHAR(16) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE (message_id, user_id, emoji)
    )`
  );

  // ─────────────────────────────────────────────────────────────
  // 9. Compte @bot — aucun mot de passe public ; seed uniquement opt-in
  // ─────────────────────────────────────────────────────────────
  console.log('\n🤖 COMPTE @bot:');

  // Neutralise tout ancien hash public déjà présent. Le bcrypt est calculé
  // dans PostgreSQL à partir de données aléatoires jamais conservées en clair.
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
  await sql`
    UPDATE users
    SET password_hash = crypt(encode(gen_random_bytes(32), 'hex'), gen_salt('bf', 12))
    WHERE username = 'bot'
  `;
  console.log('  🔒 Connexion par mot de passe @bot neutralisée (bcrypt aléatoire)');

  const botPasswordHash = env.BOT_PASSWORD_HASH?.trim();
  if (!botPasswordHash) {
    console.log('  ⏭️  Aucun compte @bot créé : BOT_PASSWORD_HASH n’est pas défini');
  } else {
    if (!/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(botPasswordHash)) {
      throw new Error('BOT_PASSWORD_HASH doit être un hash bcrypt valide.');
    }

    const botUser = await sql`
      INSERT INTO users (username, email, password_hash, tier, avatar_url, is_verified)
      VALUES (
        'bot',
        'bot@vibe.ai',
        ${botPasswordHash},
        'Pro',
        'https://api.dicebear.com/7.x/bottts/svg?seed=vibe-bot',
        TRUE
      )
      ON CONFLICT (username) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        is_verified = TRUE,
        avatar_url = EXCLUDED.avatar_url
      RETURNING id
    `;
    const botId = botUser[0]?.id;
    if (!botId) throw new Error('Impossible de créer le compte @bot.');

    await sql`
      INSERT INTO profiles (user_id, display_name, bio, avatar_url, is_verified)
      VALUES (${botId}, 'Bot', 'Compte officiel de test Vibe 🤖', 'https://api.dicebear.com/7.x/bottts/svg?seed=vibe-bot', TRUE)
      ON CONFLICT (user_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        bio = EXCLUDED.bio,
        avatar_url = EXCLUDED.avatar_url,
        is_verified = TRUE
    `;

    const postCount = await sql`SELECT COUNT(*) as n FROM posts WHERE author_id = ${botId}`;
    if (Number(postCount[0].n) < 2) {
      await sql`
        INSERT INTO posts (author_id, content, format, visibility, toxicity_score, created_via)
        VALUES (${botId}, 'Bienvenue sur Vibe ! 🚀 Je suis le bot de test officiel @bot. Vous pouvez liker, commenter ou m''envoyer un message en DM !', 'micro_text', 'public', 0.01, 'mai_agent')
      `;
      await sql`
        INSERT INTO posts (author_id, content, format, visibility, toxicity_score, created_via)
        VALUES (${botId}, 'Test de publication avec #mAI sur Vibe ! Intelligence artificielle intégrée ✨🤖 #Vibe #Innovation', 'micro_text', 'public', 0.01, 'mai_agent')
      `;
    }
    console.log(`  ✅ Compte @bot sécurisé à partir de BOT_PASSWORD_HASH (id: ${botId})`);
  }

  // ─────────────────────────────────────────────────────────────
  // 10. Index de performance
  // ─────────────────────────────────────────────────────────────
  console.log('\n⚡ INDEX DE PERFORMANCE:');
  await runAlter(
    'idx_posts_published_at',
    `CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC)`
  );
  await runAlter(
    'idx_posts_visibility_published',
    `CREATE INDEX IF NOT EXISTS idx_posts_visibility_published ON posts(visibility, published_at DESC)`
  );
  await runAlter(
    'extension_pg_trgm',
    `CREATE EXTENSION IF NOT EXISTS pg_trgm`
  );
  await runAlter(
    'idx_posts_content_trgm',
    `CREATE INDEX IF NOT EXISTS idx_posts_content_trgm ON posts USING gin (content gin_trgm_ops)`
  );
  await runAlter(
    'idx_users_username_trgm',
    `CREATE INDEX IF NOT EXISTS idx_users_username_trgm ON users USING gin (username gin_trgm_ops)`
  );
  await runAlter(
    'idx_post_interactions_lookup',
    `CREATE INDEX IF NOT EXISTS idx_post_interactions_lookup ON post_interactions(post_id, interaction_type, user_id)`
  );
  await runAlter(
    'idx_notifications_unread',
    `CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, is_read)`
  );

  // ─────────────────────────────────────────────────────────────
  // MODÉRATION DM + PERSONNALISATION (ajout 2026-09-02)
  // ─────────────────────────────────────────────────────────────
  console.log('\n🛡️  TABLES DM & PERSONNALISATION:');
  await runAlter(
    'TABLE blocked_users',
    `CREATE TABLE IF NOT EXISTS blocked_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id BIGINT NOT NULL,
      blocked_user_id BIGINT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, blocked_user_id)
    )`
  );
  await runAlter(
    'TABLE dm_reports',
    `CREATE TABLE IF NOT EXISTS dm_reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      reporter_id BIGINT NOT NULL,
      reported_user_id BIGINT,
      message_id UUID,
      reason TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`
  );
  await runAlter(
    'TABLE dm_conv_meta',
    `CREATE TABLE IF NOT EXISTS dm_conv_meta (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id BIGINT NOT NULL,
      partner_id BIGINT NOT NULL,
      custom_name TEXT,
      UNIQUE (user_id, partner_id)
    )`
  );
  await runAlter(
    'TABLE dm_reactions',
    `CREATE TABLE IF NOT EXISTS dm_reactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      message_id UUID NOT NULL,
      user_id BIGINT NOT NULL,
      emoji TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (message_id, user_id, emoji)
    )`
  );
  await runAlter('direct_messages.reply_to_id', `ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS reply_to_id UUID`);
  await runAlter('user_settings.accent_color', `ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS accent_color TEXT`);
  await runAlter('user_settings.font_size', `ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS font_size TEXT`);
  await runAlter('idx_blocked_users_user', `CREATE INDEX IF NOT EXISTS idx_blocked_users_user ON blocked_users(user_id)`);
  await runAlter('idx_dm_unread', `CREATE INDEX IF NOT EXISTS idx_dm_unread ON direct_messages(conversation_id, recipient_id, is_read)`);

  // ─────────────────────────────────────────────────────────────
  // 15. Cercle Privé (user_circles, circle_members) & Audience par défaut
  // ─────────────────────────────────────────────────────────────
  console.log('\n🔒 CERCLE PRIVÉ & AUDIENCE PAR DÉFAUT:');
  await runAlter(
    'TABLE user_circles',
    `CREATE TABLE IF NOT EXISTS user_circles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL DEFAULT 'Cercle Privé',
      description TEXT DEFAULT 'Personnes autorisées à voir mes Vibes privées',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, name)
    )`
  );
  await runAlter('idx_user_circles_user', `CREATE INDEX IF NOT EXISTS idx_user_circles_user ON user_circles(user_id)`);

  await runAlter(
    'TABLE circle_members',
    `CREATE TABLE IF NOT EXISTS circle_members (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      member_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      circle_id INTEGER REFERENCES user_circles(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (user_id, member_user_id)
    )`
  );
  await runAlter('circle_members.circle_id', `ALTER TABLE circle_members ADD COLUMN IF NOT EXISTS circle_id INTEGER REFERENCES user_circles(id) ON DELETE CASCADE`);
  await runAlter('idx_circle_member', `CREATE INDEX IF NOT EXISTS idx_circle_member ON circle_members(member_user_id)`);
  await runAlter('idx_circle_user', `CREATE INDEX IF NOT EXISTS idx_circle_user ON circle_members(user_id)`);

  await runAlter('user_settings.default_vibe_audience', `ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS default_vibe_audience VARCHAR(32) DEFAULT 'public'`);

  await runAlter(
    'TABLE vibe_audience_preferences',
    `CREATE TABLE IF NOT EXISTS vibe_audience_preferences (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      default_audience VARCHAR(32) NOT NULL DEFAULT 'public',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`
  );
  await runAlter('idx_vibe_audience_user', `CREATE INDEX IF NOT EXISTS idx_vibe_audience_user ON vibe_audience_preferences(user_id)`);

  // ─────────────────────────────────────────────────────────────
  // 16. STATS CRÉATEUR 017 (sources vues + visites profil)
  // ─────────────────────────────────────────────────────────────
  console.log('\n📊 STATS CRÉATEUR 017:');
  await runAlter(
    'TABLE post_views',
    `CREATE TABLE IF NOT EXISTS post_views (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id BIGINT,
      post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      duration_ms INT NOT NULL DEFAULT 1000,
      dwell_ms INT NOT NULL DEFAULT 1000,
      visible_ratio FLOAT DEFAULT 0.5,
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`
  );
  await runAlter('post_views.source', `ALTER TABLE post_views ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'feed'`);
  await runAlter('idx_views_post_created', `CREATE INDEX IF NOT EXISTS idx_views_post_created ON post_views(post_id, created_at DESC)`);
  await runAlter('idx_views_created', `CREATE INDEX IF NOT EXISTS idx_views_created ON post_views(created_at DESC)`);
  await runAlter(
    'TABLE profile_views',
    `CREATE TABLE IF NOT EXISTS profile_views (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      profile_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      viewer_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
      source TEXT DEFAULT 'profile',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`
  );
  await runAlter('idx_profile_views_profile', `CREATE INDEX IF NOT EXISTS idx_profile_views_profile ON profile_views(profile_user_id, created_at DESC)`);
  await runAlter('idx_profile_views_viewer', `CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON profile_views(viewer_id, created_at DESC)`);
  await runAlter('idx_profile_views_created', `CREATE INDEX IF NOT EXISTS idx_profile_views_created ON profile_views(created_at DESC)`);

  // ─────────────────────────────────────────────────────────────
  // 17. PROFIL ENRICHI + ÉPINGLAGE PROFIL + LIVRES PUBLICS (021/022)
  // ─────────────────────────────────────────────────────────────
  console.log('\n✨ PROFIL, ÉPINGLAGE & LIVRES PUBLICS:');
  await runAlter('profiles.website', `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website VARCHAR(255)`);
  await runAlter('profiles.location', `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location VARCHAR(100)`);
  await runAlter(
    'TABLE profile_pinned_posts',
    `CREATE TABLE IF NOT EXISTS profile_pinned_posts (
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (user_id, post_id)
    )`
  );
  await runAlter('idx_profile_pinned_user', `CREATE INDEX IF NOT EXISTS idx_profile_pinned_user ON profile_pinned_posts(user_id, created_at DESC)`);
  await runAlter('vibe_books.is_public', `ALTER TABLE vibe_books ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE`);
  await runAlter(
    'TABLE post_book_refs',
    `CREATE TABLE IF NOT EXISTS post_book_refs (
      post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      book_id UUID NOT NULL REFERENCES vibe_books(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (post_id, book_id)
    )`
  );
  await runAlter('idx_post_book_refs_book', `CREATE INDEX IF NOT EXISTS idx_post_book_refs_book ON post_book_refs(book_id)`);

  // ─────────────────────────────────────────────────────────────
  // 18. CONVERSATIONS DES LIVRES DANS MESSAGES (025) + INDEX mAI
  // ─────────────────────────────────────────────────────────────
  console.log('\n📚 CONVERSATIONS DES LIVRES:');
  await runAlter('dm_conversations.book_id', `ALTER TABLE dm_conversations ADD COLUMN IF NOT EXISTS book_id UUID`);
  await runAlter('idx_dm_conversations_book', `CREATE UNIQUE INDEX IF NOT EXISTS idx_dm_conversations_book ON dm_conversations(book_id) WHERE book_id IS NOT NULL`);
  await runAlter('direct_messages.attached_post_id', `ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS attached_post_id UUID`);
  await runAlter('idx_dm_attached_post', `CREATE INDEX IF NOT EXISTS idx_dm_attached_post ON direct_messages(attached_post_id) WHERE attached_post_id IS NOT NULL`);
  await runAlter('idx_mai_messages_conv', `CREATE INDEX IF NOT EXISTS idx_mai_messages_conv ON mai_messages(conversation_id, created_at DESC)`);
  await runAlter('idx_mai_conversations_user', `CREATE INDEX IF NOT EXISTS idx_mai_conversations_user ON mai_conversations(user_id, updated_at DESC)`);
  await runAlter('backfill_book_conversations',
    `INSERT INTO dm_conversations (participant_one_id, participant_two_id, is_group, group_name, created_by, book_id, last_message_preview, last_message_at)
     SELECT b.user_id, NULL, TRUE, b.title, b.user_id, b.id, 'Conversation du Livre', COALESCE(b.updated_at, NOW())
     FROM vibe_books b WHERE NOT EXISTS (SELECT 1 FROM dm_conversations dm WHERE dm.book_id = b.id)`);
  await runAlter('backfill_book_conversation_members',
    `INSERT INTO dm_group_members (conversation_id, user_id, role, added_by)
     SELECT dm.id, m.user_id, CASE WHEN m.role = 'owner' THEN 'admin' ELSE 'member' END, b.user_id
     FROM dm_conversations dm JOIN vibe_books b ON b.id = dm.book_id
     JOIN vibe_book_members m ON m.book_id = dm.book_id
     ON CONFLICT (conversation_id, user_id) DO NOTHING`);
  await runAlter('backfill_book_conversation_admin_roles',
    `UPDATE dm_group_members gm SET role = 'admin'
     WHERE gm.role <> 'admin'
       AND EXISTS (SELECT 1 FROM dm_conversations dm JOIN vibe_books b ON b.id = dm.book_id
                   WHERE dm.id = gm.conversation_id AND b.user_id = gm.user_id)`);

  // ─────────────────────────────────────────────────────────────
  // VÉRIFICATION FINALE
  // ─────────────────────────────────────────────────────────────
  console.log('\n═'.repeat(60));
  console.log('📋 VÉRIFICATION FINALE:');
  const checks = [
    ['users.is_verified', `SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_verified'`],
    ['profiles.is_verified', `SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_verified'`],
    ['user_settings.feed_default_mode', `SELECT 1 FROM information_schema.columns WHERE table_name='user_settings' AND column_name='feed_default_mode'`],
    ['user_settings.hide_reposts', `SELECT 1 FROM information_schema.columns WHERE table_name='user_settings' AND column_name='hide_reposts'`],
    ['user_settings.blocked_keywords', `SELECT 1 FROM information_schema.columns WHERE table_name='user_settings' AND column_name='blocked_keywords'`],
    ['user_settings.two_factor_auth', `SELECT 1 FROM information_schema.columns WHERE table_name='user_settings' AND column_name='two_factor_auth'`],
    ['user_settings.allow_mentions', `SELECT 1 FROM information_schema.columns WHERE table_name='user_settings' AND column_name='allow_mentions'`],
    ['user_settings.allow_dms', `SELECT 1 FROM information_schema.columns WHERE table_name='user_settings' AND column_name='allow_dms'`],
    ['user_settings.dms_enabled', `SELECT 1 FROM information_schema.columns WHERE table_name='user_settings' AND column_name='dms_enabled'`],
    ['usage_logs.endpoint', `SELECT 1 FROM information_schema.columns WHERE table_name='usage_logs' AND column_name='endpoint'`],
    ['posts.status', `SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='status'`],
    ['posts.scheduled_at', `SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='scheduled_at'`],
    ['user_settings.ui_language', `SELECT 1 FROM information_schema.columns WHERE table_name='user_settings' AND column_name='ui_language'`],
    ['user_settings.default_vibe_audience', `SELECT 1 FROM information_schema.columns WHERE table_name='user_settings' AND column_name='default_vibe_audience'`],
    ['user_circles', `SELECT 1 FROM information_schema.tables WHERE table_name='user_circles'`],
    ['vibe_audience_preferences', `SELECT 1 FROM information_schema.tables WHERE table_name='vibe_audience_preferences'`],
    ['circle_members', `SELECT 1 FROM information_schema.tables WHERE table_name='circle_members'`],
    ['comment_translations', `SELECT 1 FROM information_schema.tables WHERE table_name='comment_translations'`],
    ['profile_views', `SELECT 1 FROM information_schema.tables WHERE table_name='profile_views'`],
    ['post_views.source', `SELECT 1 FROM information_schema.columns WHERE table_name='post_views' AND column_name='source'`],
    ['profiles.website', `SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='website'`],
    ['profiles.location', `SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='location'`],
    ['profile_pinned_posts', `SELECT 1 FROM information_schema.tables WHERE table_name='profile_pinned_posts'`],
    ['vibe_books.is_public', `SELECT 1 FROM information_schema.columns WHERE table_name='vibe_books' AND column_name='is_public'`],
    ['post_book_refs', `SELECT 1 FROM information_schema.tables WHERE table_name='post_book_refs'`],
    ['dm_conversations.book_id', `SELECT 1 FROM information_schema.columns WHERE table_name='dm_conversations' AND column_name='book_id'`],
    ['direct_messages.attached_post_id', `SELECT 1 FROM information_schema.columns WHERE table_name='direct_messages' AND column_name='attached_post_id'`],
    ['mai_messages', `SELECT 1 FROM information_schema.tables WHERE table_name='mai_messages'`],
    ['idx_mai_messages_conv', `SELECT 1 FROM pg_indexes WHERE indexname='idx_mai_messages_conv'`],
  ];

  const missingChecks = [];
  for (const [name, query] of checks) {
    const result = await sql.query(query);
    const found = result.length > 0;
    console.log(`  ${found ? '✅' : '❌'} ${name}`);
    if (!found) missingChecks.push(name);
  }
  if (missingChecks.length > 0) {
    throw new Error(`Vérification finale échouée : ${missingChecks.join(', ')}`);
  }

  console.log('\n🎉 Migration terminée !\n');
}

migrate().catch(e => { console.error('💥 Erreur fatale:', e.message); process.exit(1); });
