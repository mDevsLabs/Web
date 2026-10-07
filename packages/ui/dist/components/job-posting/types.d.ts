import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type JobPosting = {
    id?: string;
    title: string;
    department: string;
    location: string;
    applicantCount: number;
    status: "draft" | "published" | "closed";
};
export type JobPostingStatus = JobPosting['status'];
export interface JobPostingActivity extends DomainActivity {
    jobpostingId?: string;
}
export type JobPostingMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalJobPosting' | 'activeJobPosting' | 'valueJobPosting';
};
export type JobPostingSettingsValues = Partial<Record<"notifyJobPosting" | "archiveJobPosting" | "approveJobPosting", boolean>>;
