import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Cart = {
    id?: string;
    reference: string;
    customer: string;
    itemCount: number;
    subtotal: number;
    status: "open" | "abandoned" | "converted";
};
export type CartStatus = Cart['status'];
export interface CartActivity extends DomainActivity {
    cartId?: string;
}
export type CartMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalCart' | 'activeCart' | 'valueCart';
};
export type CartSettingsValues = Partial<Record<"notifyCart" | "archiveCart" | "approveCart", boolean>>;
