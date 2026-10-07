// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Customer, CustomerStatus, CustomerActivity, CustomerMetric, CustomerSettingsValues } from './types.js';
export interface CustomerSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: CustomerSettingsValues;
    onChange: (key: keyof CustomerSettingsValues, value: boolean) => void;
}
export function CustomerSettings({ onChange, ...props }: CustomerSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof CustomerSettingsValues, value)}/>; }
