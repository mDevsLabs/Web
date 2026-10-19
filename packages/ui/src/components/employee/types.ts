import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Employee = {
    id?: string;
    name: string;
    email: string;
    department: string;
    joinedOn: string;
    status: "active" | "on-leave" | "inactive";
};
export type EmployeeStatus = Employee['status'];
export interface EmployeeActivity extends DomainActivity {
    employeeId?: string;
}
export type EmployeeMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalEmployee' | 'activeEmployee' | 'valueEmployee';
};
export type EmployeeSettingsValues = Partial<Record<"notifyEmployee" | "archiveEmployee" | "approveEmployee", boolean>>;
