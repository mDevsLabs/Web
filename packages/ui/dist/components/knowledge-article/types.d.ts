import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type KnowledgeArticle = {
    id?: string;
    title: string;
    author: string;
    viewCount: number;
    updatedOn: string;
    status: "draft" | "published" | "archived";
};
export type KnowledgeArticleStatus = KnowledgeArticle['status'];
export interface KnowledgeArticleActivity extends DomainActivity {
    knowledgearticleId?: string;
}
export type KnowledgeArticleMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalKnowledgeArticle' | 'activeKnowledgeArticle' | 'valueKnowledgeArticle';
};
export type KnowledgeArticleSettingsValues = Partial<Record<"notifyKnowledgeArticle" | "archiveKnowledgeArticle" | "approveKnowledgeArticle", boolean>>;
