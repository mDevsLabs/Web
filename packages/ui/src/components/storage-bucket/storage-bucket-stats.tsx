// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { StorageBucket, StorageBucketStatus, StorageBucketActivity, StorageBucketMetric, StorageBucketSettingsValues } from './types.js';
export interface StorageBucketStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly StorageBucketMetric[];
}
export function StorageBucketStats(props: StorageBucketStatsProps) { return <DomainStats config={config} {...props}/>; }
