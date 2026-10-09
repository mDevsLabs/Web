export type VerificationTier =
  | "creator"
  | "business"
  | "verified_human"
  | "official"
  | null;

export interface User {
  avatar_url?: string;
  created_at: string;
  email: string;
  id: string;
  is_verified?: boolean;
  phone?: string;
  tier: "Free" | "Plus" | "Pro" | "Max";
  username: string;
}

export interface Profile {
  avatarUrl?: string;
  bannerUrl?: string;
  bio: string;
  blocked_by_me?: boolean;
  blocked_me?: boolean;
  displayName: string;
  followersCount: number;
  followingCount: number;
  /** Le propriétaire a masqué la coche bleue sur son profil public. */
  hide_verified_badge?: boolean;
  id: string;
  interests: string[];
  is_verified?: boolean;
  /** Statuts sociaux renvoyés par GET /profiles/:username pour le visiteur. */
  isFollowing?: boolean;
  isVerified?: boolean;
  location?: string;
  muted_by_me?: boolean;
  postsCount: number;
  reputationScore?: number;
  showcaseLayout?: "stream" | "grid";
  /** Abonnement du compte ('Free' | 'Plus' | 'Pro' | 'Max'), renvoyé par GET /profiles/:username. */
  tier?: string;
  topicModel?: string[];
  user_id: string;
  username: string;
  verificationTier?: VerificationTier;
  website?: string;
}

/** Compte masqué (mute) via GET /users/muted. */
export interface MutedUser {
  created_at: string;
  id: string;
  muted_avatar_url?: string;
  muted_display_name?: string;
  muted_user_id: string;
  muted_username: string;
}

export interface MediaAsset {
  alt_text?: string;
  id?: string;
  media_type?: string;
  url: string;
}

/** Publication citée intégrée à un post (données simplifiées). */
export interface QuotedPost {
  ai_generated?: boolean;
  author_id?: string;
  avatar_url?: string;
  content: string;
  created_via?: Post["created_via"];
  display_name?: string;
  format?: Post["format"];
  id: string;
  is_verified?: boolean;
  likes_count?: number;
  media_assets?: MediaAsset[];
  published_at?: string;
  replies_count?: number;
  username: string;
}

export interface Post {
  /** Badge « Créé avec l'IA » déclaré par l'auteur (ou défaut de ses réglages). */
  ai_generated?: boolean;
  author_id: string;
  avatar_url?: string;
  /** Livres référencés dans le post (@livre / attachement), ordre d'apparition. */
  book_refs?: BookRef[];
  bookmarks_count: number;
  /** Co-auteurs invités/acceptés (co-signature). */
  collaborators?: PostCollaborator[];
  content: string;
  created_via?: "web" | "mai_agent" | "api";
  display_name?: string;
  explanation?: string;
  format: "micro_text" | "article" | "media" | "mai_generation";
  has_bookmarked?: boolean;
  has_liked?: boolean;
  has_reposted?: boolean;
  id: string;
  /** Post épinglé tout en haut du profil de son auteur (max 2). */
  is_pinned?: boolean;
  is_verified?: boolean;
  likes_count: number;
  media_assets?: MediaAsset[];
  media_url?: string;
  /** Retour d'algorithme de l'utilisateur courant sur ce post. */
  my_feedback?: "more" | "less" | null;
  /** Post d'un autre compte mis en avant sur le profil consulté. */
  pinned_by_profile?: boolean;
  /** Pseudo du propriétaire du profil qui a mis ce post en avant. */
  pinned_by_username?: string;
  /** Sondage intégré (2-4 options, vote unique modifiable). */
  poll?: Poll | null;
  published_at: string;
  quoted_post?: QuotedPost | null;
  /** Post original cité (quote-post), s'il y en a un. */
  quoted_post_id?: string | null;
  recommendationScore?: number;
  replies_count: number;
  reposts_count: number;
  scheduled_at?: string | null;
  scoreBreakdown?: {
    freshnessScore: number;
    engagementScore: number;
    velocityScore: number;
    semanticScore: number;
    graphProximityScore: number;
    safetyFactor: number;
    interestFactor?: number;
    dwellScore?: number;
    timeContextBoost?: number;
  };
  sentiment_score?: number;
  /** Planification : 'scheduled' tant que la date de publication n'est pas atteinte. */
  status?: "published" | "scheduled";
  toxicity_score?: number;
  updated_at?: string;
  username: string;
  verification_tier?: VerificationTier;
  views_count?: number;
  /** Audience : public, abonnés uniquement, cercle privé, ou privé (soi seul). */
  visibility: "public" | "followers" | "circle" | "private";
}

