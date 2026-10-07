// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { FeatureFlag, FeatureFlagStatus, FeatureFlagActivity, FeatureFlagMetric, FeatureFlagSettingsValues } from './types.js';
export interface FeatureFlagTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly FeatureFlag[];
    emptyMessage?: string;
}
export function FeatureFlagTable(props: FeatureFlagTableProps) { return <DomainTable config={config} {...props}/>; }
