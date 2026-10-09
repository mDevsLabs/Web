// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { StorageBucket, StorageBucketStatus, StorageBucketActivity, StorageBucketMetric, StorageBucketSettingsValues } from './types.js';
export interface StorageBucketTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly StorageBucketActivity[];
    emptyMessage?: string;
}
export function StorageBucketTimeline(props: StorageBucketTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
