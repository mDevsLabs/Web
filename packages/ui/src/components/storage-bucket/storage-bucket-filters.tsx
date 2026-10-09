// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { StorageBucket, StorageBucketStatus, StorageBucketActivity, StorageBucketMetric, StorageBucketSettingsValues } from './types.js';
export interface StorageBucketFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: StorageBucketStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: StorageBucketStatus | '') => void;
}
export function StorageBucketFilters({ onStatusChange, ...props }: StorageBucketFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as StorageBucketStatus | '') : undefined}/>; }
