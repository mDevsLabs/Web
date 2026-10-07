// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { StorageBucket, StorageBucketStatus, StorageBucketActivity, StorageBucketMetric, StorageBucketSettingsValues } from './types.js';
export interface StorageBucketCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: StorageBucket;
}
export function StorageBucketCard(props: StorageBucketCardProps) { return <DomainCard config={config} {...props}/>; }
