import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Deployment = {
    id?: string;
    name: string;
    environment: string;
    commit: string;
    deployedOn: string;
    status: "queued" | "running" | "succeeded" | "failed";
};
export type DeploymentStatus = Deployment['status'];
export interface DeploymentActivity extends DomainActivity {
    deploymentId?: string;
}
export type DeploymentMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalDeployment' | 'activeDeployment' | 'valueDeployment';
};
export type DeploymentSettingsValues = Partial<Record<"notifyDeployment" | "archiveDeployment" | "approveDeployment", boolean>>;
