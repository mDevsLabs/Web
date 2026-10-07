import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Supplier = {
    id?: string;
    name: string;
    contactEmail: string;
    leadTimeDays: number;
    country: string;
    status: "active" | "pending" | "inactive";
};
export type SupplierStatus = Supplier['status'];
export interface SupplierActivity extends DomainActivity {
    supplierId?: string;
}
export type SupplierMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalSupplier' | 'activeSupplier' | 'valueSupplier';
};
export type SupplierSettingsValues = Partial<Record<"notifySupplier" | "archiveSupplier" | "approveSupplier", boolean>>;
