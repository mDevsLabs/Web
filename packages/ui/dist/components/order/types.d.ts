import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Order = {
    id?: string;
    reference: string;
    customer: string;
    total: number;
    placedOn: string;
    status: "pending" | "confirmed" | "shipped" | "delivered";
};
export type OrderStatus = Order['status'];
export interface OrderActivity extends DomainActivity {
    orderId?: string;
}
export type OrderMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalOrder' | 'activeOrder' | 'valueOrder';
};
export type OrderSettingsValues = Partial<Record<"notifyOrder" | "archiveOrder" | "approveOrder", boolean>>;
