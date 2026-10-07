// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { FeatureFlag, FeatureFlagStatus, FeatureFlagActivity, FeatureFlagMetric, FeatureFlagSettingsValues } from './types.js';
export interface FeatureFlagTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly FeatureFlagActivity[];
    emptyMessage?: string;
}
export function FeatureFlagTimeline(props: FeatureFlagTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
