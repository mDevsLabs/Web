import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Milestone = {
    id?: string;
    name: string;
    project: string;
    dueDate: string;
    progress: number;
    status: "planned" | "in-progress" | "achieved" | "delayed";
};
export type MilestoneStatus = Milestone['status'];
export interface MilestoneActivity extends DomainActivity {
    milestoneId?: string;
}
export type MilestoneMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalMilestone' | 'activeMilestone' | 'valueMilestone';
};
export type MilestoneSettingsValues = Partial<Record<"notifyMilestone" | "archiveMilestone" | "approveMilestone", boolean>>;
