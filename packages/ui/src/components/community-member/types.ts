import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type CommunityMember = {
    id?: string;
    name: string;
    handle: string;
    postCount: number;
    joinedOn: string;
    status: "active" | "moderator" | "suspended";
};
export type CommunityMemberStatus = CommunityMember['status'];
export interface CommunityMemberActivity extends DomainActivity {
    communitymemberId?: string;
}
export type CommunityMemberMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalCommunityMember' | 'activeCommunityMember' | 'valueCommunityMember';
};
export type CommunityMemberSettingsValues = Partial<Record<"notifyCommunityMember" | "archiveCommunityMember" | "approveCommunityMember", boolean>>;