/** Option d'un sondage de post. */
export interface PollOption {
  id: string;
  label: string;
  position: number;
  votes_count: number;
}

/** Sondage intégré à un post. */
export interface Poll {
  created_at?: string;
  ends_at: string;
  expired?: boolean;
  id: string;
  /** Option votée par l'utilisateur courant (null si aucun vote). */
  my_vote?: string | null;
  options: PollOption[];
  post_id: string;
  question: string;
  total_votes: number;
}

/** Co-auteur d'un post collaboratif. */
export interface PostCollaborator {
  avatar_url?: string;
  display_name?: string;
  status: string;
  username: string;
}

/** Résultat de recherche globale unifiée. */
export interface UnifiedSearchResult {
  books: VibeBook[];
  messages: DirectMessage[];
  posts: Post[];
  total: number;
  users: Array<{
    id: number | string;
    username: string;
    display_name?: string;
    avatar_url?: string;
    is_verified?: boolean;
    followers_count?: number;
    bio?: string;
  }>;
}

/** Brouillon de post synchronisé serveur (multi-appareils). */
export interface ServerDraft {
  ai_generated?: boolean;
  created_at?: string;
  html: string;
  id: string;
  media_assets?: Array<{
    url: string;
    media_type?: string;
    size?: number;
    alt_text?: string;
  }>;
  scheduled_at?: string | null;
  text: string;
  updated_at?: string;
  user_id?: string | number;
  visibility?: string;
}

export interface Comment {
  author_id: string;
  avatar_url?: string;
  content: string;
  created_at: string;
  depth: number;
  display_name?: string;
  id: string;
  is_verified?: boolean;
  likes_count: number;
  /** Médias joints au commentaire (max 3 images / 1 vidéo). */
  media_assets?: MediaAsset[];
  parent_comment_id?: string;
  post_id: string;
  username: string;
}

export interface DirectMessage {
  attached_post?: {
    id: string;
    username: string;
    display_name?: string | null;
    avatar_url?: string | null;
    excerpt: string;
  } | null;
  /** Publication du Livre jointe au message (conversations de Livre). */
  attached_post_id?: string | null;
  content: string;
  conversation_id: string;
  created_at: string;
  edited_at?: string | null;
  /** Attributions d'un message transféré (auteur re-dérivé côté serveur). */
  forwarded_from?: {
    message_id: string;
    username: string;
    display_name?: string | null;
  } | null;
  id: string;
  is_edited?: boolean;
  /** Message épinglé dans la conversation (bannière). */
  is_pinned?: boolean;
  is_read: boolean;
  /** Mentions @username détectées dans le contenu. */
  mentions?: string[];
  reactions?: Array<{ emoji: string; count: number; mine: boolean }>;
  read_at?: string | null;
  /** Ids des membres ayant lu (groupes). */
  read_by?: string[];
  recipient_id: string;
  reply_to_content?: string | null;
  reply_to_id?: string | null;
  reply_to_username?: string | null;
  send_at?: string | null;
  sender_id: string;
  sender_username?: string;
  /** Envoi programmé : 'scheduled' jusqu'à send_at, sinon 'sent'. */
  status?: "scheduled" | "sent";
  /** Traductions mémorisées côté serveur : langue → { texte, langue détectée, date }. */
  translations?: Record<
    string,
    { text: string; detected?: string | null; at?: string }
  >;
  /** Mentions urgentes (@tous ou @utilisateur) — notifie en urgence. */
  urgent_mentions?: string[];
}

