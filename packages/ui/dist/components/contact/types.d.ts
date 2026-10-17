import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Contact = {
    id?: string;
    name: string;
    email: string;
    company: string;
    phone: string;
    status: "active" | "inactive" | "archived";
};
export type ContactStatus = Contact['status'];
export interface ContactActivity extends DomainActivity {
    contactId?: string;
}
export type ContactMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalContact' | 'activeContact' | 'valueContact';
};
export type ContactSettingsValues = Partial<Record<"notifyContact" | "archiveContact" | "approveContact", boolean>>;
