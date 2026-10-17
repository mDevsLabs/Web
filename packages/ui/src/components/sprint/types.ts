import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Sprint = {
    id?: string;
    name: string;
    goal: string;
    startDate: string;
    endDate: string;
    status: "planned" | "active" | "completed";
};
export type SprintStatus = Sprint['status'];
export interface SprintActivity extends DomainActivity {
    sprintId?: string;
}
export type SprintMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalSprint' | 'activeSprint' | 'valueSprint';
};
export type SprintSettingsValues = Partial<Record<"notifySprint" | "archiveSprint" | "approveSprint", boolean>>;
