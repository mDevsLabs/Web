/**
 * ============================================================================
 * VIBE RECOMMENDATION ENGINE (lib/recommendation/index.ts)
 * Moteur de scoring hybride du feed « Pour Vous ». Découpé en signaux purs
 * (signals.ts) + combinaison pondérée ici, afin de pouvoir tester et ajuster
 * chaque signal indépendamment.
 * ============================================================================
 */

import {
  ageInHours,
  dayPartBoost,
  dwellScore,
  engagementScore,
  freshnessDecay,
  graphProximityScore,
  interestFactor,
  qualityBoost,
  rawEngagement,
  safetyFactor,
  velocityScore,
} from "./signals.ts";

export interface FeedTunerWeights {
  freshness: number;
  novelty: number;
  popularity: number;
  serendipity: number;
  proximity: number;
  dwell: number;
}

export interface PostCandidate {
  postId: string;
  authorId?: number;
  publishedAt: Date;
  likes: number;
  reposts: number;
  replies: number;
  views?: number;
  hasMedia?: boolean;
  isVerifiedAuthor?: boolean;
  semanticSimilarity?: number;
  isFollowedAuthor?: boolean;
  /** Affinité mesurée 0..1 : interactions passées de l'utilisateur avec cet auteur. */
  affinity?: number;
  candidateTopic?: string;
  candidateSentiment?: number;
  toxicityScore?: number;
  /** Signal d'affinement -1..1 issu des retours « Cela m'intéresse / pas » + intérêts. */
  interestSignal?: number;
  matchedInterestTags?: string[];
  tuner?: FeedTunerWeights;
  userDwellMs?: number;
  avgDwellMs?: number;
}

export interface RecommendationSignal {
  totalScore: number;
  explanationText: string;
  matchedInterests: string[];
  breakdown: {
    freshnessScore: number;
    engagementScore: number;
    velocityScore: number;
    semanticScore: number;
    graphProximityScore: number;
    safetyFactor: number;
    boostFactor: number;
    interestFactor: number;
    dwellScore: number;
    timeContextBoost: number;
  };
}

export class HybridRecommender {
  private static readonly DEFAULT_TUNER: FeedTunerWeights = {
    freshness: 0.30,
    novelty: 0.18,
    popularity: 0.22,
    serendipity: 0.08,
    proximity: 0.09,
    dwell: 0.13,
  };

  public static scorePost(candidate: PostCandidate): RecommendationSignal {
    const tuner = candidate.tuner || this.DEFAULT_TUNER;
    const dwellW = (tuner as any).dwell ?? 0.13;
    const ageHours = ageInHours(candidate.publishedAt);

    // Récence : demi-vie de 18 h (50 % de fraîcheur restante après 18 h).
    const freshness = freshnessDecay(ageHours);

    // Engagement pondéré (vues incluses) compressé logarithmiquement.
    const engagement = engagementScore(
      rawEngagement(candidate.likes, candidate.reposts, candidate.replies, candidate.views || 0)
    );

    // Vélocité : engagement par heure depuis la publication (effet viral).
    const velocity = velocityScore(
      rawEngagement(candidate.likes, candidate.reposts, candidate.replies, candidate.views || 0),
      ageHours
    );
    const semanticScore = candidate.semanticSimilarity ?? 0.6;
    const proximity = graphProximityScore(candidate.isFollowedAuthor, candidate.affinity);
    const safety = safetyFactor(candidate.toxicityScore);
    const boost = qualityBoost(candidate.isVerifiedAuthor, candidate.hasMedia);
    const interest = interestFactor(candidate.interestSignal);
    const dwell = dwellScore(candidate.userDwellMs ?? candidate.avgDwellMs);
    const timeBoost = dayPartBoost(candidate.publishedAt);

    const rawScore =
      tuner.freshness * freshness +
      tuner.popularity * engagement +
      tuner.proximity * proximity +
      tuner.novelty * velocity +
      tuner.serendipity * (1 - semanticScore * 0.4) +
      dwellW * dwell +
      0.05 * timeBoost;

    const totalScore = Math.max(
      0,
      Math.min(100, Math.round(rawScore * safety * boost * interest * 100))
    );

    let explanationText = "Recommandé selon vos centres d'intérêt et l'engagement.";
    if ((candidate.interestSignal || 0) >= 0.4) {
      explanationText = "🎯 Affiné d'après vos retours « Cela m'intéresse ».";
    } else if ((candidate.interestSignal || 0) <= -0.4) {
      explanationText = "📉 Moins mis en avant : retour « Cela ne m'intéresse pas ».";
    } else if ((candidate.userDwellMs || 0) >= 8000) {
      explanationText = "⏱️ Vous passez du temps sur ce type de contenu.";
    } else if (candidate.isFollowedAuthor) {
      explanationText = "Publication d'un créateur que vous suivez.";
    } else if (velocity > 0.6) {
      explanationText = "🔥 Publication en forte progression.";
    } else if (candidate.isVerifiedAuthor && engagement > 0.5) {
      explanationText = "✨ Publication populaire d'un compte vérifié.";
    } else if (freshness > 0.8) {
      explanationText = "⚡ Publication récente.";
    }

    return {
      totalScore,
      explanationText,
      matchedInterests:
        candidate.matchedInterestTags && candidate.matchedInterestTags.length > 0
          ? candidate.matchedInterestTags
          : candidate.candidateTopic
          ? [candidate.candidateTopic]
          : ["Général"],
      breakdown: {
        freshnessScore: Math.round(freshness * 100),
        engagementScore: Math.round(engagement * 100),
        velocityScore: Math.round(velocity * 100),
        semanticScore: Math.round(semanticScore * 100),
        graphProximityScore: Math.round(proximity * 100),
        safetyFactor: Number(safety.toFixed(2)),
        boostFactor: Number(boost.toFixed(2)),
        interestFactor: Number(interest.toFixed(2)),
        dwellScore: Math.round(dwell * 100),
        timeContextBoost: Math.round(timeBoost * 100),
      },
    };
  }
}
