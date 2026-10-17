import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type BankAccount = {
    id?: string;
    name: string;
    bank: string;
    balance: number;
    currency: string;
    status: "active" | "frozen" | "closed";
};
export type BankAccountStatus = BankAccount['status'];
export interface BankAccountActivity extends DomainActivity {
    bankaccountId?: string;
}
export type BankAccountMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalBankAccount' | 'activeBankAccount' | 'valueBankAccount';
};
export type BankAccountSettingsValues = Partial<Record<"notifyBankAccount" | "archiveBankAccount" | "approveBankAccount", boolean>>;
