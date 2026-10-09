import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Audience = {
    id?: string;
    name: string;
    segment: string;
    memberCount: number;
    growthPercent: number;
    status: "active" | "building" | "archived";
};
export type AudienceStatus = Audience['status'];
export interface AudienceActivity extends DomainActivity {
    audienceId?: string;
}
export type AudienceMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalAudience' | 'activeAudience' | 'valueAudience';
};
export type AudienceSettingsValues = Partial<Record<"notifyAudience" | "archiveAudience" | "approveAudience", boolean>>;
