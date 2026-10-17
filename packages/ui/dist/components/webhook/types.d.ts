import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Webhook = {
    id?: string;
    name: string;
    url: string;
    deliveryCount: number;
    failureCount: number;
    status: "active" | "paused" | "failing";
};
export type WebhookStatus = Webhook['status'];
export interface WebhookActivity extends DomainActivity {
    webhookId?: string;
}
export type WebhookMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalWebhook' | 'activeWebhook' | 'valueWebhook';
};
export type WebhookSettingsValues = Partial<Record<"notifyWebhook" | "archiveWebhook" | "approveWebhook", boolean>>;
