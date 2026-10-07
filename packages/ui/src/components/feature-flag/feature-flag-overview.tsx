// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { FeatureFlag, FeatureFlagStatus, FeatureFlagActivity, FeatureFlagMetric, FeatureFlagSettingsValues } from './types.js';
export interface FeatureFlagOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly FeatureFlag[];
    metrics: readonly FeatureFlagMetric[];
}
export function FeatureFlagOverview(props: FeatureFlagOverviewProps) { return <DomainOverview config={config} {...props}/>; }
