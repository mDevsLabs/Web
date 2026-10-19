// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Lead, LeadStatus, LeadActivity, LeadMetric, LeadSettingsValues } from './types.js';
export interface LeadSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: LeadSettingsValues;
    onChange: (key: keyof LeadSettingsValues, value: boolean) => void;
}
export function LeadSettings({ onChange, ...props }: LeadSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof LeadSettingsValues, value)}/>; }
