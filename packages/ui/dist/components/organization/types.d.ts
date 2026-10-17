import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Organization = {
    id?: string;
    name: string;
    industry: string;
    employeeCount: number;
    country: string;
    status: "active" | "pending" | "archived";
};
export type OrganizationStatus = Organization['status'];
export interface OrganizationActivity extends DomainActivity {
    organizationId?: string;
}
export type OrganizationMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalOrganization' | 'activeOrganization' | 'valueOrganization';
};
export type OrganizationSettingsValues = Partial<Record<"notifyOrganization" | "archiveOrganization" | "approveOrganization", boolean>>;
