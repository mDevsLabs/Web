import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Expense = {
    id?: string;
    title: string;
    employee: string;
    amount: number;
    spentOn: string;
    status: "draft" | "submitted" | "approved" | "reimbursed";
};
export type ExpenseStatus = Expense['status'];
export interface ExpenseActivity extends DomainActivity {
    expenseId?: string;
}
export type ExpenseMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalExpense' | 'activeExpense' | 'valueExpense';
};
export type ExpenseSettingsValues = Partial<Record<"notifyExpense" | "archiveExpense" | "approveExpense", boolean>>;
