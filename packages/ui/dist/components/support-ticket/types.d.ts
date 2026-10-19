import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type SupportTicket = {
    id?: string;
    subject: string;
    customer: string;
    priority: string;
    createdOn: string;
    status: "open" | "in-progress" | "resolved" | "closed";
};
export type SupportTicketStatus = SupportTicket['status'];
export interface SupportTicketActivity extends DomainActivity {
    supportticketId?: string;
}
export type SupportTicketMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalSupportTicket' | 'activeSupportTicket' | 'valueSupportTicket';
};
export type SupportTicketSettingsValues = Partial<Record<"notifySupportTicket" | "archiveSupportTicket" | "approveSupportTicket", boolean>>;
