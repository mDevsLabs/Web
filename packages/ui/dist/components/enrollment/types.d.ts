import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Enrollment = {
    id?: string;
    reference: string;
    student: string;
    course: string;
    progress: number;
    status: "active" | "completed" | "cancelled";
};
export type EnrollmentStatus = Enrollment['status'];
export interface EnrollmentActivity extends DomainActivity {
    enrollmentId?: string;
}
export type EnrollmentMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalEnrollment' | 'activeEnrollment' | 'valueEnrollment';
};
export type EnrollmentSettingsValues = Partial<Record<"notifyEnrollment" | "archiveEnrollment" | "approveEnrollment", boolean>>;
