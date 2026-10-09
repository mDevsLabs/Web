// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { FeatureFlag, FeatureFlagStatus, FeatureFlagActivity, FeatureFlagMetric, FeatureFlagSettingsValues } from './types.js';
export interface FeatureFlagFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: FeatureFlagStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: FeatureFlagStatus | '') => void;
}
export function FeatureFlagFilters({ onStatusChange, ...props }: FeatureFlagFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as FeatureFlagStatus | '') : undefined}/>; }
