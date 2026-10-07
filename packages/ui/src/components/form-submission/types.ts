import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type FormSubmission = {
    id?: string;
    reference: string;
    formName: string;
    submittedBy: string;
    submittedAt: string;
    fieldCount: number;
    status: "received" | "reviewing" | "accepted" | "rejected";
};
export type FormSubmissionStatus = FormSubmission['status'];
export interface FormSubmissionActivity extends DomainActivity {
    formsubmissionId?: string;
}
export type FormSubmissionMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalFormSubmission' | 'activeFormSubmission' | 'valueFormSubmission';
};
export type FormSubmissionSettingsValues = Partial<Record<"notifyFormSubmission" | "archiveFormSubmission" | "approveFormSubmission", boolean>>;
