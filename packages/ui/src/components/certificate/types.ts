import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Certificate = {
    id?: string;
    title: string;
    recipient: string;
    issuedOn: string;
    reference: string;
    status: "issued" | "revoked" | "expired";
};
export type CertificateStatus = Certificate['status'];
export interface CertificateActivity extends DomainActivity {
    certificateId?: string;
}
export type CertificateMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalCertificate' | 'activeCertificate' | 'valueCertificate';
};
export type CertificateSettingsValues = Partial<Record<"notifyCertificate" | "archiveCertificate" | "approveCertificate", boolean>>;
