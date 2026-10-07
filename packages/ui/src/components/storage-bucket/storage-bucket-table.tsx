// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { StorageBucket, StorageBucketStatus, StorageBucketActivity, StorageBucketMetric, StorageBucketSettingsValues } from './types.js';
export interface StorageBucketTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly StorageBucket[];
    emptyMessage?: string;
}
export function StorageBucketTable(props: StorageBucketTableProps) { return <DomainTable config={config} {...props}/>; }
