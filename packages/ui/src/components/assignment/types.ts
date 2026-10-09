import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Assignment = {
    id?: string;
    title: string;
    course: string;
    dueDate: string;
    maxScore: number;
    status: "draft" | "open" | "closed";
};
export type AssignmentStatus = Assignment['status'];
export interface AssignmentActivity extends DomainActivity {
    assignmentId?: string;
}
export type AssignmentMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalAssignment' | 'activeAssignment' | 'valueAssignment';
};
export type AssignmentSettingsValues = Partial<Record<"notifyAssignment" | "archiveAssignment" | "approveAssignment", boolean>>;
