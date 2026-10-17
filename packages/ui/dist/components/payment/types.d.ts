import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Payment = {
    id?: string;
    reference: string;
    payer: string;
    amount: number;
    paidOn: string;
    status: "pending" | "completed" | "failed" | "refunded";
};
export type PaymentStatus = Payment['status'];
export interface PaymentActivity extends DomainActivity {
    paymentId?: string;
}
export type PaymentMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalPayment' | 'activePayment' | 'valuePayment';
};
export type PaymentSettingsValues = Partial<Record<"notifyPayment" | "archivePayment" | "approvePayment", boolean>>;
