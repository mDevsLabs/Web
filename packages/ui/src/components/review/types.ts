import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Review = {
    id?: string;
    title: string;
    reviewer: string;
    rating: number;
    postedOn: string;
    status: "pending" | "published" | "hidden";
};
export type ReviewStatus = Review['status'];
export interface ReviewActivity extends DomainActivity {
    reviewId?: string;
}
export type ReviewMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalReview' | 'activeReview' | 'valueReview';
};
export type ReviewSettingsValues = Partial<Record<"notifyReview" | "archiveReview" | "approveReview", boolean>>;
