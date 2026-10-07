import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type MedicalAppointment = {
    id?: string;
    title: string;
    practitioner: string;
    scheduledOn: string;
    location: string;
    status: "scheduled" | "confirmed" | "completed" | "cancelled";
};
export type MedicalAppointmentStatus = MedicalAppointment['status'];
export interface MedicalAppointmentActivity extends DomainActivity {
    medicalappointmentId?: string;
}
export type MedicalAppointmentMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalMedicalAppointment' | 'activeMedicalAppointment' | 'valueMedicalAppointment';
};
export type MedicalAppointmentSettingsValues = Partial<Record<"notifyMedicalAppointment" | "archiveMedicalAppointment" | "approveMedicalAppointment", boolean>>;
