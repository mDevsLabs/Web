// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Document, DocumentStatus, DocumentActivity, DocumentMetric, DocumentSettingsValues } from './types.js';
export interface DocumentSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: DocumentSettingsValues;
    onChange: (key: keyof DocumentSettingsValues, value: boolean) => void;
}
export function DocumentSettings({ onChange, ...props }: DocumentSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof DocumentSettingsValues, value)}/>; }
