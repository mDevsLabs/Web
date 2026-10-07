import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Invoice = {
    id?: string;
    number: string;
    customer: string;
    amount: number;
    dueDate: string;
    status: "draft" | "sent" | "paid" | "overdue";
};
export type InvoiceStatus = Invoice['status'];
export interface InvoiceActivity extends DomainActivity {
    invoiceId?: string;
}
export type InvoiceMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalInvoice' | 'activeInvoice' | 'valueInvoice';
};
export type InvoiceSettingsValues = Partial<Record<"notifyInvoice" | "archiveInvoice" | "approveInvoice", boolean>>;
