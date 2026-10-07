import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type BuildJob = {
    id?: string;
    name: string;
    branch: string;
    durationSeconds: number;
    startedOn: string;
    status: "queued" | "running" | "passed" | "failed";
};
export type BuildJobStatus = BuildJob['status'];
export interface BuildJobActivity extends DomainActivity {
    buildjobId?: string;
}
export type BuildJobMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalBuildJob' | 'activeBuildJob' | 'valueBuildJob';
};
export type BuildJobSettingsValues = Partial<Record<"notifyBuildJob" | "archiveBuildJob" | "approveBuildJob", boolean>>;
