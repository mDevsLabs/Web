// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Invoice, InvoiceStatus, InvoiceActivity, InvoiceMetric, InvoiceSettingsValues } from './types.js';
export interface InvoiceSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: InvoiceSettingsValues;
    onChange: (key: keyof InvoiceSettingsValues, value: boolean) => void;
}
export function InvoiceSettings({ onChange, ...props }: InvoiceSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof InvoiceSettingsValues, value)}/>; }
