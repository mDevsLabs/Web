import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Campaign = {
    id?: string;
    name: string;
    channel: string;
    budget: number;
    startsOn: string;
    status: "draft" | "active" | "paused" | "completed";
};
export type CampaignStatus = Campaign['status'];
export interface CampaignActivity extends DomainActivity {
    campaignId?: string;
}
export type CampaignMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalCampaign' | 'activeCampaign' | 'valueCampaign';
};
export type CampaignSettingsValues = Partial<Record<"notifyCampaign" | "archiveCampaign" | "approveCampaign", boolean>>;
