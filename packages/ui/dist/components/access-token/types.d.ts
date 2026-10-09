import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type AccessToken = {
    id?: string;
    name: string;
    owner: string;
    scope: string;
    expiresOn: string;
    status: "active" | "expired" | "revoked";
};
export type AccessTokenStatus = AccessToken['status'];
export interface AccessTokenActivity extends DomainActivity {
    accesstokenId?: string;
}
export type AccessTokenMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalAccessToken' | 'activeAccessToken' | 'valueAccessToken';
};
export type AccessTokenSettingsValues = Partial<Record<"notifyAccessToken" | "archiveAccessToken" | "approveAccessToken", boolean>>;
