import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Return = {
    id?: string;
    reference: string;
    orderReference: string;
    reason: string;
    refundAmount: number;
    status: "requested" | "approved" | "received" | "refunded";
};
export type ReturnStatus = Return['status'];
export interface ReturnActivity extends DomainActivity {
    returnId?: string;
}
export type ReturnMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalReturn' | 'activeReturn' | 'valueReturn';
};
export type ReturnSettingsValues = Partial<Record<"notifyReturn" | "archiveReturn" | "approveReturn", boolean>>;