export interface DMConversation {
  /** Nom de l'icône lucide du Livre. */
  book_icon?: string | null;
  book_id?: string | null;
  book_title?: string | null;
  /** Nom personnalisé donné à la conversation (par le compte courant) */
  custom_name?: string | null;
  id: string;
  /** Admin du groupe (créateur) — vrai pour le compte courant si admin */
  is_admin?: boolean;
  /** Partenaire bloqué par le compte courant */
  is_blocked?: boolean;
  /** Conversation rattachée à un Livre (mêmes mécanismes de groupe). */
  is_book?: boolean;
  /** Conversation de groupe (migration 019) : partner_id = "group:<uuid>" */
  is_group?: boolean;
  last_message_at: string;
  last_message_content?: string;
  last_message_preview?: string;
  /** Membres du groupe (normalisés côté API) */
  members?: GroupMember[];
  partner_avatar_url?: string;
  partner_display_name?: string;
  partner_id: string;
  partner_username: string;
  unread_count?: number;
}

/** Membre d'un groupe DM. */
export interface GroupMember {
  avatar_url?: string;
  display_name?: string;
  joined_at?: string;
  role: string;
  user_id: string;
  username: string;
}

export interface NotificationItem {
  actor_avatar_url?: string;
  actor_id?: string;
  actor_username?: string;
  created_at: string;
  id: string;
  is_read: boolean;
  message: string;
  post_id?: string;
  recipient_id: string;
  type:
    | "like"
    | "repost"
    | "reply"
    | "follow"
    | "mention"
    | "dm"
    | "mai_system"
    | "reaction"
    | "quote"
    | "post"
    | "book_join";
}

/** Livre de « Vibe préférées » — collection de posts en favoris (max 5 possédés par compte). */
export interface VibeBook {
  /** true si le post passé en query est déjà dans ce Livre. */
  contains_post?: boolean;
  /** Conversation Messages du Livre (partner_id = "group:<uuid>"). */
  conversation_id?: string | null;
  created_at?: string;
  /** Nom de l'icône lucide-react choisie parmi le picker. */
  icon: string;
  id: string;
  /** true si le compte courant est membre (ou créateur) du Livre. */
  is_member?: boolean;
  /** true si le compte courant est le créateur. */
  is_owner?: boolean;
  /** Livre public : consultable en lecture seule par tous (code d'invitation masqué). */
  is_public?: boolean;
  items_count?: number;
  /** Code de partage (lien/code d'invitation) — visible par tous les membres. */
  join_code?: string | null;
  /** Nombre de membres (créateur inclus). */
  members_count?: number;
  /** Rôle du compte courant dans le Livre. */
  role?: "owner" | "member";
  title: string;
  /** Id du créateur du Livre. */
  user_id?: number;
}

/** Référence de Livre attachée à un post (carte affichée sous le contenu). */
export interface BookRef {
  /** false quand le Livre est devenu privé et que le lecteur n'est pas membre. */
  can_view?: boolean;
  /** Nom de l'icône lucide-react du Livre. */
  icon?: string;
  id: string;
  items_count?: number;
  members_count?: number;
  owner_display_name?: string;
  owner_username?: string;
  title: string;
}

/** Membre d'un Livre collaboratif. */
export interface VibeBookMember {
  avatar_url?: string | null;
  display_name?: string | null;
  joined_at?: string;
  role: "owner" | "member";
  user_id: number | string;
  username: string;
}

/** Vibe enregistrée dans un Livre, avec attribution du partage. */
export interface VibeBookPost extends Post {
  added_by?: number | null;
  added_by_avatar_url?: string | null;
  added_by_display_name?: string | null;
  added_by_username?: string | null;
  /** Vibe épinglée en haut du Livre (max 3). */
  is_pinned?: boolean;
  pinned_at?: string | null;
  saved_at?: string;
}

/** Commentaire de la discussion d'un Livre. */
export interface BookComment {
  avatar_url?: string | null;
  content: string;
  created_at: string;
  display_name?: string | null;
  id: string;
  reactions?: Array<{ emoji: string; count: number; mine: boolean }>;
  reply_content?: string | null;
  reply_to_id?: string | null;
  reply_username?: string | null;
  user_id: number | string;
  username: string;
}

