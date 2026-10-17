import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Subscription = {
    id?: string;
    name: string;
    subscriber: string;
    monthlyPrice: number;
    renewsOn: string;
    status: "trial" | "active" | "paused" | "cancelled";
};
export type SubscriptionStatus = Subscription['status'];
export interface SubscriptionActivity extends DomainActivity {
    subscriptionId?: string;
}
export type SubscriptionMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalSubscription' | 'activeSubscription' | 'valueSubscription';
};
export type SubscriptionSettingsValues = Partial<Record<"notifySubscription" | "archiveSubscription" | "approveSubscription", boolean>>;
