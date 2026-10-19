import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Payroll = {
    id?: string;
    period: string;
    employee: string;
    grossAmount: number;
    netAmount: number;
    status: "draft" | "approved" | "paid";
};
export type PayrollStatus = Payroll['status'];
export interface PayrollActivity extends DomainActivity {
    payrollId?: string;
}
export type PayrollMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalPayroll' | 'activePayroll' | 'valuePayroll';
};
export type PayrollSettingsValues = Partial<Record<"notifyPayroll" | "archivePayroll" | "approvePayroll", boolean>>;
