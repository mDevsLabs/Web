import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Workspace = {
    id?: string;
    name: string;
    owner: string;
    memberCount: number;
    storageGb: number;
    status: "active" | "trial" | "suspended";
};
export type WorkspaceStatus = Workspace['status'];
export interface WorkspaceActivity extends DomainActivity {
    workspaceId?: string;
}
export type WorkspaceMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalWorkspace' | 'activeWorkspace' | 'valueWorkspace';
};
export type WorkspaceSettingsValues = Partial<Record<"notifyWorkspace" | "archiveWorkspace" | "approveWorkspace", boolean>>;
