import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type FeatureFlag = {
    id?: string;
    name: string;
    key: string;
    rolloutPercent: number;
    owner: string;
    status: "enabled" | "disabled" | "testing";
};
export type FeatureFlagStatus = FeatureFlag['status'];
export interface FeatureFlagActivity extends DomainActivity {
    featureflagId?: string;
}
export type FeatureFlagMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalFeatureFlag' | 'activeFeatureFlag' | 'valueFeatureFlag';
};
export type FeatureFlagSettingsValues = Partial<Record<"notifyFeatureFlag" | "archiveFeatureFlag" | "approveFeatureFlag", boolean>>;
