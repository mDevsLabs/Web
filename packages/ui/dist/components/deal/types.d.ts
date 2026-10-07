import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Deal = {
    id?: string;
    name: string;
    company: string;
    amount: number;
    closesOn: string;
    status: "discovery" | "proposal" | "won" | "lost";
};
export type DealStatus = Deal['status'];
export interface DealActivity extends DomainActivity {
    dealId?: string;
}
export type DealMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalDeal' | 'activeDeal' | 'valueDeal';
};
export type DealSettingsValues = Partial<Record<"notifyDeal" | "archiveDeal" | "approveDeal", boolean>>;
