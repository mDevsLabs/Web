import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Article = {
    id?: string;
    title: string;
    author: string;
    publishedOn: string;
    wordCount: number;
    status: "draft" | "review" | "published" | "archived";
};
export type ArticleStatus = Article['status'];
export interface ArticleActivity extends DomainActivity {
    articleId?: string;
}
export type ArticleMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalArticle' | 'activeArticle' | 'valueArticle';
};
export type ArticleSettingsValues = Partial<Record<"notifyArticle" | "archiveArticle" | "approveArticle", boolean>>;
