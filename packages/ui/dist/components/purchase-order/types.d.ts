import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type PurchaseOrder = {
    id?: string;
    reference: string;
    supplier: string;
    amount: number;
    expectedOn: string;
    status: "draft" | "approved" | "ordered" | "received";
};
export type PurchaseOrderStatus = PurchaseOrder['status'];
export interface PurchaseOrderActivity extends DomainActivity {
    purchaseorderId?: string;
}
export type PurchaseOrderMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalPurchaseOrder' | 'activePurchaseOrder' | 'valuePurchaseOrder';
};
export type PurchaseOrderSettingsValues = Partial<Record<"notifyPurchaseOrder" | "archivePurchaseOrder" | "approvePurchaseOrder", boolean>>;
