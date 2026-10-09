import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Comment = {
    id?: string;
    author: string;
    content: string;
    postedOn: string;
    likeCount: number;
    status: "pending" | "approved" | "flagged";
};
export type CommentStatus = Comment['status'];
export interface CommentActivity extends DomainActivity {
    commentId?: string;
}
export type CommentMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalComment' | 'activeComment' | 'valueComment';
};
export type CommentSettingsValues = Partial<Record<"notifyComment" | "archiveComment" | "approveComment", boolean>>;
