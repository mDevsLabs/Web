// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Organization, OrganizationStatus, OrganizationActivity, OrganizationMetric, OrganizationSettingsValues } from './types.js';
export interface OrganizationSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: OrganizationSettingsValues;
    onChange: (key: keyof OrganizationSettingsValues, value: boolean) => void;
}
export function OrganizationSettings({ onChange, ...props }: OrganizationSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof OrganizationSettingsValues, value)}/>; }
