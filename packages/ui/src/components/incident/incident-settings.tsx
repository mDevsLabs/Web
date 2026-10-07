// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Incident, IncidentStatus, IncidentActivity, IncidentMetric, IncidentSettingsValues } from './types.js';
export interface IncidentSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: IncidentSettingsValues;
    onChange: (key: keyof IncidentSettingsValues, value: boolean) => void;
}
export function IncidentSettings({ onChange, ...props }: IncidentSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof IncidentSettingsValues, value)}/>; }
