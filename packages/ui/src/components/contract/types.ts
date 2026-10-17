import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Contract = {
    id?: string;
    title: string;
    counterparty: string;
    amount: number;
    endsOn: string;
    status: "draft" | "review" | "signed" | "expired";
};
export type ContractStatus = Contract['status'];
export interface ContractActivity extends DomainActivity {
    contractId?: string;
}
export type ContractMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalContract' | 'activeContract' | 'valueContract';
};
export type ContractSettingsValues = Partial<Record<"notifyContract" | "archiveContract" | "approveContract", boolean>>;
