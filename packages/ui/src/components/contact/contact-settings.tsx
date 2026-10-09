// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Contact, ContactStatus, ContactActivity, ContactMetric, ContactSettingsValues } from './types.js';
export interface ContactSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: ContactSettingsValues;
    onChange: (key: keyof ContactSettingsValues, value: boolean) => void;
}
export function ContactSettings({ onChange, ...props }: ContactSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof ContactSettingsValues, value)}/>; }
