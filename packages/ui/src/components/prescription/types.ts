import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Prescription = {
    id?: string;
    reference: string;
    prescriber: string;
    issuedOn: string;
    validUntil: string;
    status: "active" | "expired" | "archived";
};
export type PrescriptionStatus = Prescription['status'];
export interface PrescriptionActivity extends DomainActivity {
    prescriptionId?: string;
}
export type PrescriptionMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalPrescription' | 'activePrescription' | 'valuePrescription';
};
export type PrescriptionSettingsValues = Partial<Record<"notifyPrescription" | "archivePrescription" | "approvePrescription", boolean>>;
