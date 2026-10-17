import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Release = {
    id?: string;
    name: string;
    version: string;
    releasedOn: string;
    changeCount: number;
    status: "draft" | "prerelease" | "stable";
};
export type ReleaseStatus = Release['status'];
export interface ReleaseActivity extends DomainActivity {
    releaseId?: string;
}
export type ReleaseMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalRelease' | 'activeRelease' | 'valueRelease';
};
export type ReleaseSettingsValues = Partial<Record<"notifyRelease" | "archiveRelease" | "approveRelease", boolean>>;
