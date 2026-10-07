// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Collection, CollectionStatus, CollectionActivity, CollectionMetric, CollectionSettingsValues } from './types.js';
export interface CollectionSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: CollectionSettingsValues;
    onChange: (key: keyof CollectionSettingsValues, value: boolean) => void;
}
export function CollectionSettings({ onChange, ...props }: CollectionSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof CollectionSettingsValues, value)}/>; }
