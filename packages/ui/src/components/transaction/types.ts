import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Transaction = {
    id?: string;
    reference: string;
    description: string;
    amount: number;
    postedOn: string;
    status: "pending" | "posted" | "reversed";
};
export type TransactionStatus = Transaction['status'];
export interface TransactionActivity extends DomainActivity {
    transactionId?: string;
}
export type TransactionMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalTransaction' | 'activeTransaction' | 'valueTransaction';
};
export type TransactionSettingsValues = Partial<Record<"notifyTransaction" | "archiveTransaction" | "approveTransaction", boolean>>;
