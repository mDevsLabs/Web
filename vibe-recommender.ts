/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — RECOMMENDER (vibe-recommender.ts)
 * Algorithmic scoring engine for personalized and trending feeds
 * ============================================================================
 */

export interface FeedTunerWeights {
  freshness: number;
  novelty: number;
  popularity: number;
  proximity: number;
  serendipity: number;
}

export interface PostCandidate {
  /** Affinité mesurée 0..1 : interactions passées de l'utilisateur avec cet auteur. */
  affinity?: number;
  authorId?: number;
  candidateSentiment?: number;
  candidateTopic?: string;
  hasMedia?: boolean;
  isFollowedAuthor?: boolean;
  isVerifiedAuthor?: boolean;
  likes: number;
  postId: string;
  publishedAt: Date;
  replies: number;
  reposts: number;
  semanticSimilarity?: number;
  toxicityScore?: number;
  tuner?: FeedTunerWeights;
  views?: number;
}

export interface RecommendationSignal {
  breakdown: {
    freshnessScore: number;
    engagementScore: number;
    velocityScore: number;
    semanticScore: number;
    graphProximityScore: number;
    safetyFactor: number;
    boostFactor: number;
  };
  explanationText: string;
  matchedInterests: string[];
  totalScore: number;
}

export class HybridRecommender {
  private static readonly DEFAULT_TUNER: FeedTunerWeights = {
    freshness: 0.35,
    novelty: 0.2,
    popularity: 0.25,
    proximity: 0.1,
    serendipity: 0.1,
  };

  public static scorePost(candidate: PostCandidate): RecommendationSignal {
    const tuner = candidate.tuner || HybridRecommender.DEFAULT_TUNER;
    const now = Date.now();
    const publishedTime = candidate.publishedAt.getTime();
    const ageInHours = Math.max(0.05, (now - publishedTime) / (1000 * 60 * 60));

    // Récence : décroissance douce sur 24h
    const freshnessScore = Math.exp(-ageInHours / 18);

    // Engagement pondéré : Likes × 1, Reposts × 2.5, Réponses × 2, Vues × 0.05
    const rawEngagements =
      candidate.likes * 1.0 +
      candidate.reposts * 2.5 +
      candidate.replies * 2.0 +
      (candidate.views || 0) * 0.05;
    const engagementScore = Math.min(1.0, Math.log10(rawEngagements + 1) / 2.5);

    // Vélocité : engagement par heure depuis la publication (effet viral)
    const velocityScore = Math.min(
      1.0,
      rawEngagements / Math.max(0.5, ageInHours) / 8.0
    );
    const semanticScore = candidate.semanticSimilarity ?? 0.6;

    // Proximité sociale : abonnement + affinité mesurée (historique d'interactions)
    const affinity = Math.max(0, Math.min(1, candidate.affinity || 0));
    const graphProximityScore = candidate.isFollowedAuthor
      ? 0.7 + 0.3 * affinity
      : 0.2 + 0.5 * affinity;

    // Facteur de sécurité & toxicité
    const toxicity = candidate.toxicityScore || 0;
    const safetyFactor = Math.max(0, 1 - toxicity * 2.5);

    // Multiplicateurs de qualité
    let boostFactor = 1.0;
    if (candidate.isVerifiedAuthor) boostFactor *= 1.15; // +15% pour comptes vérifiés
    if (candidate.hasMedia) boostFactor *= 1.1; // +10% pour publications avec médias

    const rawScore =
      tuner.freshness * freshnessScore +
      tuner.popularity * engagementScore +
      tuner.proximity * graphProximityScore +
      tuner.novelty * velocityScore +
      tuner.serendipity * (1 - semanticScore * 0.4);

    const totalScore = Math.max(
      0,
      Math.min(100, Math.round(rawScore * safetyFactor * boostFactor * 100))
    );

    let explanationText =
      "Recommandé selon vos centres d'intérêt et l'engagement.";
    if (candidate.isFollowedAuthor) {
      explanationText = "Publication d'un créateur que vous suivez.";
    } else if (velocityScore > 0.6) {
      explanationText = "🔥 Publication en forte progression.";
    } else if (candidate.isVerifiedAuthor && engagementScore > 0.5) {
      explanationText = "✨ Publication populaire d'un compte vérifié.";
    } else if (freshnessScore > 0.8) {
      explanationText = "⚡ Publication récente.";
    }

    return {
      breakdown: {
        boostFactor: Number(boostFactor.toFixed(2)),
        engagementScore: Math.round(engagementScore * 100),
        freshnessScore: Math.round(freshnessScore * 100),
        graphProximityScore: Math.round(graphProximityScore * 100),
        safetyFactor: Number(safetyFactor.toFixed(2)),
        semanticScore: Math.round(semanticScore * 100),
        velocityScore: Math.round(velocityScore * 100),
      },
      explanationText,
      matchedInterests: candidate.candidateTopic
        ? [candidate.candidateTopic]
        : ["Général"],
      totalScore,
    };
  }
}
