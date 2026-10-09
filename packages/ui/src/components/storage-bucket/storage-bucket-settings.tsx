// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { StorageBucket, StorageBucketStatus, StorageBucketActivity, StorageBucketMetric, StorageBucketSettingsValues } from './types.js';
export interface StorageBucketSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: StorageBucketSettingsValues;
    onChange: (key: keyof StorageBucketSettingsValues, value: boolean) => void;
}
export function StorageBucketSettings({ onChange, ...props }: StorageBucketSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof StorageBucketSettingsValues, value)}/>; }
