import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Budget = {
    id?: string;
    name: string;
    owner: string;
    allocated: number;
    spent: number;
    status: "draft" | "active" | "closed";
};
export type BudgetStatus = Budget['status'];
export interface BudgetActivity extends DomainActivity {
    budgetId?: string;
}
export type BudgetMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalBudget' | 'activeBudget' | 'valueBudget';
};
export type BudgetSettingsValues = Partial<Record<"notifyBudget" | "archiveBudget" | "approveBudget", boolean>>;
