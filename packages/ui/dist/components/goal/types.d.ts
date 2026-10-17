import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Goal = {
    id?: string;
    title: string;
    owner: string;
    progress: number;
    dueDate: string;
    status: "active" | "achieved" | "paused";
};
export type GoalStatus = Goal['status'];
export interface GoalActivity extends DomainActivity {
    goalId?: string;
}
export type GoalMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalGoal' | 'activeGoal' | 'valueGoal';
};
export type GoalSettingsValues = Partial<Record<"notifyGoal" | "archiveGoal" | "approveGoal", boolean>>;
