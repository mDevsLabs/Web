import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Issue = {
    id?: string;
    title: string;
    assignee: string;
    number: number;
    createdOn: string;
    status: "open" | "in-progress" | "resolved" | "closed";
};
export type IssueStatus = Issue['status'];
export interface IssueActivity extends DomainActivity {
    issueId?: string;
}
export type IssueMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalIssue' | 'activeIssue' | 'valueIssue';
};
export type IssueSettingsValues = Partial<Record<"notifyIssue" | "archiveIssue" | "approveIssue", boolean>>;
