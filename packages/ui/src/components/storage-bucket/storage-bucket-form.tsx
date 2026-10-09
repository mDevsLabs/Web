// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { StorageBucket, StorageBucketStatus, StorageBucketActivity, StorageBucketMetric, StorageBucketSettingsValues } from './types.js';
export interface StorageBucketFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<StorageBucket>;
    onSubmit: (value: Omit<StorageBucket, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function StorageBucketForm({ onSubmit, ...props }: StorageBucketFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<StorageBucket, 'id'>)}/>; }
