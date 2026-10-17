import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Student = {
    id?: string;
    name: string;
    email: string;
    courseCount: number;
    joinedOn: string;
    status: "active" | "graduated" | "inactive";
};
export type StudentStatus = Student['status'];
export interface StudentActivity extends DomainActivity {
    studentId?: string;
}
export type StudentMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalStudent' | 'activeStudent' | 'valueStudent';
};
export type StudentSettingsValues = Partial<Record<"notifyStudent" | "archiveStudent" | "approveStudent", boolean>>;