/** Entrée de liste d'abonnés / abonnements d'un profil. */
export interface ProfileListUser {
  avatar_url?: string | null;
  display_name?: string | null;
  followers_count?: number;
  id: number | string;
  is_following?: boolean;
  is_verified?: boolean;
  username: string;
}

export interface MAIQuotas {
  dailyImages: {
    used: number;
    limit: number;
    percent: number;
  };
  resetAt: string;
  tier: "Free" | "Plus" | "Pro" | "Max";
  weeklyTokens: {
    used: number;
    limit: number;
    percent: number;
  };
}

/** Appel d'outil mAI persisté (mai_messages.tool_calls) — chip du chat. */
export interface MaiToolCall {
  args?: Record<string, any>;
  at?: string;
  error?: string | null;
  id: string;
  model?: string | null;
  /** Id du catalogue d'outils (ex. generate_vibe_image). */
  name: string;
  /** Résultat brut { success, result?, error? } (null si en attente/refusé/désactivé). */
  result?: { success?: boolean; result?: any; error?: string } | null;
  status:
    | "executed"
    | "error"
    | "pending_approval"
    | "rejected"
    | "disabled"
    | "blocked";
}

/** Résumé d'une conversation mAI (liste latérale de la page Studio). */
export interface MAIConversationSummary {
  created_at?: string;
  id: string;
  is_pinned?: boolean;
  message_count?: number;
  preview?: string;
  title: string;
  updated_at?: string;
}

export interface UserSettings {
  accent_color?: string;
  age_restriction_enabled: boolean;
  allow_dms?: "everyone" | "following" | "nobody";
  allow_dms_from?: "everyone" | "following" | "nobody";
  allow_mentions?: "everyone" | "following" | "nobody";
  blocked_keywords?: string[] | string;
  blur_sensitive_content: boolean;
  chat_background_theme?: string;
  /** Les co-signatures dont je suis désigné co-auteur sont acceptées automatiquement. */
  collab_auto_accept?: boolean;
  content_filter_level: "low" | "medium" | "strict";
  /** Audience par défaut lors de la création d'une Vibe ('public', 'followers', 'circle') */
  default_vibe_audience?: "public" | "followers" | "circle";
  /** Traduction automatique des messages privés reçus. */
  dm_auto_translate?: boolean;
  /** Langue cible de la traduction automatique des messages (code type DeepL). */
  dm_translate_lang?: string | null;
  dms_enabled?: boolean;
  email_notifications: boolean;
  feed_default_mode?: "for_you" | "stream" | "trending";
  font_size?: "small" | "medium" | "large";
  hide_reposts?: boolean;
  /** Masque la coche bleue (badge vérifié) sur le profil public (comptes Plus/Pro/Max). */
  hide_verified_badge?: boolean;
  mai_auto_approve_tools?: boolean;
  mai_context_books?: boolean;
  mai_context_dms?: boolean;
  /** Contexte mAI opt-in : publications / DMs / livres. */
  mai_context_posts?: boolean;
  /** Modèle mAI par défaut pour toutes les requêtes mAI (assistant, outils composer, traduction). */
  mai_default_model?: string;
  /** Outils mAI activés (ids du catalogue lib/tools) ; null/absent = tous. */
  mai_enabled_tools?: string[] | null;
  /** Voix de lecture mAI (mini-lecteur audio flottant, cf. GET /v1/speech/voices). */
  mai_tts_voice?: string;
  message_bubble_shape?: string;
  message_bubble_theme?: string;
  notify_on_dm: boolean;
  notify_on_like: boolean;
  notify_on_reply: boolean;
  notify_on_repost: boolean;
  /** Onboarding guidé terminé. */
  onboarding_completed?: boolean;
  /** Les nouvelles publications sont-elles marquées « créées avec l'IA » par défaut ? */
  posts_ai_generated_by_default?: boolean;
  push_notifications: boolean;
  /** Thème programmé (JSON sérialisé {enabled, darkStart, darkEnd}). */
  scheduled_theme?: string | null;
  theme_preference: string;
  two_factor_auth?: boolean;
  /** Langue cible de traduction (code DeepL : FR, EN-US…) ; vide/null = langue du navigateur. */
  ui_language?: string;
}
