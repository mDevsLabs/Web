import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type BlogPost = {
    id?: string;
    title: string;
    author: string;
    readTimeMinutes: number;
    publishedOn: string;
    status: "draft" | "scheduled" | "published";
};
export type BlogPostStatus = BlogPost['status'];
export interface BlogPostActivity extends DomainActivity {
    blogpostId?: string;
}
export type BlogPostMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalBlogPost' | 'activeBlogPost' | 'valueBlogPost';
};
export type BlogPostSettingsValues = Partial<Record<"notifyBlogPost" | "archiveBlogPost" | "approveBlogPost", boolean>>;
