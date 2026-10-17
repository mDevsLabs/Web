import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Lead = {
    id?: string;
    name: string;
    email: string;
    source: string;
    score: number;
    status: "new" | "qualified" | "contacted" | "converted";
};
export type LeadStatus = Lead['status'];
export interface LeadActivity extends DomainActivity {
    leadId?: string;
}
export type LeadMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalLead' | 'activeLead' | 'valueLead';
};
export type LeadSettingsValues = Partial<Record<"notifyLead" | "archiveLead" | "approveLead", boolean>>;
