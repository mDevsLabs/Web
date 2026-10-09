import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Integration = {
    id?: string;
    name: string;
    provider: string;
    connectedOn: string;
    syncCount: number;
    status: "connected" | "pending" | "error";
};
export type IntegrationStatus = Integration['status'];
export interface IntegrationActivity extends DomainActivity {
    integrationId?: string;
}
export type IntegrationMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalIntegration' | 'activeIntegration' | 'valueIntegration';
};
export type IntegrationSettingsValues = Partial<Record<"notifyIntegration" | "archiveIntegration" | "approveIntegration", boolean>>;
