import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Incident = {
    id?: string;
    title: string;
    severity: string;
    startedOn: string;
    affectedUsers: number;
    status: "investigating" | "identified" | "monitoring" | "resolved";
};
export type IncidentStatus = Incident['status'];
export interface IncidentActivity extends DomainActivity {
    incidentId?: string;
}
export type IncidentMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalIncident' | 'activeIncident' | 'valueIncident';
};
export type IncidentSettingsValues = Partial<Record<"notifyIncident" | "archiveIncident" | "approveIncident", boolean>>;
