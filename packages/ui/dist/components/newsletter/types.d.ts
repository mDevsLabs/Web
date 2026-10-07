import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Newsletter = {
    id?: string;
    subject: string;
    sender: string;
    recipientCount: number;
    sendOn: string;
    status: "draft" | "scheduled" | "sent";
};
export type NewsletterStatus = Newsletter['status'];
export interface NewsletterActivity extends DomainActivity {
    newsletterId?: string;
}
export type NewsletterMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalNewsletter' | 'activeNewsletter' | 'valueNewsletter';
};
export type NewsletterSettingsValues = Partial<Record<"notifyNewsletter" | "archiveNewsletter" | "approveNewsletter", boolean>>;
