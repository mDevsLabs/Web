// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Integration, IntegrationStatus, IntegrationActivity, IntegrationMetric, IntegrationSettingsValues } from './types.js';
export interface IntegrationSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: IntegrationSettingsValues;
    onChange: (key: keyof IntegrationSettingsValues, value: boolean) => void;
}
export function IntegrationSettings({ onChange, ...props }: IntegrationSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof IntegrationSettingsValues, value)}/>; }
