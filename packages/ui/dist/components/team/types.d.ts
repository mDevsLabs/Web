import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Team = {
    id?: string;
    name: string;
    lead: string;
    memberCount: number;
    department: string;
    status: "active" | "forming" | "archived";
};
export type TeamStatus = Team['status'];
export interface TeamActivity extends DomainActivity {
    teamId?: string;
}
export type TeamMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalTeam' | 'activeTeam' | 'valueTeam';
};
export type TeamSettingsValues = Partial<Record<"notifyTeam" | "archiveTeam" | "approveTeam", boolean>>;
