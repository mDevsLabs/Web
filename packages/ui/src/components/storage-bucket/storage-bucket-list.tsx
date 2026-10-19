// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { StorageBucket, StorageBucketStatus, StorageBucketActivity, StorageBucketMetric, StorageBucketSettingsValues } from './types.js';
export interface StorageBucketListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly StorageBucket[];
    onSelect?: (item: StorageBucket) => void;
    emptyMessage?: string;
}
export function StorageBucketList({ onSelect, ...props }: StorageBucketListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as StorageBucket) : undefined}/>; }
