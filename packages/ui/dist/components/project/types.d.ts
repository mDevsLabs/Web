import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Project = {
    id?: string;
    name: string;
    owner: string;
    progress: number;
    dueDate: string;
    status: "planned" | "active" | "completed" | "archived";
};
export type ProjectStatus = Project['status'];
export interface ProjectActivity extends DomainActivity {
    projectId?: string;
}
export type ProjectMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalProject' | 'activeProject' | 'valueProject';
};
export type ProjectSettingsValues = Partial<Record<"notifyProject" | "archiveProject" | "approveProject", boolean>>;
