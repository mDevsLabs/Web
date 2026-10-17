import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Task = {
    id?: string;
    title: string;
    assignee: string;
    estimateHours: number;
    dueDate: string;
    status: "todo" | "in-progress" | "done" | "blocked";
};
export type TaskStatus = Task['status'];
export interface TaskActivity extends DomainActivity {
    taskId?: string;
}
export type TaskMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalTask' | 'activeTask' | 'valueTask';
};
export type TaskSettingsValues = Partial<Record<"notifyTask" | "archiveTask" | "approveTask", boolean>>;
