// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { FeatureFlag, FeatureFlagStatus, FeatureFlagActivity, FeatureFlagMetric, FeatureFlagSettingsValues } from './types.js';
export interface FeatureFlagListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly FeatureFlag[];
    onSelect?: (item: FeatureFlag) => void;
    emptyMessage?: string;
}
export function FeatureFlagList({ onSelect, ...props }: FeatureFlagListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as FeatureFlag) : undefined}/>; }
