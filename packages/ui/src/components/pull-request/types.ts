import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type PullRequest = {
    id?: string;
    title: string;
    author: string;
    number: number;
    changedFiles: number;
    status: "open" | "review" | "merged" | "closed";
};
export type PullRequestStatus = PullRequest['status'];
export interface PullRequestActivity extends DomainActivity {
    pullrequestId?: string;
}
export type PullRequestMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalPullRequest' | 'activePullRequest' | 'valuePullRequest';
};
export type PullRequestSettingsValues = Partial<Record<"notifyPullRequest" | "archivePullRequest" | "approvePullRequest", boolean>>;
