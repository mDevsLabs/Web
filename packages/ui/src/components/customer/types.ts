import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Customer = {
    id?: string;
    name: string;
    email: string;
    lifetimeValue: number;
    joinedOn: string;
    status: "active" | "new" | "inactive";
};
export type CustomerStatus = Customer['status'];
export interface CustomerActivity extends DomainActivity {
    customerId?: string;
}
export type CustomerMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalCustomer' | 'activeCustomer' | 'valueCustomer';
};
export type CustomerSettingsValues = Partial<Record<"notifyCustomer" | "archiveCustomer" | "approveCustomer", boolean>>;
