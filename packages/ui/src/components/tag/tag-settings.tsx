// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Tag, TagStatus, TagActivity, TagMetric, TagSettingsValues } from './types.js';
export interface TagSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: TagSettingsValues;
    onChange: (key: keyof TagSettingsValues, value: boolean) => void;
}
export function TagSettings({ onChange, ...props }: TagSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof TagSettingsValues, value)}/>; }
