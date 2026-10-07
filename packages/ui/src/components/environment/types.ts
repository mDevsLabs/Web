import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Environment = {
    id?: string;
    name: string;
    region: string;
    serviceCount: number;
    url: string;
    status: "active" | "provisioning" | "disabled";
};
export type EnvironmentStatus = Environment['status'];
export interface EnvironmentActivity extends DomainActivity {
    environmentId?: string;
}
export type EnvironmentMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalEnvironment' | 'activeEnvironment' | 'valueEnvironment';
};
export type EnvironmentSettingsValues = Partial<Record<"notifyEnvironment" | "archiveEnvironment" | "approveEnvironment", boolean>>;
