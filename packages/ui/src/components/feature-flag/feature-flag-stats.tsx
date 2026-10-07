// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { FeatureFlag, FeatureFlagStatus, FeatureFlagActivity, FeatureFlagMetric, FeatureFlagSettingsValues } from './types.js';
export interface FeatureFlagStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly FeatureFlagMetric[];
}
export function FeatureFlagStats(props: FeatureFlagStatsProps) { return <DomainStats config={config} {...props}/>; }
