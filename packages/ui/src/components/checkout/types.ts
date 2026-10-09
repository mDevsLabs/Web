import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Checkout = {
    id?: string;
    reference: string;
    email: string;
    total: number;
    country: string;
    status: "started" | "processing" | "complete";
};
export type CheckoutStatus = Checkout['status'];
export interface CheckoutActivity extends DomainActivity {
    checkoutId?: string;
}
export type CheckoutMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalCheckout' | 'activeCheckout' | 'valueCheckout';
};
export type CheckoutSettingsValues = Partial<Record<"notifyCheckout" | "archiveCheckout" | "approveCheckout", boolean>>;
